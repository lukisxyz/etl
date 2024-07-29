import { Pool, type PoolConfig } from 'pg';

export const getPgSqlDbConn = (tenantId: string): PoolConfig => ({
  user: process.env.PGSQL_USER || '',
  host: process.env.PGSQL_HOST || '',
  database: tenantId,
  password: process.env.PGSQL_PASSWORD || '',
  port: Number(process.env.PGSQL_PORT) || 5432,
});

export const getPgSqlConnectionPool = (cfg: PoolConfig): Pool => {
  return new Pool(cfg);
};
