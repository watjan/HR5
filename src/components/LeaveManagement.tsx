import React, { useState } from 'react';
import { LeaveRequest, Employee } from '../types';
import { Calendar, Plus, Check, X, ClipboardList, Info, Users, UserCheck, Pencil, Trash2, AlertTriangle } from 'lucide-react';

interface LeaveManagementProps {
  leaves: LeaveRequest[];
  employees: Employee[];
  onAddLeaveRequest: (request: LeaveRequest) => void;
  onApproveLeave: (id: string) => void;
  onRejectLeave: (id: string) => void;
  onEditLeaveRequest: (request: LeaveRequest) => void;
  onDeleteLeaveRequest: (id: string) => void;
}

export default function LeaveManagement({
  leaves,
  employees,
  onAddLeaveRequest,
  onApproveLeave,
  onRejectLeave,
  onEditLeaveRequest,
  onDeleteLeaveRequest
}: LeaveManagementProps) {
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'All' | 'pending' | 'approved' | 'rejected'>('All');

  // Editing and Deleting target states
  const [editingLeave, setEditingLeave] = useState<LeaveRequest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeaveRequest | null>(null);

  // Request form fields
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [leaveType, setLeaveType] = useState<'sick' | 'personal' | 'annual' | 'other'>('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [days, setDays] = useState(1);
  const [reason, setReason] = useState('');
  const [formStatus, setFormStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // Calculations
  const pendingLeaves = leaves.filter(l => l.status === 'pending');
  const approvedLeaves = leaves.filter(l => l.status === 'approved');
  const totalOnLeaveToday = employees.filter(e => e.status === 'on-leave').length;

  const filteredLeaves = leaves.filter(leave => {
    if (statusFilter === 'All') return true;
    return leave.status === statusFilter;
  });

  const handleOpenRequestModal = () => {
    setIsRequestOpen(true);
    setEditingLeave(null);
    setSelectedEmpId(employees[0]?.id || '');
    setLeaveType('annual');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setDays(1);
    setReason('');
    setFormStatus('pending');
  };

  const handleStartEdit = (leave: LeaveRequest) => {
    setEditingLeave(leave);
    setSelectedEmpId(leave.employeeId);
    setLeaveType(leave.type);
    setStartDate(leave.startDate);
    setEndDate(leave.endDate);
    setDays(leave.days);
    setReason(leave.reason);
    setFormStatus(leave.status);
    setIsRequestOpen(true);
  };

  const handleCloseModal = () => {
    setIsRequestOpen(false);
    setEditingLeave(null);
    setSelectedEmpId('');
    setLeaveType('annual');
    setStartDate('');
    setEndDate('');
    setDays(1);
    setReason('');
    setFormStatus('pending');
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !startDate || !endDate || !reason) return;

    const emp = employees.find(e => e.id === selectedEmpId);
    if (!emp) return;

    if (editingLeave) {
      const updatedRequest: LeaveRequest = {
        ...editingLeave,
        employeeId: selectedEmpId,
        employeeName: emp.name,
        type: leaveType,
        startDate,
        endDate,
        days: Number(days),
        reason,
        status: formStatus
      };
      onEditLeaveRequest(updatedRequest);
    } else {
      const newRequest: LeaveRequest = {
        id: `LV-${Date.now().toString().slice(-4)}`,
        employeeId: selectedEmpId,
        employeeName: emp.name,
        type: leaveType,
        startDate,
        endDate,
        days: Number(days),
        reason,
        status: 'pending',
        appliedDate: new Date().toISOString().split('T')[0]
      };
      onAddLeaveRequest(newRequest);
    }

    handleCloseModal();
  };

  return (
    <div id="leave-management-container" className="space-y-6">
      {/* Header and top action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-light text-slate-900">จัดการสิทธิ์และคำร้องขอลางาน (Leave Management)</h2>
          <p className="text-xs text-slate-500 mt-1 font-sans">ติดตามคำขอหยุดงานประเภทต่างๆ ประมวลผล และอัปเดตสิทธิ์วันลาสะสม</p>
          <div className="flex items-center gap-1.5 mt-2 bg-emerald-50 text-emerald-850 border border-emerald-100 rounded-sm px-2.5 py-1 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[10px] font-mono font-bold tracking-wide">ดึงข้อมูลและบันทึกตรงไปยัง Google Cloud Firebase Firestore [Real-time Live]</span>
          </div>
        </div>
        <button
          id="open-leave-request-modal-btn"
          onClick={handleOpenRequestModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-sm shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> ส่งคำขอลางานใหม่
        </button>
      </div>

      {/* Leave Stats Cards */}
      <div id="leave-stats-cards" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-sm p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-sm text-amber-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">คำขอรอดำเนินการ</h3>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{pendingLeaves.length} รายการ</p>
            <p className="text-[10px] text-slate-500 font-sans">รอฝ่ายบุคคลตรวจสอบและอนุมัติ</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-sm p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-sm text-emerald-600">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">พนักงานลางานวันนี้</h3>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{totalOnLeaveToday} คน</p>
            <p className="text-[10px] text-slate-500 font-sans">สถานะขึ้นว่า On Leave ในประวัติ</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-sm p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-sm text-blue-600">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">อนุมัติเสร็จสิ้นแล้ว</h3>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{approvedLeaves.length} รายการ</p>
            <p className="text-[10px] text-slate-500 font-sans">ผ่านการอนุมัติสิทธิ์และหักวันลาแล้ว</p>
          </div>
        </div>
      </div>

      {/* Leave Admin Approvals Board */}
      {pendingLeaves.length > 0 && (
        <div id="leave-approvals-board" className="bg-amber-50/40 border border-amber-200/60 rounded-sm p-6">
          <h3 className="text-xs font-bold text-amber-900 flex items-center gap-1.5 mb-4 font-mono uppercase tracking-widest">
            <Info className="w-4 h-4 text-amber-700 animate-pulse" /> ตารางอนุมัติคำขอขอลางานสำหรับฝ่ายบุคคล ({pendingLeaves.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingLeaves.map(req => (
              <div key={req.id} id={`approval-card-${req.id}`} className="bg-white border border-amber-200/50 rounded-sm p-4 shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-none">{req.employeeName}</h4>
                    <span className="text-[10px] text-slate-400 block mt-1 font-mono">{req.employeeId}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-sm ${
                      req.type === 'sick' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                      req.type === 'personal' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      req.type === 'annual' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                      'bg-slate-50 text-slate-700'
                    }`}>
                      {req.type === 'sick' ? 'ลาป่วย' :
                       req.type === 'personal' ? 'ลากิจ' :
                       req.type === 'annual' ? 'ลาพักร้อน' : 'อื่นๆ'}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleStartEdit(req)}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-sm transition cursor-pointer"
                        title="แก้ไขใบลา"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(req)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-sm transition cursor-pointer"
                        title="ลบใบลา"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-600 space-y-1 bg-slate-50/50 p-2.5 rounded-sm border border-slate-200">
                  <p>ช่วงเวลา: <strong className="text-slate-800">{req.startDate}</strong> ถึง <strong className="text-slate-800">{req.endDate}</strong></p>
                  <p>จำนวนวันลา: <strong className="text-slate-900 font-bold">{req.days} วัน</strong></p>
                  <p className="mt-1 border-t border-slate-200/60 pt-1 italic text-slate-500 font-sans">&ldquo;{req.reason}&rdquo;</p>
                </div>
                <div className="flex gap-2">
                  <button
                    id={`deny-btn-${req.id}`}
                    onClick={() => onRejectLeave(req.id)}
                    className="flex-1 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> ปฏิเสธ
                  </button>
                  <button
                    id={`approve-btn-${req.id}`}
                    onClick={() => onApproveLeave(req.id)}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-xs font-mono font-bold uppercase tracking-wider shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> อนุมัติสิทธิ์
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Leave History table */}
      <div id="leaves-history-card" className="bg-white border border-slate-200 rounded-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-slate-50">
          <span className="text-xs font-bold text-slate-400 tracking-widest font-mono uppercase">ประวัติการขอลางานพนักงาน</span>
          <div className="flex gap-1">
            {(['All', 'pending', 'approved', 'rejected'] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1 rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                  statusFilter === f 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f === 'All' ? 'ทั้งหมด' :
                 f === 'pending' ? 'รออนุมัติ' :
                 f === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว'}
              </button>
            ))}
          </div>
        </div>

        {filteredLeaves.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium">ไม่พบประวัติการขอลางานตามกลุ่มที่เลือก</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/30">
                  <th className="py-3 px-6">ชื่อพนักงาน</th>
                  <th className="py-3 px-6">ประเภทการลา</th>
                  <th className="py-3 px-6">ระยะเวลา</th>
                  <th className="py-3 px-6">เหตุผลการลา</th>
                  <th className="py-3 px-6">สถานะ</th>
                  <th className="py-3 px-6 text-right">วันที่ยื่นเรื่อง</th>
                  <th className="py-3 px-6 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredLeaves.map(leave => (
                  <tr key={leave.id} id={`leave-row-${leave.id}`} className="hover:bg-slate-50/40 transition">
                    <td className="py-3.5 px-6">
                      <p className="font-semibold text-slate-900 leading-none">{leave.employeeName}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">{leave.employeeId}</p>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`text-xs font-medium ${
                        leave.type === 'sick' ? 'text-rose-600' :
                        leave.type === 'personal' ? 'text-amber-600' :
                        leave.type === 'annual' ? 'text-blue-600' : 'text-slate-600'
                      }`}>
                        {leave.type === 'sick' ? 'ลาป่วย' :
                         leave.type === 'personal' ? 'ลากิจ' :
                         leave.type === 'annual' ? 'ลาพักร้อน' : 'อื่นๆ'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <p className="font-semibold text-slate-800 leading-none">{leave.days} วัน</p>
                      <p className="text-xs text-slate-400 mt-1">{leave.startDate} - {leave.endDate}</p>
                    </td>
                    <td className="py-3.5 px-6 max-w-xs truncate" title={leave.reason}>
                      {leave.reason}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-semibold ${
                        leave.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        leave.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {leave.status === 'approved' ? 'อนุมัติแล้ว' :
                         leave.status === 'pending' ? 'รอพิจารณา' : 'ปฏิเสธ'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right text-xs text-slate-400 font-mono">
                      {leave.appliedDate}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <div className="flex justify-center items-center gap-1.5">
                        <button
                          onClick={() => handleStartEdit(leave)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-sm transition cursor-pointer"
                          title="แก้ไขใบลา"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(leave)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-sm transition cursor-pointer"
                          title="ลบใบลา"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide dialog to submit or edit leave request */}
      {isRequestOpen && (
        <div id="leave-request-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-850 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                <Calendar className="w-5 h-5 text-blue-600" /> 
                {editingLeave ? 'แก้ไขเรื่องขอลางาน' : 'ยื่นเรื่องขอลางานใหม่'}
              </h3>
              <button onClick={handleCloseModal} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-sm cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs text-slate-700">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">เลือกพนักงานที่ต้องการยื่นลางาน</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:border-blue-500 bg-white"
                  required
                >
                  {employees.filter(e => e.status !== 'inactive').map(emp => (
                    <option key={emp.id} value={emp.id}>
                      [{emp.id}] {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>

              {editingLeave && (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">สถานะคำขอลา</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'pending' | 'approved' | 'rejected')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:border-blue-500 bg-white font-mono"
                    required
                  >
                    <option value="pending">รอพิจารณา (Pending)</option>
                    <option value="approved">อนุมัติแล้ว (Approved)</option>
                    <option value="rejected">ปฏิเสธแล้ว (Rejected)</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">ประเภทการลางาน</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['sick', 'personal', 'annual', 'other'] as const).map(type => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setLeaveType(type)}
                      className={`py-2 text-center rounded-sm border text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                        leaveType === type 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600 bg-white'
                      }`}
                    >
                      {type === 'sick' ? 'ลาป่วย' :
                       type === 'personal' ? 'ลากิจ' :
                       type === 'annual' ? 'ลาพักร้อน' : 'อื่นๆ'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">ตั้งแต่วันที่</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:border-blue-500 bg-white font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">ถึงวันที่</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:border-blue-500 bg-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">จำนวนวันลาทั้งหมด</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:border-blue-500 bg-white font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">เหตุผลการลางาน / คำอธิบายเพิ่มเติม</label>
                <textarea
                  placeholder="เช่น มีไข้สูง ปวดหัวตัวร้อน แพทย์แนะนำให้พักฟื้นดูอาการ..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:border-blue-500 h-20 resize-none text-xs bg-white font-sans"
                  required
                ></textarea>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-sm font-mono font-bold uppercase tracking-wider transition cursor-pointer bg-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-mono font-bold uppercase tracking-wider shadow-xs transition cursor-pointer"
                >
                  {editingLeave ? 'บันทึกการแก้ไข' : 'ยื่นคำร้องสำเร็จ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteTarget && (
        <div id="leave-delete-confirmation-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 max-w-sm w-full p-6 shadow-xl space-y-4">
            
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-sm shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans">
                  ยืนยันการลบคำขอลางาน
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-sans">
                  คุณแน่ใจหรือไม่ว่าต้องการลบคำขอลางานนี้? ระบบจะลบประวัตินี้อย่างถาวรและคืนสิทธิ์วันลาสะสมให้กับพนักงานหากได้รับการอนุมัติไปแล้ว
                </p>
              </div>
            </div>

            {/* Target info card */}
            <div className="bg-slate-50 p-3 rounded-sm text-xs font-sans space-y-1 border border-slate-100 text-left">
              <div className="flex justify-between font-mono text-[10px] text-slate-400">
                <span>เลขใบลา: {deleteTarget.id}</span>
                <span>ประเภท: {
                  deleteTarget.type === 'sick' ? 'ลาป่วย' :
                  deleteTarget.type === 'personal' ? 'ลากิจ' :
                  deleteTarget.type === 'annual' ? 'ลาพักร้อน' : 'อื่นๆ'
                }</span>
              </div>
              <p className="font-bold text-slate-880">{deleteTarget.employeeName}</p>
              <p className="font-sans text-slate-600">เหตุผล: &ldquo;{deleteTarget.reason}&rdquo;</p>
              <p className="text-[10px] font-mono text-slate-500">จำนวนวันลา: {deleteTarget.days} วัน ({deleteTarget.startDate} ถึง {deleteTarget.endDate})</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-sm font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer bg-white"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteLeaveRequest(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-sm font-mono text-xs font-bold uppercase tracking-wider shadow-xs transition cursor-pointer"
              >
                ยืนยันการลบ
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
