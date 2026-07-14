import React, { useState, useEffect, useMemo } from 'react';
import { Employee, LeaveRequest, AttendanceStatus, DailyAttendance, DayOffSwap } from '../types';
import { 
  Calendar, Users, Check, X, AlertCircle, Plus, Edit2, Trash2, 
  Clock, ArrowLeftRight, Filter, CalendarDays, CheckCircle2, 
  XCircle, Settings, Download, Info, Search, HelpCircle, Save, Printer 
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AttendanceManagementProps {
  employees: Employee[];
  leaves: LeaveRequest[];
  attendanceRecords: { [employeeId: string]: { [date: string]: DailyAttendance } };
  onUpdateAttendance: (employeeId: string, date: string, attendance: DailyAttendance) => void;
  dayOffSwaps: DayOffSwap[];
  onAddDayOffSwap: (swap: DayOffSwap) => void;
  onUpdateDayOffSwapStatus: (id: string, status: 'approved' | 'rejected') => void;
  onDeleteDayOffSwap: (id: string) => void;
}

// Thai months list
const THAI_MONTHS = [
  { value: 1, label: 'มกราคม' },
  { value: 2, label: 'กุมภาพันธ์' },
  { value: 3, label: 'มีนาคม' },
  { value: 4, label: 'เมษายน' },
  { value: 5, label: 'พฤษภาคม' },
  { value: 6, label: 'มิถุนายน' },
  { value: 7, label: 'กรกฎาคม' },
  { value: 8, label: 'สิงหาคม' },
  { value: 9, label: 'กันยายน' },
  { value: 10, label: 'ตุลาคม' },
  { value: 11, label: 'พฤศจิกายน' },
  { value: 12, label: 'ธันวาคม' }
];

export default function AttendanceManagement({
  employees,
  leaves,
  attendanceRecords,
  onUpdateAttendance,
  dayOffSwaps,
  onAddDayOffSwap,
  onUpdateDayOffSwapStatus,
  onDeleteDayOffSwap
}: AttendanceManagementProps) {
  // Navigation & Filter States
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1); // 1-indexed
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  
  // UI Tab State within Attendance component
  const [activeSubTab, setActiveSubTab] = useState<'grid' | 'timeline' | 'swaps' | 'charts' | 'holidays'>('grid');

  // Daily Timeline State
  const [timelineDate, setTimelineDate] = useState<string>('2026-07-02');
  const [timelineSearch, setTimelineSearch] = useState<string>('');
  const [timelineDeptFilter, setTimelineDeptFilter] = useState<string>('All');

  // Timeline Entry Edit Modal
  const [editingTimelineRecord, setEditingTimelineRecord] = useState<{
    employeeId: string;
    employeeName: string;
    date: string;
    status: AttendanceStatus;
    clockIn: string;
    clockOut: string;
    lateMinutes: number;
    notes: string;
  } | null>(null);

  // Modals
  const [editingCell, setEditingCell] = useState<{ employeeId: string; date: string; status: AttendanceStatus; lateMinutes: number; notes: string } | null>(null);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);

  // Day Off Swap Form State
  const [swapEmployeeId, setSwapEmployeeId] = useState(employees[0]?.id || '');
  const [swapOriginalDate, setSwapOriginalDate] = useState('');
  const [swapNewDate, setSwapNewDate] = useState('');
  const [swapReason, setSwapReason] = useState('');

  // Weekly Off-Days & Public Holidays Config (stored locally for instant preview / persistence)
  const [weeklyOffDays, setWeeklyOffDays] = useState<number[]>([0, 6]); // Default: 0 = Sunday, 6 = Saturday
  const [publicHolidays, setPublicHolidays] = useState<{ [date: string]: string }>({
    '2026-01-01': 'วันขึ้นปีใหม่',
    '2026-04-13': 'วันสงกรานต์',
    '2026-04-14': 'วันสงกรานต์',
    '2026-04-15': 'วันสงกรานต์',
    '2026-05-01': 'วันแรงงานแห่งชาติ',
    '2026-06-03': 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี',
    '2026-07-28': 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว',
    '2026-12-05': 'วันคล้ายวันพระบรมราชสมภพ รัชกาลที่ 9 / วันพ่อแห่งชาติ',
    '2026-12-31': 'วันสิ้นปี'
  });
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');

  // Get days in the selected month
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth, 0).getDate();
  }, [currentYear, currentMonth]);

  // Generate array of days: [1, 2, ..., 31]
  const daysArray = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [daysInMonth]);

  // Helper to format date as YYYY-MM-DD safely
  const getFormattedDateString = (day: number) => {
    const mm = String(currentMonth).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${currentYear}-${mm}-${dd}`;
  };

  // Helper to check if a date is a weekend (based on weeklyOffDays)
  const isWeekend = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return weeklyOffDays.includes(d.getDay());
  };

  // Extract unique departments for filter
  const departments = useMemo(() => {
    return ['All', ...Array.from(new Set(employees.map(e => e.department)))];
  }, [employees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            emp.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = deptFilter === 'All' || emp.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [employees, searchQuery, deptFilter]);

  // Sync Form's default employee when employees list updates
  useEffect(() => {
    if (employees.length > 0 && !swapEmployeeId) {
      setSwapEmployeeId(employees[0].id);
    }
  }, [employees, swapEmployeeId]);

  // Get approved leaves on a specific date for a specific employee
  const getApprovedLeaveOnDate = (empId: string, dateStr: string): LeaveRequest | undefined => {
    return leaves.find(leave => 
      leave.employeeId === empId && 
      leave.status === 'approved' && 
      dateStr >= leave.startDate && 
      dateStr <= leave.endDate
    );
  };

  // Get active day off swaps on a specific date for an employee
  const getApprovedSwapOnDate = (empId: string, dateStr: string): DayOffSwap | undefined => {
    return dayOffSwaps.find(swap => 
      swap.employeeId === empId && 
      swap.status === 'approved' && 
      (swap.originalOffDate === dateStr || swap.swappedOffDate === dateStr)
    );
  };

  // Resolve final attendance status for an employee on a date
  const resolveAttendanceStatus = (empId: string, dateStr: string): { status: AttendanceStatus; lateMinutes?: number; notes?: string; source: 'manual' | 'leave' | 'holiday' | 'swap' | 'default' } => {
    // 1. Check manual override records first
    const record = attendanceRecords[empId]?.[dateStr];
    if (record) {
      return { 
        status: record.status, 
        lateMinutes: record.lateMinutes, 
        notes: record.notes, 
        source: 'manual' 
      };
    }

    // 2. Check approved leave requests
    const leave = getApprovedLeaveOnDate(empId, dateStr);
    if (leave) {
      let typeNote = "ลาป่วย";
      if (leave.type === "personal") typeNote = "ลากิจ";
      else if (leave.type === "annual") typeNote = "ลาพักร้อน";
      else if (leave.type === "other") typeNote = "ลาอื่นๆ";
      return { 
        status: 'leave', 
        notes: `${typeNote}: ${leave.reason}`, 
        source: 'leave' 
      };
    }

    // 3. Check approved Day-Off swaps
    const approvedSwap = getApprovedSwapOnDate(empId, dateStr);
    if (approvedSwap) {
      if (approvedSwap.swappedOffDate === dateStr) {
        // This is the new day off!
        return { 
          status: 'swap_off', 
          notes: `สลับวันหยุด: หยุดชดเชยที่ทำงานเมื่อ ${approvedSwap.originalOffDate} (${approvedSwap.reason})`, 
          source: 'swap' 
        };
      }
      if (approvedSwap.originalOffDate === dateStr) {
        // This was the original day off, but now they worked!
        // Default to present for the swap day
        return { 
          status: 'present', 
          notes: `ทำงานสลับวันหยุด: ชดเชยไปหยุดวันที่ ${approvedSwap.swappedOffDate} (${approvedSwap.reason})`, 
          source: 'swap' 
        };
      }
    }

    // 4. Check Public Holidays
    if (publicHolidays[dateStr]) {
      return { 
        status: 'holiday', 
        notes: `วันหยุด: ${publicHolidays[dateStr]}`, 
        source: 'holiday' 
      };
    }

    // 5. Check weekends / Weekly Off-Days
    if (isWeekend(dateStr)) {
      const d = new Date(dateStr + "T00:00:00");
      const dayName = d.toLocaleDateString('th-TH', { weekday: 'long' });
      return { 
        status: 'holiday', 
        notes: `วันหยุดประจำสัปดาห์ (${dayName})`, 
        source: 'holiday' 
      };
    }

    // Default to Present for normal working days
    return { 
      status: 'present', 
      source: 'default' 
    };
  };

  // Pre-calculate aggregate metrics for the selected month and year for charts
  const chartData = useMemo(() => {
    // 1. Overall Status Breakdown
    let presentCount = 0;
    let lateCount = 0;
    let leaveCount = 0;
    let absentCount = 0;
    let holidayCount = 0;
    let swapOffCount = 0;

    // 2. Daily Trends
    const dailyTrends: { day: string; "มาปกติ": number; "มาสาย": number; "ลา": number; "ขาด": number; "วันหยุด/สลับ": number }[] = [];

    // 3. Employee breakdown
    const employeeMetrics: { [id: string]: { name: string; dept: string; present: number; late: number; leave: number; absent: number; lateMinutes: number } } = {};
    employees.forEach(emp => {
      employeeMetrics[emp.id] = {
        name: emp.name,
        dept: emp.department,
        present: 0,
        late: 0,
        leave: 0,
        absent: 0,
        lateMinutes: 0
      };
    });

    // 4. Department breakdown
    const deptMetrics: { [dept: string]: { name: string; present: number; late: number; leave: number; absent: number; total: number } } = {};

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = getFormattedDateString(day);
      let dayPresent = 0;
      let dayLate = 0;
      let dayLeave = 0;
      let dayAbsent = 0;
      let dayOff = 0;

      employees.forEach(emp => {
        const resolved = resolveAttendanceStatus(emp.id, dateStr);
        const status = resolved.status;
        const metrics = employeeMetrics[emp.id];

        if (metrics) {
          if (status === 'present') {
            metrics.present++;
            presentCount++;
            dayPresent++;
          } else if (status === 'late') {
            metrics.late++;
            metrics.lateMinutes += resolved.lateMinutes || 0;
            lateCount++;
            dayLate++;
          } else if (status === 'leave') {
            metrics.leave++;
            leaveCount++;
            dayLeave++;
          } else if (status === 'absent') {
            metrics.absent++;
            absentCount++;
            dayAbsent++;
          } else if (status === 'holiday') {
            holidayCount++;
            dayOff++;
          } else if (status === 'swap_off') {
            swapOffCount++;
            dayOff++;
          }
        }

        // Department tracking
        const dept = emp.department;
        if (!deptMetrics[dept]) {
          deptMetrics[dept] = { name: dept, present: 0, late: 0, leave: 0, absent: 0, total: 0 };
        }
        const dMetric = deptMetrics[dept];
        dMetric.total++;
        if (status === 'present') dMetric.present++;
        else if (status === 'late') dMetric.late++;
        else if (status === 'leave') dMetric.leave++;
        else if (status === 'absent') dMetric.absent++;
      });

      dailyTrends.push({
        day: `${day}`,
        "มาปกติ": dayPresent,
        "มาสาย": dayLate,
        "ลา": dayLeave,
        "ขาด": dayAbsent,
        "วันหยุด/สลับ": dayOff
      });
    }

    // Convert employeeMetrics map to sorted array
    const topLateEmployees = Object.values(employeeMetrics)
      .filter(e => e.late > 0 || e.absent > 0)
      .map(e => ({
        name: e.name.split(' ')[0], // short name
        "นาทีที่สาย": e.lateMinutes,
        "สาย (ครั้ง)": e.late,
        "ขาด (ครั้ง)": e.absent,
        "ลา (ครั้ง)": e.leave
      }))
      .sort((a, b) => b["นาทีที่สาย"] - a["นาทีที่สาย"])
      .slice(0, 10); // Top 10

    const statusPieData = [
      { name: 'มาปกติ', value: presentCount, color: '#10b981' }, // emerald
      { name: 'มาสาย', value: lateCount, color: '#f59e0b' },    // amber
      { name: 'ลางานอนุมัติ', value: leaveCount, color: '#6366f1' },   // indigo
      { name: 'ขาดงาน', value: absentCount, color: '#ef4444' },       // rose
      { name: 'วันหยุด/บริษัท', value: holidayCount, color: '#94a3b8' }, // slate
      { name: 'สลับหยุดชดเชย', value: swapOffCount, color: '#3b82f6' } // blue
    ].filter(item => item.value > 0);

    const deptChartData = Object.values(deptMetrics).map(d => {
      const totalActive = d.present + d.late + d.leave + d.absent;
      const attendanceRate = totalActive > 0 ? Math.round(((d.present + d.late) / totalActive) * 100) : 100;
      return {
        name: d.name,
        "มาปกติ": d.present,
        "มาสาย": d.late,
        "ลางาน": d.leave,
        "ขาดงาน": d.absent,
        "อัตราการเข้างาน (%)": attendanceRate
      };
    });

    return {
      statusPieData,
      dailyTrends,
      topLateEmployees,
      deptChartData,
      summary: {
        totalPresent: presentCount,
        totalLate: lateCount,
        totalLeave: leaveCount,
        totalAbsent: absentCount,
        totalHoliday: holidayCount + swapOffCount,
        attendanceRate: (presentCount + lateCount + absentCount) > 0 
          ? Math.round(((presentCount + lateCount) / (presentCount + lateCount + absentCount)) * 100) 
          : 100
      }
    };
  }, [employees, attendanceRecords, leaves, dayOffSwaps, currentMonth, currentYear, daysInMonth]);

  // Helper to render badges
  const getStatusBadge = (status: AttendanceStatus, isAbbreviated = false) => {
    switch (status) {
      case 'present':
        return isAbbreviated ? (
          <span className="w-5.5 h-5.5 flex items-center justify-center bg-emerald-500 text-white text-[10px] font-bold rounded-sm" title="มาทำงาน">ม</span>
        ) : (
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold rounded-sm inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> มาทำงาน
          </span>
        );
      case 'absent':
        return isAbbreviated ? (
          <span className="w-5.5 h-5.5 flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-sm animate-pulse" title="ขาดงาน">ข</span>
        ) : (
          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold rounded-sm inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span> ขาดงาน
          </span>
        );
      case 'leave':
        return isAbbreviated ? (
          <span className="w-5.5 h-5.5 flex items-center justify-center bg-blue-500 text-white text-[10px] font-bold rounded-sm" title="ลางาน">ล</span>
        ) : (
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold rounded-sm inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> ลางาน
          </span>
        );
      case 'late':
        return isAbbreviated ? (
          <span className="w-5.5 h-5.5 flex items-center justify-center bg-amber-500 text-white text-[10px] font-bold rounded-sm" title="มาสาย">ส</span>
        ) : (
          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold rounded-sm inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> มาสาย
          </span>
        );
      case 'holiday':
        return isAbbreviated ? (
          <span className="w-5.5 h-5.5 flex items-center justify-center bg-slate-300 text-slate-700 text-[10px] font-bold rounded-sm" title="วันหยุด">ห</span>
        ) : (
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-250 text-[11px] font-semibold rounded-sm inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span> วันหยุด
          </span>
        );
      case 'swap_off':
        return isAbbreviated ? (
          <span className="w-5.5 h-5.5 flex items-center justify-center bg-purple-500 text-white text-[10px] font-bold rounded-sm" title="สลับวันหยุด">สล</span>
        ) : (
          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-semibold rounded-sm inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span> สลับวันหยุด
          </span>
        );
      default:
        return null;
    }
  };

  // Submit manual cell change
  const handleCellEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCell) return;

    onUpdateAttendance(editingCell.employeeId, editingCell.date, {
      date: editingCell.date,
      status: editingCell.status,
      lateMinutes: editingCell.status === 'late' ? Number(editingCell.lateMinutes) : undefined,
      notes: editingCell.notes.trim() || undefined
    });

    setEditingCell(null);
  };

  // Helper to calculate total active work hours (excluding 1-hour lunch break)
  const calculateWorkHours = (inTime: string, outTime: string): string => {
    if (!inTime || !outTime) return "0 ชม.";
    try {
      const [inH, inM] = inTime.split(':').map(Number);
      const [outH, outM] = outTime.split(':').map(Number);
      const inTotal = inH * 60 + inM;
      const outTotal = outH * 60 + outM;
      if (outTotal <= inTotal) return "0 ชม.";
      
      const diff = outTotal - inTotal - 60; // Subtract 1 hour break
      const activeDiff = diff > 0 ? diff : (outTotal - inTotal); // fallback if less than 60 mins
      const h = Math.floor(activeDiff / 60);
      const m = activeDiff % 60;
      if (m === 0) return `${h} ชม.`;
      return `${h} ชม. ${m} นาที`;
    } catch (e) {
      return "8 ชม.";
    }
  };

  // Submit manual timeline edit
  const handleTimelineEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTimelineRecord) return;

    onUpdateAttendance(
      editingTimelineRecord.employeeId,
      editingTimelineRecord.date,
      {
        date: editingTimelineRecord.date,
        status: editingTimelineRecord.status,
        clockIn: (editingTimelineRecord.status === 'present' || editingTimelineRecord.status === 'late') ? editingTimelineRecord.clockIn : undefined,
        clockOut: (editingTimelineRecord.status === 'present' || editingTimelineRecord.status === 'late') ? editingTimelineRecord.clockOut : undefined,
        lateMinutes: editingTimelineRecord.status === 'late' ? Number(editingTimelineRecord.lateMinutes) : undefined,
        notes: editingTimelineRecord.notes.trim() || undefined
      }
    );

    setEditingTimelineRecord(null);
  };

  // Open swap holiday modal
  const handleOpenSwapModal = () => {
    setSwapOriginalDate('');
    setSwapNewDate('');
    setSwapReason('');
    if (employees.length > 0) {
      setSwapEmployeeId(employees[0].id);
    }
    setIsSwapModalOpen(true);
  };

  // Day off swap submission
  const handleSwapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(x => x.id === swapEmployeeId);
    if (!emp) return;

    const newSwap: DayOffSwap = {
      id: `SW-${Date.now().toString().slice(-4)}`,
      employeeId: swapEmployeeId,
      employeeName: emp.name,
      originalOffDate: swapOriginalDate,
      swappedOffDate: swapNewDate,
      status: 'pending',
      reason: swapReason,
      appliedDate: new Date().toISOString().split('T')[0]
    };

    onAddDayOffSwap(newSwap);
    setIsSwapModalOpen(false);
  };

  // Add a Public Holiday
  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayName) return;

    setPublicHolidays(prev => ({
      ...prev,
      [newHolidayDate]: newHolidayName
    }));

    setNewHolidayDate('');
    setNewHolidayName('');
  };

  // Remove a Public Holiday
  const handleRemoveHoliday = (dateKey: string) => {
    setPublicHolidays(prev => {
      const copy = { ...prev };
      delete copy[dateKey];
      return copy;
    });
  };

  // Toggle Weekly Off day
  const handleToggleWeeklyOff = (dayIndex: number) => {
    if (weeklyOffDays.includes(dayIndex)) {
      if (weeklyOffDays.length === 1) return; // Must have at least 1 off-day
      setWeeklyOffDays(prev => prev.filter(d => d !== dayIndex));
    } else {
      setWeeklyOffDays(prev => [...prev, dayIndex].sort());
    }
  };

  // Calculate Monthly Summary Stats for each Employee
  const employeesSummary = useMemo(() => {
    return filteredEmployees.map(emp => {
      let present = 0;
      let absent = 0;
      let leave = 0;
      let late = 0;
      let totalLateMinutes = 0;
      let holiday = 0;
      let swap_off = 0;

      daysArray.forEach(day => {
        const dateStr = getFormattedDateString(day);
        const resolved = resolveAttendanceStatus(emp.id, dateStr);
        
        switch (resolved.status) {
          case 'present': present++; break;
          case 'absent': absent++; break;
          case 'leave': leave++; break;
          case 'late': 
            late++; 
            totalLateMinutes += resolved.lateMinutes || 0;
            break;
          case 'holiday': holiday++; break;
          case 'swap_off': swap_off++; break;
        }
      });

      return {
        employee: emp,
        present,
        absent,
        leave,
        late,
        totalLateMinutes,
        holiday,
        swap_off
      };
    });
  }, [filteredEmployees, daysArray, currentMonth, currentYear, attendanceRecords, leaves, dayOffSwaps, publicHolidays, weeklyOffDays]);

  // Export Table to window print
  const handlePrintTable = () => {
    window.print();
  };

  // Export Attendance to CSV
  const handleDownloadCSV = () => {
    const headers = [
      'รหัสพนักงาน',
      'ชื่อพนักงาน',
      'แผนก',
      'มาทำงาน (วัน)',
      'ขาดงาน (วัน)',
      'ลางาน (วัน)',
      'มาสาย (วัน)',
      'รวมเวลาสาย (นาที)',
      ...daysArray.map(day => `วันที่ ${day}`)
    ];

    const escapeCSV = (val: string | number) => {
      const str = String(val === null || val === undefined ? '' : val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = employeesSummary.map(({ employee, present, absent, leave, late, totalLateMinutes }) => {
      const dailyStatuses = daysArray.map(day => {
        const dateStr = getFormattedDateString(day);
        const resolved = resolveAttendanceStatus(employee.id, dateStr);
        let ThaiStatus = 'มาทำงาน';
        if (resolved.status === 'absent') ThaiStatus = 'ขาดงาน';
        else if (resolved.status === 'leave') ThaiStatus = 'ลางาน';
        else if (resolved.status === 'late') ThaiStatus = `มาสาย (${resolved.lateMinutes || 0}น.)`;
        else if (resolved.status === 'holiday') ThaiStatus = 'วันหยุด';
        else if (resolved.status === 'swap_off') ThaiStatus = 'สลับวันหยุด';
        return ThaiStatus;
      });

      return [
        employee.id,
        employee.name,
        employee.department,
        present,
        absent,
        leave,
        late,
        totalLateMinutes,
        ...dailyStatuses
      ].map(escapeCSV).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const monthName = THAI_MONTHS.find(m => m.value === currentMonth)?.label || 'เดือน';
    link.setAttribute('download', `รายงานเวลาทำงาน_${monthName}_${currentYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Control Panel */}
      <div className="bg-white p-6 rounded-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-sm">
              <CalendarDays className="w-5 h-5" />
            </span>
            <h2 className="text-base font-extrabold text-slate-900 font-sans tracking-tight">ตารางเวลาทำงาน & บันทึก ขาด ลา มาสาย สลับวันหยุด</h2>
          </div>
          <p className="text-xs text-slate-500">จัดการข้อมูลประวัติเวลาปฏิบัติงาน, กำหนดวันหยุดสลับสับเปลี่ยน และวันหยุดนักขัตฤกษ์ของพนักงานแต่ละคน</p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleOpenSwapModal}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" /> ยื่นเรื่องสลับวันหยุด
          </button>
          <button
            onClick={() => setIsHolidayModalOpen(true)}
            className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-sm text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" /> ตั้งค่าวันหยุดระบบ
          </button>
          <button
            onClick={handlePrintTable}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-950 text-white rounded-sm text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" /> พิมพ์รายงาน / PDF
          </button>
          <button
            onClick={handleDownloadCSV}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> ดาวน์โหลด CSV
          </button>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="border-b border-slate-200 flex justify-between items-center no-print">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveSubTab('grid')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
              activeSubTab === 'grid' 
                ? 'border-blue-600 text-blue-600 font-extrabold' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            ตารางเวลาทำหน้าที่รายเดือน
          </button>
          <button
            onClick={() => setActiveSubTab('timeline')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center gap-2 relative ${
              activeSubTab === 'timeline' 
                ? 'border-blue-600 text-blue-600 font-extrabold' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            ไทม์ไลน์เวลาเข้า-ออกงาน
          </button>
          <button
            onClick={() => setActiveSubTab('swaps')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center gap-2 relative ${
              activeSubTab === 'swaps' 
                ? 'border-blue-600 text-blue-600 font-extrabold' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            คำขอสลับวันหยุด
            {dayOffSwaps.filter(s => s.status === 'pending').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 block animate-ping"></span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('charts')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center gap-2 relative ${
              activeSubTab === 'charts' 
                ? 'border-blue-600 text-blue-600 font-extrabold' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            รายงาน & กราฟสถิติ
          </button>
        </div>

        {/* Month/Year Filter (Only relevant to Calendar/Grid and Charts views) */}
        {(activeSubTab === 'grid' || activeSubTab === 'charts') && (
          <div className="flex items-center gap-2 pb-2">
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-sm text-xs text-slate-700 focus:outline-none focus:border-blue-500 font-sans"
            >
              {THAI_MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-sm text-xs text-slate-700 focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value={2026}>2026 (พ.ศ. 2569)</option>
              <option value={2025}>2025 (พ.ศ. 2568)</option>
              <option value={2027}>2027 (พ.ศ. 2570)</option>
            </select>
          </div>
        )}
      </div>

      {/* RENDER GRID VIEW */}
      {activeSubTab === 'grid' && (
        <div className="space-y-6">
          
          {/* Quick Stats Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 no-print">
            <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">เข้างานปกติ (มา)</span>
                <p className="text-lg font-black text-slate-900 font-mono mt-1">
                  {employeesSummary.reduce((sum, e) => sum + e.present, 0)} วัน
                </p>
              </div>
              <div className="p-2 bg-emerald-50 text-emerald-500 rounded-sm">
                <Check className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">ขาดงานสะสม</span>
                <p className="text-lg font-black text-rose-600 font-mono mt-1">
                  {employeesSummary.reduce((sum, e) => sum + e.absent, 0)} วัน
                </p>
              </div>
              <div className="p-2 bg-rose-50 text-rose-500 rounded-sm">
                <X className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">ลากิจ/ลาป่วย</span>
                <p className="text-lg font-black text-blue-600 font-mono mt-1">
                  {employeesSummary.reduce((sum, e) => sum + e.leave, 0)} วัน
                </p>
              </div>
              <div className="p-2 bg-blue-50 text-blue-500 rounded-sm">
                <Calendar className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">มาสายสะสม</span>
                <p className="text-lg font-black text-amber-600 font-mono mt-1">
                  {employeesSummary.reduce((sum, e) => sum + e.late, 0)} ครั้ง
                </p>
              </div>
              <div className="p-2 bg-amber-50 text-amber-500 rounded-sm">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">เวลาที่สายสะสม</span>
                <p className="text-lg font-black text-amber-700 font-mono mt-1">
                  {employeesSummary.reduce((sum, e) => sum + e.totalLateMinutes, 0)} นาที
                </p>
              </div>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-sm">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">สลับสับเปลี่ยนวันหยุด</span>
                <p className="text-lg font-black text-purple-600 font-mono mt-1">
                  {employeesSummary.reduce((sum, e) => sum + e.swap_off, 0)} วัน
                </p>
              </div>
              <div className="p-2 bg-purple-50 text-purple-500 rounded-sm">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Table Filters (no-print) */}
          <div className="bg-white p-4 border border-slate-200 rounded-sm flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs no-print">
            <div className="flex flex-1 w-full gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาพนักงานด้วยชื่อ หรือ รหัสพนักงาน..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-sm text-xs focus:outline-none focus:border-blue-500 bg-white"
                />
              </div>

              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white text-slate-600 focus:outline-none focus:border-blue-500 max-w-[200px]"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept === 'All' ? 'ทุกแผนก/ฝ่าย' : `ฝ่าย${dept}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Helper Legend */}
            <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-slate-500 bg-slate-50 p-2 border border-slate-100 rounded-sm">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 text-white flex items-center justify-center text-[8px] rounded-xs font-mono">ม</span> มาปฏิบัติงาน</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 text-white flex items-center justify-center text-[8px] rounded-xs font-mono">ข</span> ขาดงาน</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-500 text-white flex items-center justify-center text-[8px] rounded-xs font-mono">ล</span> ลางาน</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 text-white flex items-center justify-center text-[8px] rounded-xs font-mono">ส</span> มาสาย</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-300 text-slate-700 flex items-center justify-center text-[8px] rounded-xs font-mono">ห</span> วันหยุด</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-purple-500 text-white flex items-center justify-center text-[8px] rounded-xs font-mono">สล</span> สลับหยุด</span>
            </div>
          </div>

          {/* GRID SCROLLABLE BOARD */}
          <div className="bg-white border border-slate-200 rounded-sm shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center no-print">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Info className="w-4 h-4 text-blue-500" /> คลิกที่ช่องประวัติของแต่ละคนเพื่อแก้ไขบันทึกย้อนหลัง
              </span>
              <span className="text-[10px] font-mono text-slate-400">ประจำเดือน: {THAI_MONTHS.find(m => m.value === currentMonth)?.label} {currentYear}</span>
            </div>

            {/* Print Header */}
            <div className="hidden print:block text-center space-y-2 p-6 border-b border-slate-300">
              <h1 className="text-xl font-bold">รายงานบันทึกประวัติ ขาด ลา มาสาย วันหยุดสลับงานพนักงาน</h1>
              <p className="text-xs text-slate-500">
                ประจำเดือน {THAI_MONTHS.find(m => m.value === currentMonth)?.label} ปี พ.ศ. {currentYear + 543}
              </p>
            </div>

            {/* Horizontal Scroll wrapper */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-500 text-[10px] font-mono font-bold tracking-wider border-b border-slate-200">
                    <th className="py-2 px-3 text-left sticky left-0 bg-slate-100 z-10 w-44 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">รหัส & พนักงาน</th>
                    <th className="py-2 px-3 text-center border-r border-slate-200 bg-slate-200/50 text-slate-700">สรุป (ม/ข/ล/ส)</th>
                    
                    {/* Render days headers 1 to 31 */}
                    {daysArray.map(day => {
                      const dateStr = getFormattedDateString(day);
                      const isSatOrSun = isWeekend(dateStr);
                      const holidayName = publicHolidays[dateStr];
                      const d = new Date(dateStr + "T00:00:00");
                      const labelDay = d.toLocaleDateString('en-US', { weekday: 'narrow' }); // M, T, W...
                      
                      return (
                        <th 
                          key={day} 
                          className={`py-1.5 px-0.5 text-center min-w-[28px] border-r border-slate-200 ${
                            isSatOrSun ? 'bg-rose-50 text-rose-500 font-extrabold' : 
                            holidayName ? 'bg-amber-50 text-amber-600 font-extrabold' : ''
                          }`}
                          title={`${day} ${THAI_MONTHS.find(m => m.value === currentMonth)?.label} ${currentYear} (${holidayName || ''})`}
                        >
                          <div className="text-[11px] font-extrabold leading-none">{day}</div>
                          <div className="text-[8px] font-mono uppercase opacity-60 mt-0.5">{labelDay}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employeesSummary.length === 0 ? (
                    <tr>
                      <td colSpan={daysInMonth + 2} className="py-12 text-center text-xs text-slate-400 font-sans">
                        ไม่มีข้อมูลพนักงานที่ตรงกับตัวกรองค้นหา
                      </td>
                    </tr>
                  ) : (
                    employeesSummary.map(({ employee, present, absent, leave, late, totalLateMinutes, holiday, swap_off }) => (
                      <tr key={employee.id} className="hover:bg-slate-50/50 transition">
                        {/* Employee Name Card (Sticky left) */}
                        <td className="py-2 px-3 sticky left-0 bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.03)] border-r border-slate-100 max-w-[176px]">
                          <div className="truncate">
                            <span className="font-bold text-slate-800 text-xs block font-sans truncate">{employee.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] text-slate-400 font-mono tracking-tight">{employee.id}</span>
                              <span className="text-[9px] text-slate-300 font-mono">|</span>
                              <span className="text-[9px] text-indigo-500 font-sans truncate">{employee.department}</span>
                            </div>
                          </div>
                        </td>

                        {/* Summary Column */}
                        <td className="py-2 px-2 text-center border-r border-slate-200 bg-slate-50/50 font-mono text-[10px] font-bold">
                          <div className="flex items-center justify-center gap-0.5 text-slate-700">
                            <span className="text-emerald-600" title="มาปฏิบัติงาน">{present}</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-rose-600" title="ขาดงาน">{absent}</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-blue-600" title="ลางาน">{leave}</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-amber-600" title="มาสาย">{late}</span>
                          </div>
                          {totalLateMinutes > 0 && (
                            <div className="text-[8px] text-amber-700 leading-none mt-0.5">({totalLateMinutes}น.)</div>
                          )}
                        </td>

                        {/* Grid Days Cells */}
                        {daysArray.map(day => {
                          const dateStr = getFormattedDateString(day);
                          const resolved = resolveAttendanceStatus(employee.id, dateStr);

                          return (
                            <td 
                              key={day} 
                              onClick={() => {
                                setEditingCell({
                                  employeeId: employee.id,
                                  date: dateStr,
                                  status: resolved.status,
                                  lateMinutes: resolved.lateMinutes || 0,
                                  notes: resolved.notes || ''
                                });
                              }}
                              className="p-1 text-center border-r border-slate-150 cursor-pointer hover:scale-105 hover:shadow-inner transition-all duration-100"
                              title={`${employee.name} | วันที่ ${day} : ${resolved.notes || 'ปกติ'}`}
                            >
                              <div className="flex justify-center">
                                {getStatusBadge(resolved.status, true)}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Print Footer Summary */}
            <div className="hidden print:flex justify-between items-center p-6 border-t border-slate-300 text-xs text-slate-500 font-mono">
              <p>ผู้รายงาน: ___________________________</p>
              <p>วันที่พิมพ์: {new Date().toLocaleDateString('th-TH')}</p>
              <p>ฝ่ายทรัพยากรบุคคล (HR Core System)</p>
            </div>
          </div>
        </div>
      )}

      {/* RENDER TIMELINE VIEW */}
      {activeSubTab === 'timeline' && (() => {
        // Calculate daily stats for this timelineDate
        let presentCount = 0;
        let lateCount = 0;
        let leaveCount = 0;
        let absentCount = 0;
        let holidayCount = 0;

        employees.forEach(emp => {
          const resolved = resolveAttendanceStatus(emp.id, timelineDate);
          if (resolved.status === 'present') presentCount++;
          else if (resolved.status === 'late') lateCount++;
          else if (resolved.status === 'leave') leaveCount++;
          else if (resolved.status === 'absent') absentCount++;
          else if (resolved.status === 'holiday' || resolved.status === 'swap_off') holidayCount++;
        });

        const filteredTimelineEmployees = employees.filter(emp => {
          const matchesSearch = emp.name.toLowerCase().includes(timelineSearch.toLowerCase()) || 
                                emp.id.toLowerCase().includes(timelineSearch.toLowerCase());
          const matchesDept = timelineDeptFilter === 'All' || emp.department === timelineDeptFilter;
          return matchesSearch && matchesDept;
        });

        return (
          <div className="space-y-6">
            {/* Timeline Filter Header */}
            <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 no-print">
              {/* Left: Date navigation and picker */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    const d = new Date(timelineDate + "T00:00:00");
                    d.setDate(d.getDate() - 1);
                    setTimelineDate(d.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-sm text-xs cursor-pointer font-bold font-sans flex items-center gap-1"
                >
                  ◀ วันก่อนหน้า
                </button>
                <input
                  type="date"
                  value={timelineDate}
                  onChange={(e) => setTimelineDate(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 bg-white text-slate-700 rounded-sm text-xs font-bold font-mono focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => {
                    const d = new Date(timelineDate + "T00:00:00");
                    d.setDate(d.getDate() + 1);
                    setTimelineDate(d.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-sm text-xs cursor-pointer font-bold font-sans flex items-center gap-1"
                >
                  วันถัดไป ▶
                </button>
                <button
                  onClick={() => setTimelineDate('2026-07-02')}
                  className="px-3 py-1.5 border border-blue-100 bg-blue-50/50 hover:bg-blue-50 text-blue-700 rounded-sm text-xs cursor-pointer font-bold font-sans"
                >
                  กลับไป 2 ก.ค. 2026
                </button>
              </div>

              {/* Right: Search and Department */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={timelineSearch}
                    onChange={(e) => setTimelineSearch(e.target.value)}
                    placeholder="ค้นหาชื่อหรือรหัสพนักงาน..."
                    className="pl-8 pr-3 py-1.5 border border-slate-200 bg-white text-slate-700 rounded-sm text-xs focus:outline-none focus:border-blue-500 w-48 font-sans"
                  />
                </div>
                <select
                  value={timelineDeptFilter}
                  onChange={(e) => setTimelineDeptFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-sm text-xs text-slate-700 focus:outline-none focus:border-blue-500 font-sans"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept === 'All' ? 'ทุกแผนก' : `แผนก ${dept}`}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Daily Timeline Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 no-print">
              <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">มาทำงานปกติ</span>
                  <p className="text-base font-black text-emerald-600 font-mono mt-1">{presentCount} คน</p>
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-500 rounded-sm"><Check className="w-4 h-4" /></div>
              </div>

              <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">มาสาย</span>
                  <p className="text-base font-black text-amber-600 font-mono mt-1">{lateCount} คน</p>
                </div>
                <div className="p-2 bg-amber-50 text-amber-500 rounded-sm"><Clock className="w-4 h-4" /></div>
              </div>

              <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">ลางานอนุมัติ</span>
                  <p className="text-base font-black text-indigo-600 font-mono mt-1">{leaveCount} คน</p>
                </div>
                <div className="p-2 bg-indigo-50 text-indigo-500 rounded-sm"><Calendar className="w-4 h-4" /></div>
              </div>

              <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">ขาดงาน</span>
                  <p className="text-base font-black text-rose-600 font-mono mt-1">{absentCount} คน</p>
                </div>
                <div className="p-2 bg-rose-50 text-rose-500 rounded-sm"><X className="w-4 h-4" /></div>
              </div>

              <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs flex items-center justify-between col-span-2 sm:col-span-1">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">วันหยุดบริษัท/นักขัตฯ</span>
                  <p className="text-base font-black text-slate-600 font-mono mt-1">{holidayCount} คน</p>
                </div>
                <div className="p-2 bg-slate-50 text-slate-500 rounded-sm"><Info className="w-4 h-4" /></div>
              </div>
            </div>

            {/* List of employee timelines */}
            <div className="space-y-4">
              <div className="bg-slate-100 px-4 py-2 border-l-4 border-blue-500 rounded-r-sm text-[11px] font-sans text-slate-600 flex justify-between items-center no-print">
                <span>แสดงผลแถบเวลาเข้า-ออกงานของพนักงาน ณ วันที่ <strong className="text-slate-800">{new Date(timelineDate + "T00:00:00").toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
                <span className="font-mono text-[10px]">ระบบกำหนดเวลาทำงานกลาง: 08:30 น. - 17:30 น.</span>
              </div>

              {filteredTimelineEmployees.length === 0 ? (
                <div className="bg-white py-12 text-center text-xs text-slate-400 border border-slate-200 rounded-sm font-sans">
                  ไม่พบบันทึกเวลาการปฏิบัติงานสำหรับพนักงานตามที่กำหนดในเงื่อนไขการค้นหา
                </div>
              ) : (
                filteredTimelineEmployees.map(emp => {
                  const resolved = resolveAttendanceStatus(emp.id, timelineDate);
                  const record = attendanceRecords[emp.id]?.[timelineDate];

                  // Calculate display clock-in and clock-out times
                  let actualIn = "";
                  let actualOut = "";
                  let isLateStatus = resolved.status === 'late';
                  
                  if (resolved.status === 'present' || resolved.status === 'late') {
                    if (record?.clockIn) {
                      actualIn = record.clockIn;
                    } else {
                      // Generate dynamic but deterministic clock-in
                      if (resolved.status === 'present') {
                        const mins = 10 + (parseInt(emp.id.replace(/\D/g, '') || '0') % 18);
                        actualIn = `08:${String(mins).padStart(2, '0')}`;
                      } else {
                        // Late: 08:30 + lateMinutes
                        const lateMin = resolved.lateMinutes || 15;
                        const totalMins = 30 + lateMin;
                        const hr = 8 + Math.floor(totalMins / 60);
                        const mn = totalMins % 60;
                        actualIn = `${String(hr).padStart(2, '0')}:${String(mn).padStart(2, '0')}`;
                      }
                    }

                    if (record?.clockOut) {
                      actualOut = record.clockOut;
                    } else {
                      // Generate dynamic but deterministic clock-out
                      const mins = 30 + (parseInt(emp.id.replace(/\D/g, '') || '0') % 20);
                      actualOut = `17:${String(mins).padStart(2, '0')}`;
                    }
                  }

                  // Calculate work hours string
                  const workDuration = calculateWorkHours(actualIn, actualOut);

                  return (
                    <div key={emp.id} className="bg-white border border-slate-200 rounded-sm p-4 hover:shadow-xs transition flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                      
                      {/* Left: Employee Info */}
                      <div className="flex items-center gap-3 w-full md:w-64 shrink-0">
                        <div className="w-10 h-10 rounded-full bg-slate-150 border border-slate-250 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 font-mono uppercase">
                          {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="text-left font-sans min-w-0">
                          <p className="font-bold text-slate-800 truncate text-xs">{emp.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">แผนก {emp.department} • {emp.role}</p>
                          <p className="text-[9px] text-slate-450 font-mono mt-0.5">ID: {emp.id}</p>
                        </div>
                      </div>

                      {/* Center: Timeline Progress Bar */}
                      <div className="flex-1 min-w-0">
                        {resolved.status === 'present' || resolved.status === 'late' ? (
                          <div className="space-y-2.5">
                            {/* Horizontal track line */}
                            <div className="relative py-3">
                              <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 rounded-full"></div>
                              <div className={`absolute top-1/2 left-0 right-1/2 h-1 ${isLateStatus ? 'bg-amber-400' : 'bg-emerald-400'} -translate-y-1/2 rounded-full`}></div>
                              <div className="absolute top-1/2 left-1/2 right-0 h-1 bg-blue-400 -translate-y-1/2 rounded-full"></div>

                              <div className="relative flex justify-between">
                                {/* Landmark 1: Expected In */}
                                <div className="flex flex-col items-center text-center">
                                  <div className="w-5 h-5 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-[8px] font-bold text-slate-600 z-10 shadow-xs">
                                    08:30
                                  </div>
                                  <span className="text-[9px] text-slate-400 mt-1">เวลาเข้างาน</span>
                                </div>

                                {/* Landmark 2: Actual Clock In */}
                                <div className="flex flex-col items-center text-center">
                                  <div className={`w-5 h-5 rounded-full ${isLateStatus ? 'bg-amber-500' : 'bg-emerald-500'} flex items-center justify-center text-white z-10 shadow-xs`}>
                                    <Clock className="w-2.5 h-2.5" />
                                  </div>
                                  <span className={`text-[9px] font-bold mt-1 ${isLateStatus ? 'text-amber-600' : 'text-emerald-600'}`}>
                                    เข้า: {actualIn} น.
                                  </span>
                                  <span className="text-[8px] text-slate-400 font-mono">
                                    {isLateStatus ? `สาย ${resolved.lateMinutes || 15} นาที` : 'ตรงเวลา'}
                                  </span>
                                </div>

                                {/* Landmark 3: Lunch Break */}
                                <div className="flex flex-col items-center text-center">
                                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white z-10 shadow-xs">
                                    <span className="text-[8px] font-bold">12:00</span>
                                  </div>
                                  <span className="text-[9px] text-slate-500 mt-1">พักเที่ยง (1 ชม.)</span>
                                </div>

                                {/* Landmark 4: Actual Clock Out */}
                                <div className="flex flex-col items-center text-center">
                                  <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white z-10 shadow-xs">
                                    <Check className="w-2.5 h-2.5" />
                                  </div>
                                  <span className="text-[9px] font-bold text-indigo-600 mt-1">
                                    ออก: {actualOut} น.
                                  </span>
                                  <span className="text-[8px] text-slate-400 font-mono">
                                    บันทึกสมบูรณ์
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Inactive Status Overlay */
                          <div className={`py-3.5 px-4 rounded-sm border flex items-center justify-between text-xs font-sans ${
                            resolved.status === 'leave' ? 'bg-indigo-50/50 border-indigo-150 text-indigo-800' :
                            resolved.status === 'absent' ? 'bg-rose-50/50 border-rose-150 text-rose-800' :
                            'bg-slate-50 border-slate-200 text-slate-500'
                          }`}>
                            <div className="flex items-center gap-2">
                              {resolved.status === 'leave' && <Calendar className="w-4 h-4 text-indigo-500" />}
                              {resolved.status === 'absent' && <XCircle className="w-4 h-4 text-rose-500" />}
                              {(resolved.status === 'holiday' || resolved.status === 'swap_off') && <Info className="w-4 h-4 text-slate-400" />}
                              <div>
                                <span className="font-bold">
                                  {resolved.status === 'leave' ? 'ลางาน (Approved Leave)' :
                                   resolved.status === 'absent' ? 'ขาดงาน (Absent)' :
                                   resolved.status === 'swap_off' ? 'วันสลับหยุดชดเชย' : 'วันหยุด / ปิดทำการ'}
                                </span>
                                {resolved.notes && <span className="text-[11px] block mt-0.5 font-mono text-slate-500 font-bold">{resolved.notes}</span>}
                              </div>
                            </div>
                            <span className="text-[10px] font-mono tracking-wider font-extrabold bg-white px-2 py-0.5 rounded-sm shadow-2xs">
                              {resolved.status === 'leave' ? 'LEAVE' :
                               resolved.status === 'absent' ? 'ABSENT' : 'OFF'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions and summary details */}
                      <div className="w-full md:w-56 shrink-0 flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                        {/* Duration hours */}
                        <div className="text-left md:text-right font-sans">
                          {(resolved.status === 'present' || resolved.status === 'late') ? (
                            <>
                              <span className="text-[10px] text-slate-400 block font-mono">ชั่วโมงปฏิบัติงานสุทธิ:</span>
                              <span className="text-xs font-extrabold text-slate-700 block font-mono">{workDuration}</span>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400">-</span>
                          )}
                        </div>

                        {/* Edit Button */}
                        <button
                          onClick={() => setEditingTimelineRecord({
                            employeeId: emp.id,
                            employeeName: emp.name,
                            date: timelineDate,
                            status: resolved.status,
                            clockIn: actualIn || "08:30",
                            clockOut: actualOut || "17:30",
                            lateMinutes: resolved.lateMinutes || 0,
                            notes: resolved.notes || ""
                          })}
                          className="px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 rounded-sm text-[11px] font-bold font-sans transition flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" /> แก้ไขประวัติลงเวลา
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* RENDER DAY OFF SWAPS BOARD */}
      {activeSubTab === 'swaps' && (
        <div className="space-y-6">
          <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="text-xs text-slate-500">
              <strong className="text-slate-700 block text-sm font-sans font-bold">ระบบคำขอสลับวันทำงานและวันหยุด</strong>
              ช่วยให้พนักงานสามารถยื่นเรื่องขอเปลี่ยนตารางวันหยุดเดิม เพื่อปฏิบัติงานแล้วสลับไปชดเชยวันหยุดในวันธรรมดาอื่น โดยระบบจะประสานงานเข้าตารางเวลาทำงานทันทีเมื่อได้รับอนุมัติ
            </div>
            <button
              onClick={handleOpenSwapModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> ยื่นเรื่องขอลดสลับวันหยุด
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-sm shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">ประวัติและรายการขอสลับวันหยุดปฏิบัติหน้าที่</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-slate-700 text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-6">พนักงาน</th>
                    <th className="py-3 px-6">วันหยุดเดิมที่ทำงาน</th>
                    <th className="py-3 px-6">วันหยุดสลับชดเชย</th>
                    <th className="py-3 px-6">เหตุผลขอยื่นเรื่อง</th>
                    <th className="py-3 px-6">สถานะ</th>
                    <th className="py-3 px-6 text-right">วันที่ยื่นเรื่อง</th>
                    <th className="py-3 px-6 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dayOffSwaps.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-slate-400 font-sans">
                        ไม่มีประวัติคำขออนุมัติการสลับวันหยุดในระบบ
                      </td>
                    </tr>
                  ) : (
                    dayOffSwaps.map(swap => (
                      <tr key={swap.id} className="hover:bg-slate-50/50 transition text-xs">
                        <td className="py-3.5 px-6">
                          <span className="font-bold text-slate-800 block">{swap.employeeName}</span>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{swap.employeeId}</span>
                        </td>
                        <td className="py-3.5 px-6 font-mono font-bold text-slate-700">
                          {swap.originalOffDate}
                        </td>
                        <td className="py-3.5 px-6 font-mono font-bold text-indigo-700">
                          {swap.swappedOffDate}
                        </td>
                        <td className="py-3.5 px-6 max-w-xs truncate text-slate-600" title={swap.reason}>
                          &ldquo;{swap.reason}&rdquo;
                        </td>
                        <td className="py-3.5 px-6">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase font-mono ${
                            swap.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            swap.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                            'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                          }`}>
                            {swap.status === 'approved' ? 'อนุมัติแล้ว' :
                             swap.status === 'rejected' ? 'ปฏิเสธ' : 'รอพิจารณา'}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right text-[10px] text-slate-400 font-mono">
                          {swap.appliedDate}
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {swap.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => onUpdateDayOffSwapStatus(swap.id, 'approved')}
                                  className="p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-sm transition cursor-pointer"
                                  title="อนุมัติคำขอสลับหยุด"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onUpdateDayOffSwapStatus(swap.id, 'rejected')}
                                  className="p-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-sm transition cursor-pointer"
                                  title="ปฏิเสธคำขอสลับหยุด"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => onDeleteDayOffSwap(swap.id)}
                              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded-sm transition cursor-pointer"
                              title="ลบคำขอออกจากระบบ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RENDER DYNAMIC CHARTS & ANALYTICS BOARD */}
      {activeSubTab === 'charts' && (
        <div className="space-y-6">
          {/* Dashboard Summary Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 no-print">
            <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs text-left">
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">อัตราการเข้างานเฉลี่ย</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-indigo-600 font-mono">{chartData.summary.attendanceRate}%</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">จากพนักงานปฏิบัติหน้าที่ทั้งหมด</p>
            </div>

            <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs text-left">
              <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-500 uppercase">มาทำงานปกติ</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-emerald-600 font-mono">{chartData.summary.totalPresent}</span>
                <span className="text-xs text-slate-450">ครั้ง</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">ลงชื่อและเข้างานตรงเวลา</p>
            </div>

            <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs text-left">
              <span className="text-[10px] font-mono font-bold tracking-wider text-amber-500 uppercase">มาทำงานสาย</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-amber-600 font-mono">{chartData.summary.totalLate}</span>
                <span className="text-xs text-slate-450">ครั้ง</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">เข้างานหลังเวลา 08:30 น.</p>
            </div>

            <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs text-left">
              <span className="text-[10px] font-mono font-bold tracking-wider text-indigo-500 uppercase">ลางานอนุมัติ</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-indigo-600 font-mono">{chartData.summary.totalLeave}</span>
                <span className="text-xs text-slate-450">ครั้ง</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">ได้รับการอนุมัติใบลาเรียบร้อย</p>
            </div>

            <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs text-left col-span-2 md:col-span-1">
              <span className="text-[10px] font-mono font-bold tracking-wider text-rose-500 uppercase">ขาดงาน / ไม่แจ้ง</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-rose-600 font-mono">{chartData.summary.totalAbsent}</span>
                <span className="text-xs text-slate-450">ครั้ง</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">ไม่มีบันทึกการลงเวลาหรือใบลา</p>
            </div>
          </div>

          {/* Charts Row 1: Pie & Department Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Pie Chart: Status Breakdown */}
            <div className="bg-white p-5 border border-slate-200 rounded-sm shadow-xs lg:col-span-5 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5 mb-1 text-left">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span> สัดส่วนสถานะบันทึกเวลาทำงาน
                </h3>
                <p className="text-[10px] text-slate-400 text-left">เปรียบเทียบสัดส่วนและยอดสะสมประจำเดือน {THAI_MONTHS.find(m => m.value === currentMonth)?.label} {currentYear + 543}</p>
              </div>

              {chartData.statusPieData.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-xs">ไม่มีข้อมูลการลงเวลาทำงานในเดือนนี้</div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4">
                  <div className="w-48 h-48 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.statusPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chartData.statusPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ fontSize: '11px', fontFamily: 'sans-serif', borderRadius: '4px' }}
                          formatter={(value) => [`${value} ครั้ง`, 'จำนวน']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Legend list */}
                  <div className="flex-1 space-y-2 text-left">
                    {chartData.statusPieData.map((item, index) => {
                      const percentage = chartData.summary.totalPresent + chartData.summary.totalLate + chartData.summary.totalLeave + chartData.summary.totalAbsent + chartData.summary.totalHoliday > 0
                        ? Math.round((item.value / (chartData.summary.totalPresent + chartData.summary.totalLate + chartData.summary.totalLeave + chartData.summary.totalAbsent + chartData.summary.totalHoliday)) * 100)
                        : 0;
                      return (
                        <div key={index} className="flex items-center justify-between text-[11px] font-sans">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                            <span className="text-slate-600 font-medium">{item.name}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-800">{item.value} ({percentage}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bar Chart: Department breakdown */}
            <div className="bg-white p-5 border border-slate-200 rounded-sm shadow-xs lg:col-span-7 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5 mb-1 text-left">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> สถิติการปฏิบัติงานจำแนกตามแผนก (Department)
                </h3>
                <p className="text-[10px] text-slate-400 text-left">เปรียบเทียบยอดการมาปฏิบัติงาน สาย ขาด ลา ในแต่ละแผนก</p>
              </div>

              {chartData.deptChartData.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-xs">ไม่มีข้อมูลพนักงานเพื่อจัดกลุ่มแผนก</div>
              ) : (
                <div className="w-full h-56 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData.deptChartData}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                      <RechartsTooltip 
                        contentStyle={{ fontSize: '11px', fontFamily: 'sans-serif', borderRadius: '4px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                      <Bar dataKey="มาปกติ" fill="#10b981" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="มาสาย" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="ลางาน" fill="#6366f1" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="ขาดงาน" fill="#ef4444" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

          </div>

          {/* Charts Row 2: Daily trends line chart */}
          <div className="bg-white p-5 border border-slate-200 rounded-sm shadow-xs text-left">
            <div>
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> แนวโน้มการลงชื่อเข้างานรายวันประจำเดือน
              </h3>
              <p className="text-[10px] text-slate-400">แสดงการเปรียบเทียบจำนวนการ มาทำงานปกติ และ มาสาย รายวัน ตลอดระยะเวลาทั้งเดือน</p>
            </div>

            <div className="w-full h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData.dailyTrends}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    label={{ value: 'วันที่ในเดือน', position: 'insideBottomRight', offset: -10, fontSize: 10, fill: '#94a3b8' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    label={{ value: 'คน', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8' }}
                  />
                  <RechartsTooltip 
                    contentStyle={{ fontSize: '11px', fontFamily: 'sans-serif', borderRadius: '4px' }}
                    labelFormatter={(label) => `วันที่ ${label}`}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="มาปกติ" stroke="#10b981" fillOpacity={1} fill="url(#colorPresent)" strokeWidth={2} />
                  <Area type="monotone" dataKey="มาสาย" stroke="#f59e0b" fillOpacity={1} fill="url(#colorLate)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 3: Employee Ranking & Swaps Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Bar Chart: Top Late Employees */}
            <div className="bg-white p-5 border border-slate-200 rounded-sm shadow-xs lg:col-span-7 flex flex-col justify-between text-left">
              <div>
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> รายชื่อพนักงานที่สายสะสม (นาทีที่เข้างานสาย)
                </h3>
                <p className="text-[10px] text-slate-400">แสดงพนักงาน 10 ลำดับแรกที่มีนาทีสายสะสมสูงสุดเพื่อช่วยฝ่ายบุคคลในการติดตามเป็นรายบุคคล</p>
              </div>

              {chartData.topLateEmployees.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-xs">ไม่มีพนักงานสายหรือขาดในเดือนนี้</div>
              ) : (
                <div className="w-full h-56 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData.topLateEmployees}
                      layout="vertical"
                      margin={{ top: 5, right: 15, left: -5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 9, fill: '#64748b' }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} width={60} />
                      <RechartsTooltip 
                        contentStyle={{ fontSize: '11px', fontFamily: 'sans-serif', borderRadius: '4px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                      <Bar dataKey="นาทีที่สาย" fill="#f59e0b" radius={[0, 2, 2, 0]} name="จำนวนนาทีที่สายสะสม" />
                      <Bar dataKey="สาย (ครั้ง)" fill="#fca5a5" radius={[0, 2, 2, 0]} name="จำนวนครั้งที่มาสาย" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* List/Summary of Approved Day Off Swaps & Leaves */}
            <div className="bg-white p-5 border border-slate-200 rounded-sm shadow-xs lg:col-span-5 flex flex-col justify-between text-left">
              <div>
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span> ข้อมูลสรุป ขาด ลา มาสาย และสลับวันหยุด
                </h3>
                <p className="text-[10px] text-slate-400">สถิติรายงานโดยสังเขปเพื่อใช้ประกอบการประเมินประจำเดือน</p>
              </div>

              <div className="mt-4 space-y-4 flex-1 flex flex-col justify-center">
                
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-[11px] text-slate-600 font-sans">คำขอสลับวันหยุดชดเชยที่เกิดขึ้น:</span>
                  </div>
                  <span className="text-xs font-black text-slate-700 font-mono">{dayOffSwaps.length} ครั้ง</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[11px] text-slate-600 font-sans">อนุมัติการสลับวันหยุดแล้ว:</span>
                  </div>
                  <span className="text-xs font-black text-emerald-600 font-mono">{dayOffSwaps.filter(s => s.status === 'approved').length} รายการ</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    <span className="text-[11px] text-slate-600 font-sans">จำนวนพนักงานที่ทำการลางานอนุมัติ:</span>
                  </div>
                  <span className="text-xs font-black text-indigo-600 font-mono">
                    {Array.from(new Set(leaves.filter(l => l.status === 'approved').map(l => l.employeeId))).length} คน
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                    <span className="text-[11px] text-slate-600 font-sans">อัตราความสูญเสียเนื่องจากการขาดงาน:</span>
                  </div>
                  <span className="text-xs font-black text-rose-600 font-mono">
                    {chartData.summary.totalPresent + chartData.summary.totalLate + chartData.summary.totalAbsent > 0
                      ? Math.round((chartData.summary.totalAbsent / (chartData.summary.totalPresent + chartData.summary.totalLate + chartData.summary.totalAbsent)) * 100)
                      : 0}%
                  </span>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 1: CELL ATTENDANCE STATUS EDIT MODAL */}
      {editingCell && (
        <div id="attendance-cell-edit-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 max-w-sm w-full p-5 shadow-xl space-y-4 text-xs">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-slate-800 font-sans flex items-center gap-1.5 uppercase tracking-wide">
                <Clock className="w-4 h-4 text-blue-500" /> แก้ไขเวลาทำงานรายบุคคล
              </h3>
              <button onClick={() => setEditingCell(null)} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-sm">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Info */}
            <div className="bg-slate-50 p-2.5 rounded-sm border border-slate-200 space-y-1 text-left font-sans">
              <p><strong>ชื่อพนักงาน:</strong> {employees.find(x => x.id === editingCell.employeeId)?.name}</p>
              <p><strong>รหัสพนักงาน:</strong> <span className="font-mono">{editingCell.employeeId}</span></p>
              <p><strong>วันที่ต้องการแก้:</strong> <span className="font-mono font-bold">{editingCell.date}</span></p>
            </div>

            <form onSubmit={handleCellEditSubmit} className="space-y-4">
              
              {/* Status Select */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">สถานะการปฏิบัติหน้าที่</label>
                <select
                  value={editingCell.status}
                  onChange={(e) => setEditingCell(prev => prev ? { ...prev, status: e.target.value as AttendanceStatus } : null)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-sm bg-white text-slate-700 focus:outline-none focus:border-blue-500 font-sans"
                  required
                >
                  <option value="present">มาทำงานปกติ (Present)</option>
                  <option value="absent">ขาดงาน (Absent)</option>
                  <option value="leave">ลางาน (Leave)</option>
                  <option value="late">มาทำงานสาย (Late)</option>
                  <option value="holiday">วันหยุด (Holiday / Weekend)</option>
                  <option value="swap_off">สลับวันหยุดชดเชย (Swap Off-Day)</option>
                </select>
              </div>

              {/* Late minutes (conditional) */}
              {editingCell.status === 'late' && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="font-semibold text-slate-700 block">จำนวนเวลาที่มาสาย (นาที)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={480}
                      value={editingCell.lateMinutes}
                      onChange={(e) => setEditingCell(prev => prev ? { ...prev, lateMinutes: Number(e.target.value) } : null)}
                      className="w-full pl-3 pr-10 py-1.5 border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:border-blue-500 font-mono font-bold"
                      required
                    />
                    <span className="absolute right-3 top-1.5 font-sans font-semibold text-slate-400">นาที</span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">บันทึกเพิ่มเติม / หมายเหตุ</label>
                <textarea
                  rows={2}
                  value={editingCell.notes}
                  onChange={(e) => setEditingCell(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  placeholder="เช่น ติดงานนอกสถานที่, ลากิจฉุกเฉิน, รถติดหนัก, สลับหยุดพิเศษ..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCell(null)}
                  className="flex-1 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-sm font-mono font-bold transition uppercase tracking-wide cursor-pointer bg-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-mono font-bold transition uppercase tracking-wide cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" /> บันทึกการลงเวลา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TIMELINE RECORD EDIT MODAL */}
      {editingTimelineRecord && (
        <div id="timeline-record-edit-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 max-w-sm w-full p-5 shadow-xl space-y-4 text-xs">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-slate-800 font-sans flex items-center gap-1.5 uppercase tracking-wide">
                <Clock className="w-4 h-4 text-blue-500" /> แก้ไขเวลาและประวัติการลงงาน
              </h3>
              <button onClick={() => setEditingTimelineRecord(null)} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-sm cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Info */}
            <div className="bg-slate-50 p-2.5 rounded-sm border border-slate-200 space-y-1 text-left font-sans">
              <p><strong>ชื่อพนักงาน:</strong> {editingTimelineRecord.employeeName}</p>
              <p><strong>รหัสพนักงาน:</strong> <span className="font-mono">{editingTimelineRecord.employeeId}</span></p>
              <p><strong>วันที่:</strong> <span className="font-mono font-bold">{editingTimelineRecord.date}</span></p>
            </div>

            <form onSubmit={handleTimelineEditSubmit} className="space-y-4 text-left">
              
              {/* Status Select */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">สถานะการลงชื่อเข้างาน</label>
                <select
                  value={editingTimelineRecord.status}
                  onChange={(e) => setEditingTimelineRecord(prev => prev ? { ...prev, status: e.target.value as AttendanceStatus } : null)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-sm bg-white text-slate-700 focus:outline-none focus:border-blue-500 font-sans"
                  required
                >
                  <option value="present">มาทำงานปกติ (Present)</option>
                  <option value="absent">ขาดงาน (Absent)</option>
                  <option value="leave">ลางาน (Leave)</option>
                  <option value="late">มาทำงานสาย (Late)</option>
                  <option value="holiday">วันหยุด (Holiday / Weekend)</option>
                  <option value="swap_off">สลับวันหยุดชดเชย (Swap Off-Day)</option>
                </select>
              </div>

              {/* Clock In / Out Times (conditional on Present/Late) */}
              {(editingTimelineRecord.status === 'present' || editingTimelineRecord.status === 'late') && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">เวลาเข้างานจริง</label>
                    <input
                      type="text"
                      placeholder="เช่น 08:15"
                      value={editingTimelineRecord.clockIn}
                      onChange={(e) => setEditingTimelineRecord(prev => prev ? { ...prev, clockIn: e.target.value } : null)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-sm font-mono focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">เวลาออกงานจริง</label>
                    <input
                      type="text"
                      placeholder="เช่น 17:35"
                      value={editingTimelineRecord.clockOut}
                      onChange={(e) => setEditingTimelineRecord(prev => prev ? { ...prev, clockOut: e.target.value } : null)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-sm font-mono focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Late minutes (conditional) */}
              {editingTimelineRecord.status === 'late' && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="font-semibold text-slate-700 block">จำนวนเวลาที่มาสาย (นาที)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={480}
                      value={editingTimelineRecord.lateMinutes}
                      onChange={(e) => setEditingTimelineRecord(prev => prev ? { ...prev, lateMinutes: Number(e.target.value) } : null)}
                      className="w-full pl-3 pr-10 py-1.5 border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:border-blue-500 font-mono font-bold"
                      required
                    />
                    <span className="absolute right-3 top-1.5 font-sans font-semibold text-slate-400">นาที</span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">บันทึกเพิ่มเติม / หมายเหตุ</label>
                <textarea
                  rows={2}
                  value={editingTimelineRecord.notes}
                  onChange={(e) => setEditingTimelineRecord(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  placeholder="เช่น ติดงานนอกสถานที่, สแกนนิ้วไม่ผ่าน, รถติดหนัก..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTimelineRecord(null)}
                  className="flex-1 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-sm font-mono font-bold transition uppercase tracking-wide cursor-pointer bg-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-mono font-bold transition uppercase tracking-wide cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" /> บันทึกประวัติ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SUBMIT DAY OFF SWAP MODAL */}
      {isSwapModalOpen && (
        <div id="day-off-swap-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4 text-xs">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
              <h3 className="font-bold text-slate-800 font-sans flex items-center gap-1.5 uppercase tracking-wide">
                <ArrowLeftRight className="w-5 h-5 text-blue-600" /> คำขอร้องอนุมัติสลับวันหยุดพนักงาน
              </h3>
              <button onClick={() => setIsSwapModalOpen(false)} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-sm cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSwapSubmit} className="space-y-4">
              
              {/* Employee Select */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block font-mono">เลือกพนักงานที่ต้องการสลับวันหยุด</label>
                <select
                  value={swapEmployeeId}
                  onChange={(e) => setSwapEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm bg-white text-slate-700 focus:outline-none focus:border-blue-500 font-sans"
                  required
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.id}) - ฝ่าย{emp.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Original Off date */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">วันหยุดเดิม (ที่มาทำงานแทน)</label>
                  <input
                    type="date"
                    value={swapOriginalDate}
                    onChange={(e) => setSwapOriginalDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:border-blue-500 font-mono"
                    required
                  />
                  <span className="text-[10px] text-slate-400 leading-none">วันเสาร์/อาทิตย์/วันหยุดปกติ</span>
                </div>

                {/* Swapped Target Off date */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block text-indigo-700">วันหยุดชดเชยที่ต้องการ</label>
                  <input
                    type="date"
                    value={swapNewDate}
                    onChange={(e) => setSwapNewDate(e.target.value)}
                    className="w-full px-3 py-2 border border-indigo-200 text-slate-700 focus:outline-none focus:border-blue-500 bg-indigo-50/10 font-mono"
                    required
                  />
                  <span className="text-[10px] text-slate-400 leading-none">วันธรรมดาที่ต้องการสลับไปหยุด</span>
                </div>
              </div>

              {/* Swap Reason */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">เหตุผลความจำเป็นในการขอสลับเปลี่ยน</label>
                <textarea
                  rows={3}
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                  placeholder="เช่น ติดกิจธุระด่วนครอบครัววันอาทิตย์นี้ จึงต้องการมาทำงานแทนแล้วไปหยุดในวันพุธถัดไป..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:border-blue-500 text-xs"
                  required
                ></textarea>
              </div>

              {/* Alert Warning Box */}
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-sm flex gap-2 text-amber-850">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-650 mt-0.5" />
                <div>
                  <p className="font-bold font-sans">คำชี้แจงระบบประมวลผล:</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed">
                    เมื่อได้รับการอนุมัติ (Approved) ระบบจะทำการตั้งค่าวันหยุดชดเชยบนปฏิทินให้โดยอัตโนมัติ สำหรับวันธรรมดาที่ขอสลับไปหยุด
                  </p>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex gap-2.5 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSwapModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-sm font-mono font-bold uppercase tracking-wider transition cursor-pointer bg-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-mono font-bold uppercase tracking-wider shadow-xs transition cursor-pointer"
                >
                  ยื่นแบบฟอร์มสลับวันหยุด
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PUBLIC HOLIDAYS & WEEKLY OFF DAYS SETTING MODAL */}
      {isHolidayModalOpen && (
        <div id="holidays-config-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-5 text-xs">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
              <h3 className="font-bold text-slate-800 font-sans flex items-center gap-1.5 uppercase tracking-wide">
                <Settings className="w-5 h-5 text-indigo-600" /> จัดการค่ากำหนดวันหยุดและนโยบายบริษัท
              </h3>
              <button onClick={() => setIsHolidayModalOpen(false)} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-sm cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Part 1: Weekly Off-Days */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-1 font-sans">1. กำหนดวันหยุดประจำสัปดาห์ของบริษัท (Weekly Off-Days)</h4>
              <p className="text-[10px] text-slate-400">เลือกวันหยุดสุดสัปดาห์หลักที่ระบบจะกำหนดให้เป็นวันหยุดอัตโนมัติแก่พนักงานทุกคน</p>
              
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'].map((day, idx) => {
                  const isSelected = weeklyOffDays.includes(idx);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleToggleWeeklyOff(idx)}
                      className={`px-3 py-1.5 rounded-sm font-semibold transition text-xs cursor-pointer ${
                        isSelected 
                          ? 'bg-rose-500 text-white shadow-xs' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {day} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Part 2: Public Holidays List & Add */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-1 font-sans">2. วันหยุดนักขัตฤกษ์ และ วันหยุดพิเศษ (Public & Special Holidays)</h4>
              
              {/* Form to add */}
              <form onSubmit={handleAddHoliday} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end bg-slate-50 p-2.5 border border-slate-200 rounded-sm">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 block">ระบุวันที่</label>
                  <input
                    type="date"
                    value={newHolidayDate}
                    onChange={(e) => setNewHolidayDate(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 rounded-sm text-xs focus:outline-none focus:border-blue-500 font-mono bg-white text-slate-700"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 block">ชื่อวันหยุด</label>
                  <input
                    type="text"
                    placeholder="เช่น วันสงกรานต์, วันจักรี"
                    value={newHolidayName}
                    onChange={(e) => setNewHolidayName(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 rounded-sm text-xs focus:outline-none focus:border-blue-500 bg-white text-slate-700"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> เพิ่มวันหยุด
                </button>
              </form>

              {/* Holidays list scrolling container */}
              <div className="max-h-48 overflow-y-auto border border-slate-250 rounded-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-1.5 px-3">วันที่ (YYYY-MM-DD)</th>
                      <th className="py-1.5 px-3">ชื่อประกาศวันหยุด</th>
                      <th className="py-1.5 px-3 text-center">ลบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans text-slate-700">
                    {Object.entries(publicHolidays)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([dateKey, name]) => (
                        <tr key={dateKey} className="hover:bg-slate-50 transition text-xs">
                          <td className="py-1.5 px-3 font-mono font-semibold">{dateKey}</td>
                          <td className="py-1.5 px-3">{name}</td>
                          <td className="py-1.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveHoliday(dateKey)}
                              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-sm transition cursor-pointer"
                              title="ลบวันหยุด"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    {Object.keys(publicHolidays).length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-xs text-slate-400 font-sans">
                          ไม่มีการประกาศวันหยุดพิเศษบนปฏิทิน
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Form Close action */}
            <div className="flex gap-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsHolidayModalOpen(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-sm font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer text-center"
              >
                เสร็จสิ้นบันทึกการตั้งค่า
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
