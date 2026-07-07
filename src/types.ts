export interface Employee {
  id: string;
  name: string;
  avatar: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  salary: number;
  salaryType?: 'monthly' | 'daily';
  joinDate: string;
  status: 'active' | 'inactive' | 'on-leave';
  leaveBalance: {
    sick: number;
    personal: number;
    annual: number;
  };
  bankAccount: string;
  workDays?: number;
  links?: { label: string; url: string }[];
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'sick' | 'personal' | 'annual' | 'other';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  tax: number;
  socialSecurity: number;
  status: 'pending' | 'paid';
  period?: '1-15' | '16-31' | string;
  voucherNo?: string;
}

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  location: string;
  status: 'open' | 'closed';
  description: string;
  requirements: string[];
  applicantsCount: number;
}

export interface Applicant {
  id: string;
  jobId: string;
  jobTitle: string;
  name: string;
  email: string;
  stage: 'applied' | 'interviewing' | 'offered' | 'rejected';
  rating: number; // 1 to 5
  appliedDate: string;
  skills: string[];
}

export interface PerformanceEvaluation {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  evaluatorName: string;
  period: string;
  score: number; // 1 to 5
  strengths: string;
  improvements: string;
  goals: string;
  comments: string;
  date: string;
  status: 'draft' | 'completed';
}

export interface CashFlowTransaction {
  id: string;
  type: 'income' | 'expense'; // 'income' = ขารับ, 'expense' = ขาจ่าย
  category: string;
  amount: number;
  date: string;
  description: string;
  status: 'completed' | 'pending';
}

export interface PartnerCheque {
  id: string;
  type: 'payable' | 'receivable'; // payable = เช็คจ่ายคู่ค้า, receivable = เช็ครับคู่ค้า
  chequeNumber: string; // หมายเลขเช็ค
  bank: string; // ธนาคาร
  partnerName: string; // ชื่อคู่ค้า
  amount: number; // จำนวนเงิน
  dueDate: string; // วันที่ครบกำหนด (ถึงกำหนดจ่าย/รับ)
  issueDate: string; // วันที่ลงบันทึก/ออกเช็ค
  status: 'pending' | 'cleared' | 'bounced' | 'cancelled'; // สถานะเช็ค
  notes?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'late' | 'holiday' | 'swap_off';

export interface DailyAttendance {
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  lateMinutes?: number;
  notes?: string;
  clockIn?: string; // e.g. "08:15"
  clockOut?: string; // e.g. "17:30"
}

export interface EmployeeAttendance {
  employeeId: string;
  records: { [date: string]: DailyAttendance }; // Keyed by YYYY-MM-DD
}

export interface DayOffSwap {
  id: string;
  employeeId: string;
  employeeName: string;
  originalOffDate: string; // YYYY-MM-DD (e.g. Saturday)
  swappedOffDate: string;  // YYYY-MM-DD (the new day-off)
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  appliedDate: string; // YYYY-MM-DD
}

export interface PartnerCompany {
  id: string;
  name: string; // ชื่อบริษัทคู่ค้า
  taxId?: string; // เลขผู้เสียภาษี
  address?: string; // ที่อยู่
  contactPerson?: string; // ผู้ติดต่อหลัก
  phone?: string; // เบอร์โทรศัพท์
  email?: string; // อีเมล
  notes?: string; // หมายเหตุเพิ่มเติม
}

export interface PartnerBilling {
  id: string;
  partnerName: string; // ชื่อคู่ค้า
  docType: 'delivery' | 'billing' | 'invoice_receipt' | 'partner_doc' | string; // ใบส่งของ | ใบวางบิล | ใบเสร็จ/ใบกำกับภาษี | เอกสารคู่ค้า | หรือประเภทอื่นๆ
  docNumber: string; // เลขที่เอกสาร (หลัก/อ้างอิง)
  deliveryDocNumber?: string; // เลขที่ใบส่งของ (แยกต่างหาก)
  billingDocNumber?: string; // เลขที่ใบวางบิล (แยกต่างหาก)
  cnDocNumber?: string; // เลขที่ใบลดหนี้ (CN)
  cnAmount?: number; // จำนวนเงินใบลดหนี้ (CN Amount)
  bookNumber?: string; // เล่มที่
  pageNumber?: string; // เลขที่ในเล่ม
  transportCarrier?: string; // ขนส่ง/บริษัทขนส่ง
  amount: number; // จำนวนเงิน (บาท)
  issueDate: string; // วันที่ออกเอกสาร (YYYY-MM-DD)
  dueDate: string; // วันที่นัดจ่าย/กำหนดชำระ (YYYY-MM-DD)
  status: 'pending' | 'billed' | 'paid' | 'cancelled'; // รอวางบิล/รอดำเนินการ | วางบิลแล้ว/รอจ่าย | ชำระเงินแล้ว | ยกเลิก
  notes?: string; // หมายเหตุ
  contactPerson?: string; // ผู้ติดต่อคู่ค้า
  phone?: string; // เบอร์โทรศัพท์
}

export interface SystemSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyTaxId: string;
  companyEmail: string;
  workingHoursStart: string; // e.g. "08:30"
  workingHoursEnd: string; // e.g. "17:30"
  otRateMultiplier: number; // e.g. 1.5
  socialSecurityRate: number; // e.g. 5
  socialSecurityMaxCap: number; // e.g. 750
  withholdingTaxRate: number; // e.g. 3
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO DateTime
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYSTEM';
  module: string; // เช่น "พนักงาน", "ใบวางบิล", "เช็ค", "ตั้งค่าระบบ", "ลงเวลาทำงาน"
  description: string; // คำอธิบายภาษาไทย
  user: string; // ผู้ทำรายการ
}

export interface SalesRecord {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number; // ยอดขายรวม (บาท)
  notes?: string; // หมายเหตุ
  paymentChannel?: 'cash' | 'transfer' | 'credit_card' | 'qr' | string; // ช่องทางรับเงิน
  customerName?: string; // ชื่อลูกค้า
  receiptNumber?: string; // เลขที่ใบเสร็จ
}






