import { Employee, LeaveRequest, PayrollRecord, JobPosting, Applicant, PerformanceEvaluation, CashFlowTransaction, PartnerCheque, DailyAttendance, DayOffSwap, PartnerBilling, PartnerCompany, SystemSettings, AuditLogEntry, SalesRecord } from './types';

export const INITIAL_EMPLOYEES: Employee[] = [];

export const INITIAL_LEAVES: LeaveRequest[] = [];

export const INITIAL_PAYROLL: PayrollRecord[] = [];

export const INITIAL_JOBS: JobPosting[] = [];

export const INITIAL_APPLICANTS: Applicant[] = [];

export const INITIAL_EVALUATIONS: PerformanceEvaluation[] = [];

export const INITIAL_CASH_FLOW: CashFlowTransaction[] = [];

export const INITIAL_CHEQUES: PartnerCheque[] = [];

export const INITIAL_ATTENDANCE: { [employeeId: string]: { [date: string]: DailyAttendance } } = {};

export const INITIAL_DAY_OFF_SWAPS: DayOffSwap[] = [];

export const INITIAL_PARTNER_COMPANIES: PartnerCompany[] = [];

export const INITIAL_PARTNER_BILLINGS: PartnerBilling[] = [];

export const INITIAL_SYSTEM_SETTINGS: SystemSettings = {
  companyName: "บริษัท ของคุณ (ข้อมูลจริง)",
  companyAddress: "",
  companyPhone: "",
  companyTaxId: "",
  companyEmail: "",
  workingHoursStart: "08:30",
  workingHoursEnd: "17:30",
  otRateMultiplier: 1.5,
  socialSecurityRate: 5,
  socialSecurityMaxCap: 750,
  withholdingTaxRate: 3,
  lineNotifyToken: "",
  lineNotifyEnabled: false,
  carriers: ['Kerry Express', 'Flash Express', 'J&T Express', 'ไปรษณีย์ไทย (EMS)', 'รถขนส่งบริษัท', 'ขนส่งเอกชนทั่วไป'],
  admins: [
    {
      id: "watjan",
      name: "คุณ วรรณจันทร์ (watjan)",
      role: "Super Admin (ผู้ควบคุมระบบสูงสุด)",
      password: "AA12199124",
      permissions: {
        employees: true,
        attendance: true,
        leaves: true,
        payroll: true,
        sales: true,
        cashflow: true,
        cheques: true,
        partner_billing: true,
        recruitment: true,
        performance: true,
        settings: true,
        backup_restore: true,
        database_inspector: true
      }
    }
  ]
};

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];

export const INITIAL_SALES_RECORDS: SalesRecord[] = [];
