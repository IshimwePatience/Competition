require('dotenv').config();

const sslConfig = {
  require: true,
  rejectUnauthorized: false,
};

const useSsl = () =>
  process.env.DB_SSL === 'true'
  || (process.env.DB_HOST || '').includes('supabase.com')
  || (process.env.DATABASE_URL || '').includes('supabase.com');

const poolConfig = {
  max: 5,
  idle: 10000,
  acquire: 30000,
};

const buildConfig = (overrides = {}) => {
  const ssl = useSsl();
  const base = {
    dialect: 'postgres',
    logging: false,
    dialectOptions: ssl ? { ssl: sslConfig } : {},
    pool: poolConfig,
    ...overrides,
  };

  if (process.env.DATABASE_URL) {
    return {
      url: process.env.DATABASE_URL,
      ...base,
    };
  }

  return {
    username: overrides.username ?? process.env.DB_USER ?? 'postgres',
    password: overrides.password ?? process.env.DB_PASSWORD ?? 'postgres',
    database: overrides.database ?? process.env.DB_NAME ?? 'carelink',
    host: overrides.host ?? process.env.DB_HOST ?? 'localhost',
    port: parseInt(overrides.port ?? process.env.DB_PORT, 10) || 5432,
    ...base,
  };
};

module.exports = {
  development: buildConfig(),
  test: buildConfig({
    database: `${process.env.DB_NAME || 'carelink'}_test`,
  }),
  production: buildConfig(),
};
