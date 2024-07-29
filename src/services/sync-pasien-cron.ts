import mssql from 'mssql';
import { get, getMsSqlDbConn } from '../db/mssql';
import { getPgSqlConnectionPool, getPgSqlDbConn } from '../db/pgsql';
import { EmpActiveStatus, JenisKelamin, type EmployeeType } from './model';
import { MappingTenant } from '../config/mapping-tenant';
import { parseDate } from '../utils/date-helper';
import { formatBloodType } from '../utils/blood-type';

const now = new Date();

const SyncMSSQLToPostgres = async (tenantKey: string): Promise<void> => {
  const msSqlDbName = MappingTenant[tenantKey];
  const pgSqlDbName = tenantKey;

  // MSSQL connection
  const msSqlConfig = getMsSqlDbConn(msSqlDbName);
  const msSqlPool = await get(msSqlDbName, msSqlConfig);
  const msSqlRequest = msSqlPool.request();

  // PostgreSQL connection
  const pgSqlConfig = getPgSqlDbConn(pgSqlDbName);
  const pgPool = getPgSqlConnectionPool(pgSqlConfig);
  const pgClient = await pgPool.connect();

  try {
    const query = `
      SELECT
        [NoRM] AS no_rm,
        [EmployeeId] AS employee_id,
        [NamaPasien] AS nama_pasien,
        [Sebutan] AS sebutan,
        [Kelamin] AS jenis_kelamin,
        [TempatLahir] AS tempat_lahir,
        [TanggalLahir] AS tanggal_lahir,
        [Alamat] AS alamat,
        [NoTelp] AS no_telp,
        [NoHP] AS no_hp,
        [Darah] AS darah,
        [email] AS email,
        [BPJSAsuransi] AS bpjs_asuransi,
        [NIK] AS nik,
        [NamaPerusahaanAsuransi] AS nama_perusahaan_asuransi,
        [EmpActiveStatus] AS emp_active_status,
        [TerminateDate] AS terminate_date,
        [MaritalStatus] AS marital_status,
        [Nationality] AS nationality,
        [EmpType] AS emp_type,
        [RosterCode] AS roster_code,
        [PosNo] AS pos_no,
        [PosTitle] AS pos_title,
        [CostCenter] AS cost_center,
        [JobLevelCode] AS job_level_code,
        [JobLevel] AS job_level,
        [SEG] AS seg,
        [SEGDescription] AS seg_description,
        [MCUMatrix] AS mcu_matrix,
        [MedicalEntitlement] AS medical_entitlement,
        [SponsorID] AS sponsor_id,
        [SponsorName] AS sponsor_name,
        [SupervisorID] AS supervisor_id,
        [SupervisorName] AS supervisor_name,
        [SupvCostCenter] AS supv_cost_center,
        [Company] AS company,
        [ContractNumber] AS contract_number,
        [VendorId] AS vendor_id,
        [Vendor] AS vendor,
        [department] AS department,
        [Section] AS section,
        [LastUpdateDate] AS last_update_date
      FROM [dbo].[m_employee]
      WHERE LastUpdateDate > @now
    `;
    msSqlRequest.input('now', mssql.DateTime, now);
    const result = await msSqlRequest.query(query);

    const records: Array<EmployeeType> = result.recordset;

    for (const record of records) {
      const employee = {
        no_rm: record.no_rm,
        nik: record.nik,
        sebutan: record.sebutan,
        nama_pasien: record.nama_pasien,
        jenis_kelamin: record.jenis_kelamin,
        alamat: record.alamat,
        no_telp: record.no_telp,
        no_hp: record.no_hp,
        darah: record.darah,
        emp_active_status: record.emp_active_status,
        email: record.email,
        tanggal_lahir: record.tanggal_lahir,
        emp_type: record.emp_type,
        marital_status: record.marital_status,
        employee_id: record.employee_id || '',
        tempat_lahir: record.tempat_lahir || null,
        bpjs_asuransi: record.bpjs_asuransi || null,
        nama_perusahaan_asuransi: record.nama_perusahaan_asuransi || null,
        terminate_date: record.terminate_date,
        nationality: record.nationality || '',
        roster_code: record.roster_code || '',
        pos_no: record.pos_no || '',
        pos_title: record.pos_title || '',
        cost_center: record.cost_center || null,
        job_level_code: record.job_level_code || '',
        job_level: record.job_level || null,
        seg: record.seg || null,
        seg_description: record.seg_description || null,
        mcu_matrix: record.mcu_matrix || null,
        medical_entitlement: record.medical_entitlement || null,
        sponsor_id: record.sponsor_id || null,
        sponsor_name: record.sponsor_name || null,
        supervisor_id: record.supervisor_id || null,
        supervisor_name: record.supervisor_name || null,
        supv_cost_center: record.supv_cost_center || null,
        company: record.company || '',
        contract_number: record.contract_number || null,
        vendor_id: record.vendor_id || null,
        vendor: record.vendor || null,
        department: record.department || '',
        section: record.section || '',
        last_update_date: record.last_update_date,
      };

      const checkQuery =
        'SELECT pasien_id FROM public.m_pasien WHERE pasien_nik = $1';
      const checkResult = await pgClient.query(checkQuery, [employee.nik]);

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
        `;

        const updateValues = [
          employee.no_rm,
          employee.sebutan,
          employee.nama_pasien,
          employee.jenis_kelamin === JenisKelamin.MALE ? 'L' : 'P',
          employee.alamat,
          employee.no_telp,
          employee.no_hp,
          formatBloodType(employee.darah),
          employee.emp_active_status === EmpActiveStatus.ACTIVE ? 'y' : 'n',
          'admin',
          new Date(),
          parseDate(employee.tanggal_lahir),
          employee.email,
          employee.emp_type,
          employee.marital_status,
          employee.nik,
        ];

        await pgClient.query(updateQuery, updateValues);
      } else {
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
          )
        `;

        const insertValues = [
          employee.no_rm,
          employee.nik,
          employee.sebutan,
          employee.nama_pasien,
          employee.jenis_kelamin === JenisKelamin.MALE ? 'L' : 'P',
          employee.alamat,
          employee.no_telp,
          employee.no_hp,
          formatBloodType(employee.darah),
          employee.emp_active_status === EmpActiveStatus.ACTIVE ? 'y' : 'n',
          'admin',
          new Date(),
          'admin',
          new Date(),
          parseDate(employee.tanggal_lahir),
          employee.email,
          employee.emp_type,
          employee.marital_status,
        ];

        await pgClient.query(insertQuery, insertValues);
      }
    }
  } catch (error) {
    console.error('Error syncing data:', error);
  } finally {
    pgClient.release();
  }
};

export { SyncMSSQLToPostgres };
