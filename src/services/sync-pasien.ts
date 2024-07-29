import { getPgSqlConnectionPool, getPgSqlDbConn } from '../db/pgsql';
import type { EmployeeType } from './model';

const SyncPatientService = async (
  data: EmployeeType,
  tenantId: string,
): Promise<number> => {
  const poolConfig = getPgSqlDbConn(tenantId as string);
  const pool = getPgSqlConnectionPool(poolConfig);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if the record exists
    const checkQuery =
      'SELECT pasien_id FROM public.m_pasien WHERE pasien_nik = $1';
    const checkResult = await client.query(checkQuery, [data.nik]);

    if (checkResult.rows.length > 0) {
      const updateQuery = `
        UPDATE public.m_pasien SET
          pasien_norm = $1,
          pasien_sebut = $2,
          pasien_nama = $3,
          pasien_kelamin = $4,
          pasien_alamat = $5,
          pasien_notelp = $6,
          pasien_nohp = $7,
          pasien_goldarah = $8,
          pasien_aktif = $9,
          pasien_updated_by = $10,
          pasien_updated_date = $11,
          pasien_tanggallahir = $12,
          pasien_email = $13,
          pasien_pekerjaan = $14,
          pasien_statusnikah = $15
        WHERE pasien_nik = $16
        RETURNING pasien_id
      `;

      const updateValues = [
        data.no_rm || null,
        data.sebutan || null,
        data.nama_pasien || null,
        data.jenis_kelamin || null,
        data.alamat || null,
        data.no_telp || null,
        data.no_hp || null,
        data.darah || null,
        data.emp_active_status === 'Active' ? 'y' : 'n',
        'admin', // assuming updated_by
        new Date(), // assuming updated_date is current date
        data.tanggal_lahir || null,
        data.email || null,
        data.emp_type || null,
        data.marital_status || null,
        data.nik, // This is used to identify which record to update
      ];

      const res = await client.query(updateQuery, updateValues);
      await client.query('COMMIT');
      return res.rows[0].pasien_id;
    }
    // Record does not exist, so insert it
    const insertQuery = `
        INSERT INTO public.m_pasien (
          pasien_norm,
          pasien_nik,
          pasien_sebut,
          pasien_nama,
          pasien_kelamin,
          pasien_alamat,
          pasien_notelp,
          pasien_nohp,
          pasien_goldarah,
          pasien_aktif,
          pasien_created_by,
          pasien_created_date,
          pasien_updated_by,
          pasien_updated_date,
          pasien_tanggallahir,
          pasien_email,
          pasien_pekerjaan,
          pasien_statusnikah
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        ) RETURNING pasien_id
      `;

    const insertValues = [
      data.no_rm || null,
      data.nik || null,
      data.sebutan || null,
      data.nama_pasien || null,
      data.jenis_kelamin || null,
      data.alamat || null,
      data.no_telp || null,
      data.no_hp || null,
      data.darah || null,
      data.emp_active_status === 'Active' ? 'y' : 'n',
      'admin', // assuming created_by
      new Date(), // assuming created_date is current date
      'admin', // assuming updated_by
      new Date(), // assuming updated_date is current date
      data.tanggal_lahir || null,
      data.email || null,
      data.emp_type || null,
      data.marital_status || null,
    ];

    const res = await client.query(insertQuery, insertValues);
    await client.query('COMMIT');
    return res.rows[0].pasien_id;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export { SyncPatientService };
