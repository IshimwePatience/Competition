/**
 * Copy all CareLink data from local PostgreSQL to Supabase.
 *
 * Requires in .env:
 *   LOCAL_DB_*  — source (defaults: localhost / carelink)
 *   DB_*        — target Supabase pooler (with DB_SSL=true)
 *
 * Run: npm run db:migrate-supabase
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Sequelize, QueryTypes } = require('sequelize');

const sslConfig = { require: true, rejectUnauthorized: false };

const localConfig = {
  dialect: 'postgres',
  host: process.env.LOCAL_DB_HOST || 'localhost',
  port: parseInt(process.env.LOCAL_DB_PORT, 10) || 5432,
  database: process.env.LOCAL_DB_NAME || 'carelink',
  username: process.env.LOCAL_DB_USER || 'postgres',
  password: process.env.LOCAL_DB_PASSWORD || 'postgres',
  logging: false,
};

const TABLES = [
  'users',
  'facilities',
  'triage_sessions',
  'facility_reports',
  'health_credits',
  'notifications',
  'public_usage_logs',
];

const JSONB_COLUMNS = new Set([
  'medicineStock',
  'services',
  'aiRawResponse',
  'details',
]);

const local = new Sequelize(
  localConfig.database,
  localConfig.username,
  localConfig.password,
  localConfig
);

const formatValue = (col, value) => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (JSONB_COLUMNS.has(col) || (typeof value === 'object' && !Buffer.isBuffer(value))) {
    return JSON.stringify(value);
  }
  return value;
};

const insertRows = async (remote, table, rows) => {
  if (!rows.length) return 0;

  let inserted = 0;
  const cols = Object.keys(rows[0]);
  const colList = cols.map((c) => `"${c}"`).join(', ');

  for (const row of rows) {
    const values = cols.map((c) => formatValue(c, row[c]));
    const placeholders = cols
      .map((c, i) => (JSONB_COLUMNS.has(c) ? `$${i + 1}::jsonb` : `$${i + 1}`))
      .join(', ');

    await remote.query(
      `INSERT INTO "${table}" (${colList}) VALUES (${placeholders})`,
      { bind: values }
    );
    inserted += 1;
  }

  return inserted;
};

const migrate = async () => {
  if (process.env.DB_PASSWORD === 'YOUR_SUPABASE_DB_PASSWORD') {
    throw new Error('Replace YOUR_SUPABASE_DB_PASSWORD in .env with your real Supabase database password.');
  }

  console.log('Connecting to local database...');
  await local.authenticate();
  console.log(`  Local: ${localConfig.host}/${localConfig.database}`);

  const { sequelize: remote } = require('../models');
  console.log('Connecting to Supabase...');
  await remote.authenticate();
  console.log(`  Remote: ${process.env.DB_HOST}/${process.env.DB_NAME}`);

  console.log('Syncing schema on Supabase...');
  await remote.sync({ alter: true });

  console.log('Clearing Supabase tables...');
  await remote.query(
    `TRUNCATE TABLE ${TABLES.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`
  );

  const summary = {};

  for (const table of TABLES) {
    const rows = await local.query(`SELECT * FROM "${table}"`, { type: QueryTypes.SELECT });
    const count = await insertRows(remote, table, rows);
    summary[table] = count;
    console.log(`  ${table}: ${count} row(s)`);
  }

  console.log('\nMigration complete.');
  console.log(summary);

  await local.close();
  await remote.close();
};

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  if (err.parent?.detail) console.error(err.parent.detail);
  process.exit(1);
});
