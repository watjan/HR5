import { useState, useEffect, useCallback } from 'react';
import { safeStorage } from '../lib/safeStorage';
import { PartnerCheque, PartnerCompany } from '../types';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Building2, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Trash2,
  Pencil,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Volume2,
  VolumeX
} from 'lucide-react';

interface PartnerChequeManagementProps {
  cheques: PartnerCheque[];
  onAddCheque: (cheque: PartnerCheque) => void;
  onUpdateChequeStatus: (id: string, status: PartnerCheque['status']) => void;
  onDeleteCheque: (id: string) => void;
  onEditCheque: (cheque: PartnerCheque) => void;
  partners?: PartnerCompany[];
  onAddPartner?: (partner: PartnerCompany) => void;
}

const THAI_BANKS = [
  "ธนาคารกสิกรไทย (KBANK)",
  "ธนาคารไทยพาณิชย์ (SCB)",
  "ธนาคารกรุงเทพ (BBL)",
  "ธนาคารกรุงไทย (KTB)",
  "ธนาคารทหารไทยธนชาต (TTB)",
  "ธนาคารกรุงศรีอยุธยา (BAY)",
  "ธนาคารออมสิน (GSB)",
  "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (BAAC)",
  "ธนาคารยูโอบี (UOB)",
  "ธนาคารแลนด์ แอนด์ เฮ้าส์ (LH Bank)"
];

