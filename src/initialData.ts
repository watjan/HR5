import { Employee, LeaveRequest, PayrollRecord, JobPosting, Applicant, PerformanceEvaluation, CashFlowTransaction, PartnerCheque, DailyAttendance, DayOffSwap, PartnerBilling, PartnerCompany, SystemSettings, AuditLogEntry, SalesRecord, TransportWaybill, PermitLicense, OfficialExpense } from './types';

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
        official_expenses: true,
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

export const INITIAL_OFFICIAL_EXPENSES: OfficialExpense[] = [
  {
    id: "EXP-SSO-2026-01",
    docNumber: "SSO-2026-01",
    title: "เงินสมทบประกันสังคม ประจำเดือนมกราคม 2026 (สปส. 1-10)",
    category: "social_security",
    subCategory: "เงินสมทบผู้ประกันตน ม.33 (5% + 5%)",
    taxPeriod: "2026-01",
    dueDate: "2026-02-15",
    paymentDate: "2026-02-10",
    amount: 24500,
    fineOrSurcharge: 0,
    totalPaid: 24500,
    paymentMethod: "e-Payment (ธนาคารกสิกรไทย)",
    status: "paid",
    recipientAgency: "สำนักงานประกันสังคม",
    responsiblePerson: "แผนกบัญชีและการเงิน",
    receiptNumber: "REC-SSO-98214",
    notes: "นำส่งเงินสมทบนายจ้างและพนักงานรวม 28 คนผ่านระบบ e-Services"
  },
  {
    id: "EXP-TAX-2026-01",
    docNumber: "TAX-WHT1-2026-01",
    title: "ภาษีเงินได้หัก ณ ที่จ่าย พนักงานประจำ (ภ.ง.ด. 1) ประจำเดือนมกราคม 2026",
    category: "revenue_tax",
    subCategory: "ภ.ง.ด. 1 (ภาษีเงินได้บุคคลธรรมดา)",
    taxPeriod: "2026-01",
    dueDate: "2026-02-07",
    paymentDate: "2026-02-05",
    amount: 12800,
    fineOrSurcharge: 0,
    totalPaid: 12800,
    paymentMethod: "RD e-Payment",
    status: "paid",
    recipientAgency: "กรมสรรพากร",
    responsiblePerson: "แผนกบัญชีและการเงิน",
    receiptNumber: "RD-202602-00421",
    notes: "ยื่นผ่านระบบ e-Filing กรมสรรพากร"
  },
  {
    id: "EXP-TAX-2026-02",
    docNumber: "TAX-VAT30-2026-01",
    title: "ภาษีมูลค่าเพิ่ม (ภ.พ. 30) ประจำเดือนมกราคม 2026",
    category: "revenue_tax",
    subCategory: "ภ.พ. 30 (VAT 7%)",
    taxPeriod: "2026-01",
    dueDate: "2026-02-23",
    paymentDate: "2026-02-18",
    amount: 45200,
    fineOrSurcharge: 0,
    totalPaid: 45200,
    paymentMethod: "RD e-Payment",
    status: "paid",
    recipientAgency: "กรมสรรพากร",
    responsiblePerson: "สำนักงานบัญชีรับช่วง",
    receiptNumber: "RD-VAT-202602-110",
    notes: "ภาษีขายหักภาษีซื้อสุทธิยื่นชำระผ่านระบบอินเทอร์เน็ต"
  },
  {
    id: "EXP-ACC-2026-01",
    docNumber: "INV-ACC-2026-01",
    title: "ค่าบริการทำบัญชีและยื่นภาษีประจำเดือนมกราคม 2026",
    category: "accounting",
    subCategory: "ค่าบริการทำบัญชีรายเดือน",
    taxPeriod: "2026-01",
    dueDate: "2026-02-05",
    paymentDate: "2026-02-03",
    amount: 8500,
    fineOrSurcharge: 0,
    totalPaid: 8500,
    paymentMethod: "โอนเงินผ่านธนาคาร",
    status: "paid",
    recipientAgency: "บริษัท สำนักงานบัญชีและกฎหมาย จำกัด",
    responsiblePerson: "ฝ่ายการเงิน",
    receiptNumber: "REC-ACC-2026-012",
    notes: "รวมค่าทำบัญชี ปิดงบรายเดือน และจัดทำภ.ง.ด.3, 53"
  },
  {
    id: "EXP-OTH-2026-01",
    docNumber: "FEES-BANK-2026-01",
    title: "ค่าธรรมเนียมโอนเงินเงินเดือนและค่าบริการซอฟต์แวร์ระบบ HR",
    category: "other",
    subCategory: "ค่าธรรมเนียมธนาคาร & ซอฟต์แวร์",
    taxPeriod: "2026-01",
    dueDate: "2026-02-01",
    paymentDate: "2026-02-01",
    amount: 3200,
    fineOrSurcharge: 0,
    totalPaid: 3200,
    paymentMethod: "หักผ่านบัญชีอัตโนมัติ",
    status: "paid",
    recipientAgency: "ธนาคาร / ผู้ให้บริการซอฟต์แวร์",
    responsiblePerson: "ฝ่ายไอทีและระบบ",
    receiptNumber: "INV-SOFT-2026-001",
    notes: "ค่าบริการ Payroll Batch Transfer และ Cloud Server รายเดือน"
  }
];


