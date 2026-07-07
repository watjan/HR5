import React, { useState, useEffect } from 'react';
import { PayrollRecord, Employee } from '../types';
import { 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Printer, 
  X, 
  AlertTriangle, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  Calendar, 
  Hash, 
  Coins,
  Calculator
} from 'lucide-react';
import { convertToThaiBahtText } from '../lib/thaiBaht';

interface PayrollManagementProps {
  payroll: PayrollRecord[];
  employees: Employee[];
  onPaySalary: (id: string) => void;
  onPayAllPending: () => void;
  onUpdatePayroll?: (updated: PayrollRecord) => void;
  onDeletePayroll?: (id: string) => void;
  onAddPayroll?: (newPay: PayrollRecord) => void;
  onAddBatchPayroll?: (newRecords: PayrollRecord[]) => void;
}

export default function PayrollManagement({
  payroll,
  employees,
  onPaySalary,
  onPayAllPending,
  onUpdatePayroll,
  onDeletePayroll,
  onAddPayroll,
  onAddBatchPayroll
}: PayrollManagementProps) {
  // Modal states
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [modalViewType, setModalViewType] = useState<'payslip' | 'voucher'>('payslip');
  
  const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];

  const getMonthCode = (m: string) => {
    const idx = THAI_MONTHS.indexOf(m);
    if (idx === -1) return '06';
    return String(idx + 1).padStart(2, '0');
  };

  const generateVoucherNo = (year: number, month: string, period: string, employeeId: string) => {
    const mNum = getMonthCode(month);
    let dayStr = '15';
    if (period !== '1-15') {
      const monthIdx = THAI_MONTHS.indexOf(month);
      if (monthIdx !== -1) {
        const lastDay = new Date(year, monthIdx + 1, 0).getDate();
        dayStr = String(lastDay).padStart(2, '0');
      } else {
        dayStr = '30';
      }
    }
    const datePart = `${year}${mNum}${dayStr}`;
    const cleanEmpId = employeeId.replace(/^EMP-/i, '').trim();
    const suffix = period === '1-15' ? `115${cleanEmpId}` : `21631${cleanEmpId}`;
    return `PV-${datePart}-${suffix}`;
  };

  // Filters
  const [monthFilter, setMonthFilter] = useState('มิถุนายน');
  const [yearFilter, setYearFilter] = useState<number>(2026);
  const [periodFilter, setPeriodFilter] = useState<string>('all'); // 'all', '1-15', '16-31'

  // Form states for Add / Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Auto calculate batch state
  const [calcModalOpen, setCalcModalOpen] = useState(false);
  const [calcSummary, setCalcSummary] = useState<{
    newRecords: PayrollRecord[];
    existingCount: number;
    totalAmount: number;
  }>({ newRecords: [], existingCount: 0, totalAmount: 0 });
  
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formMonth, setFormMonth] = useState('มิถุนายน');
  const [formYear, setFormYear] = useState(2026);
  const [formPeriod, setFormPeriod] = useState<string>('1-15'); // default '1-15' or '16-31'
  const [formBaseSalary, setFormBaseSalary] = useState<number>(0);
  const [formAllowances, setFormAllowances] = useState<number>(0);
  const [formDeductions, setFormDeductions] = useState<number>(0);
  const [formTax, setFormTax] = useState<number>(0);
  const [formSocialSecurity, setFormSocialSecurity] = useState<number>(0);
  const [formVoucherNo, setFormVoucherNo] = useState('');
  const [formStatus, setFormStatus] = useState<'pending' | 'paid'>('pending');

  // Delete confirmation
  const [recordToDelete, setRecordToDelete] = useState<PayrollRecord | null>(null);

  // Toast notifications state
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [successToastTitle, setSuccessToastTitle] = useState<string>('บันทึกข้อมูลสำเร็จ');
  
  const showSuccess = (message: string, title = 'บันทึกข้อมูลสำเร็จ') => {
    setSuccessToastTitle(title);
    setSuccessToast(message);
    // Auto clear after 4 seconds
    const timer = setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  };

  // Auto-update Voucher No in "Add" mode when inputs change
  useEffect(() => {
    if (formMode === 'add' && formEmployeeId) {
      setFormVoucherNo(generateVoucherNo(formYear, formMonth, formPeriod, formEmployeeId));
    }
  }, [formEmployeeId, formMonth, formYear, formPeriod, formMode]);

  // Auto calculate values on salary change
  const handleEmployeeChange = (empId: string) => {
    setFormEmployeeId(empId);
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      const salary = emp.salary;
      const isDaily = emp.salaryType === 'daily';
      const calculatedBase = isDaily ? salary * 15 : salary; // Default 15 days for daily paid staff in a payroll cycle
      
      setFormBaseSalary(calculatedBase);
      setFormAllowances(isDaily ? 500 : 1500); // Default allowance
      const pfund = Math.round(calculatedBase * 0.03); // Provident fund
      setFormDeductions(pfund);
      const taxAmount = Math.round(calculatedBase * 0.02); // Tax
      setFormTax(taxAmount);
      const sso = Math.min(750, Math.round(calculatedBase * 0.05)); // SSO
      setFormSocialSecurity(sso);
      
      // Auto-generate voucher number
      setFormVoucherNo(generateVoucherNo(yearFilter, monthFilter, formPeriod, empId));
    }
  };

  const handleOpenCalcModal = () => {
    if (monthFilter === 'all') {
      showSuccess('กรุณาเลือกเดือนเจาะจงที่หัวตารางเพื่อทำการประมวลผลคำนวณเงินเดือนอัตโนมัติ', 'ระบุเดือนก่อนดำเนินการ');
      return;
    }
    const activeEmployees = employees.filter(e => e.status !== 'inactive');
    const newRecords: PayrollRecord[] = [];
    let existingCount = 0;
    let totalAmount = 0;

    activeEmployees.forEach(emp => {
      // Check if employee already has a record in this month and period
      const hasRecord = payroll.some(p => 
        p.employeeId === emp.id && 
        p.month === monthFilter && 
        (periodFilter === 'all' || p.period === periodFilter)
      );

      if (hasRecord) {
        existingCount++;
        return;
      }

      const isDaily = emp.salaryType === 'daily';
      
      // Determine base salary based on period and type
      let base = emp.salary;
      if (isDaily) {
        if (periodFilter === 'all') {
          base = emp.salary * 30; // standard month 30 days
        } else {
          base = emp.salary * 15; // half month
        }
      } else {
        // Monthly
        if (periodFilter !== 'all') {
          base = Math.round(emp.salary / 2); // split half month
        }
      }

      // Determine allowance
      let allowance = isDaily ? 500 : 1500;
      if (periodFilter !== 'all') {
        allowance = Math.round(allowance / 2);
      }

      const pfund = Math.round(base * 0.03); // provident fund
      const taxAmount = Math.round(base * 0.02); // 2% tax
      const sso = Math.min(750, Math.round(base * 0.05)); // 5% sso (max 750)
      const net = base + allowance - pfund - taxAmount - sso;

      const mCode = getMonthCode(monthFilter);
      const randomId = Math.floor(Math.random() * 9000 + 1000);
      const randSuffix = Math.floor(Math.random() * 900 + 100);

      newRecords.push({
        id: `PAY-${Date.now()}-${randomId}`,
        employeeId: emp.id,
        employeeName: emp.name,
        month: monthFilter,
        year: yearFilter,
        baseSalary: base,
        allowances: allowance,
        deductions: pfund,
        netSalary: Math.max(0, net),
        tax: taxAmount,
        socialSecurity: sso,
        status: 'pending',
        period: periodFilter === 'all' ? '1-15' : periodFilter,
        voucherNo: generateVoucherNo(yearFilter, monthFilter, periodFilter === 'all' ? '1-15' : periodFilter, emp.id)
      });

      totalAmount += Math.max(0, net);
    });

    setCalcSummary({
      newRecords,
      existingCount,
      totalAmount
    });
    setCalcModalOpen(true);
  };

  const handleSaveBatch = () => {
    if (calcSummary.newRecords.length > 0) {
      if (onAddBatchPayroll) {
        onAddBatchPayroll(calcSummary.newRecords);
      } else {
        calcSummary.newRecords.forEach(rec => onAddPayroll?.(rec));
      }
      showSuccess(
        `ระบบได้ประมวลผลคำนวณเงินเดือนอัตโนมัติสำหรับพนักงานจำนวน ${calcSummary.newRecords.length} คนของรอบเดือน ${monthFilter} ${yearFilter} เรียบร้อยแล้ว`,
        'คำนวณเงินเดือนสำเร็จ'
      );
    }
    setCalcModalOpen(false);
  };

  const handleOpenAddForm = () => {
    setFormMode('add');
    setEditingId(null);
    if (employees.length > 0) {
      handleEmployeeChange(employees[0].id);
    } else {
      setFormEmployeeId('');
      setFormBaseSalary(0);
      setFormAllowances(0);
      setFormDeductions(0);
      setFormTax(0);
      setFormSocialSecurity(0);
      setFormVoucherNo('');
    }
    setFormMonth(monthFilter);
    setFormYear(yearFilter);
    setFormPeriod('1-15');
    setFormStatus('pending');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (record: PayrollRecord) => {
    setFormMode('edit');
    setEditingId(record.id);
    setFormEmployeeId(record.employeeId);
    setFormMonth(record.month);
    setFormYear(record.year);
    setFormPeriod(record.period || '1-15');
    setFormBaseSalary(record.baseSalary);
    setFormAllowances(record.allowances);
    setFormDeductions(record.deductions);
    setFormTax(record.tax);
    setFormSocialSecurity(record.socialSecurity);
    setFormVoucherNo(record.voucherNo || generateVoucherNo(record.year, record.month, record.period || '1-15', record.employeeId));
    setFormStatus(record.status);
    setIsFormOpen(true);
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === formEmployeeId);
    if (!emp) return;

    const netSalary = formBaseSalary + formAllowances - formDeductions - formTax - formSocialSecurity;

    const recordData: PayrollRecord = {
      id: formMode === 'edit' && editingId ? editingId : `PAY-${Date.now()}`,
      employeeId: formEmployeeId,
      employeeName: emp.name,
      month: formMonth,
      year: formYear,
      baseSalary: formBaseSalary,
      allowances: formAllowances,
      deductions: formDeductions,
      netSalary: Math.max(0, netSalary),
      tax: formTax,
      socialSecurity: formSocialSecurity,
      status: formStatus,
      period: formPeriod,
      voucherNo: formVoucherNo || generateVoucherNo(formYear, formMonth, formPeriod, formEmployeeId)
    };

    if (formMode === 'add') {
      onAddPayroll?.(recordData);
      showSuccess(
        `บันทึกประวัติการจ่ายเงินเดือนของ ${emp.name} เรียบร้อยแล้ว (รอบประจำเดือน ${formMonth} ${formYear})`,
        'บันทึกสำเร็จ'
      );
    } else {
      onUpdatePayroll?.(recordData);
      showSuccess(
        `แก้ไขและบันทึกข้อมูลการจ่ายเงินเดือนของ ${emp.name} เรียบร้อยแล้ว (รอบประจำเดือน ${formMonth} ${formYear})`,
        'แก้ไขข้อมูลสำเร็จ'
      );
    }

    // Auto update filters to the saved record to display it as current
    setMonthFilter(formMonth);
    setYearFilter(formYear);
    if (formPeriod !== 'all') {
      setPeriodFilter(formPeriod);
    }

    setIsFormOpen(false);
  };

  const handleDeleteClick = (record: PayrollRecord) => {
    setRecordToDelete(record);
  };

  const handleConfirmDelete = () => {
    if (recordToDelete) {
      onDeletePayroll?.(recordToDelete.id);
      showSuccess(
        `ลบรายการจ่ายเงินเดือนของ ${recordToDelete.employeeName} สำเร็จแล้ว`,
        'ลบข้อมูลสำเร็จ'
      );
      setRecordToDelete(null);
    }
  };

  const handlePaySalary = (id: string) => {
    onPaySalary(id);
    const rec = payroll.find(p => p.id === id);
    if (rec) {
      showSuccess(`อนุมัติสั่งจ่ายเงินเดือนของ ${rec.employeeName} เรียบร้อยแล้ว`, 'อนุมัติสำเร็จ');
    }
  };

  const handlePayAllPending = () => {
    onPayAllPending();
    showSuccess('อนุมัติสั่งจ่ายเงินเดือนค้างจ่ายทั้งหมดเรียบร้อยแล้ว', 'อนุมัติทั้งหมดสำเร็จ');
  };

  // Helper to resolve display period text
  const getPeriodLabel = (p: string | undefined) => {
    if (p === '1-15') return 'งวดวันที่ 1-15 ของเดือน';
    if (p === '16-31') return 'งวดวันที่ 16-31 ของเดือน';
    return 'งวดวันที่ 1-15 ของเดือน'; // Default
  };

  // Filtered Payroll
  const filteredPayroll = payroll.filter(p => {
    const isMonthMatch = monthFilter === 'all' || p.month === monthFilter;
    const isYearMatch = p.year === yearFilter;
    let isPeriodMatch = true;
    if (periodFilter !== 'all') {
      const recordPeriod = p.period || '1-15';
      isPeriodMatch = recordPeriod === periodFilter;
    }
    return isMonthMatch && isYearMatch && isPeriodMatch;
  });

  // Financial Summary calculations
  const totalPaid = filteredPayroll
    .filter(p => p.status === 'paid')
    .reduce((acc, p) => acc + p.netSalary, 0);

  const totalPending = filteredPayroll
    .filter(p => p.status === 'pending')
    .reduce((acc, p) => acc + p.netSalary, 0);

  const totalPayout = totalPaid + totalPending;

  const handlePrint = () => {
    window.print();
  };

  // Helper to generate a default voucher number for view if not present
  const getVoucherNo = (p: PayrollRecord) => {
    if (p.voucherNo) return p.voucherNo;
    return generateVoucherNo(p.year, p.month, p.period || '1-15', p.employeeId);
  };

  return (
    <div id="payroll-management-container" className="space-y-6 relative">
      {/* Custom Floating Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 max-w-md w-full bg-emerald-50 border-2 border-emerald-500 rounded-lg p-4 shadow-2xl flex items-start gap-3 font-sans transition-all duration-300">
          <div className="p-1 bg-emerald-500 text-white rounded-full shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h5 className="text-sm font-bold text-emerald-950">{successToastTitle}</h5>
            <p className="text-xs text-emerald-800 mt-1 font-medium leading-relaxed">{successToast}</p>
          </div>
          <button 
            onClick={() => setSuccessToast(null)} 
            className="text-emerald-500 hover:text-emerald-700 font-extrabold text-lg select-none px-1 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Header and top controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950 tracking-tight font-sans">ระบบคำนวณเงินเดือนและภาษี (Payroll & Compensation)</h2>
          <p className="text-xs text-slate-500 mt-1">คำนวณภาษี ประกันสังคม กองทุนสำรองเลี้ยงชีพ และทำใบสำคัญจ่ายที่มีเลขที่กำกับพร้อมพิมพ์ใบเสร็จ</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Year Filter */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(Number(e.target.value))}
            className="px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white focus:outline-none focus:border-blue-500 text-slate-700 font-bold"
          >
            {YEARS.map(y => (
              <option key={y} value={y}>ปี ค.ศ. {y}</option>
            ))}
          </select>

          {/* Month Filter */}
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white focus:outline-none focus:border-blue-500 text-slate-700 font-bold"
          >
            <option value="all">ทุกเดือน (All Months)</option>
            {THAI_MONTHS.map(m => (
              <option key={m} value={m}>เดือน: {m}</option>
            ))}
          </select>

          {/* Period Filter */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white focus:outline-none focus:border-blue-500 text-slate-700 font-bold"
          >
            <option value="all">ทุกงวดการจ่ายเงิน</option>
            <option value="1-15">งวดวันที่ 1-15 ของเดือน</option>
            <option value="16-31">งวดวันที่ 16-31 ของเดือน</option>
          </select>

          {/* Calculate Payroll Button */}
          <button
            onClick={handleOpenCalcModal}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-sm flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" /> คำนวณเงินเดือนรอบนี้
          </button>

          {/* Add Payout Button */}
          <button
            onClick={handleOpenAddForm}
            className="px-3.5 py-2 bg-blue-650 hover:bg-blue-700 text-white text-xs font-bold rounded-sm flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> บันทึกจ่ายเงินใหม่
          </button>

          {totalPending > 0 && (
            <button
              id="pay-all-btn"
              onClick={handlePayAllPending}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-sm shadow-xs transition cursor-pointer"
            >
              จ่ายเงินเดือนคงค้างทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div id="payroll-financial-grid" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Monthly Payout */}
        <div className="bg-white border border-slate-200 rounded-sm p-5 transition flex justify-between items-center shadow-2xs">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 font-sans uppercase tracking-wider">งบประมาณตามรอบที่กรอง (รายจ่ายรวมสุทธิ)</h3>
            <p className="text-xl font-extrabold text-slate-900 mt-1">฿{totalPayout.toLocaleString()}</p>
            <p className="text-[10px] text-indigo-600 font-semibold font-sans mt-0.5">({convertToThaiBahtText(totalPayout)})</p>
            <p className="text-[10px] text-slate-500 mt-1 font-sans">ฐานเงินรวมพนักงานทั้งหมด</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-sm">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Paid and success */}
        <div className="bg-white border border-slate-200 rounded-sm p-5 transition flex justify-between items-center shadow-2xs">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 font-sans uppercase tracking-wider">จ่ายเงินเสร็จสิ้นแล้ว (Paid)</h3>
            <p className="text-xl font-extrabold text-emerald-600 mt-1">฿{totalPaid.toLocaleString()}</p>
            <p className="text-[10px] text-emerald-600 font-semibold font-sans mt-0.5">({convertToThaiBahtText(totalPaid)})</p>
            <p className="text-[10px] text-slate-500 mt-1 font-sans">โอนเงินเข้าบัญชีพนักงานแล้ว</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Payouts */}
        <div className="bg-white border border-slate-200 rounded-sm p-5 transition flex justify-between items-center shadow-2xs">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 font-sans uppercase tracking-wider">รอดำเนินการสั่งจ่าย (Pending)</h3>
            <p className={`text-xl font-extrabold mt-1 font-sans ${totalPending > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
              ฿{totalPending.toLocaleString()}
            </p>
            {totalPending > 0 && (
              <p className="text-[10px] text-amber-600 font-semibold font-sans mt-0.5">({convertToThaiBahtText(totalPending)})</p>
            )}
            <p className="text-[10px] text-slate-500 mt-1 font-sans">รอตรวจสอบความถูกต้อง</p>
          </div>
          <div className={`p-3 rounded-sm ${totalPending > 0 ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}`}>
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Payroll Statement List Table */}
      <div id="payroll-table-card" className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 tracking-widest font-sans uppercase">
            บัญชีแสดงรายละเอียดเงินเดือนพนักงาน ({filteredPayroll.length} รายการ)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/20">
                <th className="py-3 px-6">ชื่อพนักงาน & งวดการจ่าย</th>
                <th className="py-3 px-6">เลขที่ใบสำคัญจ่าย</th>
                <th className="py-3 px-6 text-right">เงินเดือนฐาน</th>
                <th className="py-3 px-6 text-right">ค่าวิชาชีพ/สวัสดิการ</th>
                <th className="py-3 px-6 text-right">หัก ณ ที่จ่าย</th>
                <th className="py-3 px-6 text-right">รายรับสุทธิ</th>
                <th className="py-3 px-6">สถานะ</th>
                <th className="py-3 px-6 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredPayroll.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-400 font-sans">
                    ไม่พบรายการข้อมูลการจ่ายเงินเดือนในรอบที่ระบุ
                  </td>
                </tr>
              ) : (
                filteredPayroll.map(p => {
                  const totalDeductionItem = p.tax + p.socialSecurity + p.deductions;
                  return (
                    <tr key={p.id} id={`payroll-row-${p.id}`} className="hover:bg-slate-50/30 transition">
                      <td className="py-3 px-6">
                        <p className="font-semibold text-slate-900 leading-none">{p.employeeName}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">{p.employeeId}</p>
                        <p className="text-[9.5px] text-blue-600 mt-1 bg-blue-50/50 inline-block px-1.5 py-0.5 rounded-xs font-medium">
                          {getPeriodLabel(p.period)}
                        </p>
                      </td>
                      <td className="py-3 px-6 font-mono text-xs text-slate-700 font-bold">
                        {getVoucherNo(p)}
                      </td>
                      <td className="py-3 px-6 text-right font-mono text-slate-600">
                        ฿{p.baseSalary.toLocaleString()}
                      </td>
                      <td className="py-3 px-6 text-right font-mono text-emerald-600">
                        +฿{p.allowances.toLocaleString()}
                      </td>
                      <td className="py-3 px-6 text-right font-mono text-rose-500">
                        -฿{totalDeductionItem.toLocaleString()}
                      </td>
                      <td className="py-3 px-6 text-right font-bold text-slate-900 font-mono text-xs">
                        ฿{p.netSalary.toLocaleString()}
                      </td>
                      <td className="py-3 px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-semibold ${
                          p.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {p.status === 'paid' ? 'โอนเสร็จสิ้น' : 'รอสั่งจ่าย'}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex items-center justify-center gap-1">
                          {p.status === 'pending' && (
                            <button
                              id={`pay-single-btn-${p.id}`}
                              onClick={() => handlePaySalary(p.id)}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10.5px] font-bold rounded-sm transition cursor-pointer"
                            >
                              อนุมัติจ่าย
                            </button>
                          )}
                          <button
                            id={`payslip-btn-${p.id}`}
                            onClick={() => {
                              setSelectedRecord(p);
                              setModalViewType('payslip');
                            }}
                            className="p-1 hover:bg-slate-100 text-slate-500 hover:text-blue-650 rounded-sm transition cursor-pointer"
                            title="พิมพ์เอกสาร / สลิปเงินเดือน / ใบสำคัญจ่าย"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditForm(p)}
                            className="p-1 hover:bg-slate-100 text-slate-500 hover:text-blue-650 rounded-sm transition cursor-pointer"
                            title="แก้ไขข้อมูลจ่ายเงิน"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(p)}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-sm transition cursor-pointer"
                            title="ลบรายการนี้"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-sm border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 font-sans">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-full shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900">แจ้งเตือนก่อนลบประวัติการจ่ายเงินเดือน</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  คุณแน่ใจหรือไม่ที่จะลบรายการจ่ายเงินเดือนของ <strong>{recordToDelete.employeeName}</strong> รอบเดือน {recordToDelete.month} {recordToDelete.year}?
                </p>
                <p className="text-[10.5px] text-rose-600 bg-rose-50/50 p-2 rounded-xs border border-rose-100 mt-2">
                  *ข้อมูลนี้จะหายไปจากประวัติบัญชีและงบดุล และประวัติการบันทึกเงินสดจะได้รับผลกระทบ
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRecordToDelete(null)}
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-sm text-xs font-bold text-slate-700 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-sm text-xs font-bold cursor-pointer"
              >
                ยืนยันลบข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Payout Record Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-sm border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4 font-sans">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                <Coins className="w-4.5 h-4.5 text-blue-650" />
                {formMode === 'add' ? 'เพิ่มบันทึกจ่ายเงินเดือนใหม่' : 'แก้ไขบันทึกจ่ายเงินเดือน'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* Employee selection */}
                <div className="col-span-2 space-y-1">
                  <label className="font-bold text-slate-700 block">เลือกพนักงาน *</label>
                  <select
                    disabled={formMode === 'edit'}
                    value={formEmployeeId}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white text-slate-700 font-medium"
                  >
                    <option value="" disabled>-- เลือกพนักงาน --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.id} - {emp.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Period selection */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">งวดการจ่ายเงิน *</label>
                  <select
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white text-slate-700 font-medium"
                  >
                    <option value="1-15">งวดวันที่ 1-15 ของเดือน</option>
                    <option value="16-31">งวดวันที่ 16-31 ของเดือน</option>
                  </select>
                </div>

                {/* Voucher Number */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block flex items-center gap-1">
                    <Hash className="w-3 h-3 text-slate-400" /> เลขที่ใบสำคัญจ่าย
                  </label>
                  <input
                    type="text"
                    value={formVoucherNo}
                    onChange={(e) => setFormVoucherNo(e.target.value)}
                    placeholder="เช่น PV-202606-001"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs text-slate-700 font-mono"
                  />
                </div>

                {/* Month filter */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">รอบเดือน *</label>
                  <select
                    value={formMonth}
                    onChange={(e) => setFormMonth(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white text-slate-700 font-medium"
                  >
                    {THAI_MONTHS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Year filter */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">ปี ค.ศ. *</label>
                  <select
                    value={formYear}
                    onChange={(e) => setFormYear(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white text-slate-700 font-medium font-mono"
                  >
                    {YEARS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                {/* Base Salary */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-700 block">เงินเดือนฐาน (บาท) *</label>
                    {employees.find(e => e.id === formEmployeeId) && (
                      <span className="text-[10px] text-indigo-600 font-semibold font-sans">
                        อัตรา: {employees.find(e => e.id === formEmployeeId)?.salaryType === 'daily' 
                          ? `รายวัน ฿${employees.find(e => e.id === formEmployeeId)?.salary.toLocaleString()}/วัน` 
                          : `รายเดือน ฿${employees.find(e => e.id === formEmployeeId)?.salary.toLocaleString()}/เดือน`}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={formBaseSalary}
                    onChange={(e) => setFormBaseSalary(Number(e.target.value))}
                    required
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs text-slate-700 font-mono"
                  />
                </div>

                {/* Allowances */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">ค่าวิชาชีพ / สวัสดิการพิเศษ (บาท)</label>
                  <input
                    type="number"
                    value={formAllowances}
                    onChange={(e) => setFormAllowances(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs text-slate-700 font-mono"
                  />
                </div>

                {/* Deductions */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">กองทุนสำรองเลี้ยงชีพ (บาท)</label>
                  <input
                    type="number"
                    value={formDeductions}
                    onChange={(e) => setFormDeductions(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs text-slate-700 font-mono"
                  />
                </div>

                {/* Tax */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">ภาษี หัก ณ ที่จ่าย (บาท)</label>
                  <input
                    type="number"
                    value={formTax}
                    onChange={(e) => setFormTax(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs text-slate-700 font-mono"
                  />
                </div>

                {/* SSO */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">เงินประกันสังคม (บาท)</label>
                  <input
                    type="number"
                    value={formSocialSecurity}
                    onChange={(e) => setFormSocialSecurity(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs text-slate-700 font-mono"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">สถานะจ่ายเงิน *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'pending' | 'paid')}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white text-slate-700 font-medium"
                  >
                    <option value="pending">รอสั่งจ่าย (Pending)</option>
                    <option value="paid">จ่ายโอนเรียบร้อย (Paid)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Net Salary Preview */}
              <div className="p-3 bg-slate-900 text-white rounded-sm flex justify-between items-center mt-3 font-mono">
                <span className="text-[10px] text-slate-400 block uppercase">สุทธิคงเหลือจ่ายจริง (Net Salary):</span>
                <span className="text-sm font-extrabold text-blue-400">
                  ฿{(formBaseSalary + formAllowances - formDeductions - formTax - formSocialSecurity).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-sm text-xs font-bold text-slate-700 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-650 hover:bg-blue-700 text-white rounded-sm text-xs font-bold cursor-pointer"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Modal showing Payslip or Payment Voucher */}
      {selectedRecord && (
        <div id="payslip-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 max-w-2xl w-full p-8 shadow-2xl relative space-y-6">
            
            {/* Modal actions */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-4 no-print">
              <div className="flex gap-1 bg-slate-100 p-1 rounded">
                <button
                  onClick={() => setModalViewType('payslip')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xs transition cursor-pointer ${
                    modalViewType === 'payslip' 
                      ? 'bg-white text-slate-900 shadow-2xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ใบสลิปเงินเดือน (Payslip)
                </button>
                <button
                  onClick={() => setModalViewType('voucher')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xs transition cursor-pointer ${
                    modalViewType === 'voucher' 
                      ? 'bg-white text-slate-900 shadow-2xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ใบสำคัญจ่าย (Payment Voucher)
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  id="print-payslip-btn"
                  onClick={handlePrint}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-sm transition flex items-center gap-1 text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> พิมพ์เอกสาร
                </button>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-sm transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Print Envelope Structure */}
            <div id="print-envelope" className="p-6 border-4 border-slate-200 rounded-sm bg-slate-50/20 font-sans text-xs text-slate-700">
              
              {modalViewType === 'payslip' ? (
                /* PAYSLIP VIEW - 2 COPIES ON ONE PAGE */
                <div className="space-y-8">
                  
                  {/* SET 1: EMPLOYEE COPY */}
                  <div className="relative border border-dashed border-blue-250 p-5 rounded-sm bg-white shadow-2xs">
                    <div className="absolute top-3 right-3 px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold rounded uppercase tracking-wider no-print">
                      ส่วนของพนักงาน / Employee Copy
                    </div>
                    
                    <div className="space-y-5">
                      {/* Slip Header */}
                      <div className="text-center space-y-1 pb-3 border-b border-slate-200">
                        <h1 className="text-sm font-extrabold text-slate-900 tracking-wide">ใบแจ้งยอดเงินเดือนและรายได้พนักงาน (Payslip)</h1>
                        <h2 className="text-[11px] font-semibold text-slate-500 uppercase">บริษัทอภิวัฒน์เครื่องครัวจำกัด (สำนักงานใหญ่)</h2>
                        <p className="text-[9px] text-slate-400 font-mono">
                          รอบเดือน: {selectedRecord.month} / ปี {selectedRecord.year} ({getPeriodLabel(selectedRecord.period)}) - <span className="text-blue-600 font-bold">ส่วนของพนักงาน</span>
                        </p>
                      </div>

                      {/* Identity details */}
                      <div className="grid grid-cols-2 gap-4 py-2 border-b border-dashed border-slate-200 text-slate-650 text-[11px]">
                        <div className="space-y-1">
                          <p><strong>ชื่อ-นามสกุล:</strong> {selectedRecord.employeeName}</p>
                          <p><strong>รหัสพนักงาน:</strong> {selectedRecord.employeeId}</p>
                          <p><strong>บัญชีธนาคาร:</strong> {
                            employees.find(e => e.id === selectedRecord.employeeId)?.bankAccount || 'กสิกรไทย 123-X-XXXXX-X'
                          }</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <p><strong>ฝ่าย/แผนก:</strong> {
                            employees.find(e => e.id === selectedRecord.employeeId)?.department || 'Engineering'
                          }</p>
                          <p><strong>เลขที่ใบสำคัญจ่าย:</strong> <span className="font-mono font-bold text-slate-900">{getVoucherNo(selectedRecord)}</span></p>
                          <p><strong>สถานะเอกสาร:</strong> <span className={`font-bold uppercase ${selectedRecord.status === 'paid' ? 'text-emerald-600' : 'text-amber-500'}`}>
                            {selectedRecord.status === 'paid' ? 'PAID (ชำระเงินแล้ว)' : 'PENDING (รอจ่ายเงิน)'}
                          </span></p>
                        </div>
                      </div>

                      {/* Earnings & Deductions grid layout */}
                      <div className="grid grid-cols-2 gap-0 border-b border-slate-200 text-[11px]">
                        {/* Earnings (รายได้) */}
                        <div className="border-r border-slate-200 p-3 space-y-2">
                          <span className="font-extrabold text-slate-900 block text-xs border-b border-slate-100 pb-1 uppercase tracking-wide">รายได้ / Earnings</span>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>เงินเดือนฐาน (Base Salary)</span>
                              <span className="font-mono">฿{selectedRecord.baseSalary.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>ค่าวิชาชีพ / สวัสดิการพิเศษ</span>
                              <span className="font-mono">฿{selectedRecord.allowances.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Deductions (รายการหัก) */}
                        <div className="p-3 space-y-2 bg-slate-50/40">
                          <span className="font-extrabold text-slate-900 block text-xs border-b border-slate-100 pb-1 uppercase tracking-wide">รายการหัก / Deductions</span>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>ภาษีเงินได้ หัก ณ ที่จ่าย</span>
                              <span className="font-mono text-rose-500">-฿{selectedRecord.tax.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>เงินประกันสังคม (Social Security)</span>
                              <span className="font-mono text-rose-500">-฿{selectedRecord.socialSecurity.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>กองทุนสำรองชีพ (Provident Fund)</span>
                              <span className="font-mono text-rose-500">-฿{selectedRecord.deductions.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Calculation Summary Sheet */}
                      <div className="p-3.5 bg-slate-900 text-white rounded-sm space-y-2.5">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase tracking-wide font-mono">รายจ่ายรวมของบริษัทสุทธิ</span>
                            <span className="text-sm font-extrabold font-mono">฿{(selectedRecord.baseSalary + selectedRecord.allowances).toLocaleString()}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-blue-400 block uppercase tracking-wide font-mono">รายรับสุทธิพนักงาน (Net Salary Payout)</span>
                            <span className="text-base font-extrabold font-mono text-blue-400">฿{selectedRecord.netSalary.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="border-t border-slate-800 pt-1.5 flex flex-col sm:flex-row justify-between text-[9px] font-medium tracking-wide">
                          <div className="text-slate-400">
                            รายจ่ายบริษัทตัวอักษร: <span className="text-slate-200">({convertToThaiBahtText(selectedRecord.baseSalary + selectedRecord.allowances)})</span>
                          </div>
                          <div className="text-right text-blue-400">
                            เงินสุทธิพนักงานตัวอักษร: <span className="text-blue-200">({convertToThaiBahtText(selectedRecord.netSalary)})</span>
                          </div>
                        </div>
                      </div>

                      {/* Signatures */}
                      <div className="grid grid-cols-2 gap-4 text-center mt-4 pt-4 border-t border-slate-200 text-[10px] text-slate-400">
                        <div className="space-y-6">
                          <p className="border-b border-slate-200 pb-1 mx-8"></p>
                          <p>( ลงชื่อตัวแทนผู้สั่งจ่ายเงินเดือน / HR Director )</p>
                        </div>
                        <div className="space-y-6">
                          <p className="border-b border-slate-200 pb-1 mx-8"></p>
                          <p>( ลายมือชื่อพนักงานผู้รับเงิน / Employee Signature )</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TEAR ALONG LINE DIVIDER */}
                  <div className="relative my-6 border-t-2 border-dashed border-slate-350 flex justify-center items-center py-2 select-none">
                    <span className="absolute bg-slate-100 px-4 py-1 text-[10px] text-slate-500 font-bold tracking-wider flex items-center gap-1.5 border border-slate-200 rounded-full shadow-3xs">
                      ✂️ ฉีกตามรอยประ (Tear Line) ----------------------------------------------------
                    </span>
                  </div>

                  {/* SET 2: COMPANY COPY */}
                  <div className="relative border border-dashed border-emerald-250 p-5 rounded-sm bg-white shadow-2xs">
                    <div className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded uppercase tracking-wider no-print">
                      ส่วนของบริษัท / Company Copy
                    </div>
                    
                    <div className="space-y-5">
                      {/* Slip Header */}
                      <div className="text-center space-y-1 pb-3 border-b border-slate-200">
                        <h1 className="text-sm font-extrabold text-slate-900 tracking-wide">ใบแจ้งยอดเงินเดือนและรายได้พนักงาน (Payslip)</h1>
                        <h2 className="text-[11px] font-semibold text-slate-500 uppercase">บริษัทอภิวัฒน์เครื่องครัวจำกัด (สำนักงานใหญ่)</h2>
                        <p className="text-[9px] text-slate-400 font-mono">
                          รอบเดือน: {selectedRecord.month} / ปี {selectedRecord.year} ({getPeriodLabel(selectedRecord.period)}) - <span className="text-emerald-600 font-bold">ส่วนของบริษัท</span>
                        </p>
                      </div>

                      {/* Identity details */}
                      <div className="grid grid-cols-2 gap-4 py-2 border-b border-dashed border-slate-200 text-slate-650 text-[11px]">
                        <div className="space-y-1">
                          <p><strong>ชื่อ-นามสกุล:</strong> {selectedRecord.employeeName}</p>
                          <p><strong>รหัสพนักงาน:</strong> {selectedRecord.employeeId}</p>
                          <p><strong>บัญชีธนาคาร:</strong> {
                            employees.find(e => e.id === selectedRecord.employeeId)?.bankAccount || 'กสิกรไทย 123-X-XXXXX-X'
                          }</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <p><strong>ฝ่าย/แผนก:</strong> {
                            employees.find(e => e.id === selectedRecord.employeeId)?.department || 'Engineering'
                          }</p>
                          <p><strong>เลขที่ใบสำคัญจ่าย:</strong> <span className="font-mono font-bold text-slate-900">{getVoucherNo(selectedRecord)}</span></p>
                          <p><strong>สถานะเอกสาร:</strong> <span className={`font-bold uppercase ${selectedRecord.status === 'paid' ? 'text-emerald-600' : 'text-amber-500'}`}>
                            {selectedRecord.status === 'paid' ? 'PAID (ชำระเงินแล้ว)' : 'PENDING (รอจ่ายเงิน)'}
                          </span></p>
                        </div>
                      </div>

                      {/* Earnings & Deductions grid layout */}
                      <div className="grid grid-cols-2 gap-0 border-b border-slate-200 text-[11px]">
                        {/* Earnings (รายได้) */}
                        <div className="border-r border-slate-200 p-3 space-y-2">
                          <span className="font-extrabold text-slate-900 block text-xs border-b border-slate-100 pb-1 uppercase tracking-wide">รายได้ / Earnings</span>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>เงินเดือนฐาน (Base Salary)</span>
                              <span className="font-mono">฿{selectedRecord.baseSalary.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>ค่าวิชาชีพ / สวัสดิการพิเศษ</span>
                              <span className="font-mono">฿{selectedRecord.allowances.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Deductions (รายการหัก) */}
                        <div className="p-3 space-y-2 bg-slate-50/40">
                          <span className="font-extrabold text-slate-900 block text-xs border-b border-slate-100 pb-1 uppercase tracking-wide">รายการหัก / Deductions</span>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>ภาษีเงินได้ หัก ณ ที่จ่าย</span>
                              <span className="font-mono text-rose-500">-฿{selectedRecord.tax.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>เงินประกันสังคม (Social Security)</span>
                              <span className="font-mono text-rose-500">-฿{selectedRecord.socialSecurity.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>กองทุนสำรองชีพ (Provident Fund)</span>
                              <span className="font-mono text-rose-500">-฿{selectedRecord.deductions.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Calculation Summary Sheet */}
                      <div className="p-3.5 bg-slate-900 text-white rounded-sm space-y-2.5">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase tracking-wide font-mono">รายจ่ายรวมของบริษัทสุทธิ</span>
                            <span className="text-sm font-extrabold font-mono">฿{(selectedRecord.baseSalary + selectedRecord.allowances).toLocaleString()}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-blue-400 block uppercase tracking-wide font-mono">รายรับสุทธิพนักงาน (Net Salary Payout)</span>
                            <span className="text-base font-extrabold font-mono text-blue-400">฿{selectedRecord.netSalary.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="border-t border-slate-800 pt-1.5 flex flex-col sm:flex-row justify-between text-[9px] font-medium tracking-wide">
                          <div className="text-slate-400">
                            รายจ่ายบริษัทตัวอักษร: <span className="text-slate-200">({convertToThaiBahtText(selectedRecord.baseSalary + selectedRecord.allowances)})</span>
                          </div>
                          <div className="text-right text-blue-400">
                            เงินสุทธิพนักงานตัวอักษร: <span className="text-blue-200">({convertToThaiBahtText(selectedRecord.netSalary)})</span>
                          </div>
                        </div>
                      </div>

                      {/* Signatures */}
                      <div className="grid grid-cols-2 gap-4 text-center mt-4 pt-4 border-t border-slate-200 text-[10px] text-slate-400">
                        <div className="space-y-6">
                          <p className="border-b border-slate-200 pb-1 mx-8"></p>
                          <p>( ลงชื่อตัวแทนผู้สั่งจ่ายเงินเดือน / HR Director )</p>
                        </div>
                        <div className="space-y-6">
                          <p className="border-b border-slate-200 pb-1 mx-8"></p>
                          <p>( ลายมือชื่อพนักงานผู้รับเงิน / Employee Signature )</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                /* PAYMENT VOUCHER VIEW */
                <div className="space-y-6">
                  {/* Voucher Header */}
                  <div className="flex justify-between items-start border-b border-slate-300 pb-4">
                    <div className="space-y-1">
                      <h1 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">ใบสำคัญจ่าย</h1>
                      <h2 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest font-mono">PAYMENT VOUCHER</h2>
                      <p className="text-[10px] text-slate-500">บริษัทอภิวัฒน์เครื่องครัวจำกัด (สำนักงานใหญ่)</p>
                    </div>
                    <div className="text-right space-y-1.5 font-mono">
                      <div className="bg-slate-900 text-white px-3 py-1 font-bold text-[11px] rounded-xs">
                        เลขที่ / Voucher No: {getVoucherNo(selectedRecord)}
                      </div>
                      <p className="text-[10px] text-slate-500">
                        วันที่ / Date: {selectedRecord.status === 'paid' ? `30 ${selectedRecord.month} ${selectedRecord.year}` : 'รอดำเนินการสั่งจ่าย'}
                      </p>
                    </div>
                  </div>

                  {/* Voucher Info */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-200 rounded text-[11.5px]">
                    <div className="space-y-2">
                      <p><strong>จ่ายให้ (Paid To):</strong> {selectedRecord.employeeName}</p>
                      <p><strong>รหัสพนักงาน:</strong> {selectedRecord.employeeId}</p>
                      <p><strong>รายละเอียดงวด:</strong> <span className="text-blue-700 font-bold bg-blue-50 px-1 py-0.5 rounded">{getPeriodLabel(selectedRecord.period)}</span></p>
                    </div>
                    <div className="space-y-2 text-right">
                      <p><strong>แผนก (Dept):</strong> {
                        employees.find(e => e.id === selectedRecord.employeeId)?.department || 'Engineering'
                      }</p>
                      <p><strong>จ่ายผ่านช่องทาง:</strong> เงินโอนผ่านระบบธนาคารอัตโนมัติ</p>
                      <p><strong>บัญชีรับเงิน:</strong> {
                        employees.find(e => e.id === selectedRecord.employeeId)?.bankAccount || 'กสิกรไทย 123-X-XXXXX-X'
                      }</p>
                    </div>
                  </div>

                  {/* Voucher Details Table */}
                  <div className="border border-slate-200 rounded overflow-hidden">
                    <table className="w-full text-left border-collapse text-[11.5px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                          <th className="py-2.5 px-4">รายการคำนวณจ่าย (Description)</th>
                          <th className="py-2.5 px-4 text-right">จำนวนเงินพึงได้ (Debit)</th>
                          <th className="py-2.5 px-4 text-right">จำนวนเงินพึงหัก (Credit)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        <tr>
                          <td className="py-2 px-4">เงินเดือนฐาน (Base Salary)</td>
                          <td className="py-2 px-4 text-right font-mono">฿{selectedRecord.baseSalary.toLocaleString()}</td>
                          <td className="py-2 px-4 text-right font-mono text-slate-400">-</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4">ค่าวิชาชีพ / สวัสดิการพิเศษ (Allowances)</td>
                          <td className="py-2 px-4 text-right font-mono">฿{selectedRecord.allowances.toLocaleString()}</td>
                          <td className="py-2 px-4 text-right font-mono text-slate-400">-</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4">ภาษีเงินได้หัก ณ ที่จ่าย (Withholding Tax - 2%)</td>
                          <td className="py-2 px-4 text-right font-mono text-slate-400">-</td>
                          <td className="py-2 px-4 text-right font-mono text-rose-500">฿{selectedRecord.tax.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4">เงินประกันสังคมส่งสมทบ (SSO Deduction)</td>
                          <td className="py-2 px-4 text-right font-mono text-slate-400">-</td>
                          <td className="py-2 px-4 text-right font-mono text-rose-500">฿{selectedRecord.socialSecurity.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-4">กองทุนสำรองเลี้ยงชีพของพนักงาน (Provident Fund - 3%)</td>
                          <td className="py-2 px-4 text-right font-mono text-slate-400">-</td>
                          <td className="py-2 px-4 text-right font-mono text-rose-500">฿{selectedRecord.deductions.toLocaleString()}</td>
                        </tr>
                        <tr className="bg-slate-50 font-bold border-t border-slate-200">
                          <td className="py-2.5 px-4">รวมทั้งสิ้น (Total calculated)</td>
                          <td className="py-2.5 px-4 text-right font-mono text-slate-800">฿{(selectedRecord.baseSalary + selectedRecord.allowances).toLocaleString()}</td>
                          <td className="py-2.5 px-4 text-right font-mono text-rose-600">฿{(selectedRecord.tax + selectedRecord.socialSecurity + selectedRecord.deductions).toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Words Amount */}
                  <div className="p-3 bg-slate-900 text-white rounded-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[11px] text-blue-400 uppercase tracking-wide">ยอดสั่งจ่ายสุทธิพนักงาน (NET AMOUNT PAYOUT)</span>
                      <span className="text-sm font-extrabold font-mono text-blue-400">฿{selectedRecord.netSalary.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-slate-800 pt-1 text-right text-[10px] text-blue-300 font-sans">
                      จำนวนเงินตัวอักษร: <span className="text-white font-bold">({convertToThaiBahtText(selectedRecord.netSalary)})</span>
                    </div>
                  </div>

                  {/* Multi-Signatures block for payment voucher */}
                  <div className="grid grid-cols-4 gap-2 text-center mt-6 pt-6 border-t border-slate-200 text-[9.5px] text-slate-500 font-sans">
                    <div className="space-y-6">
                      <p className="border-b border-slate-200 pb-1.5 mx-4"></p>
                      <p><strong>ผู้จัดทำ (Prepared By)</strong></p>
                    </div>
                    <div className="space-y-6">
                      <p className="border-b border-slate-200 pb-1.5 mx-4"></p>
                      <p><strong>ผู้ตรวจสอบ (Checked By)</strong></p>
                    </div>
                    <div className="space-y-6">
                      <p className="border-b border-slate-200 pb-1.5 mx-4"></p>
                      <p><strong>ผู้อนุมัติจ่าย (Approved By)</strong></p>
                    </div>
                    <div className="space-y-6">
                      <p className="border-b border-slate-200 pb-1.5 mx-4"></p>
                      <p><strong>ผู้รับเงิน (Received By)</strong></p>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* Batch Calculation Confirmation Dialog */}
      {calcModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-sm border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-5 font-sans">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-full shrink-0">
                <Calculator className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900">ยืนยันผลการคำนวณเงินเดือนอัตโนมัติ</h4>
                <p className="text-xs text-slate-500">
                  ระบบวิเคราะห์อัตราเงินเดือนพนักงาน ข้อมูลประเภทการจ้างงาน และหักคำนวณภาษี ประกันสังคม กองทุนสะสมอัตโนมัติ สำหรับรอบการทำจ่ายปัจจุบัน
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 border border-slate-200/60 rounded-xs text-xs">
              <div>
                <p className="text-slate-400 font-medium">รอบการคำนวณ</p>
                <p className="font-extrabold text-slate-800 mt-1">เดือน {monthFilter} {yearFilter}</p>
                <p className="text-[10px] text-blue-600 mt-0.5">{getPeriodLabel(periodFilter === 'all' ? '1-15' : periodFilter)}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">จำนวนคำนวณสำเร็จ</p>
                <p className="font-extrabold text-indigo-600 mt-1 text-lg">{calcSummary.newRecords.length} คน</p>
                {calcSummary.existingCount > 0 && (
                  <p className="text-[10px] text-slate-400 mt-0.5">ข้าม {calcSummary.existingCount} คน (มีข้อมูลแล้ว)</p>
                )}
              </div>
              <div>
                <p className="text-slate-400 font-medium">ประมาณการเงินโอนสุทธิ</p>
                <p className="font-extrabold text-slate-950 mt-1 text-lg">฿{calcSummary.totalAmount.toLocaleString()}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">รอคำสั่งอนุมัติโอนจ่าย</p>
              </div>
            </div>

            {calcSummary.newRecords.length === 0 ? (
              <div className="py-6 text-center text-xs text-amber-600 bg-amber-50 rounded-sm border border-amber-100 font-sans">
                ไม่มีพนักงานค้างคำนวณเงินเดือนในรอบนี้ (พนักงานทุกคนมีประวัติจ่ายเงินเดือนรอบนี้เรียบร้อยแล้ว)
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">รายชื่อพนักงานที่เตรียมบันทึกคำนวณเงินเดือน ({calcSummary.newRecords.length} คน)</span>
                <div className="max-h-48 overflow-y-auto border border-slate-150 rounded-sm divide-y divide-slate-100">
                  {calcSummary.newRecords.map(rec => {
                    const empObj = employees.find(e => e.id === rec.employeeId);
                    return (
                      <div key={rec.id} className="flex justify-between items-center p-2.5 text-xs hover:bg-slate-50/50">
                        <div>
                          <p className="font-semibold text-slate-900">{rec.employeeName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {rec.employeeId} • {empObj?.salaryType === 'daily' ? 'รายวัน' : 'รายเดือน'} (ฐาน ฿{empObj?.salary.toLocaleString()})
                          </p>
                        </div>
                        <div className="text-right space-y-0.5">
                          <p className="font-bold text-slate-800 font-mono">฿{rec.netSalary.toLocaleString()}</p>
                          <p className="text-[9px] text-slate-400 font-sans">
                            บวก ฿{rec.allowances.toLocaleString()} | หัก ฿{(rec.deductions + rec.tax + rec.socialSecurity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setCalcModalOpen(false)}
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-sm text-xs font-bold text-slate-700 cursor-pointer"
              >
                ยกเลิก
              </button>
              {calcSummary.newRecords.length > 0 && (
                <button
                  onClick={handleSaveBatch}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-bold cursor-pointer"
                >
                  ยืนยันบันทึกรายการคำนวณทั้งหมด
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
