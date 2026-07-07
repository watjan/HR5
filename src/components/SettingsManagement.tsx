import { useState, useEffect } from 'react';
import { SystemSettings, AuditLogEntry } from '../types';
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
  ChevronRight
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
}

export default function SettingsManagement({
  settings,
  onUpdateSettings,
  onResetAllData,
  onClearToEmpty,
  onImportAllData,
  onExportAllData,
  auditLogs = [],
  onClearAuditLogs
}: SettingsManagementProps) {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'shift' | 'tax' | 'database' | 'audit_logs'>('profile');
  
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
      withholdingTaxRate: Number(withholdingTaxRate)
    };
    onUpdateSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
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
        </div>
      </div>
    </div>
  );
}
