const { User, Facility, FacilityReport, TriageSession, HealthCredit } = require('../models');

const getDashboard = async () => {
  const [
    totalUsers,
    totalFacilities,
    openFacilities,
    pendingReports,
    totalTriageSessions,
    totalCreditsIssued,
  ] = await Promise.all([
    User.count(),
    Facility.count(),
    Facility.count({ where: { isOpen: true } }),
    FacilityReport.count({ where: { status: 'pending' } }),
    TriageSession.count(),
    HealthCredit.sum('amount', { where: { amount: { [require('sequelize').Op.gt]: 0 } } }),
  ]);

  const usersByRole = await User.findAll({
    attributes: ['role', [require('sequelize').fn('COUNT', 'id'), 'count']],
    group: ['role'],
    raw: true,
  });

  const facilitiesByType = await Facility.findAll({
    attributes: ['type', [require('sequelize').fn('COUNT', 'id'), 'count']],
    group: ['type'],
    raw: true,
  });

  const recentReports = await FacilityReport.findAll({
    limit: 5,
    order: [['createdAt', 'DESC']],
    include: [
      { model: Facility, as: 'facility', attributes: ['name'] },
      { model: User, as: 'reporter', attributes: ['firstName', 'lastName'] },
    ],
  });

  return {
    totals: {
      users: totalUsers,
      facilities: totalFacilities,
      openFacilities,
      pendingReports,
      triageSessions: totalTriageSessions,
      creditsIssued: totalCreditsIssued || 0,
    },
    usersByRole,
    facilitiesByType,
    recentReports,
  };
};

module.exports = { getDashboard };
