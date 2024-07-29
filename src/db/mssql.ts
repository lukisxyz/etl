// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import mssql from 'mssql';
import type { config } from 'mssql';

const pools = new Map();

const getMsSqlDbConn = (tenantId: string): config => {
  const dbConfig = {
    user: process.env.MSSQL_USER || '',
    password: process.env.MSSQL_PASSWORD || ' ',
    server: process.env.MSSQL_SERVER || '',
    port: Number(process.env.MSSQL_PORT) || 1433,
    database: tenantId,

    // just for testing local
    options: {
      encrypt: true, // Use encryption
      trustServerCertificate: true, // Trust self-signed certificate
    },
  };
  return dbConfig;
};

/**
 * Get or create a pool. If a pool doesn't exist the config must be provided.
 * If the pool does exist the config is ignored (even if it was different to the one provided
 * when creating the pool)
 *
 * @param {string} name
 * @param {{}} [config]
 * @return {Promise.<mssql.ConnectionPool>}
 */
const get = async (
  name: string,
  config: config,
): Promise<mssql.ConnectionPool> => {
  if (!pools.has(name)) {
    if (!config) {
      throw new Error('Pool does not exist');
    }
    const pool = new mssql.ConnectionPool(config);
    // automatically remove the pool from the cache if `pool.close()` is called
    const close = pool.close.bind(pool);
    pool.close = async (...args) => {
      pools.delete(name);
      return close(...args);
    };
    pools.set(name, pool.connect());
  }
  return pools.get(name);
};

/**
 * Closes all the pools and removes them from the store
 *
 * @return {Promise<mssql.ConnectionPool[]>}
 */
const closeAll = async (): Promise<mssql.ConnectionPool[]> => {
  const closePromises = Array.from(pools.values()).map(async (connect) => {
    const pool = await connect;
    return pool.close();
  });
  return Promise.all(closePromises);
};

export { get, closeAll, getMsSqlDbConn };
