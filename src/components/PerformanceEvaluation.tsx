import React, { useState } from 'react';
import { PerformanceEvaluation, Employee } from '../types';
import { Award, Bot, Sparkles, Loader2, FileText, Check, Plus, Star, X, Eye, BarChart3, TrendingUp, Users, Target, Activity, ChevronRight } from 'lucide-react';
import Markdown from 'react-markdown';

interface PerformanceEvaluationProps {
  evaluations: PerformanceEvaluation[];
  employees: Employee[];
  onAddEvaluation: (evalu: PerformanceEvaluation) => void;
  onUpdateEvaluationStatus: (id: string, status: 'draft' | 'completed') => void;
}

export default function PerformanceEvaluationComponent({
  evaluations,
  employees,
  onAddEvaluation,
  onUpdateEvaluationStatus
}: PerformanceEvaluationProps) {
  // Navigation
  const [activeSub, setActiveSub] = useState<'dashboard' | 'records' | 'ai-helper'>('dashboard');

  // KPI Dashboard States
  const [selectedTrendEmpId, setSelectedTrendEmpId] = useState<string>(employees[0]?.id || '');
  const [selectedTrendDept, setSelectedTrendDept] = useState<string>('All');

  // New manual evaluation form
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || '');
  const [evaluatorName, setEvaluatorName] = useState('CEO');
  const [period, setPeriod] = useState('H1 2026');
  const [score, setScore] = useState(4);
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [goals, setGoals] = useState('');
  const [comments, setComments] = useState('');

  // AI Appraisal Generator state
  const [aiEmpId, setAiEmpId] = useState(employees[0]?.id || '');
  const [aiEvaluator, setAiEvaluator] = useState('นายสมเกียรติ รักดี');
  const [aiScore, setAiScore] = useState(4);
  const [aiStrengths, setAiStrengths] = useState('');
  const [aiImprovements, setAiImprovements] = useState('');
  const [aiGoals, setAiGoals] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');

  // Selected view detail modal
  const [viewEval, setViewEval] = useState<PerformanceEvaluation | null>(null);

  // Submit manual evaluation
  const handleSubmitManualEval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !evaluatorName) return;

    const emp = employees.find(e => e.id === selectedEmpId);
    if (!emp) return;

    const newEval: PerformanceEvaluation = {
      id: `EVAL-${Date.now().toString().slice(-3)}`,
      employeeId: selectedEmpId,
      employeeName: emp.name,
      role: emp.role,
      department: emp.department,
      evaluatorName,
      period,
      score,
      strengths,
      improvements,
      goals,
      comments,
      date: new Date().toISOString().split('T')[0],
      status: 'completed'
    };

    onAddEvaluation(newEval);
    setIsAddOpen(false);
    setActiveSub('records');
  };

  // Run AI Evaluation Appraisal draft
  const handleGenerateAIEval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiEmpId) return;

    const emp = employees.find(e => e.id === aiEmpId);
    if (!emp) return;

    setAiLoading(true);
    setAiResult('');

    try {
      const response = await fetch('/api/ai/performance-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeName: emp.name,
          role: emp.role,
          score: aiScore,
          strengths: aiStrengths,
          improvements: aiImprovements,
          goals: aiGoals
        })
      });

      if (!response.ok) {
        throw new Error('เซิร์ฟเวอร์ AI ประสบปัญหาบางอย่าง');
      }

      const data = await response.json();
      setAiResult(data.text);
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการเขียนบทประเมินโดย AI');
    } finally {
      setAiLoading(false);
    }
  };

  // Save generated AI appraisal as completed record
  const handleSaveAIEval = () => {
    if (!aiResult || !aiEmpId) return;

    const emp = employees.find(e => e.id === aiEmpId);
    if (!emp) return;

    const newEval: PerformanceEvaluation = {
      id: `EVAL-${Date.now().toString().slice(-3)}`,
      employeeId: aiEmpId,
      employeeName: emp.name,
      role: emp.role,
      department: emp.department,
      evaluatorName: aiEvaluator,
      period: 'H1 2026',
      score: aiScore,
      strengths: aiStrengths || "ตามที่ระบุในคำสั่งร่าง AI",
      improvements: aiImprovements || "พิจารณาตามข้อมูลปรับปรุงในรายงาน",
      goals: aiGoals || "พัฒนาตามกรอบเป้าหมายใหม่",
      comments: `รายงานฉบับนี้ร่างและปรับปรุงโดยผู้ช่วย AI Copilot อย่างเป็นทางการ`,
      date: new Date().toISOString().split('T')[0],
      status: 'completed'
    };

    onAddEvaluation(newEval);
    alert('บันทึกผลการประเมินลงในฐานข้อมูลหลักเรียบร้อยแล้ว!');
    setAiResult('');
    setActiveSub('records');
  };

  // --- KPI DASHBOARD CALCULATIONS ---
  const completedEvals = evaluations.filter(e => e.status === 'completed');

  // KPI 1: Average Evaluation Rating
  const avgScore = completedEvals.length > 0 
    ? Number((completedEvals.reduce((sum, e) => sum + e.score, 0) / completedEvals.length).toFixed(2))
    : 0;

  // KPI 2: Evaluated Employees Ratio
  const evaluatedEmployeeIds = new Set(completedEvals.map(e => e.employeeId));
  const activeEmployeeList = employees.filter(e => e.status !== 'inactive');
  const totalEmployeesCount = activeEmployeeList.length;
  const evaluatedRatioPercent = totalEmployeesCount > 0 
    ? Math.round((evaluatedEmployeeIds.size / totalEmployeesCount) * 100) 
    : 0;

  // KPI 3: Department Score Breakdown
  const deptScores: { [dept: string]: { sum: number; count: number } } = {};
  completedEvals.forEach(e => {
    const dept = e.department || 'General';
    if (!deptScores[dept]) {
      deptScores[dept] = { sum: 0, count: 0 };
    }
    deptScores[dept].sum += e.score;
    deptScores[dept].count += 1;
  });

  const departmentAverages = Object.entries(deptScores).map(([dept, data]) => ({
    department: dept,
    average: Number((data.sum / data.count).toFixed(2)),
    count: data.count
  })).sort((a, b) => b.average - a.average);

  const topDepartment = departmentAverages.length > 0 ? departmentAverages[0] : null;

  // KPI 4: Total completed count
  const totalEvaluationsCount = completedEvals.length;

  // Chronological periods ordering
  const PERIOD_ORDER = ['H1 2024', 'H2 2024', 'H1 2025', 'H2 2025', 'H1 2026', 'H2 2026', 'H1 2027', 'H2 2027'];
  const getPeriodIndex = (p: string) => {
    const idx = PERIOD_ORDER.indexOf(p);
    return idx !== -1 ? idx : 999;
  };

  // List of unique periods present in database
  const uniquePeriodsInEvals = Array.from(new Set(completedEvals.map(e => e.period)))
    .sort((a, b) => getPeriodIndex(a) - getPeriodIndex(b));

  const displayPeriods = uniquePeriodsInEvals.length > 0 ? uniquePeriodsInEvals : ['H1 2024', 'H2 2024', 'H1 2025', 'H2 2025', 'H1 2026'];

  // List of all departments for filtering
  const allDepartmentsList = Array.from(new Set(employees.map(e => e.department))).filter(Boolean);

  // --- Department/Company Trend Over Time (Line & Area Chart) ---
  const trendPeriodAverages = displayPeriods.map(period => {
    const periodEvals = completedEvals.filter(e => e.period === period && (selectedTrendDept === 'All' || e.department === selectedTrendDept));
    const average = periodEvals.length > 0 
      ? Number((periodEvals.reduce((sum, e) => sum + e.score, 0) / periodEvals.length).toFixed(2))
      : 0;
    return { period, average, count: periodEvals.length };
  });

  // Plot coordinates for Department Trend SVG (Width 500, Height 150)
  const deptPoints = trendPeriodAverages.map((d, idx) => {
    const width = 500;
    const spacing = width / (displayPeriods.length - 1 || 1);
    const x = idx * spacing;
    const y = 140 - (d.average / 5) * 120; // values from 20 to 140
    return { x, y, d };
  });

  const deptLinePath = deptPoints.length > 0 
    ? `M ${deptPoints[0].x} ${deptPoints[0].y} ` + deptPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const deptAreaPath = deptPoints.length > 0
    ? `${deptLinePath} L ${deptPoints[deptPoints.length - 1].x} 150 L ${deptPoints[0].x} 150 Z`
    : '';

  // --- Individual Employee Trend Over Time (Line & Detail Chart) ---
  const trendEmpEvals = completedEvals
    .filter(e => e.employeeId === selectedTrendEmpId)
    .sort((a, b) => getPeriodIndex(a.period) - getPeriodIndex(b.period));

  const empTrendData = displayPeriods.map(period => {
    const evalRecord = trendEmpEvals.find(e => e.period === period);
    return {
      period,
      score: evalRecord ? evalRecord.score : null,
      record: evalRecord
    };
  });

  // Plot coordinates for Employee Trend SVG (Width 500, Height 150)
  const empPoints = empTrendData.map((d, idx) => {
    const width = 500;
    const spacing = width / (displayPeriods.length - 1 || 1);
    const x = idx * spacing;
    const y = d.score !== null ? 140 - (d.score / 5) * 120 : null;
    return { x, y, d, idx };
  });

  const validEmpPoints = empPoints.filter(p => p.y !== null) as Array<{ x: number; y: number; d: typeof empTrendData[0], idx: number }>;

  const empLinePath = validEmpPoints.length > 0 
    ? `M ${validEmpPoints[0].x} ${validEmpPoints[0].y} ` + validEmpPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const empAreaPath = validEmpPoints.length > 0
    ? `${empLinePath} L ${validEmpPoints[validEmpPoints.length - 1].x} 150 L ${validEmpPoints[0].x} 150 Z`
    : '';

  const selectedEmployeeObj = employees.find(e => e.id === selectedTrendEmpId);
  const selectedEmployeeName = selectedEmployeeObj?.name || 'พนักงาน';

  return (
    <div id="performance-evaluation-container" className="space-y-6">
      {/* Tab Nav Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-2">
        <div>
          <h2 className="text-xl font-light text-slate-900">ประเมินผลและพัฒนาศักยภาพ (Performance & Appraisal)</h2>
          <p className="text-xs text-slate-500 mt-1 font-sans">บันทึกคะแนนประเมินประจำปี คาดคะเนเป้าหมายถัดไป และเขียนประเมินด้วย AI</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-sm self-stretch md:self-auto text-xs font-mono font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveSub('dashboard')}
            className={`px-3 py-1.5 rounded-sm transition flex items-center gap-1 ${activeSub === 'dashboard' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> แดชบอร์ด KPI
          </button>
          <button
            onClick={() => setActiveSub('records')}
            className={`px-3 py-1.5 rounded-sm transition ${activeSub === 'records' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            ประวัติการประเมิน
          </button>
          <button
            onClick={() => setActiveSub('ai-helper')}
            className={`px-3 py-1.5 rounded-sm transition flex items-center gap-1.5 ${activeSub === 'ai-helper' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> เขียนประเมินด้วย AI
          </button>
        </div>
      </div>

      {/* SUB TAB 0: KPI Visual Dashboard */}
      {activeSub === 'dashboard' && (
        <div id="kpi-dashboard-tab" className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CARD 1: Average evaluation score */}
            <div className="bg-white border border-slate-200 p-5 rounded-sm flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-50 rounded-sm flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
                <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans block">คะแนนเฉลี่ยบริษัท</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-light font-mono text-slate-950">{avgScore}</span>
                  <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
                </div>
                <div className="flex gap-0.5 mt-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`w-2 h-2 rounded-full ${i < Math.round(avgScore) ? 'bg-amber-400' : 'bg-slate-100'}`} />
                  ))}
                </div>
              </div>
            </div>

            {/* CARD 2: Coverage Ratio */}
            <div className="bg-white border border-slate-200 p-5 rounded-sm flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-sm flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans block">อัตราการประเมินสำเร็จ</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-light font-mono text-slate-950">{evaluatedEmployeeIds.size}</span>
                  <span className="text-xs font-semibold text-slate-400">/ {totalEmployeesCount} คน</span>
                </div>
                <div className="w-20 bg-slate-100 h-1 rounded-full overflow-hidden mt-1">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${evaluatedRatioPercent}%` }} />
                </div>
              </div>
            </div>

            {/* CARD 3: Top Department */}
            <div className="bg-white border border-slate-200 p-5 rounded-sm flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-sm flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 max-w-[170px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans block">แผนกผลงานสูงสุด</span>
                <span className="text-xs font-bold text-slate-800 block truncate">{topDepartment?.department || 'ยังไม่มีข้อมูล'}</span>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm inline-block mt-1">
                  {topDepartment ? `${topDepartment.average} / 5 คะแนน` : '-'}
                </span>
              </div>
            </div>

            {/* CARD 4: Total Evaluations */}
            <div className="bg-white border border-slate-200 p-5 rounded-sm flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-50 rounded-sm flex items-center justify-center text-purple-600 border border-purple-100 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans block">แบบประเมินทั้งหมด</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-light font-mono text-slate-950">{totalEvaluationsCount}</span>
                  <span className="text-xs font-semibold text-slate-400">รายการ</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">บันทึกสะสมในระบบ</span>
              </div>
            </div>
          </div>

          {/* Row 1: Department Comparisons & Multi-Year Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Module: Department Scores (Bar list) */}
            <div className="bg-white border border-slate-200 p-5 rounded-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Department Scores</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">คะแนนผลงานเฉลี่ยจำแนกตามแต่ละแผนก</p>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 rounded-sm text-slate-500 uppercase">
                    จัดอันดับสูงสุด
                  </span>
                </div>

                <div className="space-y-4.5 mt-5">
                  {departmentAverages.length > 0 ? (
                    departmentAverages.map((dept, index) => (
                      <div key={dept.department} className="space-y-2 group">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-slate-400">#{index + 1}</span>
                            {dept.department}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-950 bg-slate-50 px-1.5 py-0.5 rounded-sm border border-slate-200/50">
                              {dept.average} ★
                            </span>
                            <span className="text-[10px] text-slate-400 font-sans">({dept.count} ฉบับ)</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-slate-50 border border-slate-200/50 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${(dept.average / 5) * 100}%` }} 
                            className="h-full bg-blue-600 rounded-full transition-all duration-500 group-hover:bg-blue-500"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-xs text-slate-400 font-sans">
                      ไม่มีข้อมูลการประเมินที่ส่งเสร็จสมบูรณ์
                    </div>
                  )}
                </div>
              </div>

              {departmentAverages.length > 0 && (
                <div className="border-t border-slate-100 pt-4 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>เกณฑ์วัดผล: 5 = ดีเลิศ, 1 = ต้องปรับปรุง</span>
                  <button 
                    onClick={() => setActiveSub('records')} 
                    className="text-blue-600 font-bold flex items-center hover:underline cursor-pointer"
                  >
                    ดูเอกสารทั้งหมด <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Right Module: Department/Company Score Trend over time (SVG Line Area Chart) */}
            <div className="bg-white border border-slate-200 p-5 rounded-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Department Trends over Time</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">แนวโน้มคะแนนเฉลี่ยในแต่ละรอบปีประเมิน</p>
                </div>
                <select
                  value={selectedTrendDept}
                  onChange={(e) => setSelectedTrendDept(e.target.value)}
                  className="px-2.5 py-1 border border-slate-200 rounded-sm text-[11px] bg-white focus:outline-none focus:border-blue-500 text-slate-700 font-bold"
                >
                  <option value="All">ทุกแผนก (Overall Company)</option>
                  {allDepartmentsList.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Area Line Chart SVG */}
              <div className="pt-4">
                <div className="relative h-40 w-full border-b border-l border-slate-100/80">
                  <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                    {/* Grids lines */}
                    <line x1="0" y1="20" x2="500" y2="20" stroke="#f8fafc" strokeWidth="1" />
                    <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="110" x2="500" y2="110" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="140" x2="500" y2="140" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />

                    {/* Chart Gradient definition */}
                    <defs>
                      <linearGradient id="deptTrendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0.00" />
                      </linearGradient>
                    </defs>

                    {/* Shaded Area Under Line */}
                    {deptPoints.length > 0 && (
                      <path d={deptAreaPath} fill="url(#deptTrendGrad)" />
                    )}

                    {/* Primary Line */}
                    {deptPoints.length > 0 && (
                      <path 
                        d={deptLinePath} 
                        fill="none" 
                        stroke="#2563eb" 
                        strokeWidth="2.5" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Circles on dots with Hover effect */}
                    {deptPoints.map((pt, i) => (
                      <g key={i} className="group/dot cursor-pointer">
                        <circle 
                          cx={pt.x} 
                          cy={pt.y} 
                          r="4.5" 
                          className="fill-blue-600 stroke-white stroke-2 group-hover/dot:r-6 group-hover/dot:fill-blue-500 transition-all duration-150"
                        />
                        {/* Interactive dynamic labels on hover */}
                        <text
                          x={pt.x}
                          y={pt.y - 10}
                          textAnchor="middle"
                          className="text-[10px] font-mono font-bold fill-blue-700 opacity-0 group-hover/dot:opacity-100 transition-all duration-150"
                        >
                          {pt.d.average > 0 ? `${pt.d.average}★` : '-'}
                        </text>
                      </g>
                    ))}
                  </svg>

                  {/* Absolute positioning of vertical legends */}
                  <div className="absolute left-1 top-0 text-[8px] font-mono text-slate-400">5.0 ★</div>
                  <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] font-mono text-slate-400">3.0 ★</div>
                  <div className="absolute left-1 bottom-1 text-[8px] font-mono text-slate-400">1.0 ★</div>
                </div>

                {/* X-Axis labels */}
                <div className="flex justify-between mt-2 px-1 text-[10px] font-mono font-bold text-slate-400">
                  {displayPeriods.map((period, i) => (
                    <span key={period}>{period}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Individual Performance Score Trends over time */}
          <div className="bg-white border border-slate-200 p-5 rounded-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Individual Employee Performance Trend</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">ค้นหาและติดตามความก้าวหน้า ทัศนคติ และคะแนนรายบุคคลย้อนหลังทุกรอบประเมิน</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans shrink-0">เลือกพนักงาน:</span>
                <select
                  value={selectedTrendEmpId}
                  onChange={(e) => setSelectedTrendEmpId(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-sm text-[11px] bg-white focus:outline-none focus:border-blue-500 text-slate-700 font-bold max-w-[240px]"
                >
                  {employees.filter(e => e.status !== 'inactive').map(emp => (
                    <option key={emp.id} value={emp.id}>[{emp.id}] {emp.name} ({emp.department})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Individual Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Employee Quick Info Card */}
              <div className="lg:col-span-4 bg-slate-50/60 border border-slate-150/80 rounded-sm p-4.5 space-y-4">
                <div className="flex items-center gap-3.5 pb-3 border-b border-slate-200/50">
                  <img
                    referrerPolicy="no-referrer"
                    src={selectedEmployeeObj?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"}
                    alt={selectedEmployeeObj?.name}
                    className="w-12 h-12 rounded-sm object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">{selectedEmployeeObj?.name || 'ไม่ระบุชื่อ'}</h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedEmployeeObj?.role} • {selectedEmployeeObj?.department}</p>
                    <span className={`px-1.5 py-0.5 rounded-xs text-[9px] font-mono font-bold uppercase mt-1 inline-block ${
                      selectedEmployeeObj?.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {selectedEmployeeObj?.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-[11px] text-slate-600">
                  <div className="flex justify-between items-center bg-white p-2 rounded-sm border border-slate-200/50">
                    <span className="font-medium">ประเมินสะสม:</span>
                    <span className="font-mono font-bold text-slate-900">{trendEmpEvals.length} รอบ</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2 rounded-sm border border-slate-200/50">
                    <span className="font-medium">คะแนนเฉลี่ยบุคคล:</span>
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-sm">
                      {trendEmpEvals.length > 0 
                        ? (trendEmpEvals.reduce((sum, e) => sum + e.score, 0) / trendEmpEvals.length).toFixed(1) 
                        : '-'} ★
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2 rounded-sm border border-slate-200/50">
                    <span className="font-medium">วันที่เข้าร่วมงาน:</span>
                    <span className="font-mono text-slate-500">{selectedEmployeeObj?.joinDate}</span>
                  </div>
                </div>

                <div className="bg-blue-50/50 border border-blue-200/50 p-3 rounded-sm">
                  <p className="text-[10px] leading-relaxed text-blue-800 font-sans">
                    <strong>คำแนะนำการส่งเสริม:</strong> จัดสรรแผนพัฒนาบุคคลที่เหมาะสม สภาพคะแนนพนักงานสะท้อนให้เห็นทัศนคติการเรียนรู้ และขีดความสามารถเฉพาะตัวรอบด้าน
                  </p>
                </div>
              </div>

              {/* Employee SVG Line Chart & Interactive Grid */}
              <div className="lg:col-span-8 space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  ประวัติตารางคะแนนการประเมินย้อนหลัง (Timeline chart ของ {selectedEmployeeName})
                </span>

                <div className="relative h-40 w-full border-b border-l border-slate-100/80">
                  <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                    {/* Grids */}
                    <line x1="0" y1="20" x2="500" y2="20" stroke="#f8fafc" strokeWidth="1" />
                    <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="110" x2="500" y2="110" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="140" x2="500" y2="140" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />

                    {/* Area under individual line */}
                    {validEmpPoints.length > 0 && (
                      <defs>
                        <linearGradient id="empTrendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ea580c" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#ea580c" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                    )}

                    {validEmpPoints.length > 0 && (
                      <path d={empAreaPath} fill="url(#empTrendGrad)" />
                    )}

                    {/* Draw continuous line connecting valid evaluations */}
                    {validEmpPoints.length > 0 && (
                      <path 
                        d={empLinePath} 
                        fill="none" 
                        stroke="#ea580c" 
                        strokeWidth="2.5" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Dot markers */}
                    {empPoints.map((pt, i) => (
                      <g key={i} className="group/dot cursor-pointer">
                        {pt.y !== null ? (
                          <>
                            <circle 
                              cx={pt.x} 
                              cy={pt.y} 
                              r="5" 
                              className="fill-orange-600 stroke-white stroke-2 group-hover/dot:r-7 transition-all duration-150"
                            />
                            {/* Dynamic floating score values */}
                            <text
                              x={pt.x}
                              y={pt.y - 12}
                              textAnchor="middle"
                              className="text-[10px] font-mono font-bold fill-orange-700"
                            >
                              {pt.d.score}
                            </text>
                          </>
                        ) : (
                          // Render a subtle hollow indicator that there was no eval in this period
                          <circle 
                            cx={pt.x} 
                            cy="140" 
                            r="3" 
                            className="fill-white stroke-slate-200 stroke-1"
                          />
                        )}
                      </g>
                    ))}
                  </svg>
                  
                  <div className="absolute right-1 top-0 text-[8px] font-mono text-slate-400">5.0 (ยอดเยี่ยม)</div>
                  <div className="absolute right-1 bottom-1 text-[8px] font-mono text-slate-400">1.0 (ปรับปรุง)</div>
                </div>

                {/* X-Axis Periods */}
                <div className="flex justify-between px-1 text-[10px] font-mono font-bold text-slate-400">
                  {displayPeriods.map((period, i) => (
                    <span key={period} className={empTrendData[i]?.score !== null ? 'text-slate-700' : 'text-slate-300'}>
                      {period}
                    </span>
                  ))}
                </div>

                {/* Historic Summary cards for the selected employee in this tab */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  {trendEmpEvals.slice(-3).reverse().map(eva => (
                    <div key={eva.id} className="bg-white border border-slate-150 p-3 rounded-sm space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-xs">
                          {eva.period}
                        </span>
                        <div className="flex items-center text-amber-500 font-mono font-bold">
                          ★ {eva.score}
                        </div>
                      </div>
                      <p className="line-clamp-2 text-slate-500 italic">
                        &ldquo;{eva.strengths}&rdquo;
                      </p>
                      <div className="text-[9px] text-slate-400 flex justify-between pt-1 border-t border-slate-100">
                        <span>ผู้ประเมิน: {eva.evaluatorName}</span>
                        <span>{eva.date}</span>
                      </div>
                    </div>
                  ))}
                  {trendEmpEvals.length === 0 && (
                    <div className="col-span-3 text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-sm bg-slate-50">
                      ไม่มีประวัติการประเมินที่ส่งสมบูรณ์สำหรับพนักงานคนนี้
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 1: Evaluation Records history */}
      {activeSub === 'records' && (
        <div id="records-tab" className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">เอกสารประเมินพนักงานในระบบ ({evaluations.length})</span>
            <button
              id="open-eval-modal-btn"
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition"
            >
              <Plus className="w-3.5 h-3.5" /> บันทึกการประเมินใหม่
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {evaluations.map(eva => (
              <div key={eva.id} className="bg-white border border-slate-200 rounded-sm p-5 hover:shadow-md transition flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{eva.employeeName}</h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{eva.role} • {eva.department}</p>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < eva.score ? 'fill-amber-400' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-3 rounded-sm border border-slate-200">
                    <p><strong>ผู้ประเมิน:</strong> {eva.evaluatorName}</p>
                    <p><strong>รอบปี:</strong> {eva.period} ({eva.date})</p>
                    <p className="line-clamp-2 italic mt-1 border-t border-slate-200/50 pt-1 text-slate-500 font-sans">
                      &ldquo;{eva.strengths}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                  <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                    eva.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {eva.status === 'completed' ? 'ส่งประเมินสำเร็จ' : 'ฉบับร่าง (Draft)'}
                  </span>
                  
                  <div className="flex gap-2">
                    {eva.status === 'draft' && (
                      <button
                        onClick={() => onUpdateEvaluationStatus(eva.id, 'completed')}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition"
                      >
                        อนุมัติแบบร่าง
                      </button>
                    )}
                    <button
                      onClick={() => setViewEval(eva)}
                      className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-sm transition"
                      title="เปิดดูรายละเอียด"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB TAB 2: AI Appraisal draft assistant helper */}
      {activeSub === 'ai-helper' && (
        <div id="ai-helper-tab" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Inputs Section */}
          <div className="bg-white border border-slate-200 rounded-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <Bot className="w-4 h-4 text-blue-600 animate-pulse" /> ผู้ช่วยร่างบทวิจารณ์ผลงานด้วย AI
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              กรอกจุดแข็งและส่วนที่พนักงานต้องปรับปรุงอย่างคร่าวๆ ระบบ AI (Gemini) จะช่วยสรุปเป็นบทวิเคราะห์ผลงานเชิงลึกที่มีความสร้างสรรค์ อบอุ่น สุภาพ และเพิ่มแรงบันลัดใจในการทำงานทันที
            </p>

            <form onSubmit={handleGenerateAIEval} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">เลือกพนักงานที่ต้องการประเมิน *</label>
                <select
                  value={aiEmpId}
                  onChange={(e) => setAiEmpId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:border-blue-500 text-xs bg-white"
                  required
                >
                  {employees.filter(e => e.status !== 'inactive').map(emp => (
                    <option key={emp.id} value={emp.id}>[{emp.id}] {emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">ชื่อผู้ประเมิน / ตนเอง</label>
                  <input
                    type="text"
                    value={aiEvaluator}
                    onChange={(e) => setAiEvaluator(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:border-blue-500 text-xs bg-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">คะแนนภาพรวม (1 - 5 ดาว)</label>
                  <select
                    value={aiScore}
                    onChange={(e) => setAiScore(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:border-blue-500 text-xs bg-white"
                  >
                    <option value="5">5 ดาว - ดีเลิศเหนือความคาดหมาย</option>
                    <option value="4">4 ดาว - ดีเยี่ยมเกินเกณฑ์มาตรฐาน</option>
                    <option value="3">3 ดาว - ดีตามเกณฑ์มาตรฐานปกติ</option>
                    <option value="2">2 ดาว - พอใช้ ต้องปรับปรุงเร่งด่วน</option>
                    <option value="1">1 ดาว - ไม่ดี ต่ำกว่าเกณฑ์มาก</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">จุดแข็ง / ความสำเร็จที่โดดเด่นในรอบนี้</label>
                <textarea
                  placeholder="เช่น ส่งงานพัฒนาผลิตภัณฑ์ได้เร็ว คุมทีมตรงเวลา มีความสัมพันธ์อันดีกับแผนกอื่น..."
                  value={aiStrengths}
                  onChange={(e) => setAiStrengths(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:border-blue-500 h-20 resize-none text-xs bg-white font-sans"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">จุดอ่อน / สิ่งที่ต้องปรับปรุงและฝึกฝนเพิ่มเติม</label>
                <textarea
                  placeholder="เช่น บางครั้งขาดความละเอียดรอบคอบในการเทส ควรหัดวิเคราะห์ทักษะความเป็นผู้นำเพิ่มเติม..."
                  value={aiImprovements}
                  onChange={(e) => setAiImprovements(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:border-blue-500 h-20 resize-none text-xs bg-white font-sans"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">เป้าหมายสำคัญในรอบถัดไป</label>
                <input
                  type="text"
                  placeholder="เช่น พัฒนาโปรเจกต์เสร็จตามไทม์ไลน์ และช่วยฝึกหัดสอนงานพนักงาน Junior"
                  value={aiGoals}
                  onChange={(e) => setAiGoals(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:border-blue-500 text-xs bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={aiLoading}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-mono font-bold uppercase tracking-wider rounded-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> ระบบกำลังวิเคราะห์และเรียบเรียงร่างประเมิน...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-blue-300" /> ประมวลผลและเรียบเรียงโดย AI
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Result Output Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-sm p-6 relative flex flex-col justify-between overflow-hidden">
            <div className="space-y-4 flex-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <FileText className="w-4 h-4 text-blue-600" /> ร่างข้อเสนอแนะบทประเมินโดย AI
              </h3>

              {aiLoading && (
                <div className="text-center py-28 space-y-3.5">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
                  <p className="text-xs text-slate-500 font-semibold animate-pulse font-sans">กำลังสแกนโครงสร้างพนักงานและเรียบเรียงบทความภาษาไทยที่สุภาพ...</p>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto font-sans">ใช้ระบบ LLM ระดับสูงเพื่อให้คำวิจารณ์เป็นเชิงบวกและพัฒนาศักยภาพบุคคลได้จริง</p>
                </div>
              )}

              {!aiLoading && !aiResult && (
                <div className="text-center py-28 border border-dashed border-slate-200 rounded-sm bg-white text-slate-400 text-xs">
                  <Bot className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  กรุณากรอกข้อมูลและคลิกสั่งงานผู้ช่วย AI ด้านซ้ายมือ
                </div>
              )}

              {!aiLoading && aiResult && (
                <div className="prose prose-xs max-h-[440px] overflow-y-auto bg-white border border-slate-200 p-5 rounded-sm text-slate-700 text-xs leading-relaxed space-y-4 font-sans">
                  <div className="markdown-body">
                    <Markdown>{aiResult}</Markdown>
                  </div>
                </div>
              )}
            </div>

            {aiResult && !aiLoading && (
              <div className="border-t border-slate-200 pt-4 mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setAiResult('')}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  เคลียร์ผลลัพธ์
                </button>
                <button
                  onClick={handleSaveAIEval}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-mono font-bold uppercase tracking-wider shadow-xs transition flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> บันทึกและสรุปการประเมิน
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual evaluation creation modal */}
      {isAddOpen && (
        <div id="add-eval-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-850 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                <Award className="w-5 h-5 text-blue-600" /> ลงบันทึกการประเมินด้วยตนเอง
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-sm">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitManualEval} className="space-y-3.5 text-xs text-slate-700">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">เลือกพนักงานที่ประเมิน *</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:border-blue-500 bg-white"
                  required
                >
                  {employees.filter(e => e.status !== 'inactive').map(emp => (
                    <option key={emp.id} value={emp.id}>[{emp.id}] {emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">ผู้ประเมิน</label>
                  <input
                    type="text"
                    value={evaluatorName}
                    onChange={(e) => setEvaluatorName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">รอบการประเมิน (เช่น H1 2026)</label>
                  <input
                    type="text"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">คะแนนความพึงพอใจ</label>
                <select
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="5">5/5 - ยอดเยี่ยมสูงสุด</option>
                  <option value="4">4/5 - ดีมากสูงกว่าเกณฑ์</option>
                  <option value="3">3/5 - ดีผ่านตามเกณฑ์ปกติ</option>
                  <option value="2">2/5 - พอใช้ ต้องพัฒนาเพิ่ม</option>
                  <option value="1">1/5 - ต่ำกว่าเกณฑ์มาก</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">จุดเด่น / จุดแข็งเด่นชัด</label>
                <textarea
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 h-14 resize-none bg-white font-sans"
                  required
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">จุดที่ควรปรับปรุง</label>
                <textarea
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 h-14 resize-none bg-white font-sans"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">เป้าหมายสำคัญ</label>
                <textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 h-14 resize-none bg-white font-sans"
                ></textarea>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-sm font-mono font-bold uppercase tracking-wider transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-mono font-bold uppercase tracking-wider shadow-xs transition"
                >
                  บันทึกแบบประเมิน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {viewEval && (
        <div id="view-eval-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-850 font-mono uppercase tracking-wider">เอกสารการประเมินระดับบุคคล</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{viewEval.period} • บันทึกเมื่อ {viewEval.date}</p>
              </div>
              <button onClick={() => setViewEval(null)} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-sm">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700 leading-relaxed max-h-[440px] overflow-y-auto pr-2">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-sm border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm leading-none">{viewEval.employeeName}</h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">{viewEval.role} • {viewEval.department}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-medium">คะแนนที่ได้</span>
                  <div className="flex items-center gap-0.5 text-amber-500 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < viewEval.score ? 'fill-amber-400 text-amber-500' : 'text-slate-200'}`} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-blue-50/40 rounded-sm border border-blue-200/50">
                  <span className="font-bold text-blue-900 block mb-1">💪 จุดเด่นและผลงานเด่นชัด</span>
                  <p className="text-slate-700 whitespace-pre-line font-sans">{viewEval.strengths}</p>
                </div>

                <div className="p-3 bg-amber-50/40 rounded-sm border border-amber-200/50">
                  <span className="font-bold text-amber-900 block mb-1">🛠️ ประเด็นที่พึงปรับปรุงเพิ่มเติม</span>
                  <p className="text-slate-700 whitespace-pre-line font-sans">{viewEval.improvements || '-'}</p>
                </div>

                <div className="p-3 bg-emerald-50/40 rounded-sm border border-emerald-200/50">
                  <span className="font-bold text-emerald-900 block mb-1">🎯 เป้าหมายเชิงกลยุทธ์ถัดไป</span>
                  <p className="text-slate-700 whitespace-pre-line font-sans">{viewEval.goals || '-'}</p>
                </div>

                {viewEval.comments && (
                  <div className="p-3 bg-slate-50 rounded-sm border border-slate-200">
                    <span className="font-bold text-slate-600 block mb-1 font-sans">✍️ ความเห็นเพิ่มเติมจาก {viewEval.evaluatorName}</span>
                    <p className="text-slate-600 whitespace-pre-line font-sans">{viewEval.comments}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 text-right">
              <button
                onClick={() => setViewEval(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-sm shadow-xs transition cursor-pointer"
              >
                ปิดเอกสาร
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
