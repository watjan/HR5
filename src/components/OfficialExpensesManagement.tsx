import React, { useState, useMemo } from 'react';
import { OfficialExpense, SystemSettings } from '../types';
import {
  FileText,
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
  ShieldCheck,
  Receipt,
  Calculator,
  MoreHorizontal,
  Building2,
  UserCheck,
  DollarSign,
  X,
  Layers,
  Info,
  ChevronRight,
  TrendingDown,
  Wallet,
  Check
} from 'lucide-react';

interface OfficialExpensesManagementProps {
  expenses: OfficialExpense[];
  setExpenses: React.Dispatch<React.SetStateAction<OfficialExpense[]>>;
  systemSettings: SystemSettings;
  addAuditLog: (action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYSTEM', module: string, description: string) => void;
  currentUser: string;
}

const CATEGORY_MAP: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
  social_security: {
    label: 'รายจ่ายประกันสังคม',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: ShieldCheck
  },
  revenue_tax: {
    label: 'รายจ่ายสรรพากร',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: Receipt
  },
  accounting: {
    label: 'รายจ่ายบัญชี',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: Calculator
  },
  other: {
    label: 'ค่าอื่นๆ',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: Wallet
  }
};

const SUB_CATEGORY_PRESETS: Record<string, string[]> = {
  social_security: [
    'เงินสมทบผู้ประกันตน ม.33 (สปส. 1-10)',
    'เงินสมทบกองทุนเงินทดแทนประจำปี',
    'เงินสมทบประกันสังคม ม.39 / ม.40',
    'ค่าธรรมเนียม/เงินเพิ่ม ประกันสังคม'
  ],
  revenue_tax: [
    'ภ.ง.ด. 1 (ภาษีหัก ณ ที่จ่าย เงินเดือนพนักงาน)',
    'ภ.ง.ด. 3 (ภาษีหัก ณ ที่จ่าย บุคคลธรรมดา)',
    'ภ.ง.ด. 53 (ภาษีหัก ณ ที่จ่าย นิติบุคคล)',
    'ภ.พ. 30 (ภาษีมูลค่าเพิ่ม VAT 7%)',
    'ภ.ง.ด. 50 / ภ.ง.ด. 51 (ภาษีเงินได้นิติบุคคล)',
    'ภาษีป้าย / ภาษีบำรุงท้องที่'
  ],
  accounting: [
    'ค่าบริการทำบัญชีรายเดือน',
    'ค่าบริการสอบบัญชีประจำปี (Audit Fee)',
    'ค่าปิดงบการเงินและยื่นงบ',
    'ค่าบริการที่ปรึกษาภาษีและกฎหมาย'
  ],
  other: [
    'ค่าธรรมเนียมธนาคาร & Payroll',
    'ค่าบริการซอฟต์แวร์ / ระบบคลาวด์',
    'ค่าธรรมเนียมหน่วยงานราชการอื่นๆ',
    'ค่าใช้จ่ายจิปาถะฝ่ายบริหาร'
  ]
};

