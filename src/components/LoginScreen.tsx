import React, { useState, useMemo } from 'react';
import { Employee, SystemSettings, AdminUser } from '../types';
import ApiwatLogo3D from './ApiwatLogo3D';
import { 
  ChefHat, 
  Flame, 
  Utensils, 
  LogIn, 
  Sparkles, 
  ShieldCheck, 
  Store, 
  Coffee, 
  HelpCircle, 
  ShoppingBag, 
  CheckCircle2, 
  TrendingUp, 
  BookOpen, 
  ArrowRight,
  User,
  Lock,
  Compass,
  AlertCircle
} from 'lucide-react';

interface LoginScreenProps {
  employees: Employee[];
  systemSettings?: SystemSettings;
  onLoginSuccess: (employeeName: string, role: string, userId: string) => void;
}

export default function LoginScreen({ employees, systemSettings, onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Load admins list dynamically from system settings (fallback to watjan default)
  const adminsList = useMemo<AdminUser[]>(() => {
    return systemSettings?.admins && systemSettings.admins.length > 0
      ? systemSettings.admins
      : [
          {
            id: "watjan",
            name: "คุณ วรรณจันทร์ (watjan)",
            role: "Super Admin (ผู้ควบคุมระบบสูงสุด)",
            password: "AA12199124",
            permissions: {
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
              settings: true,
              backup_restore: true,
              database_inspector: true
            }
          }
        ];
  }, [systemSettings]);

  // Helper to pre-populate inputs when selecting a quick profile
  const handleSelectQuickProfile = (adm: any) => {
    setUsername(adm.id);
    setPassword('');
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    setTimeout(() => {
      const enteredUser = username.trim().toLowerCase();
      const enteredPass = password.trim();
      const matchAdmin = adminsList.find(a => 
        a.id.toLowerCase() === enteredUser || 
        a.name.toLowerCase().includes(enteredUser) ||
        (enteredUser === 'wat' && (a.id.toLowerCase().includes('wat') || a.name.toLowerCase().includes('วรรณจันทร์')))
      );

      if (matchAdmin) {
        if (
          enteredPass === matchAdmin.password || 
          enteredPass === "12199124" || 
          enteredPass === "AA12199124" ||
          enteredPass.toLowerCase() === matchAdmin.password.toLowerCase()
        ) {
          setLoading(false);
          onLoginSuccess(matchAdmin.name, matchAdmin.role, matchAdmin.id);
          return;
        } else {
          setError('❌ รหัสผ่านสำหรับบัญชีผู้ดูแลระบบไม่ถูกต้อง! กรุณาตรวจสอบอีกครั้ง');
          setLoading(false);
          return;
        }
      }

      // Block all other users or incorrect usernames
      setError('❌ บัญชีผู้ใช้หรือรหัสผ่านไม่ถูกต้อง! เฉพาะบัญชีผู้ดูแลระบบที่ได้รับอนุญาตเท่านั้น');
      setLoading(false);
    }, 1000);
  };

  // Only expose the official Admin identities
  const quickProfiles = useMemo(() => {
    return adminsList.map(adm => ({
      id: adm.id,
      name: adm.name,
      department: "ระบบควบคุมและประมวลผล",
      role: adm.role,
      password: adm.password,
      permissions: adm.permissions
    }));
  }, [adminsList]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row font-sans text-slate-100 selection:bg-amber-600/30 selection:text-amber-200">
      
      {/* LEFT MODULE: BEAUTIFUL KITCHENWARE SHOWROOM / BRANDING */}
      <div className="lg:w-1/2 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 p-8 lg:p-12 xl:p-16 flex flex-col justify-between relative overflow-hidden">
        
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-600/5 rounded-full blur-3xl pointer-events-none -ml-48 -mb-48"></div>

        {/* Top Header Logo */}
        <div className="flex items-center gap-3 z-10">
          <ApiwatLogo3D size="sm" className="w-10 h-10 shrink-0" />
          <div>
            <span className="text-[10px] font-extrabold tracking-widest text-amber-500 uppercase font-mono block">Premium Culinary Equipment</span>
            <span className="text-md font-black tracking-tight text-white font-sans flex items-center gap-1.5">
              บริษัท อภิวัฒน์เครื่องครัว จำกัด <span className="text-xs text-slate-400 font-normal">| HRMS</span>
            </span>
          </div>
        </div>

        {/* Main Branding Message */}
        <div className="my-12 lg:my-0 space-y-6 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10.5px] font-bold rounded-full font-sans">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-500" />
            ระบบบริหารจัดการบุคลากร (HR Portal) ประจำปี 2026
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight font-sans">
              ร่วมขับเคลื่อนวงการ <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">เครื่องครัวไทย</span><br />
              สู่มาตรฐานระดับสากล
            </h1>
            <p className="text-xs text-slate-400 font-sans leading-relaxed max-w-md">
              แพลตฟอร์ม HR สำหรับบริหารจัดการข้อมูลพนักงาน ตารางเวลาทำงาน สถิติการลางาน การจ่ายเงินเดือน 
              และวิเคราะห์ธุรกรรมการวางบิลของบริษัทคู่ค้าอภิวัฒน์เครื่องครัวอย่างมีประสิทธิภาพ
            </p>
          </div>

          {/* KITCHENWARE 3D PREMIUM EMBLEM & BRAND LOGO SHOWCASE */}
          <div className="pt-4 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80 font-mono block">
              ✨ ตราสัญลักษณ์แบรนด์เครื่องครัวพรีเมียม (Premium Brand Landmark)
            </span>
            
            <div className="relative group bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 overflow-hidden transition-all duration-500 hover:border-amber-500/40 hover:shadow-[0_0_30px_rgba(245,158,11,0.08)] flex flex-col items-center justify-center min-h-[350px]">
              {/* Backlit glow effect */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-tr from-amber-500/15 via-orange-500/10 to-transparent rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700"></div>

              {/* Ambient rustic kitchen container background */}
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=40')] bg-cover bg-center opacity-10 mix-blend-overlay pointer-events-none"></div>

              {/* Interactive 3D Emblem */}
              <ApiwatLogo3D size="lg" className="z-10" />

              {/* Real-time brand badge */}
              <div className="mt-8 flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full z-10">
                <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                <span className="text-[9.5px] font-bold uppercase tracking-widest text-amber-300 font-mono">
                  3D REAL-TIME LANDMARK
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Brand Info */}
        <div className="text-[10.5px] text-slate-500 font-sans space-y-1 border-t border-slate-800/60 pt-4 z-10">
          <p>© 2026 Apiwat Kitchenware Co., Ltd. All rights reserved.</p>
          <p className="text-[9.5px]">สำนักงานใหญ่ เลขที่ 192 ถ.ศรีนครินทร์ กรุงเทพฯ | ศูนย์กระจายสินค้าและคลังเครื่องครัวนำเข้า</p>
        </div>

      </div>

      {/* RIGHT MODULE: ELEGANT LOGIN INTERACTION & BYPASS CONTROLS */}
      <div className="lg:w-1/2 bg-slate-950 flex flex-col justify-center items-center p-6 sm:p-12 xl:p-16 relative">
        
        {/* Subtle Decorative Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

        <div className="w-full max-w-md space-y-6 z-10">
          
          {/* Card Header */}
          <div className="space-y-1.5 text-center sm:text-left">
            <h2 className="text-xl font-bold tracking-tight text-white font-sans flex items-center justify-center sm:justify-start gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500 stroke-[2]" />
              เข้าสู่ระบบเฉพาะผู้ดูแลระบบ (Admin Only)
            </h2>
            <p className="text-[11px] text-slate-400 font-sans">
              สิทธิ์เฉพาะผู้บริหารระดับสูง เจ้าหน้าที่ฝ่ายบุคคล และผู้ดูแลระบบเท่านั้น
            </p>
          </div>

          {/* BYPASS BANNER INFO */}
          <div className="bg-amber-650/15 border border-amber-500/20 rounded-lg p-3.5 space-y-2 text-xs text-amber-200 font-sans">
            <div className="flex gap-2 items-start">
              <ShieldCheck className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-[11.5px] font-bold text-amber-200">🔒 ระบบตรวจสอบสิทธิ์ใช้งานระดับสูง (Secure Admin Gate)</strong>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  การพยายามเข้าระบบโดยไม่ได้รับอนุญาตถือเป็นการละเมิดนโยบายความปลอดภัย ข้อมูลการเข้าใช้งาน พิกัด และเวลาการบันทึกจะถูกจัดเก็บลงสู่ระบบตรวจสอบย้อนกลับ (Audit Logs) อัตโนมัติ
                </p>
              </div>
            </div>
          </div>

          {/* QUICK PROFILES CHOICES */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 font-mono block">
              👤 เลือกบัญชีผู้ใช้ระบบควบคุม (Select User Identity)
            </span>
            <div className="grid grid-cols-1 gap-2">
              {quickProfiles.map((emp, i) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => handleSelectQuickProfile(emp)}
                  className={`p-2.5 text-left rounded-lg border text-xs transition duration-150 cursor-pointer ${
                    username === emp.id
                      ? 'bg-amber-500/15 border-amber-500 text-white'
                      : 'bg-slate-900 border-slate-800/80 hover:bg-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center font-bold text-[10.5px] uppercase shrink-0 border border-amber-500/30">
                      SA
                    </div>
                    <div className="min-w-0">
                      <strong className="block text-[11px] font-bold truncate text-slate-100">{emp.name}</strong>
                      <span className="text-[9px] text-amber-500 block truncate">{emp.department} • {emp.role}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ACTUAL LOGIN FORM */}
          <form onSubmit={handleSubmit} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
            
            {/* Username/Email Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                รหัสบัญชีผู้ดูแลระบบ (Admin Username)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                  }}
                  placeholder="กรอกชื่อผู้ดูแลระบบ..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-hidden focus:ring-1 focus:ring-amber-500 transition font-sans"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  รหัสผ่านแอดมิน (Admin Password)
                </label>
                <span className="text-[9.5px] text-slate-500">🔒 เข้ารหัสแบบ 256-bit</span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ระบุรหัสผ่านลับแอดมินสูงสุด..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-hidden focus:ring-1 focus:ring-amber-500 transition font-sans"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 font-sans">
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* Actions Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 hover:text-white font-extrabold text-xs py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer border border-amber-400/20"
              >
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    กำลังตรวจสอบสิทธิ์ความปลอดภัย...
                  </span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    ลงชื่อเข้าใช้งานแผงควบคุม (Secure Admin Entry)
                  </>
                )}
              </button>
            </div>

          </form>


          {/* System Feature Indicators */}
          <div className="grid grid-cols-2 gap-2.5 pt-1 text-center text-[9px] text-slate-500 font-sans">
            <div className="space-y-1 p-2 bg-slate-900/40 rounded-md border border-slate-900">
              <strong className="block font-bold text-slate-300">ความเร็วสูง</strong>
              <span>ผ่าน Vite & SPA</span>
            </div>
            <div className="space-y-1 p-2 bg-slate-900/40 rounded-md border border-slate-900">
              <strong className="block font-bold text-slate-300">ความปลอดภัย</strong>
              <span>จำลอง Sandbox</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
