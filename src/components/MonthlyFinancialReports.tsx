import React, { useState, useMemo, useCallback } from 'react';
import { 
  PartnerBilling, 
  PartnerCompany, 
  CashFlowTransaction, 
  PayrollRecord, 
  PartnerCheque, 
  SalesRecord, 
  OfficialExpense 
} from '../types';
import { safeStorage } from '../lib/safeStorage';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Coins,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Filter,
  Download,
  Printer,
  Eye,
  EyeOff,
  Building2,
  ChevronRight,
  BarChart3,
  Layers,
  Search,
  ChevronDown,
  ChevronUp,
  PieChart as PieIcon,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export interface MonthlyFinancialReportsProps {
  partnerBillings: PartnerBilling[];
  partners?: PartnerCompany[];
  cashFlow: CashFlowTransaction[];
  payroll: PayrollRecord[];
  cheques: PartnerCheque[];
  sales?: SalesRecord[];
  officialExpenses?: OfficialExpense[];
  onNavigateToTab?: (tabId: string) => void;
}

const THAI_MONTHS = [
  { value: '01', name: 'มกราคม', short: 'ม.ค.' },
  { value: '02', name: 'กุมภาพันธ์', short: 'ก.พ.' },
  { value: '03', name: 'มีนาคม', short: 'มี.ค.' },
  { value: '04', name: 'เมษายน', short: 'เม.ย.' },
  { value: '05', name: 'พฤษภาคม', short: 'พ.ค.' },
  { value: '06', name: 'มิถุนายน', short: 'มิ.ย.' },
  { value: '07', name: 'กรกฎาคม', short: 'ก.ค.' },
  { value: '08', name: 'สิงหาคม', short: 'ส.ค.' },
  { value: '09', name: 'กันยายน', short: 'ก.ย.' },
  { value: '10', name: 'ตุลาคม', short: 'ต.ค.' },
  { value: '11', name: 'พฤศจิกายน', short: 'พ.ย.' },
  { value: '12', name: 'ธันวาคม', short: 'ธ.ค.' }
];

