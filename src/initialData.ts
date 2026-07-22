import { Employee, LeaveRequest, PayrollRecord, JobPosting, Applicant, PerformanceEvaluation, CashFlowTransaction, PartnerCheque, DailyAttendance, DayOffSwap, PartnerBilling, PartnerCompany, SystemSettings, AuditLogEntry, SalesRecord, TransportWaybill } from './types';

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

export const INITIAL_TRANSPORT_WAYBILLS: TransportWaybill[] = [
  {
    id: "tw-001",
    waybillNumber: "WB-2026-001",
    carrierName: "Kerry Express",
    partnerName: "บริษัท สยามโฮมเทค จำกัด",
    deliveryDate: "2026-07-20",
    bookNumber: "012",
    receiptNumber: "045",
    quantity: 150,
    unitPrice: 100,
    totalPrice: 15000,
    whtDocNumber: "WHT-6901-001",
    whtRate: 1,
    whtAmount: 150,
    status: "pending_receipt",
    trackingNumber: "KEX982301923TH",
    notes: "จัดส่งสินค้าล็อตใหญ่ สาขาบางนา - รอใบเสร็จรับเงินฉบับจริงจากขนส่ง"
  },
  {
    id: "tw-002",
    waybillNumber: "WB-2026-002",
    carrierName: "Flash Express",
    partnerName: "บริษัท มหาชัยอุตสาหกรรม จำกัด",
    deliveryDate: "2026-07-18",
    bookNumber: "005",
    receiptNumber: "112",
    quantity: 80,
    unitPrice: 120,
    totalPrice: 9600,
    whtDocNumber: "WHT-6901-002",
    whtRate: 1,
    whtAmount: 96,
    status: "receipt_received",
    trackingNumber: "TH0192837465A",
    notes: "ได้รับใบเสร็จรับเงิน/ใบกำกับภาษีเรียบร้อยแล้ว"
  },
  {
    id: "tw-003",
    waybillNumber: "WB-2026-003",
    carrierName: "J&T Express",
    partnerName: "ร้านทองนพเก้า กรุ๊ป",
    deliveryDate: "2026-07-21",
    bookNumber: "008",
    receiptNumber: "089",
    quantity: 200,
    unitPrice: 90,
    totalPrice: 18000,
    whtDocNumber: "WHT-6901-003",
    whtRate: 1,
    whtAmount: 180,
    status: "pending_receipt",
    trackingNumber: "JNT77889922TH",
    notes: "รอส่งมอบใบเสร็จจากพนักงานจัดส่ง"
  }
];

