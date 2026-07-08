import React, { useState, useMemo } from 'react';
import { LeaveRequest, Employee } from '../types';
import { 
  BarChart3, 
  Calendar, 
  Users, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface LeaveStatisticsProps {
  leaves: LeaveRequest[];
  employees: Employee[];
}

export default function LeaveStatistics({ leaves, employees }: LeaveStatisticsProps) {
  // Filter States
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Thai months for display and filtering
  const THAI_MONTHS_FULL = [
    { value: '01', name: 'มกราคม' },
    { value: '02', name: 'กุมภาพันธ์' },
    { value: '03', name: 'มีนาคม' },
    { value: '04', name: 'เมษายน' },
    { value: '05', name: 'พฤษภาคม' },
    { value: '06', name: 'มิถุนายน' },
    { value: '07', name: 'กรกฎาคม' },
    { value: '08', name: 'สิงหาคม' },
    { value: '09', name: 'กันยายน' },
    { value: '10', name: 'ตุลาคม' },
    { value: '11', name: 'พฤศจิกายน' },
    { value: '12', name: 'ธันวาคม' }
  ];

  const yearsList = useMemo(() => {
    const years = new Set<string>();
    // Default current and around years
    years.add('2026');
    years.add('2025');
    leaves.forEach(l => {
      if (l.startDate) {
        const year = l.startDate.split('-')[0];
        if (year && year.length === 4) {
          years.add(year);
        }
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [leaves]);

  const departmentsList = useMemo(() => {
    const depts = new Set<string>();
    employees.forEach(e => {
      if (e.department) {
        depts.add(e.department);
      }
    });
    return Array.from(depts).sort();
  }, [employees]);

  // Translate leave type to beautiful Thai term
  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'sick': return 'ลาป่วย (Sick)';
      case 'personal': return 'ลากิจ (Personal)';
      case 'annual': return 'ลาพักร้อน (Annual)';
      case 'other': return 'ลาอื่นๆ (Other)';
      default: return 'ไม่ระบุ';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'sick': return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', fill: '#f97316' };
      case 'personal': return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', fill: '#f59e0b' };
      case 'annual': return { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200', fill: '#0ea5e9' };
      default: return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', fill: '#64748b' };
    }
  };

  // 1. FILTERED LEAVES (ONLY APPROVED FOR STATISTICS)
  const statsLeaves = useMemo(() => {
    return leaves.filter(l => {
      if (l.status !== 'approved') return false;
      
      // Filter by Year
      if (l.startDate) {
        const year = l.startDate.split('-')[0];
        if (year !== selectedYear) return false;
      } else {
        return false;
      }

      // Filter by Month
      if (selectedMonth !== 'All') {
        const month = l.startDate.split('-')[1];
        if (month !== selectedMonth) return false;
      }

      // Filter by Department
      if (selectedDept !== 'All') {
        const emp = employees.find(e => e.id === l.employeeId);
        if (!emp || emp.department !== selectedDept) return false;
      }

      // Filter by search query (Employee name / ID)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName = l.employeeName.toLowerCase().includes(q);
        const matchesId = l.employeeId.toLowerCase().includes(q);
        const matchesReason = l.reason && l.reason.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesReason) return false;
      }

      return true;
    });
  }, [leaves, employees, selectedYear, selectedMonth, selectedDept, searchQuery]);

  // 2. MAIN KPI CALCULATIONS
  const summaryKPIs = useMemo(() => {
    const totalDays = statsLeaves.reduce((sum, item) => sum + (item.days || 1), 0);
    const count = statsLeaves.length;
    
    // Group by leave type
    let sickDays = 0;
    let personalDays = 0;
    let annualDays = 0;
    let otherDays = 0;

    statsLeaves.forEach(l => {
      const d = l.days || 1;
      if (l.type === 'sick') sickDays += d;
      else if (l.type === 'personal') personalDays += d;
      else if (l.type === 'annual') annualDays += d;
      else otherDays += d;
    });

    const activeEmployeesCount = selectedDept === 'All' 
      ? employees.length 
      : employees.filter(e => e.department === selectedDept).length;

    const avgLeavePerEmployee = activeEmployeesCount > 0 
      ? (totalDays / activeEmployeesCount).toFixed(1)
      : '0.0';

    // Find top leave type
    const typesArray = [
      { type: 'sick', days: sickDays, label: 'ลาป่วย' },
      { type: 'personal', days: personalDays, label: 'ลากิจ' },
      { type: 'annual', days: annualDays, label: 'ลาพักร้อน' },
      { type: 'other', days: otherDays, label: 'ลาอื่นๆ' }
    ];
    const topTypeObj = [...typesArray].sort((a, b) => b.days - a.days)[0];
    const topTypeLabel = totalDays > 0 ? `${topTypeObj.label} (${Math.round((topTypeObj.days / totalDays) * 100)}%)` : 'ไม่มีประวัติ';

    return {
      totalDays,
      count,
      sickDays,
      personalDays,
      annualDays,
      otherDays,
      avgLeavePerEmployee,
      topTypeLabel,
      activeEmployeesCount
    };
  }, [statsLeaves, employees, selectedDept]);

  // 3. MONTHLY DISTRIBUTION FOR SVG BAR CHART
  const monthlyChartData = useMemo(() => {
    const monthsData = THAI_MONTHS_FULL.map(m => ({
      value: m.value,
      name: m.name,
      sick: 0,
      personal: 0,
      annual: 0,
      other: 0,
      total: 0
    }));

    leaves
      .filter(l => {
        if (l.status !== 'approved') return false;
        const year = l.startDate.split('-')[0];
        if (year !== selectedYear) return false;
        if (selectedDept !== 'All') {
          const emp = employees.find(e => e.id === l.employeeId);
          if (!emp || emp.department !== selectedDept) return false;
        }
        return true;
      })
      .forEach(l => {
        const month = l.startDate.split('-')[1];
        const d = l.days || 1;
        const monthObj = monthsData.find(m => m.value === month);
        if (monthObj) {
          if (l.type === 'sick') monthObj.sick += d;
          else if (l.type === 'personal') monthObj.personal += d;
          else if (l.type === 'annual') monthObj.annual += d;
          else monthObj.other += d;
          monthObj.total += d;
        }
      });

    return monthsData;
  }, [leaves, selectedYear, selectedDept, THAI_MONTHS_FULL, employees]);

  // Max value for chart scaling
  const maxMonthlyValue = useMemo(() => {
    const maxVal = Math.max(...monthlyChartData.map(m => m.total), 5);
    return Math.ceil(maxVal / 5) * 5; // Round to nearest multiple of 5
  }, [monthlyChartData]);

  // 4. DEPARTMENTAL DISTRIBUTION
  const departmentStats = useMemo(() => {
    const depts = departmentsList.map(dName => {
      const deptEmployees = employees.filter(e => e.department === dName);
      const deptEmpIds = deptEmployees.map(e => e.id);
      
      const deptLeaves = leaves.filter(l => {
        return l.status === 'approved' && 
               deptEmpIds.includes(l.employeeId) && 
               l.startDate.startsWith(selectedYear) &&
               (selectedMonth === 'All' || l.startDate.split('-')[1] === selectedMonth);
      });

      const totalDays = deptLeaves.reduce((sum, l) => sum + (l.days || 1), 0);
      const avgPerPerson = deptEmployees.length > 0 ? (totalDays / deptEmployees.length).toFixed(1) : '0.0';

      return {
        department: dName,
        headcount: deptEmployees.length,
        totalLeaves: deptLeaves.length,
        totalDays,
        avgPerPerson
      };
    });

    return depts.sort((a, b) => b.totalDays - a.totalDays);
  }, [leaves, employees, selectedYear, selectedMonth, departmentsList]);

  // 5. EMPLOYEE LEAVE LEADERBOARD (Top 10)
  const employeeLeaderboard = useMemo(() => {
    const empLeaveMap: { [id: string]: { employeeName: string; department: string; sick: number; personal: number; annual: number; other: number; total: number } } = {};

    statsLeaves.forEach(l => {
      const emp = employees.find(e => e.id === l.employeeId);
      const deptName = emp?.department || 'Engineering';
      
      if (!empLeaveMap[l.employeeId]) {
        empLeaveMap[l.employeeId] = {
          employeeName: l.employeeName,
          department: deptName,
          sick: 0,
          personal: 0,
          annual: 0,
          other: 0,
          total: 0
        };
      }

      const d = l.days || 1;
      empLeaveMap[l.employeeId].total += d;
      if (l.type === 'sick') empLeaveMap[l.employeeId].sick += d;
      else if (l.type === 'personal') empLeaveMap[l.employeeId].personal += d;
      else if (l.type === 'annual') empLeaveMap[l.employeeId].annual += d;
      else empLeaveMap[l.employeeId].other += d;
    });

    // Also include any employees with 0 leaves if filtering is empty to show something
    if (Object.keys(empLeaveMap).length === 0 && searchQuery === '') {
      employees.slice(0, 5).forEach(e => {
        empLeaveMap[e.id] = {
          employeeName: e.name,
          department: e.department || 'Engineering',
          sick: 0,
          personal: 0,
          annual: 0,
          other: 0,
          total: 0
        };
      });
    }

    return Object.values(empLeaveMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [statsLeaves, employees, searchQuery]);

  return (
    <div id="leave-stats-container" className="space-y-6">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-sm p-5 shadow-2xs no-print">
        <div className="space-y-1">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest font-sans flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-xs">
              <BarChart3 className="w-4 h-4" />
            </span>
            สถิติการลางานพนักงาน (Leave Statistics & Analytics)
          </h2>
          <p className="text-[11px] text-slate-500 font-sans">
            วิเคราะห์แนวโน้มการลางาน อัตราการลาเฉลี่ย และสถิติแยกตามแผนกงานประจำปีงบประมาณ พ.ศ. {parseInt(selectedYear, 10) + 543}
          </p>
        </div>
        
        {/* QUICK RESET FILTERS */}
        <button 
          onClick={() => {
            setSelectedYear('2026');
            setSelectedMonth('All');
            setSelectedDept('All');
            setSearchQuery('');
          }}
          className="px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 rounded bg-slate-50 transition font-sans shrink-0 cursor-pointer"
        >
          รีเซ็ตตัวกรองทั้งหมด
        </button>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-2xs no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* YEAR SELECTOR */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase font-sans">เลือกปีการบัญชี (Year)</label>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-sans"
          >
            {yearsList.map(y => (
              <option key={y} value={y}>พ.ศ. {parseInt(y, 10) + 543} (ค.ศ. {y})</option>
            ))}
          </select>
        </div>

        {/* MONTH SELECTOR */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase font-sans">เลือกเดือน (Month)</label>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-sans"
          >
            <option value="All">ทุกเดือน (All Months)</option>
            {THAI_MONTHS_FULL.map(m => (
              <option key={m.value} value={m.value}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* DEPARTMENT SELECTOR */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase font-sans">เลือกแผนก/ฝ่าย (Department)</label>
          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-sans"
          >
            <option value="All">ทุกแผนกพนักงาน (All Departments)</option>
            {departmentsList.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* SEARCH BOX */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase font-sans">ค้นหาพนักงาน / เหตุผล</label>
          <div className="relative">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นด้วยชื่อ, รหัส หรือเหตุผล..."
              className="w-full bg-slate-50 border border-slate-200 rounded pl-8 pr-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-sans"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* KPI SUMMARIES CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI CARD 1: TOTAL LEAVE DAYS */}
        <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">จำนวนวันลาอนุมัติรวม</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono block">
              {summaryKPIs.totalDays} <span className="text-xs font-semibold text-slate-500 font-sans">วัน</span>
            </span>
            <span className="text-[9px] text-slate-500 block font-sans">
              จากการอนุมัติทั้งหมด <strong className="font-mono text-slate-700">{summaryKPIs.count}</strong> ครั้ง
            </span>
          </div>
          <div className="p-3 bg-blue-50 rounded-sm text-blue-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* KPI CARD 2: AVERAGE LEAVE RATE */}
        <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">อัตราการลาเฉลี่ยพนักงาน</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono block">
              {summaryKPIs.avgLeavePerEmployee} <span className="text-xs font-semibold text-slate-500 font-sans">วัน/คน</span>
            </span>
            <span className="text-[9px] text-slate-500 block font-sans">
              จากพนักงานในตัวกรอง <strong className="font-mono text-slate-700">{summaryKPIs.activeEmployeesCount}</strong> คน
            </span>
          </div>
          <div className="p-3 bg-violet-50 rounded-sm text-violet-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* KPI CARD 3: MOST POPULAR TYPE */}
        <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ประเภทการลายอดนิยม</span>
            <span className="text-xs font-extrabold text-slate-900 block truncate max-w-[160px] py-1">
              {summaryKPIs.topTypeLabel}
            </span>
            <span className="text-[9px] text-slate-500 block font-sans">
              มีสัดส่วนวันลาสูงสุดในเกณฑ์คัดกรอง
            </span>
          </div>
          <div className="p-3 bg-amber-50 rounded-sm text-amber-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* KPI CARD 4: CRITICAL RATE ALERT */}
        <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">อัตราลากิจ/ลาป่วยสะสม</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono block">
              {summaryKPIs.totalDays > 0 ? Math.round(((summaryKPIs.sickDays + summaryKPIs.personalDays) / summaryKPIs.totalDays) * 100) : 0}%
            </span>
            <span className="text-[9px] text-rose-500 block font-sans font-bold">
              ลาป่วย {summaryKPIs.sickDays} วัน | ลากิจ {summaryKPIs.personalDays} วัน
            </span>
          </div>
          <div className="p-3 bg-rose-50 rounded-sm text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID: CHART & TYPE BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: MONTHLY TRENDS (SVG CHART) */}
        <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-xs lg:col-span-8 flex flex-col justify-between">
          <div className="space-y-1 mb-5">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest font-sans flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" /> แผนภูมิแนวโน้มจำนวนวันลาสะสมรายเดือน
            </h3>
            <p className="text-[10px] text-slate-400 font-sans">
              เปรียบเทียบสัดส่วนของประเภทการลา (ลาป่วย ลากิจ ลาพักร้อน) ตลอดปีงบประมาณ พ.ศ. {parseInt(selectedYear, 10) + 543}
            </p>
          </div>

          {/* CUSTOM BEAUTIFUL RESPONSIVE SVG GRAPH */}
          <div className="relative w-full h-64 border-b border-slate-100 flex items-end justify-between px-2 pt-6">
            {/* Grid background lines */}
            <div className="absolute inset-x-0 top-0 h-full flex flex-col justify-between pointer-events-none pb-[1px]">
              {[...Array(5)].map((_, i) => {
                const val = Math.round((maxMonthlyValue * (4 - i)) / 4);
                return (
                  <div key={i} className="w-full border-t border-slate-100/70 flex items-start justify-between relative h-0">
                    <span className="absolute -top-2 left-0 text-[8px] font-mono font-bold text-slate-400 bg-white pr-1">
                      {val} วัน
                    </span>
                  </div>
                );
              })}
            </div>

            {/* MONTHLY SVG BARS */}
            <div className="w-full h-full flex items-end justify-around z-10 pl-6">
              {monthlyChartData.map((m) => {
                // Height calculation
                const totalHeightPercent = maxMonthlyValue > 0 ? (m.total / maxMonthlyValue) * 80 : 0; // max 80% to avoid overflow
                const sickHeight = m.total > 0 ? (m.sick / m.total) * 100 : 0;
                const personalHeight = m.total > 0 ? (m.personal / m.total) * 100 : 0;
                const annualHeight = m.total > 0 ? (m.annual / m.total) * 100 : 0;
                const otherHeight = m.total > 0 ? (m.other / m.total) * 100 : 0;

                const isCurrentMonth = selectedMonth === m.value;

                return (
                  <div 
                    key={m.value} 
                    onClick={() => setSelectedMonth(selectedMonth === m.value ? 'All' : m.value)}
                    className={`flex flex-col items-center group cursor-pointer w-full max-w-[28px] transition-all duration-200 ${
                      isCurrentMonth ? 'scale-110' : ''
                    }`}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[9px] font-mono p-2 rounded shadow-lg z-30 transition pointer-events-none w-28 text-center space-y-0.5">
                      <p className="font-sans font-bold text-blue-400">{m.name}</p>
                      <p className="border-b border-slate-800 pb-1 mb-1">รวม: {m.total} วัน</p>
                      <p className="text-orange-400">ป่วย: {m.sick} วัน</p>
                      <p className="text-amber-400">กิจ: {m.personal} วัน</p>
                      <p className="text-sky-400">พักร้อน: {m.annual} วัน</p>
                      {m.other > 0 && <p className="text-slate-400 font-sans">อื่นๆ: {m.other} วัน</p>}
                    </div>

                    {/* Stacked bar */}
                    {m.total > 0 ? (
                      <div 
                        className={`w-4 rounded-t-xs overflow-hidden flex flex-col justify-end transition-all ${
                          isCurrentMonth ? 'ring-2 ring-blue-500 ring-offset-2' : 'group-hover:opacity-90'
                        }`}
                        style={{ height: `${Math.max(totalHeightPercent, 2)}%` }}
                      >
                        <div className="bg-slate-500" style={{ height: `${otherHeight}%` }} title="อื่นๆ" />
                        <div className="bg-sky-500" style={{ height: `${annualHeight}%` }} title="ลาพักร้อน" />
                        <div className="bg-amber-500" style={{ height: `${personalHeight}%` }} title="ลากิจ" />
                        <div className="bg-orange-500" style={{ height: `${sickHeight}%` }} title="ลาป่วย" />
                      </div>
                    ) : (
                      <div className="w-4 h-1 bg-slate-100 rounded-t-xs" />
                    )}

                    {/* Label */}
                    <span className={`text-[8.5px] font-bold mt-2 font-sans truncate max-w-full text-center ${
                      isCurrentMonth ? 'text-blue-600' : 'text-slate-400'
                    }`}>
                      {m.name.substring(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart Legend */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-4 text-[9.5px] font-bold text-slate-500 font-sans">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-orange-500"></span>
              <span>ลาป่วย / Sick</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500"></span>
              <span>ลากิจ / Personal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-sky-500"></span>
              <span>ลาพักร้อน / Annual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-500"></span>
              <span>อื่นๆ / Other</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED TYPE BREAKDOWN (METRICS & CIRCLES) */}
        <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-xs lg:col-span-4 space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest font-sans">สัดส่วนตามประเภทการลา</h3>
            <p className="text-[10px] text-slate-400 font-sans">จำนวนวันลาสะสมจำแนกและคำนวณร้อยละ</p>
          </div>

          <div className="space-y-4 pt-2">
            {/* sick */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  ลาป่วย (Sick Leave)
                </span>
                <span className="font-mono">
                  {summaryKPIs.sickDays} วัน ({summaryKPIs.totalDays > 0 ? Math.round((summaryKPIs.sickDays / summaryKPIs.totalDays) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-orange-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${summaryKPIs.totalDays > 0 ? (summaryKPIs.sickDays / summaryKPIs.totalDays) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-[9px] text-slate-400 italic">การเจ็บไข้ได้ป่วย ทางการแพทย์ หรือใบรับรองแพทย์</p>
            </div>

            {/* personal */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  ลากิจ (Personal Leave)
                </span>
                <span className="font-mono">
                  {summaryKPIs.personalDays} วัน ({summaryKPIs.totalDays > 0 ? Math.round((summaryKPIs.personalDays / summaryKPIs.totalDays) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${summaryKPIs.totalDays > 0 ? (summaryKPIs.personalDays / summaryKPIs.totalDays) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-[9px] text-slate-400 italic">การทำธุระส่วนตัว ครอบครัว หรือเหตุจำเป็นที่ไม่สามารถเลี่ยงได้</p>
            </div>

            {/* annual */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  ลาพักร้อน (Annual Vacation)
                </span>
                <span className="font-mono">
                  {summaryKPIs.annualDays} วัน ({summaryKPIs.totalDays > 0 ? Math.round((summaryKPIs.annualDays / summaryKPIs.totalDays) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-sky-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${summaryKPIs.totalDays > 0 ? (summaryKPIs.annualDays / summaryKPIs.totalDays) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-[9px] text-slate-400 italic">การหยุดพักผ่อนประจำปีที่ได้รับการสะสมตามกฎเกณฑ์บริษัท</p>
            </div>

            {/* other */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                  ลาอื่นๆ (Other Leave)
                </span>
                <span className="font-mono">
                  {summaryKPIs.otherDays} วัน ({summaryKPIs.totalDays > 0 ? Math.round((summaryKPIs.otherDays / summaryKPIs.totalDays) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-slate-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${summaryKPIs.totalDays > 0 ? (summaryKPIs.otherDays / summaryKPIs.totalDays) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-[9px] text-slate-400 italic">การลากิจเพื่อฝึกทหาร ลารับปริญญา ลาคลอด หรือสิทธิทางกฎหมายอื่นๆ</p>
            </div>
          </div>
        </div>

      </div>

      {/* DEPARTMENTAL STATISTICS GRID */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-xs space-y-4">
        <div className="space-y-1">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest font-sans">เปรียบเทียบสถิติการลางานระหว่างแผนก (Departmental Breakdown)</h3>
          <p className="text-[10px] text-slate-400 font-sans">จำนวนพนักงาน อัตราการลาทั้งหมด และอัตราการลาเฉลี่ยรายบุคคลแยกแผนก</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1">
          {departmentStats.map((dept, index) => {
            const colors = [
              { border: 'border-l-blue-500', bg: 'bg-blue-50/10' },
              { border: 'border-l-indigo-500', bg: 'bg-indigo-50/10' },
              { border: 'border-l-violet-500', bg: 'bg-violet-50/10' },
              { border: 'border-l-purple-500', bg: 'bg-purple-50/10' },
              { border: 'border-l-teal-500', bg: 'bg-teal-50/10' }
            ];
            const activeColor = colors[index % colors.length];

            return (
              <div 
                key={dept.department}
                className={`border-l-4 ${activeColor.border} ${activeColor.bg} border border-slate-200 rounded-sm p-3.5 space-y-3 shadow-3xs hover:shadow-2xs transition`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-black text-slate-800 font-sans truncate" title={dept.department}>
                    {dept.department}
                  </span>
                  <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full shrink-0">
                    {dept.headcount} คน
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 font-sans block leading-none">วันลาสะสม</span>
                    <strong className="text-sm font-extrabold text-slate-800 font-mono">{dept.totalDays} <span className="text-[9px] font-semibold font-sans text-slate-500">วัน</span></strong>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <span className="text-[9px] text-slate-400 font-sans block leading-none">เฉลี่ยต่อคน</span>
                    <strong className="text-sm font-extrabold text-blue-600 font-mono">{dept.avgPerPerson} <span className="text-[9px] font-semibold font-sans text-blue-500">วัน</span></strong>
                  </div>
                </div>
                <div className="text-[9.5px] text-slate-500 font-sans border-t border-slate-100 pt-1.5">
                  ยื่นใบลาสำเร็จ <strong className="font-mono text-slate-700">{dept.totalLeaves}</strong> ฉบับ
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* LEADERBOARD & TRANSACTION RECORDS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEADERBOARD: TOP 10 ABSENTEES */}
        <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-xs lg:col-span-5 space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest font-sans flex items-center gap-1.5">
              🏆 ทำเนียบสถิติวันลาสะสมสูงสุด 10 อันดับแรก
            </h3>
            <p className="text-[10px] text-slate-400 font-sans">รายชื่อพนักงานที่มีสถิติวันลาสะสมสูงสุดในรอบการบัญชีนี้</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[9px] font-mono font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-2 px-1">อันดับ</th>
                  <th className="py-2 px-2">พนักงาน</th>
                  <th className="py-2 px-2 text-center">ป่วย</th>
                  <th className="py-2 px-2 text-center">กิจ</th>
                  <th className="py-2 px-2 text-center">พักร้อน</th>
                  <th className="py-2 px-2 text-right">รวมสะสม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employeeLeaderboard.map((emp, idx) => {
                  return (
                    <tr key={idx} className="hover:bg-slate-50/40 transition">
                      <td className="py-2.5 px-1 text-center font-mono font-bold text-slate-500 text-[10.5px]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="block font-semibold text-slate-800 font-sans leading-none">{emp.employeeName}</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">{emp.department}</span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-orange-600 font-bold bg-orange-50/20 text-[10.5px]">
                        {emp.sick}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-amber-600 font-bold bg-amber-50/20 text-[10.5px]">
                        {emp.personal}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-sky-600 font-bold bg-sky-50/20 text-[10.5px]">
                        {emp.annual}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-extrabold text-blue-600 text-[11px]">
                        {emp.total} วัน
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RECENT LEAVE ACTIVITY LOG */}
        <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-xs lg:col-span-7 space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest font-sans flex items-center gap-1.5">
              📋 บันทึกประวัติและรายการใบลา (Filtered Records)
            </h3>
            <p className="text-[10px] text-slate-400 font-sans">
              แสดงรายการใบลาที่ได้รับอนุมัติทั้งหมดตามตัวกรองคัดสรรด้านบน (พบทั้งหมด <strong className="font-mono text-blue-600">{statsLeaves.length}</strong> รายการ)
            </p>
          </div>

          <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[9px] font-mono font-bold uppercase tracking-wider border-b border-slate-100 sticky top-0 bg-white">
                  <th className="py-2.5 px-3">พนักงาน</th>
                  <th className="py-2.5 px-3">ประเภทการลา</th>
                  <th className="py-2.5 px-3">ช่วงวันที่หยุด</th>
                  <th className="py-2.5 px-3 text-right">จำนวนวัน</th>
                  <th className="py-2.5 px-3">เหตุผลการลา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statsLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-[11px] font-sans italic">
                      ไม่พบประวัติการลาที่สอดคล้องกับตัวกรองที่เลือก
                    </td>
                  </tr>
                ) : (
                  statsLeaves.map(leave => {
                    const colors = getLeaveTypeColor(leave.type);
                    return (
                      <tr key={leave.id} className="hover:bg-slate-50/30 transition text-[11px]">
                        <td className="py-2.5 px-3">
                          <span className="block font-semibold text-slate-800 font-sans leading-none">{leave.employeeName}</span>
                          <span className="text-[9px] font-mono text-slate-400 block mt-0.5">ID: {leave.employeeId}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-sm font-sans font-bold text-[9px] border ${colors.bg} ${colors.text} ${colors.border}`}>
                            {getLeaveTypeLabel(leave.type)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="block font-mono font-semibold text-slate-600">{leave.startDate}</span>
                          <span className="text-[9px] text-slate-400 block font-mono">ถึง {leave.endDate}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700">
                          {leave.days} วัน
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-sans italic max-w-[150px] truncate" title={leave.reason}>
                          {leave.reason}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
