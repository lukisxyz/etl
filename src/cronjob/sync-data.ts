import { SyncMSSQLToPostgres } from '../services/sync-pasien-cron';

export const syncData = async () => {
  try {
    const tenantKeys = ['cloud_hospital'];
    for (const tenantKey of tenantKeys) {
      await SyncMSSQLToPostgres(tenantKey);
      console.log(`Data synchronization completed for tenant: ${tenantKey}`);
    }
  } catch (error) {
    console.error('Error occurred during data synchronization:', error);
  }
};