export default function MonthlyFinancialReports({
  partnerBillings = [],
  partners = [],
  cashFlow = [],
  payroll = [],
  cheques = [],
  sales = [],
  officialExpenses = [],
  onNavigateToTab
}: MonthlyFinancialReportsProps) {
  // Current active year and month selection
  const currentYearStr = new Date().getFullYear().toString();
  const currentMonthStr = (new Date().getMonth() + 1).toString().padStart(2, '0');

  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr); // 'all' or '01' - '12'
  const [activeViewMode, setActiveViewMode] = useState<'combined' | 'partner' | 'cashflow' | 'matrix'>('combined');
  
  // Search & Filter within partner documents list
  const [partnerDocFilter, setPartnerDocFilter] = useState<'all' | 'pending' | 'billed' | 'paid' | 'cancelled'>('all');
  const [searchPartnerQuery, setSearchPartnerQuery] = useState<string>('');

  // Privacy mask toggle - default hidden (closed eye) on initial entry for maximum financial safety
  const [isAmountsHidden, setIsAmountsHidden] = useState<boolean>(() => {
    try {
      safeStorage.removeItem('hr_monthly_report_reveal');
      const sessionVal = sessionStorage.getItem('hr_monthly_report_reveal_session');
      return sessionVal !== 'true'; // Default true = Masked/Closed
    } catch {
      return true;
    }
  });

  const toggleAmountsVisibility = useCallback(() => {
    setIsAmountsHidden(prev => {
      const next = !prev;
      try {
        sessionStorage.setItem('hr_monthly_report_reveal_session', String(!next));
      } catch {}
      return next;
    });
  }, []);

  // Available Years list extracted from all datasets
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    years.add(currentYearStr);
    years.add('2025');
    years.add('2026');

    partnerBillings.forEach(b => {
      if (b.issueDate && b.issueDate.length >= 4) years.add(b.issueDate.substring(0, 4));
      if (b.dueDate && b.dueDate.length >= 4) years.add(b.dueDate.substring(0, 4));
    });
    cashFlow.forEach(c => {
      if (c.date && c.date.length >= 4) years.add(c.date.substring(0, 4));
    });
    cheques.forEach(ch => {
      if (ch.dueDate && ch.dueDate.length >= 4) years.add(ch.dueDate.substring(0, 4));
      if (ch.issueDate && ch.issueDate.length >= 4) years.add(ch.issueDate.substring(0, 4));
    });
    payroll.forEach(p => {
      if (p.year) years.add(p.year.toString());
      if (p.month && p.month.includes('-')) years.add(p.month.split('-')[0]);
    });
    sales.forEach(s => {
      if (s.date && s.date.length >= 4) years.add(s.date.substring(0, 4));
    });

    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [partnerBillings, cashFlow, cheques, payroll, sales, currentYearStr]);

  // Masking format helper
  const formatMoney = useCallback((amount: number, forceShow: boolean = false) => {
    if (isAmountsHidden && !forceShow) {
      return '฿ ••••••••';
    }
    return `฿${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [isAmountsHidden]);

  // Safe Amount for Partner Billing (deducting CN if any)
  const getBillingItemNet = useCallback((item: PartnerBilling) => {
    const raw = (item.amount || item.billingAmount || 0);
    const cn = (item.cnAmount || 0);
    return Math.max(0, raw - cn);
  }, []);

  // Helper to extract Year and Month from date string
  const parseDateYm = (dateStr?: string) => {
    if (!dateStr || dateStr.length < 7) return { year: '', month: '' };
    const parts = dateStr.split('-');
    return {
      year: parts[0] || '',
      month: (parts[1] || '').padStart(2, '0')
    };
  };

  // Helper to test if item matches selected year and month
  const matchesPeriod = useCallback((dateStr?: string) => {
    if (!dateStr) return false;
    const { year, month } = parseDateYm(dateStr);
    if (year !== selectedYear) return false;
    if (selectedMonth !== 'all' && month !== selectedMonth) return false;
    return true;
  }, [selectedYear, selectedMonth]);

  // ─────────────────────────────────────────────────────────────
  // 1. PARTNER BILLING CALCULATIONS (1.1 รอวางบิล, 1.2 วางบิลแล้ว, 1.3 ชำระแล้ว, 1.4 ยกเลิก)
  // ─────────────────────────────────────────────────────────────
  const filteredPartnerBillings = useMemo(() => {
    return partnerBillings.filter(b => matchesPeriod(b.issueDate || b.dueDate));
  }, [partnerBillings, matchesPeriod]);

  // 1.1 ยอดรอวางบิล (Pending / Delivery Order รอวางบิล)
  const partnerPendingList = useMemo(() => {
    return filteredPartnerBillings.filter(b => b.status === 'pending');
  }, [filteredPartnerBillings]);
  const partnerPendingTotal = useMemo(() => {
    return partnerPendingList.reduce((sum, b) => sum + getBillingItemNet(b), 0);
  }, [partnerPendingList, getBillingItemNet]);

  // 1.2 ยอดวางบิลแล้ว (Billed / Active BI)
  const partnerBilledList = useMemo(() => {
    return filteredPartnerBillings.filter(b => b.status === 'billed');
  }, [filteredPartnerBillings]);
  const partnerBilledTotal = useMemo(() => {
    return partnerBilledList.reduce((sum, b) => sum + getBillingItemNet(b), 0);
  }, [partnerBilledList, getBillingItemNet]);

  // 1.3 ยอดชำระแล้ว (Paid / Settled)
  const partnerPaidList = useMemo(() => {
    return filteredPartnerBillings.filter(b => b.status === 'paid');
  }, [filteredPartnerBillings]);
  const partnerPaidTotal = useMemo(() => {
    return partnerPaidList.reduce((sum, b) => sum + getBillingItemNet(b), 0);
  }, [partnerPaidList, getBillingItemNet]);

  // 1.4 ยอดยกเลิก (Cancelled)
  const partnerCancelledList = useMemo(() => {
    return filteredPartnerBillings.filter(b => b.status === 'cancelled');
  }, [filteredPartnerBillings]);
  const partnerCancelledTotal = useMemo(() => {
    return partnerCancelledList.reduce((sum, b) => sum + getBillingItemNet(b), 0);
  }, [partnerCancelledList, getBillingItemNet]);

  // Total Active Partner Billings (Excluding cancelled)
  const partnerActiveTotal = partnerPendingTotal + partnerBilledTotal + partnerPaidTotal;
  const partnerTotalWithCancelled = partnerActiveTotal + partnerCancelledTotal;
  const partnerPaidPercent = partnerActiveTotal > 0 ? ((partnerPaidTotal / partnerActiveTotal) * 100) : 0;
  const partnerOutstandingTotal = partnerPendingTotal + partnerBilledTotal;

  // Breakdown by Partner Company
  const partnerCompanyBreakdown = useMemo(() => {
    const map = new Map<string, {
      name: string;
      pending: number;
      billed: number;
      paid: number;
      cancelled: number;
      total: number;
      count: number;
    }>();

    filteredPartnerBillings.forEach(b => {
      const name = b.partnerName?.trim() || 'ไม่ระบุชื่อคู่ค้า';
      const existing = map.get(name) || {
        name,
        pending: 0,
        billed: 0,
        paid: 0,
        cancelled: 0,
        total: 0,
        count: 0
      };

      const val = getBillingItemNet(b);
      existing.count += 1;
      existing.total += val;

      if (b.status === 'pending') existing.pending += val;
      else if (b.status === 'billed') existing.billed += val;
      else if (b.status === 'paid') existing.paid += val;
      else if (b.status === 'cancelled') existing.cancelled += val;

      map.set(name, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredPartnerBillings, getBillingItemNet]);

  // Filtered list for detailed view table
  const displayedPartnerBillings = useMemo(() => {
    return filteredPartnerBillings.filter(b => {
      if (partnerDocFilter !== 'all' && b.status !== partnerDocFilter) return false;
      if (searchPartnerQuery.trim()) {
        const q = searchPartnerQuery.toLowerCase();
        const matchName = (b.partnerName || '').toLowerCase().includes(q);
        const matchDoc = (b.docNumber || '').toLowerCase().includes(q);
        const matchDelivery = (b.deliveryDocNumber || '').toLowerCase().includes(q);
        const matchBilling = (b.billingDocNumber || '').toLowerCase().includes(q);
        return matchName || matchDoc || matchDelivery || matchBilling;
      }
      return true;
    });
  }, [filteredPartnerBillings, partnerDocFilter, searchPartnerQuery]);

  // ─────────────────────────────────────────────────────────────
  // 2. CASH FLOW & CHEQUES CALCULATIONS (ขารับ vs ขาจ่าย - จ่ายแล้ว vs ยังไม่จ่าย)
  // ─────────────────────────────────────────────────────────────

  // 2.1 ขารับ (Inflow):
  // รับแล้ว (Paid/Completed/Cleared):
  // - CashFlow income completed
  // - Cheques receivable cleared
  // - Sales records
  const cashFlowIncomeCompleted = useMemo(() => {
    return cashFlow
      .filter(t => t.type === 'income' && t.status === 'completed' && matchesPeriod(t.date))
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [cashFlow, matchesPeriod]);

  const chequesReceivableCleared = useMemo(() => {
    return cheques
      .filter(ch => ch.type === 'receivable' && ch.status === 'cleared' && matchesPeriod(ch.dueDate || ch.issueDate))
      .reduce((sum, ch) => sum + (ch.amount || 0), 0);
  }, [cheques, matchesPeriod]);

  const salesCompleted = useMemo(() => {
    return sales
      .filter(s => matchesPeriod(s.date))
      .reduce((sum, s) => sum + (s.amount || 0), 0);
  }, [sales, matchesPeriod]);

  const totalInflowPaid = cashFlowIncomeCompleted + chequesReceivableCleared + salesCompleted;

  // ค้างรับ / ยังไม่ได้รับ (Unpaid/Pending Inflow):
  // - CashFlow income pending
  // - Cheques receivable pending
  const cashFlowIncomePending = useMemo(() => {
    return cashFlow
      .filter(t => t.type === 'income' && t.status === 'pending' && matchesPeriod(t.date))
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [cashFlow, matchesPeriod]);

  const chequesReceivablePending = useMemo(() => {
    return cheques
      .filter(ch => ch.type === 'receivable' && ch.status === 'pending' && matchesPeriod(ch.dueDate || ch.issueDate))
      .reduce((sum, ch) => sum + (ch.amount || 0), 0);
  }, [cheques, matchesPeriod]);

  const totalInflowPending = cashFlowIncomePending + chequesReceivablePending;
  const totalInflowAll = totalInflowPaid + totalInflowPending;

  // 2.2 ขาจ่าย (Outflow):
  // จ่ายแล้ว (Paid/Completed/Cleared):
  // - CashFlow expense completed
  // - Cheques payable cleared
  // - Payroll paid (net + tax + sso)
  // - Partner Billing paid
  // - Official expenses paid
  const cashFlowExpenseCompleted = useMemo(() => {
    return cashFlow
      .filter(t => t.type === 'expense' && t.status === 'completed' && matchesPeriod(t.date))
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [cashFlow, matchesPeriod]);

  const chequesPayableCleared = useMemo(() => {
    return cheques
      .filter(ch => ch.type === 'payable' && ch.status === 'cleared' && matchesPeriod(ch.dueDate || ch.issueDate))
      .reduce((sum, ch) => sum + (ch.amount || 0), 0);
  }, [cheques, matchesPeriod]);

  const payrollPaid = useMemo(() => {
    return payroll
      .filter(p => {
        if (p.status !== 'paid') return false;
        const pYear = (p.year || (p.month.includes('-') ? parseInt(p.month.split('-')[0]) : parseInt(currentYearStr))).toString();
        const pMonth = p.month.includes('-') ? p.month.split('-')[1] : p.month.padStart(2, '0');
        if (pYear !== selectedYear) return false;
        if (selectedMonth !== 'all' && pMonth !== selectedMonth) return false;
        return true;
      })
      .reduce((sum, p) => sum + (p.netSalary || 0) + (p.tax || 0) + (p.socialSecurity || 0), 0);
  }, [payroll, selectedYear, selectedMonth, currentYearStr]);

  const officialExpensesPaid = useMemo(() => {
    return officialExpenses
      .filter(e => e.status === 'paid' && matchesPeriod(e.paymentDate || e.dueDate))
      .reduce((sum, e) => sum + (e.totalPaid || e.amount || 0), 0);
  }, [officialExpenses, matchesPeriod]);

  const totalOutflowPaid = cashFlowExpenseCompleted + chequesPayableCleared + payrollPaid + partnerPaidTotal + officialExpensesPaid;

  // ยังไม่จ่าย / ค้างจ่าย (Unpaid/Pending Outflow):
  // - CashFlow expense pending
  // - Cheques payable pending
  // - Payroll pending
  // - Partner Billing billed & pending (ค้างจ่ายคู่ค้า)
  // - Official expenses pending
  const cashFlowExpensePending = useMemo(() => {
    return cashFlow
      .filter(t => t.type === 'expense' && t.status === 'pending' && matchesPeriod(t.date))
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [cashFlow, matchesPeriod]);

  const chequesPayablePending = useMemo(() => {
    return cheques
      .filter(ch => ch.type === 'payable' && ch.status === 'pending' && matchesPeriod(ch.dueDate || ch.issueDate))
      .reduce((sum, ch) => sum + (ch.amount || 0), 0);
  }, [cheques, matchesPeriod]);

  const payrollPending = useMemo(() => {
    return payroll
      .filter(p => {
        if (p.status === 'paid') return false;
        const pYear = (p.year || (p.month.includes('-') ? parseInt(p.month.split('-')[0]) : parseInt(currentYearStr))).toString();
        const pMonth = p.month.includes('-') ? p.month.split('-')[1] : p.month.padStart(2, '0');
        if (pYear !== selectedYear) return false;
        if (selectedMonth !== 'all' && pMonth !== selectedMonth) return false;
        return true;
      })
      .reduce((sum, p) => sum + (p.netSalary || 0) + (p.tax || 0) + (p.socialSecurity || 0), 0);
  }, [payroll, selectedYear, selectedMonth, currentYearStr]);

  const officialExpensesPending = useMemo(() => {
    return officialExpenses
      .filter(e => (e.status === 'pending' || e.status === 'overdue') && matchesPeriod(e.dueDate))
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [officialExpenses, matchesPeriod]);

  const totalOutflowPending = cashFlowExpensePending + chequesPayablePending + payrollPending + partnerOutstandingTotal + officialExpensesPending;
  const totalOutflowAll = totalOutflowPaid + totalOutflowPending;

  // Net Cash Flow
  const netRealized = totalInflowPaid - totalOutflowPaid; // เกิดขึ้นจริง (รับแล้ว - จ่ายแล้ว)
  const netProjected = totalInflowAll - totalOutflowAll; // ประมาณการ (รวมยอดค้างรับ-ค้างจ่าย)

  // ─────────────────────────────────────────────────────────────
  // 3. 12-MONTH MATRIX (ANNUAL COMPARATIVE OVERVIEW)
  // ─────────────────────────────────────────────────────────────
  const twelveMonthsData = useMemo(() => {
    return THAI_MONTHS.map(m => {
      const monthCode = m.value;
      const periodMatcher = (dateStr?: string) => {
        if (!dateStr) return false;
        const { year, month } = parseDateYm(dateStr);
        return year === selectedYear && month === monthCode;
      };

      // Partner Billings
      const mBillings = partnerBillings.filter(b => periodMatcher(b.issueDate || b.dueDate));
      const mPending = mBillings.filter(b => b.status === 'pending').reduce((s, b) => s + getBillingItemNet(b), 0);
      const mBilled = mBillings.filter(b => b.status === 'billed').reduce((s, b) => s + getBillingItemNet(b), 0);
      const mPaid = mBillings.filter(b => b.status === 'paid').reduce((s, b) => s + getBillingItemNet(b), 0);
      const mCancelled = mBillings.filter(b => b.status === 'cancelled').reduce((s, b) => s + getBillingItemNet(b), 0);

      // Inflows
      const mInflowPaid = 
        cashFlow.filter(t => t.type === 'income' && t.status === 'completed' && periodMatcher(t.date)).reduce((s, t) => s + (t.amount || 0), 0) +
        cheques.filter(ch => ch.type === 'receivable' && ch.status === 'cleared' && periodMatcher(ch.dueDate || ch.issueDate)).reduce((s, ch) => s + (ch.amount || 0), 0) +
        sales.filter(s => periodMatcher(s.date)).reduce((s, sl) => s + (sl.amount || 0), 0);

      const mInflowPending = 
        cashFlow.filter(t => t.type === 'income' && t.status === 'pending' && periodMatcher(t.date)).reduce((s, t) => s + (t.amount || 0), 0) +
        cheques.filter(ch => ch.type === 'receivable' && ch.status === 'pending' && periodMatcher(ch.dueDate || ch.issueDate)).reduce((s, ch) => s + (ch.amount || 0), 0);

      // Outflows
      const mPayrollPaid = payroll.filter(p => {
        if (p.status !== 'paid') return false;
        const pYear = (p.year || (p.month.includes('-') ? parseInt(p.month.split('-')[0]) : parseInt(currentYearStr))).toString();
        const pMonth = p.month.includes('-') ? p.month.split('-')[1] : p.month.padStart(2, '0');
        return pYear === selectedYear && pMonth === monthCode;
      }).reduce((s, p) => s + (p.netSalary || 0) + (p.tax || 0) + (p.socialSecurity || 0), 0);

      const mOfficialPaid = officialExpenses.filter(e => e.status === 'paid' && periodMatcher(e.paymentDate || e.dueDate)).reduce((s, e) => s + (e.totalPaid || e.amount || 0), 0);

      const mOutflowPaid = 
        cashFlow.filter(t => t.type === 'expense' && t.status === 'completed' && periodMatcher(t.date)).reduce((s, t) => s + (t.amount || 0), 0) +
        cheques.filter(ch => ch.type === 'payable' && ch.status === 'cleared' && periodMatcher(ch.dueDate || ch.issueDate)).reduce((s, ch) => s + (ch.amount || 0), 0) +
        mPayrollPaid + mPaid + mOfficialPaid;

      const mPayrollPending = payroll.filter(p => {
        if (p.status === 'paid') return false;
        const pYear = (p.year || (p.month.includes('-') ? parseInt(p.month.split('-')[0]) : parseInt(currentYearStr))).toString();
        const pMonth = p.month.includes('-') ? p.month.split('-')[1] : p.month.padStart(2, '0');
        return pYear === selectedYear && pMonth === monthCode;
      }).reduce((s, p) => s + (p.netSalary || 0) + (p.tax || 0) + (p.socialSecurity || 0), 0);

      const mOutflowPending = 
        cashFlow.filter(t => t.type === 'expense' && t.status === 'pending' && periodMatcher(t.date)).reduce((s, t) => s + (t.amount || 0), 0) +
        cheques.filter(ch => ch.type === 'payable' && ch.status === 'pending' && periodMatcher(ch.dueDate || ch.issueDate)).reduce((s, ch) => s + (ch.amount || 0), 0) +
        mPayrollPending + (mPending + mBilled);

      const mNetRealized = mInflowPaid - mOutflowPaid;

      return {
        monthCode,
        monthName: m.name,
        monthShort: m.short,
        partnerPending: mPending,
        partnerBilled: mBilled,
        partnerPaid: mPaid,
        partnerCancelled: mCancelled,
        partnerTotal: mPending + mBilled + mPaid,
        inflowPaid: mInflowPaid,
        inflowPending: mInflowPending,
        inflowTotal: mInflowPaid + mInflowPending,
        outflowPaid: mOutflowPaid,
        outflowPending: mOutflowPending,
        outflowTotal: mOutflowPaid + mOutflowPending,
        netRealized: mNetRealized
      };
    });
  }, [
    selectedYear, 
    partnerBillings, 
    cashFlow, 
    cheques, 
    payroll, 
    sales, 
    officialExpenses, 
    getBillingItemNet, 
    currentYearStr
  ]);

  // Chart data for Partner Breakdown
  const partnerDonutData = useMemo(() => {
    return [
      { name: '1.1 รอวางบิล', value: partnerPendingTotal, color: '#f59e0b', count: partnerPendingList.length },
      { name: '1.2 วางบิลแล้ว', value: partnerBilledTotal, color: '#3b82f6', count: partnerBilledList.length },
      { name: '1.3 ชำระแล้ว', value: partnerPaidTotal, color: '#10b981', count: partnerPaidList.length },
      { name: '1.4 ยกเลิก', value: partnerCancelledTotal, color: '#94a3b8', count: partnerCancelledList.length }
    ].filter(d => d.value > 0 || d.count > 0);
  }, [partnerPendingTotal, partnerBilledTotal, partnerPaidTotal, partnerCancelledTotal, partnerPendingList.length, partnerBilledList.length, partnerPaidList.length, partnerCancelledList.length]);

  // Print friendly action
  const handlePrint = () => {
    window.print();
  };

  // Export CSV Action
  const handleExportCSV = () => {
    const periodLabel = selectedMonth === 'all' 
      ? `ทั้งปี_${selectedYear}` 
      : `เดือน_${selectedMonth}_ปี_${selectedYear}`;

    let csv = `รายงานสรุปประจำงวด: ${periodLabel}\n\n`;
    csv += `1. สรุปรายการคู่ค้า\n`;
    csv += `สถานะ,จำนวนรายการ,ยอดรวม (บาท)\n`;
    csv += `1.1 รอวางบิล,${partnerPendingList.length},${partnerPendingTotal}\n`;
    csv += `1.2 วางบิลแล้ว,${partnerBilledList.length},${partnerBilledTotal}\n`;
    csv += `1.3 ชำระแล้ว,${partnerPaidList.length},${partnerPaidTotal}\n`;
    csv += `1.4 ยกเลิก,${partnerCancelledList.length},${partnerCancelledTotal}\n`;
    csv += `รวมยอดค้างจ่าย (รอวางบิล + วางบิลแล้ว),${partnerPendingList.length + partnerBilledList.length},${partnerOutstandingTotal}\n\n`;

    csv += `2. สรุปกระแสเงินสดขารับและขาจ่าย\n`;
    csv += `หมวดหมู่,รับแล้ว/จ่ายแล้ว (บาท),ยังไม่ได้รับ/ยังไม่จ่าย (บาท),รวมสุทธิ (บาท)\n`;
    csv += `ขารับ (Inflow),${totalInflowPaid},${totalInflowPending},${totalInflowAll}\n`;
    csv += `ขาจ่าย (Outflow),${totalOutflowPaid},${totalOutflowPending},${totalOutflowAll}\n`;
    csv += `กระแสเงินสดสุทธิ (Net),${netRealized},${totalInflowPending - totalOutflowPending},${netProjected}\n\n`;

    csv += `3. ตารางสรุป 12 เดือนประจำปี ${selectedYear}\n`;
    csv += `เดือน,คู่ค้ารอวางบิล,คู่ค่าวางบิลแล้ว,คู่ค้าชำระแล้ว,คู่ค้ายกเลิก,ขารับ (รับแล้ว),ขารับ (ค้างรับ),ขาจ่าย (จ่ายแล้ว),ขาจ่าย (ยังไม่จ่าย),สุทธิรับจริง\n`;
    twelveMonthsData.forEach(r => {
      csv += `${r.monthName},${r.partnerPending},${r.partnerBilled},${r.partnerPaid},${r.partnerCancelled},${r.inflowPaid},${r.inflowPending},${r.outflowPaid},${r.outflowPending},${r.netRealized}\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Monthly_Financial_Report_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedMonthName = selectedMonth === 'all' 
    ? 'ทุกเดือน (ตลอดทั้งปี)' 
    : THAI_MONTHS.find(m => m.value === selectedMonth)?.name || selectedMonth;

  return (
    <div id="monthly-financial-reports" className="space-y-6 animate-fade-in print:p-0 print:space-y-4">
      
      {/* ─── 0. TOP TITLE & ACTION BAR ─── */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:border-none print:shadow-none print:p-0">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                หน้ารายงานของแต่ละเดือน (Monthly Reports)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                1. รายการคู่ค้า (รอวางบิล / วางบิลแล้ว / ชำระแล้ว / ยกเลิก) และ 2. ตรวจเช็คกระแสเงินสดขารับ-ขาจ่าย (จ่ายแล้ว / ยังไม่จ่าย)
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {/* Privacy Eye Toggle */}
          <button
            type="button"
            onClick={toggleAmountsVisibility}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              isAmountsHidden
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 shadow-2xs'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title={isAmountsHidden ? "กดเพื่อเปิดดูยอดเงินทั้งหมด" : "กดเพื่อปิดซ่อนยอดเงินเพื่อความเป็นส่วนตัว"}
          >
            {isAmountsHidden ? (
              <>
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>เปิดดูยอดเงินทั้งหมด (Show All)</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                <span>ปิดซ่อนยอดเงิน (Privacy On)</span>
              </>
            )}
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="ดาวน์โหลดรายงานเป็นไฟล์ CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>ส่งออก CSV</span>
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="พิมพ์หน้ารายงานนี้"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>พิมพ์รายงาน</span>
          </button>
        </div>
      </div>

      {/* ─── 1. PERIOD SELECTOR & NAVIGATION TABS ─── */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-4 print:border-none print:shadow-none print:p-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          
          {/* Period Filter (Year & Month) */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-700">เลือกปี:</span>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>พ.ศ. {parseInt(yr) + 543} ({yr})</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">เลือกเดือน:</span>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="all">-- ทุกเดือน (รวมทั้งปี) --</option>
                {THAI_MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.name} ({m.value})</option>
                ))}
              </select>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-800 rounded-md text-[11px] font-bold border border-indigo-100">
              <span>งวดปัจจุบัน:</span>
              <strong className="text-indigo-950 font-black">{selectedMonthName} พ.ศ. {parseInt(selectedYear) + 543}</strong>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-md print:hidden">
            <button
              type="button"
              onClick={() => setActiveViewMode('combined')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                activeViewMode === 'combined'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>ภาพรวมหลัก</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveViewMode('partner')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                activeViewMode === 'partner'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>1. รายการคู่ค้า ({filteredPartnerBillings.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveViewMode('cashflow')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                activeViewMode === 'cashflow'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>2. กระแสเงินสดขารับ-ขาจ่าย</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveViewMode('matrix')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                activeViewMode === 'matrix'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>3. ตารางสรุป 12 เดือน</span>
            </button>
          </div>
        </div>

        {/* Security / Privacy Warning Banner */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-md px-3 py-1.5 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              {isAmountsHidden ? (
                <span>ระบบได้ <strong>ปิดการดูตัวเลข (Privacy Masked)</strong> ไว้โดยอัตโนมัติ เพื่อป้องกันไม่ให้บุคคลอื่นมองเห็นตัวเลขทางการเงิน</span>
              ) : (
                <span className="text-blue-700 font-semibold">กำลังเปิดแสดงตัวเลขทางการเงินจริง (สามารถกดปุ่ม "ปิดซ่อนยอดเงิน" ด้านบนเพื่อซ่อนได้ทันที)</span>
              )}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
            งวด {selectedMonthName} {selectedYear}
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: COMBINED / OVERVIEW VIEW (BOTH 1 & 2 HIGHLIGHTS)
         ───────────────────────────────────────────────────────────── */}
      {(activeViewMode === 'combined' || activeViewMode === 'partner') && (
        <div className="space-y-4">
          
          {/* Section Header: 1. รายการคู่ค้า */}
          <div className="flex items-center justify-between bg-indigo-900 text-white px-4 py-2.5 rounded-lg shadow-xs">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-300" />
              <h2 className="text-sm sm:text-base font-black tracking-wide">
                1. รายการคู่ค้าประจำเดือน ({selectedMonthName} {selectedYear})
              </h2>
            </div>
            <div className="text-xs font-bold text-indigo-200">
              รวมเอกสาร {filteredPartnerBillings.length} รายการ
            </div>
          </div>

          {/* 4 Partner Metric Cards (1.1, 1.2, 1.3, 1.4) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            {/* 1.1 ยอดรอวางบิล */}
            <div className="bg-white border-2 border-amber-300/80 rounded-lg p-4 shadow-xs space-y-2 hover:shadow-sm transition relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  1.1 ยอดรอวางบิล (Pending)
                </span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-black rounded-full font-mono">
                  {partnerPendingList.length} บิล
                </span>
              </div>
              <div>
                <p className="text-lg sm:text-xl font-black text-amber-950 font-mono">
                  {formatMoney(partnerPendingTotal)}
                </p>
                <p className="text-[11px] text-amber-700 mt-1">
                  ใบส่งของรอดำเนินการวางบิล / เอกสารรอตั้งเบิก
                </p>
              </div>
              <div className="w-full bg-amber-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${partnerActiveTotal > 0 ? (partnerPendingTotal / partnerActiveTotal) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* 1.2 ยอดวางบิลแล้ว */}
            <div className="bg-white border-2 border-blue-300/80 rounded-lg p-4 shadow-xs space-y-2 hover:shadow-sm transition relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  1.2 ยอดวางบิลแล้ว (Billed)
                </span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-black rounded-full font-mono">
                  {partnerBilledList.length} บิล
                </span>
              </div>
              <div>
                <p className="text-lg sm:text-xl font-black text-blue-950 font-mono">
                  {formatMoney(partnerBilledTotal)}
                </p>
                <p className="text-[11px] text-blue-700 mt-1">
                  ออกใบวางบิลแล้ว อยู่ในรอบเครดิตรอชำระเงิน
                </p>
              </div>
              <div className="w-full bg-blue-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${partnerActiveTotal > 0 ? (partnerBilledTotal / partnerActiveTotal) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* 1.3 ยอดชำระแล้ว */}
            <div className="bg-white border-2 border-emerald-300/80 rounded-lg p-4 shadow-xs space-y-2 hover:shadow-sm transition relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  1.3 ยอดชำระแล้ว (Paid)
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-black rounded-full font-mono">
                  {partnerPaidList.length} บิล
                </span>
              </div>
              <div>
                <p className="text-lg sm:text-xl font-black text-emerald-950 font-mono">
                  {formatMoney(partnerPaidTotal)}
                </p>
                <p className="text-[11px] text-emerald-700 mt-1">
                  ตัดจ่ายชำระเสร็จสิ้นแล้ว ({partnerPaidPercent.toFixed(1)}% ของยอดหมุนเวียน)
                </p>
              </div>
              <div className="w-full bg-emerald-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${partnerPaidPercent}%` }}
                ></div>
              </div>
            </div>

            {/* 1.4 ยอดยกเลิก */}
            <div className="bg-white border-2 border-slate-300 rounded-lg p-4 shadow-xs space-y-2 hover:shadow-sm transition relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-slate-500" />
                  1.4 ยอดยกเลิก (Cancelled)
                </span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-black rounded-full font-mono">
                  {partnerCancelledList.length} บิล
                </span>
              </div>
              <div>
                <p className="text-lg sm:text-xl font-black text-slate-800 font-mono">
                  {formatMoney(partnerCancelledTotal)}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  เอกสารยกเลิก/ส่งคืน (ไม่คิดเป็นภาระหนี้)
                </p>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-slate-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${partnerTotalWithCancelled > 0 ? (partnerCancelledTotal / partnerTotalWithCancelled) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

          </div>

          {/* Partner Analytics Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-800 font-bold block">ภาระหนี้ค้างจ่ายคู่ค้ารวม (Outstanding Total)</span>
                <span className="text-xs text-amber-600 block">(1.1 รอวางบิล + 1.2 วางบิลแล้ว)</span>
              </div>
              <div className="text-right">
                <span className="text-base sm:text-lg font-black font-mono text-amber-950">
                  {formatMoney(partnerOutstandingTotal)}
                </span>
                <span className="block text-[11px] text-amber-700 font-bold">
                  {partnerPendingList.length + partnerBilledList.length} รายการ
                </span>
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-800 font-bold block">อัตราการชำระเงินสำเร็จ (Fulfillment Rate)</span>
                <span className="text-xs text-emerald-600 block">สัดส่วนบิลที่จ่ายเสร็จเทียบกับยอดรวม</span>
              </div>
              <div className="text-right">
                <span className="text-base sm:text-lg font-black font-mono text-emerald-950">
                  {partnerPaidPercent.toFixed(1)}%
                </span>
                <span className="block text-[11px] text-emerald-700 font-bold">
                  ชำระแล้ว {partnerPaidList.length} / {partnerPendingList.length + partnerBilledList.length + partnerPaidList.length} บิล
                </span>
              </div>
            </div>

            <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs text-indigo-800 font-bold block">ยอดรวมเอกสารคู่ค้าทั้งหมดในงวดนี้</span>
                <span className="text-xs text-indigo-600 block">Active Billings Total (ไม่รวมยกเลิก)</span>
              </div>
              <div className="text-right">
                <span className="text-base sm:text-lg font-black font-mono text-indigo-950">
                  {formatMoney(partnerActiveTotal)}
                </span>
                <span className="block text-[11px] text-indigo-700 font-bold">
                  รวม {partnerPendingList.length + partnerBilledList.length + partnerPaidList.length} รายการ
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: CASH FLOW & CHEQUES (ขารับ vs ขาจ่าย - จ่ายแล้ว vs ยังไม่จ่าย)
         ───────────────────────────────────────────────────────────── */}
      {(activeViewMode === 'combined' || activeViewMode === 'cashflow') && (
        <div className="space-y-4">
          
          {/* Section Header: 2. เช็คกระแสเงินสดขารับและขาจ่าย */}
          <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xs">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm sm:text-base font-black tracking-wide">
                2. เช็คกระแสเงินสดขารับและขาจ่าย (ยอดจ่ายแล้วและยังไม่จ่าย ประจำงวด {selectedMonthName} {selectedYear})
              </h2>
            </div>
            <div className="text-xs font-bold text-slate-300">
              สถานะสภาพคล่องสุทธิ
            </div>
          </div>

          {/* 2 Big Column Comparison: ขารับ vs ขาจ่าย */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* ขารับ (CASH INFLOW & RECEIVABLES) */}
            <div className="bg-white border-2 border-emerald-300 rounded-lg p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black">
                    <ArrowDownLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-emerald-950">
                      กระแสเงินสดขารับ (Cash Inflows & Receivables)
                    </h3>
                    <p className="text-[11px] text-emerald-700">
                      รายรับเงินสด + เช็ครับคู่ค้า + ยอดขาย
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 font-mono font-black text-xs rounded-md">
                  {formatMoney(totalInflowAll)}
                </span>
              </div>

              {/* Sub-breakdown: รับแล้ว vs ค้างรับ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* ยอดรับแล้ว / จ่ายแล้ว (Paid / Cleared Inflow) */}
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ยอดรับแล้ว (Received / Paid)
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      เข้ากระเป๋าจริง
                    </span>
                  </div>
                  <p className="text-base sm:text-lg font-black text-emerald-950 font-mono">
                    {formatMoney(totalInflowPaid)}
                  </p>
                  <div className="text-[10px] text-emerald-800 space-y-0.5 pt-1 border-t border-emerald-200/60 font-sans">
                    <div className="flex justify-between">
                      <span>• รายรับทั่วไปที่ได้รับ:</span>
                      <span className="font-mono font-bold">{formatMoney(cashFlowIncomeCompleted)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• เช็ครับที่ขึ้นเงินแล้ว:</span>
                      <span className="font-mono font-bold">{formatMoney(chequesReceivableCleared)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• ยอดขายหน้าร้าน/โอน:</span>
                      <span className="font-mono font-bold">{formatMoney(salesCompleted)}</span>
                    </div>
                  </div>
                </div>

                {/* ยอดที่ยังไม่ได้รับ / ค้างรับ (Unpaid / Pending Inflow) */}
                <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      ยอดค้างรับ (Pending Inflow)
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      รอเข้าบัญชี
                    </span>
                  </div>
                  <p className="text-base sm:text-lg font-black text-amber-950 font-mono">
                    {formatMoney(totalInflowPending)}
                  </p>
                  <div className="text-[10px] text-amber-800 space-y-0.5 pt-1 border-t border-amber-200/60 font-sans">
                    <div className="flex justify-between">
                      <span>• รายรับรอดำเนินการ:</span>
                      <span className="font-mono font-bold">{formatMoney(cashFlowIncomePending)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• เช็ครับรอเรียกเก็บ:</span>
                      <span className="font-mono font-bold">{formatMoney(chequesReceivablePending)}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* ขาจ่าย (CASH OUTFLOW & PAYABLES) */}
            <div className="bg-white border-2 border-rose-300 rounded-lg p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-black">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-rose-950">
                      กระแสเงินสดขาจ่าย (Cash Outflows & Payables)
                    </h3>
                    <p className="text-[11px] text-rose-700">
                      บิลคู่ค้า + เช็คจ่าย + เงินเดือน + ค่าใช้จ่าย
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-rose-100 text-rose-900 font-mono font-black text-xs rounded-md">
                  {formatMoney(totalOutflowAll)}
                </span>
              </div>

              {/* Sub-breakdown: จ่ายแล้ว vs ยังไม่จ่าย */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* ยอดจ่ายแล้ว (Paid Outflow) */}
                <div className="bg-rose-50/80 border border-rose-200 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-900 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                      ยอดจ่ายแล้ว (Settled / Paid)
                    </span>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                      ตัดเงินแล้ว
                    </span>
                  </div>
                  <p className="text-base sm:text-lg font-black text-rose-950 font-mono">
                    {formatMoney(totalOutflowPaid)}
                  </p>
                  <div className="text-[10px] text-rose-800 space-y-0.5 pt-1 border-t border-rose-200/60 font-sans">
                    <div className="flex justify-between">
                      <span>• บิลคู่ค้าที่ชำระแล้ว:</span>
                      <span className="font-mono font-bold">{formatMoney(partnerPaidTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• เช็คจ่ายที่ตัดเงินแล้ว:</span>
                      <span className="font-mono font-bold">{formatMoney(chequesPayableCleared)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• เงินเดือน & ภาษีจ่ายแล้ว:</span>
                      <span className="font-mono font-bold">{formatMoney(payrollPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• รายจ่ายทั่วไป & สรรพากร:</span>
                      <span className="font-mono font-bold">{formatMoney(cashFlowExpenseCompleted + officialExpensesPaid)}</span>
                    </div>
                  </div>
                </div>

                {/* ยอดที่ยังไม่จ่าย / ค้างจ่าย (Unpaid / Pending Outflow) */}
                <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      ยอดที่ยังไม่จ่าย (Unpaid / Pending)
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      รอตัดจ่าย
                    </span>
                  </div>
                  <p className="text-base sm:text-lg font-black text-amber-950 font-mono">
                    {formatMoney(totalOutflowPending)}
                  </p>
                  <div className="text-[10px] text-amber-800 space-y-0.5 pt-1 border-t border-amber-200/60 font-sans">
                    <div className="flex justify-between">
                      <span>• บิลคู่ค้ารอจ่าย/รอวางบิล:</span>
                      <span className="font-mono font-bold">{formatMoney(partnerOutstandingTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• เช็คจ่ายรอขึ้นเงิน:</span>
                      <span className="font-mono font-bold">{formatMoney(chequesPayablePending)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• เงินเดือนค้างจ่าย:</span>
                      <span className="font-mono font-bold">{formatMoney(payrollPending)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• รายจ่ายค้างชำระ:</span>
                      <span className="font-mono font-bold">{formatMoney(cashFlowExpensePending + officialExpensesPending)}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* NET CASH FLOW SUMMARY BANNER */}
          <div className="bg-slate-900 text-white rounded-lg p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                netRealized >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {netRealized >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  กระแสเงินสดสุทธิรับจริง (Realized Net Cash Flow)
                </span>
                <h4 className="text-lg sm:text-2xl font-black font-mono">
                  {formatMoney(netRealized)}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  คำนวณจาก: ขารับที่ได้รับแล้ว ({formatMoney(totalInflowPaid)}) ลบด้วย ขาจ่ายที่จ่ายแล้ว ({formatMoney(totalOutflowPaid)})
                </p>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-right w-full sm:w-auto">
              <span className="text-[11px] text-slate-400 block font-bold">
                ประมาณการสุทธิรวมยอดค้างรับ-ค้างจ่าย (Projected Net Position)
              </span>
              <span className={`text-base sm:text-lg font-black font-mono ${
                netProjected >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {formatMoney(netProjected)}
              </span>
              <span className="block text-[10px] text-slate-500 mt-0.5">
                (ขารับทั้งหมด - ขาจ่ายทั้งหมด)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: DETAILED PARTNER BILLINGS DRILL-DOWN (SUB-TAB)
         ───────────────────────────────────────────────────────────── */}
      {(activeViewMode === 'partner' || activeViewMode === 'combined') && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>รายละเอียดเอกสารคู่ค้า (Partner Invoices & Delivery Notes)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                จำแนกตามสถานะ 1.1 รอวางบิล, 1.2 วางบิลแล้ว, 1.3 ชำระแล้ว, 1.4 ยกเลิก
              </p>
            </div>

            {/* Filter & Search Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter Chips */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPartnerDocFilter('all')}
                  className={`px-2 py-1 rounded transition ${partnerDocFilter === 'all' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'}`}
                >
                  ทั้งหมด ({filteredPartnerBillings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPartnerDocFilter('pending')}
                  className={`px-2 py-1 rounded transition ${partnerDocFilter === 'pending' ? 'bg-amber-100 text-amber-800' : 'text-slate-600'}`}
                >
                  รอวางบิล ({partnerPendingList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPartnerDocFilter('billed')}
                  className={`px-2 py-1 rounded transition ${partnerDocFilter === 'billed' ? 'bg-blue-100 text-blue-800' : 'text-slate-600'}`}
                >
                  วางบิลแล้ว ({partnerBilledList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPartnerDocFilter('paid')}
                  className={`px-2 py-1 rounded transition ${partnerDocFilter === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600'}`}
                >
                  ชำระแล้ว ({partnerPaidList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPartnerDocFilter('cancelled')}
                  className={`px-2 py-1 rounded transition ${partnerDocFilter === 'cancelled' ? 'bg-slate-200 text-slate-800' : 'text-slate-600'}`}
                >
                  ยกเลิก ({partnerCancelledList.length})
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาคู่ค้า/เลขที่บิล..."
                  value={searchPartnerQuery}
                  onChange={e => setSearchPartnerQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-md pl-8 pr-3 py-1 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none w-44"
                />
              </div>
            </div>
          </div>

          {/* Partner Billings Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">ลำดับ</th>
                  <th className="py-2.5 px-3">ชื่อคู่ค้า / บริษัท</th>
                  <th className="py-2.5 px-3">เลขที่เอกสาร</th>
                  <th className="py-2.5 px-3">วันที่ออก / กำหนด</th>
                  <th className="py-2.5 px-3">สถานะ</th>
                  <th className="py-2.5 px-3 text-right">ยอดเงินสุทธิ</th>
                  <th className="py-2.5 px-3 text-center">ประเภท</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedPartnerBillings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      ไม่พบรายการเอกสารคู่ค้าตามเงื่อนไขที่เลือกในงวดนี้
                    </td>
                  </tr>
                ) : (
                  displayedPartnerBillings.map((b, idx) => {
                    const netVal = getBillingItemNet(b);
                    return (
                      <tr key={b.id || idx} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {b.partnerName || '-'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">
                          <div>{b.docNumber || b.billingDocNumber || b.deliveryDocNumber || '-'}</div>
                          {b.deliveryDocNumber && b.billingDocNumber && (
                            <div className="text-[10px] text-slate-400">
                              DO: {b.deliveryDocNumber} | BI: {b.billingDocNumber}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          <div>ออก: {b.issueDate || '-'}</div>
                          {b.dueDate && (
                            <div className="text-[10px] text-amber-700 font-semibold">
                              นัด: {b.dueDate}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {b.status === 'pending' && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px] inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" /> 1.1 รอวางบิล
                            </span>
                          )}
                          {b.status === 'billed' && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px] inline-flex items-center gap-1">
                              <FileText className="w-3 h-3" /> 1.2 วางบิลแล้ว
                            </span>
                          )}
                          {b.status === 'paid' && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> 1.3 ชำระแล้ว
                            </span>
                          )}
                          {b.status === 'cancelled' && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-bold text-[10px] inline-flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> 1.4 ยกเลิก
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                          {formatMoney(netVal)}
                          {b.cnAmount ? (
                            <span className="block text-[10px] text-rose-500 font-normal">
                              หัก CN: ฿{b.cnAmount.toLocaleString()}
                            </span>
                          ) : null}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono">
                            {b.docType === 'delivery' ? 'ใบส่งของ' : b.docType === 'billing' ? 'ใบวางบิล' : b.docType || 'เอกสาร'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Partner Company Matrix Breakdown */}
          {partnerCompanyBreakdown.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                สรุปยอดจำแนกตามบริษัทคู่ค้า (Partner Company Breakdown)
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="py-2 px-3">ชื่อคู่ค้า</th>
                      <th className="py-2 px-3 text-center">จำนวนบิล</th>
                      <th className="py-2 px-3 text-right text-amber-700">1.1 รอวางบิล</th>
                      <th className="py-2 px-3 text-right text-blue-700">1.2 วางบิลแล้ว</th>
                      <th className="py-2 px-3 text-right text-emerald-700">1.3 ชำระแล้ว</th>
                      <th className="py-2 px-3 text-right text-slate-500">1.4 ยกเลิก</th>
                      <th className="py-2 px-3 text-right font-black">รวมยอดทั้งสิ้น</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {partnerCompanyBreakdown.slice(0, 15).map((p, pIdx) => (
                      <tr key={pIdx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-bold text-slate-900">{p.name}</td>
                        <td className="py-2 px-3 text-center font-mono text-slate-600">{p.count}</td>
                        <td className="py-2 px-3 text-right font-mono text-amber-800">{formatMoney(p.pending)}</td>
                        <td className="py-2 px-3 text-right font-mono text-blue-800">{formatMoney(p.billed)}</td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-800">{formatMoney(p.paid)}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-500">{formatMoney(p.cancelled)}</td>
                        <td className="py-2 px-3 text-right font-mono font-black text-slate-900">{formatMoney(p.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: 12-MONTH MATRIX & VISUAL CHARTS (ANNUAL COMPARISON)
         ───────────────────────────────────────────────────────────── */}
      {(activeViewMode === 'matrix' || activeViewMode === 'combined') && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>3. ตารางสรุป 12 เดือนประจำปี {selectedYear} (Annual 12-Month Matrix)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                เปรียบเทียบยอดคู่ค้า 4 สถานะ และตรวจเช็คกระแสเงินสดขารับ-ขาจ่ายครบทั้ง 12 เดือน
              </p>
            </div>
          </div>

          {/* Recharts Graphical Visualization */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
            {/* 1. Bar Chart: Inflow vs Outflow */}
            <div className="lg:col-span-2 border border-slate-200 rounded-lg p-4 bg-slate-50/50">
              <h4 className="text-xs font-black text-slate-800 mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                เปรียบเทียบกระแสเงินสดขารับ vs ขาจ่าย (12 เดือน)
              </h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={twelveMonthsData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="monthShort" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `฿${(v/1000).toFixed(0)}k`} />
                    <RechartsTooltip 
                      formatter={(val: any) => formatMoney(Number(val))}
                      labelFormatter={(lbl) => `เดือน: ${lbl}`}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="inflowPaid" name="ขารับที่ได้รับแล้ว" fill="#10b981" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="outflowPaid" name="ขาจ่ายที่จ่ายแล้ว" fill="#ef4444" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="outflowPending" name="ขาจ่ายที่ยังไม่จ่าย" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Donut Chart: Partner Status Distribution */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 flex flex-col justify-between">
              <h4 className="text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-indigo-600" />
                สัดส่วนยอดคู่ค้า 4 สถานะ ({selectedMonthName})
              </h4>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={partnerDonutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {partnerDonutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(val: any) => formatMoney(Number(val))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold border-t border-slate-200 pt-2">
                {partnerDonutData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                    <span className="truncate">{d.name}: {formatMoney(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 12-Month Data Matrix Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-2.5 px-3" rowSpan={2}>เดือน</th>
                  <th className="py-1 px-3 text-center border-b border-slate-200 bg-amber-50/50 text-amber-900" colSpan={4}>
                    1. รายการคู่ค้า (Partner Billings)
                  </th>
                  <th className="py-1 px-3 text-center border-b border-slate-200 bg-emerald-50/50 text-emerald-900" colSpan={2}>
                    2.1 ขารับ (Inflow)
                  </th>
                  <th className="py-1 px-3 text-center border-b border-slate-200 bg-rose-50/50 text-rose-900" colSpan={2}>
                    2.2 ขาจ่าย (Outflow)
                  </th>
                  <th className="py-2.5 px-3 text-right bg-indigo-50/50 text-indigo-950 font-black" rowSpan={2}>
                    สุทธิรับจริง
                  </th>
                </tr>
                <tr className="bg-slate-100/70 text-[11px] text-slate-600">
                  <th className="py-1 px-2 text-right text-amber-800">1.1 รอวางบิล</th>
                  <th className="py-1 px-2 text-right text-blue-800">1.2 วางบิลแล้ว</th>
                  <th className="py-1 px-2 text-right text-emerald-800">1.3 ชำระแล้ว</th>
                  <th className="py-1 px-2 text-right text-slate-500">1.4 ยกเลิก</th>
                  <th className="py-1 px-2 text-right text-emerald-800">รับแล้ว</th>
                  <th className="py-1 px-2 text-right text-amber-800">ค้างรับ</th>
                  <th className="py-1 px-2 text-right text-rose-800">จ่ายแล้ว</th>
                  <th className="py-1 px-2 text-right text-amber-800">ยังไม่จ่าย</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {twelveMonthsData.map(m => (
                  <tr 
                    key={m.monthCode}
                    className={`hover:bg-slate-50 transition ${
                      selectedMonth === m.monthCode ? 'bg-indigo-50/60 font-bold' : ''
                    }`}
                  >
                    <td className="py-2 px-3 font-sans font-bold text-slate-900">
                      {m.monthName} ({m.monthCode})
                    </td>
                    <td className="py-2 px-2 text-right text-amber-800">{formatMoney(m.partnerPending)}</td>
                    <td className="py-2 px-2 text-right text-blue-800">{formatMoney(m.partnerBilled)}</td>
                    <td className="py-2 px-2 text-right text-emerald-800">{formatMoney(m.partnerPaid)}</td>
                    <td className="py-2 px-2 text-right text-slate-400">{formatMoney(m.partnerCancelled)}</td>
                    <td className="py-2 px-2 text-right text-emerald-900 font-bold">{formatMoney(m.inflowPaid)}</td>
                    <td className="py-2 px-2 text-right text-amber-700">{formatMoney(m.inflowPending)}</td>
                    <td className="py-2 px-2 text-right text-rose-900 font-bold">{formatMoney(m.outflowPaid)}</td>
                    <td className="py-2 px-2 text-right text-amber-700">{formatMoney(m.outflowPending)}</td>
                    <td className={`py-2 px-3 text-right font-black ${
                      m.netRealized >= 0 ? 'text-emerald-700 bg-emerald-50/30' : 'text-rose-700 bg-rose-50/30'
                    }`}>
                      {formatMoney(m.netRealized)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
