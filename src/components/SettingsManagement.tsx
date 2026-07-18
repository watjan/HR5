import { useState, useEffect, useMemo } from 'react';
import { SystemSettings, AuditLogEntry, AdminUser, AdminPermissions } from '../types';
import { isLocalStorageEnabled, setLocalStorageEnabled } from '../lib/safeStorage';
import { 
  Building2, 
  Clock, 
  Coins, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  Save, 
  Phone, 
  Mail, 
  FileText, 
  AlertTriangle,
  Settings,
  Briefcase,
  History,
  Search,
  Trash2,
  Database,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Plus,
  Eye,
  EyeOff,
  UserPlus,
  Users,
  Key,
  ShieldCheck,
  MessageSquare,
  Send
} from 'lucide-react';

interface SettingsManagementProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  onResetAllData: () => void;
  onClearToEmpty: () => Promise<boolean>;
  onImportAllData: (jsonData: string) => boolean;
  onExportAllData: (silent?: boolean) => string;
  auditLogs: AuditLogEntry[];
  onClearAuditLogs: () => void;
  currentAdminId?: string;
}

export default function SettingsManagement({
  settings,
  onUpdateSettings,
  onResetAllData,
  onClearToEmpty,
  onImportAllData,
  onExportAllData,
  auditLogs = [],
  onClearAuditLogs,
  currentAdminId = 'watjan'
}: SettingsManagementProps) {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'shift' | 'tax' | 'database' | 'audit_logs' | 'admins' | 'line'>('profile');
  
  const [isLSOn, setIsLSOn] = useState(() => isLocalStorageEnabled());
  const [lsToggleMessage, setLsToggleMessage] = useState<string | null>(null);

  const handleToggleLocalStorage = () => {
    const newValue = !isLSOn;
    setIsLSOn(newValue);
    setLocalStorageEnabled(newValue);
    setLsToggleMessage(`สลับสถานะเรียบร้อย: ${newValue ? 'เปิดใช้งาน' : 'ปิดใช้งาน'} Local Storage`);
    setTimeout(() => {
      setLsToggleMessage(null);
    }, 4000);
  };

  // Local form states initialized from settings prop
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [companyAddress, setCompanyAddress] = useState(settings.companyAddress);
  const [companyPhone, setCompanyPhone] = useState(settings.companyPhone);
  const [companyTaxId, setCompanyTaxId] = useState(settings.companyTaxId);
  const [companyEmail, setCompanyEmail] = useState(settings.companyEmail);
  
  const [workingHoursStart, setWorkingHoursStart] = useState(settings.workingHoursStart);
  const [workingHoursEnd, setWorkingHoursEnd] = useState(settings.workingHoursEnd);
  const [otRateMultiplier, setOtRateMultiplier] = useState(settings.otRateMultiplier);
  
  const [socialSecurityRate, setSocialSecurityRate] = useState(settings.socialSecurityRate);
  const [socialSecurityMaxCap, setSocialSecurityMaxCap] = useState(settings.socialSecurityMaxCap);
  const [withholdingTaxRate, setWithholdingTaxRate] = useState(settings.withholdingTaxRate);

  const [lineNotifyToken, setLineNotifyToken] = useState(settings.lineNotifyToken || '');
  const [lineNotifyEnabled, setLineNotifyEnabled] = useState(settings.lineNotifyEnabled || false);

  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; isSandbox?: boolean } | null>(null);
  const [showMockLinePreview, setShowMockLinePreview] = useState(false);
  const [mockMessageContent, setMockMessageContent] = useState('');

  const handleTestLineNotify = async () => {
    if (!lineNotifyToken) {
      alert("กรุณากรอก LINE Notify Token ก่อนทดสอบ");
      return;
    }
    const testMessage = `🔔 [ทดสอบ] เชื่อมต่อ LINE Notify สำหรับส่งรายงานยอดขายร้านค้าสำเร็จเรียบร้อยแล้ว!`;
    setMockMessageContent(testMessage);
    setTestSending(true);
    setTestResult(null);
    try {
      const response = await fetch("/api/line-notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: testMessage,
          token: lineNotifyToken
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTestResult({ success: true, message: "ทดสอบส่งการแจ้งเตือนสำเร็จ! กรุณาตรวจสอบในห้องแชท LINE ของคุณ" });
      } else {
        setTestResult({ 
          success: false, 
          message: data.error || "เกิดข้อผิดพลาดในการส่งข้อความทดสอบ",
          isSandbox: !!data.isSandboxError
        });
        if (data.isSandboxError) {
          setShowMockLinePreview(true);
        }
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์" });
    } finally {
      setTestSending(false);
    }
  };

  // Audit Logs states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterModule, setFilterModule] = useState<string>('ALL');
  const [clearConfirm, setClearConfirm] = useState(false);
  const [currentLogPage, setCurrentLogPage] = useState(1);
  const logsPerPage = 10;

  // Reset page when filter changes
  useEffect(() => {
    setCurrentLogPage(1);
  }, [searchQuery, filterAction, filterModule]);

  // Synchronize asynchronous settings load from parent prop to local form states
  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName || '');
      setCompanyAddress(settings.companyAddress || '');
      setCompanyPhone(settings.companyPhone || '');
      setCompanyTaxId(settings.companyTaxId || '');
      setCompanyEmail(settings.companyEmail || '');
      setWorkingHoursStart(settings.workingHoursStart || '08:30');
      setWorkingHoursEnd(settings.workingHoursEnd || '17:30');
      setOtRateMultiplier(settings.otRateMultiplier ?? 1.5);
      setSocialSecurityRate(settings.socialSecurityRate ?? 5);
      setSocialSecurityMaxCap(settings.socialSecurityMaxCap ?? 750);
      setWithholdingTaxRate(settings.withholdingTaxRate ?? 3);
      setLineNotifyToken(settings.lineNotifyToken || '');
      setLineNotifyEnabled(settings.lineNotifyEnabled || false);
    }
  }, [settings]);

  // Status and notification messages
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [clearEmptyConfirm, setClearEmptyConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  // Administrators management local state
  const [adminsList, setAdminsList] = useState<AdminUser[]>(() => settings?.admins || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAdminId, setNewAdminId] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminPermissions, setNewAdminPermissions] = useState<AdminPermissions>({
    employees: true,
    attendance: true,
    leaves: true,
    payroll: true,
    sales: true,
    cashflow: true,
    cheques: true,
    partner_billing: true,
    recruitment: true,
    performance: true,
    settings: false,
    backup_restore: false,
    database_inspector: false
  });

  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [editAdminName, setEditAdminName] = useState('');
  const [editAdminRole, setEditAdminRole] = useState('');
  const [editAdminPassword, setEditAdminPassword] = useState('');
  const [editAdminPermissions, setEditAdminPermissions] = useState<AdminPermissions | null>(null);

  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (settings?.admins) {
      setAdminsList(settings.admins);
    }
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SystemSettings = {
      companyName,
      companyAddress,
      companyPhone,
      companyTaxId,
      companyEmail,
      workingHoursStart,
      workingHoursEnd,
      otRateMultiplier: Number(otRateMultiplier),
      socialSecurityRate: Number(socialSecurityRate),
      socialSecurityMaxCap: Number(socialSecurityMaxCap),
      withholdingTaxRate: Number(withholdingTaxRate),
      lineNotifyToken,
      lineNotifyEnabled,
      admins: settings?.admins || adminsList
    };
    onUpdateSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = newAdminId.trim().toLowerCase();
    if (!cleanId) return;

    if (adminsList.some(a => a.id.toLowerCase() === cleanId)) {
      alert(`❌ ชื่อผู้ใช้งาน (Username) "${cleanId}" มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น`);
      return;
    }

    const newAdmin: AdminUser = {
      id: cleanId,
      name: newAdminName.trim() || cleanId,
      role: newAdminRole.trim() || 'ผู้ดูแลระบบร่วม',
      password: newAdminPassword.trim() || 'Password123!',
      permissions: newAdminPermissions
    };

    const updatedAdmins = [...adminsList, newAdmin];
    setAdminsList(updatedAdmins);

    const updatedSettings: SystemSettings = {
      ...settings,
      admins: updatedAdmins
    };
    onUpdateSettings(updatedSettings);

    // Reset fields
    setNewAdminId('');
    setNewAdminName('');
    setNewAdminRole('');
    setNewAdminPassword('');
    setNewAdminPermissions({
      employees: true,
      attendance: true,
      leaves: true,
      payroll: true,
      sales: true,
      cashflow: true,
      cheques: true,
      partner_billing: true,
      recruitment: true,
      performance: true,
      settings: false,
      backup_restore: false,
      database_inspector: false
    });
    setShowAddForm(false);
  };

  const handleStartEditAdmin = (admin: AdminUser) => {
    setEditingAdminId(admin.id);
    setEditAdminName(admin.name);
    setEditAdminRole(admin.role);
    setEditAdminPassword(admin.password);
    setEditAdminPermissions(admin.permissions);
  };

  const handleUpdateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdminId || !editAdminPermissions) return;

    // Safety constraint: Prevent removing settings permission of self
    const isSelf = editingAdminId.toLowerCase() === currentAdminId.toLowerCase();
    const updatedPermissions = { ...editAdminPermissions };
    if (isSelf) {
      updatedPermissions.settings = true; // force keep settings permission
    }

    const updatedAdmins = adminsList.map(admin => {
      if (admin.id.toLowerCase() === editingAdminId.toLowerCase()) {
        return {
          ...admin,
          name: editAdminName.trim() || admin.name,
          role: editAdminRole.trim() || admin.role,
          password: editAdminPassword.trim() || admin.password,
          permissions: updatedPermissions
        };
      }
      return admin;
    });

    setAdminsList(updatedAdmins);
    const updatedSettings: SystemSettings = {
      ...settings,
      admins: updatedAdmins
    };
    onUpdateSettings(updatedSettings);

    // Clear editing states
    setEditingAdminId(null);
    setEditAdminPermissions(null);
  };

  const handleDeleteAdmin = (adminId: string) => {
    if (adminId.toLowerCase() === currentAdminId.toLowerCase()) {
      alert('❌ คุณไม่สามารถลบคุณลักษณะผู้ดูแลระบบบัญชีปัจจุบันที่คุณกำลังล็อกอินเข้าใช้งานอยู่ได้!');
      return;
    }

    if (window.confirm(`⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบสิทธิ์ผู้ดูแลระบบของ "${adminId}" ออกอย่างถาวร?`)) {
      const updatedAdmins = adminsList.filter(a => a.id.toLowerCase() !== adminId.toLowerCase());
      setAdminsList(updatedAdmins);
      const updatedSettings: SystemSettings = {
        ...settings,
        admins: updatedAdmins
      };
      onUpdateSettings(updatedSettings);
    }
  };

  const togglePasswordVisibility = (adminId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [adminId]: !prev[adminId]
    }));
  };

  const handleExport = () => {
    try {
      const dataStr = onExportAllData();
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `HR_CORE_SYSTEM_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);
    setImportSuccess(false);
    
    if (!importText.trim()) {
      setImportError('กรุณากรอกหรือวางข้อมูล JSON สำหรับกู้คืนระบบ');
      return;
    }

    try {
      // Basic check
      const parsed = JSON.parse(importText);
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('รูปแบบไฟล์กู้คืนไม่ถูกต้อง');
      }
      
      const success = onImportAllData(importText);
      if (success) {
        setImportSuccess(true);
        setImportText('');
        // Reload system setting values in state
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setImportError('ไม่พบโครงสร้างข้อมูลระบบที่ระบุ กรุณาตรวจสอบความถูกต้อง');
      }
    } catch (err: any) {
      setImportError(`ข้อมูลไม่ถูกต้อง: ${err.message || 'JSON Parse Error'}`);
    }
  };

  const handleResetData = () => {
    onResetAllData();
    setResetConfirm(false);
    // Reload to refresh all state
    window.location.reload();
  };

  const handleClearEmptyData = async () => {
    setClearing(true);
    const success = await onClearToEmpty();
    setClearing(false);
    setClearEmptyConfirm(false);
    if (success) {
      window.location.reload();
    }
  };

  // Extract unique modules to populate the module filter dynamically
  const uniqueModules = Array.from(new Set(auditLogs.map(log => log.module)));

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    const matchesModule = filterModule === 'ALL' || log.module === filterModule;

    return matchesSearch && matchesAction && matchesModule;
  });

  // Audit Logs Pagination calculations
  const totalLogsCount = filteredLogs.length;
  const totalLogPages = Math.ceil(totalLogsCount / logsPerPage);
  const logStartIndex = (currentLogPage - 1) * logsPerPage;
  const paginatedLogs = filteredLogs.slice(logStartIndex, logStartIndex + logsPerPage);

  return (
    <div id="settings-management-container" className="space-y-6 animate-fade-in pb-16 relative">
      {/* Floating Success Notification Toast */}
      {saveSuccess && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-4 rounded-md shadow-2xl border border-slate-800 animate-fade-in min-w-[320px] max-w-sm">
          <span className="p-1.5 bg-emerald-500 text-white rounded-full">
            <Check className="w-4 h-4" />
          </span>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold font-sans text-emerald-400">บันทึกการตั้งค่าสำเร็จ!</h4>
            <p className="text-[10px] text-slate-300 font-sans">
              ระบบได้บันทึกข้อมูลและปรับปรุงเกณฑ์ทำงาน/ภาษีในคลาวด์แล้ว
            </p>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 border border-slate-200 rounded-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-slate-100 text-slate-800 rounded-sm">
              <Settings className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight font-sans">ตั้งค่าระบบ (System Settings)</h1>
          </div>
          <p className="text-xs text-slate-500 font-sans">
            จัดการโปรไฟล์บริษัท กำหนดนโยบายชั่วโมงการทำงาน อัตราสวัสดิการ อัตราภาษี และควบคุมการสำรองฐานข้อมูลในระบบ
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Sub-Tabs Navigation */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-sm p-2 space-y-1">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-xs font-bold transition font-sans ${
              activeSubTab === 'profile'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>ข้อมูลองค์กร</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('shift')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-xs font-bold transition font-sans ${
              activeSubTab === 'shift'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>เวลาทำงาน & โอที</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('tax')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-xs font-bold transition font-sans ${
              activeSubTab === 'tax'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Coins className="w-4 h-4 shrink-0" />
            <span>ภาษี & ประกันสังคม</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('database')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-xs font-bold transition font-sans ${
              activeSubTab === 'database'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>จัดการข้อมูลสำรอง</span>
          </button>

          <button
            onClick={() => setActiveSubTab('audit_logs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-xs font-bold transition font-sans ${
              activeSubTab === 'audit_logs'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 shrink-0" />
            <span>ประวัติบันทึกระบบ (Audit Logs)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('admins')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-xs font-bold transition font-sans ${
              activeSubTab === 'admins'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>สิทธิ์ผู้ดูแลระบบ (Admin RBAC)</span>
          </button>
        </div>

        {/* Right Active Sub-Tab Panel */}
        <div className="lg:col-span-3 space-y-6">
          {saveSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-sm p-4 flex items-center gap-2 animate-fade-in font-sans">
              <Check className="w-4 h-4 text-emerald-600" />
              <strong>บันทึกการตั้งค่าระบบเรียบร้อยแล้ว!</strong> การตั้งค่าใหม่จะมีผลในทุกโมดูลงานทันที
            </div>
          )}

          {/* TAB 1: COMPANY PROFILE */}
          {activeSubTab === 'profile' && (
            <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-sans">ข้อมูลบริษัทและองค์กร (Company Profile)</h3>
                <p className="text-[11px] text-slate-500 mt-1 font-sans">
                  ตั้งค่ารายละเอียดพื้นฐานของบริษัทสำหรับพิมพ์ลงในใบเสร็จ สลิปเงินเดือน เอกสาร และรายงานต่างๆ ในระบบ
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase font-sans">ชื่อบริษัท (ไทย)</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      placeholder="บริษัท นวัตกรรม เทคโนโลยี จำกัด (มหาชน)"
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-sm text-xs font-sans focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase font-sans">เลขประจำตัวผู้เสียภาษีอากร (Tax ID)</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={companyTaxId}
                        onChange={(e) => setCompanyTaxId(e.target.value)}
                        required
                        placeholder="01075xxxxxxxx"
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-sm text-xs font-mono focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase font-sans">เบอร์โทรศัพท์ติดต่อ (Phone)</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        required
                        placeholder="02-xxx-xxxx"
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-sm text-xs font-sans focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase font-sans">อีเมลบริษัท (Company Email)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="email" 
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      required
                      placeholder="info@yourcompany.com"
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-sm text-xs font-sans focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase font-sans">ที่อยู่สำนักงานใหญ่ (Head Office Address)</label>
                  <textarea 
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    required
                    rows={3}
                    placeholder="ที่อยู่เต็มสำหรับใช้ออกเอกสารต่างๆ..."
                    className="w-full px-4 py-2 border border-slate-200 rounded-sm text-xs font-sans focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-sm text-xs font-bold font-sans flex items-center gap-2 cursor-pointer transition shadow-xs"
                >
                  <Save className="w-4 h-4" /> บันทึกโปรไฟล์บริษัท
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: WORKING HOURS & OT */}
          {activeSubTab === 'shift' && (
            <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-sans">ตั้งค่าเวลาทำงาน & ชั่วโมงล่วงเวลา (Work Shifts & Overtime)</h3>
                <p className="text-[11px] text-slate-500 mt-1 font-sans">
                  ตั้งเวลาเข้า-ออกงานปกติสำหรับประเมินการมาสาย ขาดงาน และอัตราตัวคูณค่าตอบแทนล่วงเวลาพิเศษ (OT)
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase font-sans">เวลาเริ่มเข้างานมาตรฐาน (Standard In)</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="time" 
                        value={workingHoursStart}
                        onChange={(e) => setWorkingHoursStart(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-sm text-xs font-mono focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-sans block">เข้าทำงานหลังเวลานี้จะประเมินเป็น "สาย" ในโมดูลการเข้างาน</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase font-sans">เวลาเลิกงานมาตรฐาน (Standard Out)</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="time" 
                        value={workingHoursEnd}
                        onChange={(e) => setWorkingHoursEnd(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-sm text-xs font-mono focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-sans block">เวลาสิ้นสุดกะการทำงานมาตรฐานปกติประจำวัน</span>
                  </div>
                </div>

                <div className="space-y-1 max-w-md">
                  <label className="text-[11px] font-bold text-slate-600 uppercase font-sans">อัตราตัวคูณค่าล่วงเวลาปกติ (OT Multiplier Rate)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      step="0.1"
                      min="1.0"
                      max="3.0"
                      value={otRateMultiplier}
                      onChange={(e) => setOtRateMultiplier(Number(e.target.value))}
                      required
                      placeholder="1.5"
                      className="w-32 px-4 py-2 border border-slate-200 rounded-sm text-xs font-mono focus:outline-none focus:border-blue-500 transition"
                    />
                    <span className="text-xs text-slate-500 font-sans">เท่าของฐานรายได้ต่อชั่วโมงปกติ (มาตรฐาน: 1.5 เท่า)</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-sm text-xs font-bold font-sans flex items-center gap-2 cursor-pointer transition shadow-xs"
                >
                  <Save className="w-4 h-4" /> บันทึกนโยบายเวลาทำงาน
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: TAX & SOCIAL SECURITY */}
          {activeSubTab === 'tax' && (
            <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-sans">อัตราหักภาษี & ประกันสังคม (Payroll & Tax Deductions)</h3>
                <p className="text-[11px] text-slate-500 mt-1 font-sans">
                  ตั้งค่าสัดส่วนการหักเงินสมทบเข้ากองทุนประกันสังคมภาคบังคับ และเกณฑ์หักภาษี ณ ที่จ่ายสำหรับโมดูลบัญชีเงินเดือน
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase font-sans">อัตราเงินสมทบกองทุนประกันสังคม (%)</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        step="0.5"
                        min="0"
                        max="15"
                        value={socialSecurityRate}
                        onChange={(e) => setSocialSecurityRate(Number(e.target.value))}
                        required
                        className="w-32 px-4 py-2 border border-slate-200 rounded-sm text-xs font-mono focus:outline-none focus:border-blue-500 transition"
                      />
                      <span className="text-xs text-slate-500 font-sans">% ของรายได้ (มาตรฐานของรัฐ: 5.0%)</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase font-sans">เพดานเงินประกันสังคมสูงสุด (บาท)</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min="0"
                        max="5000"
                        value={socialSecurityMaxCap}
                        onChange={(e) => setSocialSecurityMaxCap(Number(e.target.value))}
                        required
                        className="w-32 px-4 py-2 border border-slate-200 rounded-sm text-xs font-mono focus:outline-none focus:border-blue-500 transition"
                      />
                      <span className="text-xs text-slate-500 font-sans">บาทต่อคนต่อเดือน (มาตรฐาน: 750 บาท สำหรับฐานเงินเดือน 15,000)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 max-w-md">
                  <label className="text-[11px] font-bold text-slate-600 uppercase font-sans">เกณฑ์หักภาษี ณ ที่จ่ายเริ่มต้น (Withholding Income Tax %)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      step="0.1"
                      min="0"
                      max="35"
                      value={withholdingTaxRate}
                      onChange={(e) => setWithholdingTaxRate(Number(e.target.value))}
                      required
                      className="w-32 px-4 py-2 border border-slate-200 rounded-sm text-xs font-mono focus:outline-none focus:border-blue-500 transition"
                    />
                    <span className="text-xs text-slate-500 font-sans">% ของเงินเดือนพนักงาน (สำหรับคำนวณขั้นพื้นฐานในระบบ)</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-sm text-xs font-bold font-sans flex items-center gap-2 cursor-pointer transition shadow-xs"
                >
                  <Save className="w-4 h-4" /> บันทึกเกณฑ์สลิปเงินเดือน
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: DATABASE BACKUP / IMPORT / FACTORY RESET */}
          {activeSubTab === 'database' && (
            <div className="space-y-6 animate-fade-in">
              {/* SYSTEM INSPECTOR BANNER */}
              <div className="bg-slate-900 border border-slate-800 text-slate-300 rounded-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-400" /> จัดการความมั่นคงของฐานข้อมูลคลาวด์
                  </h3>
                  <p className="text-[11px] text-slate-400 font-sans">
                    ระบบทำงานอยู่บนคลาวด์ Firestore ของบริษัทแบบสดตลอดเวลา (Real-time Cloud Database)
                  </p>
                </div>
              </div>

              {/* LOCAL STORAGE TOGGLE CARD */}
              <div className="bg-white border border-slate-200 rounded-sm p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-slate-500" /> เปิด-ปิดการใช้งาน Local Storage (ในเบราว์เซอร์)
                    </h3>
                    <p className="text-[11px] text-slate-500 font-sans max-w-lg leading-relaxed">
                      <strong>เปิดใช้งาน:</strong> ระบบจะใช้เบราว์เซอร์ Local Storage ร่วมด้วยในการสำรองแคชข้อมูลเพื่อความรวดเร็วสูงสุด<br />
                      <strong>ปิดใช้งาน (แนะนำ):</strong> เพื่อความปลอดภัยขั้นสูงสุด ระบบจะยกเลิกการเขียนหรือดึงข้อมูลจากฮาร์ดดิสก์เบราว์เซอร์ โดยเชื่อมต่อและดึงข้อมูลสดผ่านคลาวด์ Firebase / Hostinger ลงสู่หน่วยความจำหลักชั่วคราวเท่านั้น
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border ${
                      isLSOn 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {isLSOn ? 'เปิดใช้งาน (ON)' : 'ปิดใช้งาน (OFF)'}
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleLocalStorage}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isLSOn ? 'bg-indigo-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          isLSOn ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {lsToggleMessage && (
                  <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 text-[11px] p-3 rounded-sm flex items-center gap-1.5 animate-fade-in font-sans">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                    <strong>{lsToggleMessage}</strong>
                  </div>
                )}
              </div>

              {/* Reset Box Header */}
              <div className="border border-rose-150 rounded-sm p-4 space-y-4 bg-rose-50/20">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-rose-50 text-rose-600 rounded-xs">
                    <RotateCcw className="w-4 h-4" />
                  </span>
                  <h4 className="text-xs font-bold text-rose-800 font-sans">ล้างและตั้งค่าระบบใหม่ (Reset & Wipe Database)</h4>
                </div>
                <p className="text-[11px] text-slate-500 font-sans">
                  ลบข้อมูลที่เคยทำรายการไว้ทั้งหมดเพื่อตั้งต้นใหม่แบบว่างเปล่าสำหรับการใช้งานด้วยข้อมูลจริง
                </p>
                    <div className="space-y-3">
                      {/* Empty Database */}
                      {clearEmptyConfirm ? (
                        <div className="space-y-2 pt-1 animate-fade-in border border-rose-300 bg-white p-3 rounded">
                          <div className="bg-rose-50 border border-rose-100 text-rose-800 text-[10px] p-2 rounded-sm flex items-start gap-1.5 font-sans">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <strong>ล้างระบบว่างเปล่า 100%:</strong> ลบพนักงาน ประวัติ และบัญชีทั้งหมดจากคลาวด์และบราวเซอร์ถาวร
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleClearEmptyData}
                              disabled={clearing}
                              className="flex-1 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-[10px] font-bold rounded-sm cursor-pointer transition"
                            >
                              {clearing ? 'กำลังล้าง...' : 'ใช่, ยืนยันลบทั้งหมดเป็นค่าว่าง'}
                            </button>
                            <button
                              onClick={() => setClearEmptyConfirm(false)}
                              className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded-sm cursor-pointer transition"
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
                          className="w-full py-1.5 bg-rose-600 hover:bg-rose-750 text-white text-[11px] font-bold rounded-sm flex items-center justify-center gap-1.5 cursor-pointer transition"
                        >
                          <Trash2 className="w-3 h-3" /> รีเซ็ตฐานข้อมูลเป็นข้อมูลว่าง (Empty Database)
                        </button>
                      )}
                    </div>
                  </div>

              {/* EXPORT DATABASE FORM */}
              <div className="bg-white border border-slate-200 rounded-sm p-6 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-slate-500" /> สำรองข้อมูลระบบปัจจุบัน (Export Database Backup)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 font-sans">
                    ดาวน์โหลดโครงสร้างไฟล์ JSON ข้อมูลพนักงาน ประวัติการลา บันทึกเวลา และการเงินเพื่อใช้สำรองข้อมูลไว้นอกระบบ
                  </p>
                </div>

                <div className="flex justify-start">
                  <button
                    onClick={handleExport}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-sm text-xs font-bold font-sans flex items-center gap-2 cursor-pointer transition shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" /> สำรองข้อมูลลงเครื่อง (Export JSON)
                  </button>
                </div>
              </div>

              {/* DOWNLOAD .ENV FOR HOSTINGER */}
              <div className="bg-white border border-slate-200 rounded-sm p-6 space-y-4 border-indigo-100 bg-indigo-50/5">
                <div>
                  <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider font-sans flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-500" /> ดาวน์โหลดไฟล์คอนฟิก .env สำหรับ Hostinger
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 font-sans">
                    ดาวน์โหลดไฟล์ <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600 font-mono text-[10px] font-bold">.env</code> ที่ถูกกรอกรหัสและข้อมูลพิกัด (Firebase Credential & MySQL config) ล่าสุดของคุณไว้แล้วโดยอัตโนมัติ เพื่อใช้วางและติดตั้งบน Hostinger คอนโทรลพาเนลได้ทันที
                  </p>
                </div>

                <div className="flex justify-start">
                  <a
                    href="/api/download-env"
                    download=".env"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-bold font-sans flex items-center gap-2 cursor-pointer transition shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" /> ดาวน์โหลดไฟล์ .env (Download .env)
                  </a>
                </div>
              </div>

              {/* IMPORT DATABASE FORM */}
              <div className="bg-white border border-slate-200 rounded-sm p-6 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-slate-500" /> นำเข้าฐานข้อมูลเดิมเพื่อกู้คืน (Import Database Restore)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 font-sans">
                    วางโค้ดข้อความ JSON ที่ได้จากการสำรองข้อมูล (Export) ด้านบนลงในกล่องเพื่อติดตั้งฐานข้อมูลเดิมทดแทนทันที ระบบจะทำการรีโหลดเพจอัตโนมัติ
                  </p>
                </div>

                <form onSubmit={handleImport} className="space-y-3">
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    rows={6}
                    placeholder='วางข้อความ JSON ที่นี่ (ตัวอย่างเช่น: {"hr_employees": [...], "hr_payroll": [...]})'
                    className="w-full p-3 border border-slate-200 rounded-sm font-mono text-[11px] focus:outline-none focus:border-blue-500 transition"
                  />

                  {importError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-sm flex items-center gap-2 font-sans">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      {importError}
                    </div>
                  )}

                  {importSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-sm flex items-center gap-2 font-sans">
                      <Check className="w-4 h-4 text-emerald-600" />
                      กู้คืนข้อมูลสำเร็จ! กำลังรีโหลดระบบความจำหลัก...
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-sm text-xs font-bold font-sans flex items-center gap-2 cursor-pointer transition shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" /> ตรวจสอบความถูกต้องและกู้คืน
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeSubTab === 'audit_logs' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white border border-slate-200 rounded-sm p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-sans flex items-center gap-1.5">
                      <History className="w-4 h-4 text-slate-500" /> บันทึกประวัติกิจกรรมระบบ (System Audit Logs)
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 font-sans">
                      แสดงรายการบันทึกประวัติการแก้ไข ลบ หรือสร้างข้อมูลสำคัญภายในระบบอย่างละเอียดเพื่อความโปร่งใสและตรวจสอบได้
                    </p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {clearConfirm ? (
                      <div className="flex items-center gap-2 bg-rose-50 border border-rose-150 p-1.5 rounded-sm animate-fade-in">
                        <span className="text-[10px] text-rose-800 font-bold font-sans">ยืนยันการล้างประวัติ?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onClearAuditLogs();
                            setClearConfirm(false);
                          }}
                          className="px-2 py-1 bg-rose-600 text-white rounded-xs text-[10px] font-bold hover:bg-rose-700 cursor-pointer transition"
                        >
                          ล้างเลย
                        </button>
                        <button
                          type="button"
                          onClick={() => setClearConfirm(false)}
                          className="px-2 py-1 bg-slate-200 text-slate-700 rounded-xs text-[10px] font-bold hover:bg-slate-300 cursor-pointer transition"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    ) : (
                      auditLogs.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setClearConfirm(true)}
                          className="px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] font-bold rounded-sm flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> ล้างประวัติทั้งหมด
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Filters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 border border-slate-150 rounded-sm">
                  {/* Search Input */}
                  <div className="md:col-span-2 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">ค้นหาบันทึก</span>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ค้นหารายละเอียด, โมดูล, หรือผู้ทำรายการ..."
                        className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-sm text-xs font-sans focus:outline-none focus:border-blue-500 transition bg-white"
                      />
                    </div>
                  </div>

                  {/* Filter Action */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">การดำเนินการ (Action)</span>
                    <select
                      value={filterAction}
                      onChange={(e) => setFilterAction(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs font-sans bg-white focus:outline-none focus:border-blue-500 transition"
                    >
                      <option value="ALL">ทั้งหมด (All Actions)</option>
                      <option value="CREATE">CREATE (สร้าง)</option>
                      <option value="UPDATE">UPDATE (แก้ไข)</option>
                      <option value="DELETE">DELETE (ลบ)</option>
                      <option value="SYSTEM">SYSTEM (ระบบ)</option>
                    </select>
                  </div>

                  {/* Filter Module */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">โมดูล (Module)</span>
                    <select
                      value={filterModule}
                      onChange={(e) => setFilterModule(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs font-sans bg-white focus:outline-none focus:border-blue-500 transition"
                    >
                      <option value="ALL">ทั้งหมด (All Modules)</option>
                      {uniqueModules.map(mod => (
                        <option key={mod} value={mod}>{mod}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* List Summary */}
                <div className="flex justify-between items-center text-[11px] text-slate-500 font-sans px-1">
                  <span>พบทั้งหมด <strong>{filteredLogs.length}</strong> รายการ จากบันทึกทั้งหมด {auditLogs.length} รายการ</span>
                  {(searchQuery || filterAction !== 'ALL' || filterModule !== 'ALL') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setFilterAction('ALL');
                        setFilterModule('ALL');
                      }}
                      className="text-blue-600 hover:underline font-bold cursor-pointer"
                    >
                      ล้างตัวกรองทั้งหมด
                    </button>
                  )}
                </div>

                {/* Audit Logs Table */}
                <div className="border border-slate-200 rounded-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white text-[10px] uppercase font-bold tracking-wider font-mono">
                          <th className="py-3 px-4 w-40">วันเวลา (Timestamp)</th>
                          <th className="py-3 px-4 w-28">การดำเนินการ</th>
                          <th className="py-3 px-4 w-36">โมดูล</th>
                          <th className="py-3 px-4">รายละเอียดประวัติ</th>
                          <th className="py-3 px-4 w-48">ผู้ดำเนินการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {paginatedLogs.length > 0 ? (
                          paginatedLogs.map((log) => {
                            // Determine Action Badge colors
                            let actionColor = 'bg-slate-100 text-slate-700 border-slate-200';
                            let actionLabel: string = log.action;
                            if (log.action === 'CREATE') {
                              actionColor = 'bg-emerald-50 text-emerald-700 border-emerald-150';
                              actionLabel = '＋ CREATE';
                            } else if (log.action === 'UPDATE') {
                              actionColor = 'bg-amber-50 text-amber-700 border-amber-150';
                              actionLabel = '✎ UPDATE';
                            } else if (log.action === 'DELETE') {
                              actionColor = 'bg-rose-50 text-rose-700 border-rose-150';
                              actionLabel = '✗ DELETE';
                            } else if (log.action === 'SYSTEM') {
                              actionColor = 'bg-blue-50 text-blue-700 border-blue-150';
                              actionLabel = '⚙ SYSTEM';
                            }

                            // Format timestamp nicely
                            let dateDisplay = log.timestamp;
                            try {
                              const d = new Date(log.timestamp);
                              dateDisplay = d.toLocaleString('th-TH', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: false
                              });
                            } catch (e) {
                              // fallback
                            }

                            return (
                              <tr key={log.id} className="hover:bg-slate-50 transition-colors text-xs">
                                <td className="py-3 px-4 text-slate-500 font-mono">
                                  {dateDisplay}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-0.5 rounded-sm border text-[10px] font-black ${actionColor}`}>
                                    {actionLabel}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700 font-sans font-bold border border-slate-200">
                                    {log.module}
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-sans text-slate-900 font-medium">
                                  {log.description}
                                </td>
                                <td className="py-3 px-4 text-slate-500 font-sans">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0 uppercase">
                                      {log.user.charAt(0)}
                                    </div>
                                    <span className="truncate max-w-[160px]" title={log.user}>
                                      {log.user}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-slate-400 font-sans">
                              <History className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-500" />
                              <p className="text-xs font-bold text-slate-400">ไม่พบข้อมูลประวัติกิจกรรมที่ค้นหา</p>
                              <p className="text-[11px] text-slate-400/80 mt-1">ลองเปลี่ยนคำค้นหาหรือปรับการกรองประเภทข้อมูล</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalLogPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50">
                      <div className="flex flex-1 justify-between sm:hidden">
                        <button
                          type="button"
                          disabled={currentLogPage === 1}
                          onClick={() => {
                            setCurrentLogPage(prev => Math.max(prev - 1, 1));
                          }}
                          className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-xs font-medium rounded-sm text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          ก่อนหน้า
                        </button>
                        <button
                          type="button"
                          disabled={currentLogPage === totalLogPages}
                          onClick={() => {
                            setCurrentLogPage(prev => Math.min(prev + 1, totalLogPages));
                          }}
                          className="relative ml-3 inline-flex items-center px-4 py-2 border border-slate-300 text-xs font-medium rounded-sm text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          ถัดไป
                        </button>
                      </div>
                      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs text-slate-500 font-sans">
                            แสดงประวัติกิจกรรมที่ <span className="font-bold text-slate-900">{logStartIndex + 1}</span> ถึง{' '}
                            <span className="font-bold text-slate-900">{Math.min(logStartIndex + logsPerPage, totalLogsCount)}</span> จากทั้งหมด{' '}
                            <span className="font-bold text-slate-900">{totalLogsCount}</span> รายการที่กรองได้
                          </p>
                        </div>
                        <div>
                          <nav className="isolate inline-flex -space-x-px rounded-sm shadow-xs" aria-label="Pagination">
                            <button
                              type="button"
                              disabled={currentLogPage === 1}
                              onClick={() => {
                                setCurrentLogPage(prev => Math.max(prev - 1, 1));
                              }}
                              className="relative inline-flex items-center rounded-l-sm px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                            >
                              <span className="sr-only">Previous</span>
                              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                            </button>
                            
                            {Array.from({ length: totalLogPages }, (_, i) => i + 1).map((page) => (
                              <button
                                type="button"
                                key={page}
                                onClick={() => {
                                  setCurrentLogPage(page);
                                }}
                                aria-current={currentLogPage === page ? 'page' : undefined}
                                className={`relative inline-flex items-center px-3 py-1.5 text-xs font-semibold focus:z-20 cursor-pointer transition ${
                                  currentLogPage === page
                                    ? 'z-10 bg-slate-900 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900'
                                    : 'text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:outline-offset-0'
                                }`}
                              >
                                {page}
                              </button>
                            ))}

                            <button
                              type="button"
                              disabled={currentLogPage === totalLogPages}
                              onClick={() => {
                                setCurrentLogPage(prev => Math.min(prev + 1, totalLogPages));
                              }}
                              className="relative inline-flex items-center rounded-r-sm px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                            >
                              <span className="sr-only">Next</span>
                              <ChevronRight className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ADMINISTRATORS MANAGEMENT */}
          {activeSubTab === 'admins' && (
            <div className="space-y-6 animate-fade-in font-sans">
              <div className="bg-white border border-slate-200 rounded-sm p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4.5 h-4.5 text-amber-500" /> จัดการบัญชีผู้ดูแลระบบ & กำหนดสิทธิ์การใช้งาน (Admin RBAC Gate)
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1">
                      สร้างผู้ดูแลระบบเพิ่ม กำหนดสิทธิ์แยกส่วนรายโมดูลงาน และตั้งค่ารหัสผ่านอย่างปลอดภัยโดยไม่เปิดเผยในหน้าจอหลัก
                    </p>
                  </div>
                  
                  {!showAddForm && !editingAdminId && (
                    <button
                      type="button"
                      onClick={() => setShowAddForm(true)}
                      className="px-3.5 py-1.8 bg-slate-900 hover:bg-slate-800 text-white rounded-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> ＋ เพิ่มผู้ดูแลระบบใหม่
                    </button>
                  )}
                </div>

                {/* ADD NEW ADMIN FORM */}
                {showAddForm && (
                  <div className="bg-slate-50 border border-slate-200 rounded-sm p-5 space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <UserPlus className="w-4 h-4 text-slate-500" /> กรอกข้อมูลบัญชีผู้ดูแลระบบท่านใหม่
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                      >
                        ยกเลิก
                      </button>
                    </div>

                    <form onSubmit={handleAddAdmin} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">ชื่อเข้าระบบ (Username / ID)</label>
                          <input
                            type="text"
                            required
                            value={newAdminId}
                            onChange={(e) => setNewAdminId(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                            placeholder="ภาษาอังกฤษเท่านั้น e.g. watjan"
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs focus:outline-none focus:border-blue-500 bg-white"
                          />
                        </div>
                        <div className="space-y-1 col-span-1 md:col-span-1">
                          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">ชื่อ-นามสกุล จริง</label>
                          <input
                            type="text"
                            required
                            value={newAdminName}
                            onChange={(e) => setNewAdminName(e.target.value)}
                            placeholder="e.g. คุณ วรรณจันทร์"
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs focus:outline-none focus:border-blue-500 bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">ตำแหน่ง / บทบาทหน้าที่</label>
                          <input
                            type="text"
                            required
                            value={newAdminRole}
                            onChange={(e) => setNewAdminRole(e.target.value)}
                            placeholder="e.g. ฝ่ายบัญชีระดับสูง"
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs focus:outline-none focus:border-blue-500 bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">กำหนดรหัสผ่าน (Password)</label>
                          <input
                            type="password"
                            required
                            value={newAdminPassword}
                            onChange={(e) => setNewAdminPassword(e.target.value)}
                            placeholder="รหัสผ่านเข้าใช้งานจริง"
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs focus:outline-none focus:border-blue-500 bg-white"
                          />
                        </div>
                      </div>

                      {/* Permissions Assignment */}
                      <div className="bg-white border border-slate-200 rounded-sm p-4 space-y-3">
                        <span className="text-[10.5px] font-bold text-slate-700 uppercase tracking-wider block border-b border-slate-100 pb-1.5">
                          🛡️ กำหนดขอบเขตสิทธิ์การใช้งานรายโมดูล (Granular Permission Settings)
                        </span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {Object.keys(newAdminPermissions).map((permKey) => {
                            const key = permKey as keyof AdminPermissions;
                            let label: string = key;
                            let desc = '';
                            
                            if (key === 'employees') { label = 'รายชื่อพนักงาน'; desc = 'จัดการแฟ้มข้อมูลและประวัติพนักงาน'; }
                            else if (key === 'attendance') { label = 'ลงเวลา & สลับวันหยุด'; desc = 'ตรวจสอบตารางกะ บันทึกเวลาสแกนนิ้ว'; }
                            else if (key === 'leaves') { label = 'ระบบการลางาน'; desc = 'อนุมัติใบลาและประมวลสถิติการลา'; }
                            else if (key === 'payroll') { label = 'จ่ายเงินเดือน & ภาษี'; desc = 'พิมพ์ใบสลิป คำนวณเงินเดือน ประกันสังคม'; }
                            else if (key === 'sales') { label = 'ยอดขายรายวันเดือนปี'; desc = 'วิเคราะห์เป้ายอดขายและรายงานสถิติ'; }
                            else if (key === 'cashflow') { label = 'ตรวจเช็คขารับ-ขาจ่าย'; desc = 'บันทึกรายรับ รายจ่าย และกระแสเงินสด'; }
                            else if (key === 'cheques') { label = 'เช็คจ่าย & เช็ครับ'; desc = 'ระบบควบคุมสถานะตั๋วเงินและเช็คคู่ค้า'; }
                            else if (key === 'partner_billing') { label = 'คู่ค้าใบส่งของ & วางบิล'; desc = 'บันทึกใบแจ้งหนี้ วางบิลเจ้าหนี้'; }
                            else if (key === 'recruitment') { label = 'สรรหาบุคลากร'; desc = 'รับสมัคร คัดกรอง สัมภาษณ์พนักงานใหม่'; }
                            else if (key === 'performance') { label = 'ประเมินผลงาน'; desc = 'ประเมินเกรดและผลการประเมินประจำปี'; }
                            else if (key === 'settings') { label = 'ตั้งค่าระบบ'; desc = 'จัดการข้อมูลองค์กร อัตราสวัสดิการ สิทธิ์ RBAC'; }
                            else if (key === 'backup_restore') { label = 'สำรองและกู้คืนข้อมูล'; desc = 'ดาวน์โหลดสำรองและอัปโหลดข้อมูล JSON'; }
                            else if (key === 'database_inspector') { label = 'ตรวจสอบตารางฐานข้อมูล'; desc = 'ตรวจสอบตารางฐานข้อมูลระดับระบบ'; }

                            return (
                              <label key={key} className="flex items-start gap-2.5 p-2 bg-slate-50/60 border border-slate-150 hover:border-slate-300 rounded-sm cursor-pointer transition select-none">
                                <input
                                  type="checkbox"
                                  checked={newAdminPermissions[key]}
                                  onChange={(e) => setNewAdminPermissions(prev => ({ ...prev, [key]: e.target.checked }))}
                                  className="mt-0.5 rounded-sm text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 border-slate-300"
                                />
                                <div>
                                  <span className="text-[11.5px] font-bold text-slate-800 block">{label}</span>
                                  <span className="text-[9.5px] text-slate-500 leading-none">{desc}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddForm(false)}
                          className="px-4 py-2 border border-slate-200 rounded-sm text-xs text-slate-700 bg-white hover:bg-slate-50 cursor-pointer font-sans"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-sm text-xs font-bold cursor-pointer font-sans shadow-xs"
                        >
                          บันทึกผู้ดูแลระบบใหม่
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* EDIT ADMIN FORM */}
                {editingAdminId && editAdminPermissions && (
                  <div className="bg-amber-50/30 border border-amber-200 rounded-sm p-5 space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center border-b border-amber-200 pb-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Settings className="w-4 h-4 text-amber-600" /> แก้ไขการตั้งค่าและสิทธิ์ของบัญชี "{editingAdminId}"
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAdminId(null);
                          setEditAdminPermissions(null);
                        }}
                        className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                      >
                        ยกเลิก
                      </button>
                    </div>

                    <form onSubmit={handleUpdateAdmin} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">ชื่อ-นามสกุล จริง</label>
                          <input
                            type="text"
                            required
                            value={editAdminName}
                            onChange={(e) => setEditAdminName(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs focus:outline-none focus:border-blue-500 bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">ตำแหน่ง / บทบาทหน้าที่</label>
                          <input
                            type="text"
                            required
                            value={editAdminRole}
                            onChange={(e) => setEditAdminRole(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs focus:outline-none focus:border-blue-500 bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">แก้ไขรหัสผ่านใหม่ (Password)</label>
                          <input
                            type="text"
                            required
                            value={editAdminPassword}
                            onChange={(e) => setEditAdminPassword(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs focus:outline-none focus:border-blue-500 bg-white font-mono"
                          />
                        </div>
                      </div>

                      {/* Permissions Assignment */}
                      <div className="bg-white border border-slate-200 rounded-sm p-4 space-y-3">
                        <span className="text-[10.5px] font-bold text-slate-700 uppercase tracking-wider block border-b border-slate-100 pb-1.5">
                          🛡️ อัปเดตขอบเขตสิทธิ์การใช้งานรายโมดูล (Update Granular Permissions)
                        </span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {Object.keys(editAdminPermissions).map((permKey) => {
                            const key = permKey as keyof AdminPermissions;
                            let label: string = key;
                            let desc = '';
                            
                            if (key === 'employees') { label = 'รายชื่อพนักงาน'; desc = 'จัดการแฟ้มข้อมูลและประวัติพนักงาน'; }
                            else if (key === 'attendance') { label = 'ลงเวลา & สลับวันหยุด'; desc = 'ตรวจสอบตารางกะ บันทึกเวลาสแกนนิ้ว'; }
                            else if (key === 'leaves') { label = 'ระบบการลางาน'; desc = 'อนุมัติใบลาและประมวลสถิติการลา'; }
                            else if (key === 'payroll') { label = 'จ่ายเงินเดือน & ภาษี'; desc = 'พิมพ์ใบสลิป คำนวณเงินเดือน ประกันสังคม'; }
                            else if (key === 'sales') { label = 'ยอดขายรายวันเดือนปี'; desc = 'วิเคราะห์เป้ายอดขายและรายงานสถิติ'; }
                            else if (key === 'cashflow') { label = 'ตรวจเช็คขารับ-ขาจ่าย'; desc = 'บันทึกรายรับ รายจ่าย และกระแสเงินสด'; }
                            else if (key === 'cheques') { label = 'เช็คจ่าย & เช็ครับ'; desc = 'ระบบควบคุมสถานะตั๋วเงินและเช็คคู่ค้า'; }
                            else if (key === 'partner_billing') { label = 'คู่ค้าใบส่งของ & วางบิล'; desc = 'บันทึกใบแจ้งหนี้ วางบิลเจ้าหนี้'; }
                            else if (key === 'recruitment') { label = 'สรรหาบุคลากร'; desc = 'รับสมัคร คัดกรอง สัมภาษณ์พนักงานใหม่'; }
                            else if (key === 'performance') { label = 'ประเมินผลงาน'; desc = 'ประเมินเกรดและผลการประเมินประจำปี'; }
                            else if (key === 'settings') { label = 'ตั้งค่าระบบ'; desc = 'จัดการข้อมูลองค์กร อัตราสวัสดิการ สิทธิ์ RBAC'; }
                            else if (key === 'backup_restore') { label = 'สำรองและกู้คืนข้อมูล'; desc = 'ดาวน์โหลดสำรองและอัปโหลดข้อมูล JSON'; }
                            else if (key === 'database_inspector') { label = 'ตรวจสอบตารางฐานข้อมูล'; desc = 'ตรวจสอบตารางฐานข้อมูลระดับระบบ'; }

                            // Prevent current active admin from disabling settings permission on themselves
                            const isSelf = editingAdminId.toLowerCase() === currentAdminId.toLowerCase();
                            const isSettingsField = key === 'settings';

                            return (
                              <label 
                                key={key} 
                                className={`flex items-start gap-2.5 p-2 border rounded-sm cursor-pointer transition select-none ${
                                  isSelf && isSettingsField 
                                    ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                                    : 'bg-slate-50/60 border-slate-150 hover:border-slate-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  disabled={isSelf && isSettingsField}
                                  checked={editAdminPermissions[key]}
                                  onChange={(e) => setEditAdminPermissions(prev => prev ? ({ ...prev, [key]: e.target.checked }) : null)}
                                  className="mt-0.5 rounded-sm text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 border-slate-300 disabled:opacity-50"
                                />
                                <div>
                                  <span className="text-[11.5px] font-bold text-slate-800 block">
                                    {label} {isSelf && isSettingsField && <strong className="text-amber-600 text-[9px]">(คุณลักษณะบังคับ)</strong>}
                                  </span>
                                  <span className="text-[9.5px] text-slate-500 leading-none">{desc}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAdminId(null);
                            setEditAdminPermissions(null);
                          }}
                          className="px-4 py-2 border border-slate-200 rounded-sm text-xs text-slate-700 bg-white hover:bg-slate-50 cursor-pointer font-sans"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-sm text-xs font-bold cursor-pointer font-sans shadow-xs"
                        >
                          บันทึกการเปลี่ยนแปลงสิทธิ์
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* ADMINISTRATORS LIST TABLE */}
                <div className="border border-slate-200 rounded-sm overflow-hidden bg-white">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Users className="w-4 h-4 text-slate-400" /> บัญชีผู้ดูแลระบบที่เปิดใช้งานในฐานข้อมูล ({adminsList.length} ท่าน)
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10.5px] font-bold text-slate-600 uppercase tracking-wider">
                          <th className="py-3 px-4 w-48">รายละเอียดผู้ดูแลระบบ</th>
                          <th className="py-3 px-4 w-40">รหัสผ่านเข้ารหัสปลอดภัย</th>
                          <th className="py-3 px-4">ขอบเขตสิทธิ์โมดูล (Allowed Modules)</th>
                          <th className="py-3 px-4 w-36 text-right">การจัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {adminsList.map((admin) => {
                          const isSelf = admin.id.toLowerCase() === currentAdminId.toLowerCase();
                          const isVisible = visiblePasswords[admin.id] || false;
                          
                          // Count active modules
                          const activeCount = Object.values(admin.permissions).filter(Boolean).length;
                          const totalCount = Object.keys(admin.permissions).length;

                          return (
                            <tr key={admin.id} className={`hover:bg-slate-50/50 transition-colors text-xs ${isSelf ? 'bg-amber-50/10' : ''}`}>
                              <td className="py-4 px-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-extrabold text-slate-900 text-xs">{admin.name}</span>
                                    {isSelf && (
                                      <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-700 text-[8.5px] font-extrabold border border-amber-500/20 rounded-xs">
                                        บัญชีของคุณ
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 text-[10.5px] text-slate-500 font-mono">
                                    <span>Username:</span>
                                    <strong className="text-slate-700 font-bold">{admin.id}</strong>
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    บทบาท: <span className="font-medium text-slate-600">{admin.role}</span>
                                  </div>
                                </div>
                              </td>
                              
                              <td className="py-4 px-4 font-mono">
                                <div className="flex items-center gap-1.5">
                                  {isVisible ? (
                                    <span className="font-bold text-slate-800 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-sm">
                                      {admin.password}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 select-none tracking-widest text-[11px]">
                                      ••••••••
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility(admin.id)}
                                    title={isVisible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                                    className="p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                                  >
                                    {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </td>

                              <td className="py-4 px-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-500">
                                      ได้รับสิทธิ์เข้าถึงโมดูล ({activeCount}/{totalCount}):
                                    </span>
                                    <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                      <div 
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-300" 
                                        style={{ width: `${(activeCount / totalCount) * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-1">
                                    {Object.entries(admin.permissions).map(([key, val]) => {
                                      if (!val) return null;
                                      
                                      let name = key;
                                      if (key === 'employees') name = 'พนักงาน';
                                      else if (key === 'attendance') name = 'ลงเวลาทำงาน';
                                      else if (key === 'leaves') name = 'ระบบลา';
                                      else if (key === 'payroll') name = 'เงินเดือน';
                                      else if (key === 'sales') name = 'ยอดขาย';
                                      else if (key === 'cashflow') name = 'ธุรกรรมรับ-จ่าย';
                                      else if (key === 'cheques') name = 'เช็คคู่ค้า';
                                      else if (key === 'partner_billing') name = 'วางบิลคู่ค้า';
                                      else if (key === 'recruitment') name = 'สรรหาคน';
                                      else if (key === 'performance') name = 'ประเมินงาน';
                                      else if (key === 'settings') name = 'ตั้งค่าระบบ';
                                      else if (key === 'backup_restore') name = 'จัดการข้อมูลสำรอง';
                                      else if (key === 'database_inspector') name = 'ตรวจสอบฐานข้อมูล';

                                      return (
                                        <span 
                                          key={key} 
                                          className={`px-1.5 py-0.5 rounded-xs text-[9px] font-bold font-sans border ${
                                            key === 'settings' || key === 'backup_restore' || key === 'database_inspector'
                                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                                              : 'bg-slate-100 text-slate-700 border-slate-200'
                                          }`}
                                        >
                                          ✓ {name}
                                        </span>
                                      );
                                    })}
                                    {activeCount === 0 && (
                                      <span className="text-[10px] text-rose-500 font-bold">
                                        ❌ ไม่มีสิทธิ์ใช้งานโมดูลใดๆ เลย (บล็อกถาวร)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditAdmin(admin)}
                                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-sm transition cursor-pointer"
                                    title="แก้ไขข้อมูลสิทธิ์"
                                  >
                                    <Settings className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAdmin(admin.id)}
                                    disabled={isSelf}
                                    className={`p-1.5 rounded-sm transition ${
                                      isSelf 
                                        ? 'text-slate-300 cursor-not-allowed' 
                                        : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100 cursor-pointer'
                                    }`}
                                    title={isSelf ? "ไม่สามารถลบบัญชีตัวเองได้" : "ลบแอดมินคนนี้"}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: LINE NOTIFY SETTINGS REMOVED */}
          {false && (
            <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-sm overflow-hidden animate-fade-in">
              <div className="p-6 border-b border-slate-100 bg-emerald-50/20">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-sm">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-sans">ตั้งค่าส่งยอดขายผ่าน LINE Notify อัตโนมัติ (Automated LINE Reporting)</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-sans">
                      ส่งรายงานยอดขายรายวันและประวัติธุรกรรมยอดขายเข้ากลุ่มไลน์หรือบัญชีส่วนตัวทันทีที่บันทึกยอดขายใหม่
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-sm">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide font-sans">เปิดการแจ้งเตือนยอดขายอัตโนมัติ (Enable Auto Notifications)</h4>
                    <p className="text-[10.5px] text-slate-500 font-sans leading-relaxed">
                      หากเปิดใช้งาน ระบบจะยิงข้อมูลรายงานสรุปยอดขายเข้าห้องแชท LINE ที่ติดตั้ง Token ไว้โดยอัตโนมัติทุกครั้งที่มีรายการขายใหม่
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border ${
                      lineNotifyEnabled 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {lineNotifyEnabled ? 'เปิดทำงาน (ACTIVE)' : 'ปิดทำงาน (INACTIVE)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setLineNotifyEnabled(!lineNotifyEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        lineNotifyEnabled ? 'bg-emerald-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          lineNotifyEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Token Input */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-600 uppercase font-sans flex items-center gap-1">
                    <span>LINE Notify API Token (รหัสโทเค็นกลุ่มไลน์)</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="password" 
                      placeholder="กรอกรหัสโทเค็น LINE Notify (เช่น rX8K9N7...)"
                      value={lineNotifyToken}
                      onChange={(e) => setLineNotifyToken(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-sm text-xs font-mono focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                  <div className="text-[10.5px] text-slate-500 leading-relaxed space-y-1 font-sans">
                    <p>💡 <strong>วิธีการเชื่อมต่อ LINE Notify:</strong></p>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>เข้าเว็บไซต์ <a href="https://notify-bot.line.me/" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold hover:underline">LINE Notify Bot</a> แล้วลงชื่อเข้าใช้ด้วยบัญชี LINE ของคุณ</li>
                      <li>ไปที่หน้า "หน้าของฉัน" (My Page) แล้วคลิก "ออกโทเค็น" (Generate token)</li>
                      <li>เลือกห้องแชทหรือกลุ่มไลน์ที่ต้องการให้ส่งยอดขาย (เช่น กลุ่ม "สรุปยอดขายร้านค้า")</li>
                      <li>คัดลอก Token ที่ได้รับมาวางในกล่องข้อความด้านบน แล้วกดบันทึก</li>
                      <li><strong>สำคัญ:</strong> อย่าลืมดึง LINE Notify บอทเข้ากลุ่มแชทที่เลือกไว้ด้วย ไม่เช่นนั้นบอทจะไม่สามารถส่งข้อความได้</li>
                    </ol>
                  </div>
                </div>

                {/* Test Send Button & Result */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-800 font-sans">ทดสอบการส่งข้อความแจ้งเตือน</h4>
                      <p className="text-[10.5px] text-slate-500 font-sans">
                        คลิกปุ่มด้านขวาเพื่อส่งข้อความตัวอย่างสรุปยอดขายไปยังกลุ่มไลน์เพื่อทดสอบ Token
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleTestLineNotify}
                      disabled={testSending || !lineNotifyToken}
                      className="px-4 py-2 border border-slate-200 hover:border-emerald-400 text-slate-700 hover:text-emerald-700 font-bold rounded-sm text-xs transition cursor-pointer flex items-center gap-1.5 bg-slate-50 hover:bg-emerald-50 disabled:opacity-50"
                    >
                      {testSending ? (
                        <>
                          <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>กำลังทดสอบส่ง...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>ทดสอบส่งข้อความ (Test Notify)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {testResult && (
                    <div className={`mt-3 p-3 rounded-sm border text-xs font-sans flex items-start gap-1.5 ${
                      testResult.success 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                      <div className="shrink-0 mt-0.5">
                        {testResult.success ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                      </div>
                      <div className="flex-1">
                        <strong className="block">{testResult.success ? 'ส่งข้อความสำเร็จ!' : 'ไม่สามารถส่งข้อความได้!'}</strong>
                        <span className="text-[11px] leading-tight block mt-0.5">{testResult.message}</span>
                      </div>
                    </div>
                  )}

                  {testResult && testResult.isSandbox && (
                    <div className="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-sm text-xs font-sans">
                      <div className="flex gap-2.5 items-start">
                        <span className="p-1 bg-emerald-100 text-emerald-800 rounded-full shrink-0 text-sm">📱</span>
                        <div className="space-y-1.5 flex-1">
                          <p className="font-bold text-emerald-900 uppercase tracking-wide">💡 ตรวจพบข้อจำกัดของระบบทดลอง (Sandbox Egress Blocked)</p>
                          <p className="text-[11px] text-slate-700 leading-relaxed">
                            เนื่องจากสภาพแวดล้อม Sandbox ของ Google AI Studio จำกัดการเชื่อมต่ออินเทอร์เน็ตภายนอก จึงไม่สามารถเรียกเซิร์ฟเวอร์ LINE Notify จริงได้โดยตรงในขณะนี้ 
                            <strong className="text-emerald-800 ml-1">แต่ระบบทำงานได้ตามปกติและพร้อมใช้งานทันทีเมื่อท่านดาวน์โหลดโค้ดไปรันในเครื่องของตนเองหรือทำการ deploy</strong>
                          </p>
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => setShowMockLinePreview(!showMockLinePreview)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] rounded-sm transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>{showMockLinePreview ? '🙈 ซ่อนตัวอย่างการแจ้งเตือน' : '👁️ เปิดดูหน้าต่างจำลองข้อความที่ส่งเข้า LINE'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {showMockLinePreview && (
                    <div className="mt-4 border border-slate-200 rounded-md overflow-hidden bg-[#7591c2] shadow-md max-w-md mx-auto font-sans animate-fade-in">
                      {/* Phone/Chat Header */}
                      <div className="bg-[#21324c] px-4 py-3 flex items-center justify-between text-white border-b border-slate-700/50">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                          <span className="text-[11px] font-bold text-slate-300 font-mono ml-2">LINE CHAT SIMULATOR</span>
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Sandbox Preview</span>
                      </div>

                      <div className="bg-[#243447] px-4 py-2.5 flex items-center gap-3 text-white">
                        {/* LINE Notify Avatar */}
                        <div className="w-9 h-9 rounded-full bg-[#1bc656] flex items-center justify-center text-white text-[11px] font-black shrink-0 shadow-sm border border-emerald-400">
                          LINE
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold truncate">LINE Notify (รายงานยอดขายร้านค้า)</h4>
                          <p className="text-[9px] text-[#2ebe5d] font-bold">● บอทแชทพร้อมเชื่อมต่อ (Token Verified)</p>
                        </div>
                      </div>

                      {/* Chat Messages Body */}
                      <div className="p-4 space-y-4 max-h-[380px] overflow-y-auto bg-[#7591c2]">
                        {/* System Message Date Indicator */}
                        <div className="flex justify-center">
                          <span className="px-2.5 py-0.5 bg-black/15 text-[10px] text-white rounded-full">
                            วันนี้ {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>

                        {/* LINE Notify Chat Bubble */}
                        <div className="flex items-start gap-2.5">
                          {/* Bot Avatar */}
                          <div className="w-8 h-8 rounded-full bg-[#1bc656] flex items-center justify-center text-white text-[9px] font-black shrink-0 shadow-sm border border-emerald-400">
                            บอท
                          </div>

                          <div className="space-y-0.5 max-w-[80%] flex-1">
                            <span className="text-[10px] text-white font-bold ml-1">LINE Notify</span>
                            <div className="relative bg-white text-slate-800 p-3 rounded-2xl rounded-tl-sm text-xs shadow-sm whitespace-pre-wrap leading-relaxed font-mono">
                              {/* Message tail */}
                              <div className="absolute top-2.5 -left-1 w-2.5 h-2.5 bg-white transform rotate-45"></div>
                              
                              <div className="relative z-10">
                                {mockMessageContent || `🔔 [ทดสอบ] เชื่อมต่อ LINE Notify สำหรับส่งรายงานยอดขายร้านค้าสำเร็จเรียบร้อยแล้ว!`}
                              </div>
                            </div>
                          </div>
                          
                          <span className="text-[9px] text-white/70 self-end mb-1 shrink-0">
                            {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                          </span>
                        </div>
                      </div>

                      {/* Chat Input Bar */}
                      <div className="bg-white p-3 border-t border-slate-200/50 flex items-center justify-between text-slate-400 text-[11px] italic">
                        <span>ส่งข้อมูลอัตโนมัติเมื่อมีการทำธุรกรรม</span>
                        <span className="text-[10px] uppercase font-bold text-[#1bc656] tracking-wider not-italic">REAL-TIME SYNCED</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-sm text-xs font-bold font-sans flex items-center gap-2 cursor-pointer transition shadow-xs"
                >
                  <Save className="w-4 h-4" /> บันทึกการตั้งค่า LINE Notify
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