export const OfficialExpensesManagement: React.FC<OfficialExpensesManagementProps> = ({
  expenses = [],
  setExpenses,
  systemSettings,
  addAuditLog,
  currentUser
}) => {
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<OfficialExpense | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Form Data
  const [formData, setFormData] = useState<Partial<OfficialExpense>>({
    docNumber: '',
    title: '',
    category: 'social_security',
    subCategory: 'เงินสมทบผู้ประกันตน ม.33 (สปส. 1-10)',
    taxPeriod: new Date().toISOString().substring(0, 7),
    dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0],
    paymentDate: '',
    amount: 0,
    fineOrSurcharge: 0,
    totalPaid: 0,
    paymentMethod: 'โอนเงินผ่านธนาคาร',
    status: 'pending',
    recipientAgency: 'สำนักงานประกันสังคม',
    responsiblePerson: currentUser || 'แผนกบัญชีและการเงิน',
    receiptNumber: '',
    notes: ''
  });

  // KPI Calculations
  const stats = useMemo(() => {
    let totalAll = 0;
    let totalSocialSecurity = 0;
    let totalRevenueTax = 0;
    let totalAccounting = 0;
    let totalOther = 0;
    let totalPending = 0;
    let totalPaid = 0;

    expenses.forEach((item) => {
      const amount = item.totalPaid || (Number(item.amount) || 0) + (Number(item.fineOrSurcharge) || 0);
      totalAll += amount;

      if (item.category === 'social_security') totalSocialSecurity += amount;
      if (item.category === 'revenue_tax') totalRevenueTax += amount;
      if (item.category === 'accounting') totalAccounting += amount;
      if (item.category === 'other') totalOther += amount;

      if (item.status === 'pending' || item.status === 'overdue') totalPending += amount;
      if (item.status === 'paid') totalPaid += amount;
    });

    return {
      totalAll,
      totalSocialSecurity,
      totalRevenueTax,
      totalAccounting,
      totalOther,
      totalPending,
      totalPaid,
      countPending: expenses.filter(x => x.status === 'pending' || x.status === 'overdue').length
    };
  }, [expenses]);

  // Filtered List
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        item.docNumber?.toLowerCase().includes(term) ||
        item.title?.toLowerCase().includes(term) ||
        item.subCategory?.toLowerCase().includes(term) ||
        item.recipientAgency?.toLowerCase().includes(term) ||
        item.responsiblePerson?.toLowerCase().includes(term) ||
        item.taxPeriod?.toLowerCase().includes(term) ||
        item.receiptNumber?.toLowerCase().includes(term);

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [expenses, selectedCategory, selectedStatus, searchTerm]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    const docNo = `EXP-${new Date().getFullYear()}-${String(expenses.length + 1).padStart(3, '0')}`;
    setFormData({
      docNumber: docNo,
      title: '',
      category: 'social_security',
      subCategory: 'เงินสมทบผู้ประกันตน ม.33 (สปส. 1-10)',
      taxPeriod: new Date().toISOString().substring(0, 7),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0],
      paymentDate: '',
      amount: 0,
      fineOrSurcharge: 0,
      totalPaid: 0,
      paymentMethod: 'โอนเงินผ่านธนาคาร',
      status: 'pending',
      recipientAgency: 'สำนักงานประกันสังคม',
      responsiblePerson: currentUser || 'แผนกบัญชีและการเงิน',
      receiptNumber: '',
      notes: ''
    });
    setEditingExpense(null);
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (expense: OfficialExpense) => {
    setEditingExpense(expense);
    setFormData({ ...expense });
    setShowAddModal(true);
  };

  // Auto recipient & subcategory defaults when category changes
  const handleCategoryChange = (cat: 'social_security' | 'revenue_tax' | 'accounting' | 'other') => {
    let agency = 'สำนักงานประกันสังคม';
    if (cat === 'revenue_tax') agency = 'กรมสรรพากร';
    if (cat === 'accounting') agency = 'บริษัท สำนักงานบัญชี จำกัด';
    if (cat === 'other') agency = 'ผู้ให้บริการ / ธนาคาร';

    const presets = SUB_CATEGORY_PRESETS[cat] || [];
    setFormData((prev) => ({
      ...prev,
      category: cat,
      subCategory: presets[0] || '',
      recipientAgency: agency
    }));
  };

  // Save Expense Handler
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.docNumber || !formData.dueDate) {
      alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (เลขที่เอกสาร, รายการ, และกำหนดนำส่ง/จ่าย)');
      return;
    }

    const amountNum = Number(formData.amount) || 0;
    const fineNum = Number(formData.fineOrSurcharge) || 0;
    const totalPaidNum = amountNum + fineNum;

    if (editingExpense) {
      // Update
      const updatedList = expenses.map((item) =>
        item.id === editingExpense.id
          ? ({
              ...item,
              ...formData,
              amount: amountNum,
              fineOrSurcharge: fineNum,
              totalPaid: totalPaidNum
            } as OfficialExpense)
          : item
      );
      setExpenses(updatedList);
      addAuditLog('UPDATE', 'รายจ่ายทางการ', `แก้ไขรายการรายจ่าย: ${formData.title} (${formData.docNumber})`);
    } else {
      // Create
      const newExpense: OfficialExpense = {
        id: `OFFEXP-${Date.now()}`,
        docNumber: formData.docNumber || `EXP-${Date.now()}`,
        title: formData.title || '',
        category: (formData.category as any) || 'other',
        subCategory: formData.subCategory || '',
        taxPeriod: formData.taxPeriod || '',
        dueDate: formData.dueDate || new Date().toISOString().split('T')[0],
        paymentDate: formData.paymentDate || '',
        amount: amountNum,
        fineOrSurcharge: fineNum,
        totalPaid: totalPaidNum,
        paymentMethod: formData.paymentMethod || 'โอนเงินผ่านธนาคาร',
        status: (formData.status as any) || 'pending',
        recipientAgency: formData.recipientAgency || '',
        responsiblePerson: formData.responsiblePerson || currentUser,
        receiptNumber: formData.receiptNumber || '',
        notes: formData.notes || '',
        createdAt: new Date().toISOString()
      };
      setExpenses([newExpense, ...expenses]);
      addAuditLog('CREATE', 'รายจ่ายทางการ', `เพิ่มรายการรายจ่ายใหม่: ${formData.title} (${formData.docNumber})`);
    }

    setShowAddModal(false);
    setEditingExpense(null);
  };

  // Delete Expense Handler
  const handleDeleteExpense = (id: string, title: string) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรายการรายจ่าย "${title}"?`)) {
      setExpenses(expenses.filter((x) => x.id !== id));
      addAuditLog('DELETE', 'รายจ่ายทางการ', `ลบรายการรายจ่าย: ${title}`);
    }
  };

  // Toggle status directly
  const handleToggleStatus = (expense: OfficialExpense) => {
    const nextStatus = expense.status === 'paid' ? 'pending' : 'paid';
    const today = new Date().toISOString().split('T')[0];
    const updatedList = expenses.map((item) =>
      item.id === expense.id
        ? {
            ...item,
            status: nextStatus as any,
            paymentDate: nextStatus === 'paid' ? item.paymentDate || today : ''
          }
        : item
    );
    setExpenses(updatedList);
    addAuditLog(
      'UPDATE',
      'รายจ่ายทางการ',
      `เปลี่ยนสถานะรายการ ${expense.title} เป็น ${nextStatus === 'paid' ? 'ชำระ/นำส่งแล้ว' : 'รอนำส่ง'}`
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800">
      {/* Top Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg shadow-sm">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              รายจ่ายประกันสังคม สรรพากร บัญชี และอื่นๆ
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ระบบบริหารจัดการรายจ่ายทางการ นำส่งประกันสังคม ภาษีกรมสรรพากร ค่าบริการทำบัญชี และค่าธรรมเนียมบริหารองค์กร
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>พิมพ์รายงานรายจ่าย</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>บันทึกรายจ่ายใหม่</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total All */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">ยอดรวมรายจ่ายทั้งหมด</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            ฿{stats.totalAll.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t pt-2 border-slate-100">
            <span>ทั้งหมด {expenses.length} รายการ</span>
            <span className="text-amber-600 font-semibold">รอจ่าย {stats.countPending} รายการ</span>
          </div>
        </div>

        {/* Social Security */}
        <div
          onClick={() => setSelectedCategory('social_security')}
          className={`p-4 rounded-xl border shadow-sm cursor-pointer transition ${
            selectedCategory === 'social_security'
              ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-400/20'
              : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-800">รายจ่ายประกันสังคม</span>
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-blue-900">
            ฿{stats.totalSocialSecurity.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-blue-600 mt-2 font-medium">สปส. 1-10 / ม.33 / กองทุนเงินทดแทน</p>
        </div>

        {/* Revenue Tax */}
        <div
          onClick={() => setSelectedCategory('revenue_tax')}
          className={`p-4 rounded-xl border shadow-sm cursor-pointer transition ${
            selectedCategory === 'revenue_tax'
              ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-400/20'
              : 'bg-white border-slate-200 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-purple-800">รายจ่ายสรรพากร</span>
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-purple-900">
            ฿{stats.totalRevenueTax.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-purple-600 mt-2 font-medium">ภ.ง.ด. 1, 3, 53 / ภ.พ.30 VAT</p>
        </div>

        {/* Accounting Fees */}
        <div
          onClick={() => setSelectedCategory('accounting')}
          className={`p-4 rounded-xl border shadow-sm cursor-pointer transition ${
            selectedCategory === 'accounting'
              ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-400/20'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-800">รายจ่ายบัญชี</span>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-900">
            ฿{stats.totalAccounting.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-600 mt-2 font-medium">ทำบัญชี / สอบบัญชี / ปิดงบ</p>
        </div>

        {/* Other Expenses */}
        <div
          onClick={() => setSelectedCategory('other')}
          className={`p-4 rounded-xl border shadow-sm cursor-pointer transition ${
            selectedCategory === 'other'
              ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/20'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-800">ค่าอื่นๆ</span>
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-amber-900">
            ฿{stats.totalOther.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-amber-600 mt-2 font-medium">ค่าธรรมเนียม / ระบบ / ค่าบริหาร</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Category Tabs & Filter Toolbar */}
        <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50/50">
          {/* Top Category Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                ทั้งหมด ({expenses.length})
              </button>
              <button
                onClick={() => setSelectedCategory('social_security')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  selectedCategory === 'social_security'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>รายจ่ายประกันสังคม</span>
              </button>
              <button
                onClick={() => setSelectedCategory('revenue_tax')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  selectedCategory === 'revenue_tax'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-200'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>รายจ่ายสรรพากร</span>
              </button>
              <button
                onClick={() => setSelectedCategory('accounting')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  selectedCategory === 'accounting'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>รายจ่ายบัญชี</span>
              </button>
              <button
                onClick={() => setSelectedCategory('other')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  selectedCategory === 'other'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>ค่าอื่นๆ</span>
              </button>
            </div>

            {/* Status Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">สถานะ:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="pending">รอนำส่ง / รอชำระ</option>
                <option value="paid">ชำระ / นำส่งแล้ว</option>
                <option value="overdue">เกินกำหนดชำระ</option>
                <option value="cancelled">ยกเลิก</option>
              </select>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาตามเลขที่เอกสาร, ชื่อรายการ, งวดภาษี, ผู้รับเงิน, ผู้รับผิดชอบ หรือเลขที่ใบเสร็จ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Expenses Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                <th className="p-3 w-12 text-center">#</th>
                <th className="p-3">เลขที่ / งวดภาษี</th>
                <th className="p-3">หมวดหมู่ & รายการ</th>
                <th className="p-3">หน่วยงาน / ผู้รับเงิน</th>
                <th className="p-3">กำหนดจ่าย / วันที่ชำระ</th>
                <th className="p-3 text-right">จำนวนเงิน (บาท)</th>
                <th className="p-3 text-right">ค่าปรับ/เงินเพิ่ม</th>
                <th className="p-3 text-right font-bold">รวมจ่ายสุทธิ</th>
                <th className="p-3 text-center">สถานะ</th>
                <th className="p-3 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="w-8 h-8 text-slate-300" />
                      <p className="text-xs text-slate-500 font-medium">ไม่พบรายการรายจ่ายตามเงื่อนไขที่ค้นหา</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense, idx) => {
                  const catConfig = CATEGORY_MAP[expense.category] || CATEGORY_MAP.other;
                  const IconComp = catConfig.icon;
                  const totalPaidVal =
                    expense.totalPaid || (Number(expense.amount) || 0) + (Number(expense.fineOrSurcharge) || 0);

                  return (
                    <tr key={expense.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-mono font-bold text-slate-900">{expense.docNumber}</div>
                        {expense.taxPeriod && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>งวด {expense.taxPeriod}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3 max-w-xs">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${catConfig.bg} ${catConfig.text} ${catConfig.border}`}
                          >
                            <IconComp className="w-3 h-3" />
                            <span>{catConfig.label}</span>
                          </span>
                          {expense.subCategory && (
                            <span className="text-[10px] text-slate-500 truncate">{expense.subCategory}</span>
                          )}
                        </div>
                        <div className="font-medium text-slate-800 line-clamp-1" title={expense.title}>
                          {expense.title}
                        </div>
                        {expense.notes && <div className="text-[10px] text-slate-400 truncate">{expense.notes}</div>}
                      </td>

                      <td className="p-3">
                        <div className="text-slate-800 font-medium">{expense.recipientAgency || '-'}</div>
                        {expense.responsiblePerson && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <UserCheck className="w-3 h-3 text-slate-400" />
                            <span>{expense.responsiblePerson}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="text-slate-700">
                          <span className="text-[10px] text-slate-400 block">กำหนด:</span>
                          <span className="font-mono font-medium">{expense.dueDate || '-'}</span>
                        </div>
                        {expense.paymentDate ? (
                          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                            ชำระจริง: {expense.paymentDate}
                          </div>
                        ) : (
                          <div className="text-[10px] text-amber-600 mt-0.5">ยังไม่ได้ชำระ</div>
                        )}
                      </td>

                      <td className="p-3 text-right font-mono font-medium text-slate-700">
                        ฿{(expense.amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="p-3 text-right font-mono text-rose-600">
                        {expense.fineOrSurcharge && expense.fineOrSurcharge > 0
                          ? `+฿${expense.fineOrSurcharge.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
                          : '-'}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-slate-900 text-sm">
                        ฿{totalPaidVal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleStatus(expense)}
                          title="คลิกเพื่อสลับสถานะ"
                          className="inline-block transition"
                        >
                          {expense.status === 'paid' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>ชำระแล้ว</span>
                            </span>
                          ) : expense.status === 'overdue' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>เกินกำหนด</span>
                            </span>
                          ) : expense.status === 'cancelled' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              <XCircle className="w-3 h-3 text-slate-400" />
                              <span>ยกเลิก</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>รอนำส่ง/รอจ่าย</span>
                            </span>
                          )}
                        </button>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(expense)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="แก้ไข"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense.id, expense.title)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="ลบ"
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

        {/* Footer Summary Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600">
          <div>
            แสดง <span className="font-semibold">{filteredExpenses.length}</span> จากทั้งหมด{' '}
            <span className="font-semibold">{expenses.length}</span> รายการ
          </div>
          <div className="font-mono font-bold text-slate-900 mt-1 sm:mt-0">
            ยอดรวมตามตัวกรอง: ฿
            {filteredExpenses
              .reduce(
                (sum, x) => sum + (x.totalPaid || (Number(x.amount) || 0) + (Number(x.fineOrSurcharge) || 0)),
                0
              )
              .toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Modal: Add / Edit Expense */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">
                  {editingExpense ? 'แก้ไขรายการรายจ่ายทางการ' : 'เพิ่มรายการรายจ่ายทางการใหม่'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveExpense} className="p-6 space-y-4 text-xs">
              {/* Category Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">หมวดหมู่รายจ่าย *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('social_security')}
                    className={`p-2.5 rounded-lg border text-center font-semibold transition flex flex-col items-center gap-1 ${
                      formData.category === 'social_security'
                        ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>ประกันสังคม</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCategoryChange('revenue_tax')}
                    className={`p-2.5 rounded-lg border text-center font-semibold transition flex flex-col items-center gap-1 ${
                      formData.category === 'revenue_tax'
                        ? 'bg-purple-50 border-purple-500 text-purple-800 ring-2 ring-purple-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Receipt className="w-4 h-4 text-purple-600" />
                    <span>สรรพากร</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCategoryChange('accounting')}
                    className={`p-2.5 rounded-lg border text-center font-semibold transition flex flex-col items-center gap-1 ${
                      formData.category === 'accounting'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Calculator className="w-4 h-4 text-emerald-600" />
                    <span>ทำบัญชี/สอบบัญชี</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCategoryChange('other')}
                    className={`p-2.5 rounded-lg border text-center font-semibold transition flex flex-col items-center gap-1 ${
                      formData.category === 'other'
                        ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-amber-600" />
                    <span>ค่าอื่นๆ</span>
                  </button>
                </div>
              </div>

              {/* Sub-Category Preset */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ประเภทปลีกย่อย / แบบยื่น</label>
                <div className="flex gap-2">
                  <select
                    value={formData.subCategory || ''}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  >
                    {(SUB_CATEGORY_PRESETS[formData.category || 'other'] || []).map((preset) => (
                      <option key={preset} value={preset}>
                        {preset}
                      </option>
                    ))}
                    <option value="อื่นๆ (ระบุในรายละเอียด)">อื่นๆ (ระบุในรายละเอียด)</option>
                  </select>
                </div>
              </div>

              {/* Doc Number & Tax Period */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เลขที่เอกสาร / อ้างอิง *</label>
                  <input
                    type="text"
                    required
                    value={formData.docNumber || ''}
                    onChange={(e) => setFormData({ ...formData, docNumber: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">งวดเดือน/ปี ภาษี</label>
                  <input
                    type="month"
                    value={formData.taxPeriod || ''}
                    onChange={(e) => setFormData({ ...formData, taxPeriod: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Title / Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">รายการ / รายละเอียดรายจ่าย *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น เงินสมทบประกันสังคม ม.33 ประจำเดือนมกราคม 2026"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Recipient Agency & Responsible Person */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">หน่วยงาน / ผู้รับเงิน</label>
                  <input
                    type="text"
                    value={formData.recipientAgency || ''}
                    onChange={(e) => setFormData({ ...formData, recipientAgency: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ผู้รับผิดชอบ / ผู้ยื่นเรื่อง</label>
                  <input
                    type="text"
                    value={formData.responsiblePerson || ''}
                    onChange={(e) => setFormData({ ...formData, responsiblePerson: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Amounts section */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">จำนวนเงินหลัก (บาท) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={formData.amount ?? 0}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ค่าปรับ / เงินเพิ่ม (ถ้ามี)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.fineOrSurcharge ?? 0}
                      onChange={(e) => setFormData({ ...formData, fineOrSurcharge: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-rose-600 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ยอดชำระสุทธิ (บาท)</label>
                    <div className="p-2 bg-slate-200/80 border border-slate-300 rounded-lg font-mono font-bold text-indigo-900 text-sm">
                      ฿
                      {(
                        (Number(formData.amount) || 0) + (Number(formData.fineOrSurcharge) || 0)
                      ).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dates & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">กำหนดนำส่ง / จ่าย *</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate || ''}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">วันที่ชำระเงินจริง</label>
                  <input
                    type="date"
                    value={formData.paymentDate || ''}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">สถานะรายการ</label>
                  <select
                    value={formData.status || 'pending'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="pending">รอนำส่ง / รอชำระ</option>
                    <option value="paid">ชำระ / นำส่งแล้ว</option>
                    <option value="overdue">เกินกำหนดชำระ</option>
                    <option value="cancelled">ยกเลิก</option>
                  </select>
                </div>
              </div>

              {/* Payment Method & Receipt No */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ช่องทางชำระเงิน</label>
                  <select
                    value={formData.paymentMethod || 'โอนเงินผ่านธนาคาร'}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="e-Payment (สรรพากร/ประกันสังคม)">e-Payment (สรรพากร/ประกันสังคม)</option>
                    <option value="โอนเงินผ่านธนาคาร">โอนเงินผ่านธนาคาร</option>
                    <option value="เช็คจ่าย">เช็คจ่าย</option>
                    <option value="เงินสด">เงินสด</option>
                    <option value="หักผ่านบัญชีอัตโนมัติ">หักผ่านบัญชีอัตโนมัติ</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เลขที่ใบเสร็จรับเงิน (ถ้ามี)</label>
                  <input
                    type="text"
                    placeholder="เช่น REC-SSO-98214"
                    value={formData.receiptNumber || ''}
                    onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">หมายเหตุเพิ่มเติม</label>
                <textarea
                  rows={2}
                  placeholder="ระบุข้อความหรือหมายเหตุสำหรับฝ่ายบัญชี..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold shadow-sm transition"
                >
                  บันทึกรายการ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl p-6 space-y-6 my-8">
            <div className="flex items-center justify-between border-b pb-4 border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{systemSettings.companyName || 'องค์กร / บริษัท'}</h2>
                <p className="text-xs text-slate-500">
                  รายงานสรุปรายจ่ายประกันสังคม สรรพากร บัญชี และค่าใช้จ่ายทางการ
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>พิมพ์ / บันทึก PDF</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="text-xs space-y-4">
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block">พิมพ์โดย:</span>
                  <span className="font-semibold text-slate-800">{currentUser || 'ผู้ดูแลระบบ'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">วันที่พิมพ์รายงาน:</span>
                  <span className="font-semibold text-slate-800">{new Date().toLocaleString('th-TH')}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <th className="p-2 border-r border-slate-300">#</th>
                      <th className="p-2 border-r border-slate-300">เลขที่ / งวด</th>
                      <th className="p-2 border-r border-slate-300">หมวดหมู่ & รายการ</th>
                      <th className="p-2 border-r border-slate-300">หน่วยงาน</th>
                      <th className="p-2 border-r border-slate-300">กำหนดจ่าย</th>
                      <th className="p-2 border-r border-slate-300 text-right">จำนวนเงิน</th>
                      <th className="p-2 border-r border-slate-300 text-center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((exp, idx) => (
                      <tr key={exp.id} className="border-b border-slate-200">
                        <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-200 font-mono font-semibold">{exp.docNumber}</td>
                        <td className="p-2 border-r border-slate-200">
                          <div className="font-semibold">{exp.title}</div>
                          <div className="text-[10px] text-slate-500">{exp.subCategory}</div>
                        </td>
                        <td className="p-2 border-r border-slate-200">{exp.recipientAgency}</td>
                        <td className="p-2 border-r border-slate-200 font-mono">{exp.dueDate}</td>
                        <td className="p-2 border-r border-slate-200 text-right font-mono font-bold">
                          ฿
                          {(
                            exp.totalPaid || (Number(exp.amount) || 0) + (Number(exp.fineOrSurcharge) || 0)
                          ).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 text-center border-slate-200 font-semibold">
                          {exp.status === 'paid' ? 'ชำระแล้ว' : 'รอนำส่ง'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex justify-between items-center text-sm font-bold text-indigo-950">
                <span>ยอดรวมรายจ่ายในรายงานนี้:</span>
                <span className="font-mono text-base">
                  ฿
                  {filteredExpenses
                    .reduce(
                      (sum, x) => sum + (x.totalPaid || (Number(x.amount) || 0) + (Number(x.fineOrSurcharge) || 0)),
                      0
                    )
                    .toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
