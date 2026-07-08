import { useState, useEffect, useRef } from 'react';
import { safeStorage } from './lib/safeStorage';
import { Employee, LeaveRequest, PayrollRecord, JobPosting, Applicant, PerformanceEvaluation, CashFlowTransaction, PartnerCheque, DailyAttendance, DayOffSwap, PartnerBilling, PartnerCompany, SystemSettings, AuditLogEntry, SalesRecord } from './types';
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_LEAVES, 
  INITIAL_PAYROLL, 
  INITIAL_JOBS, 
  INITIAL_APPLICANTS, 
  INITIAL_EVALUATIONS,
  INITIAL_CASH_FLOW,
  INITIAL_CHEQUES,
  INITIAL_ATTENDANCE,
  INITIAL_DAY_OFF_SWAPS,
  INITIAL_PARTNER_BILLINGS,
  INITIAL_PARTNER_COMPANIES,
  INITIAL_SYSTEM_SETTINGS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SALES_RECORDS
} from './initialData';

// Sub-components
import DashboardOverview from './components/DashboardOverview';
import EmployeeDirectory from './components/EmployeeDirectory';
import LeaveManagement from './components/LeaveManagement';
import PayrollManagement from './components/PayrollManagement';
import RecruitmentManagement from './components/RecruitmentManagement';
import PerformanceEvaluationComponent from './components/PerformanceEvaluation';
import CashFlowLedger from './components/CashFlowLedger';
import PartnerChequeManagement from './components/PartnerChequeManagement';
import AttendanceManagement from './components/AttendanceManagement';
import PartnerBillingManagement from './components/PartnerBillingManagement';
import SettingsManagement from './components/SettingsManagement';
import SalesManagement from './components/SalesManagement';
import BackupRestoreManagement from './components/BackupRestoreManagement';
import HrStockDashboard from './components/HrStockDashboard';
import DatabaseInspector from './components/DatabaseInspector';
import LeaveStatistics from './components/LeaveStatistics';


