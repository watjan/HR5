import { useState, useEffect, useRef } from 'react';
import { SalesRecord } from '../types';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Coins, 
  FileText, 
  X,
  CreditCard,
  Building2,
  Trash2,
  Edit2,
  ChevronRight,
  BarChart3,
  CalendarDays,
  CalendarRange,
  ArrowUpRight,
  Sparkles,
  ShoppingBag,
  Layers,
  ArrowDownWideNarrow,
  Target,
  Percent,
  Activity,
  Award,
  User,
  QrCode,
  Wallet,
  RefreshCw
} from 'lucide-react';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface SalesManagementProps {
  sales: SalesRecord[];
  onAddSale: (newSale: SalesRecord) => void;
  onUpdateSale: (updatedSale: SalesRecord) => void;
  onDeleteSale: (id: string) => void;
}



// -------------------------------------------------------------
// MAIN SALES MANAGEMENT COMPONENT
// -------------------------------------------------------------
export default function SalesManagement({ sales, onAddSale, onUpdateSale, onDeleteSale }: SalesManagementProps) {
  // Tabs for aggregation: 'all_records' | 'daily' | 'monthly' | 'yearly'
  const [activeTab, setActiveTab] = useState<'all_records' | 'daily' | 'monthly' | 'yearly'>('daily');
  // Sub-tabs for KPI visualization
  const [chartTab, setChartTab] = useState<'trends' | 'breakdown'>('trends');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');

  // CRUD Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<SalesRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formAmount, setFormAmount] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formPaymentChannel, setFormPaymentChannel] = useState<string>('transfer');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formReceiptNumber, setFormReceiptNumber] = useState('');

  // 1. Process individual records with basic filters
  const filteredSales = sales.filter(item => {
    const matchesSearch = 
      (item.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.receiptNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.date.includes(searchTerm);
      
    let matchesChannel = true;
    if (channelFilter !== 'all') {
      matchesChannel = item.paymentChannel === channelFilter;
    }
      
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && item.date >= startDate;
    }
    if (endDate) {
      matchesDate = matchesDate && item.date <= endDate;
    }
    
    return matchesSearch && matchesChannel && matchesDate;
  });

  // Sort by date descending
  const sortedSales = [...filteredSales].sort((a, b) => b.date.localeCompare(a.date));

  // 2. AGGREGATIONS
  // A. Daily Aggregation
  const dailyAggregation = filteredSales.reduce((acc, item) => {
    const key = item.date;
    if (!acc[key]) {
      acc[key] = { date: key, amount: 0, count: 0, records: [] as SalesRecord[] };
    }
    acc[key].amount += item.amount;
    acc[key].count += 1;
    acc[key].records.push(item);
    return acc;
  }, {} as Record<string, { date: string; amount: number; count: number; records: SalesRecord[] }>);

  const dailyList = Object.values(dailyAggregation).sort((a, b) => b.date.localeCompare(a.date));

  // B. Monthly Aggregation (YYYY-MM)
  const monthlyAggregation = filteredSales.reduce((acc, item) => {
    const key = item.date.slice(0, 7); // Get YYYY-MM
    if (!acc[key]) {
      acc[key] = { month: key, amount: 0, count: 0 };
    }
    acc[key].amount += item.amount;
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { month: string; amount: number; count: number }>);

  const monthlyList = Object.values(monthlyAggregation).sort((a, b) => b.month.localeCompare(a.month));

  // C. Yearly Aggregation (YYYY)
  const yearlyAggregation = filteredSales.reduce((acc, item) => {
    const key = item.date.slice(0, 4); // Get YYYY
    if (!acc[key]) {
      acc[key] = { year: key, amount: 0, count: 0 };
    }
    acc[key].amount += item.amount;
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { year: string; amount: number; count: number }>);

  const yearlyList = Object.values(yearlyAggregation).sort((a, b) => b.year.localeCompare(a.year));

  // 3. STATS CARDS
  const totalSalesAmount = filteredSales.reduce((sum, item) => sum + item.amount, 0);
  const totalInvoicesCount = filteredSales.length;
  const averageOrderValue = totalInvoicesCount > 0 ? totalSalesAmount / totalInvoicesCount : 0;
  
  // MTD (Month to Date) Sales for current month (assume July 2026 based on mock clock)
  const currentMonthStr = "2026-07";
  const mtdSalesAmount = filteredSales
    .filter(item => item.date.startsWith(currentMonthStr))
    .reduce((sum, item) => sum + item.amount, 0);

  // 4. CHART PREPARATION (Last 7 active days of daily sales)
  const chartDays = [...Object.values(dailyAggregation)]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

  const maxChartVal = chartDays.length > 0 ? Math.max(...chartDays.map(d => d.amount)) * 1.15 : 100000;

  // --- KPI & Analytics Preprocessors ---
  const SALES_TARGET_JULY_2026 = 500000; // Target for July 2026
  const targetPercentage = Math.min(100, (mtdSalesAmount / SALES_TARGET_JULY_2026) * 100);
  const remainingToTarget = Math.max(0, SALES_TARGET_JULY_2026 - mtdSalesAmount);

  // Dynamic classification of sales channels/payment channels
  const getChannelData = () => {
    const channels: Record<string, number> = {
      'เงินโอน (Bank Transfer)': 0,
      'เงินสด (Cash Store)': 0,
      'บัตรเครดิต (Credit Card)': 0,
      'สแกน QR (PromptPay)': 0,
      'ไม่ระบุช่องทาง (Others)': 0
    };

    filteredSales.forEach(item => {
      const channel = item.paymentChannel || '';
      if (channel === 'transfer') {
        channels['เงินโอน (Bank Transfer)'] += item.amount;
      } else if (channel === 'cash') {
        channels['เงินสด (Cash Store)'] += item.amount;
      } else if (channel === 'credit_card') {
        channels['บัตรเครดิต (Credit Card)'] += item.amount;
      } else if (channel === 'qr') {
        channels['สแกน QR (PromptPay)'] += item.amount;
      } else {
        channels['ไม่ระบุช่องทาง (Others)'] += item.amount;
      }
    });

    return Object.entries(channels)
      .map(([name, value]) => ({ name, value }))
      .filter(c => c.value > 0);
  };

  // Recharts monthly comparison dataset
  const getMonthlyChartData = () => {
    const sortedMonths = [...monthlyList].reverse(); // oldest to newest
    return sortedMonths.map(m => {
      let label = m.month;
      try {
        const [year, month] = m.month.split('-');
        const d = new Date(parseInt(year), parseInt(month) - 1, 1);
        label = d.toLocaleDateString('th-TH', { month: 'short' }) + ' ' + (parseInt(year) + 543).toString().slice(-2);
      } catch (e) {}
      
      return {
        name: label,
        'ยอดขาย': m.amount,
        'จำนวนบิล': m.count
      };
    });
  };

  // Recharts daily area chart trend dataset
  const getDailyChartData = () => {
    const sortedDays = [...Object.values(dailyAggregation)]
      .sort((a, b) => a.date.localeCompare(b.date));
    return sortedDays.map(d => {
      let label = d.date;
      try {
        const parts = d.date.split('-');
        label = `${parseInt(parts[2])}/${parseInt(parts[1])}`;
      } catch (e) {}
      
      return {
        name: label,
        'ยอดขาย': d.amount,
        'จำนวนบิล': d.count,
        'วันที่': d.date
      };
    });
  };

  const PIE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#0d9488', '#64748b'];

  // 5. MODAL HELPERS
  const openAddModal = () => {
    setEditingSale(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormAmount('');
    setFormNotes('');
    setFormPaymentChannel('transfer');
    setFormCustomerName('');
    // Auto-generate sequential-looking receipt numbers
    setFormReceiptNumber(`RE-${Date.now().toString().slice(-4)}`);
    setIsModalOpen(true);
  };

  const openEditModal = (sale: SalesRecord) => {
    setEditingSale(sale);
    setFormDate(sale.date);
    setFormAmount(sale.amount.toString());
    setFormNotes(sale.notes || '');
    setFormPaymentChannel(sale.paymentChannel || 'transfer');
    setFormCustomerName(sale.customerName || '');
    setFormReceiptNumber(sale.receiptNumber || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate || !formAmount) return;

    const recordAmount = parseFloat(formAmount);
    if (isNaN(recordAmount) || recordAmount <= 0) return;

    if (editingSale) {
      onUpdateSale({
        ...editingSale,
        date: formDate,
        amount: recordAmount,
        notes: formNotes,
        paymentChannel: formPaymentChannel,
        customerName: formCustomerName,
        receiptNumber: formReceiptNumber
      });
    } else {
      onAddSale({
        id: `SL-${Date.now().toString().slice(-4)}`,
        date: formDate,
        amount: recordAmount,
        notes: formNotes,
        paymentChannel: formPaymentChannel,
        customerName: formCustomerName,
        receiptNumber: formReceiptNumber
      });
    }
    setIsModalOpen(false);
  };

  const formatThaiDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const formatThaiMonth = (monthStr: string) => {
    try {
      const [year, month] = monthStr.split('-');
      const d = new Date(parseInt(year), parseInt(month) - 1, 1);
      return d.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long'
      });
    } catch (e) {
      return monthStr;
    }
  };

  const formatThaiYear = (yearStr: string) => {
    const yearInt = parseInt(yearStr);
    if (!isNaN(yearInt)) {
      return `ปี พ.ศ. ${yearInt + 543}`;
    }
    return yearStr;
  };

  const getPaymentChannelBadge = (channel?: string) => {
    switch (channel) {
      case 'cash':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            💵 เงินสด (Cash)
          </span>
        );
      case 'transfer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            🏦 เงินโอน (Transfer)
          </span>
        );
      case 'credit_card':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 text-[10px] font-bold font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
            💳 บัตรเครดิต (Card)
          </span>
        );
      case 'qr':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100 text-[10px] font-bold font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
            📱 สแกน QR (PromptPay)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
            อื่นๆ / ไม่ระบุ
          </span>
        );
    }
  };

  return (
    <div id="sales-management-container" className="space-y-6 animate-fade-in pb-16">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-widest rounded-xs">FINANCIAL MODULE</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 text-xs font-semibold flex items-center gap-1 font-mono">
              <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" /> LIVE TRACKING & SALES LEDGER
            </span>
          </div>
          <h2 className="text-xl font-light text-slate-900 mt-1">บริหารจัดการและรายงานวิเคราะห์ยอดขาย (Sales Ledger)</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            สรุปข้อมูลยอดขายรวมรายวัน รายเดือน และรายปี ตรวจสอบธุรกรรม พร้อมช่องทางรับเงินและช่องทางรับโอนเงินอย่างละเอียด
          </p>
        </div>
        
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-sm shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>บันทึกธุรกรรมยอดขายใหม่</span>
        </button>
      </div>

      {/* 2. STATS KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-sm p-5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-widest font-sans">ยอดขายรวมทั้งหมด</span>
            <Coins className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              ฿{totalSalesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-sans">
            ยอดขายสะสมรวมจากตัวกรองปัจจุบัน
          </p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 -z-10 opacity-40"></div>
        </div>

        <div className="bg-white border border-slate-200 rounded-sm p-5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-widest font-sans">ยอดขายเดือนปัจจุบัน (MTD)</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              ฿{mtdSalesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-sans">
            ข้อมูลประจำเดือน {formatThaiMonth(currentMonthStr)}
          </p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 -z-10 opacity-30"></div>
        </div>

        <div className="bg-white border border-slate-200 rounded-sm p-5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-widest font-sans">จำนวนรายการธุรกรรม</span>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {totalInvoicesCount.toLocaleString()} รายการ
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-sans">
            จำนวนรายการบันทึกยอดขายทั้งหมด
          </p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-12 -mt-12 -z-10 opacity-30"></div>
        </div>

        <div className="bg-white border border-slate-200 rounded-sm p-5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-widest font-sans">มูลค่าเฉลี่ยต่อรายการ</span>
            <ArrowUpRight className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              ฿{averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-sans">
            ค่าเฉลี่ยยอดเงินรวมต่อหนึ่งรายการ
          </p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-12 -mt-12 -z-10 opacity-30"></div>
        </div>
      </div>

      {/* 3. CORE GRID: REPORTS AND LEDGER BLOCKS */}
      <div className="w-full space-y-6">
          
          {/* CHARTS & ANALYTICS VISUALIZER */}
          {filteredSales.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-sm p-5 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-rose-600 animate-pulse" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Sales KPI & Revenue Analytics</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">ระบบวิเคราะห์ข้อมูลและรายงานเปรียบเทียบเป้าหมายการขาย (KPI)</p>
                </div>
                
                {/* Chart Sub-Tabs */}
                <div className="flex bg-slate-100 p-0.5 rounded-sm self-stretch md:self-auto">
                  <button
                    type="button"
                    onClick={() => setChartTab('trends')}
                    className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold transition rounded-xs cursor-pointer ${
                      chartTab === 'trends' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    <span>แนวโน้มยอดขาย & KPI Target</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartTab('breakdown')}
                    className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold transition rounded-xs cursor-pointer ${
                      chartTab === 'breakdown' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-600" />
                    <span>ช่องทางชำระเงิน & สัดส่วนรายได้</span>
                  </button>
                </div>
              </div>

              {chartTab === 'trends' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left & Middle: Area Chart Trend */}
                  <div className="lg:col-span-2 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">กราฟแนวโน้มยอดขายตามจริง (Actual Sales Timeline)</span>
                      <span className="text-slate-400 font-mono text-[10px]">แกน X: วันทำรายการ | แกน Y: ยอดเงิน (บาท)</span>
                    </div>
                    
                    <div className="h-64 w-full bg-slate-50/50 p-2 border border-slate-100 rounded-sm">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={getDailyChartData()}
                          margin={{ top: 15, right: 15, left: 10, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.01}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 9, fill: '#64748b' }} 
                            axisLine={{ stroke: '#cbd5e1' }}
                          />
                          <YAxis 
                            tick={{ fontSize: 9, fill: '#64748b' }} 
                            axisLine={{ stroke: '#cbd5e1' }}
                            tickFormatter={(value) => `฿${Math.round(value / 1000)}k`}
                          />
                          <RechartsTooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px' }}
                            labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }}
                            itemStyle={{ color: '#38bdf8', fontSize: '11px', fontWeight: 'bold' }}
                            formatter={(value: any) => [`฿${Number(value).toLocaleString()}`, 'ยอดขาย']}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="ยอดขาย" 
                            stroke="#2563eb" 
                            strokeWidth={2} 
                            fillOpacity={1} 
                            fill="url(#colorRevenue)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right: Target Progress KPI Meter Card */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-sm p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-slate-800 mb-3 pb-2 border-b border-slate-200/40">
                        <Award className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold uppercase tracking-wider">ดัชนีชี้วัดเป้าหมายรายเดือน</span>
                      </div>

                      <div className="space-y-4">
                        {/* Monthly Target Indicator */}
                        <div>
                          <div className="flex justify-between items-baseline text-xs mb-1">
                            <span className="text-slate-500 font-bold">เป้าหมายประจำเดือน {formatThaiMonth(currentMonthStr)}:</span>
                            <span className="font-mono font-black text-slate-900">฿{SALES_TARGET_JULY_2026.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-baseline text-xs mb-1.5">
                            <span className="text-slate-500">ทำได้จริงสะสม (MTD):</span>
                            <span className="font-mono font-bold text-blue-600">฿{mtdSalesAmount.toLocaleString()}</span>
                          </div>
                          
                          {/* Progress Bar Container */}
                          <div className="space-y-1">
                            <div className="w-full bg-slate-200 rounded-full h-3.5 overflow-hidden border border-slate-300/40 flex">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${targetPercentage}%` }}
                              />
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-slate-400">บรรลุเป้าหมายแล้ว</span>
                              <span className="font-mono font-bold text-emerald-600">{targetPercentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Gap analysis */}
                        <div className="p-3 bg-white border border-slate-200 rounded-xs space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono block">GAP ANALYSIS</span>
                          {remainingToTarget > 0 ? (
                            <>
                              <p className="text-xs text-rose-600 font-bold font-sans">ขาดอีก ฿{remainingToTarget.toLocaleString()} จะถึงเป้าหมาย</p>
                              <p className="text-[9px] text-slate-500">มียอดขายปัจจุบันเป็น {targetPercentage.toFixed(0)}% ของเป้าหมายประจำเดือน</p>
                            </>
                          ) : (
                            <>
                              <p className="text-xs text-emerald-600 font-bold font-sans">🎉 ทะลุเป้าหมายสำเร็จ!</p>
                              <p className="text-[9px] text-slate-500">ยอดขายเกินเป้าหมายประจำเดือนไปแล้ว {Math.round(mtdSalesAmount - SALES_TARGET_JULY_2026).toLocaleString()} บาท</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-200/40 pt-3 mt-4 flex items-center justify-between text-[10px] text-slate-400 font-sans">
                      <span>เป้าหมายขั้นต่ำรายไตรมาส:</span>
                      <span className="font-mono font-bold text-slate-700">฿1.5M</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Chart: Revenue Distribution Pie Chart */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">สัดส่วนช่องทางชำระเงินและโครงสร้างรายได้ (Revenue Shares)</span>
                      <span className="text-[10px] text-slate-400">จำแนกตามการบันทึกช่องทางรับเงิน</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center bg-slate-50/50 p-3 border border-slate-100 rounded-sm">
                      {/* Recharts Pie component */}
                      <div className="sm:col-span-3 h-52 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getChannelData()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={75}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {getChannelData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              formatter={(value) => `฿${Number(value).toLocaleString()}`}
                              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '4px' }}
                              itemStyle={{ color: '#fff', fontSize: '11px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Legends list */}
                      <div className="sm:col-span-2 space-y-2">
                        {getChannelData().map((entry, idx) => {
                          const totalVal = getChannelData().reduce((sum, c) => sum + c.value, 0);
                          const pct = totalVal > 0 ? (entry.value / totalVal) * 100 : 0;
                          return (
                            <div key={entry.name} className="flex flex-col text-[10px] border-b border-slate-100 pb-1 last:border-0">
                              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                                <span className="truncate max-w-[110px]" title={entry.name}>{entry.name}</span>
                              </div>
                              <div className="flex justify-between text-slate-400 font-mono mt-0.5">
                                <span>฿{Math.round(entry.value / 1000)}k</span>
                                <span className="font-bold text-slate-500">{pct.toFixed(0)}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right Chart: Monthly Sales Comparisons Bar Chart */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">เปรียบเทียบยอดขายสุทธิรายเดือน (Month-on-Month)</span>
                      <span className="text-[10px] text-slate-400">ภาพรวมรายรับรายเดือนสะสม</span>
                    </div>

                    <div className="h-52 w-full bg-slate-50/50 p-2 border border-slate-100 rounded-sm">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={getMonthlyChartData()}
                          margin={{ top: 15, right: 10, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 9, fill: '#64748b' }} 
                            axisLine={{ stroke: '#cbd5e1' }}
                          />
                          <YAxis 
                            tick={{ fontSize: 9, fill: '#64748b' }} 
                            axisLine={{ stroke: '#cbd5e1' }}
                            tickFormatter={(value) => `฿${Math.round(value / 1000)}k`}
                          />
                          <RechartsTooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px' }}
                            labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }}
                            itemStyle={{ color: '#38bdf8', fontSize: '11px', fontWeight: 'bold' }}
                            formatter={(value: any) => [`฿${Number(value).toLocaleString()}`, 'ยอดเงิน']}
                          />
                          <Bar 
                            dataKey="ยอดขาย" 
                            fill="#3b82f6" 
                            radius={[2, 2, 0, 0]}
                            barSize={32}
                          >
                            {getMonthlyChartData().map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={index === getMonthlyChartData().length - 1 ? '#10b981' : '#3b82f6'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <p className="text-[9px] text-slate-400 leading-normal font-sans">
                      💡 แท่งกราฟสีเขียวแสดงถึงยอดขายของเดือนปัจจุบันที่กำลังเกิดขึ้นเพื่อเปรียบเทียบเชิงสถิติ MoM
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FILTERS GRID */}
          <div className="bg-white border border-slate-200 rounded-sm p-4 space-y-4">
            <div className="flex items-center gap-1.5 text-slate-800">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold uppercase tracking-wider font-sans">เครื่องมือค้นหาและกรองข้อมูล (Sales Search & Filters)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search Term */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">คำค้นหา (รายละเอียด/ลูกค้า/บิล)</span>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ค้นหาชื่อลูกค้า, บิล, โน้ต..."
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-sm text-xs font-sans focus:outline-none focus:border-blue-500 transition bg-white"
                  />
                </div>
              </div>

              {/* Payment Channel Filter */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">ช่องทางชำระเงิน</span>
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs font-sans bg-white focus:outline-none focus:border-blue-500 transition"
                >
                  <option value="all">🏦 ทั้งหมดทุกช่องทาง</option>
                  <option value="transfer">🏦 เงินโอนผ่านธนาคาร</option>
                  <option value="cash">💵 เงินสด</option>
                  <option value="credit_card">💳 บัตรเครดิต</option>
                  <option value="qr">📱 สแกน QR / PromptPay</option>
                </select>
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">ตั้งแต่วันที่</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs font-sans bg-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">ถึงวันที่</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-sm text-xs font-sans bg-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Clear Filters indicator */}
            {(searchTerm || startDate || endDate || channelFilter !== 'all') && (
              <div className="flex justify-between items-center text-[11px] text-slate-500 font-sans border-t border-slate-100 pt-3">
                <span>ใช้เงื่อนไขตัวกรองข้อมูลอยู่...</span>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStartDate('');
                    setEndDate('');
                    setChannelFilter('all');
                  }}
                  className="text-blue-600 hover:underline font-bold cursor-pointer text-xs"
                >
                  ล้างเงื่อนไขตัวกรองทั้งหมด
                </button>
              </div>
            )}
          </div>

          {/* TAB SYSTEM & MAIN TAB PANEL */}
          <div className="space-y-4">
            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-white p-1 rounded-sm gap-1 overflow-x-auto">
              <button
                onClick={() => setActiveTab('daily')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition rounded-sm cursor-pointer whitespace-nowrap ${
                  activeTab === 'daily'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>ยอดขายรวมรายวัน (Daily Sum)</span>
              </button>

              <button
                onClick={() => setActiveTab('monthly')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition rounded-sm cursor-pointer whitespace-nowrap ${
                  activeTab === 'monthly'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>ยอดขายรวมรายเดือน (Monthly Sum)</span>
              </button>

              <button
                onClick={() => setActiveTab('yearly')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition rounded-sm cursor-pointer whitespace-nowrap ${
                  activeTab === 'yearly'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>ยอดขายรวมรายปี (Yearly Sum)</span>
              </button>

              <button
                onClick={() => setActiveTab('all_records')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition rounded-sm cursor-pointer whitespace-nowrap ${
                  activeTab === 'all_records'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>ตรวจสอบธุรกรรมทั้งหมด (Transaction Checker)</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="bg-white border border-slate-200 rounded-sm overflow-hidden">
              
              {/* TAB: DAILY AGGREGATION */}
              {activeTab === 'daily' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[10px] uppercase font-bold tracking-wider font-mono">
                        <th className="py-3.5 px-6">วันที่ทำรายการ (Date)</th>
                        <th className="py-3.5 px-6 text-center">จำนวนรายการ (Entries)</th>
                        <th className="py-3.5 px-6 text-right">ยอดขายรวมสุทธิ (Total Sales)</th>
                        <th className="py-3.5 px-6 text-right">ยอดเฉลี่ยต่อรายการ</th>
                        <th className="py-3.5 px-6"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white font-sans">
                      {dailyList.length > 0 ? (
                        dailyList.map((day) => {
                          const avg = day.amount / day.count;
                          return (
                            <tr key={day.date} className="hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2.5">
                                  <Calendar className="w-4 h-4 text-slate-400" />
                                  <div>
                                    <span className="font-bold text-slate-900 block">{formatThaiDate(day.date)}</span>
                                    <span className="text-[10px] font-mono text-slate-400 block">{day.date}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-center font-mono font-bold text-slate-600">
                                {day.count} รายการ
                              </td>
                              <td className="py-4 px-6 text-right font-mono font-black text-slate-900">
                                ฿{day.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-4 px-6 text-right font-mono text-slate-500">
                                ฿{avg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-4 px-6 text-right">
                                <button
                                  onClick={() => {
                                    setSearchTerm('');
                                    setStartDate(day.date);
                                    setEndDate(day.date);
                                    setActiveTab('all_records');
                                  }}
                                  className="px-2.5 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-sm transition cursor-pointer"
                                >
                                  ดูรายละเอียดรายการ
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">
                            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-500" />
                            <p className="text-xs font-bold text-slate-400">ไม่พบข้อมูลยอดขายรายวันตามเงื่อนไขตัวกรอง</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB: MONTHLY AGGREGATION */}
              {activeTab === 'monthly' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[10px] uppercase font-bold tracking-wider font-mono">
                        <th className="py-3.5 px-6">เดือนปี (Month-Year)</th>
                        <th className="py-3.5 px-6 text-center">จำนวนรายการทั้งหมด (Total Entries)</th>
                        <th className="py-3.5 px-6 text-right">ยอดขายรวมสุทธิ (Monthly Total)</th>
                        <th className="py-3.5 px-6 text-right">ยอดเฉลี่ยต่อรายการ</th>
                        <th className="py-3.5 px-6"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white font-sans">
                      {monthlyList.length > 0 ? (
                        monthlyList.map((month) => {
                          const avg = month.amount / month.count;
                          return (
                            <tr key={month.month} className="hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2.5">
                                  <CalendarRange className="w-4 h-4 text-blue-500" />
                                  <div>
                                    <span className="font-bold text-slate-900 block">{formatThaiMonth(month.month)}</span>
                                    <span className="text-[10px] font-mono text-slate-400 block">{month.month}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-center font-mono font-bold text-slate-600">
                                {month.count} รายการ
                              </td>
                              <td className="py-4 px-6 text-right font-mono font-black text-slate-900">
                                ฿{month.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-4 px-6 text-right font-mono text-slate-500">
                                ฿{avg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-4 px-6 text-right">
                                <button
                                  onClick={() => {
                                    setSearchTerm('');
                                    setStartDate(`${month.month}-01`);
                                    setEndDate(`${month.month}-31`);
                                    setActiveTab('all_records');
                                  }}
                                  className="px-2.5 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-sm transition cursor-pointer"
                                >
                                  ดูยอดเดือนนี้
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">
                            <CalendarRange className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-500" />
                            <p className="text-xs font-bold text-slate-400">ไม่พบข้อมูลยอดขายรายเดือนตามเงื่อนไขตัวกรอง</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB: YEARLY AGGREGATION */}
              {activeTab === 'yearly' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[10px] uppercase font-bold tracking-wider font-mono">
                        <th className="py-3.5 px-6">ปีปฏิทิน (Year)</th>
                        <th className="py-3.5 px-6 text-center">จำนวนรายการทั้งหมด (Total Entries)</th>
                        <th className="py-3.5 px-6 text-right">ยอดขายรวมสุทธิ (Yearly Total)</th>
                        <th className="py-3.5 px-6 text-right">ยอดเฉลี่ยต่อรายการ</th>
                        <th className="py-3.5 px-6"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white font-sans">
                      {yearlyList.length > 0 ? (
                        yearlyList.map((year) => {
                          const avg = year.amount / year.count;
                          return (
                            <tr key={year.year} className="hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2.5">
                                  <BarChart3 className="w-4 h-4 text-purple-500" />
                                  <span className="font-bold text-slate-900">{formatThaiYear(year.year)}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-center font-mono font-bold text-slate-600">
                                {year.count} รายการ
                              </td>
                              <td className="py-4 px-6 text-right font-mono font-black text-slate-900">
                                ฿{year.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-4 px-6 text-right font-mono text-slate-500">
                                ฿{avg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-4 px-6 text-right">
                                <button
                                  onClick={() => {
                                    setSearchTerm('');
                                    setStartDate(`${year.year}-01-01`);
                                    setEndDate(`${year.year}-12-31`);
                                    setActiveTab('all_records');
                                  }}
                                  className="px-2.5 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-sm transition cursor-pointer"
                                >
                                  ดูยอดปีนี้
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">
                            <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-500" />
                            <p className="text-xs font-bold text-slate-400">ไม่พบข้อมูลยอดขายรายปีตามเงื่อนไขตัวกรอง</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB: ALL TRANSACTIONS LIST */}
              {activeTab === 'all_records' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[10px] uppercase font-bold tracking-wider font-mono">
                        <th className="py-3.5 px-4 w-32">วันที่ / บิลเลขที่</th>
                        <th className="py-3.5 px-4 w-40">ชื่อลูกค้า (Customer)</th>
                        <th className="py-3.5 px-4 w-36">ช่องทางรับเงิน (Channel)</th>
                        <th className="py-3.5 px-4">รายละเอียด / หมายเหตุ</th>
                        <th className="py-3.5 px-4 text-right w-40">ยอดเงินรวมสุทธิ (บาท)</th>
                        <th className="py-3.5 px-4 w-24 text-center">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white font-sans">
                      {sortedSales.length > 0 ? (
                        sortedSales.map((item) => {
                          return (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors text-xs">
                              <td className="py-3 px-4 font-mono text-slate-600">
                                <span className="font-bold text-slate-800 block">{formatThaiDate(item.date)}</span>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded-xs font-mono font-bold block w-max mt-0.5">
                                  📄 {item.receiptNumber || 'ไม่มีเลขบิล'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-700">
                                {item.customerName ? (
                                  <div className="flex items-center gap-1">
                                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="font-semibold text-slate-800">{item.customerName}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">ไม่ได้ระบุลูกค้า</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {getPaymentChannelBadge(item.paymentChannel)}
                              </td>
                              <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={item.notes}>
                                {item.notes || <span className="text-slate-400 italic">ไม่มีรายละเอียด</span>}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                                ฿{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => openEditModal(item)}
                                    className="p-1 hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded-sm transition cursor-pointer"
                                    title="แก้ไข"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  {deleteConfirmId === item.id ? (
                                    <div className="flex items-center gap-1 animate-fade-in bg-rose-50 p-0.5 rounded-xs border border-rose-200">
                                      <button
                                        onClick={() => {
                                          onDeleteSale(item.id);
                                          setDeleteConfirmId(null);
                                        }}
                                        className="px-1.5 py-0.5 bg-rose-600 text-white font-bold text-[9px] rounded-xs cursor-pointer"
                                      >
                                        ยืนยัน
                                      </button>
                                      <button
                                        onClick={() => setDeleteConfirmId(null)}
                                        className="px-1.5 py-0.5 bg-slate-200 text-slate-700 font-bold text-[9px] rounded-xs cursor-pointer"
                                      >
                                        X
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setDeleteConfirmId(item.id)}
                                      className="p-1 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded-sm transition cursor-pointer"
                                      title="ลบ"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            <Layers className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-500" />
                            <p className="text-xs font-bold text-slate-400">ไม่พบเอกสารธุรกรรมยอดขายในเงื่อนไขการค้นหาปัจจุบัน</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
      </div>

      {/* 6. CREATE / EDIT DIALOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-sm shadow-xl w-full max-w-lg overflow-hidden animate-slide-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-bold uppercase tracking-wider font-sans">
                  {editingSale ? 'แก้ไขข้อมูลยอดขาย' : 'เพิ่มบันทึกยอดขายใหม่'}
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-sm hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 font-sans text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sale Date */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block uppercase tracking-wider">วันที่ทำรายการ <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 transition font-sans text-xs"
                  />
                </div>

                {/* Receipt Number */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block uppercase tracking-wider">เลขที่ใบกำกับภาษี/ใบเสร็จรับเงิน</label>
                  <input
                    type="text"
                    placeholder="RE-XXXX"
                    value={formReceiptNumber}
                    onChange={(e) => setFormReceiptNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 transition font-mono text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block uppercase tracking-wider">ชื่อลูกค้า / ชื่อบริษัทผู้ซื้อ</label>
                  <input
                    type="text"
                    placeholder="ระบุชื่อลูกค้า..."
                    value={formCustomerName}
                    onChange={(e) => setFormCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 transition font-sans text-xs"
                  />
                </div>

                {/* Payment Channel */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block uppercase tracking-wider">ช่องทางการรับเงิน <span className="text-rose-500">*</span></label>
                  <select
                    value={formPaymentChannel}
                    onChange={(e) => setFormPaymentChannel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 transition font-sans text-xs"
                  >
                    <option value="transfer">🏦 เงินโอนผ่านธนาคาร</option>
                    <option value="cash">💵 เงินสด (Cash)</option>
                    <option value="credit_card">💳 บัตรเครดิต (Credit Card)</option>
                    <option value="qr">📱 สแกน QR Code (PromptPay)</option>
                  </select>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block uppercase tracking-wider">ยอดเงินขายรวมสุทธิ (บาท) <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 transition font-mono text-xs font-bold text-slate-900"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block uppercase tracking-wider">รายละเอียดเพิ่มเติม / หมายเหตุ</label>
                <textarea
                  rows={3}
                  placeholder="รายละเอียดสินค้าหรือข้อมูลอื่นเพิ่มเติม..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 transition font-sans text-xs"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 rounded-sm transition cursor-pointer text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-bold hover:bg-blue-700 rounded-sm transition cursor-pointer text-xs"
                >
                  {editingSale ? 'บันทึกการแก้ไข' : 'บันทึกยอดขาย'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
