import { useState, useMemo, useEffect } from 'react';
import { isLocalStorageEnabled, setLocalStorageEnabled } from '../lib/safeStorage';
import { 
  Database, 
  Search, 
  Table, 
  FileJson, 
  Copy, 
  Check, 
  Trash2, 
  AlertTriangle, 
  RefreshCw, 
  X, 
  ChevronRight, 
  Info, 
  ShieldAlert,
  ArrowDownToLine,
  ExternalLink,
  Cloud,
  Server,
  HardDrive
} from 'lucide-react';

interface DatabaseInspectorProps {
  employees: any[];
  leaves: any[];
  payroll: any[];
  jobs: any[];
  applicants: any[];
  evaluations: any[];
  cashFlow: any[];
  cheques: any[];
  attendanceRecords: any;
  dayOffSwaps: any[];
  partnerBillings: any[];
  partnerCompanies: any[];
  systemSettings: any;
  auditLogs: any[];
  sales: any[];
  onDeleteRow?: (tableName: string, id: string) => void;
  onClearTable?: (tableName: string) => void;
}

export default function DatabaseInspector({
  employees,
  leaves,
  payroll,
  jobs,
  applicants,
  evaluations,
  cashFlow,
  cheques,
  attendanceRecords,
  dayOffSwaps,
  partnerBillings,
  partnerCompanies,
  systemSettings,
  auditLogs,
  sales,
  onDeleteRow,
  onClearTable
}: DatabaseInspectorProps) {
  const [selectedTable, setSelectedTable] = useState<string>('employees');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Database source states
  const [dataSource, setDataSource] = useState<'local' | 'firebase' | 'mysql'>('firebase');
  const [isLSOn, setIsLSOn] = useState(() => isLocalStorageEnabled());
  const [remoteData, setRemoteData] = useState<any>(null);
  const [dbConfig, setDbConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Delete confirmation states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null);
  const [deletingTableName, setDeletingTableName] = useState<string | null>(null);

  // Clear table confirmation states
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [clearingTableName, setClearingTableName] = useState<string | null>(null);

  // Helper to flatten attendance records for inspector viewing
  const flatAttendance = useMemo(() => {
    const records: any[] = [];
    if (!attendanceRecords) return records;
    
    Object.entries(attendanceRecords).forEach(([empId, dates]: [string, any]) => {
      if (dates && typeof dates === 'object') {
        Object.entries(dates).forEach(([date, details]: [string, any]) => {
          records.push({
            id: `${empId}_${date}`,
            employeeId: empId,
            date: date,
            checkIn: details.checkIn || '-',
            checkOut: details.checkOut || '-',
            status: details.status || '-',
            overtimeHours: details.overtimeHours || 0,
            notes: details.notes || ''
          });
        });
      }
    });
    return records;
  }, [attendanceRecords]);

  // Helper to flatten remote attendance records from Firebase
  const flatRemoteAttendance = useMemo(() => {
    const records: any[] = [];
    const sourceData = remoteData?.[dataSource];
    if (!sourceData || !sourceData.attendance) return records;
    
    if (Array.isArray(sourceData.attendance)) {
      sourceData.attendance.forEach((item: any) => {
        if (!item) return;
        const empId = item.id || item.employeeId;
        const dates = item.records || item.dates || item;
        if (dates && typeof dates === 'object') {
          Object.entries(dates).forEach(([date, details]: [string, any]) => {
            if (details && typeof details === 'object') {
              records.push({
                id: `${empId}_${date}`,
                employeeId: empId,
                date: date,
                checkIn: details.checkIn || '-',
                checkOut: details.checkOut || '-',
                status: details.status || '-',
                overtimeHours: details.overtimeHours || 0,
                notes: details.notes || ''
              });
            }
          });
        }
      });
    } else if (typeof sourceData.attendance === 'object') {
      Object.entries(sourceData.attendance).forEach(([empId, dates]: [string, any]) => {
        if (dates && typeof dates === 'object') {
          Object.entries(dates).forEach(([date, details]: [string, any]) => {
            if (details && typeof details === 'object') {
              records.push({
                id: `${empId}_${date}`,
                employeeId: empId,
                date: date,
                checkIn: details.checkIn || '-',
                checkOut: details.checkOut || '-',
                status: details.status || '-',
                overtimeHours: details.overtimeHours || 0,
                notes: details.notes || ''
              });
            }
          });
        }
      });
    }
    return records;
  }, [dataSource, remoteData]);

  // Fetch remote databases data & configs
  const fetchRemoteDataAndConfig = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      // 1. Fetch config and connection status
      const configRes = await fetch('/api/db/config');
      if (configRes.ok) {
        const configJson = await configRes.json();
        setDbConfig(configJson);
      }

      // 2. Fetch the synchronized data from both databases
      const loadRes = await fetch('/api/db/load');
      if (loadRes.ok) {
        const loadJson = await loadRes.json();
        if (loadJson.success) {
          setRemoteData(loadJson.data);
        } else {
          setFetchError(loadJson.error || 'ล้มเหลวในการอ่านตารางคลาวด์');
        }
      } else {
        setFetchError(`เซิร์ฟเวอร์ตอบกลับรหัสข้อผิดพลาด: ${loadRes.status}`);
      }
    } catch (err: any) {
      setFetchError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์สำรอง');
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial fetch, set up 20s real-time live polling, and auto-fetch on local state change
  useEffect(() => {
    // Immediate fetch on mount
    fetchRemoteDataAndConfig();

    // Moderate polling every 20 seconds for Firebase updates (paused if tab is hidden or not viewing Firebase)
    const pollInterval = setInterval(() => {
      if (document.hidden) return; // Skip fetching if tab is hidden/inactive to save database reads
      if (dataSource !== 'firebase') return; // Only poll when active data source is firebase
      fetchRemoteDataAndConfig();
    }, 20000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [dataSource]);

  // Also trigger immediate update if any local states change (with a 300ms debounce)
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchRemoteDataAndConfig();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [
    employees,
    leaves,
    payroll,
    jobs,
    applicants,
    evaluations,
    cashFlow,
    cheques,
    attendanceRecords,
    dayOffSwaps,
    partnerBillings,
    partnerCompanies,
    systemSettings,
    auditLogs,
    sales
  ]);

  // Wrap tables into metadata based on selected data source
  const tablesMetadata = useMemo(() => {
    if (dataSource === 'local') {
      return [
        { id: 'employees', name: 'Employees (ข้อมูลพนักงาน)', count: employees.length, data: employees, remoteSupported: true },
        { id: 'leaves', name: 'Leaves (ข้อมูลการลางาน)', count: leaves.length, data: leaves, remoteSupported: true },
        { id: 'payroll', name: 'Payroll (เงินเดือน & ภาษี)', count: payroll.length, data: payroll, remoteSupported: true },
        { id: 'jobs', name: 'Jobs (ตำแหน่งงานว่าง)', count: jobs.length, data: jobs, remoteSupported: true },
        { id: 'applicants', name: 'Applicants (ผู้สมัครงาน)', count: applicants.length, data: applicants, remoteSupported: true },
        { id: 'evaluations', name: 'Evaluations (การประเมินผลงาน)', count: evaluations.length, data: evaluations, remoteSupported: true },
        { id: 'cashFlow', name: 'CashFlow (ตรวจเช็คขารับ-ขาจ่าย)', count: cashFlow.length, data: cashFlow, remoteSupported: true },
        { id: 'cheques', name: 'Cheques (เช็คจ่าย & เช็ครับ)', count: cheques.length, data: cheques, remoteSupported: true },
        { id: 'attendance', name: 'Attendance (ประวัติเวลาทำงาน)', count: flatAttendance.length, data: flatAttendance, remoteSupported: true },
        { id: 'dayOffSwaps', name: 'DayOffSwaps (สลับวันหยุด)', count: dayOffSwaps.length, data: dayOffSwaps, remoteSupported: true },
        { id: 'partnerBillings', name: 'PartnerBillings (ใบส่งของ/วางบิล)', count: partnerBillings.length, data: partnerBillings, remoteSupported: true },
        { id: 'partnerCompanies', name: 'PartnerCompanies (บริษัทคู่ค้า)', count: partnerCompanies.length, data: partnerCompanies, remoteSupported: true },
        { id: 'systemSettings', name: 'SystemSettings (ค่าตั้งค่าระบบ)', count: systemSettings ? 1 : 0, data: systemSettings ? [systemSettings] : [], remoteSupported: true },
        { id: 'auditLogs', name: 'AuditLogs (บันทึกประวัติระบบ)', count: auditLogs.length, data: auditLogs, remoteSupported: true },
        { id: 'sales', name: 'Sales (ยอดขายรายวัน)', count: sales.length, data: sales, remoteSupported: true }
      ];
    } else {
      const sourceData = remoteData?.[dataSource] || {};
      return [
        { id: 'employees', name: 'Employees (ข้อมูลพนักงาน)', count: (sourceData.employees || []).length, data: sourceData.employees || [], remoteSupported: true },
        { id: 'leaves', name: 'Leaves (ข้อมูลการลางาน)', count: (sourceData.leaves || []).length, data: sourceData.leaves || [], remoteSupported: true },
        { id: 'payroll', name: 'Payroll (เงินเดือน & ภาษี)', count: (sourceData.payroll || []).length, data: sourceData.payroll || [], remoteSupported: true },
        { id: 'jobs', name: 'Jobs (ตำแหน่งงานว่าง)', count: (sourceData.jobs || []).length, data: sourceData.jobs || [], remoteSupported: true },
        { id: 'applicants', name: 'Applicants (ผู้สมัครงาน)', count: (sourceData.applicants || []).length, data: sourceData.applicants || [], remoteSupported: true },
        { id: 'evaluations', name: 'Evaluations (การประเมินผลงาน)', count: (sourceData.evaluations || []).length, data: sourceData.evaluations || [], remoteSupported: true },
        { id: 'cashFlow', name: 'CashFlow (ตรวจเช็คขารับ-ขาจ่าย)', count: (sourceData.cashflow || []).length, data: sourceData.cashflow || [], remoteSupported: true },
        { id: 'cheques', name: 'Cheques (เช็คจ่าย & เช็ครับ)', count: (sourceData.cheques || []).length, data: sourceData.cheques || [], remoteSupported: true },
        { id: 'attendance', name: 'Attendance (ประวัติเวลาทำงาน)', count: flatRemoteAttendance.length, data: flatRemoteAttendance, remoteSupported: true },
        { id: 'dayOffSwaps', name: 'DayOffSwaps (สลับวันหยุด)', count: (sourceData.dayoffSwaps || []).length, data: sourceData.dayoffSwaps || [], remoteSupported: true },
        { id: 'partnerBillings', name: 'PartnerBillings (ใบส่งของ/วางบิล)', count: (sourceData.partnerBillings || []).length, data: sourceData.partnerBillings || [], remoteSupported: true },
        { id: 'partnerCompanies', name: 'PartnerCompanies (บริษัทคู่ค้า)', count: (sourceData.partnerCompanies || []).length, data: sourceData.partnerCompanies || [], remoteSupported: true },
        { id: 'systemSettings', name: 'SystemSettings (ค่าตั้งค่าระบบ)', count: (sourceData.systemSettings || []).length, data: sourceData.systemSettings || [], remoteSupported: true },
        { id: 'auditLogs', name: 'AuditLogs (บันทึกประวัติระบบ)', count: (sourceData.auditLogs || []).length, data: sourceData.auditLogs || [], remoteSupported: true },
        { id: 'sales', name: 'Sales (ยอดขายรายวัน)', count: (sourceData.sales || []).length, data: sourceData.sales || [], remoteSupported: true }
      ];
    }
  }, [dataSource, remoteData, employees, leaves, payroll, jobs, applicants, evaluations, cashFlow, cheques, flatAttendance, flatRemoteAttendance, dayOffSwaps, partnerBillings, partnerCompanies, systemSettings, auditLogs, sales]);

  const currentTable = useMemo(() => {
    return tablesMetadata.find(t => t.id === selectedTable) || tablesMetadata[0];
  }, [selectedTable, tablesMetadata]);

  // Dynamic columns detection from the first data object
  const tableColumns = useMemo(() => {
    const dataList = currentTable.data;
    if (!dataList || dataList.length === 0) return [];
    
    // Extract keys from first item
    const firstItem = dataList[0];
    return Object.keys(firstItem).filter(key => typeof firstItem[key] !== 'object' || firstItem[key] === null);
  }, [currentTable]);

  // Handle Search Filtering
  const filteredData = useMemo(() => {
    if (!searchQuery) return currentTable.data;
    
    const query = searchQuery.toLowerCase();
    return currentTable.data.filter((item: any) => {
      return Object.values(item).some(val => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(query);
      });
    });
  }, [currentTable.data, searchQuery]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenDeleteConfirm = (id: string) => {
    setDeletingRowId(id);
    setDeletingTableName(currentTable.id);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingRowId && deletingTableName) {
      if (dataSource === 'local') {
        if (onDeleteRow) onDeleteRow(deletingTableName, deletingRowId);
      } else {
        // First delete from local React state to keep all client UI in sync
        if (onDeleteRow) onDeleteRow(deletingTableName, deletingRowId);

        // Pre-compute the updated dataset for remote synchronization
        try {
          setIsLoading(true);
          const sourceData = { ...remoteData?.[dataSource] };
          if (sourceData) {
            const keyMap: { [key: string]: string } = {
              employees: 'employees',
              leaves: 'leaves',
              payroll: 'payroll',
              sales: 'sales',
              cheques: 'cheques',
              cashFlow: 'cashflow',
              partnerBillings: 'partnerBillings',
              auditLogs: 'auditLogs'
            };
            const remoteKey = keyMap[deletingTableName] || deletingTableName;
            if (sourceData[remoteKey]) {
              sourceData[remoteKey] = sourceData[remoteKey].filter((item: any) => {
                const rowId = item.id || item.employeeId || item.idNumber || item.txId;
                return String(rowId) !== String(deletingRowId);
              });
            }

            // Sync updated payload back to backend database
            const payload = {
              employees: sourceData.employees || [],
              payroll: sourceData.payroll || [],
              leaves: sourceData.leaves || [],
              sales: sourceData.sales || [],
              cheques: sourceData.cheques || [],
              cashflow: sourceData.cashflow || [],
              partnerBillings: sourceData.partnerBillings || [],
              auditLogs: sourceData.auditLogs || []
            };

            const res = await fetch('/api/db/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            if (res.ok) {
              const data = await res.json();
              if (data.success) {
                // Refresh local states with remote data source
                await fetchRemoteDataAndConfig();
              }
            }
          }
        } catch (error) {
          console.error("Failed to sync deletion to remote:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    setIsDeleteConfirmOpen(false);
    setDeletingRowId(null);
    setDeletingTableName(null);
  };

  const handleOpenClearConfirm = () => {
    setClearingTableName(currentTable.id);
    setIsClearConfirmOpen(true);
  };

  const handleConfirmClear = async () => {
    if (clearingTableName) {
      if (dataSource === 'local') {
        if (onClearTable) onClearTable(clearingTableName);
      } else {
        // Clear locally first
        if (onClearTable) onClearTable(clearingTableName);

        try {
          setIsLoading(true);
          const sourceData = { ...remoteData?.[dataSource] };
          if (sourceData) {
            const keyMap: { [key: string]: string } = {
              employees: 'employees',
              leaves: 'leaves',
              payroll: 'payroll',
              sales: 'sales',
              cheques: 'cheques',
              cashFlow: 'cashflow',
              partnerBillings: 'partnerBillings',
              auditLogs: 'auditLogs'
            };
            const remoteKey = keyMap[clearingTableName] || clearingTableName;
            sourceData[remoteKey] = [];

            // Sync cleared payload back to backend database
            const payload = {
              employees: sourceData.employees || [],
              payroll: sourceData.payroll || [],
              leaves: sourceData.leaves || [],
              sales: sourceData.sales || [],
              cheques: sourceData.cheques || [],
              cashflow: sourceData.cashflow || [],
              partnerBillings: sourceData.partnerBillings || [],
              auditLogs: sourceData.auditLogs || []
            };

            const res = await fetch('/api/db/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            if (res.ok) {
              const data = await res.json();
              if (data.success) {
                // Refresh remote database states
                await fetchRemoteDataAndConfig();
              }
            }
          }
        } catch (error) {
          console.error("Failed to sync clear table to remote:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    setIsClearConfirmOpen(false);
    setClearingTableName(null);
  };

  const exportTableCSV = () => {
    if (!filteredData || filteredData.length === 0) return;
    const headers = Object.keys(filteredData[0]).join(',');
    const rows = filteredData.map((item: any) => {
      return Object.values(item).map(val => {
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      }).join(',');
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `db_export_${currentTable.id}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="database-inspector-view" className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 border border-slate-200 rounded-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-sm flex items-center justify-center text-white">
            <Database className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest font-mono text-slate-900 flex items-center gap-2">
              ตัวตรวจสอบตารางฐานข้อมูล (System Database Ledger)
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              ระบบตรวจสอบ โครงสร้างคีย์ คอนฟิก และข้อมูลตารางเสมือนจริงทั้งหมดในระบบแบบเรียลไทม์
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 self-stretch md:self-auto font-mono">
          <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-150 text-indigo-700 text-[10px] font-bold rounded-sm uppercase tracking-wider">
            {dataSource === 'local' ? 'LocalStorage Powered' : 'Firebase Firestore Live'}
          </span>
          <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-sm uppercase tracking-wider">
            Total Tables: {tablesMetadata.length}
          </span>
        </div>
      </div>

      {/* DATA SOURCE SELECTION PANEL */}
      <div className="bg-slate-900 text-white rounded-sm p-4 border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest block">
            เลือกแหล่งที่มาของข้อมูล (Database Source)
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => {
                setDataSource('local');
              }}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                dataSource === 'local' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-slate-850 text-slate-300 hover:bg-slate-850'
              }`}
            >
              <span>💻 หน่วยความจำเครื่อง (Active Runtime Memory)</span>
              <span className="bg-emerald-950 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded-sm border border-emerald-900 uppercase font-mono tracking-wider font-bold">ON</span>
            </button>
            <button
              onClick={() => {
                setDataSource('firebase');
                fetchRemoteDataAndConfig();
              }}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                dataSource === 'firebase' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-slate-850 text-slate-300 hover:bg-slate-800'
              }`}
            >
              🔥 Cloud Firebase Firestore (คลาวด์)
            </button>
            <button
              onClick={() => {
                setDataSource('mysql');
                fetchRemoteDataAndConfig();
              }}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                dataSource === 'mysql' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-slate-850 text-slate-300 hover:bg-slate-800'
              }`}
            >
              🗄️ Hostinger MySQL (ตัวหลัก)
            </button>
          </div>
        </div>

        {/* REFRESH & CONFIG STATUS */}
        <div className="flex flex-wrap items-center gap-3 self-stretch md:self-auto">
          {dataSource !== 'local' && (
            <button
              onClick={fetchRemoteDataAndConfig}
              disabled={isLoading}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded-sm border border-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition font-sans"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              รีเฟรชฐานข้อมูล
            </button>
          )}

          {/* STATUS CHIP */}
          <div className="text-xs font-mono">
            {dataSource === 'local' ? (
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-sm font-bold uppercase tracking-wider text-[10px]">
                ● ACTIVE RUNTIME
              </span>
            ) : (
              dbConfig?.status?.firebase?.connected ? (
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-sm font-bold uppercase tracking-wider text-[10px] flex items-center gap-1 font-mono">
                    ⚡ อัปเดตเรียลไทม์ [LIVE]
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-sm font-bold uppercase tracking-wider text-[10px] flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> เชื่อมต่อ FIREBASE สำเร็จ
                  </span>
                </div>
              ) : (
                <span className="px-2.5 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-sm font-bold uppercase tracking-wider text-[10px]" title={dbConfig?.status?.firebase?.error || 'ไม่มีคอนฟิก'}>
                  ❌ ไม่เชื่อมต่อ FIREBASE
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* FIREBASE / MYSQL METADATA DETAILED ROW */}
      {dataSource !== 'local' && (
        <div className="bg-slate-50 border border-slate-200 rounded-sm p-4 text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <span className="font-bold text-slate-800 uppercase tracking-wide font-mono flex items-center gap-1">
              🔥 Google Cloud Firebase Firestore Settings
            </span>
            <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-slate-500">
              <span>Project ID: <strong className="text-slate-700">{dbConfig?.firebase?.projectId || '(ไม่ได้กำหนด)'}</strong></span>
              <span>Database ID: <strong className="text-slate-700">{dbConfig?.firebase?.firestoreDatabaseId || '(default)'}</strong></span>
            </div>
          </div>
          
          <div className="text-[11px] text-slate-500 max-w-md font-sans">
            {dataSource === 'firebase' 
              ? 'ระบบจะดึงข้อมูลเอกสารแบบสดโดยตรงจากคอลเลกชัน Cloud Firestore ของคุณ เพื่อความรวดเร็วและปลอดภัยสูงสุด'
              : 'ตารางจะเชื่อมต่อไปยังระบบตารางเชิงสัมพันธ์ Hostinger MySQL ของคุณ เพื่อประมวลผลคำสั่ง SQL และเก็บข้อมูลสำรองหลัก'}
          </div>
        </div>
      )}

      {/* LOCAL STORAGE CONFIGURATION STATUS ROW */}
      <div className="bg-slate-50 border border-slate-200 rounded-sm p-4 text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <span className="font-bold text-slate-800 uppercase tracking-wide font-mono flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-slate-500" /> ตั้งค่าความมั่นคงการเก็บแคช (Local Storage) ในเบราว์เซอร์
          </span>
          <div className="text-[11px] text-slate-500 font-sans">
            {isLSOn 
              ? 'เปิดใช้งาน: มีการเก็บประวัติและข้อมูลระบบบางส่วนลง Local Storage เพื่อประสิทธิภาพและความเร็วในการใช้งาน' 
              : 'ปิดใช้งาน: ยกเลิกการเขียนข้อมูลลงเบราว์เซอร์ทั้งหมดเพื่อความปลอดภัยสูงสุด ระบบดึงข้อมูลแบบสดจาก Firestore'}
          </div>
        </div>
        
        <div className="flex items-center gap-2.5 shrink-0 font-sans">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border ${
            isLSOn 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            {isLSOn ? 'สถานะ: เปิดใช้งาน (ON)' : 'สถานะ: ปิดใช้งาน (OFF)'}
          </span>
          <button
            onClick={() => {
              const newValue = !isLSOn;
              setIsLSOn(newValue);
              setLocalStorageEnabled(newValue);
            }}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-sm cursor-pointer transition shadow-xs"
          >
            {isLSOn ? 'สลับเป็น ปิดใช้งาน (Disable)' : 'สลับเป็น เปิดใช้งาน (Enable)'}
          </button>
        </div>
      </div>

      {/* ERROR STATUS ROW */}
      {dataSource !== 'local' && fetchError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-sm p-4 flex gap-3 items-start text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">พบปัญหาในการดึงตารางข้อมูลจากระบบ:</p>
            <p className="font-mono text-[11px] text-rose-700 bg-rose-100/50 p-2 rounded-sm border border-rose-150">
              {fetchError}
            </p>
            <p className="text-[11px] text-slate-500 pt-1">
              กรุณาตรวจสอบว่าคุณได้ซิงค์ข้อมูลลงฐานข้อมูลแล้วในส่วน "สำรอง & ดึงข้อมูล" หรือการตั้งค่า API Keys ครบถ้วนแล้ว
            </p>
          </div>
        </div>
      )}

      {/* TWO-COLUMN BENTO GRID WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* LEFT COLUMN: TABLE SCHEMAS INDEX LIST */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-sm overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-600">ตารางทั้งหมด (Tables Index)</span>
            <button
              onClick={fetchRemoteDataAndConfig}
              disabled={isLoading}
              className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-50 rounded cursor-pointer transition"
              title="รีเฟรชข้อมูลคลาวด์"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
            {tablesMetadata.map(table => {
              const isSelected = selectedTable === table.id;
              return (
                <button
                  key={table.id}
                  onClick={() => {
                    setSelectedTable(table.id);
                    setSearchQuery('');
                  }}
                  className={`w-full text-left px-4 py-3 text-xs font-semibold transition flex items-center justify-between ${
                    isSelected 
                      ? 'bg-slate-900 text-white border-l-4 border-indigo-500' 
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <Database className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span className="truncate font-mono">{table.id}</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isSelected 
                      ? 'bg-indigo-600/30 text-indigo-300' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {table.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE TABLE VIEWER & OPERATIONS */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-sm flex flex-col">
          
          {/* SEARCH, TOGGLE & EXPORT UTILITIES */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={`ค้นหาในตาราง ${currentTable.id}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-indigo-500 font-sans text-xs bg-white"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* VIEWS TOGGLE & OPERATIONS */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="border border-slate-200 rounded-sm overflow-hidden flex bg-white font-mono text-[10px]">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 flex items-center gap-1 font-bold tracking-wide uppercase transition ${
                    viewMode === 'table' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Table className="w-3 h-3" /> Table View
                </button>
                <button
                  onClick={() => setViewMode('json')}
                  className={`px-3 py-1.5 flex items-center gap-1 font-bold tracking-wide uppercase transition ${
                    viewMode === 'json' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileJson className="w-3 h-3" /> Raw JSON
                </button>
              </div>

              {filteredData.length > 0 && (
                <button
                  onClick={exportTableCSV}
                  className="px-3 py-1.5 border border-slate-200 hover:border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  title="ดาวน์โหลดไฟล์ CSV"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" /> Export
                </button>
              )}

              {onClearTable && (
                <button
                  onClick={handleOpenClearConfirm}
                  disabled={currentTable.count === 0}
                  className={`px-3 py-1.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                    currentTable.count === 0 
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      : 'border border-rose-200 text-rose-600 hover:bg-rose-50'
                  }`}
                  title="ล้างข้อมูลทั้งตาราง"
                >
                  Clear Table
                </button>
              )}
            </div>

          </div>

          {/* MAIN SCHEMA VIEWER PANELS */}
          <div className="p-4 border-b border-slate-150 bg-slate-50/20 flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono text-slate-500">
            <span className="flex items-center gap-1.5 text-slate-700 font-bold">
              <Info className="w-3.5 h-3.5 text-indigo-500" /> Active Schema: <strong className="text-slate-900 font-bold">{currentTable.id}</strong>
            </span>
            <span>•</span>
            <span>Rows Count: <strong className="text-slate-800 font-bold">{filteredData.length}</strong> / {currentTable.count} total</span>
            {tableColumns.length > 0 && (
              <>
                <span>•</span>
                <span className="truncate max-w-md">Keys: {tableColumns.join(', ')}</span>
              </>
            )}
          </div>

          {/* VIEW WORKSPACE */}
          <div className="overflow-x-auto min-h-[400px] max-h-[520px] overflow-y-auto">
            {dataSource !== 'local' && !currentTable.remoteSupported ? (
              <div className="py-20 px-6 text-center text-slate-400 space-y-3 bg-slate-50/50 rounded-sm border border-dashed border-slate-200 m-4">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto animate-bounce" />
                <h3 className="text-sm font-bold text-slate-800 font-sans">ตาราง "{currentTable.id}" จัดเก็บเฉพาะภายในหน่วยความจำรันไทม์แอปพลิเคชัน</h3>
                <p className="text-xs text-slate-500 font-sans max-w-md mx-auto leading-relaxed">
                  ตารางข้อมูล <strong>{currentTable.id}</strong> จัดเก็บผ่านหน่วยความจำรันไทม์หลักที่ได้รับจากฐานข้อมูลคลาวด์ Firebase/Firestore เท่านั้น (ระบบปิดการใช้งาน Local Storage ในเบราว์เซอร์อย่างถาวร)
                </p>
                <div className="pt-2">
                  <span className="inline-block px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-400 text-[11px] font-bold rounded-sm select-none font-sans">
                    หน่วยความจำเครื่อง (Active App Memory): ปิดใช้งาน [OFF]
                  </span>
                </div>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="py-24 text-center text-slate-400 space-y-2">
                <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-xs font-sans">ไม่พบรายการข้อมูลในตารางนี้ หรือข้อมูลว่างเปล่า</p>
                <p className="text-[10px] font-mono text-slate-400">Schema Key: {currentTable.id}</p>
              </div>
            ) : viewMode === 'table' ? (
              
              /* TABLE INTERACTIVE DISPLAY */
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-slate-55 bg-slate-100 border-b border-slate-200 text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider select-none">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Document ID / คีย์</th>
                    {tableColumns.slice(0, 6).map(col => (
                      <th key={col} className="py-3 px-4">{col}</th>
                    ))}
                    {tableColumns.length > 6 && (
                      <th className="py-3 px-4 font-mono italic text-slate-400">+{tableColumns.length - 6} more fields</th>
                    )}
                    {onDeleteRow && (
                      <th className="py-3 px-4 text-center w-20">ลบข้อมูล</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map((row: any, index: number) => {
                    const rowId = row.id || row.employeeId || row.idNumber || row.txId || index.toString();
                    return (
                      <tr key={rowId} className="hover:bg-slate-50 transition font-mono text-[11px] group">
                        
                        {/* INDEX */}
                        <td className="py-2.5 px-4 text-center text-slate-400 font-bold select-none">{index + 1}</td>
                        
                        {/* DOC ID COPY TRIGGER */}
                        <td className="py-2.5 px-4 text-indigo-600 font-bold max-w-[150px] truncate">
                          <div className="flex items-center gap-1.5 justify-between">
                            <span className="truncate" title={rowId}>{rowId}</span>
                            <button
                              onClick={() => copyToClipboard(rowId, rowId)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer shrink-0"
                              title="Copy ID"
                            >
                              {copiedId === rowId ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* COLUMN FIELDS VALS */}
                        {tableColumns.slice(0, 6).map(col => {
                          const val = row[col];
                          const displayVal = typeof val === 'boolean' 
                            ? (val ? 'TRUE' : 'FALSE') 
                            : (val === null || val === undefined ? 'NULL' : String(val));
                          
                          return (
                            <td key={col} className="py-2.5 px-4 text-slate-700 truncate max-w-[180px]" title={displayVal}>
                              {typeof val === 'boolean' ? (
                                <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold ${
                                  val ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' : 'bg-slate-50 text-slate-600 border border-slate-150'
                                }`}>
                                  {displayVal}
                                </span>
                              ) : displayVal}
                            </td>
                          );
                        })}

                        {/* MORE FIELDS PLACEHOLDER */}
                        {tableColumns.length > 6 && (
                          <td className="py-2.5 px-4 font-sans text-[10px] text-slate-400 italic">
                            เช็คข้อมูลเพิ่มเติมในรหัส JSON
                          </td>
                        )}

                        {/* ROW DELETE TRIGGER */}
                        {onDeleteRow && (
                          <td className="py-2.5 px-4 text-center">
                            <button
                              onClick={() => handleOpenDeleteConfirm(rowId)}
                              className="p-1 border border-slate-200 hover:border-rose-500 text-slate-400 hover:text-rose-600 rounded-sm hover:bg-rose-50 transition cursor-pointer"
                              title="ลบแถวข้อมูล"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}

                      </tr>
                    );
                  })}
                </tbody>
              </table>

            ) : (

              /* JSON PRETTY CODEVIEWER */
              <div className="p-4 bg-slate-900 text-slate-300 font-mono text-xs overflow-x-auto select-all leading-relaxed whitespace-pre rounded-none border-t border-slate-800">
                <div className="flex justify-between items-center bg-slate-950 p-2 border border-slate-800 mb-3 select-none">
                  <span className="text-slate-500 text-[10px]">RAW DATABASE EXPORT • SCHEMA: {currentTable.id}</span>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(filteredData, null, 2), 'raw_json')}
                    className="flex items-center gap-1.5 px-2 py-1 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-white rounded-sm text-[10px] transition cursor-pointer"
                  >
                    {copiedId === 'raw_json' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy JSON Code
                      </>
                    )}
                  </button>
                </div>
                <code>{JSON.stringify(filteredData, null, 2)}</code>
              </div>

            )}
          </div>

        </div>

      </div>

      {/* WARNING/TUTORIAL SYSTEM BANNER */}
      <div className="p-4 bg-slate-100 border border-slate-200 rounded-sm flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
        <div className="text-xs text-slate-600 space-y-1 leading-relaxed">
          <p className="font-bold text-slate-850">ระบบความปลอดภัยของตารางข้อมูลและบันทึกประวัติ (Audit Ledger Logs)</p>
          <p>
            การเปลี่ยนแปลง แก้ไข หรือลบแถวข้อมูลผ่านระบบ Database Inspector นี้ จะมีการแจ้งเตือนเพื่อยืนยันก่อนเสมอ 
            ข้อมูลที่บันทึกไว้ใน LocalStorage จะช่วยให้ตัวระบบสามารถรักษาโครงสร้างเดิมเมื่อผู้ใช้งานรีเฟรสหน้าจอ 
            หากต้องการทดสอบการจัดหมวดหมู่ข้อมูลใหม่ คุณสามารถดาวน์โหลดข้อมูล (Export) เป็นไฟล์ CSV ไว้สำรองในเครื่องได้ตลอดเวลา
          </p>
        </div>
      </div>

      {/* ROW DELETE CONFIRMATION ALERT DIALOG */}
      {isDeleteConfirmOpen && deletingRowId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-rose-200 rounded-sm shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="p-4 border-b border-rose-100 flex justify-between items-center bg-rose-50">
              <div className="flex items-center gap-2 text-rose-700 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs uppercase tracking-widest font-mono">
                  ยืนยันการลบแถวข้อมูลพนักงานหรือประวัติ
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
                <p className="text-slate-850 text-sm leading-relaxed font-semibold">
                  คุณแน่ใจหรือไม่ว่าต้องการลบ ID: <strong className="text-slate-950 font-bold">"{deletingRowId}"</strong> ออกจากตาราง <strong className="text-slate-950 font-bold">"{deletingTableName}"</strong>?
                </p>
                <p className="text-slate-500 leading-relaxed">
                  เมื่อกดยืนยันแล้ว แถวข้อมูลนี้จะถูกลบออกจากฐานข้อมูลเสมือนในระบบอย่างถาวร หากมีการอ้างอิงข้อมูลนี้จากหน้าระบบอื่น ๆ 
                  อาจส่งผลกระทบต่อความครบถ้วนของข้อมูล
                </p>
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

      {/* CLEAR TABLE CONFIRMATION ALERT DIALOG */}
      {isClearConfirmOpen && clearingTableName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-rose-200 rounded-sm shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="p-4 border-b border-rose-100 flex justify-between items-center bg-rose-50">
              <div className="flex items-center gap-2 text-rose-700 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs uppercase tracking-widest font-mono">
                  แจ้งเตือน: ยืนยันการล้างข้อมูลทั้งตาราง
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                className="p-1 hover:bg-rose-100 rounded text-rose-400 hover:text-rose-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-2">
                <p className="text-rose-700 text-sm leading-relaxed font-bold">
                  คำเตือนสำคัญ: คุณต้องการล้างข้อมูลทั้งหมดในตาราง "{clearingTableName}"?
                </p>
                <p className="text-slate-500 leading-relaxed">
                  การล้างตารางจะลบข้อมูล <strong className="text-slate-900 font-bold">"ทุกแถว"</strong> ออกทั้งหมด ตารางจะว่างเปล่าทันที 
                  เราแนะนำให้คุณ Export ไฟล์สำรอง CSV ไว้ก่อนทำการกดปุ่มยืนยัน
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClearConfirmOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-sm font-bold uppercase tracking-wider transition cursor-pointer font-mono"
                >
                  Cancel / ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClear}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-sm font-bold uppercase tracking-wider transition cursor-pointer font-mono shadow-xs"
                >
                  Confirm Clear / ยืนยันลบทั้งหมด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