// Icons
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  DollarSign, 
  Briefcase, 
  Award, 
  Settings, 
  Bell, 
  LogOut, 
  UserCircle,
  Menu,
  X,
  Coins,
  CreditCard,
  AlertCircle,
  Clock,
  ClipboardList,
  BarChart3,
  Database,
  TrendingUp,
  RefreshCw,
  Cloud,
  Volume2,
  VolumeX,
  Download
} from 'lucide-react';

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Audio configuration & states
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = safeStorage.getItem('hr_sound_enabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Web Audio API custom notification chime player
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      
      // Dual-tone high frequency alert sound (G5 then C6)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(783.99, now); // G5
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.50, now + 0.12); // C6
      gain2.gain.setValueAtTime(0.08, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.42);
    } catch (e) {
      console.warn("Web Audio API is blocked or unsupported", e);
    }
  };

  // Sync sound preference from local storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = safeStorage.getItem('hr_sound_enabled');
        if (saved !== null) {
          setSoundEnabled(JSON.parse(saved));
        }
      } catch (e) {}
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Unified persistent State (Initialize empty for real data usage)
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [evaluations, setEvaluations] = useState<PerformanceEvaluation[]>([]);
  const [cashFlow, setCashFlow] = useState<CashFlowTransaction[]>([]);
  const [cheques, setCheques] = useState<PartnerCheque[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<{ [employeeId: string]: { [date: string]: DailyAttendance } }>({});
  const [dayOffSwaps, setDayOffSwaps] = useState<DayOffSwap[]>([]);
  const [partnerBillings, setPartnerBillings] = useState<PartnerBilling[]>([]);
  const [partnerCompanies, setPartnerCompanies] = useState<PartnerCompany[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
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
    withholdingTaxRate: 3
  });
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [sales, setSales] = useState<SalesRecord[]>([]);

  // Reference payload string to prevent redundant Firebase writes
  const lastSyncedPayloadRef = useRef<string>("");

  // Clean, sort, and normalize any payload to make comparison order-independent
  const getNormalizedPayloadString = (payload: any) => {
    if (!payload) return "";
    try {
      const cleanDeep = (obj: any): any => {
        if (obj === null || obj === undefined) return null;
        if (Array.isArray(obj)) {
          const cleanedArr = obj.map(cleanDeep).filter(x => x !== null);
          if (cleanedArr.length > 0 && typeof cleanedArr[0] === 'object') {
            cleanedArr.sort((a, b) => {
              const idA = a?.id || a?.timestamp || JSON.stringify(a);
              const idB = b?.id || b?.timestamp || JSON.stringify(b);
              return String(idA).localeCompare(String(idB));
            });
          }
          return cleanedArr;
        }
        if (typeof obj === 'object') {
          const cleanedObj: any = {};
          const keys = Object.keys(obj).sort();
          for (const key of keys) {
            const val = obj[key];
            if (val !== undefined && val !== null && val !== "") {
              cleanedObj[key] = cleanDeep(val);
            }
          }
          return cleanedObj;
        }
        return obj;
      };

      const normalized = cleanDeep({
        employees: payload.employees,
        payroll: payload.payroll,
        leaves: payload.leaves,
        sales: payload.sales,
        cheques: payload.cheques,
        cashflow: payload.cashflow || payload.cashFlow,
        partnerBillings: payload.partnerBillings,
        auditLogs: payload.auditLogs,
        jobs: payload.jobs,
        applicants: payload.applicants,
        evaluations: payload.evaluations,
        attendance: payload.attendance,
        dayoffSwaps: payload.dayoffSwaps,
        partnerCompanies: payload.partnerCompanies,
        systemSettings: payload.systemSettings
      });

      return JSON.stringify(normalized);
    } catch (e) {
      return JSON.stringify(payload);
    }
  };

  // Load initial data from Server Database (or fallback to defaults if none exists)
  const [loadingServer, setLoadingServer] = useState(true);
  const [serverDataLoaded, setServerDataLoaded] = useState(false);

  useEffect(() => {
    const loadDefaultMockData = () => {
      // Disconnect all core data from Local Storage, always fallback to initial mock data
      setEmployees(INITIAL_EMPLOYEES);
      setLeaves(INITIAL_LEAVES);
      setPayroll(INITIAL_PAYROLL);
      setJobs(INITIAL_JOBS);
      setApplicants(INITIAL_APPLICANTS);
      setEvaluations(INITIAL_EVALUATIONS);
      setCashFlow(INITIAL_CASH_FLOW);
      setCheques(INITIAL_CHEQUES);
      setAttendanceRecords(INITIAL_ATTENDANCE);
      setDayOffSwaps(INITIAL_DAY_OFF_SWAPS);
      setPartnerBillings(INITIAL_PARTNER_BILLINGS);
      setPartnerCompanies(INITIAL_PARTNER_COMPANIES);
      setSystemSettings(INITIAL_SYSTEM_SETTINGS);
      setAuditLogs(INITIAL_AUDIT_LOGS);
      setSales(INITIAL_SALES_RECORDS);
      setServerDataLoaded(false);

      // Warm up the lastSyncedPayloadRef with the initial mock data payload
      // so we don't immediately write it back to Server Database upon load!
      const mockPayload = {
        employees: INITIAL_EMPLOYEES,
        payroll: INITIAL_PAYROLL,
        leaves: INITIAL_LEAVES,
        sales: INITIAL_SALES_RECORDS,
        cheques: INITIAL_CHEQUES,
        cashflow: INITIAL_CASH_FLOW,
        partnerBillings: INITIAL_PARTNER_BILLINGS,
        auditLogs: INITIAL_AUDIT_LOGS,
        jobs: INITIAL_JOBS,
        applicants: INITIAL_APPLICANTS,
        evaluations: INITIAL_EVALUATIONS,
        attendance: Object.entries(INITIAL_ATTENDANCE).map(([empId, records]) => ({
          id: empId,
          records
        })),
        dayoffSwaps: INITIAL_DAY_OFF_SWAPS,
        partnerCompanies: INITIAL_PARTNER_COMPANIES,
        systemSettings: [{ id: "current", ...INITIAL_SYSTEM_SETTINGS }]
      };
      lastSyncedPayloadRef.current = getNormalizedPayloadString(mockPayload);
    };

    const loadFromDisasterRecoveryBackup = (): boolean => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const localBackupStr = window.localStorage.getItem('hr_disaster_recovery_backup');
          if (localBackupStr) {
            const parsed = JSON.parse(localBackupStr);
            if (parsed && parsed.employees && parsed.employees.length > 0) {
              console.log("🚀 Found browser-side disaster recovery backup! Loading to prevent data loss...");
              setEmployees(parsed.employees);
              if (parsed.leaves) setLeaves(parsed.leaves);
              if (parsed.payroll) setPayroll(parsed.payroll);
              if (parsed.sales) setSales(parsed.sales);
              if (parsed.cheques) setCheques(parsed.cheques);
              if (parsed.cashflow) setCashFlow(parsed.cashflow);
              if (parsed.partnerBillings) setPartnerBillings(parsed.partnerBillings);
              if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
              if (parsed.jobs) setJobs(parsed.jobs);
              if (parsed.applicants) setApplicants(parsed.applicants);
              if (parsed.evaluations) setEvaluations(parsed.evaluations);
              if (parsed.dayoffSwaps) setDayOffSwaps(parsed.dayoffSwaps);
              if (parsed.partnerCompanies) setPartnerCompanies(parsed.partnerCompanies);

              if (parsed.attendance) {
                const attendanceMap: any = {};
                if (Array.isArray(parsed.attendance)) {
                  parsed.attendance.forEach((item: any) => {
                    if (item && item.id) {
                      attendanceMap[item.id] = item.records || [];
                    }
                  });
                  setAttendanceRecords(attendanceMap);
                } else if (typeof parsed.attendance === 'object' && parsed.attendance !== null) {
                  setAttendanceRecords(parsed.attendance);
                } else {
                  setAttendanceRecords({});
                }
              }

              if (parsed.systemSettings) {
                if (Array.isArray(parsed.systemSettings)) {
                  const settingsDoc = parsed.systemSettings.find((s: any) => s.id === "current");
                  if (settingsDoc) setSystemSettings(settingsDoc);
                } else {
                  setSystemSettings(parsed.systemSettings);
                }
              }

              lastSyncedPayloadRef.current = getNormalizedPayloadString(parsed);
              setServerDataLoaded(true);
              return true;
            }
          }
        }
      } catch (e) {
        console.error("Failed to load browser-side disaster recovery backup:", e);
      }
      return false;
    };

    const loadFromServer = async () => {
      try {
        const res = await fetch('/api/db/load');
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data && result.data.firebase && result.data.firebase.employees && result.data.firebase.employees.length > 0) {
            const fb = result.data.firebase;
            
            setEmployees(fb.employees);
            if (fb.leaves) setLeaves(fb.leaves);
            if (fb.payroll) setPayroll(fb.payroll);
            if (fb.sales) setSales(fb.sales);
            if (fb.cheques) setCheques(fb.cheques);
            if (fb.cashflow) setCashFlow(fb.cashflow);
            if (fb.partnerBillings) setPartnerBillings(fb.partnerBillings);
            if (fb.auditLogs) setAuditLogs(fb.auditLogs);
            if (fb.jobs) setJobs(fb.jobs);
            if (fb.applicants) setApplicants(fb.applicants);
            if (fb.evaluations) setEvaluations(fb.evaluations);
            if (fb.dayoffSwaps) setDayOffSwaps(fb.dayoffSwaps);
            if (fb.partnerCompanies) setPartnerCompanies(fb.partnerCompanies);

            if (fb.attendance) {
              const attendanceMap: any = {};
              if (Array.isArray(fb.attendance)) {
                fb.attendance.forEach((item: any) => {
                  if (item && item.id) {
                    attendanceMap[item.id] = item.records || [];
                  }
                });
                setAttendanceRecords(attendanceMap);
              } else if (typeof fb.attendance === 'object' && fb.attendance !== null) {
                setAttendanceRecords(fb.attendance);
              } else {
                setAttendanceRecords({});
              }
            }

            if (fb.systemSettings && fb.systemSettings.length > 0) {
              const settingsDoc = fb.systemSettings.find((s: any) => s.id === "current");
              if (settingsDoc) setSystemSettings(settingsDoc);
            }

            // Save loaded payload to reference to prevent immediately writing it back
            const loadedPayload = {
              employees: fb.employees || [],
              payroll: fb.payroll || [],
              leaves: fb.leaves || [],
              sales: fb.sales || [],
              cheques: fb.cheques || [],
              cashflow: fb.cashflow || [],
              partnerBillings: fb.partnerBillings || [],
              auditLogs: fb.auditLogs || [],
              jobs: fb.jobs || [],
              applicants: fb.applicants || [],
              evaluations: fb.evaluations || [],
              attendance: fb.attendance || [],
              dayoffSwaps: fb.dayoffSwaps || [],
              partnerCompanies: fb.partnerCompanies || [],
              systemSettings: fb.systemSettings || []
            };
            lastSyncedPayloadRef.current = getNormalizedPayloadString(loadedPayload);

            setServerDataLoaded(true);
          } else {
            console.log("Remote database is empty or not fully initialized. Checking browser backup...");
            if (!loadFromDisasterRecoveryBackup()) {
              console.log("No browser backup found. Using local mock data fallback...");
              loadDefaultMockData();
            }
          }
        } else {
          console.warn("Failed response from database loading endpoint. Checking browser backup...");
          if (!loadFromDisasterRecoveryBackup()) {
            console.warn("No browser backup found. Using local mock data fallback...");
            loadDefaultMockData();
          }
        }
      } catch (error) {
        console.error("Failed to load initial data from Server. Checking browser backup:", error);
        if (!loadFromDisasterRecoveryBackup()) {
          console.error("No browser backup found. Using local mock data fallback...");
          loadDefaultMockData();
        }
      } finally {
        setLoadingServer(false);
      }
    };
    loadFromServer();
  }, []);

  // Core state storage has been disconnected from Local Storage per user request to use Firebase only.
  useEffect(() => {
    // Local Storage persistence is disabled for the entire project's core data.
  }, []);

  // Real-time Auto-Sync to Firebase and MySQL
  const [dbStatuses, setDbStatuses] = useState({
    mysql: { connected: false, error: '' },
    firebase: { connected: false, error: '' }
  });
  const [firestoreQuotaExceeded, setFirestoreQuotaExceeded] = useState(false);
  const [firestoreQuotaError, setFirestoreQuotaError] = useState('');
  const [hideQuotaWarning, setHideQuotaWarning] = useState(false);

  const [autoSync, setAutoSync] = useState<boolean>(() => {
    const saved = safeStorage.getItem('hr_auto_sync');
    return saved ? saved === 'true' : true; // Default to true so they get auto sync
  });
  const [isSyncingTop, setIsSyncingTop] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(() => {
    return safeStorage.getItem('hr_last_synced') || null;
  });

  const fetchDbStatuses = async () => {
    try {
      const res = await fetch('/api/db/config');
      if (res.ok) {
        const data = await res.json();
        if (data.status) {
          setDbStatuses(data.status);
          
          // Detect Firebase quota limit errors from the config check
          const fbStatus = data.status.firebase;
          if (fbStatus && fbStatus.error && (
            fbStatus.error.toLowerCase().includes("quota") || 
            fbStatus.error.toLowerCase().includes("resource_exhausted") ||
            fbStatus.error.toLowerCase().includes("limit") ||
            fbStatus.error.toLowerCase().includes("exhausted")
          )) {
            setFirestoreQuotaExceeded(true);
            setFirestoreQuotaError(fbStatus.error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch DB statuses in App:', error);
    }
  };

  useEffect(() => {
    fetchDbStatuses();
    const interval = setInterval(fetchDbStatuses, 30000);
    return () => clearInterval(interval);
  }, []);

  // Refs to guarantee instant, sequential & zero-loss synchronization queue
  const isSyncingRef = useRef(false);
  const hasPendingRef = useRef(false);
  const latestPayloadRef = useRef<any>(null);

  // Keep latestPayloadRef up to date with the absolute latest states
  useEffect(() => {
    latestPayloadRef.current = {
      employees: employees || [],
      payroll: payroll || [],
      leaves: leaves || [],
      sales: sales || [],
      cheques: cheques || [],
      cashflow: cashFlow || [],
      partnerBillings: partnerBillings || [],
      auditLogs: auditLogs || [],
      jobs: jobs || [],
      applicants: applicants || [],
      evaluations: evaluations || [],
      attendance: Object.entries(attendanceRecords).map(([empId, records]) => ({
        id: empId,
        records
      })),
      dayoffSwaps: dayOffSwaps || [],
      partnerCompanies: partnerCompanies || [],
      systemSettings: [{ id: "current", ...systemSettings }]
    };
  }, [
    employees,
    payroll,
    leaves,
    sales,
    cheques,
    cashFlow,
    partnerBillings,
    auditLogs,
    jobs,
    applicants,
    evaluations,
    attendanceRecords,
    dayOffSwaps,
    partnerCompanies,
    systemSettings
  ]);

  const executeManualSync = async () => {
    if (isSyncingRef.current) {
      hasPendingRef.current = true;
      return;
    }

    const currentPayload = latestPayloadRef.current;
    if (!currentPayload) return;

    // Content-diff comparison to skip sync if no data actually changed from last sync/load
    const currentPayloadStr = getNormalizedPayloadString(currentPayload);
    if (currentPayloadStr === lastSyncedPayloadRef.current) {
      return;
    }

    isSyncingRef.current = true;
    setIsSyncingTop(true);
    try {
      let runSync = true;
      while (runSync) {
        hasPendingRef.current = false;
        const payload = latestPayloadRef.current;
        if (!payload) break;

        const payloadStr = getNormalizedPayloadString(payload);

        const res = await fetch('/api/db/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.success) {
          const nowStr = new Date().toLocaleTimeString('th-TH');
          setLastSyncedTime(nowStr);
          safeStorage.setItem('hr_last_synced', nowStr);

          // Check for Firebase specific quota errors during sync write
          if (data.results && data.results.firebase && !data.results.firebase.success) {
            const fbErr = data.results.firebase.error || "";
            if (
              fbErr.toLowerCase().includes("quota") || 
              fbErr.toLowerCase().includes("resource_exhausted") || 
              fbErr.toLowerCase().includes("limit") || 
              fbErr.toLowerCase().includes("exhausted")
            ) {
              setFirestoreQuotaExceeded(true);
              setFirestoreQuotaError(fbErr);
            } else {
              setFirestoreQuotaExceeded(false);
              setFirestoreQuotaError("");
            }
          } else {
            setFirestoreQuotaExceeded(false);
            setFirestoreQuotaError("");
          }

          // Update reference payload upon success
          lastSyncedPayloadRef.current = payloadStr;
        }

        // Loop again if a state change arrived during the current network request
        runSync = hasPendingRef.current;
      }
    } catch (e) {
      console.error('AutoSync failed:', e);
    } finally {
      isSyncingRef.current = false;
      setIsSyncingTop(false);
    }
  };

  useEffect(() => {
    safeStorage.setItem('hr_auto_sync', String(autoSync));
  }, [autoSync]);

  // Disaster recovery browser-side auto-save whenever state changes
  useEffect(() => {
    if (loadingServer) return;

    try {
      const currentPayload = {
        employees: employees || [],
        payroll: payroll || [],
        leaves: leaves || [],
        sales: sales || [],
        cheques: cheques || [],
        cashflow: cashFlow || [],
        partnerBillings: partnerBillings || [],
        auditLogs: auditLogs || [],
        jobs: jobs || [],
        applicants: applicants || [],
        evaluations: evaluations || [],
        attendance: Object.entries(attendanceRecords).map(([empId, records]) => ({
          id: empId,
          records
        })),
        dayoffSwaps: dayOffSwaps || [],
        partnerCompanies: partnerCompanies || [],
        systemSettings: [{ id: "current", ...systemSettings }]
      };

      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('hr_disaster_recovery_backup', JSON.stringify(currentPayload));
      }
    } catch (e) {
      console.warn("Failed to save browser-side disaster recovery backup:", e);
    }
  }, [
    employees,
    leaves,
    payroll,
    sales,
    cheques,
    cashFlow,
    partnerBillings,
    auditLogs,
    jobs,
    applicants,
    evaluations,
    attendanceRecords,
    dayOffSwaps,
    partnerCompanies,
    systemSettings,
    loadingServer
  ]);

  useEffect(() => {
    if (loadingServer) return;
    if (!autoSync) return;

    // Trigger synchronization with a sensible debounce (2500ms) to preserve Firebase Firestore free daily write quotas
    const delayDebounce = setTimeout(() => {
      executeManualSync();
    }, 2500);

    return () => clearTimeout(delayDebounce);
  }, [
    employees,
    leaves,
    payroll,
    sales,
    cheques,
    cashFlow,
    partnerBillings,
    auditLogs,
    jobs,
    applicants,
    evaluations,
    attendanceRecords,
    dayOffSwaps,
    partnerCompanies,
    systemSettings,
    autoSync,
    loadingServer
  ]);

  // Helper to add audit log
  const addAuditLog = (action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYSTEM', module: string, description: string) => {
    const newLog: AuditLogEntry = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action,
      module,
      description,
      user: 'apiwatkitchenware@gmail.com'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Unified system database actions
  const handleResetAllData = () => {
    setEmployees(INITIAL_EMPLOYEES);
    setLeaves(INITIAL_LEAVES);
    setPayroll(INITIAL_PAYROLL);
    setJobs(INITIAL_JOBS);
    setApplicants(INITIAL_APPLICANTS);
    setEvaluations(INITIAL_EVALUATIONS);
    setCashFlow(INITIAL_CASH_FLOW);
    setCheques(INITIAL_CHEQUES);
    setAttendanceRecords(INITIAL_ATTENDANCE);
    setDayOffSwaps(INITIAL_DAY_OFF_SWAPS);
    setPartnerBillings(INITIAL_PARTNER_BILLINGS);
    setPartnerCompanies(INITIAL_PARTNER_COMPANIES);
    setSystemSettings(INITIAL_SYSTEM_SETTINGS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setSales(INITIAL_SALES_RECORDS);
  };

  const handleClearAllToEmpty = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/db/clear', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Failed to clear remote Firestore database');
      }
      
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to clear remote Firestore database');
      }

      setEmployees([]);
      setLeaves([]);
      setPayroll([]);
      setJobs([]);
      setApplicants([]);
      setEvaluations([]);
      setCashFlow([]);
      setCheques([]);
      setAttendanceRecords({});
      setDayOffSwaps([]);
      setPartnerBillings([]);
      setPartnerCompanies([]);
      setSales([]);
      setAuditLogs([{
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'SYSTEM',
        module: 'ระบบฐานข้อมูล',
        description: 'รีเซ็ตล้างฐานข้อมูลระบบทั้งหมดให้เป็นข้อมูลว่างเปล่าเรียบร้อยแล้ว',
        user: 'apiwatkitchenware@gmail.com'
      }]);
      setSystemSettings({
        companyName: "บริษัท ของคุณ (ข้อมูลว่างเปล่า)",
        companyAddress: "",
        companyPhone: "",
        companyTaxId: "",
        companyEmail: "",
        workingHoursStart: "09:00",
        workingHoursEnd: "18:00",
        otRateMultiplier: 1.5,
        socialSecurityRate: 5,
        socialSecurityMaxCap: 750,
        withholdingTaxRate: 3
      });

      return true;
    } catch (error: any) {
      console.error("Error clearing database to empty:", error);
      alert(`เกิดข้อผิดพลาดในการล้างฐานข้อมูล: ${error.message || error}`);
      return false;
    }
  };

  const handleDeleteRowFromTable = (tableName: string, id: string) => {
    switch (tableName) {
      case 'employees':
        setEmployees(prev => prev.filter(item => item.id !== id));
        addAuditLog('DELETE', 'ตัวตรวจฐานข้อมูล', `ลบแถวข้อมูลพนักงาน ID: ${id}`);
        break;
      case 'leaves':
        setLeaves(prev => prev.filter(item => item.id !== id));
        addAuditLog('DELETE', 'ตัวตรวจฐานข้อมูล', `ลบคำขอลาพักร้อน/ลาป่วย ID: ${id}`);
        break;
      case 'payroll':
        setPayroll(prev => prev.filter(item => item.id !== id));
        addAuditLog('DELETE', 'ตัวตรวจฐานข้อมูล', `ลบสลิปเงินเดือนพนักงาน ID: ${id}`);
        break;
      case 'jobs':
        setJobs(prev => prev.filter(item => item.id !== id));
        addAuditLog('DELETE', 'ตัวตรวจฐานข้อมูล', `ลบโพสต์ตำแหน่งงานว่าง ID: ${id}`);
        break;
      case 'applicants':
        setApplicants(prev => prev.filter(item => item.id !== id));
        addAuditLog('DELETE', 'ตัวตรวจฐานข้อมูล', `ลบประวัติผู้สมัครงาน ID: ${id}`);
        break;
      case 'evaluations':
        setEvaluations(prev => prev.filter(item => item.id !== id));
        addAuditLog('DELETE', 'ตัวตรวจฐานข้อมูล', `ลบประวัติประเมินพนักงาน ID: ${id}`);
        break;
      case 'cashFlow':
        setCashFlow(prev => prev.filter(item => item.id !== id));
        addAuditLog('DELETE', 'ตัวตรวจฐานข้อมูล', `ลบรายการบัญชีรายรับ-รายจ่าย Ledger ID: ${id}`);
        break;
      case 'cheques':
        setCheques(prev => prev.filter(item => item.id !== id));
        addAuditLog('DELETE', 'ตัวตรวจฐานข้อมูล', `ลบเช็คคู่ค้าพาร์ทเนอร์ ID: ${id}`);
        break;
      case 'attendance': {
        const [empId, date] = id.split('_');
        setAttendanceRecords(prev => {
          const next = { ...prev };
          if (next[empId]) {
            const empDates = { ...next[empId] };
            delete empDates[date];
            next[empId] = empDates;
          }
          return next;
        });
        addAuditLog('DELETE', 'ตัวตรวจฐานข้อมูล', `ลบเวลาเข้างานพนักงาน ${empId} วันที่ ${date}`);
        break;
      }
      case 'dayOffSwaps':
        setDayOffSwaps(prev => prev.filter(item => item.id !== id));
        addAuditLog('DELETE', 'ตัวตรวจฐานข้อมูล', `ลบคำขอสลับวันหยุดพนักงาน ID: ${id}`);
        break;
      case 'partnerBillings':
        setPartnerBillings(prev => prev.filter(item => item.id !== id));
        addAuditLog('DELETE', 'ตัวตรวจฐานข้อมูล', `ลบใบส่งของ/วางบิลคู่ค้า ID: ${id}`);
        break;
      case 'partnerCompanies':
        setPartnerCompanies(prev => prev.filter(item => item.id !== id));
        addAuditLog('DELETE', 'ตัวตรวจฐานข้อมูล', `ลบบริษัทคู่ค้า ID: ${id}`);
        break;
      case 'auditLogs':
        setAuditLogs(prev => prev.filter(item => item.id !== id));
        break;
      case 'sales':
        setSales(prev => prev.filter(item => item.id !== id));
        addAuditLog('DELETE', 'ตัวตรวจฐานข้อมูล', `ลบยอดขายรายวัน ID: ${id}`);
        break;
      default:
        break;
    }
  };

  const handleClearTable = (tableName: string) => {
    switch (tableName) {
      case 'employees':
        setEmployees([]);
        addAuditLog('DELETE', 'ตัวตรวจฐานข้อมูล', `ล้างข้อมูลตารางพนักงานทั้งหมด`);
        break;
      case 'leaves':
        setLeaves([]);
        addAuditLog('DELETE', 'ตัวตรวจฐานข้อมูล', `ล้างข้อมูลตารางการลางานทั้งหมด`);
        break;
      case 'payroll':
        setPayroll([]);
        addAuditLog('DELETE', 'ตัวตรวจฐานข้อมูล', `ล้างข้อมูลตารางเงินเดือนทั้งหมด`);
        break;
      case 'jobs':
        setJobs([]);
        addAuditLog('DELETE', 'ตัวตรวจฐานข้อมูล', `ล้างตารางตำแหน่งงานว่างทั้งหมด`);
        break;
      case 'applicants':
        setApplicants([]);
        addAuditLog('DELETE', 'ตัวตรวจฐานข้อมูล', `ล้างตารางผู้สมัครงานทั้งหมด`);
        break;
      case 'evaluations':
        setEvaluations([]);
        addAuditLog('DELETE', 'ตัวตรวจฐานข้อมูล', `ล้างตารางประเมินทั้งหมด`);
        break;
      case 'cashFlow':
        setCashFlow([]);
        addAuditLog('DELETE', 'ตัวตรวจฐานข้อมูล', `ล้างตารางบัญชีเงินสด Ledger ทั้งหมด`);
        break;
      case 'cheques':
        setCheques([]);
        addAuditLog('DELETE', 'ตัวตรวจฐานข้อมูล', `ล้างตารางเช็คพาร์ทเนอร์ทั้งหมด`);
        break;
      case 'attendance':
        setAttendanceRecords({});
        addAuditLog('DELETE', 'ตัวตรวจฐานข้อมูล', `ล้างตารางเวลาเข้างานทั้งหมด`);
        break;
      case 'dayOffSwaps':
        setDayOffSwaps([]);
        addAuditLog('DELETE', 'ตัวตรวจฐานข้อมูล', `ล้างตารางสลับวันหยุดทั้งหมด`);
        break;
      case 'partnerBillings':
        setPartnerBillings([]);
        addAuditLog('DELETE', 'ตัวตรวจฐานข้อมูล', `ล้างตารางใบส่งของ/วางบิลทั้งหมด`);
        break;
      case 'partnerCompanies':
        setPartnerCompanies([]);
        addAuditLog('DELETE', 'ตัวตรวจฐานข้อมูล', `ล้างตารางพาร์ทเนอร์บริษัทคู่ค้าทั้งหมด`);
        break;
      case 'auditLogs':
        setAuditLogs([]);
        break;
      case 'sales':
        setSales([]);
        addAuditLog('DELETE', 'ตัวตรวจฐานข้อมูล', `ล้างตารางบันทึกยอดขายทั้งหมด`);
        break;
      default:
        break;
    }
  };

  const handleExportAllData = (): string => {
    const payload = {
      hr_employees: employees,
      hr_leaves: leaves,
      hr_payroll: payroll,
      hr_jobs: jobs,
      hr_applicants: applicants,
      hr_evaluations: evaluations,
      hr_cashflow: cashFlow,
      hr_cheques: cheques,
      hr_attendance: attendanceRecords,
      hr_dayoff_swaps: dayOffSwaps,
      hr_partner_billings: partnerBillings,
      hr_system_settings: systemSettings,
      hr_audit_logs: auditLogs,
      hr_sales: sales,
    };
    return JSON.stringify(payload, null, 2);
  };

  const handleImportAllData = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (typeof parsed !== 'object' || parsed === null) return false;

      if (parsed.hr_employees) setEmployees(parsed.hr_employees);
      if (parsed.hr_leaves) setLeaves(parsed.hr_leaves);
      if (parsed.hr_payroll) setPayroll(parsed.hr_payroll);
      if (parsed.hr_jobs) setJobs(parsed.hr_jobs);
      if (parsed.hr_applicants) setApplicants(parsed.hr_applicants);
      if (parsed.hr_evaluations) setEvaluations(parsed.hr_evaluations);
      if (parsed.hr_cashflow) setCashFlow(parsed.hr_cashflow);
      if (parsed.hr_cheques) setCheques(parsed.hr_cheques);
      if (parsed.hr_attendance) setAttendanceRecords(parsed.hr_attendance);
      if (parsed.hr_dayoff_swaps) setDayOffSwaps(parsed.hr_dayoff_swaps);
      if (parsed.hr_partner_billings) setPartnerBillings(parsed.hr_partner_billings);
      if (parsed.hr_system_settings) setSystemSettings(parsed.hr_system_settings);
      if (parsed.hr_audit_logs) setAuditLogs(parsed.hr_audit_logs);
      if (parsed.hr_sales) setSales(parsed.hr_sales);

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };


  // Employee actions
  const handleAddEmployee = (newEmp: Employee) => {
    setEmployees(prev => [newEmp, ...prev]);
    addAuditLog('CREATE', 'พนักงาน', `เพิ่มพนักงานใหม่: ${newEmp.name} (รหัส: ${newEmp.id}, แผนก: ${newEmp.department}, ตำแหน่ง: ${newEmp.role})`);
    
    // Auto-create blank June 2026 payroll record for new employee
    const newPay: PayrollRecord = {
      id: `PAY-${Date.now().toString().slice(-4)}`,
      employeeId: newEmp.id,
      employeeName: newEmp.name,
      month: 'มิถุนายน',
      year: 2026,
      baseSalary: newEmp.salary,
      allowances: 1500,
      deductions: Math.round(newEmp.salary * 0.03),
      netSalary: Math.round(newEmp.salary + 1500 - (newEmp.salary * 0.03) - 750),
      tax: Math.round(newEmp.salary * 0.02),
      socialSecurity: 750,
      status: 'pending'
    };
    setPayroll(prev => [newPay, ...prev]);
  };

  const handleUpdateEmployee = (id: string, updatedFields: Partial<Employee>) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === id) {
        return { ...emp, ...updatedFields };
      }
      return emp;
    }));

    const emp = employees.find(e => e.id === id);
    if (emp) {
      addAuditLog('UPDATE', 'พนักงาน', `แก้ไขข้อมูลพนักงาน: ${emp.name} (รหัส: ${emp.id})`);
    }

    // Update references across other collections if ID or Name changes
    if (updatedFields.id && updatedFields.id !== id) {
      setLeaves(prev => prev.map(l => l.employeeId === id ? { ...l, employeeId: updatedFields.id!, employeeName: updatedFields.name || l.employeeName } : l));
      setPayroll(prev => prev.map(p => p.employeeId === id ? { ...p, employeeId: updatedFields.id!, employeeName: updatedFields.name || p.employeeName } : p));
      setEvaluations(prev => prev.map(e => e.employeeId === id ? { ...e, employeeId: updatedFields.id!, employeeName: updatedFields.name || e.employeeName } : e));
    } else if (updatedFields.name) {
      // Name changed but ID stayed same
      setLeaves(prev => prev.map(l => l.employeeId === id ? { ...l, employeeName: updatedFields.name! } : l));
      setPayroll(prev => prev.map(p => p.employeeId === id ? { ...p, employeeName: updatedFields.name! } : p));
      setEvaluations(prev => prev.map(e => e.employeeId === id ? { ...e, employeeName: updatedFields.name! } : e));
    }
  };

  const handleDeleteEmployee = (id: string) => {
    const emp = employees.find(e => e.id === id);
    if (emp) {
      addAuditLog('DELETE', 'พนักงาน', `ลบพนักงานออกจากระบบ: ${emp.name} (รหัส: ${emp.id})`);
    }
    setEmployees(prev => prev.filter(emp => emp.id !== id));
  };

  // Leave actions
  const handleAddLeaveRequest = (newRequest: LeaveRequest) => {
    setLeaves(prev => [newRequest, ...prev]);
  };

  const handleApproveLeave = (id: string) => {
    setLeaves(prev => prev.map(leave => {
      if (leave.id === id) {
        // Also update the employee status to on-leave and subtract balance
        setEmployees(prevEmp => prevEmp.map(emp => {
          if (emp.id === leave.employeeId) {
            const currentBalance = emp.leaveBalance;
            const leaveType = leave.type as 'sick' | 'personal' | 'annual';
            const updatedBalance = { ...currentBalance };
            
            if (leaveType in updatedBalance) {
              updatedBalance[leaveType] = Math.max(0, updatedBalance[leaveType] - leave.days);
            }

            return {
              ...emp,
              status: 'on-leave',
              leaveBalance: updatedBalance
            };
          }
          return emp;
        }));

        return { ...leave, status: 'approved' };
      }
      return leave;
    }));
  };

  const handleRejectLeave = (id: string) => {
    setLeaves(prev => prev.map(leave => {
      if (leave.id === id) {
        return { ...leave, status: 'rejected' };
      }
      return leave;
    }));
  };

  const handleEditLeaveRequest = (updatedLeave: LeaveRequest) => {
    setLeaves(prev => prev.map(leave => {
      if (leave.id === updatedLeave.id) {
        const wasApproved = leave.status === 'approved';
        const isNowApproved = updatedLeave.status === 'approved';

        if (!wasApproved && isNowApproved) {
          // Subtract leave balance and set status to 'on-leave'
          setEmployees(prevEmp => prevEmp.map(emp => {
            if (emp.id === updatedLeave.employeeId) {
              const currentBalance = emp.leaveBalance;
              const leaveType = updatedLeave.type as 'sick' | 'personal' | 'annual';
              const updatedBalance = { ...currentBalance };
              
              if (leaveType in updatedBalance) {
                updatedBalance[leaveType] = Math.max(0, updatedBalance[leaveType] - updatedLeave.days);
              }

              return {
                ...emp,
                status: 'on-leave',
                leaveBalance: updatedBalance
              };
            }
            return emp;
          }));
        } else if (wasApproved && !isNowApproved) {
          // Refund leave balance and set status back to active
          setEmployees(prevEmp => prevEmp.map(emp => {
            if (emp.id === updatedLeave.employeeId) {
              const currentBalance = emp.leaveBalance;
              const leaveType = updatedLeave.type as 'sick' | 'personal' | 'annual';
              const updatedBalance = { ...currentBalance };
              
              if (leaveType in updatedBalance) {
                updatedBalance[leaveType] = updatedBalance[leaveType] + leave.days;
              }

              return {
                ...emp,
                status: 'active',
                leaveBalance: updatedBalance
              };
            }
            return emp;
          }));
        } else if (wasApproved && isNowApproved && (leave.days !== updatedLeave.days || leave.type !== updatedLeave.type)) {
          // Recalculate if still approved but days or type changed
          setEmployees(prevEmp => prevEmp.map(emp => {
            if (emp.id === updatedLeave.employeeId) {
              const currentBalance = emp.leaveBalance;
              const oldType = leave.type as 'sick' | 'personal' | 'annual';
              const newType = updatedLeave.type as 'sick' | 'personal' | 'annual';
              const updatedBalance = { ...currentBalance };
              
              // Refund old days
              if (oldType in updatedBalance) {
                updatedBalance[oldType] = updatedBalance[oldType] + leave.days;
              }
              // Subtract new days
              if (newType in updatedBalance) {
                updatedBalance[newType] = Math.max(0, (updatedBalance[newType] || 0) - updatedLeave.days);
              }

              return {
                ...emp,
                leaveBalance: updatedBalance
              };
            }
            return emp;
          }));
        }

        return updatedLeave;
      }
      return leave;
    }));
  };

  const handleDeleteLeaveRequest = (id: string) => {
    const leaveToDelete = leaves.find(l => l.id === id);
    if (leaveToDelete && leaveToDelete.status === 'approved') {
      setEmployees(prevEmp => prevEmp.map(emp => {
        if (emp.id === leaveToDelete.employeeId) {
          const currentBalance = emp.leaveBalance;
          const leaveType = leaveToDelete.type as 'sick' | 'personal' | 'annual';
          const updatedBalance = { ...currentBalance };
          
          if (leaveType in updatedBalance) {
            updatedBalance[leaveType] = updatedBalance[leaveType] + leaveToDelete.days;
          }

          return {
            ...emp,
            status: 'active',
            leaveBalance: updatedBalance
          };
        }
        return emp;
      }));
    }
    setLeaves(prev => prev.filter(l => l.id !== id));
  };

  // Payroll actions
  const handlePaySalary = (id: string) => {
    setPayroll(prev => prev.map(pay => {
      if (pay.id === id) {
        return { ...pay, status: 'paid' };
      }
      return pay;
    }));
  };

  const handlePayAllPending = () => {
    setPayroll(prev => prev.map(pay => {
      if (pay.status === 'pending') {
        return { ...pay, status: 'paid' };
      }
      return pay;
    }));
  };

  const handleAddPayrollRecord = (newPay: PayrollRecord) => {
    setPayroll(prev => [newPay, ...prev]);
    addAuditLog('CREATE', 'การจ่ายเงิน', `เพิ่มรายการจ่ายเงินเดือนพนักงาน: ${newPay.employeeName} (เลขที่: ${newPay.id})`);
  };

  const handleAddBatchPayroll = (newRecords: PayrollRecord[]) => {
    setPayroll(prev => [...newRecords, ...prev]);
    addAuditLog('CREATE', 'การจ่ายเงิน', `คำนวณเงินเดือนอัตโนมัติสำหรับพนักงานจำนวน ${newRecords.length} รายการ`);
  };

  const handleUpdatePayrollRecord = (updated: PayrollRecord) => {
    setPayroll(prev => prev.map(p => p.id === updated.id ? updated : p));
    addAuditLog('UPDATE', 'การจ่ายเงิน', `แก้ไขข้อมูลการจ่ายเงินเดือนพนักงาน: ${updated.employeeName} (เลขที่: ${updated.id})`);
  };

  const handleDeletePayrollRecord = (id: string) => {
    const record = payroll.find(p => p.id === id);
    if (record) {
      addAuditLog('DELETE', 'การจ่ายเงิน', `ลบรายการจ่ายเงินเดือนพนักงาน: ${record.employeeName} (เลขที่: ${record.id})`);
    }
    setPayroll(prev => prev.filter(p => p.id !== id));
  };

  // Recruitment actions
  const handleAddJob = (newJob: JobPosting) => {
    setJobs(prev => [newJob, ...prev]);
  };

  const handleUpdateApplicantStage = (id: string, stage: Applicant['stage']) => {
    setApplicants(prev => prev.map(app => {
      if (app.id === id) {
        return { ...app, stage };
      }
      return app;
    }));
  };

  const handleAddApplicant = (newApp: Applicant) => {
    setApplicants(prev => [newApp, ...prev]);
  };

  // Evaluation actions
  const handleAddEvaluation = (newEval: PerformanceEvaluation) => {
    setEvaluations(prev => [newEval, ...prev]);
  };

  const handleUpdateEvaluationStatus = (id: string, status: 'draft' | 'completed') => {
    setEvaluations(prev => prev.map(eva => {
      if (eva.id === id) {
        return { ...eva, status };
      }
      return eva;
    }));
  };

  // Cash flow actions
  const handleAddTransaction = (newTx: CashFlowTransaction) => {
    setCashFlow(prev => [newTx, ...prev]);
  };

  const handleUpdateTransaction = (updatedTx: CashFlowTransaction) => {
    setCashFlow(prev => prev.map(tx => tx.id === updatedTx.id ? updatedTx : tx));
  };

  const handleDeleteTransaction = (id: string) => {
    setCashFlow(prev => prev.filter(tx => tx.id !== id));
  };

  // Cheque actions
  const handleAddCheque = (newCheque: PartnerCheque) => {
    setCheques(prev => [newCheque, ...prev]);
  };

  const handleUpdateChequeStatus = (id: string, status: PartnerCheque['status']) => {
    setCheques(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, status };
      }
      return c;
    }));
  };

  const handleDeleteCheque = (id: string) => {
    setCheques(prev => prev.filter(c => c.id !== id));
  };

  const handleEditCheque = (updatedCheque: PartnerCheque) => {
    setCheques(prev => prev.map(c => c.id === updatedCheque.id ? updatedCheque : c));
  };

  // Attendance actions
  const handleUpdateAttendance = (employeeId: string, date: string, attendance: DailyAttendance) => {
    setAttendanceRecords(prev => {
      const empRecords = prev[employeeId] || {};
      return {
        ...prev,
        [employeeId]: {
          ...empRecords,
          [date]: attendance
        }
      };
    });
  };

  const handleAddDayOffSwap = (newSwap: DayOffSwap) => {
    setDayOffSwaps(prev => [newSwap, ...prev]);
  };

  const handleUpdateDayOffSwapStatus = (id: string, status: 'approved' | 'rejected') => {
    setDayOffSwaps(prev => prev.map(swap => {
      if (swap.id === id) {
        return { ...swap, status };
      }
      return swap;
    }));
  };

  const handleDeleteDayOffSwap = (id: string) => {
    setDayOffSwaps(prev => prev.filter(swap => swap.id !== id));
  };

  // Partner Billing actions
  const handleAddBilling = (newBilling: PartnerBilling) => {
    setPartnerBillings(prev => [newBilling, ...prev]);
    addAuditLog('CREATE', 'คู่ค้าใบส่งของและวางบิล', `เพิ่มเอกสารวางบิล/ส่งของใหม่: ${newBilling.partnerName} เลขที่ ${newBilling.docNumber} ยอดเงิน ${newBilling.amount.toLocaleString()} บาท`);
  };

  const handleUpdateBilling = (updatedBilling: PartnerBilling) => {
    const oldB = partnerBillings.find(b => b.id === updatedBilling.id);
    if (oldB) {
      if (oldB.status !== updatedBilling.status) {
        addAuditLog('UPDATE', 'คู่ค้าใบส่งของและวางบิล', `เปลี่ยนสถานะใบวางบิล/ส่งของคู่ค้า ${updatedBilling.partnerName} เลขที่ ${updatedBilling.docNumber} จาก '${oldB.status}' เป็น '${updatedBilling.status}'`);
      } else {
        addAuditLog('UPDATE', 'คู่ค้าใบส่งของและวางบิล', `แก้ไขรายละเอียดใบวางบิล/ส่งของคู่ค้า ${updatedBilling.partnerName} เลขที่ ${updatedBilling.docNumber}`);
      }
    }
    setPartnerBillings(prev => prev.map(item => item.id === updatedBilling.id ? updatedBilling : item));
  };

  const handleDeleteBilling = (id: string) => {
    const b = partnerBillings.find(item => item.id === id);
    if (b) {
      addAuditLog('DELETE', 'คู่ค้าใบส่งของและวางบิล', `ลบใบวางบิล/ส่งของคู่ค้า ${b.partnerName} เลขที่ ${b.docNumber} ยอดเงิน ${b.amount.toLocaleString()} บาท`);
    }
    setPartnerBillings(prev => prev.filter(item => item.id !== id));
  };

  // Partner Companies actions
  const handleAddPartner = (newPartner: PartnerCompany) => {
    setPartnerCompanies(prev => [newPartner, ...prev]);
    addAuditLog('CREATE', 'คู่ค้าใบส่งของและวางบิล', `เพิ่มข้อมูลบริษัทคู่ค้าใหม่: ${newPartner.name}`);
  };

  const handleUpdatePartner = (updatedPartner: PartnerCompany) => {
    setPartnerCompanies(prev => prev.map(item => item.id === updatedPartner.id ? updatedPartner : item));
    addAuditLog('UPDATE', 'คู่ค้าใบส่งของและวางบิล', `แก้ไขรายละเอียดบริษัทคู่ค้า: ${updatedPartner.name}`);
  };

  const handleDeletePartner = (id: string) => {
    const p = partnerCompanies.find(item => item.id === id);
    if (p) {
      addAuditLog('DELETE', 'คู่ค้าใบส่งของและวางบิล', `ลบข้อมูลบริษัทคู่ค้า: ${p.name}`);
    }
    setPartnerCompanies(prev => prev.filter(item => item.id !== id));
  };

  // Sales Ledger actions
  const handleAddSale = (newSale: SalesRecord) => {
    setSales(prev => [newSale, ...prev]);
    addAuditLog('CREATE', 'ยอดขายรายวันเดือนปี', `บันทึกยอดขายใหม่: วันที่ ${newSale.date} ยอดเงิน ${newSale.amount.toLocaleString()} บาท`);
  };

  const handleUpdateSale = (updatedSale: SalesRecord) => {
    const oldS = sales.find(s => s.id === updatedSale.id);
    if (oldS) {
      addAuditLog('UPDATE', 'ยอดขายรายวันเดือนปี', `แก้ไขยอดขาย วันที่ ${updatedSale.date}: ปรับยอดเงินจาก ${oldS.amount.toLocaleString()} เป็น ${updatedSale.amount.toLocaleString()} บาท`);
    }
    setSales(prev => prev.map(item => item.id === updatedSale.id ? updatedSale : item));
  };

  const handleDeleteSale = (id: string) => {
    const s = sales.find(item => item.id === id);
    if (s) {
      addAuditLog('DELETE', 'ยอดขายรายวันเดือนปี', `ลบยอดขาย วันที่ ${s.date} ยอดเงิน ${s.amount.toLocaleString()} บาท`);
    }
    setSales(prev => prev.filter(item => item.id !== id));
  };

  // Get active alerts for cheques approaching due date (<= 2 days)
  const getChequeAlerts = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(todayStr + "T00:00:00");
    
    return cheques
      .filter(c => c.status === 'pending')
      .map(c => {
        const due = new Date(c.dueDate + "T00:00:00");
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          cheque: c,
          diffDays
        };
      })
      .filter(item => item.diffDays <= 2)
      .sort((a, b) => a.diffDays - b.diffDays);
  };

  const chequeAlerts = getChequeAlerts();
  const alertCount = chequeAlerts.length;

  const unpaidBilledCount = partnerBillings.filter(b => b.status === 'billed').length;

  // Sidebar items definition
  const sidebarItems = [
    { id: 'overview', name: 'แผงภาพรวมระบบ', icon: LayoutDashboard },
    { id: 'stock_dashboard', name: 'ทดลองโค้ด 1.เหมือนหุ้น', icon: TrendingUp },
    { id: 'employees', name: 'รายชื่อพนักงาน', icon: Users },
    { id: 'attendance', name: 'ลงเวลา & สลับวันหยุด', icon: Clock },
    { id: 'leaves', name: 'ระบบการลางาน', icon: Calendar },
    { id: 'leave_statistics', name: '1. สถิติการลา', icon: BarChart3 },
    { id: 'payroll', name: 'จ่ายเงินเดือน & ภาษี', icon: DollarSign },
    { id: 'sales', name: 'ยอดขายรายวันเดือนปี', icon: BarChart3 },
    { id: 'cashflow', name: 'ตรวจเช็คขารับ-ขาจ่าย', icon: Coins },
    { id: 'cheques', name: 'เช็คจ่าย & เช็ครับคู่ค้า', icon: CreditCard },
    { id: 'partner_billing', name: 'คู่ค้าใบส่งของและวางบิล', icon: ClipboardList },
    { id: 'recruitment', name: 'สรรหาบุคลากร', icon: Briefcase },
    { id: 'performance', name: 'ประเมินผลงาน', icon: Award },
    { id: 'settings', name: 'ตั้งค่าระบบ', icon: Settings },
    { id: 'backup_restore', name: 'สำรองและกู้คืนข้อมูล', icon: Database },
    { id: 'database_inspector', name: 'ตรวจสอบตารางฐานข้อมูล', icon: Database }
  ];

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-50 flex text-slate-900 antialiased font-sans">
      
      {/* LEFT SIDEBAR (Desktop) */}
      <aside id="sidebar-panel" className={`bg-slate-900 text-slate-400 w-64 fixed inset-y-0 left-0 z-40 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col justify-between border-r border-slate-800`}>
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Logo & Company Name */}
          <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-500 rounded-sm flex items-center justify-center text-white font-black text-sm shadow-xs">
                H
              </div>
              <div>
                <span className="font-extrabold text-white tracking-wider block leading-none text-xs uppercase">HR Core System</span>
                <span className="text-[9px] text-slate-500 mt-1 block tracking-widest font-mono">v4.2.0-STABLE</span>
              </div>
            </div>
            {/* Mobile close toggle */}
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="p-1 md:hidden hover:bg-slate-800 text-slate-500 hover:text-slate-300 rounded-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="px-3 py-4 space-y-4 flex-1">
            <div>
              <div className="px-3 text-[10px] uppercase font-bold text-slate-600 mb-2 tracking-widest font-mono font-bold">Main Operations</div>
              <div className="space-y-1">
                {sidebarItems.slice(0, 11).map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`nav-tab-${item.id}`}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                        playNotificationSound();
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-sm text-xs font-semibold transition ${
                        isActive 
                          ? 'bg-slate-800 text-white border-r-4 border-blue-500' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-500' : 'text-slate-500'}`} />
                        <span>{item.name}</span>
                        {item.id === 'partner_billing' && unpaidBilledCount > 0 && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono opacity-30">{isActive ? '■' : '○'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="px-3 text-[10px] uppercase font-bold text-slate-600 mb-2 tracking-widest font-mono font-bold">Talent & Performance</div>
              <div className="space-y-1">
                {sidebarItems.slice(11, 13).map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`nav-tab-${item.id}`}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                        playNotificationSound();
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-sm text-xs font-semibold transition ${
                        isActive 
                          ? 'bg-slate-800 text-white border-r-4 border-blue-500' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-500' : 'text-slate-500'}`} />
                        <span>{item.name}</span>
                      </div>
                      <span className="text-[10px] font-mono opacity-30">{isActive ? '■' : '○'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="px-3 text-[10px] uppercase font-bold text-slate-600 mb-2 tracking-widest font-mono font-bold">System Configuration</div>
              <div className="space-y-1">
                {sidebarItems.slice(13).map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`nav-tab-${item.id}`}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                        playNotificationSound();
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-sm text-xs font-semibold transition ${
                        isActive 
                          ? 'bg-slate-800 text-white border-r-4 border-blue-500' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-500' : 'text-slate-500'}`} />
                        <span>{item.name}</span>
                      </div>
                      <span className="text-[10px] font-mono opacity-30">{isActive ? '■' : '○'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* User Account / Signout area */}
          <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/40 shrink-0">
            <div className="flex items-center gap-3 p-2 rounded-sm">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white font-mono font-bold">
                AD
              </div>
              <div className="text-xs">
                <p className="text-white font-medium">ผู้ดูแลระบบ HR</p>
                <p className="text-[10px] text-slate-500 font-mono">System Architect</p>
              </div>
            </div>
            <button 
              id="signout-button"
              className="w-full py-2 border border-slate-800 hover:bg-rose-950/20 hover:border-rose-900 text-slate-500 hover:text-rose-400 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider transition flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER CONTENT */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        
        {/* TOP COMPONENT HEADER */}
        <header id="top-app-header" className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between sticky top-0 z-30 no-print">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 md:hidden hover:bg-slate-50 text-slate-500 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">System Overview</span>
              <span className="text-slate-300 text-xs font-mono">/</span>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Main Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time Cloud Sync Panel */}
            <div className="flex items-center gap-2 border border-slate-200 bg-slate-50 rounded-sm py-1 px-2.5 text-xs font-mono select-none">
              <div className="flex items-center gap-1.5">
                {dbStatuses.firebase.connected ? (
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                )}
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider hidden xs:inline">
                  {dbStatuses.firebase.connected ? 'Firebase Live' : 'Firebase Off'}
                </span>
              </div>
              
              <div className="w-px h-3 bg-slate-250 mx-0.5"></div>

              <div className="flex items-center gap-1 shrink-0">
                {loadingServer ? (
                  <span className="text-[9px] text-amber-500 font-bold animate-pulse">
                    Firebase Loading...
                  </span>
                ) : serverDataLoaded ? (
                  <span className="text-[9px] text-emerald-600 font-bold">
                    Firebase Synced ✅
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-500">
                    Local Data 💡
                  </span>
                )}
              </div>
              
              <div className="w-px h-3 bg-slate-250 mx-0.5"></div>
              
              <label className="flex items-center gap-1 cursor-pointer text-[9px] font-bold text-slate-500 hover:text-slate-700">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="rounded-xs border-slate-300 text-indigo-600 focus:ring-indigo-500 w-2.5 h-2.5 cursor-pointer"
                />
                Auto-Sync
              </label>

              <div className="w-px h-3 bg-slate-250 mx-0.5"></div>

              <button
                onClick={executeManualSync}
                disabled={isSyncingTop || (!dbStatuses.mysql.connected && !dbStatuses.firebase.connected)}
                className={`p-0.5 hover:bg-slate-200 rounded-xs text-slate-500 hover:text-indigo-600 disabled:opacity-50 transition cursor-pointer flex items-center justify-center ${isSyncingTop ? 'animate-spin text-indigo-600' : ''}`}
                title={lastSyncedTime ? `ซิงก์ล่าสุดเวลา ${lastSyncedTime}` : 'ซิงโครไนซ์ไปยังคลาวด์'}
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            <div className="hidden sm:flex items-center bg-slate-100 px-3 py-1 rounded-sm border border-slate-200 text-slate-600 text-[10px] font-mono tracking-wider font-bold">
              v4.2.0-STABLE
            </div>
            <div className="w-px h-6 bg-slate-200"></div>

            {/* Global Audio Settings Toggle */}
            <button
              onClick={() => {
                const nv = !soundEnabled;
                setSoundEnabled(nv);
                safeStorage.setItem('hr_sound_enabled', JSON.stringify(nv));
                if (nv) {
                  setTimeout(() => {
                    playNotificationSound();
                  }, 50);
                }
              }}
              className="p-2 text-slate-400 hover:text-blue-600 rounded-sm hover:bg-slate-50 transition flex items-center justify-center cursor-pointer"
              title={soundEnabled ? "ปิดเสียงระบบ (Mute)" : "เปิดเสียงระบบ (Unmute)"}
            >
              {soundEnabled ? (
                <Volume2 className="w-4.5 h-4.5 text-blue-500" />
              ) : (
                <VolumeX className="w-4.5 h-4.5 text-slate-300" />
              )}
            </button>
            <div className="w-px h-6 bg-slate-200"></div>

            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  playNotificationSound();
                }}
                className="p-2 text-slate-400 hover:text-blue-600 rounded-sm hover:bg-slate-50 transition relative cursor-pointer flex items-center justify-center"
                title="การแจ้งเตือนเช็คครบกำหนด"
              >
                <Bell className="w-4.5 h-4.5" />
                {alertCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white font-mono leading-none animate-pulse">
                    {alertCount}
                  </span>
                )}
              </button>

              {/* Dropdown menu */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-sm shadow-xl z-50 overflow-hidden text-xs">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-slate-800 font-sans flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      แจ้งเตือนตั๋วเช็คใกล้กำหนด ({alertCount})
                    </span>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {chequeAlerts.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 font-sans">
                        ไม่มีเช็คที่ใกล้ครบกำหนดใน 2 วันนี้
                      </div>
                    ) : (
                      chequeAlerts.map(({ cheque, diffDays }) => {
                        const isReceivable = cheque.type === 'receivable';
                        
                        let dueText = "";
                        let statusColor = "text-slate-500";
                        if (diffDays === 0) {
                          dueText = "ครบกำหนดวันนี้!";
                          statusColor = "text-rose-600 font-bold animate-pulse";
                        } else if (diffDays === 1) {
                          dueText = "ครบกำหนดวันพรุ่งนี้!";
                          statusColor = "text-amber-600 font-bold";
                        } else if (diffDays === 2) {
                          dueText = "ครบกำหนดในอีก 2 วัน";
                          statusColor = "text-blue-600";
                        } else if (diffDays < 0) {
                          dueText = `เลยกำหนดมาแล้ว ${Math.abs(diffDays)} วัน!`;
                          statusColor = "text-rose-700 font-bold";
                        }

                        return (
                          <div 
                            key={cheque.id} 
                            onClick={() => {
                              setActiveTab('cheques');
                              setShowNotifications(false);
                            }}
                            className="p-3 hover:bg-slate-50 transition cursor-pointer text-left space-y-1"
                          >
                            <div className="flex justify-between items-start">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[8px] font-extrabold uppercase tracking-wider ${
                                isReceivable 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                  : 'bg-blue-50 text-blue-700 border border-blue-100'
                              }`}>
                                {isReceivable ? 'เช็ครับ' : 'เช็คจ่าย'}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 font-bold">
                                เลขที่ {cheque.chequeNumber}
                              </span>
                            </div>
                            
                            <p className="font-bold text-slate-800 truncate" title={cheque.partnerName}>
                              {cheque.partnerName}
                            </p>
                            
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-mono text-slate-900 font-bold">
                                ฿{cheque.amount.toLocaleString()}
                              </span>
                              <span className={`${statusColor} font-sans`}>
                                {dueText}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                    <button
                      onClick={() => {
                        setActiveTab('cheques');
                        setShowNotifications(false);
                      }}
                      className="w-full py-1 text-center text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      ดูทะเบียนเช็คทั้งหมด
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            
            {/* Red ZIP Download Button */}
            <a
              href="/api/download-zip"
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3 py-1.5 rounded-sm shadow-md flex items-center gap-1.5 transition-colors cursor-pointer animate-pulse-once"
              title="ดาวน์โหลดโค้ดทั้งโปรเจกต์เป็นไฟล์ ZIP เพื่อนำไปติดตั้งบน Hostinger"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">ดาวน์โหลด ZIP โค้ดทั้งหมด</span>
              <span className="inline md:hidden">ZIP</span>
            </a>

            <div className="w-px h-6 bg-slate-250"></div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-slate-700 hidden sm:inline-block font-mono uppercase">ADMIN</span>
              <div className="w-7 h-7 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-full flex items-center justify-center text-xs">
                A
              </div>
            </div>
          </div>
        </header>

        {/* BODY TAB CONTENT PANEL */}
        <main id="tab-content-panel" className="p-8 flex-1 space-y-8 max-w-7xl mx-auto w-full">
          {firestoreQuotaExceeded && !hideQuotaWarning && (
            <div id="firebase-quota-warning-banner" className="bg-amber-50 border border-amber-200 rounded-lg p-5 text-slate-800 shadow-sm relative overflow-hidden transition-all flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="bg-amber-100 p-2.5 rounded-full text-amber-600 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="font-extrabold text-sm text-amber-900 flex items-center gap-2">
                  <span>⚠️ การแจ้งเตือนโควตาคลาวด์ Firebase Firestore เต็ม</span>
                  <span className="bg-amber-200/60 text-amber-800 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">Quota Exceeded</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  เนื่องจากแอปพลิเคชันเวอร์ชันสาธารณะนี้ได้รับการใช้งานอย่างหนาแน่น ทำให้โควตาการเขียนข้อมูลฟรีรายวัน (Free daily write units) ของคลาวด์ Firebase สำหรับวันนี้ครบขีดจำกัดสูงสุดแล้ว (โควตาจะได้รับการรีเซ็ตเป็นปกติโดยอัตโนมัติในวันพรุ่งนี้)
                </p>
                <p className="text-xs text-slate-700 leading-relaxed font-bold">
                  💡 ไม่ต้องกังวล! ข้อมูลทั้งหมดของคุณยังคงได้รับการบันทึก สำรอง และประมวลผลอยู่บนฐานข้อมูลออฟไลน์จำลอง (Local JSON Database & local_db.json) ของเครื่องเซิร์ฟเวอร์อย่างปลอดภัย 100% คุณสามารถทำรายการ เพิ่ม ลบ และแก้ไขข้อมูลพนักงาน บัญชี การจ่ายเงินเดือน หรือออกใบกำกับภาษีในระบบต่อไปได้ทุกฟังก์ชันอย่างราบรื่นโดยไม่สูญเสียข้อมูล และระบบจะเชื่อมต่อซิงก์กลับขึ้นคลาวด์อัตโนมัติทันทีที่โควตาเริ่มวันใหม่
                </p>
                <div className="pt-1 flex flex-wrap gap-2 items-center text-[11px] text-slate-500 font-mono">
                  <span>รายละเอียดทางเทคนิค: {firestoreQuotaError || "RESOURCE_EXHAUSTED"}</span>
                </div>
              </div>
              <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto shrink-0 self-stretch justify-end md:justify-center">
                <a 
                  href="https://console.firebase.google.com/project/ai-studio-hrmanagementsyst-54d2ff63/firestore/databases/ai-studio-hrmanagementsyst-54d2ff63-2f43-4bce-bc25-c1c156959b83/data?openUpgradeDialog=true"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-sm text-xs transition cursor-pointer text-center"
                >
                  เปิดหน้าจัดการ Firebase Console
                </a>
                <button
                  onClick={() => setHideQuotaWarning(true)}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-sm text-xs transition cursor-pointer text-center"
                >
                  ซ่อนการแจ้งเตือนนี้
                </button>
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <DashboardOverview 
              employees={employees}
              leaves={leaves}
              jobs={jobs}
              partnerBillings={partnerBillings}
              payroll={payroll}
              onNavigate={(tab) => setActiveTab(tab)}
              onApproveLeave={handleApproveLeave}
              onRejectLeave={handleRejectLeave}
              onUpdateBilling={handleUpdateBilling}
              onAddBilling={handleAddBilling}
              onDeleteBilling={handleDeleteBilling}
            />
          )}

          {activeTab === 'stock_dashboard' && (
            <HrStockDashboard 
              employees={employees}
              leaves={leaves}
              sales={sales}
              cashFlow={cashFlow}
              payroll={payroll}
              jobs={jobs}
              partnerBillings={partnerBillings}
              onAddSale={handleAddSale}
              onAddTransaction={handleAddTransaction}
              onApproveLeave={handleApproveLeave}
              onRejectLeave={handleRejectLeave}
            />
          )}

          {activeTab === 'employees' && (
            <EmployeeDirectory 
              employees={employees}
              attendanceRecords={attendanceRecords}
              leaves={leaves}
              onAddEmployee={handleAddEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceManagement 
              employees={employees}
              leaves={leaves}
              attendanceRecords={attendanceRecords}
              onUpdateAttendance={handleUpdateAttendance}
              dayOffSwaps={dayOffSwaps}
              onAddDayOffSwap={handleAddDayOffSwap}
              onUpdateDayOffSwapStatus={handleUpdateDayOffSwapStatus}
              onDeleteDayOffSwap={handleDeleteDayOffSwap}
            />
          )}

          {activeTab === 'leaves' && (
            <LeaveManagement 
              leaves={leaves}
              employees={employees}
              onAddLeaveRequest={handleAddLeaveRequest}
              onApproveLeave={handleApproveLeave}
              onRejectLeave={handleRejectLeave}
              onEditLeaveRequest={handleEditLeaveRequest}
              onDeleteLeaveRequest={handleDeleteLeaveRequest}
            />
          )}

          {activeTab === 'leave_statistics' && (
            <LeaveStatistics 
              leaves={leaves}
              employees={employees}
            />
          )}

          {activeTab === 'payroll' && (
            <PayrollManagement 
              payroll={payroll}
              employees={employees}
              onPaySalary={handlePaySalary}
              onPayAllPending={handlePayAllPending}
              onUpdatePayroll={handleUpdatePayrollRecord}
              onDeletePayroll={handleDeletePayrollRecord}
              onAddPayroll={handleAddPayrollRecord}
              onAddBatchPayroll={handleAddBatchPayroll}
            />
          )}

          {activeTab === 'sales' && (
            <SalesManagement 
              sales={sales}
              onAddSale={handleAddSale}
              onUpdateSale={handleUpdateSale}
              onDeleteSale={handleDeleteSale}
            />
          )}

          {activeTab === 'cashflow' && (
            <CashFlowLedger 
              cashFlow={cashFlow}
              payroll={payroll}
              onAddTransaction={handleAddTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activeTab === 'cheques' && (
            <PartnerChequeManagement 
              cheques={cheques}
              onAddCheque={handleAddCheque}
              onUpdateChequeStatus={handleUpdateChequeStatus}
              onDeleteCheque={handleDeleteCheque}
              onEditCheque={handleEditCheque}
              partners={partnerCompanies}
              onAddPartner={handleAddPartner}
            />
          )}

          {activeTab === 'partner_billing' && (
            <PartnerBillingManagement 
              billings={partnerBillings}
              onAddBilling={handleAddBilling}
              onUpdateBilling={handleUpdateBilling}
              onDeleteBilling={handleDeleteBilling}
              partners={partnerCompanies}
              onAddPartner={handleAddPartner}
              onUpdatePartner={handleUpdatePartner}
              onDeletePartner={handleDeletePartner}
            />
          )}

          {activeTab === 'recruitment' && (
            <RecruitmentManagement 
              jobs={jobs}
              applicants={applicants}
              onAddJob={handleAddJob}
              onUpdateApplicantStage={handleUpdateApplicantStage}
              onAddApplicant={handleAddApplicant}
            />
          )}

          {activeTab === 'performance' && (
            <PerformanceEvaluationComponent 
              evaluations={evaluations}
              employees={employees}
              onAddEvaluation={handleAddEvaluation}
              onUpdateEvaluationStatus={handleUpdateEvaluationStatus}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsManagement 
              settings={systemSettings}
              onUpdateSettings={(newSettings) => {
                setSystemSettings(newSettings);
                addAuditLog('UPDATE', 'ตั้งค่าระบบ', 'ปรับปรุงข้อมูลโปรไฟล์และเกณฑ์มาตรฐานระบบ');
              }}
              onResetAllData={() => {
                handleResetAllData();
                addAuditLog('DELETE', 'ระบบ', 'ล้างฐานข้อมูลระบบทั้งหมดกลับเป็นค่าเริ่มต้น');
              }}
              onClearToEmpty={async () => {
                const res = await handleClearAllToEmpty();
                if (res) {
                  addAuditLog('DELETE', 'ระบบ', 'รีเซ็ตล้างฐานข้อมูลระบบทั้งหมดให้เป็นข้อมูลว่างเปล่า');
                }
                return res;
              }}
              onImportAllData={(jsonData) => {
                const res = handleImportAllData(jsonData);
                if (res) {
                  addAuditLog('SYSTEM', 'ระบบ', 'กู้คืนระบบจากข้อมูลสำรอง JSON สำเร็จ');
                }
                return res;
              }}
              onExportAllData={(silent) => {
                if (!silent) {
                  addAuditLog('SYSTEM', 'ระบบ', 'ดาวน์โหลดข้อมูลสำรองระบบ (JSON Export)');
                }
                return handleExportAllData();
              }}
              auditLogs={auditLogs}
              onClearAuditLogs={() => {
                setAuditLogs([]);
                safeStorage.setItem('hr_audit_logs', JSON.stringify([]));
              }}
            />
          )}

          {activeTab === 'backup_restore' && (
            <BackupRestoreManagement 
              onResetAllData={() => {
                handleResetAllData();
                addAuditLog('DELETE', 'ระบบ', 'ล้างฐานข้อมูลระบบทั้งหมดกลับเป็นค่าเริ่มต้น');
              }}
              onClearToEmpty={async () => {
                const res = await handleClearAllToEmpty();
                if (res) {
                  addAuditLog('DELETE', 'ระบบ', 'รีเซ็ตล้างฐานข้อมูลระบบทั้งหมดให้เป็นข้อมูลว่างเปล่า');
                }
                return res;
              }}
              onImportAllData={(jsonData) => {
                const res = handleImportAllData(jsonData);
                if (res) {
                  addAuditLog('SYSTEM', 'ระบบ', 'กู้คืนระบบจากข้อมูลสำรอง JSON สำเร็จ');
                }
                return res;
              }}
              onExportAllData={(silent) => {
                if (!silent) {
                  addAuditLog('SYSTEM', 'ระบบ', 'ดาวน์โหลดข้อมูลสำรองระบบ (JSON Export)');
                }
                return handleExportAllData();
              }}
            />
          )}

          {activeTab === 'database_inspector' && (
            <DatabaseInspector
              employees={employees}
              leaves={leaves}
              payroll={payroll}
              jobs={jobs}
              applicants={applicants}
              evaluations={evaluations}
              cashFlow={cashFlow}
              cheques={cheques}
              attendanceRecords={attendanceRecords}
              dayOffSwaps={dayOffSwaps}
              partnerBillings={partnerBillings}
              partnerCompanies={partnerCompanies}
              systemSettings={systemSettings}
              auditLogs={auditLogs}
              sales={sales}
              onDeleteRow={handleDeleteRowFromTable}
              onClearTable={handleClearTable}
            />
          )}
        </main>
      </div>
    </div>
  );
}
