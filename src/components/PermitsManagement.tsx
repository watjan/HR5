import React, { useState, useMemo } from 'react';
import { PermitLicense, SystemSettings } from '../types';
import { 
  FileCheck, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  Printer, 
  Database, 
  Tag, 
  FileText, 
  Phone, 
  Building2, 
  UserCheck, 
  DollarSign, 
  X,
  Layers,
  Info,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface PermitsManagementProps {
  permits: PermitLicense[];
  setPermits: React.Dispatch<React.SetStateAction<PermitLicense[]>>;
  systemSettings: SystemSettings;
  addAuditLog: (action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYSTEM', module: string, description: string) => void;
  currentUser: string;
}

const DEFAULT_CATEGORIES = [
  'ใบอนุญาตป้าย',
  'ใบอนุญาตพันธุ์พืช/พันธุ์ผัก',
  'ใบอนุญาตสุขาภิบาลและสิ่งแวดล้อม',
  'ใบอนุญาตสะสมและจำหน่ายอาหาร',
  'ใบอนุญาตอาคารและสิ่งปลูกสร้าง',
  'ใบอนุญาตสรรพสามิต/สุรา/ยาสูบ',
  'ใบอนุญาตประกอบกิจการโรงงาน',
  'อื่นๆ'
];

export const PermitsManagement: React.FC<PermitsManagementProps> = ({
  permits,
  setPermits,
  systemSettings,
  addAuditLog,
  currentUser
}) => {
  // State variables
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [customCategories, setCustomCategories] = useState<string[]>(DEFAULT_CATEGORIES);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPermit, setEditingPermit] = useState<PermitLicense | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<PermitLicense>>({
    permitNumber: '',
    title: '',
    category: 'ใบอนุญาตป้าย',
    requestDate: new Date().toISOString().split('T')[0],
    issueDate: '',
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    issuingAgency: '',
    feeAmount: 0,
    status: 'active',
    responsiblePerson: '',
    contactPhone: '',
    documentUrl: '',
    notes: ''
  });

  // Calculate days remaining to expiry
  const getDaysRemaining = (expiryDateStr: string) => {
    if (!expiryDateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expiryDateStr);
    expDate.setHours(0, 0, 0, 0);
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Determine actual display status based on date calculations
  const getCalculatedStatus = (permit: PermitLicense) => {
    if (permit.status === 'rejected' || permit.status === 'pending' || permit.status === 'renewing') {
      return permit.status;
    }
    const daysLeft = getDaysRemaining(permit.expiryDate);
    if (daysLeft === null) return permit.status;
    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 30) return 'near_expiry';
    return 'active';
  };

  // Filtered Permits
  const filteredPermits = useMemo(() => {
    return permits.filter(permit => {
      const actualStatus = getCalculatedStatus(permit);
      
      const matchesSearch = 
        permit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permit.permitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (permit.issuingAgency && permit.issuingAgency.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (permit.responsiblePerson && permit.responsiblePerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (permit.notes && permit.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || permit.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || actualStatus === selectedStatus || permit.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [permits, searchTerm, selectedCategory, selectedStatus]);

  // Statistics
  const stats = useMemo(() => {
    let total = permits.length;
    let active = 0;
    let nearExpiry = 0;
    let expired = 0;
    let pending = 0;
    let renewing = 0;
    let totalFees = 0;

    permits.forEach(p => {
      const st = getCalculatedStatus(p);
      if (st === 'active') active++;
      else if (st === 'near_expiry') nearExpiry++;
      else if (st === 'expired') expired++;
      else if (st === 'pending') pending++;
      else if (st === 'renewing') renewing++;
      
      if (p.feeAmount) totalFees += Number(p.feeAmount);
    });

    return { total, active, nearExpiry, expired, pending, renewing, totalFees };
  }, [permits]);

  // Expiring soon items for top alert
  const urgentAlerts = useMemo(() => {
    return permits.filter(p => {
      const st = getCalculatedStatus(p);
      return st === 'near_expiry' || st === 'expired';
    });
  }, [permits]);

  // Handle create or update permit
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.requestDate || !formData.expiryDate) {
      alert('⚠️ กรุณากรอกชื่อใบอนุญาต วันที่ยื่นขอ และวันสิ้นสุด/หมดอายุ ให้ครบถ้วน');
      return;
    }

    if (editingPermit) {
      // Update
      const updated = permits.map(p => {
        if (p.id === editingPermit.id) {
          return {
            ...p,
            permitNumber: formData.permitNumber?.trim() || p.permitNumber,
            title: formData.title!.trim(),
            category: formData.category || 'อื่นๆ',
            requestDate: formData.requestDate!,
            issueDate: formData.issueDate || '',
            startDate: formData.startDate || formData.requestDate!,
            expiryDate: formData.expiryDate!,
            issuingAgency: formData.issuingAgency?.trim() || '',
            feeAmount: Number(formData.feeAmount) || 0,
            status: (formData.status as any) || 'active',
            responsiblePerson: formData.responsiblePerson?.trim() || '',
            contactPhone: formData.contactPhone?.trim() || '',
            documentUrl: formData.documentUrl?.trim() || '',
            notes: formData.notes?.trim() || ''
          };
        }
        return p;
      });
      setPermits(updated);
      addAuditLog('UPDATE', 'ใบอนุญาต', `แก้ไขใบอนุญาต "${formData.title}" (${formData.permitNumber || 'ไม่มีเลขที่'}) โดย ${currentUser}`);
      alert('✅ อัปเดตข้อมูลใบอนุญาตเรียบร้อยแล้ว');
    } else {
      // Create New
      const newPermit: PermitLicense = {
        id: `PERMIT-${Date.now()}`,
        permitNumber: formData.permitNumber?.trim() || `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
        title: formData.title!.trim(),
        category: formData.category || 'อื่นๆ',
        requestDate: formData.requestDate!,
        issueDate: formData.issueDate || '',
        startDate: formData.startDate || formData.requestDate!,
        expiryDate: formData.expiryDate!,
        issuingAgency: formData.issuingAgency?.trim() || '',
        feeAmount: Number(formData.feeAmount) || 0,
        status: (formData.status as any) || 'pending',
        responsiblePerson: formData.responsiblePerson?.trim() || '',
        contactPhone: formData.contactPhone?.trim() || '',
        documentUrl: formData.documentUrl?.trim() || '',
        notes: formData.notes?.trim() || '',
        createdAt: new Date().toISOString()
      };
      setPermits([newPermit, ...permits]);
      addAuditLog('CREATE', 'ใบอนุญาต', `เพิ่มการขอใบอนุญาตใหม่ "${newPermit.title}" ประเภท ${newPermit.category} โดย ${currentUser}`);
      alert('✅ บันทึกคำขอใบอนุญาตใหม่เรียบร้อยแล้ว');
    }

    // Reset Form & Close Modal
    setShowAddModal(false);
    setEditingPermit(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      permitNumber: '',
      title: '',
      category: customCategories[0] || 'ใบอนุญาตป้าย',
      requestDate: new Date().toISOString().split('T')[0],
      issueDate: '',
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      issuingAgency: '',
      feeAmount: 0,
      status: 'active',
      responsiblePerson: '',
      contactPhone: '',
      documentUrl: '',
      notes: ''
    });
  };

  const handleEditClick = (permit: PermitLicense) => {
    setEditingPermit(permit);
    setFormData({
      permitNumber: permit.permitNumber,
      title: permit.title,
      category: permit.category,
      requestDate: permit.requestDate,
      issueDate: permit.issueDate || '',
      startDate: permit.startDate,
      expiryDate: permit.expiryDate,
      issuingAgency: permit.issuingAgency || '',
      feeAmount: permit.feeAmount || 0,
      status: permit.status,
      responsiblePerson: permit.responsiblePerson || '',
      contactPhone: permit.contactPhone || '',
      documentUrl: permit.documentUrl || '',
      notes: permit.notes || ''
    });
    setShowAddModal(true);
  };

  const handleDeleteClick = (id: string, title: string) => {
    if (window.confirm(`⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบรายการใบอนุญาต "${title}"?`)) {
      setPermits(permits.filter(p => p.id !== id));
      addAuditLog('DELETE', 'ใบอนุญาต', `ลบรายการใบอนุญาต "${title}" โดย ${currentUser}`);
    }
  };

  const handleQuickStatusChange = (id: string, newStatus: PermitLicense['status']) => {
    setPermits(permits.map(p => {
      if (p.id === id) {
        return { ...p, status: newStatus };
      }
      return p;
    }));
    addAuditLog('UPDATE', 'ใบอนุญาต', `เปลี่ยนสถานะใบอนุญาต ID: ${id} เป็น "${newStatus}" โดย ${currentUser}`);
  };

  // Custom Category Add
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = newCategoryName.trim();
    if (!cat) return;
    if (customCategories.includes(cat)) {
      alert('⚠️ ประเภทใบอนุญาตนี้มีอยู่ในระบบแล้ว');
      return;
    }
    setCustomCategories([...customCategories, cat]);
    setNewCategoryName('');
    alert(`✅ เพิ่มประเภทใบอนุญาต "${cat}" สำเร็จ`);
  };

  // Helper Badge Color
  const getStatusBadge = (permit: PermitLicense) => {
    const st = getCalculatedStatus(permit);
    const daysLeft = getDaysRemaining(permit.expiryDate);

    switch (st) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ใช้งานอยู่ {daysLeft !== null && `(เหลือ ${daysLeft} วัน)`}
          </span>
        );
      case 'near_expiry':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            ใกล้หมดอายุ {daysLeft !== null && `(เหลือ ${daysLeft} วัน)`}
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            หมดอายุแล้ว {daysLeft !== null && `(เกินกำหนด ${Math.abs(daysLeft)} วัน)`}
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            รอดำเนินการ/ยื่นขอ
          </span>
        );
      case 'renewing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <RefreshCw className="w-3.5 h-3.5 text-purple-600 shrink-0 animate-spin" />
            อยู่ระหว่างต่ออายุ
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-300">
            <XCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            ไม่อนุมัติ / ยกเลิก
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar / Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-700 font-mono">
              PERMIT & LICENSE MANAGEMENT
            </span>
          </div>
          <h1 className="text-2xl font-light text-slate-900 mt-1 flex items-center gap-2">
            <FileCheck className="w-7 h-7 text-indigo-600" />
            ขอใบอนุญาต & การต่ออายุ (Permit Ledger)
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-sans flex items-center gap-1.5 flex-wrap">
            <span>บริหารจัดการคำขอ วันที่ยื่นขอ วันสิ้นสุด/หมดอายุ ใบอนุญาตป้าย ใบอนุญาตพันธุ์ผัก/พันธุ์พืช และอื่นๆ</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded border border-indigo-100 font-mono">
              <Database className="w-3 h-3 text-indigo-500 shrink-0" />
              ดึงข้อมูลจากฐานข้อมูล Hostinger MySQL (u753988669_hr)
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-all border border-slate-300"
          >
            <Tag className="w-4 h-4 text-slate-600" />
            ประเภทใบอนุญาต
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-all border border-slate-300"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            พิมพ์/ส่งออกรายงาน
          </button>

          <button
            onClick={() => {
              resetForm();
              setEditingPermit(null);
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl shadow-sm transition-all hover:shadow"
          >
            <Plus className="w-4 h-4" />
            + ยื่นขอ/เพิ่มใบอนุญาตใหม่
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500">ใบอนุญาตทั้งหมด</div>
          <div className="text-2xl font-semibold text-slate-900 mt-1">{stats.total} <span className="text-xs font-normal text-slate-400">รายการ</span></div>
          <div className="text-[11px] text-slate-400 mt-1">รวมทุกประเภท</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm bg-emerald-50/20">
          <div className="text-xs font-medium text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ใช้งานอยู่
          </div>
          <div className="text-2xl font-semibold text-emerald-900 mt-1">{stats.active} <span className="text-xs font-normal text-emerald-600">รายการ</span></div>
          <div className="text-[11px] text-emerald-600 mt-1">มีผลบังคับใช้</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-300 shadow-sm bg-amber-50/30">
          <div className="text-xs font-semibold text-amber-700 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> ใกล้หมดอายุ
          </div>
          <div className="text-2xl font-semibold text-amber-900 mt-1">{stats.nearExpiry} <span className="text-xs font-normal text-amber-600">รายการ</span></div>
          <div className="text-[11px] text-amber-600 mt-1">ภายใน 30 วัน</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-300 shadow-sm bg-rose-50/30">
          <div className="text-xs font-semibold text-rose-700 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> หมดอายุแล้ว
          </div>
          <div className="text-2xl font-semibold text-rose-900 mt-1">{stats.expired} <span className="text-xs font-normal text-rose-600">รายการ</span></div>
          <div className="text-[11px] text-rose-600 mt-1">ต้องรีบดำเนินการ</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-sm bg-blue-50/20">
          <div className="text-xs font-medium text-blue-700 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-600" /> รอดำเนินการ
          </div>
          <div className="text-2xl font-semibold text-blue-900 mt-1">{stats.pending + stats.renewing} <span className="text-xs font-normal text-blue-600">รายการ</span></div>
          <div className="text-[11px] text-blue-600 mt-1">ยื่นเรื่อง/ต่ออายุ</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500">รวมค่าธรรมเนียม</div>
          <div className="text-lg font-bold text-slate-900 mt-1 font-mono">฿{stats.totalFees.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">บาท</div>
        </div>
      </div>

      {/* Urgent Alert Banner */}
      {urgentAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900">
                แจ้งเตือน: พบใบอนุญาตหมดอายุหรือกำลังจะหมดอายุใน 30 วัน ({urgentAlerts.length} รายการ)
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                กรุณาเตรียมเอกสารและยื่นขอต่ออายุใบอนุญาตกับหน่วยงานที่เกี่ยวข้องเพื่อป้องกันค่าปรับหรือผลกระทบทางกฎหมาย
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {urgentAlerts.slice(0, 4).map(item => (
                  <div key={item.id} className="bg-white px-3 py-1.5 rounded-xl border border-amber-200 text-xs text-slate-800 flex items-center gap-2 shadow-2xs">
                    <span className="font-semibold">{item.title}</span>
                    <span className="text-amber-700 font-mono text-[11px]">(หมดอายุ {item.expiryDate})</span>
                    <button
                      onClick={() => handleQuickStatusChange(item.id, 'renewing')}
                      className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-medium ml-1 transition-colors"
                    >
                      ยื่นต่ออายุ
                    </button>
                  </div>
                ))}
                {urgentAlerts.length > 4 && (
                  <span className="text-xs text-amber-700 self-center font-medium">
                    และอีก {urgentAlerts.length - 4} รายการ...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อใบอนุญาต, เลขที่, หน่วยงาน, ผู้รับผิดชอบ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            ตัวกรอง:
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
          >
            <option value="all">ทุกประเภทใบอนุญาต ({permits.length})</option>
            {customCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="active">ใช้งานอยู่ / อนุมัติแล้ว</option>
            <option value="near_expiry">ใกล้หมดอายุ (&lt;= 30 วัน)</option>
            <option value="expired">หมดอายุแล้ว</option>
            <option value="pending">รอดำเนินการ / ยื่นขอ</option>
            <option value="renewing">อยู่ระหว่างต่ออายุ</option>
            <option value="rejected">ไม่อนุมัติ / ยกเลิก</option>
          </select>
        </div>
      </div>

      {/* Main Table / Data List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">เลขที่ & ชื่อใบอนุญาต</th>
                <th className="py-3.5 px-4">ประเภท/หมวดหมู่</th>
                <th className="py-3.5 px-4">วันที่ยื่นขอ - วันออก</th>
                <th className="py-3.5 px-4">วันเริ่ม - วันสิ้นสุด/หมดอายุ</th>
                <th className="py-3.5 px-4">หน่วยงาน & ผู้รับผิดชอบ</th>
                <th className="py-3.5 px-4 text-right">ค่าธรรมเนียม</th>
                <th className="py-3.5 px-4 text-center">สถานะ</th>
                <th className="py-3.5 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPermits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                    <p className="text-sm font-medium text-slate-600">ไม่พบรายการใบอนุญาต</p>
                    <p className="text-xs text-slate-400 mt-0.5">ลองปรับคำค้นหา หรือกดปุ่ม "+ ยื่นขอ/เพิ่มใบอนุญาตใหม่" เพื่อสร้างรายการแรก</p>
                  </td>
                </tr>
              ) : (
                filteredPermits.map((item) => {
                  const daysLeft = getDaysRemaining(item.expiryDate);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                          {item.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 font-mono text-[11px] text-slate-500">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
                            {item.permitNumber || 'ไม่มีเลขที่'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">
                          <Tag className="w-3 h-3 text-indigo-500" />
                          {item.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-800 font-mono">ยื่นขอ: {item.requestDate || '-'}</div>
                        <div className="text-slate-400 font-mono text-[11px]">อนุมัติ: {item.issueDate || 'รอดำเนินการ'}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-700 font-mono">เริ่ม: {item.startDate || '-'}</div>
                        <div className={`font-mono font-semibold ${daysLeft !== null && daysLeft <= 30 ? 'text-rose-600' : 'text-slate-900'}`}>
                          หมดอายุ: {item.expiryDate}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {item.issuingAgency || '-'}
                        </div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                          <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
                          {item.responsiblePerson || 'ไม่ได้ระบุผู้ยื่นเรื่อง'}
                          {item.contactPhone && (
                            <span className="font-mono text-slate-400">({item.contactPhone})</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-sm font-medium text-slate-900 whitespace-nowrap">
                        {item.feeAmount ? `฿${Number(item.feeAmount).toLocaleString()}` : '-'}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {getStatusBadge(item)}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEditClick(item)}
                            title="แก้ไขรายการ"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item.id, item.title)}
                            title="ลบรายการ"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Footer Summary */}
        <div className="bg-slate-50/80 px-4 py-3 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            แสดงทั้งหมด <span className="font-semibold text-slate-800">{filteredPermits.length}</span> จาก <span className="font-semibold text-slate-800">{permits.length}</span> รายการ
          </div>
          <div className="flex items-center gap-4">
            <span>รวมค่าธรรมเนียมที่แสดง: <strong className="text-slate-900 font-mono font-bold">฿{filteredPermits.reduce((acc, curr) => acc + (Number(curr.feeAmount) || 0), 0).toLocaleString()}</strong> บาท</span>
          </div>
        </div>
      </div>

      {/* MODAL: ADD / EDIT PERMIT */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-semibold text-slate-900">
                  {editingPermit ? 'แก้ไขข้อมูลใบอนุญาต' : 'ยื่นขอ / เพิ่มใบอนุญาตใหม่'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingPermit(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    ชื่อใบอนุญาต / ชื่อคำขอ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ใบอนุญาตป้ายโฆษณาหน้าร้าน, ใบอนุญาตรวบรวมพันธุ์ผัก"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    ประเภท/หมวดหมู่ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category || customCategories[0]}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 bg-white"
                  >
                    {customCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    เลขที่ใบอนุญาต / เลขที่คำขอ
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น LIC-SIGN-2025-001"
                    value={formData.permitNumber || ''}
                    onChange={(e) => setFormData({ ...formData, permitNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    วันที่ยื่นขอ/ยื่นเรื่อง <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.requestDate || ''}
                    onChange={(e) => setFormData({ ...formData, requestDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    วันที่ออกใบอนุญาต / อนุมัติ
                  </label>
                  <input
                    type="date"
                    value={formData.issueDate || ''}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    วันเริ่มมีผลบังคับใช้ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate || ''}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    วันสิ้นสุด / หมดอายุ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate || ''}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    หน่วยงานผู้ออกใบอนุญาต
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น สำนักงานเขต, กรมวิชาการเกษตร"
                    value={formData.issuingAgency || ''}
                    onChange={(e) => setFormData({ ...formData, issuingAgency: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    ค่าธรรมเนียม / ค่าใช้จ่าย (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.feeAmount || 0}
                    onChange={(e) => setFormData({ ...formData, feeAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    สถานะการขอ / ใบอนุญาต
                  </label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 bg-white"
                  >
                    <option value="active">ใช้งานอยู่ / อนุมัติแล้ว</option>
                    <option value="pending">รอดำเนินการ / ยื่นเรื่อง</option>
                    <option value="renewing">อยู่ระหว่างยื่นต่ออายุ</option>
                    <option value="rejected">ไม่อนุมัติ / ยกเลิก</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    ผู้รับผิดชอบ / ผู้ยื่นเรื่อง
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ชื่อพนักงาน หรือ ฝ่ายบริหาร"
                    value={formData.responsiblePerson || ''}
                    onChange={(e) => setFormData({ ...formData, responsiblePerson: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    เบอร์ติดต่อหน่วยงาน / เจ้าหน้าที่
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 02-123-4567 ต่อ 102"
                    value={formData.contactPhone || ''}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    หมายเหตุ / รายละเอียดเพิ่มเติม
                  </label>
                  <textarea
                    rows={2}
                    placeholder="รายละเอียดเพิ่มเติม เงื่อนไข หรือเอกสารที่ต้องใช้ในการยื่นต่ออายุครั้งถัดไป..."
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingPermit(null);
                  }}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-all"
                >
                  {editingPermit ? 'บันทึกการเปลี่ยนแปลง' : 'บันทึกข้อมูลใบอนุญาต'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOM CATEGORIES MANAGEMENT */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-semibold text-slate-900">จัดการประเภทใบอนุญาต</h3>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  placeholder="พิมพ์ชื่อประเภทใหม่ เช่น ใบอนุญาตใช้เสียง..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shrink-0 transition-colors"
                >
                  + เพิ่ม
                </button>
              </form>

              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  ประเภทในระบบปัจจุบัน ({customCategories.length})
                </div>
                {customCategories.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="font-medium text-slate-800">{cat}</span>
                    {DEFAULT_CATEGORIES.includes(cat) ? (
                      <span className="text-[10px] bg-slate-200/80 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                        ค่าเริ่มต้น
                      </span>
                    ) : (
                      <button
                        onClick={() => setCustomCategories(customCategories.filter(c => c !== cat))}
                        className="text-rose-500 hover:text-rose-700 text-xs p-1"
                        title="ลบประเภทนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition-colors"
                >
                  เสร็จสิ้น
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRINT / EXPORT REPORT */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-6 overflow-hidden">
            <div className="p-4 bg-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-semibold">รายงานสรุปทะเบียนใบอนุญาตและการขอต่ออายุ</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  พิมพ์รายงาน (Print)
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 text-slate-900 print:p-0">
              <div className="text-center border-b border-slate-200 pb-4">
                <h2 className="text-xl font-bold text-slate-900">{systemSettings.companyName || 'บริษัท ของคุณ'}</h2>
                <h3 className="text-base font-semibold text-slate-700 mt-1">รายงานสรุปสถานะการขอใบอนุญาต และการต่ออายุใบอนุญาต</h3>
                <p className="text-xs text-slate-500 mt-1">
                  พิมพ์รายงาน ณ วันที่: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-4 text-center text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500">รวมใบอนุญาตทั้งหมด</div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">{stats.total} รายการ</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="text-emerald-700">มีผลบังคับใช้ (Active)</div>
                  <div className="text-lg font-bold text-emerald-900 mt-0.5">{stats.active} รายการ</div>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="text-amber-700">ใกล้หมดอายุ (&lt;= 30 วัน)</div>
                  <div className="text-lg font-bold text-amber-900 mt-0.5">{stats.nearExpiry} รายการ</div>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <div className="text-rose-700">หมดอายุแล้ว (Expired)</div>
                  <div className="text-lg font-bold text-rose-900 mt-0.5">{stats.expired} รายการ</div>
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-semibold border-y border-slate-300">
                    <th className="py-2.5 px-3">ลำดับ</th>
                    <th className="py-2.5 px-3">เลขที่ & ชื่อใบอนุญาต</th>
                    <th className="py-2.5 px-3">หมวดหมู่</th>
                    <th className="py-2.5 px-3">ยื่นขอ - หมดอายุ</th>
                    <th className="py-2.5 px-3">หน่วยงานผู้ออก</th>
                    <th className="py-2.5 px-3 text-right">ค่าธรรมเนียม</th>
                    <th className="py-2.5 px-3 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPermits.map((p, index) => (
                    <tr key={p.id}>
                      <td className="py-2.5 px-3 font-mono">{index + 1}</td>
                      <td className="py-2.5 px-3 font-medium">
                        <div>{p.title}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{p.permitNumber}</div>
                      </td>
                      <td className="py-2.5 px-3">{p.category}</td>
                      <td className="py-2.5 px-3 font-mono">
                        <div>{p.requestDate}</div>
                        <div className="text-rose-600 font-semibold">{p.expiryDate}</div>
                      </td>
                      <td className="py-2.5 px-3">{p.issuingAgency || '-'}</td>
                      <td className="py-2.5 px-3 text-right font-mono">฿{(Number(p.feeAmount) || 0).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-center">{getStatusBadge(p)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-6 border-t border-slate-200 flex justify-between text-xs text-slate-500">
                <div>ผู้ออกรายงาน: {currentUser}</div>
                <div>บริษัท/องค์กร: {systemSettings.companyName}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermitsManagement;
