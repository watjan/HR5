import React, { useState } from 'react';
import { JobPosting, Applicant } from '../types';
import { Briefcase, Users, Plus, Star, Mail, ArrowRight, Bot, Sparkles, Loader2, X, FileText, Check } from 'lucide-react';
import Markdown from 'react-markdown';

interface RecruitmentManagementProps {
  jobs: JobPosting[];
  applicants: Applicant[];
  onAddJob: (job: JobPosting) => void;
  onUpdateApplicantStage: (id: string, stage: Applicant['stage']) => void;
  onAddApplicant: (applicant: Applicant) => void;
}

export default function RecruitmentManagement({
  jobs,
  applicants,
  onAddJob,
  onUpdateApplicantStage,
  onAddApplicant
}: RecruitmentManagementProps) {
  // Navigation inside recruitment
  const [subTab, setSubTab] = useState<'positions' | 'pipeline' | 'ai-generator'>('positions');

  // New Job posting form
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDept, setJobDept] = useState('Engineering');
  const [jobType, setJobType] = useState<JobPosting['type']>('full-time');
  const [jobLoc, setJobLoc] = useState('Bangkok (Hybrid)');
  const [jobDesc, setJobDesc] = useState('');
  const [jobReqs, setJobReqs] = useState('');

  // AI Generator state
  const [aiTitle, setAiTitle] = useState('');
  const [aiDept, setAiDept] = useState('Engineering');
  const [aiReqs, setAiReqs] = useState('');
  const [aiTone, setAiTone] = useState('สุภาพ สุขุม และน่าดึงดูด');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');

  // Filter for pipeline
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || 'All');

  // Submit manual job
  const handleAddJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle || !jobDesc) return;

    const nextId = `JOB-${Date.now().toString().slice(-3)}`;
    const newJob: JobPosting = {
      id: nextId,
      title: jobTitle,
      department: jobDept,
      type: jobType,
      location: jobLoc,
      status: 'open',
      description: jobDesc,
      requirements: jobReqs.split('\n').filter(r => r.trim() !== ''),
      applicantsCount: 0
    };

    onAddJob(newJob);
    setIsAddJobOpen(false);
    setSubTab('positions');
  };

  // Run AI Generation
  const handleGenerateAIJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTitle) return;

    setAiLoading(true);
    setAiResult('');

    try {
      const response = await fetch('/api/ai/job-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: aiTitle,
          department: aiDept,
          requirements: aiReqs,
          tone: aiTone
        })
      });

      if (!response.ok) {
        throw new Error('ระบบเซิร์ฟเวอร์ AI ขัดข้องชั่วคราว');
      }

      const data = await response.json();
      setAiResult(data.text);
    } catch (err: any) {
      alert(err.message || 'เกิดข้อผิดพลาดในการสร้างข้อมูล');
    } finally {
      setAiLoading(false);
    }
  };

  // Save generated AI JD to job openings
  const handleSaveGeneratedJob = () => {
    if (!aiResult || !aiTitle) return;

    const nextId = `JOB-${Date.now().toString().slice(-3)}`;
    const newJob: JobPosting = {
      id: nextId,
      title: aiTitle,
      department: aiDept,
      type: 'full-time',
      location: 'Bangkok (Hybrid)',
      status: 'open',
      description: `คำอธิบายตำแหน่งที่ได้รับการออกแบบโดยระบบปัญญาประดิษฐ์ (AI Copilot) มีความสมบูรณ์แบบในการสรรหา`,
      requirements: aiReqs ? aiReqs.split('\n').filter(r => r.trim() !== '') : ["ตามคำระบุส่วนตัวของระบบ AI"],
      applicantsCount: 0
    };

    onAddJob(newJob);
    alert('บันทึกตำแหน่งงาน AI เข้าสู่รายชื่อตำแหน่งงานหลักสำเร็จ!');
    setSubTab('positions');
  };

  // Pipeline stages definitions
  const PIPELINE_STAGES: { id: Applicant['stage']; name: string; color: string }[] = [
    { id: 'applied', name: 'ผู้สมัครใหม่ (Applied)', color: 'bg-blue-500' },
    { id: 'interviewing', name: 'สัมภาษณ์ (Interview)', color: 'bg-amber-500' },
    { id: 'offered', name: 'ส่งข้อเสนอ (Offered)', color: 'bg-emerald-500' },
    { id: 'rejected', name: 'ไม่ผ่านเกณฑ์ (Rejected)', color: 'bg-slate-500' }
  ];

  return (
    <div id="recruitment-management-container" className="space-y-6">
      {/* Tab Header Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-2">
        <div>
          <h2 className="text-xl font-light text-slate-900">สรรหาบุคลากรและจัดการผู้สมัคร (Recruitment Tracker)</h2>
          <p className="text-xs text-slate-500 mt-1 font-sans">ประกาศรับสมัคร ติดตามสถานะผู้สมัครในท่อ และเขียนประกาศด้วยปัญญาประดิษฐ์</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-sm self-stretch md:self-auto text-xs font-mono font-bold uppercase tracking-wider">
          <button
            onClick={() => setSubTab('positions')}
            className={`px-3 py-1.5 rounded-sm transition ${subTab === 'positions' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            ตำแหน่งงานเปิดรับ
          </button>
          <button
            onClick={() => setSubTab('pipeline')}
            className={`px-3 py-1.5 rounded-sm transition ${subTab === 'pipeline' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            คัดเลือกผู้สมัคร
          </button>
          <button
            onClick={() => setSubTab('ai-generator')}
            className={`px-3 py-1.5 rounded-sm transition flex items-center gap-1.5 ${subTab === 'ai-generator' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> สร้าง JD ด้วย AI
          </button>
        </div>
      </div>

      {/* SUB TAB 1: Position List */}
      {subTab === 'positions' && (
        <div id="positions-tab" className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">ตำแหน่งงานที่กำลังรับสมัคร ({jobs.length})</span>
            <button
              id="open-job-modal-btn"
              onClick={() => setIsAddJobOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition"
            >
              <Plus className="w-3.5 h-3.5" /> เพิ่มตำแหน่งงานรับสมัคร
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map(job => (
              <div key={job.id} className="bg-white border border-slate-200 rounded-sm p-5 hover:shadow-md transition flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-sm tracking-wide uppercase font-mono">{job.department}</span>
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold border ${
                      job.status === 'open' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>
                      {job.status === 'open' ? 'เปิดรับสมัคร' : 'ปิดรับแล้ว'}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm leading-tight">{job.title}</h3>
                  <div className="flex gap-4 text-slate-400 text-xs font-medium font-mono">
                    <span>{job.type === 'full-time' ? 'งานประจำ' : job.type}</span>
                    <span>•</span>
                    <span>{job.location}</span>
                  </div>
                  <p className="text-slate-600 text-xs line-clamp-3 leading-relaxed">{job.description}</p>
                </div>

                <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" /> มีผู้สมัครส่งประวัติแล้ว <strong className="font-mono text-slate-700">{
                      applicants.filter(a => a.jobId === job.id).length
                    } คน</strong>
                  </span>
                  <button
                    onClick={() => { setSelectedJobId(job.id); setSubTab('pipeline'); }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 group font-mono uppercase tracking-wider"
                  >
                    ดูขั้นตอนคัดเลือก <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB TAB 2: Applicant pipeline */}
      {subTab === 'pipeline' && (
        <div id="pipeline-tab" className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-400 block font-mono uppercase tracking-wider">คัดกรองผู้สมัครในตำแหน่ง:</span>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="font-bold text-slate-800 text-sm border-0 border-b-2 border-blue-500 focus:outline-none focus:ring-0 bg-white pr-8 py-1 mt-1 cursor-pointer"
              >
                <option value="All">ผู้สมัครจากทุกตำแหน่งงานทั้งหมด</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>{job.title}</option>
                ))}
              </select>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              *คุณสามารถเลื่อนสถานะผู้สมัครได้รวดเร็วเพียงกดปุ่มควบคุมที่รูปใบสมัคร
            </div>
          </div>

          {/* Kanban board column grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {PIPELINE_STAGES.map(stage => {
              const stageApplicants = applicants.filter(app => {
                const matchesJob = selectedJobId === 'All' || app.jobId === selectedJobId;
                return matchesJob && app.stage === stage.id;
              });

              return (
                <div key={stage.id} className="bg-slate-50 border border-slate-200 rounded-sm p-4 space-y-3.5 min-h-[400px]">
                  {/* Column Header */}
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${stage.color}`}></div>
                      <span className="text-xs font-bold text-slate-700 font-sans">{stage.name}</span>
                    </div>
                    <span className="text-xs font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-sm">
                      {stageApplicants.length}
                    </span>
                  </div>

                  {/* Applicant cards inside column */}
                  <div className="space-y-3">
                    {stageApplicants.length === 0 ? (
                      <div className="text-center py-10 border border-dashed border-slate-200 rounded-sm bg-white/50 text-slate-400 text-[11px] font-sans">
                        ไม่มีรายชื่อผู้สมัครในห้องนี้
                      </div>
                    ) : (
                      stageApplicants.map(app => (
                        <div key={app.id} className="bg-white border border-slate-200 rounded-sm p-3.5 shadow-xs space-y-2 hover:shadow-md transition">
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{app.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{app.email}</p>
                          </div>
                          <div className="bg-slate-50 p-1.5 rounded-sm text-[10px] text-slate-500 font-sans">
                            <strong>ตำแหน่ง:</strong> {app.jobTitle}
                          </div>
                          
                          {/* Rating and skills */}
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < app.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                            ))}
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {app.skills.map((s, idx) => (
                              <span key={idx} className="bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0.5 rounded-sm font-mono font-bold uppercase tracking-wide">{s}</span>
                            ))}
                          </div>

                          {/* Quick stage controls inside card */}
                          <div className="border-t border-slate-200 pt-2 flex justify-between gap-1">
                            {stage.id !== 'applied' && (
                              <button
                                onClick={() => onUpdateApplicantStage(app.id, stage.id === 'interviewing' ? 'applied' : stage.id === 'offered' ? 'interviewing' : 'offered')}
                                className="px-1.5 py-0.5 border border-slate-200 text-[9px] rounded-sm hover:bg-slate-50 text-slate-500 transition font-mono font-bold"
                              >
                                ย้อนกลับ
                              </button>
                            )}
                            <div className="flex-1"></div>
                            {stage.id !== 'offered' && stage.id !== 'rejected' && (
                              <button
                                onClick={() => onUpdateApplicantStage(app.id, stage.id === 'applied' ? 'interviewing' : 'offered')}
                                className="px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[9px] rounded-sm font-mono font-bold transition ml-auto uppercase tracking-wide"
                              >
                                ผ่านด่านถัดไป
                              </button>
                            )}
                            {stage.id !== 'rejected' && (
                              <button
                                onClick={() => onUpdateApplicantStage(app.id, 'rejected')}
                                className="px-1.5 py-0.5 border border-rose-200 hover:bg-rose-50 text-rose-600 text-[9px] rounded-sm font-mono font-bold transition uppercase tracking-wide"
                              >
                                ปฏิเสธ
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB TAB 3: AI Job Description Generator */}
      {subTab === 'ai-generator' && (
        <div id="ai-generator-tab" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs Section */}
          <div className="bg-white border border-slate-200 rounded-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <Bot className="w-4 h-4 text-blue-600 animate-pulse" /> เครื่องมือช่วยออกแบบลักษณะงานด้วย AI
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              เพียงกรอกชื่อตำแหน่งงานสั้นๆ ฝ่ายงาน และความต้องการทักษะเด่นๆ ระบบปัญญาประดิษฐ์ (Gemini AI 3.5 Flash) จะช่วยสร้างเนื้อหา Job Description ภาษาไทยที่ถูกต้อง สวยงาม และดึงดูดใจทันที
            </p>

            <form onSubmit={handleGenerateAIJob} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">ตำแหน่งงานที่กำลังเปิดหา *</label>
                <input
                  type="text"
                  placeholder="เช่น Senior Frontend Engineer (React/Tailwind)"
                  value={aiTitle}
                  onChange={(e) => setAiTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:border-blue-500 text-xs bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">แผนก / ฝ่ายงาน</label>
                  <select
                    value={aiDept}
                    onChange={(e) => setAiDept(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:border-blue-500 text-xs bg-white"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product Design">Product Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Sales">Sales</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">สไตล์โทนประกาศ</label>
                  <input
                    type="text"
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:border-blue-500 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">ทักษะสำคัญที่พนักงานต้องมี (ความต้องการเบื้องต้น)</label>
                <textarea
                  placeholder="เช่น ประสบการณ์พัฒนา React อย่างน้อย 3 ปี, เข้าใจเรื่อง REST API, มีวินัยสูง และทำงานแบบรีโมท/ไฮบริดได้ดี..."
                  value={aiReqs}
                  onChange={(e) => setAiReqs(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:border-blue-500 h-24 resize-none text-xs bg-white font-sans"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={aiLoading}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-mono font-bold uppercase tracking-wider text-xs rounded-sm shadow-xs transition flex items-center justify-center gap-2"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> ระบบกำลังเรียบเรียงประกาศคำบรรยายด้วย AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-blue-300" /> เริ่มกระบวนการสร้างเนื้อหาด้วย AI
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Result Output Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-sm p-6 relative flex flex-col justify-between overflow-hidden">
            <div className="space-y-4 flex-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <FileText className="w-4 h-4 text-blue-600" /> ผลลัพธ์ลักษณะงานที่ร่างขึ้นโดย AI
              </h3>

              {aiLoading && (
                <div className="text-center py-24 space-y-3.5">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
                  <p className="text-xs text-slate-500 font-semibold animate-pulse font-sans">กำลังสแกนโครงสร้างและสร้างสรรค์ข้อมูลสำหรับ HR ประจำปี 2026...</p>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto font-sans">ระบบใช้เวลาประมาณ 3-5 วินาทีในการส่งข้อมูลกลับมาจากเซิร์ฟเวอร์หลัก</p>
                </div>
              )}

              {!aiLoading && !aiResult && (
                <div className="text-center py-24 border-2 border-dashed border-slate-200 rounded-sm bg-white text-slate-400 text-xs">
                  <Bot className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  กรุณากรอกข้อมูลด่านซ้ายแล้วสั่งทำงาน AI เพื่อดูผลลัพธ์ที่นี่
                </div>
              )}

              {!aiLoading && aiResult && (
                <div className="prose prose-xs max-h-[420px] overflow-y-auto bg-white border border-slate-200 p-5 rounded-sm text-slate-700 text-xs leading-relaxed space-y-4">
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
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition"
                >
                  เคลียร์ผลลัพธ์
                </button>
                <button
                  onClick={handleSaveGeneratedJob}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-mono font-bold uppercase tracking-wider shadow-xs transition flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> บันทึกและนำไปเปิดรับสมัครทันที
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Slide/Over modal for adding manual Job */}
      {isAddJobOpen && (
        <div id="add-job-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-850 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                <Briefcase className="w-5 h-5 text-blue-600" /> เปิดประกาศรับสมัครงานตำแหน่งใหม่
              </h3>
              <button onClick={() => setIsAddJobOpen(false)} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-sm">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddJobSubmit} className="space-y-3.5 text-xs text-slate-700">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">ชื่อตำแหน่งงาน *</label>
                <input
                  type="text"
                  placeholder="เช่น Senior Web Developer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">ฝ่ายงาน / แผนก</label>
                  <select
                    value={jobDept}
                    onChange={(e) => setJobDept(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product Design">Product Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Sales">Sales</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">รูปแบบสัญญางาน</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="full-time">งานประจำ (Full-time)</option>
                    <option value="part-time">งานพาร์ทไทม์ (Part-time)</option>
                    <option value="contract">สัญญาจ้าง (Contract)</option>
                    <option value="internship">นักศึกษาฝึกงาน (Internship)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">สถานที่ทำงาน</label>
                <input
                  type="text"
                  value={jobLoc}
                  onChange={(e) => setJobLoc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">รายละเอียดของงาน (Description) *</label>
                <textarea
                  placeholder="เขียนบรรยายภารกิจ ความสำคัญของบทบาทงาน..."
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 h-20 resize-none bg-white font-sans"
                  required
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">คุณสมบัติผู้สมัคร (บรรทัดละ 1 ข้อ)</label>
                <textarea
                  placeholder="วุฒิการศึกษาระดับปริญญาตรี\nประสบการณ์อย่างน้อย 3 ปี\nสามารถทำงานไฮบริดได้"
                  value={jobReqs}
                  onChange={(e) => setJobReqs(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 h-20 resize-none font-mono text-[11px] bg-white"
                ></textarea>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddJobOpen(false)}
                  className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-sm font-mono font-bold uppercase tracking-wider transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-mono font-bold uppercase tracking-wider shadow-xs transition"
                >
                  ลงทะเบียนประกาศงาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
