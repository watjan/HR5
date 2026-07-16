import { useMemo, useState } from 'react';
import { Employee, LeaveRequest, JobPosting, PartnerBilling, PayrollRecord } from '../types';
import { Users, Calendar, Briefcase, DollarSign, ArrowRight, UserCheck, ShieldAlert, Award, ClipboardList, AlertCircle, Check, Plus, Edit2, Trash2, X } from 'lucide-react';
import { convertToThaiBahtText } from '../lib/thaiBaht';

interface DashboardOverviewProps {
  employees: Employee[];
  leaves: LeaveRequest[];
  jobs: JobPosting[];
  partnerBillings?: PartnerBilling[];
  payroll?: PayrollRecord[];
  onNavigate: (tab: string) => void;
  onApproveLeave: (id: string) => void;
  onRejectLeave: (id: string) => void;
  onUpdateBilling?: (billing: PartnerBilling) => void;
  onAddBilling?: (billing: PartnerBilling) => void;
  onDeleteBilling?: (id: string) => void;
}

export default function DashboardOverview({
  employees,
  leaves,
  jobs,
  partnerBillings = [],
  payroll = [],
  onNavigate,
  onApproveLeave,
  onRejectLeave,
  onUpdateBilling,
  onAddBilling,
  onDeleteBilling
}: DashboardOverviewProps) {
  // Calculations
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const onLeaveEmployees = employees.filter(e => e.status === 'on-leave').length;
  const pendingLeavesCount = leaves.filter(l => l.status === 'pending').length;
  const activeJobsCount = jobs.filter(j => j.status === 'open').length;

  // Current Month Payroll Total Calculation
  const currentMonthPayrollTotal = useMemo(() => {
    const now = new Date();
    const THAI_MONTHS_MAP = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const curMonthName = THAI_MONTHS_MAP[now.getMonth()];
    const curYear = now.getFullYear();

    const currentMonthRecords = payroll.filter(p => p.month === curMonthName && p.year === curYear);
    
    let targetRecords = currentMonthRecords;
    let displayMonthYear = `${curMonthName} ${curYear}`;
    
    if (currentMonthRecords.length === 0 && payroll.length > 0) {
      const years = payroll.map(p => p.year);
      const maxYear = Math.max(...years);
      const yearRecords = payroll.filter(p => p.year === maxYear);
      
      const monthToIndex = (m: string) => THAI_MONTHS_MAP.indexOf(m);
      const maxMonthIndex = Math.max(...yearRecords.map(p => monthToIndex(p.month)));
      const maxMonthName = THAI_MONTHS_MAP[maxMonthIndex];
      
      targetRecords = yearRecords.filter(p => p.month === maxMonthName);
      displayMonthYear = `${maxMonthName} ${maxYear}`;
    }
    
    const total = targetRecords.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    return {
      total,
      displayLabel: displayMonthYear,
      count: targetRecords.length
    };
  }, [payroll]);

  // Overdue / Pending Payroll Calculations
  const overduePayroll = useMemo(() => {
    const pendingItems = payroll.filter(p => p.status === 'pending');
    const totalAmount = pendingItems.reduce((sum, p) => sum + (p.netSalary || p.baseSalary || 0), 0);
    return {
      count: pendingItems.length,
      amount: totalAmount
    };
  }, [payroll]);

  // Urgent Expenses Form & Delete Confirmation States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBilling, setEditingBilling] = useState<PartnerBilling | null>(null);
  
  const [formPartnerName, setFormPartnerName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formDocNumber, setFormDocNumber] = useState('');
  const [formDocType, setFormDocType] = useState<string>('billing');
  const [formStatus, setFormStatus] = useState<'pending' | 'billed' | 'paid' | 'cancelled'>('billed');
  const [formNotes, setFormNotes] = useState('');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formPhone, setFormPhone] = useState('');

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingBilling, setDeletingBilling] = useState<PartnerBilling | null>(null);

  const handleOpenAddForm = () => {
    setEditingBilling(null);
    setFormPartnerName('');
    setFormAmount('');
    setFormDueDate(new Date().toISOString().split('T')[0]);
    setFormDocNumber(`BILL-${Math.floor(100000 + Math.random() * 900000)}`);
    setFormDocType('billing');
    setFormStatus('billed');
    setFormNotes('');
    setFormContactPerson('');
    setFormPhone('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (billing: PartnerBilling) => {
    setEditingBilling(billing);
    setFormPartnerName(billing.partnerName);
    setFormAmount(billing.amount.toString());
    setFormDueDate(billing.dueDate);
    setFormDocNumber(billing.docNumber);
    setFormDocType(billing.docType);
    setFormStatus(billing.status);
    setFormNotes(billing.notes || '');
    setFormContactPerson(billing.contactPerson || '');
    setFormPhone(billing.phone || '');
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPartnerName || !formAmount || !formDueDate) return;

    const billingData: PartnerBilling = {
      id: editingBilling ? editingBilling.id : Math.random().toString(),
      partnerName: formPartnerName,
      docNumber: formDocNumber || `BILL-${Math.floor(100000 + Math.random() * 900000)}`,
      docType: formDocType,
      amount: parseFloat(formAmount) || 0,
      issueDate: editingBilling ? editingBilling.issueDate : new Date().toISOString().split('T')[0],
      dueDate: formDueDate,
      status: formStatus,
      notes: formNotes,
      contactPerson: formContactPerson,
      phone: formPhone
    };

    if (editingBilling) {
      onUpdateBilling?.(billingData);
    } else {
      onAddBilling?.(billingData);
    }

    setIsFormOpen(false);
  };

  const handleOpenDeleteConfirm = (billing: PartnerBilling) => {
    setDeletingBilling(billing);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingBilling && onDeleteBilling) {
      onDeleteBilling(deletingBilling.id);
    }
    setIsDeleteConfirmOpen(false);
    setDeletingBilling(null);
  };
  
  // Partner Billing Calculations
  const urgentBillings = useMemo(() => {
    return partnerBillings
      .filter(b => b.status === 'billed' || b.status === 'pending')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [partnerBillings]);

  const unpaidBillings = partnerBillings.filter(b => b.status === 'pending' || b.status === 'billed');
  const unpaidBilledCount = partnerBillings.filter(b => b.status === 'billed').length;
  const unpaidPendingCount = partnerBillings.filter(b => b.status === 'pending').length;
  
  const totalOutstandingAmount = unpaidBillings.reduce((sum, b) => sum + b.amount, 0);
  const totalBilledAmount = partnerBillings.filter(b => b.status === 'billed').reduce((sum, b) => sum + b.amount, 0);
  const totalPendingAmount = partnerBillings.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.amount, 0);

  const monthlyPayroll = employees.reduce((acc, emp) => {
    if (emp.status !== 'inactive') {
      return acc + emp.salary;
    }
    return acc;
  }, 0);

  // Departments distribution
  const deptCounts = employees.reduce((acc: { [key: string]: number }, emp) => {
    acc[emp.department] = (acc[emp.department] || 0) + 1;
    return acc;
  }, {});

  const pendingLeaves = leaves.filter(l => l.status === 'pending');

  return (
    <div id="dashboard-overview-container" className="space-y-8 animate-fade-in">
      {/* Welcome & System Notification Bar */}
      <div id="welcome-banner" className="bg-white border border-slate-200 border-l-4 border-l-blue-500 rounded-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest font-mono block">System Notice</span>
          <h1 className="text-2xl font-light text-slate-900 tracking-tight mt-1">ยินดีต้อนรับสู่ระบบ HR Core System</h1>
          <p className="text-slate-500 text-xs mt-1">วันนี้มีพนักงานปฏิบัติงานทั้งหมด <strong className="text-slate-900">{activeEmployees} คน</strong> จากพนักงานทั้งหมด {totalEmployees} คน</p>
        </div>
        <div className="flex gap-2">
          <button 
            id="quick-add-employee-btn"
            onClick={() => onNavigate('employees')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-mono font-bold uppercase tracking-wider shadow-xs transition"
          >
            Manage Employees
          </button>
        </div>
      </div>

      {/* Top Summary KPI Widgets Row */}
      <div id="top-summary-kpis" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Active Employees */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-sm flex items-center justify-between text-white shadow-xs">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Total Active Employees</p>
            <h3 className="text-3xl font-light tracking-tight mt-1 text-emerald-400 font-sans">{activeEmployees} <span className="text-xs text-slate-400 font-normal">คน</span></h3>
            <p className="text-[9px] text-slate-400 mt-1 font-sans">กำลังปฏิบัติงานปกติในระบบ</p>
          </div>
          <div className="p-3 bg-slate-800 text-emerald-400 rounded-sm">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Leave Requests */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-sm flex items-center justify-between text-white shadow-xs">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Pending Leave Requests</p>
            <h3 className="text-3xl font-light tracking-tight mt-1 text-amber-400 font-sans">{pendingLeavesCount} <span className="text-xs text-slate-400 font-normal">รายการ</span></h3>
            <p className="text-[9px] text-slate-400 mt-1 font-sans">รอดำเนินการพิจารณาอนุมัติ</p>
          </div>
          <div className={`p-3 bg-slate-800 rounded-sm ${pendingLeavesCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`}>
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Current Month Payroll Total */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-sm flex items-center justify-between text-white shadow-xs">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Current Month Payroll Total ({currentMonthPayrollTotal.displayLabel})</p>
            <h3 className="text-2xl font-bold tracking-tight mt-1 text-blue-400 font-mono">฿{currentMonthPayrollTotal.total.toLocaleString()}</h3>
            <p className="text-[9px] text-slate-400 mt-1 font-sans">รวมยอดจ่ายสุทธิพนักงาน ({currentMonthPayrollTotal.count} รายการ)</p>
          </div>
          <div className="p-3 bg-slate-800 text-blue-400 rounded-sm">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div id="kpi-cards-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Employees Widget */}
        <div 
          id="kpi-card-active-employees" 
          onClick={() => onNavigate('employees')}
          className="bg-white border border-slate-200 border-l-4 border-l-emerald-500 p-6 flex flex-col justify-between rounded-sm cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Active Employees</p>
              <h2 className="text-4xl font-light mt-3 text-slate-900 group-hover:text-emerald-600 transition-colors">{activeEmployees}</h2>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-sm">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500 font-sans border-t border-slate-100 pt-3">
            <span>↑ Operating normally</span>
            <span className="font-mono text-[10px] text-slate-400">on-leave: {onLeaveEmployees} / total: {totalEmployees}</span>
          </div>
        </div>

        {/* Pending Leave Requests Widget */}
        <div 
          id="kpi-card-pending-leaves" 
          onClick={() => onNavigate('leaves')}
          className="bg-white border border-slate-200 border-l-4 border-l-amber-500 p-6 flex flex-col justify-between rounded-sm cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Pending Leave Requests</p>
              <h2 className="text-4xl font-light mt-3 text-slate-900 group-hover:text-amber-600 transition-colors">
                {pendingLeavesCount}
              </h2>
            </div>
            <div className={`p-2 rounded-sm ${pendingLeavesCount > 0 ? 'bg-amber-50 text-amber-600 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500 font-sans border-t border-slate-100 pt-3">
            {pendingLeavesCount > 0 ? (
              <span className="text-amber-600 font-bold">● Requires immediate action</span>
            ) : (
              <span className="text-slate-400">All requests processed</span>
            )}
            <span className="font-mono text-[10px] text-slate-400">total leaves: {leaves.length}</span>
          </div>
        </div>

        {/* Overdue Payroll Widget */}
        <div 
          id="kpi-card-overdue-payroll" 
          onClick={() => onNavigate('payroll')}
          className="bg-white border border-slate-200 border-l-4 border-l-rose-500 p-6 flex flex-col justify-between rounded-sm cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Overdue Payroll</p>
              <h2 className="text-3xl font-light mt-3.5 text-slate-900 group-hover:text-rose-600 transition-colors">
                {overduePayroll.count > 0 ? `฿${overduePayroll.amount.toLocaleString()}` : '฿0'}
              </h2>
            </div>
            <div className={`p-2 rounded-sm ${overduePayroll.count > 0 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500 font-sans border-t border-slate-100 pt-3">
            {overduePayroll.count > 0 ? (
              <span className="text-rose-600 font-bold">⚠️ {overduePayroll.count} Pending payouts</span>
            ) : (
              <span className="text-emerald-600 font-bold">✓ All payouts completed</span>
            )}
            <span className="font-mono text-[10px] text-slate-400">Unpaid pay cycle</span>
          </div>
        </div>

        {/* Total Headcount / Monthly Payroll Budget Widget */}
        <div 
          id="kpi-card-total-budget" 
          onClick={() => onNavigate('payroll')}
          className="bg-white border border-slate-200 border-l-4 border-l-blue-500 p-6 flex flex-col justify-between rounded-sm cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Monthly Payroll Budget</p>
              <h2 className="text-3xl font-light mt-3.5 text-slate-900 group-hover:text-blue-600 transition-colors">
                ฿{monthlyPayroll.toLocaleString()}
              </h2>
              <p className="text-[10px] text-blue-600 font-semibold font-sans mt-1">({convertToThaiBahtText(monthlyPayroll)})</p>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-sm">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500 font-sans border-t border-slate-100 pt-3">
            <span>Base Salary Gross</span>
            <span className="font-mono text-[10px] text-slate-400">{totalEmployees} headcounts</span>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div id="main-dashboard-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns - Leave Requests Approval */}
        <div id="dashboard-leaves-column" className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-sm flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <span className="text-xs font-bold uppercase tracking-widest font-mono text-slate-700">คำร้องขอลางานรอดำเนินการ (Critical Alerts)</span>
              <button 
                id="view-all-leaves-shortcut"
                onClick={() => onNavigate('leaves')}
                className="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase tracking-tighter"
              >
                View Full List
              </button>
            </div>

            {pendingLeaves.length === 0 ? (
              <div id="no-pending-leaves" className="text-center py-16 bg-white">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">No active alerts</p>
                <p className="text-xs text-slate-400 mt-1">ระบบได้รับการจัดการเรียบร้อยหมดแล้ว</p>
              </div>
            ) : (
              <div id="pending-leaves-list" className="divide-y divide-slate-100">
                {pendingLeaves.map((request) => (
                  <div key={request.id} id={`pending-leave-${request.id}`} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">{request.employeeName}</span>
                        <span className={`text-[9px] font-bold font-mono uppercase px-2 py-0.5 rounded-sm border ${
                          request.type === 'sick' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          request.type === 'personal' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          request.type === 'annual' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {request.type === 'sick' ? 'Sick Leave' :
                           request.type === 'personal' ? 'Personal' :
                           request.type === 'annual' ? 'Vacation' : 'Other'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono">
                        Date: {request.startDate} to {request.endDate} ({request.durationUnit === 'hours' ? `${request.hours || (request.days * 8)} Hours` : `${request.days} Days`})
                      </p>
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 border border-slate-200/50 rounded-sm font-sans mt-1">
                        &ldquo;{request.reason}&rdquo;
                      </p>
                    </div>
                    <div className="flex gap-2 self-end sm:self-center shrink-0">
                      <button
                        id={`reject-btn-${request.id}`}
                        onClick={() => onRejectLeave(request.id)}
                        className="px-3 py-1.5 border border-slate-200 hover:border-rose-200 text-rose-600 hover:bg-rose-50 rounded-sm text-xs font-bold font-mono uppercase tracking-wider transition"
                      >
                        REJECT
                      </button>
                      <button
                        id={`approve-btn-${request.id}`}
                        onClick={() => onApproveLeave(request.id)}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold font-mono uppercase tracking-wider shadow-xs transition"
                      >
                        APPROVE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

           {/* Urgent Expenses Section (รายจ่ายด่วน) */}
          <div id="urgent-expenses-panel" className="bg-white border border-slate-200 rounded-sm flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-widest font-mono text-slate-700">รายจ่ายด่วนต้องชำระ (Urgent Expenses)</span>
              </div>
              <div className="flex items-center gap-2">
                {onAddBilling && (
                  <button
                    onClick={handleOpenAddForm}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-sm text-[10px] tracking-wide uppercase transition font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> เพิ่มรายจ่ายด่วน
                  </button>
                )}
                <button 
                  id="view-all-billings-shortcut"
                  onClick={() => onNavigate('partner_billing')}
                  className="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase tracking-tighter hover:underline"
                >
                  จัดการบัญชีคู่ค้า →
                </button>
              </div>
            </div>

            {urgentBillings.length === 0 ? (
              <div id="no-urgent-expenses" className="text-center py-12 bg-white">
                <AlertCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">No Urgent Expenses</p>
                <p className="text-xs text-slate-400 mt-1">ไม่มีรายการค้างจ่ายที่ต้องเร่งดำเนินการในขณะนี้</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-150 bg-slate-50/50 text-slate-500 font-mono font-bold uppercase tracking-wider">
                      <th className="p-3 pl-6">วันเดือนปี (กำหนดนัด)</th>
                      <th className="p-3">บริษัทคู่ค้า</th>
                      <th className="p-3 text-right">ยอดเงิน</th>
                      <th className="p-3 text-center">สถานะ</th>
                      <th className="p-3 pr-6 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {urgentBillings.slice(0, 5).map((billing) => {
                      let formattedDate = billing.dueDate;
                      try {
                        const d = new Date(billing.dueDate);
                        formattedDate = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
                      } catch (e) {}

                      const isOverdue = new Date(billing.dueDate).getTime() < new Date().getTime();

                      return (
                        <tr key={billing.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 pl-6 font-mono font-medium text-slate-600">
                            <div className="flex flex-col">
                              <span>{formattedDate}</span>
                              {isOverdue && billing.status === 'billed' && (
                                <span className="text-[9px] text-rose-500 font-bold font-sans mt-0.5">● เลยกำหนดชำระ</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-semibold text-slate-800">
                            <div className="flex flex-col">
                              <span>{billing.partnerName}</span>
                              <span className="text-[10px] text-slate-400 font-mono font-normal">เลขที่: {billing.docNumber}</span>
                            </div>
                          </td>
                          <td className="p-3 text-right font-bold font-mono text-slate-950 text-sm">
                            ฿{billing.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                              billing.status === 'billed' 
                                ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {billing.status === 'billed' ? 'วางบิลแล้ว (Billed)' : 'รอวางบิล (Pending)'}
                            </span>
                          </td>
                          <td className="p-3 pr-6 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {onUpdateBilling ? (
                                <button
                                  onClick={() => {
                                    onUpdateBilling({
                                      ...billing,
                                      status: 'paid'
                                    });
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-sm text-[10px] tracking-wide uppercase transition font-mono cursor-pointer"
                                  title="จ่ายเงิน"
                                >
                                  PAY / จ่ายเงิน
                                </button>
                              ) : (
                                <button
                                  onClick={() => onNavigate('partner_billing')}
                                  className="px-2.5 py-1 border border-slate-200 hover:border-blue-500 text-slate-600 hover:text-blue-600 rounded-sm text-[10px] transition cursor-pointer"
                                >
                                  ดูบัญชี
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleOpenEditForm(billing)}
                                className="p-1 border border-slate-200 hover:border-blue-500 text-slate-500 hover:text-blue-600 rounded-sm hover:bg-blue-50/50 transition cursor-pointer"
                                title="แก้ไขรายจ่ายด่วน"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>

                              {onDeleteBilling && (
                                <button
                                  onClick={() => handleOpenDeleteConfirm(billing)}
                                  className="p-1 border border-slate-200 hover:border-rose-500 text-slate-500 hover:text-rose-600 rounded-sm hover:bg-rose-50/50 transition cursor-pointer"
                                  title="ลบรายจ่ายด่วน"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {urgentBillings.length > 5 && (
                  <div className="p-2.5 text-center bg-slate-50/30 border-t border-slate-100">
                    <button
                      onClick={() => onNavigate('partner_billing')}
                      className="text-[11px] font-bold font-mono text-slate-500 hover:text-blue-600 transition"
                    >
                      ดูรายการที่ค้างชำระทั้งหมดอีก {urgentBillings.length - 5} รายการ
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div id="quick-shortcuts-panel" className="bg-white border border-slate-200 rounded-sm p-6">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-4">เข้าถึงด่วน (Quick Modules)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button onClick={() => onNavigate('employees')} className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-sm text-center transition group">
                <Users className="w-5 h-5 text-slate-600 mx-auto mb-2 group-hover:scale-105 transition-transform" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">Employees</span>
              </button>
              <button onClick={() => onNavigate('leaves')} className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-sm text-center transition group">
                <Calendar className="w-5 h-5 text-slate-600 mx-auto mb-2 group-hover:scale-105 transition-transform" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">Attendance</span>
              </button>
              <button onClick={() => onNavigate('payroll')} className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-sm text-center transition group">
                <DollarSign className="w-5 h-5 text-slate-600 mx-auto mb-2 group-hover:scale-105 transition-transform" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">Payroll</span>
              </button>
              <button onClick={() => onNavigate('recruitment')} className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-sm text-center transition group">
                <Briefcase className="w-5 h-5 text-slate-600 mx-auto mb-2 group-hover:scale-105 transition-transform" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">Recruit</span>
              </button>
            </div>
          </div>
        </div>
 
        {/* Right Column - Stats & Summary */}
        <div id="dashboard-statistics-column" className="space-y-6">
          {/* Billing Summary Widget - Outstanding Partner Debt */}
          <div id="billing-summary-widget" className="bg-white border border-slate-200 p-6 rounded-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-amber-50 text-amber-600 rounded-sm">
                  <ClipboardList className="w-4 h-4" />
                </span>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">ยอดค้างจ่ายคู่ค้า (Outstanding Debts)</p>
              </div>
              <button
                onClick={() => onNavigate('partner_billing')}
                className="text-blue-600 hover:text-blue-800 text-[11px] font-bold uppercase tracking-tighter flex items-center gap-1 hover:underline cursor-pointer font-sans"
              >
                ดูข้อมูล <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">หนี้สินคงค้างรวมทั้งหมด</span>
                <span className="text-2xl font-black text-slate-900 font-mono tracking-tight block mt-1">
                  ฿{totalOutstandingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <p className="text-[10px] text-amber-600 font-semibold font-sans mt-1">({convertToThaiBahtText(totalOutstandingAmount)})</p>
              </div>

              {/* Warnings / Alerts */}
              {unpaidBilledCount > 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-sm p-3 flex gap-2 items-start animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                  <div className="text-[11px] text-amber-800 leading-normal">
                    <strong>มีการวางบิลแล้วแต่ยังไม่ได้จ่ายเงิน {unpaidBilledCount} รายการ!</strong>
                    <p className="opacity-90 mt-0.5">ยอดเงินรอชำระสะสม: ฿{totalBilledAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-150 rounded-sm p-3 text-center text-[11px] text-slate-500 font-sans">
                  ไม่มีรายการวางบิลค้างชำระในรอบนี้
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] border-t border-slate-100">
                <div className="space-y-1">
                  <span className="text-slate-400 block font-sans">วางบิลแล้ว (Billed)</span>
                  <span className="text-slate-800 font-bold font-mono block">
                    ฿{totalBilledAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono block">({unpaidBilledCount} รายการ)</span>
                </div>
                <div className="space-y-1 border-l border-slate-100 pl-3">
                  <span className="text-slate-400 block font-sans">รอวางบิล (Pending)</span>
                  <span className="text-slate-800 font-bold font-mono block">
                    ฿{totalPendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono block">({unpaidPendingCount} รายการ)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Compensation Trends (Quarterly) - Structured design visualizer */}
          <div className="bg-white border border-slate-200 p-6 rounded-sm">
            <div className="flex justify-between items-center mb-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Compensation Trends</p>
              <div className="flex gap-4 text-[10px] font-bold font-mono">
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-blue-500 rounded-none"></div> PAY</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-slate-200 rounded-none"></div> BASE</span>
              </div>
            </div>
            <div className="flex h-24 items-end gap-2 border-b border-slate-100 pb-1">
              <div className="flex-1 h-[60%] bg-blue-500 hover:bg-blue-600 transition" title="Jan: ฿60k"></div>
              <div className="flex-1 h-[65%] bg-blue-500 hover:bg-blue-600 transition" title="Feb: ฿65k"></div>
              <div className="flex-1 h-[80%] bg-blue-500 hover:bg-blue-600 transition" title="Mar: ฿80k"></div>
              <div className="flex-1 h-[75%] bg-blue-500 hover:bg-blue-600 transition" title="Apr: ฿75k"></div>
              <div className="flex-1 h-[90%] bg-blue-600 hover:bg-blue-700 transition" title="May: ฿90k"></div>
              <div className="flex-1 h-[100%] bg-blue-600 hover:bg-blue-700 transition relative" title="Jun: ฿100k">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold bg-slate-800 text-white px-1.5 py-0.5 rounded-sm">CURR</div>
              </div>
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
              <span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span>
            </div>
          </div>

          {/* Department Breakdown */}
          <div id="dept-breakdown-card" className="bg-white border border-slate-200 p-6 rounded-sm">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-4">สัดส่วนตามฝ่ายงาน (HEADCOUNT)</h2>
            <div className="space-y-4">
              {Object.entries(deptCounts).map(([dept, count]) => {
                const percentage = totalEmployees > 0 ? (count / totalEmployees) * 100 : 0;
                return (
                  <div key={dept} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">{dept}</span>
                      <span className="text-slate-900 font-mono">{count} คน ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-none overflow-hidden">
                      <div 
                        className={`h-full rounded-none ${
                          dept === 'Engineering' ? 'bg-blue-500' :
                          dept === 'Marketing' ? 'bg-slate-600' :
                          dept === 'Human Resources' ? 'bg-slate-400' : 'bg-slate-300'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* System Health / Telemetry widget - Matches the slate-900 look in design HTML */}
          <div className="bg-slate-900 text-white p-6 rounded-sm">
            <p className="text-xs font-bold opacity-40 uppercase tracking-widest font-mono mb-4">System Telemetry</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-light tracking-tighter font-mono">99.9%</span>
              <span className="text-[9px] opacity-60 uppercase tracking-widest font-mono font-bold">Uptime (OK)</span>
            </div>
            <div className="mt-6 space-y-3 font-mono text-[10px] font-bold uppercase tracking-wider">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="opacity-50">Database Latency</span>
                <span className="text-slate-300">14ms</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="opacity-50">Security Protocol</span>
                <span className="text-emerald-400">AES-256</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-50">API Connectivity</span>
                <span className="text-emerald-400">STABLE</span>
              </div>
            </div>
          </div>

        </div>
        
      </div>

      {/* ADD / EDIT PARTNER BILLING MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-sm shadow-xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-slate-700">
                {editingBilling ? 'แก้ไขรายการรายจ่ายด่วน' : 'เพิ่มรายการรายจ่ายด่วน'} (Urgent Expense)
              </h3>
              <button 
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="block text-slate-500 font-bold uppercase tracking-wider font-mono">บริษัทคู่ค้า <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formPartnerName}
                    onChange={(e) => setFormPartnerName(e.target.value)}
                    placeholder="ระบุชื่อบริษัทคู่ค้า"
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold uppercase tracking-wider font-mono">ยอดเงิน (บาท) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 font-mono text-right"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold uppercase tracking-wider font-mono">วันกำหนดชำระ <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold uppercase tracking-wider font-mono">เลขที่เอกสาร</label>
                  <input
                    type="text"
                    value={formDocNumber}
                    onChange={(e) => setFormDocNumber(e.target.value)}
                    placeholder="เช่น INV-2026001"
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold uppercase tracking-wider font-mono">ประเภทเอกสาร</label>
                  <select
                    value={formDocType}
                    onChange={(e) => setFormDocType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 font-sans bg-white"
                  >
                    <option value="billing">ใบวางบิล (Billing)</option>
                    <option value="delivery">ใบส่งของ (Delivery Receipt)</option>
                    <option value="invoice_receipt">ใบเสร็จ/ใบกำกับภาษี (Invoice/Receipt)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold uppercase tracking-wider font-mono">ผู้ติดต่อคู่ค้า</label>
                  <input
                    type="text"
                    value={formContactPerson}
                    onChange={(e) => setFormContactPerson(e.target.value)}
                    placeholder="ชื่อผู้ประสานงาน"
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold uppercase tracking-wider font-mono">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="เบอร์โทรศัพท์ผู้ติดต่อ"
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="block text-slate-500 font-bold uppercase tracking-wider font-mono">สถานะรายการชำระ</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 font-sans bg-white"
                  >
                    <option value="billed">วางบิลแล้ว (Billed) - รอชำระเงิน</option>
                    <option value="pending">รอวางบิล (Pending) - รอเอกสาร</option>
                    <option value="paid">ชำระเงินเรียบร้อยแล้ว (Paid)</option>
                    <option value="cancelled">ยกเลิกรายการ (Cancelled)</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="block text-slate-500 font-bold uppercase tracking-wider font-mono">หมายเหตุ / ข้อมูลเพิ่มเติม</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 font-sans resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-sm font-bold uppercase tracking-wider transition cursor-pointer font-mono"
                >
                  Cancel / ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-bold uppercase tracking-wider transition cursor-pointer font-mono shadow-xs"
                >
                  Save / บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION ALERT DIALOG */}
      {isDeleteConfirmOpen && deletingBilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-rose-200 rounded-sm shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="p-4 border-b border-rose-100 flex justify-between items-center bg-rose-50">
              <div className="flex items-center gap-2 text-rose-700 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs uppercase tracking-widest font-mono">
                  ยืนยันการลบรายการรายจ่าย (Confirm Delete)
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="p-1 hover:bg-rose-100 rounded text-rose-400 hover:text-rose-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-2">
                <p className="text-slate-800 text-sm leading-relaxed font-semibold">
                  คุณต้องการลบรายการรายจ่ายด่วนของ <strong className="text-slate-950 font-bold">"{deletingBilling.partnerName}"</strong> ใช่หรือไม่?
                </p>
                <p className="text-slate-500 leading-relaxed">
                  เมื่อยืนยันแล้ว ข้อมูลเอกสารนี้รวมถึงยอดเงิน และบันทึกประวัติที่เกี่ยวข้องจะถูกลบออกจากระบบเป็นการถาวรและไม่สามารถกู้คืนได้
                </p>
              </div>

              {/* Summary card inside confirm */}
              <div className="bg-slate-50 border border-slate-150 p-3 rounded-sm space-y-1.5 font-mono text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span>บริษัทคู่ค้า:</span>
                  <span className="font-bold text-slate-800">{deletingBilling.partnerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>เลขที่เอกสาร:</span>
                  <span className="font-bold text-slate-800">{deletingBilling.docNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>กำหนดนัดชำระ:</span>
                  <span className="font-bold text-slate-800">{deletingBilling.dueDate}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 text-xs">
                  <span>ยอดเงินค้างจ่าย:</span>
                  <span className="font-black text-rose-600">
                    ฿{deletingBilling.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-sm font-bold uppercase tracking-wider transition cursor-pointer font-mono"
                >
                  Cancel / ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-sm font-bold uppercase tracking-wider transition cursor-pointer font-mono shadow-xs"
                >
                  Confirm Delete / ยืนยันการลบ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
