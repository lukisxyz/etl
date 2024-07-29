import mssql from 'mssql';
import { get, getMsSqlDbConn } from '../db/mssql';
import type { EmployeeType } from './model';

export type SearchPatientType = {
  name?: string;
  nik: string;
  next: number;
  limit: number;
};

const SearchPatientService = async (
  payload: SearchPatientType,
  ammanDbName: string,
): Promise<{ total: number; data: Array<EmployeeType> }> => {
  const { name, nik } = payload;

  let query = `
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
    WHERE`;
  let countQuery = 'SELECT COUNT(*) AS total FROM [dbo].[m_employee] WHERE';
  const params = [];
  const countParams = [];

  if (name) {
    query += ' LOWER(NamaPasien) LIKE @name';
    countQuery += ' LOWER(NamaPasien) LIKE @name';
    params.push({
      name: 'name',
      type: mssql.NVarChar,
      value: `%${name.toLowerCase()}%`,
    });
    countParams.push({
      name: 'name',
      type: mssql.NVarChar,
      value: `%${name.toLowerCase()}%`,
    });
  }

  if (nik) {
    if (params.length > 0) {
      query += ' OR';
      countQuery += ' OR';
    }
    query += ' NIK LIKE @nik';
    countQuery += ' NIK LIKE @nik';
    params.push({
      name: 'nik',
      type: mssql.NVarChar,
      value: `%${nik}%`,
    });
    countParams.push({
      name: 'nik',
      type: mssql.NVarChar,
      value: `%${nik}%`,
    });
  }
  query += " AND EmpActiveStatus = 'Active'";
  countQuery += " AND EmpActiveStatus = 'Active'";

  const cfg = getMsSqlDbConn(ammanDbName as string);
  const pool = await get(ammanDbName, cfg);
  const request = pool.request();
  for (const param of params) {
    request.input(param.name, param.type, param.value);
  }
  const result = await request.query(query);

  const countRequest = pool.request();
  for (const param of countParams) {
    countRequest.input(param.name, param.type, param.value);
  }
  const countResult = await countRequest.query(countQuery);

  return {
    total: countResult.recordset[0].total,
    data: result.recordset,
  };
};
export { SearchPatientService };
