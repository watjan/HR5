import React, { useState } from 'react';
import { Employee, LeaveRequest, DailyAttendance } from '../types';
import { 
  Search, Plus, UserPlus, Phone, Mail, DollarSign, Calendar, Edit3, Trash2, X, Check, Eye,
  CreditCard, Link as LinkIcon, Globe, ExternalLink, Cpu, Sparkles, FileText, Share2, Award, Briefcase, PlusCircle,
  Camera, RefreshCw, Image
} from 'lucide-react';

interface EmployeeDirectoryProps {
  employees: Employee[];
  attendanceRecords?: { [employeeId: string]: { [date: string]: DailyAttendance } };
  leaves?: LeaveRequest[];
  onAddEmployee: (employee: Employee) => void;
  onUpdateEmployee: (id: string, updated: Partial<Employee>) => void;
  onDeleteEmployee: (id: string) => void;
}

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
];

export default function EmployeeDirectory({
  employees,
  attendanceRecords = {},
  leaves = [],
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee
}: EmployeeDirectoryProps) {
  // Filters and states
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'stats'>('cards');
  
  // Modals / forms
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Add form fields
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newDept, setNewDept] = useState('Engineering');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSalary, setNewSalary] = useState(30000);
  const [newSalaryType, setNewSalaryType] = useState<'monthly' | 'daily'>('monthly');
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [newBank, setNewBank] = useState('');
  const [newWorkDays, setNewWorkDays] = useState<number>(5);
  const [newLinks, setNewLinks] = useState<{ label: string; url: string }[]>([]);
  const [newAvatar, setNewAvatar] = useState(PRESET_AVATARS[0]);

  // Edit fields
  const [editId, setEditId] = useState('');
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editDept, setEditDept] = useState('Engineering');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSalary, setEditSalary] = useState(0);
  const [editSalaryType, setEditSalaryType] = useState<'monthly' | 'daily'>('monthly');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive' | 'on-leave'>('active');
  const [editBank, setEditBank] = useState('');
  const [editJoinDate, setEditJoinDate] = useState('');
  const [editWorkDays, setEditWorkDays] = useState<number>(5);
  const [editLinks, setEditLinks] = useState<{ label: string; url: string }[]>([]);
  const [editAvatar, setEditAvatar] = useState('');

  // Delete modal target
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  // Get unique departments
  const departments = ['All', ...Array.from(new Set(employees.map(e => e.department)))];

  // Helper to calculate 2026 (latest year) attendance stats for an employee
  const getEmployeeStats2026 = (employeeId: string) => {
    let absentDays = 0;
    let lateDays = 0;
    let lateMinutesTotal = 0;
    let leaveDaysFromAttendance = 0;

    // Get from attendance records
    const empAttendance = attendanceRecords[employeeId] || {};
    Object.keys(empAttendance).forEach(dateStr => {
      if (dateStr.startsWith('2026')) {
        const record = empAttendance[dateStr];
        if (record.status === 'absent') {
          absentDays++;
        } else if (record.status === 'late') {
          lateDays++;
          lateMinutesTotal += record.lateMinutes || 0;
        } else if (record.status === 'leave') {
          leaveDaysFromAttendance++;
        }
      }
    });

    // Get from leaves (LeaveRequest list)
    let approvedSick = 0;
    let approvedPersonal = 0;
    let approvedAnnual = 0;
    let approvedOther = 0;

    leaves.forEach(req => {
      if (req.employeeId === employeeId && req.status === 'approved' && req.startDate.startsWith('2026')) {
        if (req.type === 'sick') approvedSick += req.days;
        else if (req.type === 'personal') approvedPersonal += req.days;
        else if (req.type === 'annual') approvedAnnual += req.days;
        else approvedOther += req.days;
      }
    });

    const totalApprovedLeaves = approvedSick + approvedPersonal + approvedAnnual + approvedOther;
    // Use whichever is higher or combine nicely
    const displayLeaveDays = totalApprovedLeaves > 0 ? totalApprovedLeaves : leaveDaysFromAttendance;

    return {
      absentDays,
      lateDays,
      lateMinutesTotal,
      leaveDays: displayLeaveDays,
      breakdown: {
        sick: approvedSick,
        personal: approvedPersonal,
        annual: approvedAnnual,
        other: approvedOther
      }
    };
  };

  const formatAsCardNumber = (empId: string) => {
    const numStr = empId.replace(/\D/g, '');
    const paddedNum = numStr ? String(Number(numStr)).padStart(4, '0') : '0000';
    return `5412  8800  2026  ${paddedNum}`;
  };

  const renderEmployeeCreditCard = (emp: Employee, isSelected: boolean = false, isDetailView: boolean = false) => {
    let gradClass = "from-slate-900 via-slate-800 to-indigo-950 text-slate-100 border-slate-700/40 shadow-slate-900/10";
    
    if (emp.department === 'Engineering') {
      gradClass = "from-slate-900 via-indigo-950 to-slate-900 text-indigo-50 border-indigo-900/30 shadow-indigo-900/10";
    } else if (emp.department === 'Product Design') {
      gradClass = "from-slate-900 via-rose-950 to-slate-900 text-rose-50 border-rose-900/30 shadow-rose-900/10";
    } else if (emp.department === 'Marketing') {
      gradClass = "from-slate-900 via-teal-950 to-slate-900 text-teal-50 border-teal-900/30 shadow-teal-900/10";
    } else if (emp.department === 'Human Resources') {
      gradClass = "from-slate-900 via-violet-950 to-slate-900 text-violet-50 border-violet-900/30 shadow-violet-900/10";
    } else if (emp.department === 'Sales' || emp.department === 'Finance') {
      gradClass = "from-slate-900 via-amber-950 to-slate-900 text-amber-50 border-amber-900/30 shadow-amber-900/10";
    }

    const cardNumber = formatAsCardNumber(emp.id);

    return (
      <div 
        id={`emp-card-${emp.id}`}
        onClick={(e) => {
          setSelectedEmployee(emp);
          setIsEditMode(false);
        }}
        className={`relative w-full rounded-2xl p-3 bg-gradient-to-br ${gradClass} border flex flex-col justify-between shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden ${
          isSelected ? 'ring-2 ring-blue-500 scale-[1.01] border-transparent' : 'border-slate-200/50'
        } ${isDetailView ? 'max-w-md mx-auto shadow-2xl' : 'max-w-[420px]'}`}
        style={{ minHeight: '235px' }}
      >
        {/* Glossy overlay sheen */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />
        
        {/* Holographic bubble */}
        <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        {/* Top Header Row */}
        <div className="flex justify-between items-center pb-1.5 border-b border-white/5 mb-1.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span className="text-[7.5px] font-mono font-bold tracking-widest text-white/70">SMART CREDENTIAL</span>
          </div>
          <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full border border-white/15 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[7.5px] font-mono font-bold tracking-wider text-white/90">
              {emp.department.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Main Content Area: 2 Columns */}
        <div className="grid grid-cols-12 gap-2 flex-1">
          {/* Left Column: Avatar & Chip & Identity (5 cols) */}
          <div className="col-span-5 flex flex-col justify-between border-r border-white/5 pr-2">
            <div className="space-y-1">
              {/* Gold Smart Chip */}
              <div className="relative w-7 h-4.5 rounded-xs bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400 border border-amber-400/40 flex flex-col justify-between p-0.5 shadow-xs overflow-hidden">
                <div className="h-[1px] w-full bg-slate-900/15 absolute top-1/3 left-0" />
                <div className="h-[1px] w-full bg-slate-900/15 absolute top-2/3 left-0" />
                <div className="w-[1px] h-full bg-slate-900/15 absolute left-1/3 top-0" />
                <div className="w-[1px] h-full bg-slate-900/15 absolute left-2/3 top-0" />
              </div>

              {/* Avatar Photo */}
              <div className="relative inline-block mt-1">
                <img 
                  src={emp.avatar} 
                  alt={emp.name} 
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full object-cover border border-white/20 shadow-xs bg-slate-800"
                />
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-slate-900 ${
                  emp.status === 'active' ? 'bg-emerald-400' :
                  emp.status === 'on-leave' ? 'bg-amber-400' : 'bg-rose-400'
                }`} />
              </div>

              {/* Name & Title */}
              <div className="space-y-0.5 mt-1">
                <p className="text-[10px] font-bold tracking-wide text-white leading-tight truncate" title={emp.name}>
                  {emp.name}
                </p>
                <p className="text-[8px] text-white/60 leading-none truncate" title={emp.role}>
                  {emp.role}
                </p>
              </div>
            </div>

            {/* Employee code */}
            <div className="mt-1">
              <p className="text-[6px] text-white/30 tracking-widest font-mono">ID NO.</p>
              <p className="text-[9px] font-mono text-white/85 tracking-wider font-bold">{emp.id}</p>
            </div>
          </div>

          {/* Right Column: Detailed Info Grid (7 cols) */}
          <div className="col-span-7 pl-1 flex flex-col justify-between text-[8px] font-mono text-white/90 space-y-1">
            {/* Info Items List */}
            <div className="space-y-1 bg-white/5 rounded-md p-1.5 border border-white/5 leading-none">
              <div className="flex justify-between items-center">
                <span className="text-white/45 text-[6.5px] uppercase">LIMIT/SALARY:</span>
                <span className="font-bold text-amber-300">฿{emp.salary.toLocaleString()} / {emp.salaryType === 'daily' ? 'วัน' : 'เดือน'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/45 text-[6.5px] uppercase">ACCOUNT NO:</span>
                <span className="truncate max-w-[85px] text-right font-sans text-white/95" title={emp.bankAccount}>
                  {emp.bankAccount || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/45 text-[6.5px] uppercase">EMAIL ADDR:</span>
                <span className="truncate max-w-[85px] text-right text-indigo-200 hover:underline" title={emp.email}>
                  {emp.email}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/45 text-[6.5px] uppercase">PHONE NO:</span>
                <span className="text-right text-white/95">{emp.phone || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/45 text-[6.5px] uppercase">JOIN DATE:</span>
                <span className="text-white/95">{emp.joinDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/45 text-[6.5px] uppercase">SCHEDULE:</span>
                <span className="text-white/95">{emp.workDays || 5} days/wk</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-white/5">
                <span className="text-white/45 text-[6.5px] uppercase">LEAVE BAL:</span>
                <span className="font-bold text-emerald-300">
                  S:{emp.leaveBalance.sick} P:{emp.leaveBalance.personal} A:{emp.leaveBalance.annual}
                </span>
              </div>
            </div>

            {/* Related Interactive Links section */}
            <div className="space-y-1 mt-auto">
              <p className="text-[6.5px] text-white/40 uppercase tracking-widest font-bold">CONNECTED PORTALS</p>
              {emp.links && emp.links.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {emp.links.map((lnk, index) => {
                    const lowerLabel = lnk.label.toLowerCase();
                    let LinkIconComponent = Globe;
                    let colorClass = "bg-white/10 hover:bg-white/25 text-white border-white/10";
                    if (lowerLabel.includes('github')) {
                      LinkIconComponent = Share2;
                      colorClass = "bg-indigo-950/40 hover:bg-indigo-950/60 text-indigo-200 border-indigo-500/20";
                    } else if (lowerLabel.includes('linkedin')) {
                      LinkIconComponent = Award;
                      colorClass = "bg-blue-950/40 hover:bg-blue-950/60 text-blue-200 border-blue-500/20";
                    } else if (lowerLabel.includes('portfolio') || lowerLabel.includes('behance') || lowerLabel.includes('figma')) {
                      LinkIconComponent = FileText;
                      colorClass = "bg-rose-950/40 hover:bg-rose-950/60 text-rose-200 border-rose-500/20";
                    }

                    return (
                      <a
                        key={index}
                        href={lnk.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-sm border ${colorClass} text-[7.5px] font-sans font-medium transition shrink-0 max-w-[80px]`}
                        title={`${lnk.label}: ${lnk.url}`}
                      >
                        <LinkIconComponent className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{lnk.label}</span>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[7px] text-white/30 italic">No connected portals</p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom card number */}
        <div className="mt-2 pt-1 border-t border-white/5 flex justify-between items-center">
          <p className="text-[8px] font-mono tracking-[0.2em] text-white/95 select-all font-bold drop-shadow-xs">
            {cardNumber}
          </p>
          <div className="flex gap-1 items-center">
            {/* Holographic credit card circles */}
            <div className="w-4 h-4 rounded-full bg-red-500/40 mix-blend-screen -mr-1.5" />
            <div className="w-4 h-4 rounded-full bg-yellow-500/40 mix-blend-screen" />
          </div>
        </div>
      </div>
    );
  };

  // Filter logic
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'All' || emp.department === deptFilter;
    const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleOpenAddModal = () => {
    setIsAddOpen(true);
    setNewName('');
    setNewRole('');
    setNewDept('Engineering');
    setNewEmail('');
    setNewPhone('');
    setNewSalary(35000);
    setNewSalaryType('monthly');
    setNewJoinDate(new Date().toISOString().split('T')[0]);
    setNewBank('กสิกรไทย 000-0-00000-0');
    setNewWorkDays(5);
    setNewLinks([]);
    // Pick a random preset avatar
    const randomAvatar = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)];
    setNewAvatar(randomAvatar);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newRole || !newEmail) return;

    const nextId = `EMP-${String(employees.length + 1).padStart(3, '0')}`;
    const newEmp: Employee = {
      id: nextId,
      name: newName,
      avatar: newAvatar || PRESET_AVATARS[0],
      role: newRole,
      department: newDept,
      email: newEmail,
      phone: newPhone,
      salary: Number(newSalary),
      salaryType: newSalaryType,
      joinDate: newJoinDate,
      status: 'active',
      leaveBalance: { sick: 15, personal: 6, annual: 12 },
      bankAccount: newBank,
      workDays: Number(newWorkDays),
      links: newLinks.filter(lnk => lnk.label.trim() && lnk.url.trim())
    };

    onAddEmployee(newEmp);
    setIsAddOpen(false);
  };

  const handleOpenEdit = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsEditMode(true);
    setEditId(emp.id);
    setEditName(emp.name);
    setEditRole(emp.role);
    setEditDept(emp.department);
    setEditEmail(emp.email);
    setEditPhone(emp.phone);
    setEditSalary(emp.salary);
    setEditSalaryType(emp.salaryType || 'monthly');
    setEditStatus(emp.status);
    setEditBank(emp.bankAccount);
    setEditJoinDate(emp.joinDate);
    setEditWorkDays(emp.workDays || 5);
    setEditLinks(emp.links || []);
    setEditAvatar(emp.avatar || PRESET_AVATARS[0]);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    const oldId = selectedEmployee.id;

    const updatedEmployeeData = {
      id: editId,
      name: editName,
      avatar: editAvatar || PRESET_AVATARS[0],
      role: editRole,
      department: editDept,
      email: editEmail,
      phone: editPhone,
      salary: Number(editSalary),
      salaryType: editSalaryType,
      status: editStatus,
      bankAccount: editBank,
      joinDate: editJoinDate,
      workDays: Number(editWorkDays),
      links: editLinks.filter(lnk => lnk.label.trim() && lnk.url.trim())
    };

    onUpdateEmployee(oldId, updatedEmployeeData);

    // Refresh selected panel info
    setSelectedEmployee({
      ...selectedEmployee,
      ...updatedEmployeeData
    });

    setIsEditMode(false);
  };

  const handleDelete = (emp: Employee) => {
    setEmployeeToDelete(emp);
  };

  return (
    <div id="employee-directory-container" className="space-y-6">
      {/* Top action block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-light text-slate-900">ฐานข้อมูลพนักงาน (Employee Records)</h2>
          <p className="text-xs text-slate-500 mt-1">บริหารจัดการข้อมูลส่วนบุคคล ตำแหน่ง และเงินเดือนของพนักงาน</p>
        </div>
        <button
          id="open-add-employee-modal-btn"
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-sm shadow-xs transition"
        >
          <UserPlus className="w-3.5 h-3.5" /> Add New Employee
        </button>
      </div>

      {/* Filter and Search controls */}
      <div id="filter-controls-card" className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="employee-search-input"
            type="text"
            placeholder="ค้นหาชื่อ, ตำแหน่ง หรือรหัสพนักงาน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-blue-500 text-slate-700"
          />
        </div>
        {/* Department Filter & Segment Switcher */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <select
            id="department-filter"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3.5 py-2 border border-slate-200 rounded-sm text-sm bg-white focus:outline-none focus:border-blue-500 text-slate-700"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept === 'All' ? 'ทุกแผนก/ฝ่าย' : dept}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 border border-slate-200 rounded-sm text-sm bg-white focus:outline-none focus:border-blue-500 text-slate-700"
          >
            <option value="All">ทุกสถานะ</option>
            <option value="active">ปกติ (Active)</option>
            <option value="on-leave">ลางานอยู่ (On Leave)</option>
            <option value="inactive">ลาออก/ระงับงาน (Inactive)</option>
          </select>

          {/* View Mode Toggle Segmented Control */}
          <div className="flex border border-slate-200 rounded-sm overflow-hidden p-0.5 bg-slate-100 self-center">
            <button
              id="view-mode-cards-btn"
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-xs text-xs font-bold transition flex items-center gap-1.5 ${viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              title="สลับเป็นมุมมอง บัตรเครดิตพนักงาน"
            >
              <CreditCard className="w-3.5 h-3.5" /> บัตรพนักงาน
            </button>
            <button
              id="view-mode-table-btn"
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-xs text-xs font-bold transition flex items-center gap-1.5 ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              title="สลับเป็นมุมมอง ตาราง"
            >
              <Eye className="w-3.5 h-3.5" /> ตาราง
            </button>
            <button
              id="view-mode-stats-btn"
              type="button"
              onClick={() => setViewMode('stats')}
              className={`px-3 py-1 rounded-xs text-xs font-bold transition flex items-center gap-1.5 ${viewMode === 'stats' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              title="สลับเป็นมุมมอง ตารางสะสม ขาด ลา สาย"
            >
              <Calendar className="w-3.5 h-3.5 text-rose-600" /> ตาราง ขาด ลา สาย (2026)
            </button>
          </div>
        </div>
      </div>

      {/* Directory Grid & Quick Profile Detail View */}
      <div id="directory-layout-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Employee List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">รายชื่อพนักงาน ({filteredEmployees.length} คน)</span>
          </div>

          {filteredEmployees.length === 0 ? (
            <div id="no-employees-found" className="text-center py-20">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">ไม่พบพนักงานตามเงื่อนไขที่ค้นหา</p>
              <p className="text-xs text-slate-400 mt-1">กรุณาลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
            </div>
          ) : viewMode === 'cards' ? (
            <div id="employee-cards-grid" className="p-5 grid grid-cols-1 xl:grid-cols-2 gap-5 bg-slate-50/30">
              {filteredEmployees.map((emp) => {
                const isSelected = selectedEmployee?.id === emp.id;
                return (
                  <div key={emp.id} className="w-full flex justify-center">
                    {renderEmployeeCreditCard(emp, isSelected, false)}
                  </div>
                );
              })}
            </div>
          ) : viewMode === 'table' ? (
            <div id="employee-table-container" className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/30">
                    <th className="py-3 px-6">พนักงาน</th>
                    <th className="py-3 px-6">แผนก & ตำแหน่ง</th>
                    <th className="py-3 px-6">สถานะ</th>
                    <th className="py-3 px-6 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredEmployees.map((emp) => (
                    <tr 
                      key={emp.id} 
                      id={`emp-row-${emp.id}`}
                      className={`hover:bg-slate-50/50 transition cursor-pointer ${selectedEmployee?.id === emp.id ? 'bg-blue-50/20' : ''}`}
                      onClick={() => { setSelectedEmployee(emp); setIsEditMode(false); }}
                    >
                      <td className="py-3.5 px-6 flex items-center gap-3">
                        <img 
                          src={emp.avatar} 
                          alt={emp.name} 
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-slate-100" 
                        />
                        <div>
                          <p className="font-semibold text-slate-900 leading-none">{emp.name}</p>
                          <p className="text-xs text-slate-400 mt-1 font-mono">{emp.id}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <p className="font-medium text-slate-800 leading-none">{emp.role}</p>
                        <p className="text-xs text-slate-400 mt-1">{emp.department}</p>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-semibold ${
                          emp.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          emp.status === 'on-leave' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {emp.status === 'active' ? 'ทำงานปกติ' :
                           emp.status === 'on-leave' ? 'ลางาน' : 'พ้นสภาพ'}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          <button
                            id={`view-emp-btn-${emp.id}`}
                            onClick={() => { setSelectedEmployee(emp); setIsEditMode(false); }}
                            className="p-1.5 hover:bg-slate-100 rounded-sm text-slate-500 hover:text-blue-600 transition"
                            title="ดูโปรไฟล์"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            id={`edit-emp-btn-${emp.id}`}
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-amber-600 transition"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div id="employee-stats-container" className="space-y-0">
              {/* Stats Summary Panel */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 border-b border-slate-200/60">
                <div className="bg-white border border-slate-200 p-3 rounded-sm text-center">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-bold">สถิติขาดงานรวม (2026)</span>
                  <span className="text-lg font-bold text-rose-600 font-mono mt-1 block">
                    {filteredEmployees.reduce((sum, emp) => sum + getEmployeeStats2026(emp.id).absentDays, 0)} วัน
                  </span>
                </div>
                <div className="bg-white border border-slate-200 p-3 rounded-sm text-center">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-bold">สถิติการลารวม (2026)</span>
                  <span className="text-lg font-bold text-amber-600 font-mono mt-1 block">
                    {filteredEmployees.reduce((sum, emp) => sum + getEmployeeStats2026(emp.id).leaveDays, 0)} วัน
                  </span>
                </div>
                <div className="bg-white border border-slate-200 p-3 rounded-sm text-center">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-bold">สถิติมาสายรวม (2026)</span>
                  <span className="text-lg font-bold text-indigo-600 font-mono mt-1 block">
                    {filteredEmployees.reduce((sum, emp) => sum + getEmployeeStats2026(emp.id).lateDays, 0)} ครั้ง
                  </span>
                </div>
              </div>

              {/* Stats Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/50">
                      <th className="py-3 px-4">พนักงาน</th>
                      <th className="py-3 px-4">แผนก & ตำแหน่ง</th>
                      <th className="py-3 px-4 text-center">ขาดงาน</th>
                      <th className="py-3 px-4 text-center">ลางานสะสม</th>
                      <th className="py-3 px-4 text-center">มาสายสะสม</th>
                      <th className="py-3 px-4 text-center">อัตราการทำงาน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredEmployees.map((emp) => {
                      const stats = getEmployeeStats2026(emp.id);
                      const totalEstimatedDays = 120; // Approx working days in 2026 so far (Jan-Jun)
                      const attendanceRate = Math.max(0, Math.min(100, ((totalEstimatedDays - stats.absentDays - (stats.lateDays * 0.1)) / totalEstimatedDays) * 100));

                      return (
                        <tr 
                          key={emp.id} 
                          id={`emp-stats-row-${emp.id}`}
                          className={`hover:bg-slate-50/50 transition cursor-pointer ${selectedEmployee?.id === emp.id ? 'bg-blue-50/10' : ''}`}
                          onClick={() => { setSelectedEmployee(emp); setIsEditMode(false); }}
                        >
                          <td className="py-3 px-4 flex items-center gap-2">
                            <img 
                              src={emp.avatar} 
                              alt={emp.name} 
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-full object-cover border border-slate-100 shrink-0" 
                            />
                            <div className="truncate">
                              <p className="font-semibold text-slate-900 leading-none truncate">{emp.name}</p>
                              <p className="text-[10px] text-slate-400 mt-1 font-mono">{emp.id}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-800 leading-none truncate">{emp.role}</p>
                            <p className="text-[10px] text-slate-400 mt-1 truncate">{emp.department}</p>
                          </td>
                          <td className="py-3 px-4 text-center font-semibold font-mono">
                            {stats.absentDays > 0 ? (
                              <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded-sm border border-rose-100">
                                {stats.absentDays} วัน
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {stats.leaveDays > 0 ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-sm border border-amber-100 font-semibold font-mono">
                                  {stats.leaveDays} วัน
                                </span>
                                <span className="text-[9px] text-slate-400 mt-0.5 whitespace-nowrap">
                                  ป่วย:{stats.breakdown.sick} | กิจ:{stats.breakdown.personal} | พัก:{stats.breakdown.annual}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {stats.lateDays > 0 ? (
                              <div className="inline-flex flex-col items-center font-mono">
                                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-sm border border-indigo-100 font-semibold">
                                  {stats.lateDays} ครั้ง
                                </span>
                                <span className="text-[9px] text-slate-400 mt-0.5 font-sans whitespace-nowrap">
                                  รวม {stats.lateMinutesTotal} นาที
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className={`text-xs font-bold font-mono ${
                                attendanceRate > 95 ? 'text-emerald-600' : attendanceRate > 85 ? 'text-amber-600' : 'text-rose-600'
                              }`}>
                                {attendanceRate.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column: Profile & Edit Details Panel */}
        <div id="profile-detail-panel" className="bg-white border border-slate-200 rounded-sm p-6 self-start">
          {selectedEmployee ? (
            <div>
              {/* Header Close Toggle */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                  {isEditMode ? 'แก้ไขข้อมูลพนักงาน' : 'รายละเอียดพนักงาน'}
                </h3>
                <button 
                  onClick={() => setSelectedEmployee(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* View Profile Mode */}
              {!isEditMode ? (
                <div className="space-y-5">
                  {/* Premium Credit Card Preview */}
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">บัตรพนักงานอิเล็กทรอนิกส์ (Digital Smart Card)</p>
                    {renderEmployeeCreditCard(selectedEmployee, false, true)}
                  </div>

                  <div className="space-y-3.5 border-t border-slate-100 pt-4 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">รหัสพนักงาน:</span>
                      <span className="font-semibold text-slate-800 font-mono">{selectedEmployee.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">แผนก/ฝ่ายงาน:</span>
                      <span className="font-semibold text-slate-800">{selectedEmployee.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">วันที่เริ่มงาน:</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {selectedEmployee.joinDate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">วันทำงานต่อสัปดาห์:</span>
                      <span className="font-semibold text-slate-800">{selectedEmployee.workDays || 5} วัน/สัปดาห์</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">อีเมลส่วนตัว/งาน:</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {selectedEmployee.email}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">เบอร์โทรศัพท์:</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedEmployee.phone}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">อัตราเงินเดือน:</span>
                      <span className="font-semibold text-slate-900 flex items-center gap-1 font-mono">
                        ฿{selectedEmployee.salary.toLocaleString()} / {selectedEmployee.salaryType === 'daily' ? 'วัน' : 'เดือน'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">บัญชีธนาคาร:</span>
                      <span className="font-semibold text-slate-800 font-mono">{selectedEmployee.bankAccount || '-'}</span>
                    </div>

                    {/* Related Links Section */}
                    <div className="border-t border-slate-100 pt-3.5">
                      <span className="text-slate-400 block mb-2 font-semibold">ข้อมูลลิงก์ที่เกี่ยวข้อง (Linked Profiles):</span>
                      {selectedEmployee.links && selectedEmployee.links.length > 0 ? (
                        <div className="space-y-1.5">
                          {selectedEmployee.links.map((lnk, index) => {
                            const lowerLabel = lnk.label.toLowerCase();
                            let LinkIconComponent = Globe;
                            if (lowerLabel.includes('github')) {
                              LinkIconComponent = Share2;
                            } else if (lowerLabel.includes('linkedin')) {
                              LinkIconComponent = Award;
                            } else if (lowerLabel.includes('portfolio') || lowerLabel.includes('behance') || lowerLabel.includes('figma')) {
                              LinkIconComponent = FileText;
                            } else if (lowerLabel.includes('resume') || lowerLabel.includes('document')) {
                              LinkIconComponent = FileText;
                            }

                            return (
                              <a
                                key={index}
                                href={lnk.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 text-slate-700 hover:text-blue-750 rounded-md text-[11px] font-medium transition group"
                              >
                                <LinkIconComponent className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 shrink-0" />
                                <span className="truncate flex-1 font-sans">{lnk.label}</span>
                                <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-blue-400 shrink-0" />
                              </a>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic bg-slate-50 border border-slate-100/50 p-2.5 rounded text-center">
                          ไม่มีข้อมูลลิงก์เชื่อมโยงสำหรับพนักงานท่านนี้
                        </p>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-3.5">
                      <span className="text-slate-400 block mb-2 font-medium">สิทธิ์วันคงเหลือคงเหลือ:</span>
                      {(() => {
                        const stats = getEmployeeStats2026(selectedEmployee.id);
                        const sickRemaining = Math.max(0, 15 - stats.breakdown.sick);
                        const personalRemaining = Math.max(0, 6 - stats.breakdown.personal);
                        const annualRemaining = Math.max(0, 12 - stats.breakdown.annual);
                        return (
                          <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                            <div className="bg-rose-50 border border-rose-100/50 p-1.5 rounded-lg">
                              <span className="block font-semibold text-rose-700">{sickRemaining} วัน</span>
                              <span className="text-[10px] text-slate-400">ลาป่วย</span>
                            </div>
                            <div className="bg-amber-50 border border-amber-100/50 p-1.5 rounded-lg">
                              <span className="block font-semibold text-amber-700">{personalRemaining} วัน</span>
                              <span className="text-[10px] text-slate-400">ลากิจ</span>
                            </div>
                            <div className="bg-blue-50 border border-blue-100/50 p-1.5 rounded-lg">
                              <span className="block font-semibold text-blue-700">{annualRemaining} วัน</span>
                              <span className="text-[10px] text-slate-400">ลาพักร้อน</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Accumulated Absences, Leaves, Lateness Table */}
                    <div className="border-t border-slate-100 pt-3.5">
                      <span className="text-slate-400 block mb-2 font-semibold">สถิติการ ขาด ลา สาย สะสม (2026):</span>
                      <div className="bg-slate-50 border border-slate-200/60 rounded-md overflow-hidden">
                        <table className="w-full text-[11px] text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-100 text-slate-500 font-bold border-b border-slate-250">
                              <th className="py-1.5 px-2.5 text-slate-700 font-medium">ประเภท</th>
                              <th className="py-1.5 px-2 text-center text-slate-700 font-medium">สะสม</th>
                              <th className="py-1.5 px-2.5 text-slate-700 font-medium">รายละเอียด</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/60 text-slate-600 font-sans">
                            {(() => {
                              const s = getEmployeeStats2026(selectedEmployee.id);
                              return (
                                <>
                                  <tr>
                                    <td className="py-2 px-2.5 font-medium text-slate-700">ขาดงาน (Absent)</td>
                                    <td className="py-2 px-2 text-center font-bold text-rose-600 font-mono">{s.absentDays} วัน</td>
                                    <td className="py-2 px-2.5 text-slate-400 text-[10px]">หักตามจริง</td>
                                  </tr>
                                  <tr>
                                    <td className="py-2 px-2.5 font-medium text-slate-700">ลางาน (Leave)</td>
                                    <td className="py-2 px-2 text-center font-bold text-amber-600 font-mono">{s.leaveDays} วัน</td>
                                    <td className="py-2 px-2.5 text-slate-500 text-[10px]">
                                      ป่วย:{s.breakdown.sick} | กิจ:{s.breakdown.personal} | พัก:{s.breakdown.annual}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="py-2 px-2.5 font-medium text-slate-700">มาสาย (Late)</td>
                                    <td className="py-2 px-2 text-center font-bold text-indigo-600 font-mono">{s.lateDays} ครั้ง</td>
                                    <td className="py-2 px-2.5 text-indigo-600 text-[10px] font-mono">
                                      รวม {s.lateMinutesTotal} นาที
                                    </td>
                                  </tr>
                                </>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Actions inside Pane */}
                  <div className="flex gap-2 border-t border-slate-200 pt-4">
                    <button
                      id="terminate-employee-btn"
                      onClick={() => handleDelete(selectedEmployee)}
                      className="flex-1 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer"
                    >
                      นำออกระบบ
                    </button>
                    <button
                      id="edit-mode-btn"
                      onClick={() => handleOpenEdit(selectedEmployee)}
                      className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> แก้ไขข้อมูล
                    </button>
                  </div>
                </div>
              ) : (
                /* Edit Profile Form Mode */
                <form onSubmit={handleEditSubmit} className="space-y-4 text-xs text-slate-600">
                  {/* Avatar Editing Section */}
                  <div className="space-y-2 border-b border-slate-100 pb-3 mb-3">
                    <span className="font-semibold text-slate-700 block">รูปประจำตัวพนักงาน (Avatar Profile)</span>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img 
                          src={editAvatar || PRESET_AVATARS[0]} 
                          alt="Avatar Preview" 
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm bg-slate-50"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full border border-white shadow-xs">
                          <Camera className="w-2.5 h-2.5" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="ลิงก์ URL รูปภาพ (.jpg, .png...)"
                            value={editAvatar}
                            onChange={(e) => setEditAvatar(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-[11px] font-mono bg-white text-slate-700"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const id = Math.floor(Math.random() * 1000);
                              setEditAvatar(`https://images.unsplash.com/photo-${1500000000000 + id * 1000000}?w=150`);
                            }}
                            className="px-2 py-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-blue-600 rounded-sm text-[10px] font-bold font-sans flex items-center gap-1 cursor-pointer transition"
                            title="สุ่มรูปภาพพนักงานใหม่"
                          >
                            <RefreshCw className="w-3 h-3" /> สุ่มรูป
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Preset Avatars picker */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 block">เลือกจากรูปภาพพนักงานสำเร็จรูป (Presets):</span>
                      <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-slate-200">
                        {PRESET_AVATARS.map((pUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setEditAvatar(pUrl)}
                            className={`relative shrink-0 w-8 h-8 rounded-full border-2 overflow-hidden transition-all duration-200 cursor-pointer ${
                              editAvatar === pUrl ? 'border-blue-500 scale-105 shadow-xs' : 'border-slate-200 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={pUrl} alt={`Preset ${idx + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            {editAvatar === pUrl && (
                              <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white drop-shadow-sm font-black" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block font-mono">รหัสพนักงาน (Employee ID)</label>
                    <input
                      type="text"
                      value={editId}
                      onChange={(e) => setEditId(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 text-xs bg-white font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">ชื่อ-นามสกุล พนักงาน</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 text-xs bg-white font-sans font-bold"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">ตำแหน่งงาน</label>
                    <input
                      type="text"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 text-xs bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">ฝ่ายงาน / แผนก</label>
                    <select
                      value={editDept}
                      onChange={(e) => setEditDept(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 text-xs bg-white"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Product Design">Product Design</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Sales">Sales</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">อีเมลติดต่อ</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 text-xs bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">เบอร์โทรศัพท์</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 text-xs bg-white"
                    />
                  </div>
                   <div className="grid grid-cols-2 gap-2.5">
                     <div className="space-y-1">
                       <label className="font-semibold text-slate-700 block">รูปแบบค่าจ้าง / เงินเดือน</label>
                       <select
                         value={editSalaryType}
                         onChange={(e) => setEditSalaryType(e.target.value as 'monthly' | 'daily')}
                         className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 text-xs bg-white font-sans"
                       >
                         <option value="monthly">รายเดือน (Monthly)</option>
                         <option value="daily">รายวัน (Daily)</option>
                       </select>
                     </div>
                     <div className="space-y-1">
                       <label className="font-semibold text-slate-700 block">อัตราเงิน (บาท)</label>
                       <input
                         type="number"
                         value={editSalary}
                         onChange={(e) => setEditSalary(Number(e.target.value))}
                         className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 text-xs bg-white font-mono font-bold"
                         required
                       />
                     </div>
                   </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">วันทำงาน/สัปดาห์</label>
                      <select
                        value={editWorkDays}
                        onChange={(e) => setEditWorkDays(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 text-xs bg-white"
                      >
                        <option value={4}>4 วัน/สัปดาห์</option>
                        <option value={5}>5 วัน/สัปดาห์</option>
                        <option value={6}>6 วัน/สัปดาห์</option>
                        <option value={7}>7 วัน/สัปดาห์</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">วันที่เริ่มทำงาน</label>
                      <input
                        type="date"
                        value={editJoinDate}
                        onChange={(e) => setEditJoinDate(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 text-xs bg-white font-mono"
                        required
                      />
                    </div>
                  </div>
                   <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">บัญชีธนาคาร</label>
                    <input
                      type="text"
                      value={editBank}
                      onChange={(e) => setEditBank(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">สถานะพนักงาน</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 text-xs bg-white"
                    >
                      <option value="active">ปกติ (Active)</option>
                      <option value="on-leave">ลางานอยู่ (On Leave)</option>
                      <option value="inactive">ระงับงาน/ออกระบบ (Inactive)</option>
                    </select>
                  </div>

                  {/* Edit Links Section */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <div className="flex justify-between items-center">
                      <label className="font-semibold text-slate-700 text-xs block">ลิงก์ข้อมูลที่เกี่ยวข้อง (Linked Portals)</label>
                      <button
                        type="button"
                        onClick={() => setEditLinks([...editLinks, { label: '', url: '' }])}
                        className="text-[10px] text-blue-650 hover:text-blue-800 font-bold flex items-center gap-1"
                      >
                        <PlusCircle className="w-3 h-3" /> เพิ่มลิงก์
                      </button>
                    </div>
                    {editLinks.map((lnk, idx) => (
                      <div key={idx} className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          placeholder="เช่น GitHub"
                          value={lnk.label}
                          onChange={(e) => {
                            const updated = [...editLinks];
                            updated[idx].label = e.target.value;
                            setEditLinks(updated);
                          }}
                          className="w-1/3 px-2 py-1 border border-slate-200 rounded text-slate-700 text-xs"
                        />
                        <input
                          type="url"
                          placeholder="https://..."
                          value={lnk.url}
                          onChange={(e) => {
                            const updated = [...editLinks];
                            updated[idx].url = e.target.value;
                            setEditLinks(updated);
                          }}
                          className="flex-1 px-2 py-1 border border-slate-200 rounded text-slate-700 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...editLinks];
                            updated.splice(idx, 1);
                            setEditLinks(updated);
                          }}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditMode(false)}
                      className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer"
                    >
                      บันทึกแก้ไข
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div id="no-selected-employee-pane" className="text-center py-12 text-slate-400">
              <Eye className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-medium">กรุณาเลือกรายชื่อพนักงาน</p>
              <p className="text-[10px] text-slate-400 mt-1">เพื่อเปิดดูรายละเอียดประวัติและจัดการข้อมูล</p>
            </div>
          )}
        </div>

      </div>

      {/* Add Employee Slide/Over Modal Dialog */}
      {isAddOpen && (
        <div id="add-employee-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-sm border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-blue-600" /> ลงทะเบียนพนักงานใหม่
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-sm">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs text-slate-700">
              {/* Avatar Registration Section */}
              <div className="space-y-2 border-b border-slate-150 pb-3 mb-3">
                <span className="font-semibold text-slate-700 block">รูปประจำตัวพนักงาน (Avatar Profile)</span>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={newAvatar || PRESET_AVATARS[0]} 
                      alt="Avatar Preview" 
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm bg-slate-50"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full border border-white shadow-xs">
                      <Camera className="w-2.5 h-2.5" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="ลิงก์ URL รูปภาพ (.jpg, .png...)"
                        value={newAvatar}
                        onChange={(e) => setNewAvatar(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-[11px] font-mono bg-white text-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const id = Math.floor(Math.random() * 1000);
                          setNewAvatar(`https://images.unsplash.com/photo-${1500000000000 + id * 1000000}?w=150`);
                        }}
                        className="px-2 py-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-indigo-600 rounded-lg text-[10px] font-bold font-sans flex items-center gap-1 cursor-pointer transition"
                        title="สุ่มรูปภาพพนักงานใหม่"
                      >
                        <RefreshCw className="w-3 h-3" /> สุ่มรูป
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Preset Avatars list */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block">เลือกจากรูปภาพพนักงานสำเร็จรูป (Presets):</span>
                  <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-slate-200">
                    {PRESET_AVATARS.map((pUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewAvatar(pUrl)}
                        className={`relative shrink-0 w-8 h-8 rounded-full border-2 overflow-hidden transition-all duration-200 cursor-pointer ${
                          newAvatar === pUrl ? 'border-indigo-500 scale-105 shadow-xs' : 'border-slate-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={pUrl} alt={`Preset ${idx + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        {newAvatar === pUrl && (
                          <div className="absolute inset-0 bg-indigo-500/10 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white drop-shadow-sm font-black" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">ชื่อ-นามสกุล พนักงาน</label>
                <input
                  type="text"
                  placeholder="ตัวอย่าง: นายวิศรุต มงคลชัย"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-indigo-500 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">ตำแหน่งงาน</label>
                  <input
                    type="text"
                    placeholder="ตัวอย่าง: Full Stack Dev"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-indigo-500 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">แผนก / ฝ่ายงาน</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-indigo-500 text-xs bg-white"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product Design">Product Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Sales">Sales</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">อีเมลทำงาน</label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-indigo-500 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    placeholder="08X-XXX-XXXX"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">รูปแบบค่าจ้าง / เงินเดือน</label>
                  <select
                    value={newSalaryType}
                    onChange={(e) => setNewSalaryType(e.target.value as 'monthly' | 'daily')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-indigo-500 text-xs bg-white font-sans"
                  >
                    <option value="monthly">รายเดือน (Monthly)</option>
                    <option value="daily">รายวัน (Daily)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">อัตราเงิน (บาท)</label>
                  <input
                    type="number"
                    value={newSalary}
                    onChange={(e) => setNewSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-indigo-500 text-xs font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">วันทำงานต่อสัปดาห์</label>
                  <select
                    value={newWorkDays}
                    onChange={(e) => setNewWorkDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-indigo-500 text-xs bg-white"
                  >
                    <option value={4}>4 วัน/สัปดาห์</option>
                    <option value={5}>5 วัน/สัปดาห์</option>
                    <option value={6}>6 วัน/สัปดาห์</option>
                    <option value={7}>7 วัน/สัปดาห์</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">วันที่เริ่มทำงาน</label>
                  <input
                    type="date"
                    value={newJoinDate}
                    onChange={(e) => setNewJoinDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-indigo-500 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">บัญชีรับเงินเดือนธนาคาร</label>
                <input
                  type="text"
                  placeholder="เช่น กสิกรไทย 123-4-56789-0"
                  value={newBank}
                  onChange={(e) => setNewBank(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              {/* Related Links Section */}
              <div className="space-y-1.5 border-t border-slate-150 pt-3">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-700 text-xs block">ลิงก์ข้อมูลที่เกี่ยวข้อง (Linked Portals)</label>
                  <button
                    type="button"
                    onClick={() => setNewLinks([...newLinks, { label: '', url: '' }])}
                    className="text-[10px] text-blue-650 hover:text-blue-800 font-bold flex items-center gap-1"
                  >
                    <PlusCircle className="w-3 h-3" /> เพิ่มลิงก์
                  </button>
                </div>
                {newLinks.map((lnk, idx) => (
                  <div key={idx} className="flex gap-1.5 items-center">
                    <input
                      type="text"
                      placeholder="เช่น GitHub"
                      value={lnk.label}
                      onChange={(e) => {
                        const updated = [...newLinks];
                        updated[idx].label = e.target.value;
                        setNewLinks(updated);
                      }}
                      className="w-1/3 px-2 py-1 border border-slate-200 rounded text-slate-700 text-xs"
                    />
                    <input
                      type="url"
                      placeholder="https://..."
                      value={lnk.url}
                      onChange={(e) => {
                        const updated = [...newLinks];
                        updated[idx].url = e.target.value;
                        setNewLinks(updated);
                      }}
                      className="flex-1 px-2 py-1 border border-slate-200 rounded text-slate-700 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...newLinks];
                        updated.splice(idx, 1);
                        setNewLinks(updated);
                      }}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-mono font-bold uppercase tracking-wider shadow-xs transition cursor-pointer"
                >
                  ลงทะเบียนสำเร็จ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Deletion Warning Confirmation Modal */}
      {employeeToDelete && (
        <div id="delete-employee-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-red-600 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-red-600" /> ยืนยันการลบข้อมูลพนักงาน
              </h3>
              <button 
                onClick={() => setEmployeeToDelete(null)} 
                className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-red-50 border border-red-100 rounded-sm p-4 flex gap-3 text-red-800 text-xs">
                <div>
                  <p className="font-bold">⚠️ คำเตือนระบบความปลอดภัย:</p>
                  <p className="mt-1 leading-relaxed">
                    การดำเนินการนี้จะลบข้อมูลของ <strong>{employeeToDelete.name}</strong> ({employeeToDelete.id}) 
                    ออกจากฐานข้อมูลระบบทรัพยากรบุคคลโดยถาวร และจะไม่สามารถเรียกคืนข้อมูลประวัติการทำงานได้อีก
                  </p>
                </div>
              </div>

              <div className="border border-slate-100 rounded-sm p-3.5 text-xs text-slate-600 bg-slate-50/50 space-y-2">
                <p><strong>ชื่อ-นามสกุล:</strong> {employeeToDelete.name}</p>
                <p><strong>รหัสพนักงาน:</strong> {employeeToDelete.id}</p>
                <p><strong>ฝ่าย/แผนก:</strong> {employeeToDelete.department}</p>
                <p><strong>ฐานเงินเดือน:</strong> ฿{employeeToDelete.salary.toLocaleString()}</p>
                <p><strong>วันทำงานต่อสัปดาห์:</strong> {employeeToDelete.workDays || 5} วัน/สัปดาห์</p>
              </div>

              <p className="text-[11px] text-slate-400 text-center">
                กรุณาตรวจสอบรายละเอียดความถูกต้องก่อนกดยืนยันเพื่อป้องกันความผิดพลาด
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
                className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteEmployee(employeeToDelete.id);
                  if (selectedEmployee?.id === employeeToDelete.id) {
                    setSelectedEmployee(null);
                  }
                  setEmployeeToDelete(null);
                  setIsEditMode(false);
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-sm text-xs font-mono font-bold uppercase tracking-wider shadow-sm transition cursor-pointer"
              >
                ยืนยันลบพนักงาน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
