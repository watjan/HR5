import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Users, 
  Check, 
  Plus, 
  Trash2, 
  AlertCircle, 
  ArrowRight, 
  Clock, 
  Save, 
  Undo, 
  Edit2, 
  UserCheck, 
  RotateCcw, 
  Info,
  CalendarDays,
  Printer,
  BarChart3,
  ListFilter,
  CalendarRange,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileDown
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Employee, LeaveRequest, CounterDuty, CounterDutyAssignment } from '../types';

interface CounterDutyManagementProps {
  employees: Employee[];
  leaves: LeaveRequest[];
  counterDuties: CounterDuty[];
  onUpdateCounterDuties: (updated: CounterDuty[]) => void;
}

const TH_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const WEEKDAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

export default function CounterDutyManagement({
  employees,
  leaves,
  counterDuties,
  onUpdateCounterDuties
}: CounterDutyManagementProps) {
  // Active employees list
  const activeEmployees = useMemo(() => {
    return employees.filter(e => e.status === 'active');
  }, [employees]);

  // Selected pool IDs
  const [poolIds, setPoolIds] = useState<string[]>(() => {
    // Default to first 6 active employees
    return activeEmployees.slice(0, 6).map(e => e.id);
  });

  // Dynamic pool size modifier
  const setPoolSize = (newSize: number) => {
    if (newSize < 2 || newSize > 12) return;
    let updatedPool = [...poolIds];
    if (newSize > poolIds.length) {
      const diff = newSize - poolIds.length;
      const availableEmps = activeEmployees.filter(e => !poolIds.includes(e.id));
      for (let i = 0; i < diff; i++) {
        const newEmpId = availableEmps[i]?.id || "";
        updatedPool.push(newEmpId);
        if (newEmpId && !employeeWeeklyOffs[newEmpId]) {
          setEmployeeWeeklyOffs(prev => ({
            ...prev,
            [newEmpId]: [0] // default to Sunday
          }));
        }
      }
    } else {
      updatedPool = poolIds.slice(0, newSize);
    }
    setPoolIds(updatedPool);
    setCurrentSchedule(null); // Reset preview
  };

  // Individual weekly off days state: { [empId]: number[] }
  // Default: Sunday (0) as weekly off-day for everyone
  const [employeeWeeklyOffs, setEmployeeWeeklyOffs] = useState<{ [empId: string]: number[] }>(() => {
    const defaults: { [empId: string]: number[] } = {};
    activeEmployees.forEach(emp => {
      defaults[emp.id] = [0]; // default to Sunday off
    });
    return defaults;
  });

  // State for company holidays: { [dateStr]: string } (e.g., "2026-07-28": "วันเฉลิมพระชนมพรรษาฯ")
  const [companyHolidays, setCompanyHolidays] = useState<{ [dateStr: string]: string }>({
    "2026-07-28": "วันเฉลิมพระชนมพรรษาฯ พระบาทสมเด็จพระเจ้าอยู่หัว",
    "2026-07-13": "วันหยุดพิเศษบริษัท"
  });

  // Input state for adding custom holiday
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');

  // State for search/select pool members
  const [showSelectorIndex, setShowSelectorIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConfigEmpId, setSelectedConfigEmpId] = useState<string | null>(null);

  // Target Year and Month
  const [targetYear, setTargetYear] = useState<number>(2026);
  const [targetMonth, setTargetMonth] = useState<string>("07"); // Default July

  // Active schedule being viewed/edited (either generated or loaded)
  const [currentSchedule, setCurrentSchedule] = useState<CounterDuty | null>(null);
  
  // Custom editing of a specific date assignment
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Trigger notification
  const triggerAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => {
      setAlertMsg(null);
    }, 4000);
  };

  // Sync selectedConfigEmpId if pool changes
  useEffect(() => {
    if (poolIds.length > 0 && !selectedConfigEmpId) {
      setSelectedConfigEmpId(poolIds[0]);
    }
  }, [poolIds, selectedConfigEmpId]);

  // Filter employees for selector
  const filteredSelectorEmployees = useMemo(() => {
    return activeEmployees.filter(emp => {
      const matchSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.role.toLowerCase().includes(searchTerm.toLowerCase());
      // Exclude already selected employees unless we are choosing to replace
      const isAlreadyInPool = poolIds.includes(emp.id);
      return matchSearch && !isAlreadyInPool;
    });
  }, [activeEmployees, poolIds, searchTerm]);

  // Replace a pool member at index
  const selectPoolMember = (index: number, empId: string) => {
    const updated = [...poolIds];
    updated[index] = empId;
    setPoolIds(updated);
    
    // Set default weekly off for this new person if not defined
    if (!employeeWeeklyOffs[empId]) {
      setEmployeeWeeklyOffs(prev => ({
        ...prev,
        [empId]: [0] // Sunday
      }));
    }

    setShowSelectorIndex(null);
    setSearchTerm('');
    setCurrentSchedule(null); // Reset preview
  };

  // Helper to determine status on a specific date
  const checkDayOffOrLeave = (empId: string, dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const dayOfWeek = d.getDay();

    // 1. Check approved leaves
    const onLeave = leaves.some(leave => 
      leave.employeeId === empId && 
      leave.status === 'approved' && 
      dateStr >= leave.startDate && 
      dateStr <= leave.endDate
    );
    if (onLeave) {
      const leave = leaves.find(leave => 
        leave.employeeId === empId && 
        leave.status === 'approved' && 
        dateStr >= leave.startDate && 
        dateStr <= leave.endDate
      );
      const leaveTypeTH = leave?.type === 'sick' ? 'ลาป่วย' : leave?.type === 'personal' ? 'ลากิจ' : 'ลาพักร้อน';
      return { isOff: true, reason: `ลางาน (${leaveTypeTH})`, type: 'leave' };
    }

    // 2. Check individual weekly off-day
    const weeklyOffs = employeeWeeklyOffs[empId] || [0];
    const isWeeklyOff = weeklyOffs.includes(dayOfWeek);
    if (isWeeklyOff) {
      return { isOff: true, reason: `วันหยุดประจำตัว (${WEEKDAYS[dayOfWeek]})`, type: 'weekly_off' };
    }

    // 3. Check custom company/public holiday
    if (companyHolidays[dateStr]) {
      return { isOff: true, reason: `วันหยุดบริษัท (${companyHolidays[dateStr]})`, type: 'company_holiday' };
    }

    return { isOff: false, reason: "", type: "" };
  };

  // Add custom holiday
  const handleAddHoliday = () => {
    if (!newHolidayDate || !newHolidayName.trim()) {
      triggerAlert('error', 'กรุณาระบุทั้งวันที่และชื่อวันหยุด');
      return;
    }
    setCompanyHolidays(prev => ({
      ...prev,
      [newHolidayDate]: newHolidayName.trim()
    }));
    setNewHolidayDate('');
    setNewHolidayName('');
    setCurrentSchedule(null); // Reset current draft preview
    triggerAlert('success', 'เพิ่มวันหยุดบริษัทสำเร็จแล้ว');
  };

  // Remove custom holiday
  const handleRemoveHoliday = (dateStr: string) => {
    const updated = { ...companyHolidays };
    delete updated[dateStr];
    setCompanyHolidays(updated);
    setCurrentSchedule(null); // Reset current draft preview
    triggerAlert('success', 'ลบวันหยุดบริษัทเรียบร้อย');
  };

  // Toggle individual day-off
  const toggleIndividualWeeklyOff = (empId: string, dayIndex: number) => {
    const currentOffs = employeeWeeklyOffs[empId] || [];
    let updated: number[];
    if (currentOffs.includes(dayIndex)) {
      updated = currentOffs.filter(d => d !== dayIndex);
    } else {
      updated = [...currentOffs, dayIndex];
    }
    setEmployeeWeeklyOffs(prev => ({
      ...prev,
      [empId]: updated
    }));
    setCurrentSchedule(null); // Reset current draft preview
  };

  // Monthly Schedule Generator (Sequential Queue Rotation with Skipped Compensation)
  const handleGenerateSchedule = () => {
    const validPoolIds = poolIds.filter(Boolean);
    const poolLength = poolIds.length;
    if (validPoolIds.length < poolLength) {
      triggerAlert('error', `กรุณาเลือกพนักงานให้ครบทั้ง ${poolLength} คนสำหรับทำหน้าที่เฝ้าเคาเตอร์`);
      return;
    }

    const year = targetYear;
    const monthStr = targetMonth;
    const numDays = new Date(year, parseInt(monthStr), 0).getDate();
    const newAssignments: { [dateStr: string]: CounterDutyAssignment } = {};
    const logs: { id: string; date: string; message: string; type: 'skip' | 'override' | 'leave' }[] = [];
    
    // Initialize our continuous queue representing the fair order of shifts
    let queue = [...validPoolIds];

    for (let day = 1; day <= numDays; day++) {
      const dateStr = `${year}-${monthStr}-${String(day).padStart(2, '0')}`;
      let assigned = false;

      // Find the first available person in our queue who isn't off/on leave today
      let availIdx = -1;

      for (let i = 0; i < queue.length; i++) {
        const tempStatus = checkDayOffOrLeave(queue[i], dateStr);
        if (!tempStatus.isOff) {
          availIdx = i;
          break;
        }
      }

      if (availIdx === 0) {
        // Person who was first in queue is available! Easy case.
        const empId = queue[0];
        const emp = activeEmployees.find(e => e.id === empId);
        if (emp) {
          newAssignments[dateStr] = {
            employeeId: empId,
            employeeName: emp.name,
            isSubstitute: false
          };
          assigned = true;
          // Rotate this person to the back of the queue
          queue.push(queue.shift()!);
        }
      } else if (availIdx > 0) {
        // First person in queue (and potentially others) is off today.
        // The first available person is queue[availIdx], who acts as a substitute.
        const originalEmployeeId = queue[0];
        const originalEmp = activeEmployees.find(e => e.id === originalEmployeeId);
        
        const empId = queue[availIdx];
        const emp = activeEmployees.find(e => e.id === empId);

        if (emp) {
          const skipStatus = checkDayOffOrLeave(originalEmployeeId, dateStr);
          newAssignments[dateStr] = {
            employeeId: empId,
            employeeName: emp.name,
            isSubstitute: true,
            originalEmployeeId,
            originalEmployeeName: originalEmp?.name || "ไม่ทราบ",
            skipReason: skipStatus.reason
          };
          assigned = true;

          // Logs describing who was skipped, why, and that they will take the next day
          logs.push({
            id: `LOG-${dateStr}-${originalEmployeeId}-${Date.now()}`,
            date: dateStr,
            message: `ข้าม ${originalEmp?.name || "พนักงาน"} เนื่องจากตรงกับ${skipStatus.reason} โดยให้คุณ ${emp.name} ปฏิบัติหน้าที่แทน (และเลื่อน ${originalEmp?.name || "พนักงาน"} ไปขึ้นเวรในวันถัดไปแทน)`,
            type: skipStatus.type === 'leave' ? 'leave' : 'skip'
          });

          // Rearrange queue:
          // Keep the skipped people (from index 0 up to availIdx - 1) at the front of the queue,
          // so they get assigned on the very next available day!
          // Remove the assigned substitute (queue[availIdx]) and push them to the back of the queue.
          queue.splice(availIdx, 1);
          queue.push(empId);
        }
      }

      // Safe Fallback: If ALL employees in the queue are off/unavailable, force the first person in queue
      if (!assigned) {
        const fallbackEmpId = queue[0];
        const fallbackEmp = activeEmployees.find(e => e.id === fallbackEmpId);
        if (fallbackEmp) {
          newAssignments[dateStr] = {
            employeeId: fallbackEmpId,
            employeeName: fallbackEmp.name,
            isSubstitute: false
          };
          logs.push({
            id: `LOG-${dateStr}-fallback-${Date.now()}`,
            date: dateStr,
            message: `พนักงานทุกคนในคิวไม่ว่างในวันนี้ ระบบบังคับเลือกพนักงานคิวแรก ${fallbackEmp.name} เป็นกรณีพิเศษ`,
            type: 'override'
          });
          // Rotate to the back
          queue.push(queue.shift()!);
        }
      }
    }

    const scheduleId = `${year}-${monthStr}`;
    const newSchedule: CounterDuty = {
      id: scheduleId,
      month: monthStr,
      year: year,
      poolEmployeeIds: [...validPoolIds],
      assignments: newAssignments,
      employeeWeeklyOffs: { ...employeeWeeklyOffs },
      companyHolidays: { ...companyHolidays },
      rotationLogs: logs
    };

    setCurrentSchedule(newSchedule);
    triggerAlert('success', `สร้างตารางเวรเดือน ${TH_MONTHS[parseInt(monthStr) - 1]} ${year} สำเร็จแล้ว!`);
  };

  // Save active schedule to database list
  const handleSaveToFirebase = () => {
    if (!currentSchedule) return;

    // Filter out previous version of this month and push the new one
    const filtered = counterDuties.filter(s => s.id !== currentSchedule.id);
    const updated = [...filtered, currentSchedule];

    // Persist to parent component state which triggers Auto-Sync to Firestore
    onUpdateCounterDuties(updated);
    triggerAlert('success', `บันทึกตารางเวรลงฐานข้อมูลสำเร็จแล้ว (Auto-Sync ทำงานอยู่)`);
  };

  // Load a previously saved schedule
  const handleLoadSchedule = (schedule: CounterDuty) => {
    setCurrentSchedule(JSON.parse(JSON.stringify(schedule))); // deep clone
    setPoolIds([...schedule.poolEmployeeIds]);
    setTargetYear(schedule.year);
    setTargetMonth(schedule.month);
    
    if (schedule.employeeWeeklyOffs) {
      setEmployeeWeeklyOffs({ ...schedule.employeeWeeklyOffs });
    }
    if (schedule.companyHolidays) {
      setCompanyHolidays({ ...schedule.companyHolidays });
    }
    triggerAlert('success', `ดึงข้อมูลตารางเวรประจำเดือนจากฐานข้อมูลสำเร็จ`);
  };

  // Delete a saved schedule
  const handleDeleteSchedule = (scheduleId: string) => {
    if (confirm('คุณต้องการลบตารางเวรประจำเดือนนี้ออกจากฐานข้อมูลใช่หรือไม่?')) {
      const updated = counterDuties.filter(s => s.id !== scheduleId);
      onUpdateCounterDuties(updated);
      if (currentSchedule?.id === scheduleId) {
        setCurrentSchedule(null);
      }
      triggerAlert('success', 'ลบตารางเวรออกจากระบบเรียบร้อย');
    }
  };

  // Custom manual assignment override
  const handleManualOverride = (dateStr: string, empId: string) => {
    if (!currentSchedule) return;

    const emp = activeEmployees.find(e => e.id === empId);
    if (!emp) return;

    const updated = { ...currentSchedule };
    const originalAssignment = updated.assignments[dateStr];

    updated.assignments[dateStr] = {
      employeeId: empId,
      employeeName: emp.name,
      isSubstitute: true, // mark as manual swap
      originalEmployeeId: originalAssignment?.employeeId,
      originalEmployeeName: originalAssignment?.employeeName,
      skipReason: "การปรับสลับเวรด้วยตนเองโดยหัวหน้างาน"
    };

    // Add manual log
    const manualLog = {
      id: `LOG-${dateStr}-manual-${Date.now()}`,
      date: dateStr,
      message: `หัวหน้างานสลับเวรด้วยมือ: ให้คุณ ${emp.name} ทำหน้าที่แทน ${originalAssignment?.employeeName || 'ไม่มี'}`,
      type: 'override' as const
    };
    
    updated.rotationLogs = [manualLog, ...(updated.rotationLogs || [])];

    setCurrentSchedule(updated);
    setEditingDate(null);
    triggerAlert('success', `สลับให้คุณ ${emp.name} เฝ้าเคาเตอร์ในวันที่ ${dateStr} สำเร็จ`);
  };

  // Calculations for calendar grid
  const calendarDays = useMemo(() => {
    if (!currentSchedule) return [];
    const year = currentSchedule.year;
    const monthIndex = parseInt(currentSchedule.month) - 1;
    
    // Day of week of the 1st day of month (0 = Sun, 6 = Sat)
    const firstDayIndex = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    
    const days = [];
    
    // Empty padded days for previous month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    
    // Actual days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${currentSchedule.month}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        dateStr,
        assignment: currentSchedule.assignments[dateStr]
      });
    }
    
    return days;
  }, [currentSchedule]);

  // Calculate shift balance and fairness statistics
  const fairnessStats = useMemo(() => {
    if (!currentSchedule) return [];

    const statsMap: { 
      [empId: string]: { 
        name: string; 
        avatar?: string;
        weekdayDuties: number; 
        weekendDuties: number; 
        totalDuties: number; 
      } 
    } = {};

    // Initialize map for all pool employees
    poolIds.forEach(empId => {
      const emp = activeEmployees.find(e => e.id === empId);
      if (emp) {
        statsMap[empId] = {
          name: emp.name,
          avatar: emp.avatar,
          weekdayDuties: 0,
          weekendDuties: 0,
          totalDuties: 0
        };
      }
    });

    // Count duties
    Object.entries(currentSchedule.assignments).forEach(([dateStr, assignment]) => {
      const empId = assignment.employeeId;
      if (statsMap[empId]) {
        const d = new Date(dateStr + "T00:00:00");
        const dayOfWeek = d.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sun = 0, Sat = 6

        if (isWeekend) {
          statsMap[empId].weekendDuties += 1;
        } else {
          statsMap[empId].weekdayDuties += 1;
        }
        statsMap[empId].totalDuties += 1;
      }
    });

    // Calculate sum of all duties for percentages
    const totalAllDuties = Object.values(statsMap).reduce((sum, s) => sum + s.totalDuties, 0);

    return Object.entries(statsMap).map(([id, s]) => ({
      id,
      ...s,
      percentage: totalAllDuties > 0 ? Math.round((s.totalDuties / totalAllDuties) * 100) : 0
    })).sort((a, b) => b.totalDuties - a.totalDuties);
  }, [currentSchedule, poolIds, activeEmployees]);

  // Trigger browser print dialog
  const handlePrint = () => {
    window.print();
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPDF = async () => {
    const element = document.getElementById('duty-calendar-table-container');
    if (!element) {
      triggerAlert('error', 'ไม่พบตารางเวรสำหรับการส่งออก PDF');
      return;
    }

    setIsExportingPdf(true);
    triggerAlert('success', 'กำลังเตรียมไฟล์ PDF กรุณารอสักครู่...');

    try {
      // Temporarily hide any focus or editing rings or outline effects during capture
      element.classList.add('pdf-capture-mode');

      // Add a small delay to let UI adjust if needed
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(element, {
        scale: 2, // 2x resolution for super crisp text & grids
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        ignoreElements: (el) => {
          // Ignore anything marked no-print
          return el.classList.contains('no-print');
        }
      });

      element.classList.remove('pdf-capture-mode');

      const imgData = canvas.toDataURL('image/png');
      
      // Landscape A4 PDF dimensions (297mm x 210mm)
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = 297;
      const pdfHeight = 210;

      // Calculate sizes to maintain aspect ratio with nice margins
      const margin = 12; // 12mm margin
      const contentWidth = pdfWidth - (margin * 2); // 273mm
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      // Vertically center the content if it fits easily
      let yOffset = margin;
      if (contentHeight < pdfHeight - (margin * 2)) {
        yOffset = (pdfHeight - contentHeight) / 2;
      }

      pdf.addImage(imgData, 'PNG', margin, yOffset, contentWidth, contentHeight, undefined, 'FAST');
      
      const fileName = `ตารางเวรเฝ้าเคาเตอร์_${TH_MONTHS[parseInt(currentSchedule?.month || '01') - 1]}_${currentSchedule?.year || 2026}.pdf`;
      
      // Use Blob URL download trigger - highly compatible with iframe sandboxes
      try {
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 150);
      } catch (blobError) {
        console.warn('Blob download rejected, falling back to standard pdf.save()', blobError);
        pdf.save(fileName);
      }
      
      triggerAlert('success', 'ดาวน์โหลดไฟล์ PDF เรียบร้อยแล้ว! (หากไม่มีการดาวน์โหลด กรุณาใช้ปุ่ม "พิมพ์ / บันทึกเป็น PDF" ข้างกัน)');
    } catch (error) {
      console.error('PDF Generation Error:', error);
      triggerAlert('error', 'เกิดข้อผิดพลาดในการสร้างไฟล์ PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Print Styles - Perfect isolation for duty-calendar-table-container */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #duty-calendar-table-container, #duty-calendar-table-container * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #duty-calendar-table-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-grid {
            grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
          }
        }
      `}</style>

      {/* Alert Notification */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 px-5 py-3 rounded-md shadow-lg border flex items-center gap-3 bg-emerald-50 border-emerald-200 text-emerald-800 no-print"
          >
            {alertMsg.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-semibold">{alertMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Panel */}
      <div className="bg-white p-6 rounded-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm no-print">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-sm bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 font-sans tracking-tight flex items-center gap-2">
              <span>จัดเวรเฝ้าเคาเตอร์</span>
              <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold">ระบบอัตโนมัติคิวหมุนเวียน</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">ระบบวิเคราะห์คิวหมุนเวียนต่อเนื่อง {poolIds.length} คน คัดกรองวันหยุดนักขัตฤกษ์ วันลาอนุมัติ และวันหยุดประจําตัวของพนักงานแต่ละคนโดยฉลาด</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentSchedule && (
            <>
              <button 
                onClick={handleExportPDF}
                disabled={isExportingPdf}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-sm flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileDown className="w-4 h-4" /> 
                {isExportingPdf ? 'กำลังสร้าง PDF...' : 'ดาวน์โหลด PDF (เฉพาะตารางเวร)'}
              </button>
              <button 
                onClick={handlePrint}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-sm flex items-center justify-center gap-1.5 border border-slate-200 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" /> พิมพ์ตารางเวร (Print)
              </button>
              <button 
                onClick={handleSaveToFirebase}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-sm flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Save className="w-4 h-4" /> บันทึกลงฐานข้อมูล Firebase
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Parameters & Pool configuration */}
        <div className="lg:col-span-1 space-y-6 no-print">
          
          {/* Pool selection */}
          <div className="bg-white p-6 rounded-sm border border-slate-200 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                <h2 className="text-sm font-bold text-slate-800">พนักงานจัดเวรลำดับที่ 1-{poolIds.length} (วนเวรตามคิว)</h2>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">ลำดับในการวนคิวจะเรียงจากพนักงานคนแรกไปถึงคนสุดท้ายสลับวันกันอย่างเป็นธรรม หากพนักงานในคิวลาหยุดหรือถึงวันหยุดประจำตัวของตนเอง ระบบจะข้ามไปคิวพนักงานคนถัดไปโดยอัตโนมัติ</p>

            {/* Custom pool size selection */}
            <div className="flex items-center justify-between bg-indigo-50/50 p-3 rounded-sm border border-indigo-100 mb-2">
              <span className="text-xs font-bold text-indigo-800">จำนวนพนักงานที่จะร่วมอยู่เวร:</span>
              <select
                value={poolIds.length}
                onChange={(e) => setPoolSize(Number(e.target.value))}
                className="text-xs font-bold px-2 py-1 bg-white border border-indigo-200 rounded-sm focus:outline-none focus:border-indigo-500 text-slate-700 cursor-pointer"
              >
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(size => (
                  <option key={size} value={size}>{size} คน</option>
                ))}
              </select>
            </div>

            <div className="space-y-2.5">
              {poolIds.map((empId, index) => {
                const emp = activeEmployees.find(e => e.id === empId);

                return (
                  <div key={index} className="relative">
                    {emp ? (
                      <div className="p-3 bg-slate-50 rounded-sm border border-slate-200 hover:border-slate-300 transition space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs shrink-0">
                              {emp.avatar ? (
                                <img src={emp.avatar} alt="" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <span className="text-xs">{index + 1}</span>
                              )}
                            </div>
                            <div className="truncate">
                              <div className="text-xs font-bold text-slate-700 truncate">{emp.name}</div>
                              <div className="text-[10px] text-slate-400 font-medium truncate">{emp.role || 'พนักงาน'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button 
                              onClick={() => {
                                setSelectedConfigEmpId(emp.id);
                              }}
                              className={`text-[9px] px-2 py-1 rounded-sm font-bold border transition ${
                                selectedConfigEmpId === emp.id 
                                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200' 
                                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              ตัวเลือกเพิ่มเติม
                            </button>
                            <button 
                              onClick={() => {
                                setShowSelectorIndex(index);
                                setSearchTerm('');
                              }}
                              className="text-[9px] text-slate-400 hover:text-indigo-600 font-semibold cursor-pointer border border-slate-200 bg-white hover:bg-indigo-50 px-2 py-1 rounded-sm"
                            >
                              เปลี่ยนคน
                            </button>
                          </div>
                        </div>

                        {/* Inline Weekly Day-off direct toggles */}
                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500">วันหยุดสัปดาห์:</span>
                          <div className="flex gap-1">
                            {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((day, dayIdx) => {
                              const offs = employeeWeeklyOffs[emp.id] || [];
                              const isOff = offs.includes(dayIdx);
                              return (
                                <button
                                  key={dayIdx}
                                  onClick={() => toggleIndividualWeeklyOff(emp.id, dayIdx)}
                                  className={`w-5.5 h-5.5 rounded-full text-[9px] font-black flex items-center justify-center transition border ${
                                    isOff 
                                      ? 'bg-rose-500 text-white border-rose-600 shadow-sm' 
                                      : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600'
                                  }`}
                                  title={`สลับวันหยุดประจำสัปดาห์: วัน${WEEKDAYS[dayIdx]}`}
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => {
                          setShowSelectorIndex(index);
                          setSearchTerm('');
                        }}
                        className="w-full flex items-center justify-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 transition border border-dashed border-slate-300 rounded-sm text-xs text-slate-500 font-medium"
                      >
                        <Plus className="w-4 h-4 text-slate-400" /> เลือกคนจัดเวรตำแหน่งที่ {index + 1}
                      </button>
                    )}

                    {/* Employee select modal dropdown popup */}
                    {showSelectorIndex === index && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-sm shadow-xl z-20 max-h-60 overflow-y-auto p-2">
                        <div className="text-[11px] font-bold text-slate-500 px-2 py-1.5 bg-slate-50 rounded-sm mb-2">เลือกคนจัดเวรตำแหน่งที่ {index + 1}</div>
                        <input 
                          type="text" 
                          placeholder="พิมพ์ชื่อค้นหาพนักงาน..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-sm mb-2 focus:outline-none focus:border-indigo-500"
                        />
                        <div className="space-y-1">
                          {filteredSelectorEmployees.length > 0 ? (
                            filteredSelectorEmployees.map(item => (
                              <button
                                key={item.id}
                                onClick={() => selectPoolMember(index, item.id)}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-indigo-50 text-left rounded-sm transition text-xs"
                              >
                                <span className="font-bold text-slate-700">{item.name}</span>
                                <span className="text-[10px] text-slate-400">({item.role})</span>
                              </button>
                            ))
                          ) : (
                            <div className="text-[10px] text-slate-400 text-center py-2">ไม่พบพนักงานอื่นในระบบหลัก</div>
                          )}
                        </div>
                        <button 
                          onClick={() => setShowSelectorIndex(null)}
                          className="w-full mt-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-sm text-[10px] font-semibold text-center block"
                        >
                          ปิดการค้นหา
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Config options */}
          <div className="bg-white p-6 rounded-sm border border-slate-200 space-y-5 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <CalendarIcon className="w-5 h-5 text-indigo-500" />
              <h2 className="text-sm font-bold text-slate-800">ช่วงเดือน & วันหยุดประจำตัวพนักงาน</h2>
            </div>

            {/* Month & Year inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">เลือกเดือนปฏิบัติงาน</label>
                <select 
                  value={targetMonth} 
                  onChange={(e) => {
                    setTargetMonth(e.target.value);
                    setCurrentSchedule(null);
                  }}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-indigo-500 bg-white font-medium"
                >
                  {TH_MONTHS.map((m, idx) => (
                    <option key={idx} value={String(idx + 1).padStart(2, '0')}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">ปี ค.ศ.</label>
                <select 
                  value={targetYear} 
                  onChange={(e) => {
                    setTargetYear(Number(e.target.value));
                    setCurrentSchedule(null);
                  }}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-indigo-500 bg-white font-medium"
                >
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                  <option value={2028}>2028</option>
                </select>
              </div>
            </div>

            {/* Individual Weekly Day-off check */}
            {selectedConfigEmpId && (
              <div className="bg-slate-50 p-4 rounded-sm border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <UserCheck className="w-4 h-4 text-indigo-500" />
                    วันหยุดสัปดาห์ของ: <span className="text-indigo-600 underline">
                      {activeEmployees.find(e => e.id === selectedConfigEmpId)?.name?.split(' ')[0]}
                    </span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {WEEKDAYS.map((day, idx) => {
                    const currentOffs = employeeWeeklyOffs[selectedConfigEmpId] || [];
                    const isChecked = currentOffs.includes(idx);
                    return (
                      <label key={idx} className="flex items-center gap-1.5 px-2 py-1.5 bg-white rounded-sm hover:bg-indigo-50/50 cursor-pointer text-[11px] border border-slate-200">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => toggleIndividualWeeklyOff(selectedConfigEmpId, idx)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        />
                        <span className="text-slate-600 font-bold">วัน{day}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400">ระบบจะทำการข้ามพนักงานคนนี้เมื่อถึงวันหยุดประจำสัปดาห์ที่ติ๊กไว้ด้านบน</p>
              </div>
            )}

            {/* Public/Company Holiday setup */}
            <div className="space-y-2 pb-2">
              <label className="block text-[11px] font-bold text-slate-500">
                เพิ่มวันหยุดเพิ่มเติม / วันหยุดบริษัท ในเดือนนี้
              </label>
              <div className="flex gap-2">
                <input 
                  type="date"
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-indigo-500 bg-white shrink-0"
                />
                <input 
                  type="text"
                  placeholder="เช่น วันเฉลิมพระชนมพรรษาฯ"
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-indigo-500 bg-white"
                />
                <button 
                  onClick={handleAddHoliday}
                  className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-sm border border-indigo-200 text-xs font-bold cursor-pointer"
                >
                  เพิ่ม
                </button>
              </div>

              {/* Holiday list display */}
              {Object.keys(companyHolidays).length > 0 && (
                <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto bg-slate-50 p-2 rounded-sm border border-slate-100">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">วันหยุดพิเศษที่เปิดใช้งาน:</span>
                  {Object.entries(companyHolidays).map(([dateStr, name]) => (
                    <div key={dateStr} className="flex items-center justify-between p-1.5 bg-white border border-slate-100 rounded-sm text-[10px]">
                      <div className="truncate pr-2">
                        <span className="font-mono text-slate-500 text-[9px] mr-1.5 font-bold">{dateStr}</span>
                        <span className="text-slate-600 font-medium">{name}</span>
                      </div>
                      <button 
                        onClick={() => handleRemoveHoliday(dateStr)}
                        className="text-rose-500 hover:text-rose-700"
                        title="ลบวันหยุดนี้"
                      >
                        <X className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={handleGenerateSchedule}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 transition text-white font-bold text-xs rounded-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <RotateCcw className="w-4 h-4" /> สร้างตารางเวรแบบหมุนคิวอัตโนมัติ
            </button>
          </div>

          {/* Database saved schedules list */}
          <div className="bg-white p-6 rounded-sm border border-slate-200 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <CalendarRange className="w-5 h-5 text-indigo-500" />
              <h2 className="text-sm font-bold text-slate-800">ตารางเวรในฐานข้อมูล ({counterDuties.length})</h2>
            </div>

            {counterDuties.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-4">ไม่มีตารางเวรประวัติเฝ้าเคาเตอร์ที่บันทึกใน Firebase</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {counterDuties.map((sch) => (
                  <div key={sch.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-sm hover:bg-slate-100/50">
                    <div>
                      <div className="text-xs font-bold text-slate-700">ตารางเวรเดือน{TH_MONTHS[parseInt(sch.month) - 1]} {sch.year}</div>
                      <div className="text-[9px] text-slate-400 font-mono mt-0.5">{Object.keys(sch.assignments).length} วันขึ้นเวรสะสม</div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleLoadSchedule(sch)}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                      >
                        เปิดดู
                      </button>
                      <button 
                        onClick={() => handleDeleteSchedule(sch.id)}
                        className="text-[10px] text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right column: Roster visual representation */}
        <div className="lg:col-span-2 space-y-6 print-full-width">
          {currentSchedule ? (
            <div className="bg-white p-6 rounded-sm border border-slate-200 space-y-6 shadow-sm print-border-thick print-p-0 print-shadow-none">
              
              <div id="duty-calendar-table-container" className="bg-white p-4 rounded-sm space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 print-p-0">
                  <div>
                    <h2 className="text-base font-bold text-slate-800">
                      ตารางปฏิบัติการเฝ้าเคาเตอร์ ประจำเดือน{TH_MONTHS[parseInt(currentSchedule.month) - 1]} {currentSchedule.year}
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5 no-print">
                      * สามารถคลิกที่กล่องวันที่เพื่อทำการแก้ไขสลับตัวบุคคลปฏิบัติหน้าที่จริงด้วยตนเองได้ทันที
                    </p>
                  </div>
                  <button
                    onClick={handleExportPDF}
                    disabled={isExportingPdf}
                    className="no-print self-start sm:self-center px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold rounded-sm flex items-center gap-1 border border-rose-200 transition cursor-pointer disabled:opacity-50"
                  >
                    <FileDown className="w-3.5 h-3.5" /> 
                    {isExportingPdf ? 'กำลังโหลด...' : 'โหลด PDF ตารางเวร'}
                  </button>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-sm border border-slate-100 no-print">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    <span className="font-bold">เวรปฏิบัติหน้าที่ปกติ</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="font-bold">เวรทดแทน / สลับด้วยเหตุจำเป็น</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="font-bold">วันลา / วันหยุดบริษัท</span>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 print-grid">
                  {WEEKDAYS.map((day, idx) => (
                    <div key={idx} className="py-2 text-center text-xs font-bold text-slate-600 bg-slate-100/60 rounded-sm border border-slate-200">
                      {day}
                    </div>
                  ))}

                  {calendarDays.map((dayObj, idx) => {
                    if (!dayObj) {
                      return <div key={`empty-${idx}`} className="bg-slate-50/50 aspect-square border border-dashed border-slate-100 rounded-sm"></div>;
                    }

                    const { day, dateStr, assignment } = dayObj;
                    const date = new Date(dateStr + "T00:00:00");
                    const dayOfWeek = date.getDay();
                    
                    // Check holiday on this day for the assigned employee
                    const empId = assignment?.employeeId || "";
                    const holidayCheck = empId ? checkDayOffOrLeave(empId, dateStr) : { isOff: false, reason: "" };
                    const isCompanyHoliday = !!companyHolidays[dateStr];

                    return (
                      <div 
                        key={dateStr} 
                        onClick={() => setEditingDate(dateStr)}
                        className={`relative p-2.5 border aspect-square rounded-sm flex flex-col justify-between transition cursor-pointer group hover:border-indigo-400 hover:shadow-sm ${
                          isCompanyHoliday
                            ? 'bg-rose-50/40 border-rose-200'
                            : assignment?.isSubstitute 
                              ? 'bg-amber-50/50 border-amber-300' 
                              : 'bg-white border-slate-200'
                        }`}
                      >
                        {/* Date label */}
                        <div className="flex justify-between items-center">
                          <span className={`text-xs font-bold ${isCompanyHoliday ? 'text-rose-600 font-black' : 'text-slate-700'}`}>
                            {day}
                          </span>
                          {isCompanyHoliday && (
                            <span className="text-[7px] bg-rose-100 text-rose-700 font-bold px-1 rounded-sm truncate max-w-[45px] no-print" title={companyHolidays[dateStr]}>
                              หยุดบริษัท
                            </span>
                          )}
                        </div>

                        {/* Assignment name */}
                        {assignment ? (
                          <div className="mt-1">
                            <div className={`text-xs font-bold truncate leading-tight ${assignment.isSubstitute ? 'text-amber-700' : 'text-slate-800'}`}>
                              {assignment.employeeName}
                            </div>
                            {assignment.isSubstitute && (
                              <div className="text-[8px] text-amber-600 font-semibold mt-0.5 truncate flex items-center gap-0.5" title={`ทดแทนเนื่องจาก: ${assignment.skipReason || assignment.originalEmployeeName}`}>
                                <Info className="w-2.5 h-2.5 shrink-0" /> แทน{assignment.originalEmployeeName?.split(' ')[0]}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-400 italic">ไม่มีข้อมูลเวร</span>
                        )}

                        {/* Tooltip on hover */}
                        <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition no-print">
                          <Edit2 className="w-3 h-3 text-slate-400 hover:text-indigo-600" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Override / Manual Swap Panel */}
              {editingDate && (
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-sm space-y-3 no-print">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Edit2 className="w-4 h-4 text-indigo-500" />
                      สลับมอบหมายพนักงานปฏิบัติหน้าที่เฝ้าเคาเตอร์ในวันที่ <span className="font-mono text-indigo-600 font-bold underline">{editingDate}</span>
                    </span>
                    <button 
                      onClick={() => setEditingDate(null)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 underline font-semibold cursor-pointer"
                    >
                      ปิดแผงแก้ไข
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {poolIds.map((empId) => {
                      const emp = activeEmployees.find(e => e.id === empId);
                      if (!emp) return null;

                      const isCurrent = currentSchedule.assignments[editingDate]?.employeeId === empId;

                      return (
                        <button
                          key={empId}
                          onClick={() => handleManualOverride(editingDate, empId)}
                          className={`p-2.5 rounded-sm border text-left flex flex-col justify-between transition cursor-pointer ${
                            isCurrent 
                              ? 'bg-indigo-600 border-indigo-600 text-white' 
                              : 'bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-700'
                          }`}
                        >
                          <span className="text-xs font-bold leading-tight truncate">{emp.name}</span>
                          <span className={`text-[9px] mt-1 ${isCurrent ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {isCurrent ? 'เวรเฝ้าอยู่ตอนนี้' : 'คลิกเพื่อสลับ'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Fairness Stats & Rotation Logs Accordion Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                
                {/* Fairness Stats Card */}
                <div className="bg-slate-50 p-5 rounded-sm border border-slate-200 space-y-3 print-shadow-none">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-bold text-slate-800">สถิติความเที่ยงธรรม (Fairness Stats)</h3>
                  </div>

                  <div className="space-y-3">
                    {fairnessStats.map(stat => (
                      <div key={stat.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700">{stat.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono font-semibold">
                            วันปฏิบัติงาน {stat.totalDuties} วัน (ธรรมดา {stat.weekdayDuties} / หยุดสุดสัปดาห์ {stat.weekendDuties})
                          </span>
                        </div>
                        {/* Custom visual progress bar */}
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-indigo-600 h-full rounded-l-full transition-all" 
                            style={{ width: `${stat.percentage}%` }}
                            title={`สัดส่วนภาระงานเวรธรรมดา ${stat.percentage}%`}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rotation Logs Card */}
                <div className="bg-slate-50 p-5 rounded-sm border border-slate-200 space-y-3 print-shadow-none">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200">
                    <ListFilter className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-bold text-slate-800">บันทึกกิจกรรมจัดเวร (Rotation Logs)</h3>
                  </div>

                  {(!currentSchedule.rotationLogs || currentSchedule.rotationLogs.length === 0) ? (
                    <p className="text-[10px] text-slate-400 italic text-center py-4">ไม่มีประวัติข้ามเวรหรือแก้ไขพิเศษในเดือนนี้</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {currentSchedule.rotationLogs.map((log) => (
                        <div 
                          key={log.id} 
                          className={`p-2 rounded-sm text-[10px] leading-relaxed border ${
                            log.type === 'leave' 
                              ? 'bg-rose-50 border-rose-150 text-rose-800' 
                              : log.type === 'override' 
                                ? 'bg-amber-50 border-amber-200 text-amber-800 font-semibold' 
                                : 'bg-slate-100 border-slate-200 text-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold mb-0.5">
                            <span className="font-mono text-slate-500">{log.date}</span>
                            <span className="uppercase text-[8px] font-bold px-1 rounded bg-white border">
                              {log.type === 'leave' ? 'พนักงานลาหยุด' : log.type === 'override' ? 'ตั้งค่าพิเศษ' : 'ข้ามคิววันหยุด'}
                            </span>
                          </div>
                          <div>{log.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-white p-12 rounded-sm border border-slate-200 flex flex-col items-center justify-center text-center shadow-sm py-20">
              <CalendarIcon className="w-16 h-16 text-slate-300 stroke-1" />
              <h3 className="text-slate-700 font-bold text-base mt-4">ไม่มีตารางปฏิบัติงานเฝ้าเคาเตอร์กำลังแสดงผล</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
                กรุณาตั้งชื่อและลำดับพนักงานทั้ง 6 คนในคิวหมุนเวียน เลือกวันหยุดประจำสัปดาห์ของแต่ละคน หรือเพิ่มวันหยุดนักขัตฤกษ์ของบริษัท จากนั้นกดปุ่ม <strong className="text-indigo-600">"สร้างตารางเวรแบบหมุนคิวอัตโนมัติ"</strong> ด้านซ้าย
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
