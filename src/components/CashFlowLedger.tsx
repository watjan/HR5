import { useState } from 'react';
import { CashFlowTransaction, PayrollRecord } from '../types';
import { 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Briefcase, 
  FileText, 
  X,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertCircle,
  Edit2,
  Trash2
} from 'lucide-react';

interface CashFlowLedgerProps {
  cashFlow: CashFlowTransaction[];
  payroll: PayrollRecord[];
  onAddTransaction: (tx: CashFlowTransaction) => void;
  onUpdateTransaction?: (tx: CashFlowTransaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

export default function CashFlowLedger({ 
  cashFlow, 
  payroll, 
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction
}: CashFlowLedgerProps) {
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal & Edit/Delete States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<CashFlowTransaction | null>(null);
  
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState<CashFlowTransaction | null>(null);

  // Preset categories for easier input
  const presetIncomes = ['รายได้พัฒนาโครงการ', 'รายได้ SaaS Subscription', 'รายได้ค่าบริการสนับสนุน (SLA)', 'รายได้ให้คำปรึกษา', 'รายได้อื่น ๆ'];
  const presetExpenses = ['ค่าบริการเซิร์ฟเวอร์ Cloud', 'ค่าโฆษณาและการตลาด', 'ค่าเช่าซอฟต์แวร์ลิขสิทธิ์', 'ค่าน้ำไฟ-สาธารณูปโภค', 'ค่าอุปกรณ์ออฟฟิศ', 'ค่าใช้จ่ายอื่น ๆ'];

  // Dynamic automatic payroll transaction creation
  const payrollTransactions: CashFlowTransaction[] = payroll
    .filter(p => p.status === 'paid')
    .map(p => ({
      id: `TX-PAY-${p.id}`,
      type: 'expense' as const,
      category: 'เงินเดือนพนักงาน (ระบบ)',
      amount: p.netSalary,
      date: '2026-06-30', // End of month reference date
      description: `โอนเงินเดือนอิเล็กทรอนิกส์สุทธิ [${p.employeeId}] ${p.employeeName}`,
      status: 'completed' as const
    }));

  const taxTransactions: CashFlowTransaction[] = payroll
    .filter(p => p.status === 'paid')
    .map(p => ({
      id: `TX-TAX-${p.id}`,
      type: 'expense' as const,
      category: 'ภาษีและประกันสังคม (ระบบ)',
      amount: p.tax + p.socialSecurity,
      date: '2026-06-30',
      description: `ภาษีนำส่ง (฿${p.tax.toLocaleString()}) และประกันสังคมสมทบ (฿${p.socialSecurity.toLocaleString()}) [${p.employeeId}] ${p.employeeName}`,
      status: 'completed' as const
    }));

  // Merge manual cash flow items with dynamic system actions
  const allTransactions = [...cashFlow, ...payrollTransactions, ...taxTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Financial aggregates
  const totalIncome = allTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = allTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;
  const marginPercentage = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

  // Category breakdown lists for charts
  const categorySummary: { [key: string]: { amount: number; type: 'income' | 'expense' } } = {};
  allTransactions.forEach(t => {
    if (!categorySummary[t.category]) {
      categorySummary[t.category] = { amount: 0, type: t.type };
    }
    categorySummary[t.category].amount += t.amount;
  });

  const categoriesList = Object.keys(categorySummary).map(catName => ({
    name: catName,
    amount: categorySummary[catName].amount,
    type: categorySummary[catName].type
  })).sort((a, b) => b.amount - a.amount);

  // Get distinct categories for filters
  const uniqueCategories = Array.from(new Set(allTransactions.map(t => t.category)));

  // Filtered transactions
  const filteredTransactions = allTransactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setTxType('income');
    setCategory('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (tx: CashFlowTransaction) => {
    setEditingTransaction(tx);
    setTxType(tx.type);
    setCategory(tx.category);
    setAmount(tx.amount.toString());
    setDate(tx.date);
    setDescription(tx.description);
    setIsAddOpen(true);
  };

  const handleOpenDelete = (tx: CashFlowTransaction) => {
    setDeletingTransaction(tx);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingTransaction && onDeleteTransaction) {
      onDeleteTransaction(deletingTransaction.id);
    }
    setIsDeleteConfirmOpen(false);
    setDeletingTransaction(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !amount || !date || !description) return;

    if (editingTransaction) {
      const updatedTx: CashFlowTransaction = {
        ...editingTransaction,
        type: txType,
        category,
        amount: parseFloat(amount),
        date,
        description
      };
      onUpdateTransaction?.(updatedTx);
    } else {
      const newTx: CashFlowTransaction = {
        id: `TX-${Date.now().toString().slice(-4)}`,
        type: txType,
        category,
        amount: parseFloat(amount),
        date,
        description,
        status: 'completed'
      };
      onAddTransaction(newTx);
    }
    
    // Reset form & close modal
    setCategory('');
    setAmount('');
    setDescription('');
    setEditingTransaction(null);
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-light text-slate-900">ตรวจเช็คกระแสเงินสดขารับและขาจ่าย (System Ledger)</h2>
          <p className="text-xs text-slate-500 mt-1 font-sans">ติดตามสถานะการรับเงินและชำระจ่ายของบริษัท รวมถึงงบเงินเดือนและภาษีที่นำส่งจริงแบบเรียลไทม์</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-sm shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> ลงบันทึกธุรกรรมใหม่
        </button>
      </div>

      {/* Aggregate Financial Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Receivables Card */}
        <div className="bg-white border border-slate-200 rounded-sm p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 tracking-widest font-mono uppercase block">ยอดเงินขารับรวม (Income)</span>
            <span className="text-xl font-extrabold text-emerald-600">฿{totalIncome.toLocaleString()}</span>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600/80 font-sans mt-0.5">
              <ArrowUpRight className="w-3 h-3" />
              <span>จากแคมเปญ SaaS และโครงการส่งมอบ</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-sm">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        {/* Payables Card */}
        <div className="bg-white border border-slate-200 rounded-sm p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 tracking-widest font-mono uppercase block">ยอดเงินขาจ่ายรวม (Expense)</span>
            <span className="text-xl font-extrabold text-rose-600">฿{totalExpense.toLocaleString()}</span>
            <div className="flex items-center gap-1 text-[10px] text-rose-500/80 font-sans mt-0.5">
              <ArrowDownLeft className="w-3 h-3" />
              <span>รวมเงินเดือน ภาษีนำส่ง และค่าดำเนินการ</span>
            </div>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-sm">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Net Profit Margin Card */}
        <div className="bg-white border border-slate-200 rounded-sm p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 tracking-widest font-mono uppercase block">กระแสเงินสดสุทธิ (Net Flow / Margin)</span>
            <span className={`text-xl font-extrabold ${netBalance >= 0 ? 'text-blue-600' : 'text-rose-700'}`}>
              ฿{netBalance.toLocaleString()}
            </span>
            <div className="flex items-center gap-1 text-[10px] font-mono mt-0.5">
              {netBalance >= 0 ? (
                <span className="text-blue-500 font-bold">+{marginPercentage.toFixed(1)}% Profit Margin</span>
              ) : (
                <span className="text-rose-600 font-bold">{marginPercentage.toFixed(1)}% Deficit</span>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-sm ${netBalance >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
            {netBalance >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          </div>
        </div>

      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ledger Transactions Table (2/3 width) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-sm overflow-hidden flex flex-col justify-between">
          <div>
            {/* Table Controller Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <span className="text-xs font-bold text-slate-400 tracking-widest font-mono uppercase">สมุดบันทึกรายงานธุรกรรม (Ledger Transactions)</span>
              
              {/* Type Switch Filter */}
              <div className="flex rounded-sm border border-slate-200 p-0.5 bg-white shrink-0 self-start">
                <button
                  onClick={() => setTypeFilter('all')}
                  className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm transition cursor-pointer ${
                    typeFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  onClick={() => setTypeFilter('income')}
                  className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm transition cursor-pointer ${
                    typeFilter === 'income' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-emerald-600'
                  }`}
                >
                  ขารับ (Income)
                </button>
                <button
                  onClick={() => setTypeFilter('expense')}
                  className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm transition cursor-pointer ${
                    typeFilter === 'expense' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:text-rose-600'
                  }`}
                >
                  ขาจ่าย (Expense)
                </button>
              </div>
            </div>

            {/* Sub-Filters / Search Box */}
            <div className="p-4 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/30">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาตามคำอธิบาย หรือรหัส..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-sm text-xs text-slate-700 bg-white focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs text-slate-700 bg-white focus:outline-none focus:border-blue-500 font-mono"
                >
                  <option value="all">กรองตามหมวดหมู่ (ทั้งหมด)</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Main Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono bg-slate-50/50">
                    <th className="py-2.5 px-4 w-24">รหัส / วันที่</th>
                    <th className="py-2.5 px-4 w-40">หมวดหมู่</th>
                    <th className="py-2.5 px-4">รายละเอียดคำอธิบายธุรกรรม</th>
                    <th className="py-2.5 px-4 text-right w-32">จำนวนเงิน</th>
                    <th className="py-2.5 px-4 text-center w-28">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-sans">ไม่พบประวัติรายการที่ตรงตามเงื่อนไขตัวกรอง</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map(tx => {
                      const isIncome = tx.type === 'income';
                      const isSystem = tx.id.startsWith('TX-PAY') || tx.id.startsWith('TX-TAX');
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/40 transition">
                          {/* Date & ID */}
                          <td className="py-3 px-4 font-mono">
                            <span className="text-[9px] text-slate-400 block leading-none mb-1">{tx.id}</span>
                            <span className="text-slate-600 block leading-none">{tx.date}</span>
                          </td>
                          
                          {/* Category Badge */}
                          <td className="py-3 px-4 font-sans">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-semibold ${
                              isIncome 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                : 'bg-slate-50 text-slate-700 border border-slate-200'
                            }`}>
                              {tx.category}
                            </span>
                          </td>
                          
                          {/* Description */}
                          <td className="py-3 px-4">
                            <span className="text-slate-800 font-medium block leading-snug">{tx.description}</span>
                            {isSystem && (
                              <span className="text-[9px] font-mono text-blue-500 uppercase tracking-widest mt-0.5 block">
                                [ ดำเนินการอัตโนมัติโดยโมดูล HR ]
                              </span>
                            )}
                          </td>
                          
                          {/* Amount */}
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            <span className={isIncome ? 'text-emerald-600' : 'text-slate-900'}>
                              {isIncome ? '+' : '-'}&nbsp;฿{tx.amount.toLocaleString()}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-center">
                            {!isSystem ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEdit(tx)}
                                  className="p-1 border border-slate-200 hover:border-blue-500 text-slate-500 hover:text-blue-600 rounded-sm hover:bg-blue-50/50 transition cursor-pointer"
                                  title="แก้ไขรายการ"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenDelete(tx)}
                                  className="p-1 border border-slate-200 hover:border-rose-500 text-slate-500 hover:text-rose-600 rounded-sm hover:bg-rose-50/50 transition cursor-pointer"
                                  title="ลบรายการ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono italic">ระบบล็อก</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table Footer Status bar */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 text-[10px] font-mono text-slate-400 flex justify-between items-center">
            <span>แสดงทั้งหมด {filteredTransactions.length} จาก {allTransactions.length} รายการ</span>
            <span>ระบบเชื่อมโยงอัตโนมัติกับ Payroll สมบูรณ์</span>
          </div>
        </div>

        {/* Category Breakdown (1/3 width) */}
        <div className="bg-white border border-slate-200 rounded-sm p-5 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 tracking-widest font-mono uppercase">สรุปสัดส่วนรายรับ-รายจ่าย</h3>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">จำแนกหมวดหมู่ที่ใช้จ่ายสูงสุดในออฟฟิศ</p>
            </div>

            {/* List of categories with visual gauge progress bar */}
            <div className="space-y-4.5">
              {categoriesList.map(cat => {
                const isInc = cat.type === 'income';
                // Find percentage compared to its pool (income pool or expense pool)
                const poolTotal = isInc ? totalIncome : totalExpense;
                const pct = poolTotal > 0 ? (cat.amount / poolTotal) * 100 : 0;
                
                return (
                  <div key={cat.name} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-700">{cat.name}</span>
                      <span className="font-mono text-slate-400 text-[10px]">฿{cat.amount.toLocaleString()} ({pct.toFixed(0)}%)</span>
                    </div>
                    {/* Progress slider base */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${pct}%` }} 
                        className={`h-full rounded-full ${isInc ? 'bg-emerald-500' : 'bg-slate-400'}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Business suggestions message */}
          <div className="p-3.5 bg-blue-50/50 rounded-sm border border-blue-100 flex gap-2.5 text-xs text-blue-800">
            <TrendingUp className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block font-mono uppercase text-[10px]">Financial Recommendation</span>
              <p className="text-slate-600 leading-normal font-sans text-[11px]">
                {netBalance >= 0 
                  ? 'สภาพคล่องกระแสเงินสดอยู่ในเกณฑ์เสถียร มีกำไรสะสมสะท้อนเชิงบวก สามารถอนุมัติงบค่าตอบแทนพนักงานพิเศษหรือพิจารณาเปิดรับพนักงานเพิ่มเติมได้' 
                  : 'กระแสเงินสดของบริษัทติดลบชั่วคราว ควรตรวจสอบยอดค้างชำระของลูกค้า หรือพิจารณาลดสัดส่วนค่าโฆษณาหาพนักงานลง'
                }
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Manual record creation / modification dialog modal */}
      {isAddOpen && (
        <div id="add-transaction-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-sm border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-850 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                <Coins className="w-5 h-5 text-blue-600" /> {editingTransaction ? 'แก้ไขรายการบัญชี' : 'ลงบันทึกรายการบัญชีใหม่'}
              </h3>
              <button 
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingTransaction(null);
                }} 
                className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs text-slate-700">
              
              {/* Type toggle switch */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">ประเภทธุรกรรม *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('income');
                      setCategory('');
                    }}
                    className={`py-2 text-center rounded-sm border text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                      txType === 'income' 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600 bg-white'
                    }`}
                  >
                    ขารับ (Income)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('expense');
                      setCategory('');
                    }}
                    className={`py-2 text-center rounded-sm border text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer ${
                      txType === 'expense' 
                        ? 'bg-rose-50 border-rose-500 text-rose-700' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600 bg-white'
                    }`}
                  >
                    ขาจ่าย (Expense)
                  </button>
                </div>
              </div>

              {/* Amount & Date Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">จำนวนเงิน (฿) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="เช่น 5000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">วันที่ทำรายการ *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white font-mono"
                    required
                  />
                </div>
              </div>

              {/* Category selector with presets */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">หมวดหมู่รายการ *</label>
                <div className="flex gap-2">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-sm text-slate-700 focus:outline-none focus:border-blue-500 bg-white font-sans"
                    required
                  >
                    <option value="">-- เลือกหมวดหมู่สำเร็จรูป --</option>
                    {(txType === 'income' ? presetIncomes : presetExpenses).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                {/* Manual text input fallback */}
                <input
                  type="text"
                  placeholder="หรือพิมพ์ชื่อหมวดหมู่ที่ต้องการเอง..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white text-slate-700 font-sans mt-1"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block font-mono uppercase tracking-wide">รายละเอียดอธิบายธุรกรรม *</label>
                <textarea
                  placeholder="เช่น ค่าจัดจ้างโครงการพัฒนา, ค่าเช่า Figma รอบเดือน..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 h-16 resize-none bg-white font-sans text-xs"
                  required
                ></textarea>
              </div>

              {/* Action Dialog Buttons */}
              <div className="flex gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditingTransaction(null);
                  }}
                  className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-sm font-mono font-bold uppercase tracking-wider transition cursor-pointer bg-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-mono font-bold uppercase tracking-wider shadow-xs transition cursor-pointer"
                >
                  {editingTransaction ? 'บันทึกการแก้ไข' : 'บันทึกลงบัญชี'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION ALERT DIALOG */}
      {isDeleteConfirmOpen && deletingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-rose-200 rounded-sm shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="p-4 border-b border-rose-100 flex justify-between items-center bg-rose-50">
              <div className="flex items-center gap-2 text-rose-700 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs uppercase tracking-widest font-mono">
                  ยืนยันการลบรายการธุรกรรม (Confirm Delete)
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="p-1 hover:bg-rose-100 rounded text-rose-400 hover:text-rose-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-2">
                <p className="text-slate-800 text-sm leading-relaxed font-semibold">
                  คุณต้องการลบธุรกรรม <strong className="text-slate-950 font-bold">"{deletingTransaction.description}"</strong> ใช่หรือไม่?
                </p>
                <p className="text-slate-500 leading-relaxed">
                  เมื่อยืนยันการลบแล้ว ข้อมูลธุรกรรมนี้จะถูกลบออกไปอย่างถาวรและไม่สามารถกู้คืนกลับมาได้
                </p>
              </div>

              {/* Summary card inside confirm */}
              <div className="bg-slate-50 border border-slate-150 p-3 rounded-sm space-y-1.5 font-mono text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span>รหัสธุรกรรม:</span>
                  <span className="font-bold text-slate-800">{deletingTransaction.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>ประเภท:</span>
                  <span className={`font-bold ${deletingTransaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {deletingTransaction.type === 'income' ? 'ขารับ (Income)' : 'ขาจ่าย (Expense)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>หมวดหมู่:</span>
                  <span className="font-bold text-slate-800">{deletingTransaction.category}</span>
                </div>
                <div className="flex justify-between">
                  <span>วันที่ทำรายการ:</span>
                  <span className="font-bold text-slate-800">{deletingTransaction.date}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 text-xs">
                  <span>จำนวนเงิน:</span>
                  <span className={`font-black ${deletingTransaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ฿{deletingTransaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-sm font-bold uppercase tracking-wider transition cursor-pointer font-mono"
                >
                  Cancel / ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-sm font-bold uppercase tracking-wider transition cursor-pointer font-mono shadow-xs"
                >
                  Confirm Delete / ยืนยันการลบ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
