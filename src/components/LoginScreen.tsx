import React, { useState, useMemo } from 'react';
import { Employee, SystemSettings, AdminUser } from '../types';
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
      const matchAdmin = adminsList.find(a => a.id.toLowerCase() === enteredUser);

      if (matchAdmin) {
        if (password === matchAdmin.password) {
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
          <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 rounded-lg shadow-lg flex items-center justify-center">
            <ChefHat className="w-6 h-6 stroke-[2]" />
          </div>
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
            
            <div className="relative group bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 overflow-hidden transition-all duration-500 hover:border-amber-500/40 hover:shadow-[0_0_30px_rgba(245,158,11,0.08)] flex flex-col items-center justify-center min-h-[300px] perspective-1000">
              {/* Backlit glow effect */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-tr from-amber-500/20 via-orange-500/10 to-transparent rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700"></div>

              {/* Ambient rustic kitchen container background */}
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=40')] bg-cover bg-center opacity-15 mix-blend-overlay pointer-events-none"></div>

              {/* 3D Rotating Emblem Container */}
              <div className="relative w-44 h-44 transition-all duration-700 ease-out [transform-style:preserve-3d] group-hover:[transform:rotateX(12deg)_rotateY(15deg)]">
                
                {/* 1. Outer Metallic Golden Ring with 3D Depth */}
                <div className="absolute inset-0 rounded-full border-4 border-double border-amber-500/60 bg-slate-950/90 shadow-[0_10px_30px_rgba(0,0,0,0.8),inset_0_2px_10px_rgba(245,158,11,0.2)] flex items-center justify-center [transform:translateZ(10px)]">
                  
                  {/* Subtle radial sheen on the gold background */}
                  <div className="absolute inset-2 rounded-full bg-radial-gradient from-amber-500/5 to-slate-950"></div>

                  {/* 2. Inner Logo Ring */}
                  <div className="absolute inset-4 rounded-full border border-amber-500/20 flex flex-col items-center justify-center p-2 [transform:translateZ(20px)]">
                    
                    {/* SVG representing Pot, Pan, Basin and Chef Knife in 3D style */}
                    <svg viewBox="0 0 100 100" className="w-28 h-28 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]">
                      <defs>
                        {/* Metallic Coppery Gold Gradient for Pot */}
                        <linearGradient id="copperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="30%" stopColor="#d97706" />
                          <stop offset="70%" stopColor="#b45309" />
                          <stop offset="100%" stopColor="#78350f" />
                        </linearGradient>

                        {/* Steel Silver Gradient for Knife and Pan */}
                        <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f8fafc" />
                          <stop offset="40%" stopColor="#cbd5e1" />
                          <stop offset="70%" stopColor="#94a3b8" />
                          <stop offset="100%" stopColor="#475569" />
                        </linearGradient>

                        {/* Gold Accent Gradient */}
                        <linearGradient id="goldAccent" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#fbbf24" />
                          <stop offset="100%" stopColor="#b45309" />
                        </linearGradient>
                        
                        {/* Blue Steel Gradient */}
                        <linearGradient id="basinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#e2e8f0" />
                          <stop offset="50%" stopColor="#cbd5e1" />
                          <stop offset="100%" stopColor="#64748b" />
                        </linearGradient>
                      </defs>

                      {/* 1. Basin (กะละมัง) - Large base bowl shape at the background bottom */}
                      <path 
                        d="M 20,60 C 20,72 30,78 50,78 C 70,78 80,72 80,60 Z" 
                        fill="url(#basinGrad)" 
                        opacity="0.85"
                        stroke="#475569"
                        strokeWidth="1.2"
                      />
                      {/* Basin Rim */}
                      <ellipse cx="50" cy="60" rx="30" ry="4" fill="#94a3b8" stroke="#475569" strokeWidth="0.8" />

                      {/* 2. Professional Frying Pan (กระทะ) - Tilted to the right */}
                      <g transform="rotate(15 50 50)">
                        {/* Pan Handle */}
                        <path d="M 8,45 L 30,45" stroke="url(#silverGrad)" strokeWidth="3" strokeLinecap="round" />
                        <path d="M 8,45 L 18,45" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
                        
                        {/* Pan Body */}
                        <path 
                          d="M 28,45 C 28,52 34,56 46,56 C 58,56 64,52 64,45 Z" 
                          fill="#334155" 
                          stroke="#1e293b"
                          strokeWidth="1.2"
                        />
                        <ellipse cx="46" cy="45" rx="18" ry="2.5" fill="#1e293b" stroke="url(#silverGrad)" strokeWidth="0.8" />
                      </g>

                      {/* 3. Luxury Copper Boiling Pot (หม้อต้มมีฝา) - Center Majesty */}
                      {/* Left Handle */}
                      <path d="M 25,32 C 18,32 18,40 25,40" fill="none" stroke="url(#goldAccent)" strokeWidth="2.5" strokeLinecap="round" />
                      {/* Right Handle */}
                      <path d="M 75,32 C 82,32 82,40 75,40" fill="none" stroke="url(#goldAccent)" strokeWidth="2.5" strokeLinecap="round" />
                      
                      {/* Pot Body */}
                      <path 
                        d="M 28,34 L 29,48 C 29,54 35,58 50,58 C 65,58 71,54 71,48 L 72,34 Z" 
                        fill="url(#copperGrad)" 
                        stroke="#78350f"
                        strokeWidth="1"
                      />
                      
                      {/* Pot Rim */}
                      <ellipse cx="50" cy="34" rx="22" ry="2.5" fill="url(#goldAccent)" />
                      
                      {/* Pot Lid (ฝาหม้อ) */}
                      <path 
                        d="M 27,33 C 33,26 67,26 73,33 Z" 
                        fill="url(#copperGrad)" 
                        stroke="#78350f"
                        strokeWidth="0.8"
                      />
                      {/* Lid Knob (หูฝาหม้อทองคำ) */}
                      <ellipse cx="50" cy="26" rx="4" ry="2.5" fill="url(#goldAccent)" stroke="#78350f" strokeWidth="0.5" />
                      <rect x="48" y="27" width="4" height="2" fill="url(#goldAccent)" />

                      {/* 4. Hand-Forged Chef Knife (มีดดามัสกัส) - Crossing sleekly in front */}
                      <g transform="rotate(-25 50 50)">
                        {/* Blade */}
                        <path 
                          d="M 15,48 L 75,48 C 77,48 83,44 85,42 C 78,41 73,42 15,42 Z" 
                          fill="url(#silverGrad)" 
                          stroke="#334155"
                          strokeWidth="0.5"
                        />
                        {/* Damascus wavy steel lines (Decorative) */}
                        <path d="M 25,44 Q 35,46 45,43 T 65,45 T 78,43" fill="none" stroke="#64748b" strokeWidth="0.5" opacity="0.6" />
                        <path d="M 20,46 Q 30,44 40,46 T 60,43 T 75,44" fill="none" stroke="#475569" strokeWidth="0.5" opacity="0.4" />
                        
                        {/* Knife Handle (Rosewood & Gold bolster) */}
                        <rect x="2" y="42.5" width="13" height="4.5" rx="1.5" fill="#311b0b" stroke="#000" strokeWidth="0.5" />
                        <rect x="11" y="42.5" width="4" height="4.5" fill="url(#goldAccent)" />
                      </g>

                      {/* Shiny stars/sparkles representing brand pristine quality */}
                      <path d="M 18,22 Q 18,25 21,25 Q 18,25 18,28 Q 18,25 15,25 Q 18,25 18,22 Z" fill="#fbbf24" />
                      <path d="M 82,24 Q 82,26 84,26 Q 82,26 82,28 Q 82,26 80,26 Q 82,26 82,24 Z" fill="#fbbf24" />
                      <path d="M 50,15 Q 50,16 51,16 Q 50,16 50,17 Q 50,16 49,16 Q 50,16 50,15 Z" fill="#fff" />
                    </svg>

                  </div>
                </div>

                {/* Outer Rotating Text Ring (Coppery text wrapping circular border) */}
                <div className="absolute inset-0 flex items-center justify-center animate-[spin_25s_linear_infinite] hover:paused pointer-events-none [transform:translateZ(15px)]">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-amber-500/60 font-bold uppercase tracking-widest text-[5px]">
                    <defs>
                      <path id="textCircle" d="M 50,50 m -44,0 a 44,44 0 1,1 88,0 a 44,44 0 1,1 -88,0" />
                    </defs>
                    <text fill="currentColor">
                      <textPath href="#textCircle" startOffset="0%">
                        • APIWAT KITCHENWARE • PREMIUM CULINARY BRAND • SINCE 1995 • LUXURY COOKWARE
                      </textPath>
                    </text>
                  </svg>
                </div>

              </div>

              {/* Title & Description under emblem */}
              <div className="text-center mt-6 space-y-1.5 z-10 [transform:translateZ(25px)]">
                <h4 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400 font-sans tracking-wide">
                  อภิวัฒน์เครื่องครัวระดับสากล
                </h4>
                <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed font-sans">
                  งานฝีมือประณีตด้วยชุดต้มทองแดง, กระทะเหล็กหล่อหลอมชิ้นเดียว, และเทคโนโลยีโลหะวิทยา 3D เพื่อเชฟและอุตสาหกรรมอาหารไทย
                </p>
              </div>

              {/* Real-time brand badge */}
              <div className="mt-4 flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full z-10">
                <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                <span className="text-[9.5px] font-bold uppercase tracking-widest text-amber-300 font-mono">
                  3D CRAFTED EMBLEM
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
