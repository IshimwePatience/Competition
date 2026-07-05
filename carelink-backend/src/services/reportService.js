const config = require('../config');
const { FacilityReport, Facility, User, HealthCredit, Notification } = require('../models');
const AppError = require('../utils/AppError');

const submitReport = async (userId, facilityId, reportData) => {
  const facility = await Facility.findByPk(facilityId);
  if (!facility) throw new AppError('Facility not found', 404);

  const user = await User.findByPk(userId);
  const isHealthWorker = user.role === 'health_worker' && user.isVerified;

  const report = await FacilityReport.create({
    facilityId,
    userId,
    isOpen: reportData.isOpen,
    waitTimeMinutes: reportData.waitTimeMinutes,
    crowdLevel: reportData.crowdLevel,
    medicineStock: reportData.medicineStock,
    notes: reportData.notes,
    status: isHealthWorker ? 'verified' : 'pending',
    verifiedById: isHealthWorker ? userId : null,
  });

  if (isHealthWorker) {
    await applyReportToFacility(facility, report);
    const credits = config.credits.reportVerified + config.credits.healthWorkerBonus;
    await awardCredits(userId, credits, 'report', `Verified report for ${facility.name}`, report.id);
    report.creditsAwarded = credits;
    await report.save();
  } else {
    const credits = config.credits.reportPending;
    await awardCredits(userId, credits, 'report', `Report submitted for ${facility.name}`, report.id);
    report.creditsAwarded = credits;
    await report.save();
  }

  const { emitToUser, emitToRole } = require('./socketService');
  emitToUser(userId, 'report:submitted', { reportId: report.id, facilityId, status: report.status });
  emitToRole('admin', 'report:pending', { reportId: report.id, facilityName: facility.name });
  emitToRole('health_worker', 'report:pending', { reportId: report.id, facilityName: facility.name });
  emitToUser(userId, 'facility:updated', { facilityId, name: facility.name });

  return report;
};

const applyReportToFacility = async (facility, report) => {
  if (report.isOpen !== null && report.isOpen !== undefined) facility.isOpen = report.isOpen;
  if (report.waitTimeMinutes !== null) facility.waitTimeMinutes = report.waitTimeMinutes;
  if (report.crowdLevel) facility.crowdLevel = report.crowdLevel;
  if (report.medicineStock) facility.medicineStock = report.medicineStock;
  facility.lastUpdatedAt = new Date();
  await facility.save();
};

const verifyReport = async (reportId, verifierId) => {
  const report = await FacilityReport.findByPk(reportId, {
    include: [{ model: Facility, as: 'facility' }],
  });
  if (!report) throw new AppError('Report not found', 404);
  if (report.status === 'verified') throw new AppError('Report already verified', 400);

  report.status = 'verified';
  report.verifiedById = verifierId;
  await report.save();

  await applyReportToFacility(report.facility, report);

  const bonusCredits = config.credits.reportVerified - config.credits.reportPending;
  if (bonusCredits > 0) {
    await awardCredits(
      report.userId,
      bonusCredits,
      'bonus',
      `Report verified for ${report.facility.name}`,
      report.id
    );
    report.creditsAwarded += bonusCredits;
    await report.save();
  }

  await Notification.create({
    userId: report.userId,
    title: 'Report Verified',
    message: `Your report for ${report.facility.name} was verified. Bonus credits awarded!`,
    type: 'credit',
  });

  const { emitToUser } = require('./socketService');
  emitToUser(report.userId, 'report:verified', { reportId: report.id, facilityName: report.facility.name });
  emitToUser(report.userId, 'credit:earned', { amount: bonusCredits, reason: 'Report verified' });

  return report;
};

const rejectReport = async (reportId, verifierId) => {
  const report = await FacilityReport.findByPk(reportId);
  if (!report) throw new AppError('Report not found', 404);

  report.status = 'rejected';
  report.verifiedById = verifierId;
  await report.save();
  return report;
};

const getReports = async ({ status, facilityId, page = 1, limit = 20 }) => {
  const where = {};
  if (status) where.status = status;
  if (facilityId) where.facilityId = facilityId;

  const offset = (page - 1) * limit;
  const { rows, count } = await FacilityReport.findAndCountAll({
    where,
    include: [
      { model: Facility, as: 'facility', attributes: ['id', 'name', 'type'] },
      { model: User, as: 'reporter', attributes: ['id', 'firstName', 'lastName', 'role'] },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return { reports: rows, total: count, page, limit };
};

const awardCredits = async (userId, amount, type, description, referenceId) => {
  const user = await User.findByPk(userId);
  user.healthCredits += amount;
  await user.save();

  await HealthCredit.create({
    userId,
    amount,
    type,
    description,
    referenceId,
  });
};

module.exports = {
  submitReport,
  verifyReport,
  rejectReport,
  getReports,
  awardCredits,
};
