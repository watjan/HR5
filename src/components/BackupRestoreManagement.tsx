import { useState, useRef, useEffect, useMemo } from 'react';
import { safeStorage } from '../lib/safeStorage';
import { 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  FileJson, 
  AlertTriangle, 
  Check, 
  Info, 
  Trash2, 
  Save, 
  RefreshCcw, 
  Copy,
  ChevronRight,
  Server,
  Cloud,
  Settings,
  Flame,
  CheckCircle,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Search,
  Eye
} from 'lucide-react';

interface BackupRestoreManagementProps {
  onResetAllData: () => void;
  onClearToEmpty: () => Promise<boolean>;
  onImportAllData: (jsonData: string) => boolean;
  onExportAllData: (silent?: boolean) => string;
}

interface LocalSnapshot {
  id: string;
  name: string;
  timestamp: string;
  data: string;
}

export default function BackupRestoreManagement({
  onResetAllData,
  onClearToEmpty,
  onImportAllData,
  onExportAllData
}: BackupRestoreManagementProps) {
  // Navigation tab
  const [activeSubTab, setActiveSubTab] = useState<'file' | 'sync' | 'hostinger'>('sync');

  // Local database inspection tab and search
  const [inspectLocalTab, setInspectLocalTab] = useState<'employees' | 'leaves' | 'payroll' | 'sales' | 'cashflow' | 'cheques' | 'partnerBillings' | 'dayoffSwaps' | 'jobs' | 'applicants' | 'evaluations'>('employees');
  const [inspectSearch, setInspectSearch] = useState('');

  // Memoized current local database content summary for the inspector
  const localDataSummary = useMemo(() => {
    try {
      const raw = onExportAllData(true);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        employees: Array.isArray(parsed.hr_employees) ? parsed.hr_employees : [],
        leaves: Array.isArray(parsed.hr_leaves) ? parsed.hr_leaves : [],
        payroll: Array.isArray(parsed.hr_payroll) ? parsed.hr_payroll : [],
        sales: Array.isArray(parsed.hr_sales) ? parsed.hr_sales : [],
        cashflow: Array.isArray(parsed.hr_cashflow) ? parsed.hr_cashflow : [],
        cheques: Array.isArray(parsed.hr_cheques) ? parsed.hr_cheques : [],
        partnerBillings: Array.isArray(parsed.hr_partner_billings) ? parsed.hr_partner_billings : [],
        jobs: Array.isArray(parsed.hr_jobs) ? parsed.hr_jobs : [],
        applicants: Array.isArray(parsed.hr_applicants) ? parsed.hr_applicants : [],
        evaluations: Array.isArray(parsed.hr_evaluations) ? parsed.hr_evaluations : [],
        dayoffSwaps: Array.isArray(parsed.hr_dayoff_swaps) ? parsed.hr_dayoff_swaps : [],
        partnerCompanies: Array.isArray(parsed.hr_partner_companies) ? parsed.hr_partner_companies : [],
        attendance: parsed.hr_attendance || {},
        auditLogs: Array.isArray(parsed.hr_audit_logs) ? parsed.hr_audit_logs : [],
      };
    } catch (e) {
      console.error("Failed to parse local data summary:", e);
      return null;
    }
  }, [onExportAllData]);

  // Dynamic counts for synchronization readiness list
  const syncReadinessData = useMemo(() => {
    try {
      const raw = onExportAllData(true);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      
      const countItems = (arr: any) => Array.isArray(arr) ? arr.length : 0;
      
      let attendanceRecordsCount = 0;
      if (parsed.hr_attendance && typeof parsed.hr_attendance === 'object') {
        Object.keys(parsed.hr_attendance).forEach(empId => {
          if (parsed.hr_attendance[empId] && typeof parsed.hr_attendance[empId] === 'object') {
            attendanceRecordsCount += Object.keys(parsed.hr_attendance[empId]).length;
          }
        });
      }

      return [
        { label: '👥 ข้อมูลพนักงาน', count: countItems(parsed.hr_employees), key: 'employees' },
        { label: '📅 บันทึกใบลา', count: countItems(parsed.hr_leaves), key: 'leaves' },
        { label: '💰 ข้อมูลจ่ายสลิปเงินเดือน', count: countItems(parsed.hr_payroll), key: 'payroll' },
        { label: '📈 ยอดขายรวม', count: countItems(parsed.hr_sales), key: 'sales' },
        { label: '💵 บัญชีรับจ่ายเงินสด', count: countItems(parsed.hr_cashflow), key: 'cashflow' },
        { label: '🎫 ประวัติเช็คธนาคาร', count: countItems(parsed.hr_cheques), key: 'cheques' },
        { label: '🧾 ใบวางบิลพาร์ทเนอร์', count: countItems(parsed.hr_partner_billings), key: 'partnerBillings' },
        { label: '📝 ประวัติ Audit Logs', count: countItems(parsed.hr_audit_logs), key: 'auditLogs' },
        { label: '💼 ตำแหน่งงานสรรหา', count: countItems(parsed.hr_jobs), key: 'jobs' },
        { label: '👤 ประวัติผู้สมัครงาน', count: countItems(parsed.hr_applicants), key: 'applicants' },
        { label: '📊 ผลประเมินผลงาน', count: countItems(parsed.hr_evaluations), key: 'evaluations' },
        { label: '🏢 บริษัทคู่ค้าพาร์ทเนอร์', count: countItems(parsed.hr_partner_companies), key: 'partnerCompanies' },
        { label: '⏱️ เวลาลงเวลาทำงาน', count: attendanceRecordsCount, key: 'attendance' },
        { label: '🔄 รายการแลกวันหยุด', count: countItems(parsed.hr_dayoff_swaps), key: 'dayoffSwaps' },
      ];
    } catch (e) {
      console.error("Failed to parse sync readiness details:", e);
      return [];
    }
  }, [onExportAllData]);

  // Filtered local database records based on selected inspector tab and search query
  const filteredData = useMemo(() => {
    if (!localDataSummary) return [];
    const query = inspectSearch.toLowerCase().trim();

    switch (inspectLocalTab) {
      case 'employees':
        return localDataSummary.employees.filter((emp: any) => 
          !query || 
          emp.name?.toLowerCase().includes(query) || 
          emp.id?.toLowerCase().includes(query) || 
          emp.role?.toLowerCase().includes(query) || 
          emp.department?.toLowerCase().includes(query)
        );
      case 'leaves':
        return localDataSummary.leaves.filter((leave: any) => 
          !query || 
          leave.employeeName?.toLowerCase().includes(query) || 
          leave.reason?.toLowerCase().includes(query) || 
          leave.type?.toLowerCase().includes(query) || 
          leave.status?.toLowerCase().includes(query)
        );
      case 'payroll':
        return localDataSummary.payroll.filter((pay: any) => 
          !query || 
          pay.employeeName?.toLowerCase().includes(query) || 
          pay.month?.toLowerCase().includes(query) || 
          pay.status?.toLowerCase().includes(query)
        );
      case 'sales':
        return localDataSummary.sales.filter((sale: any) => 
          !query || 
          sale.date?.toLowerCase().includes(query) || 
          String(sale.amount).includes(query)
        );
      case 'cashflow':
        return localDataSummary.cashflow.filter((cf: any) => 
          !query || 
          cf.description?.toLowerCase().includes(query) || 
          cf.category?.toLowerCase().includes(query) || 
          cf.type?.toLowerCase().includes(query)
        );
      case 'cheques':
        return localDataSummary.cheques.filter((cheque: any) => 
          !query || 
          cheque.chequeNumber?.toLowerCase().includes(query) || 
          cheque.partnerName?.toLowerCase().includes(query) || 
          cheque.bank?.toLowerCase().includes(query) || 
          cheque.status?.toLowerCase().includes(query)
        );
      case 'partnerBillings':
        return localDataSummary.partnerBillings.filter((bill: any) => 
          !query || 
          bill.partnerName?.toLowerCase().includes(query) || 
          bill.docNumber?.toLowerCase().includes(query) || 
          bill.notes?.toLowerCase().includes(query) || 
          bill.status?.toLowerCase().includes(query)
        );
      case 'dayoffSwaps':
        return localDataSummary.dayoffSwaps.filter((swap: any) => 
          !query || 
          swap.employeeName?.toLowerCase().includes(query) || 
          swap.reason?.toLowerCase().includes(query) || 
          swap.status?.toLowerCase().includes(query)
        );
      case 'jobs':
        return localDataSummary.jobs.filter((job: any) => 
          !query || 
          job.title?.toLowerCase().includes(query) || 
          job.department?.toLowerCase().includes(query) || 
          job.status?.toLowerCase().includes(query)
        );
      case 'applicants':
        return localDataSummary.applicants.filter((app: any) => 
          !query || 
          app.name?.toLowerCase().includes(query) || 
          app.jobTitle?.toLowerCase().includes(query) || 
          app.stage?.toLowerCase().includes(query)
        );
      case 'evaluations':
        return localDataSummary.evaluations.filter((evalItem: any) => 
          !query || 
          evalItem.employeeName?.toLowerCase().includes(query) || 
          evalItem.period?.toLowerCase().includes(query) || 
          evalItem.evaluatorName?.toLowerCase().includes(query)
        );
      default:
        return [];
    }
  }, [localDataSummary, inspectLocalTab, inspectSearch]);

  // File import states
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  
  // File upload drag-and-drop states
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inspector state for uploaded/pasted backup
  const [parsedSummary, setParsedSummary] = useState<{
    employeesCount: number;
    leavesCount: number;
    payrollCount: number;
    salesCount: number;
    cashflowCount: number;
    chequesCount: number;
    partnerBillingsCount: number;
    jobsCount: number;
    applicantsCount: number;
    evaluationsCount: number;
    attendanceCount: number;
  } | null>(null);

  // Quick snapshot state
  const [snapshots, setSnapshots] = useState<LocalSnapshot[]>([]);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [snapshotSuccessMsg, setSnapshotSuccessMsg] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // DB Sync states
  const [mysqlConfig, setMysqlConfig] = useState({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'hr_management_system',
    autoCreateDb: true
  });
  const [firebaseConfig, setFirebaseConfig] = useState<any>(null);
  const [dbStatuses, setDbStatuses] = useState({
    mysql: { connected: false, error: '' },
    firebase: { connected: false, error: '' }
  });

  const [loadingConfig, setLoadingConfig] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [loadingDbData, setLoadingDbData] = useState(false);
  const [remoteDbData, setRemoteDbData] = useState<any>(null);

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  // Load snapshots from localStorage on mount
  useEffect(() => {
    const saved = safeStorage.getItem('hr_backup_snapshots');
    if (saved) {
      try {
        setSnapshots(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse snapshots', e);
      }
    }
    fetchDbConfigs();
  }, []);

  // Fetch configs and statuses from server
  const fetchDbConfigs = async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch('/api/db/config');
      if (res.ok) {
        const data = await res.json();
        if (data.mysql) {
          setMysqlConfig(prev => ({
            ...prev,
            ...data.mysql
          }));
        }
        if (data.firebase) {
          setFirebaseConfig(data.firebase);
        }
        if (data.status) {
          setDbStatuses(data.status);
        }
      }
    } catch (error) {
      console.error('Failed to fetch DB configs:', error);
    } finally {
      setLoadingConfig(false);
    }
  };

  // Save/Test MySQL Connection Settings
  const handleSaveMysqlConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestingConnection(true);
    setNotification(null);
    try {
      const res = await fetch('/api/db/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mysqlConfig)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.warning) {
          setNotification({ type: 'warning', message: data.warning });
        } else {
          setNotification({ type: 'success', message: data.message || 'บันทึกการเชื่อมต่อ MySQL สำเร็จ!' });
        }
        fetchDbConfigs(); // Refresh statuses
      } else {
        setNotification({ type: 'error', message: data.error || 'ล้มเหลวในการเชื่อมต่อ MySQL' });
      }
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'เกิดข้อผิดพลาดในการตั้งค่าเชื่อมต่อ' });
    } finally {
      setTestingConnection(false);
    }
  };

  // Pre-sync Conflict Detection states
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [conflictDetail, setConflictDetail] = useState<{
    hasConflict: boolean;
    reasons: string[];
    cloudTime: string | null;
    localTime: string | null;
    diffs: { module: string; local: number; cloud: number }[];
    rawFirebaseData: any;
  } | null>(null);
  const [showConflictWarning, setShowConflictWarning] = useState(false);

  // Sync current client states to both databases simultaneously with conflict checking
  const handleSyncToDualDbs = async (force: boolean = false) => {
    setNotification(null);
    setSyncResult(null);

    // 1. Perform pre-sync conflict detection first unless forced
    if (typeof force !== 'boolean' || force !== true) {
      setCheckingConflict(true);
      try {
        const res = await fetch('/api/db/load');
        const data = await res.json();
        
        if (res.ok && data.success && data.data && data.data.firebase) {
          const fbData = data.data.firebase;
          const localDataRaw = onExportAllData();
          const localData = JSON.parse(localDataRaw);

          // Get latest local audit log timestamp
          const localLogs = localData.hr_audit_logs || [];
          let localMaxTime = 0;
          localLogs.forEach((log: any) => {
            if (log.timestamp) {
              const time = new Date(log.timestamp).getTime();
              if (time > localMaxTime) {
                localMaxTime = time;
              }
            }
          });

          // Get latest cloud audit log timestamp
          const cloudLogs = fbData.auditLogs || [];
          let cloudMaxTime = 0;
          cloudLogs.forEach((log: any) => {
            if (log.timestamp) {
              const time = new Date(log.timestamp).getTime();
              if (time > cloudMaxTime) {
                cloudMaxTime = time;
              }
            }
          });

          // Compare collections count differences
          const diffList: { module: string; local: number; cloud: number }[] = [];
          const checkDiff = (moduleName: string, localArray: any[], cloudArray: any[]) => {
            const localLen = (localArray || []).length;
            const cloudLen = (cloudArray || []).length;
            if (localLen !== cloudLen) {
              diffList.push({ module: moduleName, local: localLen, cloud: cloudLen });
            }
          };

          checkDiff("พนักงาน (Employees)", localData.hr_employees, fbData.employees);
          checkDiff("ใบลา (Leaves)", localData.hr_leaves, fbData.leaves);
          checkDiff("เงินเดือน (Payroll)", localData.hr_payroll, fbData.payroll);
          checkDiff("ยอดขาย (Sales)", localData.hr_sales, fbData.sales);
          checkDiff("กระแสเงินสด (Cashflow)", localData.hr_cashflow, fbData.cashflow);
          checkDiff("เช็คคู่ค้า (Cheques)", localData.hr_cheques, fbData.cheques);
          checkDiff("ใบวางบิล (Billings)", localData.hr_partner_billings, fbData.partnerBillings);

          const lastSyncTimestamp = Number(safeStorage.getItem('hr_last_synced_timestamp') || '0');
          const reasons: string[] = [];

          // Determine conflict criteria
          // Check if cloud timestamp is greater than local timestamp and last sync timestamp (with 5 sec margin)
          const isCloudNewer = cloudMaxTime > (lastSyncTimestamp + 5000) && cloudMaxTime > (localMaxTime + 5000);
          const hasSignificantDiff = diffList.length > 0;

          if (cloudMaxTime > 0) {
            if (isCloudNewer) {
              reasons.push(`ข้อมูลบนคลาวด์มีความเคลื่อนไหวหลังจากการซิงค์ครั้งล่าสุดของคุณ (อัปเดตล่าสุดบนคลาวด์: ${new Date(cloudMaxTime).toLocaleString('th-TH')})`);
            }
            if (lastSyncTimestamp === 0 && hasSignificantDiff) {
              reasons.push("เครื่องคอมพิวเตอร์ของคุณยังไม่มีประวัติการซิงก์สำเร็จกับระบบคลาวด์นี้ และตรวจพบความแตกต่างระหว่างข้อมูลในเครื่องกับบนคลาวด์");
            }
          }

          if (reasons.length > 0 || (isCloudNewer && hasSignificantDiff)) {
            setConflictDetail({
              hasConflict: true,
              reasons,
              cloudTime: cloudMaxTime > 0 ? new Date(cloudMaxTime).toLocaleString('th-TH') : "ไม่ระบุเวลา",
              localTime: localMaxTime > 0 ? new Date(localMaxTime).toLocaleString('th-TH') : "ไม่ระบุเวลา",
              diffs: diffList,
              rawFirebaseData: fbData
            });
            setShowConflictWarning(true);
            setCheckingConflict(false);
            return; // Halt and show warning dialog
          }
        }
      } catch (err) {
        console.warn("Failed to perform pre-sync conflict detection:", err);
      } finally {
        setCheckingConflict(false);
      }
    }

    // 2. Perform sync if force is true or no conflicts are found
    setShowConflictWarning(false);
    setSyncing(true);
    setSyncResult(null);
    setNotification(null);
    try {
      // Get complete app data payload
      const localDataRaw = onExportAllData();
      const localData = JSON.parse(localDataRaw);

      // Map local JSON structure to DB sync payload format
      const payload = {
        employees: localData.hr_employees || [],
        payroll: localData.hr_payroll || [],
        leaves: localData.hr_leaves || [],
        sales: localData.hr_sales || [],
        cheques: localData.hr_cheques || [],
        cashflow: localData.hr_cashflow || [],
        partnerBillings: localData.hr_partner_billings || [],
        auditLogs: localData.hr_audit_logs || [],
        jobs: localData.hr_jobs || [],
        applicants: localData.hr_applicants || [],
        evaluations: localData.hr_evaluations || [],
        attendance: Object.entries(localData.hr_attendance || {}).map(([empId, records]) => ({
          id: empId,
          records
        })),
        dayoffSwaps: localData.hr_dayoff_swaps || [],
        partnerCompanies: localData.hr_partner_companies || [],
        systemSettings: [{ id: "current", ...localData.hr_system_settings }]
      };

      const res = await fetch('/api/db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSyncResult(data.results);
        
        const fbSuccess = data.results.firebase.success;

        if (fbSuccess) {
          const now = new Date();
          const nowStr = now.toLocaleTimeString('th-TH');
          safeStorage.setItem('hr_last_synced', nowStr);
          safeStorage.setItem('hr_last_synced_timestamp', String(now.getTime()));
          
          setNotification({ 
            type: 'success', 
            message: 'ซิงโครไนซ์ข้อมูลเสร็จสิ้น! บันทึกลงระบบฐานข้อมูลไฟล์เซิร์ฟเวอร์ (local_db.json) เรียบร้อยครบถ้วน' 
          });
        } else {
          setNotification({ 
            type: 'error', 
            message: `ล้มเหลวในการบันทึกลงฐานข้อมูลเซิร์ฟเวอร์: ${data.results.firebase.error}` 
          });
        }
        fetchDbConfigs(); // Refresh statuses
      } else {
        setNotification({ type: 'error', message: data.error || 'เกิดข้อผิดพลาดในการส่งข้อมูลไปเซิร์ฟเวอร์' });
      }
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'เกิดความล้มเหลวในการซิงโครไนซ์ฐานข้อมูล' });
    } finally {
      setSyncing(false);
    }
  };

  // Helper to force pull/restore cloud data directly from conflict warning
  const handleForcePullFromConflict = () => {
    if (!conflictDetail || !conflictDetail.rawFirebaseData) {
      alert("ไม่พบข้อมูลบนคลาวด์ที่จะดึงข้อมูล");
      return;
    }
    const fbData = conflictDetail.rawFirebaseData;
    
    // Build correct local structure
    const formattedPayload = {
      hr_employees: fbData.employees || [],
      hr_leaves: fbData.leaves || [],
      hr_payroll: fbData.payroll || [],
      hr_sales: fbData.sales || [],
      hr_cashflow: fbData.cashflow || [],
      hr_cheques: fbData.cheques || [],
      hr_partner_billings: fbData.partnerBillings || [],
      hr_audit_logs: fbData.auditLogs || [],
      hr_jobs: fbData.jobs || [],
      hr_applicants: fbData.applicants || [],
      hr_evaluations: fbData.evaluations || [],
      hr_attendance: fbData.attendance ? (() => {
        const attendanceMap: any = {};
        fbData.attendance.forEach((item: any) => {
          attendanceMap[item.id] = item.records;
        });
        return attendanceMap;
      })() : {},
      hr_dayoff_swaps: fbData.dayoffSwaps || [],
      hr_partner_companies: fbData.partnerCompanies || [],
      hr_system_settings: fbData.systemSettings && fbData.systemSettings.length > 0 
        ? fbData.systemSettings.find((s: any) => s.id === "current") || fbData.systemSettings[0]
        : {
            companyName: "บริษัท ซิงโครไนซ์ จำกัด",
            taxId: "0105566000012",
            address: "123 อาคารสิริ พญาไท กรุงเทพฯ 10400",
            payrollDate: 25,
            socialSecurityRate: 5,
            taxRate: 3,
            currency: "THB"
          }
    };

    const success = onImportAllData(JSON.stringify(formattedPayload));
    if (success) {
      const now = new Date();
      safeStorage.setItem('hr_last_synced', now.toLocaleTimeString('th-TH'));
      safeStorage.setItem('hr_last_synced_timestamp', String(now.getTime()));
      
      setShowConflictWarning(false);
      setNotification({ type: 'success', message: 'ดึงข้อมูลล่าสุดจากคลาวด์มาแทนที่ข้อมูลเดิมเสร็จสิ้น!' });
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } else {
      alert("การติดตั้งฐานข้อมูลลงเครื่องล้มเหลว");
    }
  };

  // Fetch and inspect remote database payloads to import
  const handleLoadRemoteData = async () => {
    setLoadingDbData(true);
    setRemoteDbData(null);
    setNotification(null);
    try {
      const res = await fetch('/api/db/load');
      const data = await res.json();
      if (res.ok && data.success) {
        setRemoteDbData(data.data);
      } else {
        setNotification({ type: 'error', message: data.error || 'ล้มเหลวในการดึงข้อมูลจากฐานข้อมูลคลาวด์/ MySQL' });
      }
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'ล้มเหลวในการเชื่อมต่อเรียกข้อมูลระยะไกล' });
    } finally {
      setLoadingDbData(false);
    }
  };

  // Restore/Import selected DB source into browser
  const handleRestoreFromRemote = (source: 'mysql' | 'firebase') => {
    if (!remoteDbData || !remoteDbData[source]) {
      alert('ไม่พบข้อมูลที่จะนำเข้าจากฐานข้อมูลนี้');
      return;
    }

    const sourceData = remoteDbData[source];
    
    if (window.confirm(`คุณแน่ใจหรือไม่ที่จะกู้คืนระบบจากข้อมูลล่าสุดใน "${source === 'mysql' ? 'Hostinger MySQL' : 'Firebase Firestore'}"? ข้อมูลในบราวเซอร์ของคุณจะถูกเขียนทับทันที`)) {
      
      // Build correct local structure
      const formattedPayload = {
        hr_employees: sourceData.employees || [],
        hr_leaves: sourceData.leaves || [],
        hr_payroll: sourceData.payroll || [],
        hr_sales: sourceData.sales || [],
        hr_cashflow: sourceData.cashflow || [],
        hr_cheques: sourceData.cheques || [],
        hr_partner_billings: sourceData.partnerBillings || [],
        hr_audit_logs: sourceData.auditLogs || [],
        hr_jobs: [], // Fallbacks to empty if missing in simple backend DB representation
        hr_applicants: [],
        hr_evaluations: [],
        hr_attendance: {},
        hr_dayoff_swaps: [],
        hr_system_settings: {
          companyName: "บริษัท ซิงโครไนซ์ จำกัด",
          taxId: "0105566000012",
          address: "123 อาคารสิริ พญาไท กรุงเทพฯ 10400",
          payrollDate: 25,
          socialSecurityRate: 5,
          taxRate: 3,
          currency: "THB"
        }
      };

      const success = onImportAllData(JSON.stringify(formattedPayload));
      if (success) {
        setNotification({ type: 'success', message: `ดึงฐานข้อมูลและนำเข้าจาก ${source === 'mysql' ? 'Hostinger MySQL' : 'Firebase Firestore'} สำเร็จ!` });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setNotification({ type: 'error', message: 'การติดตั้งโครงสร้างข้อมูลจากรีโมทล้มเหลว' });
      }
    }
  };

  // Save snapshots to localStorage
  const saveSnapshots = (updated: LocalSnapshot[]) => {
    setSnapshots(updated);
    safeStorage.setItem('hr_backup_snapshots', JSON.stringify(updated));
  };

  // Helper to inspect JSON file content
  const inspectAndSetJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (typeof parsed !== 'object' || parsed === null) {
        setImportError('รูปแบบไฟล์กู้คืนไม่ถูกต้อง: ต้องเป็นวัตถุ JSON หลัก');
        setParsedSummary(null);
        return false;
      }

      // Count items
      const employeesCount = Array.isArray(parsed.hr_employees) ? parsed.hr_employees.length : 0;
      const leavesCount = Array.isArray(parsed.hr_leaves) ? parsed.hr_leaves.length : 0;
      const payrollCount = Array.isArray(parsed.hr_payroll) ? parsed.hr_payroll.length : 0;
      const salesCount = Array.isArray(parsed.hr_sales) ? parsed.hr_sales.length : 0;
      const cashflowCount = Array.isArray(parsed.hr_cashflow) ? parsed.hr_cashflow.length : 0;
      const chequesCount = Array.isArray(parsed.hr_cheques) ? parsed.hr_cheques.length : 0;
      const partnerBillingsCount = Array.isArray(parsed.hr_partner_billings) ? parsed.hr_partner_billings.length : 0;
      const jobsCount = Array.isArray(parsed.hr_jobs) ? parsed.hr_jobs.length : 0;
      const applicantsCount = Array.isArray(parsed.hr_applicants) ? parsed.hr_applicants.length : 0;
      const evaluationsCount = Array.isArray(parsed.hr_evaluations) ? parsed.hr_evaluations.length : 0;
      
      // Attendance structure inspection
      let attendanceCount = 0;
      if (parsed.hr_attendance && typeof parsed.hr_attendance === 'object') {
        Object.keys(parsed.hr_attendance).forEach(empId => {
          if (parsed.hr_attendance[empId] && typeof parsed.hr_attendance[empId] === 'object') {
            attendanceCount += Object.keys(parsed.hr_attendance[empId]).length;
          }
        });
      }

      // Check if it has any valid HR data keys
      const hasValidKeys = [
        'hr_employees', 'hr_leaves', 'hr_payroll', 'hr_jobs', 
        'hr_applicants', 'hr_evaluations', 'hr_cashflow', 
        'hr_cheques', 'hr_attendance', 'hr_dayoff_swaps', 
        'hr_partner_billings', 'hr_system_settings', 'hr_sales'
      ].some(key => key in parsed);

      if (!hasValidKeys) {
        setImportError('ไม่พบข้อมูลของระบบ HR Core ในไฟล์นี้ กรุณาตรวจสอบว่าเลือกไฟล์ที่ถูกต้องหรือไม่');
        setParsedSummary(null);
        return false;
      }

      setImportError(null);
      setParsedSummary({
        employeesCount,
        leavesCount,
        payrollCount,
        salesCount,
        cashflowCount,
        chequesCount,
        partnerBillingsCount,
        jobsCount,
        applicantsCount,
        evaluationsCount,
        attendanceCount
      });
      return true;

    } catch (e: any) {
      setImportError(`ไม่สามารถเปิดอ่านไฟล์ได้: ${e.message || 'รูปแบบ JSON ผิดพลาด'}`);
      setParsedSummary(null);
      return false;
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setImportText(val);
    if (val.trim()) {
      inspectAndSetJson(val);
    } else {
      setImportError(null);
      setParsedSummary(null);
    }
  };

  // Export database handler
  const handleExport = () => {
    try {
      const dataStr = onExportAllData();
      const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const now = new Date();
      const dateStr = now.getFullYear() + '-' + 
        String(now.getMonth() + 1).padStart(2, '0') + '-' + 
        String(now.getDate()).padStart(2, '0') + '_' + 
        String(now.getHours()).padStart(2, '0') + 
        String(now.getMinutes()).padStart(2, '0');
        
      const fileName = `HR_CORE_BACKUP_${dateStr}.json`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  // Copy JSON to clipboard
  const handleCopyToClipboard = () => {
    try {
      const dataStr = onExportAllData();
      navigator.clipboard.writeText(dataStr);
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  // File loading helper
  const handleFile = (file: File) => {
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setImportError('ขออภัย ระบบรองรับเฉพาะไฟล์ข้อมูลสกุล .json เท่านั้น');
      setParsedSummary(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setImportText(text);
      inspectAndSetJson(text);
    };
    reader.onerror = () => {
      setImportError('ไม่สามารถอ่านไฟล์ได้สำเร็จ');
      setParsedSummary(null);
    };
    reader.readAsText(file);
  };

  // File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Import application action
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim() || importError) {
      return;
    }

    const success = onImportAllData(importText);
    if (success) {
      setImportSuccess(true);
      setImportText('');
      setParsedSummary(null);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      setImportError('ไม่สามารถติดตั้งข้อมูลกู้คืนได้ โครงสร้างฐานข้อมูลผิดพลาด');
    }
  };

  // Reset handler
  const [clearEmptyConfirm, setClearEmptyConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleReset = () => {
    onResetAllData();
    setResetConfirm(false);
    window.location.reload();
  };

  const handleClearEmpty = async () => {
    setClearing(true);
    const success = await onClearToEmpty();
    setClearing(false);
    setClearEmptyConfirm(false);
    if (success) {
      window.location.reload();
    }
  };

  // Snapshot actions
  const handleCreateSnapshot = () => {
    const name = newSnapshotName.trim() || `สำรองข้อมูลด่วน #${snapshots.length + 1}`;
    const dataStr = onExportAllData();
    
    const newSnap: LocalSnapshot = {
      id: `SNAP-${Date.now()}`,
      name,
      timestamp: new Date().toISOString(),
      data: dataStr
    };

    const updated = [newSnap, ...snapshots].slice(0, 5); // Keep max 5 snapshots
    saveSnapshots(updated);
    setNewSnapshotName('');
    setSnapshotSuccessMsg('สร้างจุดบันทึกด่วน (Snapshot) ในบราวเซอร์เรียบร้อยแล้ว!');
    setTimeout(() => setSnapshotSuccessMsg(null), 3000);
  };

  const handleRestoreSnapshot = (snap: LocalSnapshot) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ที่จะกู้คืนข้อมูลจากจุดบันทึก "${snap.name}"? การทำรายการนี้จะเขียนทับข้อมูลทั้งหมดในปัจจุบันทันที`)) {
      const success = onImportAllData(snap.data);
      if (success) {
        setSnapshotSuccessMsg(`กู้คืนข้อมูลจาก "${snap.name}" สำเร็จ!`);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        alert('กู้คืนจุดบันทึกไม่สำเร็จ โครงสร้างข้อมูลไม่สมบูรณ์');
      }
    }
  };

  const handleDeleteSnapshot = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = snapshots.filter(item => item.id !== id);
    saveSnapshots(updated);
  };

  return (
    <div id="backup-restore-container" className="space-y-6 animate-fade-in pb-16">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 border border-slate-200 rounded-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-650 rounded-sm">
              <Cloud className="w-5 h-5 text-indigo-600" />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight font-sans">จัดการระบบฐานข้อมูลและการเชื่อมต่อคลาวด์</h1>
          </div>
          <p className="text-xs text-slate-500 font-sans">
            เชื่อมต่อ ซิงโครไนซ์ และบันทึกข้อมูลระบบลงในฐานข้อมูลคลาวด์: **Firebase Firestore** ของคุณอย่างมั่นคงและปลอดภัย
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex p-0.5 bg-slate-100 rounded-sm border border-slate-200 w-full md:w-auto shrink-0 font-sans gap-0.5">
          <button
            onClick={() => setActiveSubTab('sync')}
            className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition ${
              activeSubTab === 'sync'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-indigo-600" /> ตั้งค่าซิงค์คลาวด์ (Firebase)
          </button>
          <button
            onClick={() => setActiveSubTab('file')}
            className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition ${
              activeSubTab === 'file'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileJson className="w-3.5 h-3.5 text-amber-500" /> กู้คืนด้วยไฟล์ (JSON)
          </button>
          <button
            onClick={() => setActiveSubTab('hostinger')}
            className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-xs flex items-center justify-center gap-1.5 cursor-pointer transition ${
              activeSubTab === 'hostinger'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-emerald-600" /> ติดตั้งบน Hostinger (ดาวน์โหลด)
          </button>
        </div>
      </div>

      {/* Dynamic Notifications */}
      {notification && (
        <div className={`p-4 rounded-sm border font-sans flex items-start gap-2.5 animate-fade-in shadow-xs ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : notification.type === 'warning' 
              ? 'bg-amber-50 border-amber-200 text-amber-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-650 shrink-0 mt-0.5" />
          ) : notification.type === 'warning' ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <h4 className="font-bold text-xs">
              {notification.type === 'success' ? 'ทำรายการสำเร็จ' : notification.type === 'warning' ? 'เสร็จสิ้นพร้อมข้อแนะนำ' : 'เกิดข้อผิดพลาดจากฐานข้อมูล'}
            </h4>
            <p className="text-xs leading-relaxed opacity-95">{notification.message}</p>
          </div>
        </div>
      )}

      {activeSubTab === 'sync' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Live Status Indicator & Config panel (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Live DB Status Board */}
            <div className="bg-white border border-slate-200 rounded-sm p-5 shadow-2xs space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-indigo-600 animate-pulse" /> สถานะฐานข้อมูลคลาวด์ (Cloud Firestore Status)
                </h3>
                <button
                  onClick={fetchDbConfigs}
                  disabled={loadingConfig}
                  className="p-1 hover:bg-slate-50 border border-slate-200 rounded text-slate-500 hover:text-slate-800 font-sans text-[10px] flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                >
                  <RefreshCcw className={`w-3 h-3 ${loadingConfig ? 'animate-spin' : ''}`} />
                  โหลดสถานะใหม่
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Firebase Connection Status */}
                <div className={`p-4 border rounded-sm flex items-start gap-3 relative overflow-hidden ${
                  dbStatuses.firebase.connected ? 'bg-emerald-50/25 border-emerald-200' : 'bg-rose-50/20 border-rose-200'
                }`}>
                  <div className={`p-2 rounded-full shrink-0 ${
                    dbStatuses.firebase.connected ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 font-sans">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs text-slate-800">ฐานข้อมูลหลัก Google Cloud Firestore</h4>
                      <span className={`w-2 h-2 rounded-full ${
                        dbStatuses.firebase.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                      }`} />
                    </div>
                    <p className="text-[10px] text-slate-500">
                      ชนิดฐานข้อมูล: คลาวด์เรียลไทม์ (NoSQL Firestore)
                    </p>
                    <p className={`text-[10px] font-bold ${
                      dbStatuses.firebase.connected ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {dbStatuses.firebase.connected ? '● เชื่อมต่อและซิงโครไนซ์คลาวด์สำเร็จ' : `❌ ไม่ออนไลน์: ${dbStatuses.firebase.error || 'ไม่มีค่าคอนฟิกหรือบล็อกความปลอดภัย'}`}
                    </p>
                  </div>
                  <div className="absolute top-1 right-1 opacity-10">
                    <Flame className="w-14 h-14 text-orange-500" />
                  </div>
                </div>

                {/* Exclusive Firebase Firestore Configuration Notice */}
                <div className="p-4 border border-indigo-100 bg-indigo-50/20 rounded-sm flex items-start gap-3 relative overflow-hidden">
                  <div className="p-2 rounded-full shrink-0 bg-indigo-100 text-indigo-750">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 font-sans text-indigo-950">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs text-indigo-900">เชื่อมต่อ Firebase Firestore แบบเดี่ยว (Exclusive Connect)</h4>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      ระบบเชื่อมต่อแบบปลอดภัยตรงไปยัง Google Cloud Firebase Firestore อย่างเป็นทางการเพียงอย่างเดียว โดยข้ามการจัดเก็บประเภทอื่นทั้งหมดเพื่อความน่าเชื่อถือและความเสถียรสูงสุด
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cloud Storage Information */}
            <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-2xs space-y-5">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> ระบบจัดเก็บข้อมูลคลาวด์แบบปลอดภัย (Cloud-First Storage)
                </h3>
                <p className="text-[11.5px] text-slate-600 font-sans leading-relaxed">
                  แอปพลิเคชัน HR Management System นี้ได้รับการออกแบบมาเพื่อทำงานกับฐานข้อมูลคลาวด์ Google Cloud Firebase Firestore โดยตรง มอบความเสถียรและความแม่นยำสูงที่สุดในทุกๆ การกดบันทึก
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3 font-sans text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-slate-800 block text-[11px]">บันทึกสดทันใจแบบ Real-time</strong>
                    <span className="text-slate-500 text-[10.5px]">ทุกการสร้างและอัปเดตพนักงาน ใบลา จ่ายเงินเดือน สลิป ตารางเวร และงานจะเชื่อมโยงไปคลาวด์อัตโนมัติ</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-slate-800 block text-[11px]">ความเสถียร 100% ปลอดภัยสูง</strong>
                    <span className="text-slate-500 text-[10.5px]">หมดกังวลเรื่องการตั้งค่า Port ปัญหาการปิด Remote MySQL หรือ Connection Timeouts บน Hostinger</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Operations Sync & Recovery (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Sync Write Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-sm p-6 text-white shadow-md space-y-5">
              <div className="space-y-1">
                <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest bg-emerald-500 text-white rounded-xs">
                  Firebase Cloud Sync Engine
                </span>
                <h3 className="text-sm font-black tracking-tight font-sans flex items-center gap-1.5 mt-1">
                  <ShieldCheck className="w-5 h-5 text-emerald-450" /> เขียนบันทึกคลาวด์ (Push & Sync to Cloud)
                </h3>
                <p className="text-[11px] text-slate-400 font-sans">
                  อัปโหลดและเขียนทับข้อมูลจากบราวเซอร์เครื่องนี้ขึ้นฐานข้อมูล Firebase Firestore แบบสดทันที เพื่อเก็บรักษาหรือย้ายไปใช้งานที่เครื่องอื่น
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/80 rounded-sm p-4 text-[10.5px] text-slate-300 space-y-2.5 font-mono">
                <p className="text-emerald-400 font-sans font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-emerald-400" /> ตารางข้อมูลเตรียมเขียนทับซิงค์:
                  </span>
                  <span className="text-[9px] bg-slate-700 text-slate-200 px-1.5 py-0.5 rounded-sm shrink-0">
                    {syncReadinessData.reduce((acc, curr) => acc + curr.count, 0)} รายการรวม
                  </span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2.5 gap-y-1.5 border-t border-slate-700/50 pt-2 pb-1">
                  {syncReadinessData.map((item) => (
                    <div key={item.key} className="flex justify-between items-center bg-slate-850/30 px-2 py-1 rounded-sm border border-slate-800/50 font-sans">
                      <span className="text-slate-200 text-[10.5px] truncate">{item.label}</span>
                      <span className="text-[10px] text-emerald-400 font-bold shrink-0 font-mono">
                        {item.count > 0 ? `${item.count} รายการ` : 'ว่างเปล่า'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => handleSyncToDualDbs(false)}
                  disabled={syncing || checkingConflict}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-755 border border-slate-700 text-slate-100 text-xs font-bold rounded-sm flex items-center justify-center gap-2 cursor-pointer transition shadow-sm disabled:opacity-50"
                  title="ตรวจสอบความขัดแย้งของเวลากับบนคลาวด์ก่อนซิงค์"
                >
                  <RefreshCcw className={`w-3.5 h-3.5 ${(syncing || checkingConflict) ? 'animate-spin' : ''}`} />
                  {checkingConflict ? 'กำลังตรวจความขัดแย้งของข้อมูล...' : syncing ? 'กำลังเขียนฐานข้อมูลคลาวด์...' : 'ตรวจความขัดแย้งก่อนซิงค์'}
                </button>

                <button
                  onClick={() => {
                    if (confirm("⚠️ คำเตือน: ยืนยันบังคับเขียนทับข้อมูลบนระบบคลาวด์แบบสดทันที?\n\nข้อมูลปัจจุบันทั้งหมดบน Firebase Firestore จะถูกล้างและแทนที่ด้วยข้อมูลจากบราวเซอร์เครื่องนี้ทันที สำหรับใช้ย้ายเครื่องหรือบันทึกข้อมูลด่วน")) {
                      handleSyncToDualDbs(true);
                    }
                  }}
                  disabled={syncing || checkingConflict}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-sm flex items-center justify-center gap-2 cursor-pointer transition shadow-sm disabled:opacity-50"
                  title="เขียนทับข้อมูลทั้งหมดบน Firebase Firestore ทันที"
                >
                  <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
                  {syncing ? 'กำลังเขียนข้อมูลขึ้นคลาวด์...' : 'เริ่มเขียนทับฐานข้อมูลคลาวด์แบบสดทันที (Push & Overwrite)'}
                </button>
              </div>

              {syncResult && (
                <div className="p-3 bg-slate-800/40 rounded-sm border border-slate-750 font-sans text-[10.5px] space-y-1 text-slate-300 animate-fade-in">
                  <p className="font-bold text-white text-xs mb-1">ผลการซิงโครไนซ์:</p>
                  <p className="flex justify-between items-center">
                    <span>Cloud Firestore Sync Write:</span>
                    <span className={syncResult.firebase.success ? 'text-emerald-450 font-bold' : 'text-rose-400'}>
                      {syncResult.firebase.success ? '✓ สำเร็จ' : `❌ ล้มเหลว: ${syncResult.firebase.error}`}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Load & Restore Remote DB Panel */}
            <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-2xs space-y-5">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-600" /> ดึงข้อมูลคลาวด์กลับสู่เครื่อง (Pull & Recover)
                </h3>
                <p className="text-[11px] text-slate-500 font-sans">
                  ตรวจสอบและดึงชุดข้อมูลล่าสุดที่ถูกบันทึกไว้ในฐานข้อมูลคลาวด์ Firestore กลับมาติดตั้งลงในบราวเซอร์นี้
                </p>
              </div>

              <button
                onClick={handleLoadRemoteData}
                disabled={loadingDbData}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-sm flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${loadingDbData ? 'animate-spin' : ''}`} />
                {loadingDbData ? 'กำลังตรวจสอบคลาวด์...' : 'เรียกค้นข้อมูลฐานข้อมูลคลาวด์ทั้งหมด'}
              </button>

              {remoteDbData && (
                <div className="space-y-3 pt-1 animate-fade-in font-sans">
                  {/* Option: Firebase */}
                  <div className="p-3 border border-slate-200 bg-slate-50/55 rounded-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-slate-800 flex items-center gap-1">
                        <Cloud className="w-3.5 h-3.5 text-emerald-500" /> ข้อมูลบนคลาวด์ Firestore
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {remoteDbData.firebase ? 'พบข้อมูลบนคลาวด์' : 'ไม่พบข้อมูล'}
                      </span>
                    </div>
                    {remoteDbData.firebase ? (
                      <div className="text-[10.5px] text-slate-600 space-y-1 font-sans">
                        <p>👥 พนักงาน: {remoteDbData.firebase.employees?.length || 0} คน | 📅 บันทึกใบลา: {remoteDbData.firebase.leaves?.length || 0} รายการ</p>
                        <p>💰 จ่ายเงินเดือน: {remoteDbData.firebase.payroll?.length || 0} รายการ | 💵 รับ-จ่าย: {remoteDbData.firebase.cashflow?.length || 0} รายการ</p>
                        <button
                          onClick={() => handleRestoreFromRemote('firebase')}
                          className="w-full mt-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] rounded-xs flex items-center justify-center gap-1 cursor-pointer transition"
                        >
                          <ArrowRight className="w-3.5 h-3.5" /> ติดตั้งและแทนที่ระบบด้วยข้อมูลจากคลาวด์
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10.5px] text-slate-400">ตรวจไม่พบข้อมูลสำรอง หรือไม่ได้ตั้งสิทธิ์บนเซิร์ฟเวอร์</p>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      ) : activeSubTab === 'file' ? (
        /* Original JSON File Backup & Snapshots tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Left Column: Quick Actions & Local Snapshots */}
          <div className="space-y-6 lg:col-span-1">
            {/* Quick Export Panel */}
            <div className="bg-white border border-slate-200 rounded-sm p-5 space-y-4 shadow-2xs">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-slate-500" /> 1. ส่งออกข้อมูลสำรอง
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 font-sans">
                  บันทึกสถานะล่าสุดของระบบลงเครื่อง เพื่อนำกลับมาเปิดใช้งานอีกครั้งบนบราวเซอร์นี้ หรือย้ายไปใช้งานบนคอมพิวเตอร์เครื่องอื่นได้อย่างสมบูรณ์
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleExport}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-sm flex items-center justify-center gap-2 cursor-pointer transition shadow-xs"
                >
                  <Download className="w-4 h-4" /> ดาวน์โหลดไฟล์สำรองข้อมูล (.json)
                </button>

                <button
                  onClick={handleCopyToClipboard}
                  className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold rounded-sm flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedSuccess ? 'คัดลอกข้อความสำเร็จ!' : 'คัดลอกฐานข้อมูลดิบ (Raw JSON)'}
                </button>
              </div>

              <div className="text-[10px] bg-slate-50 text-slate-500 rounded p-3 space-y-1 border border-slate-150 font-sans">
                <p className="font-bold flex items-center gap-1 text-slate-700">
                  <Info className="w-3 h-3 text-blue-500" /> ข้อมูลที่สำรองจะครอบคลุม:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[9.5px] text-slate-600">
                  <li>ข้อมูลพนักงานทั้งหมดและประวัติโปรไฟล์</li>
                  <li>บันทึกการทำงานและการลงเวลารายวัน</li>
                  <li>ใบสลิปเงินเดือนและประวัติการเสียภาษี</li>
                  <li>ประวัติการลางานและอนุมัติสิทธิ์</li>
                  <li>งบดุลบัญชีรายรับ-จ่ายเงินสด</li>
                  <li>เช็คคู่ค้าขารับ-ขาจ่ายทั้งหมด</li>
                  <li>ใบวางบิล/ใบส่งของของพาร์ทเนอร์</li>
                  <li>ประวัติกิจกรรมการทำงานของระบบ (Audit Logs)</li>
                </ul>
              </div>
            </div>

            {/* Quick Snapshots Panel */}
            <div className="bg-white border border-slate-200 rounded-sm p-5 space-y-4 shadow-2xs">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans flex items-center gap-1.5">
                  <Save className="w-4 h-4 text-slate-500" /> 2. จุดเซฟข้อมูลด่วน (Browser Snapshots)
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 font-sans">
                  สำรองข้อมูลชั่วคราวเก็บไว้บนสล็อตความจำของบราวเซอร์นี้โดยไม่ต้องดาวน์โหลดไฟล์ เพื่อให้สลับไปทดสอบและเรียกคืนข้อมูลเดิมได้อย่างรวดเร็ว
                </p>
              </div>

              {snapshotSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] p-2.5 rounded-sm flex items-center gap-1.5 font-sans animate-fade-in">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <strong>{snapshotSuccessMsg}</strong>
                </div>
              )}

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans block">สร้างจุดบันทึกใหม่</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSnapshotName}
                    onChange={(e) => setNewSnapshotName(e.target.value)}
                    placeholder="เช่น ก่อนอัปเดตเงินเดือน..."
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-sm text-xs focus:outline-none focus:border-blue-500 transition font-sans"
                  />
                  <button
                    onClick={handleCreateSnapshot}
                    className="px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-sm flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                  >
                    บันทึกด่วน
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans block">สล็อตความจำที่บันทึกไว้ (สูงสุด 5 จุด)</span>
                {snapshots.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-[11px] border border-dashed border-slate-200 rounded font-sans bg-slate-50/50">
                    ยังไม่มีการจุดบันทึกด่วนในหน้านี้
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {snapshots.map((snap) => {
                      const date = new Date(snap.timestamp);
                      const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
                      const dateStr = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
                      return (
                        <div
                          key={snap.id}
                          onClick={() => handleRestoreSnapshot(snap)}
                          className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded transition cursor-pointer text-left"
                        >
                          <div className="space-y-0.5 truncate flex-1 pr-2">
                            <p className="font-bold text-xs text-slate-800 truncate font-sans">{snap.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <span>{dateStr} {timeStr}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[9px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono font-bold hover:bg-blue-100 hover:text-blue-700 transition">
                              กู้คืน
                            </span>
                            <button
                              onClick={(e) => handleDeleteSnapshot(snap.id, e)}
                              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded"
                              title="ลบจุดบันทึกนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Factory Reset Danger Zone */}
            <div className="bg-rose-50/20 border border-rose-150 rounded-sm p-5 space-y-4 shadow-2xs">
              <div>
                <h3 className="text-xs font-bold text-rose-800 uppercase tracking-wider font-sans flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-rose-600" /> พื้นที่อันตราย (Danger Zone)
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 font-sans">
                  จัดการล้างฐานข้อมูลระบบทั้งหมดให้ว่างเปล่า 100% เพื่อเริ่มต้นบันทึกข้อมูลจริงของหน่วยงานของคุณ
                </p>
              </div>

              <div className="space-y-3">
                {/* Wipe Database Completely Empty */}
                {clearEmptyConfirm ? (
                  <div className="space-y-2.5 pt-1 animate-fade-in border border-rose-300 bg-white p-3 rounded">
                    <div className="bg-rose-50 text-rose-800 text-[10.5px] p-2 rounded-sm flex items-start gap-1.5 font-sans leading-relaxed">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
                      <div>
                        <strong>คำเตือน: คุณกำลังจะล้างข้อมูลให้ว่างเปล่า 100%!</strong> ข้อมูลทั้งหมดบน Firebase Firestore และระบบบราวเซอร์จะถูกลบถาวรอย่างสมบูรณ์ ไม่มีพนักงานหลงเหลืออยู่เลย
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleClearEmpty}
                        disabled={clearing}
                        className="flex-1 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-sm cursor-pointer transition shadow-xs disabled:opacity-50"
                      >
                        {clearing ? 'กำลังล้างระบบ...' : 'ใช่, ยืนยันลบข้อมูลว่างเปล่าทั้งหมด'}
                      </button>
                      <button
                        onClick={() => setClearEmptyConfirm(false)}
                        className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-750 text-xs font-bold rounded-sm cursor-pointer transition"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setClearEmptyConfirm(true);
                    }}
                    className="w-full py-2 bg-rose-650 hover:bg-rose-700 text-white text-[11px] font-bold rounded-sm flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> รีเซ็ตฐานข้อมูลให้เป็นข้อมูลว่างเปล่า (Empty Database)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Upload / Restore Panel with Pre-restore Inspector */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-sm p-6 space-y-6 shadow-2xs">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-sans flex items-center gap-1.5">
                  <Upload className="w-4.5 h-4.5 text-blue-600" /> นำเข้าฐานข้อมูลและติดตั้งข้อมูลกู้คืน (Restore Database)
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-sans">
                  คุณสามารถกู้คืนฐานข้อมูลทั้งหมดได้โดยการเลือกไฟล์สำรองข้อมูล (.json) ที่เคยจัดเก็บไว้ หรือนำโค้ด JSON ดิบมาวางลงในกล่องข้อความด้านล่างนี้
                </p>
              </div>

              {/* Drag and Drop uploader zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition duration-250 flex flex-col items-center justify-center gap-3 font-sans ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50/40' 
                    : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden"
                />
                
                <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                  <FileJson className="w-7 h-7" />
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">
                    คลิกเพื่อเลือกไฟล์ หรือลากไฟล์สำรอง (.json) มาวางที่นี่
                  </p>
                  <p className="text-[10px] text-slate-400">
                    รองรับเฉพาะไฟล์ .json ที่จัดเก็บข้อมูลสำรองของโปรแกรมนี้เท่านั้น
                  </p>
                </div>
              </div>

              {/* Separator */}
              <div className="flex items-center text-slate-350 text-[10px] font-bold uppercase tracking-widest my-2">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="px-3">หรือวางข้อความ JSON สำรอง</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Textarea Import */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans block">ข้อมูลดิบ JSON</label>
                <textarea
                  value={importText}
                  onChange={handleTextChange}
                  rows={5}
                  placeholder='วางข้อมูลข้อความ JSON ในกล่องนี้...'
                  className="w-full p-3 border border-slate-200 rounded-sm font-mono text-[11px] focus:outline-none focus:border-blue-500 transition bg-slate-50"
                />
              </div>

              {/* Error alerts */}
              {importError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-sm flex items-start gap-2 font-sans leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Pre-Restore Inspector Summary */}
              {parsedSummary && !importError && (
                <div className="border border-indigo-100 rounded-sm bg-indigo-50/20 p-4 space-y-3 animate-fade-in font-sans">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-indigo-50">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                    <h4 className="text-xs font-bold text-indigo-900">ตรวจพบฐานข้อมูลสำรองของระบบ (Database Inspector)</h4>
                  </div>
                  
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    ไฟล์ตรวจสอบผ่านเกณฑ์ความปลอดภัยแล้ว! ตรวจพบรายการบันทึกของโมดูลต่างๆ ดังนี้:
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[10.5px]">
                    <div className="bg-white p-2 rounded border border-slate-150 flex justify-between items-center">
                      <span className="text-slate-500">👥 รายชื่อพนักงาน:</span>
                      <span className="font-bold text-slate-900 font-mono">{parsedSummary.employeesCount} คน</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-150 flex justify-between items-center">
                      <span className="text-slate-500">📅 บันทึกการลา:</span>
                      <span className="font-bold text-slate-900 font-mono">{parsedSummary.leavesCount} รายการ</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-150 flex justify-between items-center">
                      <span className="text-slate-500">💰 บันทึกจ่ายเงินเดือน:</span>
                      <span className="font-bold text-slate-900 font-mono">{parsedSummary.payrollCount} รายการ</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-150 flex justify-between items-center">
                      <span className="text-slate-500">📈 บันทึกยอดขาย:</span>
                      <span className="font-bold text-slate-900 font-mono">{parsedSummary.salesCount} รายการ</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-150 flex justify-between items-center">
                      <span className="text-slate-500">💵 บัญชีรับ-จ่าย:</span>
                      <span className="font-bold text-slate-900 font-mono">{parsedSummary.cashflowCount} รายการ</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-150 flex justify-between items-center">
                      <span className="text-slate-500">🎫 เช็คจ่าย/เช็ครับ:</span>
                      <span className="font-bold text-slate-900 font-mono">{parsedSummary.chequesCount} ใบ</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-150 flex justify-between items-center">
                      <span className="text-slate-500">🧾 บิลส่งสินค้า:</span>
                      <span className="font-bold text-slate-900 font-mono">{parsedSummary.partnerBillingsCount} ใบ</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-150 flex justify-between items-center">
                      <span className="text-slate-500">🕒 บันทึกการลงเวลา:</span>
                      <span className="font-bold text-slate-900 font-mono">{parsedSummary.attendanceCount} จุดบันทึก</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-150 flex justify-between items-center col-span-2 md:col-span-1">
                      <span className="text-slate-500">📝 งานสรรหา & ประเมิน:</span>
                      <span className="font-bold text-slate-900 font-mono">{(parsedSummary.jobsCount + parsedSummary.applicantsCount + parsedSummary.evaluationsCount)} รายการ</span>
                    </div>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-100 text-indigo-900 text-[10.5px] p-2.5 rounded-sm flex items-start gap-1.5 leading-relaxed">
                    <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                      เมื่อกด <strong>"ยืนยันกู้คืนระบบ"</strong> ข้อมูลปัจจุบันของคุณทั้งหมดจะถูกแทนที่ด้วยข้อมูลจากไฟล์นี้ทันที หน้าต่างเว็บแอปจะทำความสะอาดและรีเฟรชตัวเองโดยอัตโนมัติ
                    </span>
                  </div>
                </div>
              )}

              {importSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-4 rounded-sm flex items-center gap-2 font-sans shadow-2xs">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0 animate-bounce" />
                  <div>
                    <strong>กู้คืนระบบและติดตั้งฐานข้อมูลสำเร็จ!</strong> ระบบกำลังทำการรีเฟรชสภาวะหลัก กรุณารอแป๊บเดียว...
                  </div>
                </div>
              )}

              {/* Confirm button */}
              <form onSubmit={handleImportSubmit} className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={!importText.trim() || !!importError || importSuccess}
                  className={`px-6 py-3 rounded-sm text-xs font-bold font-sans flex items-center gap-2 cursor-pointer transition shadow-xs ${
                    (!importText.trim() || !!importError || importSuccess)
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                      : 'bg-blue-650 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Check className="w-4 h-4" /> ยืนยันตรวจสอบและเริ่มกู้คืนระบบ (Restore)
                </button>
              </form>
            </div>
          </div>

          {/* Full Width Row: Live Database Explorer before Backup */}
          <div className="col-span-1 lg:col-span-3 bg-white border border-slate-200 rounded-sm p-5 space-y-4 shadow-2xs font-sans">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-600" /> 📋 ตารางแสดงรายละเอียดบันทึกข้อมูลที่จะนำออกสำรอง (Current System Data Explorer)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    เรียกดู ตรวจสอบข้อมูลความพร้อม และค้นหารายการบันทึกทั้งหมดก่อนคลิกปุ่ม "ดาวน์โหลดไฟล์สำรองข้อมูล (.json)" เพื่อความถูกต้องครบถ้วนสูงสุด
                  </p>
                </div>
                
                {/* Search Box */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ค้นหาข้อมูลในตารางนี้..."
                    value={inspectSearch}
                    onChange={(e) => setInspectSearch(e.target.value)}
                    className="w-full sm:w-64 pl-8 pr-3 py-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-50/70 focus:bg-white text-xs rounded-sm outline-hidden transition font-sans"
                  />
                  <div className="absolute left-2.5 top-2.5 text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Sub Tabs Selection with counts */}
            <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-2">
              <button
                onClick={() => { setInspectLocalTab('employees'); setInspectSearch(''); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-sm cursor-pointer transition ${
                  inspectLocalTab === 'employees' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                👥 พนักงาน ({localDataSummary?.employees.length || 0})
              </button>
              <button
                onClick={() => { setInspectLocalTab('leaves'); setInspectSearch(''); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-sm cursor-pointer transition ${
                  inspectLocalTab === 'leaves' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                📅 การลา ({localDataSummary?.leaves.length || 0})
              </button>
              <button
                onClick={() => { setInspectLocalTab('payroll'); setInspectSearch(''); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-sm cursor-pointer transition ${
                  inspectLocalTab === 'payroll' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                💰 เงินเดือน ({localDataSummary?.payroll.length || 0})
              </button>
              <button
                onClick={() => { setInspectLocalTab('sales'); setInspectSearch(''); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-sm cursor-pointer transition ${
                  inspectLocalTab === 'sales' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                📈 ยอดขาย ({localDataSummary?.sales.length || 0})
              </button>
              <button
                onClick={() => { setInspectLocalTab('cashflow'); setInspectSearch(''); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-sm cursor-pointer transition ${
                  inspectLocalTab === 'cashflow' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                💵 รับ-จ่าย ({localDataSummary?.cashflow.length || 0})
              </button>
              <button
                onClick={() => { setInspectLocalTab('cheques'); setInspectSearch(''); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-sm cursor-pointer transition ${
                  inspectLocalTab === 'cheques' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                🎫 เช็คคู่ค้า ({localDataSummary?.cheques.length || 0})
              </button>
              <button
                onClick={() => { setInspectLocalTab('partnerBillings'); setInspectSearch(''); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-sm cursor-pointer transition ${
                  inspectLocalTab === 'partnerBillings' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                🧾 วางบิล ({localDataSummary?.partnerBillings.length || 0})
              </button>
              <button
                onClick={() => { setInspectLocalTab('dayoffSwaps'); setInspectSearch(''); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-sm cursor-pointer transition ${
                  inspectLocalTab === 'dayoffSwaps' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                🔄 สลับหยุด ({localDataSummary?.dayoffSwaps.length || 0})
              </button>
              <button
                onClick={() => { setInspectLocalTab('jobs'); setInspectSearch(''); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-sm cursor-pointer transition ${
                  inspectLocalTab === 'jobs' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                💼 งานสรรหา ({localDataSummary?.jobs.length || 0})
              </button>
              <button
                onClick={() => { setInspectLocalTab('applicants'); setInspectSearch(''); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-sm cursor-pointer transition ${
                  inspectLocalTab === 'applicants' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                👤 ผู้สมัคร ({localDataSummary?.applicants.length || 0})
              </button>
              <button
                onClick={() => { setInspectLocalTab('evaluations'); setInspectSearch(''); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-sm cursor-pointer transition ${
                  inspectLocalTab === 'evaluations' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                📊 ประเมินผล ({localDataSummary?.evaluations.length || 0})
              </button>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto border border-slate-150 rounded-sm">
              <table className="w-full text-left border-collapse">
                {/* Employees */}
                {inspectLocalTab === 'employees' && (
                  <>
                    <thead>
                      <tr className="bg-slate-100 text-[11px] text-slate-700 text-left font-sans font-bold border-b border-slate-200">
                        <th className="p-3">รหัสพนักงาน</th>
                        <th className="p-3">ชื่อ-นามสกุล</th>
                        <th className="p-3">แผนก</th>
                        <th className="p-3">ตำแหน่ง / บทบาท</th>
                        <th className="p-3">เงินเดือน</th>
                        <th className="p-3">อีเมล & เบอร์โทร</th>
                        <th className="p-3">วันที่เริ่มงาน</th>
                        <th className="p-3">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((emp: any) => (
                        <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50 text-xs font-sans">
                          <td className="p-3 font-mono font-bold text-slate-600">{emp.id}</td>
                          <td className="p-3 font-bold text-slate-900">{emp.name}</td>
                          <td className="p-3">{emp.department}</td>
                          <td className="p-3 text-slate-600">{emp.role}</td>
                          <td className="p-3 font-mono text-slate-800">฿{(emp.salary || 0).toLocaleString()}</td>
                          <td className="p-3">
                            <div className="text-[10px] text-slate-500">{emp.email}</div>
                            <div className="text-[10px] text-slate-400">{emp.phone}</div>
                          </td>
                          <td className="p-3 text-slate-500 font-mono">{emp.joinDate || '-'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                              emp.status === 'active' ? 'bg-emerald-50 text-emerald-700' : emp.status === 'on-leave' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {emp.status === 'active' ? 'ทำงานอยู่' : emp.status === 'on-leave' ? 'ลาพักผ่อน' : 'พ้นสภาพ'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* Leaves */}
                {inspectLocalTab === 'leaves' && (
                  <>
                    <thead>
                      <tr className="bg-slate-100 text-[11px] text-slate-700 text-left font-sans font-bold border-b border-slate-200">
                        <th className="p-3">ชื่อผู้ลา</th>
                        <th className="p-3">ประเภทใบลา</th>
                        <th className="p-3">ระยะเวลาลางาน</th>
                        <th className="p-3 text-center">จำนวนวัน</th>
                        <th className="p-3">สาเหตุ / เหตุผลประกอบ</th>
                        <th className="p-3">วันที่ยื่นเรื่อง</th>
                        <th className="p-3">สถานะคำขอ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((leave: any) => (
                        <tr key={leave.id} className="border-b border-slate-100 hover:bg-slate-50 text-xs font-sans">
                          <td className="p-3 font-bold text-slate-900">{leave.employeeName}</td>
                          <td className="p-3">
                            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-sm font-bold text-[10px]">
                              {leave.type === 'sick' ? '🤒 ลาป่วย' : leave.type === 'personal' ? '💼 ลากิจ' : leave.type === 'annual' ? '🌴 ลาพักร้อน' : '📄 อื่นๆ'}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-600">{leave.startDate} ถึง {leave.endDate}</td>
                          <td className="p-3 text-center font-bold font-mono">{leave.days} วัน</td>
                          <td className="p-3 text-slate-600 max-w-xs truncate" title={leave.reason}>{leave.reason}</td>
                          <td className="p-3 font-mono text-slate-500">{leave.appliedDate || '-'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                              leave.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : leave.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {leave.status === 'approved' ? 'อนุมัติแล้ว' : leave.status === 'rejected' ? 'ปฏิเสธ' : 'รอการพิจารณา'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* Payroll */}
                {inspectLocalTab === 'payroll' && (
                  <>
                    <thead>
                      <tr className="bg-slate-100 text-[11px] text-slate-700 text-left font-sans font-bold border-b border-slate-200">
                        <th className="p-3">พนักงาน</th>
                        <th className="p-3">เดือนที่จ่าย</th>
                        <th className="p-3">เงินเดือนตั้งต้น</th>
                        <th className="p-3">เงินสวัสดิการรวม</th>
                        <th className="p-3">รายการหักทั้งหมด</th>
                        <th className="p-3">หัก ณ ที่จ่าย (3%)</th>
                        <th className="p-3">เงินสุทธิสุทธิ</th>
                        <th className="p-3">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((pay: any) => (
                        <tr key={pay.id} className="border-b border-slate-100 hover:bg-slate-50 text-xs font-sans">
                          <td className="p-3 font-bold text-slate-900">{pay.employeeName}</td>
                          <td className="p-3 font-bold text-slate-650">{pay.month} {pay.year || 2026}</td>
                          <td className="p-3 font-mono">฿{(pay.baseSalary || 0).toLocaleString()}</td>
                          <td className="p-3 text-emerald-600 font-mono">+฿{(pay.allowances || 0).toLocaleString()}</td>
                          <td className="p-3 text-rose-600 font-mono">-฿{(pay.deductions || 0).toLocaleString()}</td>
                          <td className="p-3 text-slate-500 font-mono">฿{(pay.tax || 0).toLocaleString()}</td>
                          <td className="p-3 font-mono font-bold text-blue-600">฿{(pay.netSalary || 0).toLocaleString()}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                              pay.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {pay.status === 'paid' ? 'จ่ายสำเร็จ' : 'รอโอนเงิน'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* Sales */}
                {inspectLocalTab === 'sales' && (
                  <>
                    <thead>
                      <tr className="bg-slate-100 text-[11px] text-slate-700 text-left font-sans font-bold border-b border-slate-200">
                        <th className="p-3">รหัสรายการ</th>
                        <th className="p-3">วันที่ทำรายการ</th>
                        <th className="p-3">ยอดขาย (บาท)</th>
                        <th className="p-3">ผู้บันทึกรายการ</th>
                        <th className="p-3">หมายเหตุเพิ่มเติม</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((sale: any) => (
                        <tr key={sale.id} className="border-b border-slate-100 hover:bg-slate-50 text-xs font-sans">
                          <td className="p-3 font-mono font-bold text-slate-500">{sale.id}</td>
                          <td className="p-3 font-mono font-bold text-slate-800">{sale.date}</td>
                          <td className="p-3 font-mono font-bold text-emerald-600">฿{(sale.amount || 0).toLocaleString()}</td>
                          <td className="p-3 text-slate-500">{sale.creator || 'ระบบอัตโนมัติ'}</td>
                          <td className="p-3 text-slate-400">{sale.notes || 'บันทึกรายวันประจำร้าน'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* Cashflow */}
                {inspectLocalTab === 'cashflow' && (
                  <>
                    <thead>
                      <tr className="bg-slate-100 text-[11px] text-slate-700 text-left font-sans font-bold border-b border-slate-200">
                        <th className="p-3">วันที่</th>
                        <th className="p-3">ประเภทรายการ</th>
                        <th className="p-3">หมวดหมู่บัญชี</th>
                        <th className="p-3">จำนวนเงิน</th>
                        <th className="p-3">รายละเอียดเงินสด</th>
                        <th className="p-3">สถานะบัญชี</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((cf: any) => (
                        <tr key={cf.id} className="border-b border-slate-100 hover:bg-slate-50 text-xs font-sans">
                          <td className="p-3 font-mono text-slate-600">{cf.date}</td>
                          <td className="p-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              cf.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {cf.type === 'income' ? '📥 รายรับ' : '📤 รายจ่าย'}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-slate-700">{cf.category}</td>
                          <td className={`p-3 font-mono font-bold ${cf.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {cf.type === 'income' ? '+' : '-'}฿{(cf.amount || 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-slate-600 truncate max-w-xs">{cf.description}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[9.5px]">
                              {cf.status === 'completed' ? 'ผ่านบัญชีแล้ว' : 'รอดำเนินการ'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* Cheques */}
                {inspectLocalTab === 'cheques' && (
                  <>
                    <thead>
                      <tr className="bg-slate-100 text-[11px] text-slate-700 text-left font-sans font-bold border-b border-slate-200">
                        <th className="p-3">หมายเลขเช็ค</th>
                        <th className="p-3">ธนาคาร</th>
                        <th className="p-3">ชื่อคู่ค้าพาร์ทเนอร์</th>
                        <th className="p-3">ประเภทเช็ค</th>
                        <th className="p-3">มูลค่าหน้าเช็ค</th>
                        <th className="p-3">วันที่ออกเช็ค</th>
                        <th className="p-3">กำหนดเคลียริ่ง</th>
                        <th className="p-3">สถานะเช็ค</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((cheque: any) => (
                        <tr key={cheque.id} className="border-b border-slate-100 hover:bg-slate-50 text-xs font-sans">
                          <td className="p-3 font-mono font-bold text-indigo-700">{cheque.chequeNumber}</td>
                          <td className="p-3 font-bold text-slate-650">{cheque.bank}</td>
                          <td className="p-3 font-bold text-slate-900">{cheque.partnerName}</td>
                          <td className="p-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              cheque.type === 'payable' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {cheque.type === 'payable' ? 'เช็คจ่าย (Payable)' : 'เช็ครับ (Receivable)'}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-900">฿{(cheque.amount || 0).toLocaleString()}</td>
                          <td className="p-3 font-mono text-slate-500">{cheque.issueDate}</td>
                          <td className="p-3 font-mono font-bold text-amber-700">{cheque.dueDate}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                              cheque.status === 'cleared' ? 'bg-emerald-50 text-emerald-700' : cheque.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {cheque.status === 'cleared' ? 'ผ่านบัญชีแล้ว' : cheque.status === 'pending' ? 'รอขึ้นเงิน' : 'เด้ง/ปฏิเสธ'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* Billings */}
                {inspectLocalTab === 'partnerBillings' && (
                  <>
                    <thead>
                      <tr className="bg-slate-100 text-[11px] text-slate-700 text-left font-sans font-bold border-b border-slate-200">
                        <th className="p-3">เลขที่เอกสาร</th>
                        <th className="p-3">ชื่อคู่ค้าพาร์ทเนอร์</th>
                        <th className="p-3">ประเภทเอกสาร</th>
                        <th className="p-3">จำนวนเงินรวม</th>
                        <th className="p-3">วันที่ออกเอกสาร</th>
                        <th className="p-3">กำหนดชำระ</th>
                        <th className="p-3">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((bill: any) => (
                        <tr key={bill.id} className="border-b border-slate-100 hover:bg-slate-50 text-xs font-sans">
                          <td className="p-3 font-mono font-bold text-slate-700">{bill.docNumber}</td>
                          <td className="p-3 font-bold text-slate-900">{bill.partnerName}</td>
                          <td className="p-3">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] rounded font-bold">
                              {bill.docType === 'delivery' ? '🚚 ใบส่งของ' : bill.docType === 'billing' ? '🧾 ใบวางบิล' : '📄 อื่นๆ'}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-900">฿{(bill.amount || 0).toLocaleString()}</td>
                          <td className="p-3 font-mono text-slate-500">{bill.issueDate}</td>
                          <td className="p-3 font-mono font-bold text-rose-600">{bill.dueDate}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                              bill.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : bill.status === 'billed' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {bill.status === 'paid' ? 'ชำระแล้ว' : bill.status === 'billed' ? 'วางบิลแล้ว' : 'รอดำเนินการ'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* Dayoff Swaps */}
                {inspectLocalTab === 'dayoffSwaps' && (
                  <>
                    <thead>
                      <tr className="bg-slate-100 text-[11px] text-slate-700 text-left font-sans font-bold border-b border-slate-200">
                        <th className="p-3">ชื่อพนักงาน</th>
                        <th className="p-3">วันหยุดเดิม</th>
                        <th className="p-3">วันสลับหยุดใหม่</th>
                        <th className="p-3">เหตุผลขอแลกสลับ</th>
                        <th className="p-3">ยื่นคำขอเมื่อ</th>
                        <th className="p-3">สถานะคำขอ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((swap: any) => (
                        <tr key={swap.id} className="border-b border-slate-100 hover:bg-slate-50 text-xs font-sans">
                          <td className="p-3 font-bold text-slate-900">{swap.employeeName}</td>
                          <td className="p-3 font-mono text-slate-600">{swap.originalOffDate}</td>
                          <td className="p-3 font-mono text-emerald-650 font-bold">{swap.swappedOffDate}</td>
                          <td className="p-3 text-slate-600 truncate max-w-xs">{swap.reason}</td>
                          <td className="p-3 font-mono text-slate-400">{swap.appliedDate}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                              swap.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : swap.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {swap.status === 'approved' ? 'อนุมัติแล้ว' : swap.status === 'rejected' ? 'ปฏิเสธ' : 'รอพิจารณา'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* Jobs */}
                {inspectLocalTab === 'jobs' && (
                  <>
                    <thead>
                      <tr className="bg-slate-100 text-[11px] text-slate-700 text-left font-sans font-bold border-b border-slate-200">
                        <th className="p-3">ตำแหน่งงานว่าง</th>
                        <th className="p-3">แผนกงาน</th>
                        <th className="p-3">ประเภทเวลาทำงาน</th>
                        <th className="p-3">สถานที่ปฏิบัติงาน</th>
                        <th className="p-3 text-center">จำนวนผู้สมัคร</th>
                        <th className="p-3">สถานะรับสมัคร</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((job: any) => (
                        <tr key={job.id} className="border-b border-slate-100 hover:bg-slate-50 text-xs font-sans">
                          <td className="p-3 font-bold text-slate-900">{job.title}</td>
                          <td className="p-3 text-slate-700">{job.department}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600">{job.type}</span>
                          </td>
                          <td className="p-3 text-slate-500">{job.location}</td>
                          <td className="p-3 text-center font-bold font-mono">{job.applicantsCount || 0} คน</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                              job.status === 'open' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {job.status === 'open' ? 'เปิดรับสมัคร' : 'ปิดรับชั่วคราว'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* Applicants */}
                {inspectLocalTab === 'applicants' && (
                  <>
                    <thead>
                      <tr className="bg-slate-100 text-[11px] text-slate-700 text-left font-sans font-bold border-b border-slate-200">
                        <th className="p-3">ชื่อ-นามสกุลผู้สมัคร</th>
                        <th className="p-3">ตำแหน่งงานที่สมัคร</th>
                        <th className="p-3">อีเมลติดต่อ</th>
                        <th className="p-3">วันสมัครงาน</th>
                        <th className="p-3">ระดับฝีมือ/ทักษะสำคัญ</th>
                        <th className="p-3">ผลการประเมิน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((app: any) => (
                        <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50 text-xs font-sans">
                          <td className="p-3 font-bold text-slate-900">{app.name}</td>
                          <td className="p-3 font-bold text-blue-650">{app.jobTitle}</td>
                          <td className="p-3 text-slate-500 font-mono">{app.email}</td>
                          <td className="p-3 font-mono text-slate-400">{app.appliedDate}</td>
                          <td className="p-3 max-w-xs truncate">{app.skills?.join(', ') || '-'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                              app.stage === 'offered' ? 'bg-emerald-50 text-emerald-700' : app.stage === 'interviewing' ? 'bg-amber-50 text-amber-700' : app.stage === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                            }`}>
                              {app.stage === 'offered' ? 'เสนอจ้างงาน' : app.stage === 'interviewing' ? 'กำลังสัมภาษณ์' : app.stage === 'rejected' ? 'ปฏิเสธ' : 'ยื่นใบสมัครแล้ว'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* Evaluations */}
                {inspectLocalTab === 'evaluations' && (
                  <>
                    <thead>
                      <tr className="bg-slate-100 text-[11px] text-slate-700 text-left font-sans font-bold border-b border-slate-200">
                        <th className="p-3">ชื่อพนักงาน</th>
                        <th className="p-3">แผนก/ตำแหน่ง</th>
                        <th className="p-3">ชื่อผู้ประเมิน</th>
                        <th className="p-3">รอบระยะเวลา</th>
                        <th className="p-3 text-center">คะแนนรวม</th>
                        <th className="p-3">ความคิดเห็นหลัก</th>
                        <th className="p-3">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((evalItem: any) => (
                        <tr key={evalItem.id} className="border-b border-slate-100 hover:bg-slate-50 text-xs font-sans">
                          <td className="p-3 font-bold text-slate-900">{evalItem.employeeName}</td>
                          <td className="p-3 text-slate-500">{evalItem.department} ({evalItem.role})</td>
                          <td className="p-3 font-bold text-slate-650">{evalItem.evaluatorName}</td>
                          <td className="p-3 font-mono text-slate-500">{evalItem.period}</td>
                          <td className="p-3 text-center font-bold font-mono text-blue-650">{evalItem.score} / 5</td>
                          <td className="p-3 text-slate-600 truncate max-w-xs" title={evalItem.comments}>{evalItem.comments}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                              evalItem.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {evalItem.status === 'completed' ? 'เสร็จสิ้น' : 'ร่างฉบับ'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}
              </table>

              {filteredData.length === 0 && (
                <div className="p-12 text-center text-slate-400 text-xs font-sans">
                  <p className="font-bold text-slate-500">ไม่พบข้อมูลระเบียนรายการตามเงื่อนไขการค้นหานี้</p>
                  <p className="text-[10px] text-slate-400 mt-1">ลองล้างคำค้นหาหรือเลือกหมวดหมู่อื่นเพื่อเรียกดูข้อมูลปัจจุบันในบราวเซอร์</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Hostinger Installation and Download Panel */
        <div className="space-y-6 animate-fade-in font-sans">
          {/* Main info card */}
          <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-150 pb-4">
              <div className="space-y-1">
                <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest bg-emerald-500 text-white rounded-xs">
                  Hostinger 1-Click Zero Config Deployment
                </span>
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2 mt-1">
                  <Server className="w-5 h-5 text-emerald-600" /> นำออกไฟล์โปรเจกต์และกำหนดค่า เพื่อนำไปขึ้นระบบจริงบน Hostinger
                </h3>
                <p className="text-xs text-slate-505">
                  คุณสามารถดาวน์โหลดโค้ดโปรเจกต์นี้ทั้งหมดในรูปแบบ ZIP พร้อมรัน และรับไฟล์กำหนดค่า (.env) ที่ถูกปรับแต่งโดยระบบ เพื่อนำไปแตกไฟล์รันได้ทันทีบน Hostinger hPanel Node.js
                </p>
              </div>
            </div>

            {/* Downloads Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Box 1: ZIP Codebase */}
              <div className="border border-slate-200 rounded p-5 bg-slate-50/50 flex flex-col justify-between space-y-4 hover:border-emerald-300 transition duration-200">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-50 text-emerald-700 rounded-md">
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">1. ชุดซอร์สโค้ดโปรเจกต์พร้อมติดตั้ง (.ZIP)</h4>
                      <p className="text-[10px] text-slate-400">ครบถ้วนทั้งโค้ดระบบหน้าบ้าน (React/Vite) และเซิร์ฟเวอร์ (Express)</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-650 leading-relaxed pl-1">
                    ระบบได้รวบรวมไฟล์ทั้งหมดที่จำเป็นในการติดตั้ง ยกเว้นไฟล์ขนาดใหญ่ที่ไม่จำเป็น (เช่น <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">node_modules</code>) พร้อมทั้งคอมไพล์และมีไฟล์เริ่มต้นระบบ <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">index.js</code> ที่เหมาะสมกับ hPanel Node.js เรียบร้อยแล้ว
                  </p>
                </div>
                <button
                  onClick={() => window.open("/api/download-zip", "_blank")}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-sm flex items-center justify-center gap-2 cursor-pointer transition shadow-sm"
                >
                  <Download className="w-4 h-4 text-emerald-400 animate-bounce" />
                  ดาวน์โหลดไฟล์โปรเจกต์ .zip ทั้งหมด (hr-payroll-system.zip)
                </button>
              </div>

              {/* Box 2: Env config file */}
              <div className="border border-slate-200 rounded p-5 bg-slate-50/50 flex flex-col justify-between space-y-4 hover:border-emerald-300 transition duration-200">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-50 text-emerald-700 rounded-md">
                      <FileJson className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">2. ไฟล์กำหนดค่าและตัวแปรสภาพแวดล้อม (.env)</h4>
                      <p className="text-[10px] text-slate-400">สร้างไฟล์เชื่อมโยง Firebase Firestore และข้อมูล Hostinger MySQL</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-650 leading-relaxed pl-1">
                    แอปพลิเคชันจะทำการสร้างและบันทึกไฟล์ <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">.env</code> ให้แบบไดนามิก โดยนำค่าความปลอดภัยของ Firebase Firestore ที่กำลังใช้บนเครื่องนี้ พร้อมข้อมูล MySQL ที่คุณกรอกไว้ มาร้อยเรียงให้อย่างลงตัวพร้อมใช้งาน
                  </p>
                </div>
                <button
                  onClick={() => window.open("/api/download-env", "_blank")}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-sm flex items-center justify-center gap-2 cursor-pointer transition shadow-sm"
                >
                  <Download className="w-4 h-4 text-white animate-bounce" />
                  ดาวน์โหลดไฟล์กำหนดค่าสภาพแวดล้อม (.env)
                </button>
              </div>

            </div>
          </div>

          {/* Detailed step-by-step documentation card */}
          <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-2xs space-y-5">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4.5 h-4.5 text-indigo-650" /> 📖 คู่มือการติดตั้งและเปิดใช้งานระบบอย่างง่ายบน Hostinger hPanel
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                ทำตามขั้นตอนหลัก 3 ขั้นตอนนี้ เพื่อนำระบบบริหารทรัพยากรบุคคลและเงินเดือนของคุณขึ้นสู่ออนไลน์อย่างสมบูรณ์แบบ
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 border-t border-slate-100 pt-5 font-sans">
              
              {/* Step 1 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                    1
                  </span>
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">อัปโหลดไฟล์เข้าระบบ</h4>
                </div>
                <p className="text-xs text-slate-605 leading-relaxed pl-8">
                  นำไฟล์ <code className="bg-slate-50 px-1 py-0.5 rounded text-indigo-700 font-mono font-bold">hr-payroll-system.zip</code> อัปโหลดผ่านหน้า **File Manager** ของ Hostinger ภายใต้โฟลเดอร์หลัก เช่น <code className="font-mono bg-slate-50 text-slate-655 px-1">public_html</code> หรือโฟลเดอร์โปรเจกต์ที่คุณต้องการ
                </p>
                <p className="text-xs text-slate-605 leading-relaxed pl-8">
                  ทำการ **Extract (แตกไฟล์ .zip)** ให้ครอบคลุมทุกไฟล์ภายในไดเรกทอรี
                </p>
                <p className="text-xs text-slate-605 leading-relaxed pl-8">
                  นำไฟล์คีย์กำหนดค่า <code className="bg-slate-50 px-1 py-0.5 rounded text-indigo-700 font-mono font-bold">.env</code> ที่ดาวน์โหลดได้จากด้านบน ไปอัปโหลดวางไว้คู่กับไฟล์ <code className="font-mono text-slate-500">package.json</code>
                </p>
              </div>

              {/* Step 2 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                    2
                  </span>
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">ตั้งค่า Node.js ใน hPanel</h4>
                </div>
                <p className="text-xs text-slate-605 leading-relaxed pl-8">
                  ไปที่หน้าคอนโซลควบคุมของ Hostinger (hPanel) และเข้าเมนู **Node.js** หรือ **VPS / App manager** และตั้งค่าการรันระบบดังนี้:
                </p>
                <ul className="text-xs text-slate-605 list-disc list-inside space-y-1.5 pl-8 font-sans">
                  <li>
                    <strong>Node.js Version:</strong> เลือกเวอร์ชัน <code className="font-mono bg-slate-50 px-1 text-slate-800 font-bold">18 หรือ 20 ขึ้นไป</code>
                  </li>
                  <li>
                    <strong>Application Document Root:</strong> เลือกโฟลเดอร์ปลายทางที่คุณอัปโหลดโปรเจกต์ไว้
                  </li>
                  <li>
                    <strong>Application Startup File:</strong> กรอกคำว่า <code className="font-mono bg-slate-50 px-1.5 py-0.5 text-emerald-700 font-extrabold">index.js</code> (พิมพ์ตัวเล็กทั้งหมด)
                  </li>
                </ul>
                <p className="text-xs text-slate-605 leading-relaxed pl-8">
                  คลิกปุ่ม **Save** จากนั้นกดปุ่ม **Start / Restart App** เพื่อเริ่มใช้งานจริงได้ทันที!
                </p>
              </div>

              {/* Step 3 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                    3
                  </span>
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">เชื่อมต่อและซิงค์ MySQL</h4>
                </div>
                <p className="text-xs text-slate-605 leading-relaxed pl-8">
                  ระบบได้รับการออกแบบให้เป็น **Zero-Configuration** เพื่อความง่ายสูงสุด: ทันทีที่เซิร์ฟเวอร์เริ่มทำงานบน Hostinger ระบบจะสั่งรันการคอมไพล์หน้าบ้านและจำลองสภาพแวดล้อมให้อัตโนมัติในตัว
                </p>
                <p className="text-xs text-slate-605 leading-relaxed pl-8">
                  หลังจากแอปออนไลน์แล้ว คุณสามารถสร้างฐานข้อมูล MySQL ใหม่ได้บน hPanel และนำไปกรอกเชื่อมโยงในหน้าตั้งค่าเว็บผ่านปุ่ม ⚙️ ด้านบนขวา และกดปุ่ม **"ซิงค์ข้อมูลทั้งหมด"** ตารางข้อมูลทั้งหมดจะถูกติดตั้งขึ้นฐานข้อมูลใหม่ทันทีอย่างไร้กังวล!
                </p>
              </div>

            </div>

            {/* Alert banner for memory performance optimization */}
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-950 text-xs rounded-sm flex items-start gap-2.5 leading-relaxed">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <strong>💡 ข้อแนะนำพิเศษสำหรับการรันบนโฮสติ้งสเปกจำกัด:</strong> เนื่องจากระบบจะสแกนและสั่งติดตั้งไลบรารีรวมถึงดาวน์โหลดคอมไพล์ชุดโค้ดหน้าบ้านให้อัตโนมัติเมื่อเริ่มต้น หากโฮสติ้งของคุณมี RAM จำกัดและเกิดข้อผิดพลาดในการรันคอมไพล์ครั้งแรก คุณสามารถสั่งรันคำสั่ง <code className="font-mono bg-amber-100/60 px-1">npm install</code> และ <code className="font-mono bg-amber-100/60 px-1">npm run build</code> บนเครื่องส่วนตัวของคุณก่อน แล้วนำโฟลเดอร์ <code className="font-mono bg-amber-100/60 px-1">dist/</code> และ <code className="font-mono bg-amber-100/60 px-1">node_modules/</code> อัปโหลดไปเขียนทับบน Hostinger โดยตรง จะประหยัดความจำและเปิดใช้งานระบบได้ลื่นไหลสมบูรณ์แบบที่สุด!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conflict Warning Modal */}
      {showConflictWarning && conflictDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 w-full max-w-xl shadow-2xl overflow-hidden animate-fade-in font-sans">
            {/* Header */}
            <div className="bg-amber-500 text-slate-950 p-4 flex items-center gap-3">
              <AlertTriangle className="w-7 h-7 shrink-0 text-slate-950" />
              <div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider font-sans">
                  ตรวจพบข้อมูลที่ใหม่กว่าบนคลาวด์ (Newer Data Detected on Cloud)
                </h3>
                <p className="text-[10px] font-sans opacity-95 leading-tight">
                  กรุณาตรวจสอบรายละเอียดเพื่อป้องกันข้อมูลบนคลาวด์เสียหายจากการเขียนทับ
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <div className="bg-amber-50/70 border border-amber-200 rounded-sm p-3.5 text-xs space-y-1.5 text-slate-800 leading-relaxed font-sans">
                <p className="font-bold flex items-center gap-1 text-amber-900 text-[11px]">
                  <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" /> ตรวจพบประเด็นความขัดแย้ง:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1 text-[10.5px] text-slate-700">
                  {conflictDetail.reasons.map((reason, idx) => (
                    <li key={idx} className="font-sans">{reason}</li>
                  ))}
                </ul>
              </div>

              {/* Time Comparison */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-sm space-y-1">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">อัปเดตบนคลาวด์ล่าสุด</span>
                  <span className="text-xs font-bold text-amber-600 font-mono">{conflictDetail.cloudTime || "ตรวจไม่พบข้อมูล"}</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-sm space-y-1">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">อัปเดตในเครื่องล่าสุด</span>
                  <span className="text-xs font-bold text-slate-700 font-mono">{conflictDetail.localTime || "ยังไม่มีข้อมูล"}</span>
                </div>
              </div>

              {/* Detailed Collection Differences */}
              {conflictDetail.diffs.length > 0 && (
                <div className="space-y-1 text-sans">
                  <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">ความแตกต่างของข้อมูล:</span>
                  <div className="border border-slate-150 rounded-sm divide-y divide-slate-150 max-h-36 overflow-y-auto">
                    {conflictDetail.diffs.map((diff, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 text-[10.5px]">
                        <span className="text-slate-700 font-medium">{diff.module}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-500 text-[10px]">ในเครื่อง: <strong className="text-slate-800 font-bold">{diff.local}</strong></span>
                          <span className="text-slate-300">|</span>
                          <span className="text-amber-600 font-bold text-[10px]">คลาวด์: <strong className="text-amber-600 font-extrabold">{diff.cloud}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings and Risks */}
              <p className="text-[10px] text-rose-700 bg-rose-50/70 border border-rose-150 p-3 rounded-sm leading-relaxed font-sans flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  <strong>ความเสี่ยง:</strong> การเลือกกด "ยืนยันเขียนทับคลาวด์" จะเป็นการอัปโหลดเพื่อ **เขียนทับข้อมูลทั้งหมดที่มีบนคลาวด์** ด้วยข้อมูลในเครื่องนี้ ซึ่งอาจส่งผลให้ข้อมูลที่คนอื่นอัปเดตบนคลาวด์สูญหายทันที
                </span>
              </p>
            </div>

            {/* Footer with actions */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-150 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowConflictWarning(false)}
                className="order-3 sm:order-1 px-3 py-1.5 hover:bg-slate-200 border border-slate-250 text-slate-700 text-[11px] font-bold rounded-sm cursor-pointer transition font-sans"
              >
                ยกเลิกและปิด (Cancel)
              </button>

              <button
                type="button"
                onClick={handleForcePullFromConflict}
                className="order-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-sm cursor-pointer transition font-sans flex items-center justify-center gap-1 shrink-0 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" /> ดึงข้อมูลคลาวด์มาใช้แทน (Pull Cloud)
              </button>

              <button
                type="button"
                onClick={() => handleSyncToDualDbs(true)}
                className="order-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-black rounded-sm cursor-pointer transition font-sans flex items-center justify-center gap-1 shrink-0 shadow-xs"
              >
                <ArrowRight className="w-3.5 h-3.5" /> ยืนยันเขียนทับคลาวด์ (Force Sync)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
