import { Employee, LeaveRequest, PayrollRecord, JobPosting, Applicant, PerformanceEvaluation, CashFlowTransaction, PartnerCheque, DailyAttendance, DayOffSwap, PartnerBilling, PartnerCompany, SystemSettings, AuditLogEntry, SalesRecord, TransportWaybill, PermitLicense } from './types';

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
        transport_waybills: true,
        permits: true,
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

export const INITIAL_TRANSPORT_WAYBILLS: TransportWaybill[] = [];

export const INITIAL_PERMITS: PermitLicense[] = [
  {
    id: "PERMIT-001",
    permitNumber: "LIC-SIGN-2025-001",
    title: "ใบอนุญาตป้ายโฆษณาหน้าร้านค้าและอาคาร",
    category: "ใบอนุญาตป้าย",
    requestDate: "2025-01-10",
    issueDate: "2025-01-25",
    startDate: "2025-02-01",
    expiryDate: "2026-01-31",
    issuingAgency: "สำนักงานเขต / ฝ่ายรายได้ อบต.พื้นที่",
    feeAmount: 2500,
    status: "active",
    responsiblePerson: "ฝ่ายบริหารอาคารและสถานที่",
    contactPhone: "02-123-4567",
    notes: "ชำระภาษีป้ายและใบอนุญาตติดตั้งป้ายประจำปีเรียบร้อยแล้ว"
  },
  {
    id: "PERMIT-002",
    permitNumber: "LIC-PLANT-2025-089",
    title: "ใบอนุญาตรวบรวมและจำหน่ายเมล็ดพันธุ์พืช/พันธุ์ผัก",
    category: "ใบอนุญาตพันธุ์พืช/พันธุ์ผัก",
    requestDate: "2025-03-01",
    issueDate: "2025-03-15",
    startDate: "2025-03-15",
    expiryDate: "2026-03-14",
    issuingAgency: "กรมวิชาการเกษตร กระทรวงเกษตรและสหกรณ์",
    feeAmount: 1500,
    status: "active",
    responsiblePerson: "ผู้จัดการแผนกสินค้าเกษตร",
    contactPhone: "02-579-0151",
    notes: "ใบอนุญาตรวบรวมเมล็ดพันธุ์ควบคุมเพื่อการค้าและจำหน่ายพันธุ์ผัก"
  },
  {
    id: "PERMIT-003",
    permitNumber: "LIC-HEALTH-2024-042",
    title: "ใบอนุญาตประกอบกิจการที่เป็นอันตรายต่อสุขภาพ",
    category: "ใบอนุญาตสุขาภิบาลและสิ่งแวดล้อม",
    requestDate: "2024-11-01",
    issueDate: "2024-12-01",
    startDate: "2024-12-01",
    expiryDate: "2025-11-30",
    issuingAgency: "ฝ่ายสิ่งแวดล้อมและสุขาภิบาล สำนักงานเขต",
    feeAmount: 3000,
    status: "near_expiry",
    responsiblePerson: "เจ้าหน้าที่ฝ่ายความปลอดภัย (จป.)",
    contactPhone: "02-987-6543",
    notes: "เตรียมยื่นเอกสารขอต่ออายุล่วงหน้า 30 วันก่อนหมดอายุ"
  }
];