export default function PartnerChequeManagement({
  cheques,
  onAddCheque,
  onUpdateChequeStatus,
  onDeleteCheque,
  onEditCheque,
  partners = [],
  onAddPartner
}: PartnerChequeManagementProps) {
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
  const playNotificationSound = useCallback(() => {
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
  }, [soundEnabled]);

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

  // Play warning sound if there are any overdue cheques on component mount / tab active
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const hasOverdue = cheques.some(c => c.status === 'pending' && c.dueDate <= todayStr);
    if (hasOverdue) {
      // Small timeout to allow user interaction context
      const timer = setTimeout(() => {
        playNotificationSound();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [cheques, playNotificationSound]);

  // Tabs and general filters
  const [activeTab, setActiveTab] = useState<'all' | 'receivable' | 'payable'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [bankFilter, setBankFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, bankFilter, statusFilter, activeTab]);

  // Modal registration form state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCheque, setEditingCheque] = useState<PartnerCheque | null>(null);
  
  // Custom delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<PartnerCheque | null>(null);

  // Add partner state
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [partnerFormName, setPartnerFormName] = useState('');
  const [partnerFormTaxId, setPartnerFormTaxId] = useState('');
  const [partnerFormAddress, setPartnerFormAddress] = useState('');
  const [partnerFormContact, setPartnerFormContact] = useState('');
  const [partnerFormPhone, setPartnerFormPhone] = useState('');
  const [partnerFormEmail, setPartnerFormEmail] = useState('');
  const [partnerFormNotes, setPartnerFormNotes] = useState('');

  const handleAddPartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerFormName.trim()) {
      alert("กรุณาระบุชื่อบริษัทคู่ค้า");
      return;
    }

    const newPartner: PartnerCompany = {
      id: `PTN-${Date.now().toString().slice(-4)}`,
      name: partnerFormName,
      taxId: partnerFormTaxId || undefined,
      address: partnerFormAddress || undefined,
      contactPerson: partnerFormContact || undefined,
      phone: partnerFormPhone || undefined,
      email: partnerFormEmail || undefined,
      notes: partnerFormNotes || undefined
    };

    if (onAddPartner) {
      onAddPartner(newPartner);
    }
    
    // Auto select newly created partner
    setFormPartnerName(partnerFormName);
    
    // Reset and close
    setPartnerFormName('');
    setPartnerFormTaxId('');
    setPartnerFormAddress('');
    setPartnerFormContact('');
    setPartnerFormPhone('');
    setPartnerFormEmail('');
    setPartnerFormNotes('');
    setIsAddPartnerOpen(false);
  };

  const [formType, setFormType] = useState<'receivable' | 'payable'>('receivable');
  const [formChequeNumber, setFormChequeNumber] = useState('');
  const [formBank, setFormBank] = useState('');
  const [formPartnerName, setFormPartnerName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDueDate, setFormDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');

  const handleStartEdit = (cheque: PartnerCheque) => {
    setEditingCheque(cheque);
    setFormType(cheque.type);
    setFormChequeNumber(cheque.chequeNumber);
    setFormBank(cheque.bank);
    setFormPartnerName(cheque.partnerName);
    setFormAmount(cheque.amount.toString());
    setFormDueDate(cheque.dueDate);
    setFormNotes(cheque.notes || '');
    setIsAddOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddOpen(false);
    setEditingCheque(null);
    setFormChequeNumber('');
    setFormBank('');
    setFormPartnerName('');
    setFormAmount('');
    setFormNotes('');
    setFormDueDate(new Date().toISOString().split('T')[0]);
  };

  // Calculations for financial stats cards
  const totalReceivables = cheques
    .filter(c => c.type === 'receivable')
    .reduce((sum, c) => sum + c.amount, 0);

  const pendingReceivables = cheques
    .filter(c => c.type === 'receivable' && c.status === 'pending')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalPayables = cheques
    .filter(c => c.type === 'payable')
    .reduce((sum, c) => sum + c.amount, 0);

  const pendingPayables = cheques
    .filter(c => c.type === 'payable' && c.status === 'pending')
    .reduce((sum, c) => sum + c.amount, 0);

  // Filter logic
  const filteredCheques = cheques.filter(c => {
    const matchesTab = activeTab === 'all' || c.type === activeTab;
    const matchesSearch = c.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.chequeNumber.includes(searchTerm) ||
                          (c.notes && c.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesBank = bankFilter === 'all' || c.bank === bankFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesTab && matchesSearch && matchesBank && matchesStatus;
  });

  // Sort cheques: "เลขที่เช็ค เรียงใหม่ไปเก่า" (Cheque numbers from newest/highest to oldest/lowest)
  const sortedCheques = [...filteredCheques].sort((a, b) => {
    // If they are purely numbers (or can be extracted as numeric), compare numerically
    const numA = parseInt(a.chequeNumber.replace(/\D/g, ''), 10);
    const numB = parseInt(b.chequeNumber.replace(/\D/g, ''), 10);
    if (!isNaN(numA) && !isNaN(numB)) {
      if (numB !== numA) {
        return numB - numA;
      }
    }
    // Fallback 1: Sort by Due Date descending (latest due date first)
    if (b.dueDate !== a.dueDate) {
      return b.dueDate.localeCompare(a.dueDate);
    }
    // Fallback 2: Lexical sorting descending
    return b.chequeNumber.localeCompare(a.chequeNumber);
  });

  // Pagination calculations (10 items per page)
  const totalItems = sortedCheques.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCheques = sortedCheques.slice(startIndex, startIndex + itemsPerPage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formChequeNumber || !formBank || !formPartnerName || !formAmount || !formDueDate) {
      alert("กรุณากรอกข้อมูลสำคัญให้ครบถ้วน");
      return;
    }

    if (editingCheque) {
      const updatedCheque: PartnerCheque = {
        ...editingCheque,
        type: formType,
        chequeNumber: formChequeNumber,
        bank: formBank,
        partnerName: formPartnerName,
        amount: parseFloat(formAmount),
        dueDate: formDueDate,
        notes: formNotes
      };
      onEditCheque(updatedCheque);
    } else {
      const newCheque: PartnerCheque = {
        id: `CHQ-${Date.now().toString().slice(-4)}`,
        type: formType,
        chequeNumber: formChequeNumber,
        bank: formBank,
        partnerName: formPartnerName,
        amount: parseFloat(formAmount),
        dueDate: formDueDate,
        issueDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        notes: formNotes
      };
      onAddCheque(newCheque);
    }

    handleCloseModal();
  };

  return (
    <div className="space-y-6">
      
      {/* Header section with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-light text-slate-900">ทะเบียนเช็คจ่ายคู่ค้า & เช็ครับลูกค้า (Cheque Registry)</h2>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            ระบบบันทึกและตรวจสอบสถานะตั๋วเงิน คุมวันที่ครบกำหนดชำระเพื่อป้องกันเช็คเกินกำหนดการนำฝาก
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => {
              setFormType('receivable');
              setIsAddOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-sm shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> บันทึกเช็ครับคู่ค้า
          </button>
          
          <button
            onClick={() => {
              setFormType('payable');
              setIsAddOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-sm shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> บันทึกเช็คจ่ายคู่ค้า
          </button>
        </div>
      </div>

      {/* Grid of Financial Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Total Receivables */}
        <div className="bg-white border border-slate-200 rounded-sm p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 tracking-widest font-mono uppercase block">เช็ครับลูกค้าทั้งหมด</span>
            <span className="text-lg font-extrabold text-emerald-600">฿{totalReceivables.toLocaleString()}</span>
            <span className="text-[9px] text-slate-500 block">ยอดรวมเช็ครับจากคู่ค้าทั้งหมด</span>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-sm">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        {/* Pending Receivables */}
        <div className="bg-white border border-slate-200 rounded-sm p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 tracking-widest font-mono uppercase block">เช็ครับค้างนำฝาก (Pending)</span>
            <span className="text-lg font-extrabold text-amber-500">฿{pendingReceivables.toLocaleString()}</span>
            <span className="text-[9px] text-slate-500 block">รอครบกำหนดเพื่อนำเข้าบัญชี</span>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-500 rounded-sm">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Total Payables */}
        <div className="bg-white border border-slate-200 rounded-sm p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 tracking-widest font-mono uppercase block">เช็คสั่งจ่ายคู่ค้าทั้งหมด</span>
            <span className="text-lg font-extrabold text-blue-600">฿{totalPayables.toLocaleString()}</span>
            <span className="text-[9px] text-slate-500 block">ยอดรวมเช็คที่เขียนจ่ายบริษัทคู่ค้า</span>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-sm">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>

        {/* Pending Payables */}
        <div className="bg-white border border-slate-200 rounded-sm p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 tracking-widest font-mono uppercase block">เช็คจ่ายรอหักบัญชี (Pending)</span>
            <span className="text-lg font-extrabold text-rose-500">฿{pendingPayables.toLocaleString()}</span>
            <span className="text-[9px] text-slate-500 block">ค้างจ่ายที่ธนาคารยังไม่ได้หักบัญชี</span>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-500 rounded-sm">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

      </div>

      {/* Main Filter and Table container */}
      <div className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-xs">
        
        {/* Tab Controllers */}
        <div className="border-b border-slate-200 bg-slate-50/50 p-2 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
          
          <div className="flex rounded-sm p-0.5 bg-slate-200/50 self-start">
            <button
              onClick={() => { setActiveTab('all'); playNotificationSound(); }}
              className={`px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition cursor-pointer ${
                activeTab === 'all' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ตั๋วเช็คทั้งหมด ({cheques.length})
            </button>
            <button
              onClick={() => { setActiveTab('receivable'); playNotificationSound(); }}
              className={`px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition cursor-pointer ${
                activeTab === 'receivable' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-emerald-600'
              }`}
            >
              เช็ครับลูกค้า ({cheques.filter(c => c.type === 'receivable').length})
            </button>
            <button
              onClick={() => { setActiveTab('payable'); playNotificationSound(); }}
              className={`px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition cursor-pointer ${
                activeTab === 'payable' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              เช็คจ่ายคู่ค้า ({cheques.filter(c => c.type === 'payable').length})
            </button>
          </div>

          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono p-1">
            Status Engine Linked
          </span>
        </div>

        {/* Detailed Filter controls */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/20 grid grid-cols-1 sm:grid-cols-4 gap-3">
          
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาด้วยชื่อคู่ค้า, เลขเช็ค หรือข้อความบันทึก..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-sm text-xs text-slate-700 bg-white focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          {/* Bank filter */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={bankFilter}
              onChange={(e) => setBankFilter(e.target.value)}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-sm text-xs text-slate-700 bg-white focus:outline-none focus:border-blue-500 font-sans"
            >
              <option value="all">กรองตามธนาคาร (ทั้งหมด)</option>
              {Array.from(new Set(cheques.map(c => c.bank))).map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2 py-1.5 border border-slate-200 rounded-sm text-xs text-slate-700 bg-white focus:outline-none focus:border-blue-500 font-sans"
            >
              <option value="all">สถานะเช็ค (ทั้งหมด)</option>
              <option value="pending">รอดำเนินการ (Pending)</option>
              <option value="cleared">ผ่านการขึ้นเงิน (Cleared)</option>
              <option value="bounced">เช็คปฏิเสธการจ่าย/เด้ง (Bounced)</option>
              <option value="cancelled">ยกเลิกเช็ค (Cancelled)</option>
            </select>
          </div>

        </div>

        {/* Cheques Master Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono bg-slate-50/50">
                <th className="py-3 px-4">ทรานแซกชั่น / ประเภท</th>
                <th className="py-3 px-4">เลขที่เช็ค</th>
                <th className="py-3 px-4">สถาบันธนาคาร</th>
                <th className="py-3 px-4">ชื่อคู่ค้า / รายละเอียด</th>
                <th className="py-3 px-4 text-right">จำนวนเงิน</th>
                <th className="py-3 px-4">ถึงกำหนดวันที่</th>
                <th className="py-3 px-4">สถานะเช็ค</th>
                <th className="py-3 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {sortedCheques.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <CreditCard className="w-8 h-8 text-slate-300" />
                      <p className="font-sans">ไม่พบรายการตั๋วเช็คที่บันทึกไว้ในฐานระบบ</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCheques.map(cheque => {
                  const isReceivable = cheque.type === 'receivable';
                  
                  // Highlight check if it's pending and overdue (due date <= today)
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isOverdue = cheque.status === 'pending' && cheque.dueDate <= todayStr;

                  return (
                    <tr 
                      key={cheque.id} 
                      className={`hover:bg-slate-50/50 transition ${isOverdue ? 'bg-amber-50/20' : ''}`}
                    >
                      {/* ID / Type badge */}
                      <td className="py-3 px-4">
                        <span className="text-[9px] font-mono text-slate-400 block leading-none mb-1">{cheque.id}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] font-bold tracking-wider uppercase ${
                          isReceivable 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          {isReceivable ? 'เช็ครับ' : 'เช็คจ่าย'}
                        </span>
                      </td>

                      {/* Cheque Number */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {cheque.chequeNumber}
                      </td>

                      {/* Bank Name */}
                      <td className="py-3 px-4 font-sans text-slate-600">
                        {cheque.bank}
                      </td>

                      {/* Partner name & Notes */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block leading-snug">{cheque.partnerName}</span>
                        {cheque.notes && (
                          <span className="text-[10px] text-slate-500 block mt-0.5 leading-normal italic">
                            หมายเหตุ: {cheque.notes}
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ฿{cheque.amount.toLocaleString()}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className={isOverdue ? 'text-amber-600 font-bold' : 'text-slate-600'}>
                            {cheque.dueDate}
                          </span>
                        </div>
                        {isOverdue && (
                          <span className="text-[9px] text-amber-600 font-bold block mt-0.5 font-sans animate-pulse">
                            ⚠️ เลยกำหนดนำฝาก!
                          </span>
                        )}
                      </td>

                      {/* Status select/badge */}
                      <td className="py-3 px-4">
                        <select
                          value={cheque.status}
                          onChange={(e) => {
                            onUpdateChequeStatus(cheque.id, e.target.value as PartnerCheque['status']);
                            playNotificationSound();
                          }}
                          className={`px-2 py-1 rounded-sm text-[11px] font-semibold border focus:outline-none cursor-pointer ${
                            cheque.status === 'cleared'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : cheque.status === 'bounced'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : cheque.status === 'cancelled'
                              ? 'bg-slate-100 text-slate-500 border-slate-300'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <option value="pending">⏳ รอดำเนินการ (Pending)</option>
                          <option value="cleared">✅ ผ่าน/ขึ้นเงินแล้ว (Cleared)</option>
                          <option value="bounced">🚨 เช็คเด้ง (Bounced)</option>
                          <option value="cancelled">❌ ยกเลิกเช็ค (Cancelled)</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            onClick={() => handleStartEdit(cheque)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-sm transition cursor-pointer"
                            title="แก้ไขข้อมูลเช็ค"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => setDeleteTarget(cheque)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-sm transition cursor-pointer"
                            title="ลบเช็คออกจากระบบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-white">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-xs font-medium rounded-sm text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                ก่อนหน้า
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="relative ml-3 inline-flex items-center px-4 py-2 border border-slate-300 text-xs font-medium rounded-sm text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                ถัดไป
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-slate-500 font-sans">
                  แสดงรายการที่ <span className="font-bold text-slate-900">{startIndex + 1}</span> ถึง{' '}
                  <span className="font-bold text-slate-900">{Math.min(startIndex + itemsPerPage, totalItems)}</span> จากทั้งหมด{' '}
                  <span className="font-bold text-slate-900">{totalItems}</span> รายการที่กรองได้
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-sm shadow-xs" aria-label="Pagination">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="relative inline-flex items-center rounded-l-sm px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      aria-current={currentPage === page ? 'page' : undefined}
                      className={`relative inline-flex items-center px-3 py-1.5 text-xs font-semibold focus:z-20 cursor-pointer transition ${
                        currentPage === page
                          ? 'z-10 bg-slate-900 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900'
                          : 'text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:outline-offset-0'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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

        {/* Counter summary bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-400 font-mono flex justify-between items-center">
          <span>แสดงเช็ค {totalItems} จากทั้งหมด {cheques.length} ฉบับ {totalPages > 1 && `(หน้า ${currentPage}/${totalPages})`}</span>
          <span>ธนาคารคู่ค้าทั้งหมด: {THAI_BANKS.length} สถาบันการเงินที่เปิดการรองรับ</span>
        </div>

      </div>

      {/* Pop-up modal register/edit draft cheque */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            
            {/* Modal header */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                <FileCheck className="w-5 h-5 text-blue-600" />
                {editingCheque 
                  ? (formType === 'receivable' ? 'แก้ไขบันทึกเช็ครับลูกค้า' : 'แก้ไขบันทึกเช็คสั่งจ่ายคู่ค้า')
                  : (formType === 'receivable' ? 'ลงบันทึกเช็ครับลูกค้า' : 'เขียนบันทึกเช็คสั่งจ่ายคู่ค้า')}
              </h3>
              <button 
                onClick={handleCloseModal} 
                className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal form content */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-700">
              
              {/* Force Switch Type */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-sm">
                <button
                  type="button"
                  onClick={() => setFormType('receivable')}
                  className={`py-2 text-center rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                    formType === 'receivable' 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  เช็ครับจากลูกค้า (Receivable)
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('payable')}
                  className={`py-2 text-center rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                    formType === 'payable' 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  เช็คสั่งจ่ายคู่ค้า (Payable)
                </button>
              </div>

              {/* Partner Name selection and custom entry */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">
                    {formType === 'receivable' ? 'ชื่อลูกค้า / คู่ค้านำจ่ายเช็ค *' : 'ชื่อบริษัทคู่ค้า / ผู้รับประโยชน์เช็ค *'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddPartnerOpen(true)}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 hover:underline cursor-pointer bg-transparent border-0 outline-none"
                  >
                    <Plus className="w-3 h-3" /> เพิ่มคู่ค้าใหม่
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={partners.some(p => p.name === formPartnerName) ? formPartnerName : ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        setFormPartnerName(e.target.value);
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white font-sans text-xs font-semibold text-slate-800"
                  >
                    <option value="">-- เลือกจากรายชื่อระบบ --</option>
                    {partners.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name} {p.taxId ? `(${p.taxId})` : ''}
                      </option>
                    ))}
                  </select>
                  
                  <input
                    type="text"
                    placeholder="หรือระบุชื่อผู้รับผลประโยชน์..."
                    value={formPartnerName}
                    onChange={(e) => setFormPartnerName(e.target.value)}
                    className="w-1/2 px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white font-sans text-xs text-slate-800"
                    required
                  />
                </div>
              </div>

              {/* Cheque Number & Amount Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">หมายเลขเช็ค (7 หลัก) *</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="เช่น 0482915"
                    value={formChequeNumber}
                    onChange={(e) => setFormChequeNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white font-mono text-xs text-slate-800"
                    required
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">จำนวนเงินหน้าเช็ค (฿) *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="เช่น 125000"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white font-mono text-xs text-slate-800"
                    required
                  />
                </div>
              </div>

              {/* Bank selector */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">สถาบันธนาคารผู้ออกเช็ค *</label>
                <select
                  value={formBank}
                  onChange={(e) => setFormBank(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white text-slate-800 text-xs font-sans"
                  required
                >
                  <option value="">-- กรุณาเลือกธนาคาร --</option>
                  {THAI_BANKS.map(bank => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>

              {/* Due Date selector */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  วันที่ถึงกำหนดสั่งจ่าย / ขึ้นเงิน (Due Date) *
                </label>
                <input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white font-mono text-xs text-slate-800"
                  required
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">คำอธิบายเพิ่มเติม / บันทึกความจำจำเจ</label>
                <textarea
                  placeholder="เช่น มัดจำสัญญาก่อสร้างอาคารเฟสแรก"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 h-16 resize-none bg-white font-sans text-xs text-slate-800"
                ></textarea>
              </div>

              {/* Modal controls actions */}
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
                  {editingCheque ? 'บันทึกการแก้ไข' : 'บันทึกตั๋วเช็ค'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 max-w-sm w-full p-6 shadow-xl space-y-4">
            
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-sm shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-sans">
                  ยืนยันการลบตั๋วเช็คคู่ค้า
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-sans">
                  คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลตั๋วเช็คนี้? การดำเนินการลบจะไม่สามารถย้อนกลับหรือกู้คืนรายการได้
                </p>
              </div>
            </div>

            {/* Target info card */}
            <div className="bg-slate-50 p-3 rounded-sm text-xs font-sans space-y-1 border border-slate-100 text-left">
              <div className="flex justify-between font-mono text-[10px] text-slate-400">
                <span>ID: {deleteTarget.id}</span>
                <span>เลขเช็ค: {deleteTarget.chequeNumber}</span>
              </div>
              <p className="font-bold text-slate-800">{deleteTarget.partnerName}</p>
              <p className="font-mono font-bold text-rose-600">฿{deleteTarget.amount.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500">กำหนดสั่งจ่าย: {deleteTarget.dueDate} ({deleteTarget.bank})</p>
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
                  onDeleteCheque(deleteTarget.id);
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

      {/* Quick Add Partner Company Sub-modal */}
      {isAddPartnerOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 font-sans">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>ลงทะเบียนเพิ่มคู่ค้าใหม่เข้าสู่ฐานระบบ</span>
              </h3>
              <button 
                type="button"
                onClick={() => setIsAddPartnerOpen(false)} 
                className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddPartnerSubmit} className="space-y-3.5 text-xs text-slate-700">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">ชื่อบริษัทคู่ค้า / คู่สัญญา *</label>
                <input
                  type="text"
                  placeholder="เช่น บริษัท เอพี โลหะภัณฑ์ จำกัด"
                  value={partnerFormName}
                  onChange={(e) => setPartnerFormName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white font-sans text-xs text-slate-800 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-600 block">เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
                  <input
                    type="text"
                    maxLength={13}
                    placeholder="เลข 13 หลัก"
                    value={partnerFormTaxId}
                    onChange={(e) => setPartnerFormTaxId(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white font-mono text-xs text-slate-800"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="font-medium text-slate-600 block">ผู้ติดต่อหลัก (Contact Person)</label>
                  <input
                    type="text"
                    placeholder="เช่น คุณสมศักดิ์"
                    value={partnerFormContact}
                    onChange={(e) => setPartnerFormContact(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white font-sans text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-600 block">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="tel"
                    placeholder="เช่น 02-1234567"
                    value={partnerFormPhone}
                    onChange={(e) => setPartnerFormPhone(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white font-sans text-xs text-slate-800"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="font-medium text-slate-600 block">อีเมลบริษัท</label>
                  <input
                    type="email"
                    placeholder="เช่น contact@company.com"
                    value={partnerFormEmail}
                    onChange={(e) => setPartnerFormEmail(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white font-mono text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-600 block">ที่อยู่สำนักงาน / โรงงาน</label>
                <textarea
                  placeholder="ระบุที่อยู่เพื่อใช้สำหรับออกเอกสารใบกำกับภาษี..."
                  value={partnerFormAddress}
                  onChange={(e) => setPartnerFormAddress(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 h-14 resize-none bg-white font-sans text-xs text-slate-800"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-600 block">หมายเหตุและเงื่อนไขเพิ่มเติม (Credit Term etc.)</label>
                <input
                  type="text"
                  placeholder="เช่น เครดิตเทอม 30 วัน"
                  value={partnerFormNotes}
                  onChange={(e) => setPartnerFormNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white font-sans text-xs text-slate-800"
                />
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddPartnerOpen(false)}
                  className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-sm font-sans font-bold transition cursor-pointer bg-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-sans font-bold shadow-sm transition cursor-pointer"
                >
                  บันทึกข้อมูลคู่ค้า
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
