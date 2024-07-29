import { z } from 'zod';

export enum JenisKelamin {
  MALE = 'M',
  FEMALE = 'F',
}

export enum EmpActiveStatus {
  ACTIVE = 'Active',
  TERMINATED = 'Terminated',
}

export enum MaritalStatus {
  SINGLE = 'Single',
  MARRIED = 'Married',
  DIVORCED = 'Divorced',
  WIDOWED = 'Widowed',
}

export const EmployeeDTO = z.object({
  no_rm: z.string().nullable(),
  employee_id: z.string(),
  nama_pasien: z.string(),
  sebutan: z.string(),
  jenis_kelamin: z.nativeEnum(JenisKelamin),
  tempat_lahir: z.string().nullable(),
  tanggal_lahir: z.string(),
  alamat: z.string(),
  no_telp: z.string().nullable(),
  no_hp: z.string().nullable(),
  darah: z.string(),
  email: z.string().email(),
  bpjs_asuransi: z.string().nullable(),
  nik: z.string(),
  nama_perusahaan_asuransi: z.string().nullable(),
  emp_active_status: z.nativeEnum(EmpActiveStatus),
  terminate_date: z.string().nullable(),
  marital_status: z.nativeEnum(MaritalStatus),
  nationality: z.string(),
  emp_type: z.string(),
  roster_code: z.string(),
  pos_no: z.string(),
  pos_title: z.string(),
  cost_center: z.string().nullable(),
  job_level_code: z.string(),
  job_level: z.string().nullable(),
  seg: z.string().nullable(),
  seg_description: z.string().nullable(),
  mcu_matrix: z.string().nullable(),
  medical_entitlement: z.string().nullable(),
  sponsor_id: z.string().nullable(),
  sponsor_name: z.string().nullable(),
  supervisor_id: z.string().nullable(),
  supervisor_name: z.string().nullable(),
  supv_cost_center: z.string().nullable(),
  company: z.string(),
  contract_number: z.string().nullable(),
  vendor_id: z.string().nullable(),
  vendor: z.string().nullable(),
  department: z.string(),
  section: z.string(),
  last_update_date: z.date(),
});

export type EmployeeType = z.infer<typeof EmployeeDTO>;
