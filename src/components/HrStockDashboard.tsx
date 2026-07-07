import { useState, useMemo, useEffect } from 'react';
import { 
  Employee, 
  LeaveRequest, 
  CashFlowTransaction, 
  SalesRecord, 
  PayrollRecord, 
  JobPosting, 
  PartnerBilling
} from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Activity, 
  FileText, 
  Flame, 
  Briefcase, 
  Users, 
  Layers, 
  Zap, 
  Newspaper, 
  ArrowUpDown, 
  Plus, 
  Check, 
  X,
  Clock,
  Play,
  RotateCcw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  CartesianGrid, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  ComposedChart, 
  Line 
} from 'recharts';

interface HrStockDashboardProps {
  employees: Employee[];
  leaves: LeaveRequest[];
  sales: SalesRecord[];
  cashFlow: CashFlowTransaction[];
  payroll: PayrollRecord[];
  jobs: JobPosting[];
  partnerBillings: PartnerBilling[];
  onAddSale: (sale: SalesRecord) => void;
  onAddTransaction: (transaction: CashFlowTransaction) => void;
  onApproveLeave: (id: string) => void;
  onRejectLeave: (id: string) => void;
}

export default function HrStockDashboard({
  employees,
  leaves,
  sales,
  cashFlow,
  payroll,
  jobs,
  partnerBillings,
  onAddSale,
  onAddTransaction,
  onApproveLeave,
  onRejectLeave
}: HrStockDashboardProps) {
  // Theme/Layout modes inside the tab
  const [tickerSpeed, setTickerSpeed] = useState<number>(30);
  const [simulationActive, setSimulationActive] = useState<boolean>(true);
  const [tradeFormType, setTradeFormType] = useState<'BUY' | 'SELL'>('BUY');
  
  // Simulation trigger to force some real-time jitter in stock prices
  const [jitter, setJitter] = useState<number>(0);

  // Forms states
  const [tradeEmployeeId, setTradeEmployeeId] = useState<string>('');
  const [tradeAmount, setTradeAmount] = useState<string>('');
  const [tradeNotes, setTradeNotes] = useState<string>('');
  const [tradeCategory, setTradeCategory] = useState<string>('ขายสินค้า/บริการ');
  
  // Feed alerts
  const [newsFeed, setNewsFeed] = useState<{ id: string; time: string; text: string; type: 'success' | 'danger' | 'info' }[]>([]);

  // Jitter generator for stock market vibe
  useEffect(() => {
    if (!simulationActive) return;
    const interval = setInterval(() => {
      setJitter(prev => prev + (Math.random() - 0.5) * 2);
      
      // Randomly spawn a simulation log if there is a random chance
      if (Math.random() > 0.7) {
        const categories = ['MARKET', 'DEAL', 'SYSTEM', 'HR'];
        const cat = categories[Math.floor(Math.random() * categories.length)];
        const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        let newNews = '';
        let type: 'success' | 'danger' | 'info' = 'info';

        if (cat === 'MARKET') {
          const dept = employees[Math.floor(Math.random() * employees.length)]?.department || 'IT';
          const up = Math.random() > 0.5;
          newNews = `ดัชนีกลุ่มแผนก ${dept} ${up ? 'ขยับตัวขึ้นสูงขึ้น +0.45%' : 'ปรับฐานย่อยลดลง -0.12%'} ตามประเมินประสิทธิภาพรายชั่วโมง`;
          type = up ? 'success' : 'danger';
        } else if (cat === 'DEAL') {
          const randomVal = Math.floor(Math.random() * 50000) + 10000;
          newNews = `ดีลสัญญาลูกค้าใหม่ผ่านเข้าบริษัท คาดการณ์ยอดขายรายวันเพิ่ม ฿${randomVal.toLocaleString()}`;
          type = 'success';
        } else if (cat === 'HR') {
          const names = employees.map(e => e.name.split(' ')[0]);
          const randomName = names[Math.floor(Math.random() * names.length)] || 'พนักงาน';
          const leavesType = ['ป่วย', 'พักร้อน', 'กิจ'];
          const randomType = leavesType[Math.floor(Math.random() * leavesType.length)];
          newNews = `แจ้งการสับเปลี่ยนอัตรากำลังพล: คุณ ${randomName} อยู่ระหว่างเตรียมปรับยอดโควตาลา${randomType}`;
          type = 'info';
        } else {
          newNews = `ปริมาณงานโดยรวมของบริษัท (Workload Volume) เสถียรอยู่ที่ระดับ 94.2% ของเพดานสูงสุด`;
          type = 'success';
        }

        setNewsFeed(prev => [
          { id: Math.random().toString(), time: timeStr, text: newNews, type },
          ...prev.slice(0, 14)
        ]);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [simulationActive, employees]);

  // Initial news feed setup
  useEffect(() => {
    const initialNews = [
      { id: '1', time: '17:30:15', text: 'ตลาดหลักทรัพย์ HR เปิดการซื้อขายรอบค่ำ ดัชนีประสิทธิภาพกำลังพลคงที่ระดับสูง', type: 'success' as const },
      { id: '2', time: '17:28:40', text: 'รายงานพิเศษ: สรุปอัตราเข้าปฏิบัติงานรายวันเฉลี่ยพุ่งสูงสุดในรอบสัปดาห์ 96.5%', type: 'success' as const },
      { id: '3', time: '17:25:12', text: 'ระบบวิเคราะห์เชิงลึก: กลุ่มแผนกบริการลูกค้า (Customer Service) ได้รับคะแนนความเสถียรเพิ่ม 1.25%', type: 'info' as const },
      { id: '4', time: '17:15:00', text: 'กองทุนบริษัทประเมินมูลค่าสินทรัพย์สภาพคล่องคงคลัง (Treasury Liquid Reserves) ขยับบวกต่อเนื่อง', type: 'success' as const }
    ];
    setNewsFeed(initialNews);
  }, []);

  // Sync default employee
  useEffect(() => {
    if (employees.length > 0 && !tradeEmployeeId) {
      setTradeEmployeeId(employees[0].id);
    }
  }, [employees, tradeEmployeeId]);

  // Calculations for indexes based on ACTUAL database state
  const metrics = useMemo(() => {
    const totalEmployeesCount = employees.length;
    const activeEmployeesCount = employees.filter(e => e.status === 'active').length;
    
    // Average Performance Score (1-5)
    const baseValuationMultiplier = 50000; // factor to convert to synthetic Stock Price
    const baseAttendanceVal = 95.0; // standard attendance benchmark
    
    // Total cash reserves from CashFlow
    const totalIncome = cashFlow.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = cashFlow.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const treasuryBalance = 5000000 + totalIncome - totalExpense; // 5M initial base + flows
    
    // Sales index
    const totalSalesAmount = sales.reduce((acc, s) => acc + s.amount, 0);
    const salesPerformanceRatio = totalSalesAmount > 0 ? (totalSalesAmount / 1200000) * 100 : 100;

    // Attendance rate
    // We can simulate an average attendance based on records, say around 92-98%
    const attendanceRate = 94.2 + (jitter * 0.05);

    // Let's compute a synthetic "Company Market Cap" (มูลค่าองค์กรสไตล์หุ้น)
    // Valuation = (Total Employees * Avg Salary * Performance Ratio) + Cash
    // Let's create a solid valuation formula that changes dynamically
    const valuation = Math.round((totalEmployeesCount * 65000 * (salesPerformanceRatio / 100)) + treasuryBalance);
    const stockPrice = Math.max(10, (valuation / 150000) + jitter);
    const stockPriceChange = ((stockPrice - 55.4) / 55.4) * 100;

    // Department level synthetic Stock Indices
    const departments = Array.from(new Set(employees.map(e => e.department)));
    const deptStocks = departments.map(dept => {
      const deptEmps = employees.filter(e => e.department === dept);
      const totalSalary = deptEmps.reduce((acc, e) => acc + e.salary, 0);
      const count = deptEmps.length;
      
      // Let's create a mock price based on salary and employee count
      const price = Math.round((totalSalary / 500) + (count * 15) + (jitter * 0.3));
      const isUp = (dept.charCodeAt(0) % 2 === 0) ? (jitter >= 0) : (jitter < -1);
      const change = isUp ? Math.max(0.1, Math.abs(jitter * 0.15)) : -Math.max(0.1, Math.abs(jitter * 0.1));
      
      return {
        symbol: `MKT-${dept.substring(0, 3).toUpperCase()}`,
        name: dept,
        price,
        change,
        volume: count * 450,
        cap: price * count * 1000,
        isUp: change >= 0
      };
    });

    // Employee Individual Stock Momentum (Top 5 Gainers based on performance or mock values)
    const empStocks = employees.map(emp => {
      // Base score on salary, and synthetic indicators
      const basePrice = Math.round(emp.salary / 250);
      const randomScore = (emp.name.charCodeAt(1) % 5) + 1; // 1-5 stability rating
      const price = Math.round(basePrice + randomScore * 25 + (jitter * 0.1));
      const change = (jitter * 0.2) + (emp.status === 'active' ? 1.2 : -2.4);

      return {
        id: emp.id,
        symbol: emp.name.split(' ')[0],
        fullName: emp.name,
        role: emp.role,
        department: emp.department,
        price: Math.max(15, price),
        change,
        isUp: change >= 0,
        volume: Math.round((emp.salary * 0.05) + Math.abs(jitter * 5))
      };
    }).sort((a, b) => b.price - a.price);

    return {
      totalEmployeesCount,
      activeEmployeesCount,
      treasuryBalance,
      totalSalesAmount,
      attendanceRate,
      valuation,
      stockPrice,
      stockPriceChange,
      deptStocks,
      empStocks,
      salesPerformanceRatio
    };
  }, [employees, sales, cashFlow, jitter]);

  // Generate Candlestick / Area Chart dynamic daily data for the past 15 days
  const stockChartData = useMemo(() => {
    const data = [];
    const baseDate = new Date();
    
    // Look back 15 days
    for (let i = 14; i >= 0; i--) {
      const d = new Date();
      d.setDate(baseDate.getDate() - i);
      const dateStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
      
      // Calculate realistic fluctuating metrics
      // Add a progressive upward trend based on total actual sales
      const progressFactor = 1 + (metrics.totalSalesAmount / 5000000);
      const randomMultiplier = 0.95 + (Math.sin(i * 0.4) * 0.08) + ((i % 3 === 0 ? 0.03 : -0.02));
      
      const syntheticValuation = Math.round(metrics.valuation * randomMultiplier * progressFactor * 0.9);
      const synthPrice = parseFloat((syntheticValuation / 180000).toFixed(2));
      const synthHigh = parseFloat((synthPrice * 1.04).toFixed(2));
      const synthLow = parseFloat((synthPrice * 0.97).toFixed(2));
      const synthVolume = Math.round((3200 + (Math.sin(i) * 1500) + (metrics.totalSalesAmount / 10000)) * (i % 2 === 0 ? 1.2 : 0.8));

      // Calculate cash reserve flow trend
      const cashReserveTrend = Math.round(metrics.treasuryBalance * randomMultiplier);

      data.push({
        date: dateStr,
        price: synthPrice,
        high: synthHigh,
        low: synthLow,
        volume: synthVolume,
        cash: cashReserveTrend,
        "มูลค่าองค์กร (M)": parseFloat((syntheticValuation / 1000000).toFixed(3))
      });
    }
    return data;
  }, [metrics.valuation, metrics.totalSalesAmount, metrics.treasuryBalance]);

  // Order Book - pending leaves, billing documents, and jobs represent active bids/asks
  const orderBook = useMemo(() => {
    const asks: { type: 'ASK'; id: string; name: string; desc: string; qty: number; price: number; actionLabel: string; rawType: 'leave' | 'billing'; color: string }[] = [];
    const bids: { type: 'BID'; id: string; name: string; desc: string; qty: number; price: number; actionLabel: string; rawType: 'job' | 'sale_sim'; color: string }[] = [];

    // Pending Leaves are ASKS (Employee asking for Day Off, represents temporary labor sell back)
    leaves.filter(l => l.status === 'pending').forEach(leave => {
      asks.push({
        type: 'ASK',
        id: leave.id,
        name: `ลาหยุด: ${leave.employeeName}`,
        desc: `${leave.type === 'sick' ? 'ลาป่วย' : leave.type === 'annual' ? 'ลาพักร้อน' : 'ลากิจ'} - ${leave.days} วัน`,
        qty: leave.days,
        price: Math.round(2500 * leave.days),
        actionLabel: 'อนุมัติการลา (FILL)',
        rawType: 'leave',
        color: 'rose'
      });
    });

    // Pending Partner Billings are also ASKS (Partner demanding money, represents outflow ask)
    partnerBillings.filter(b => b.status === 'billed').forEach(billing => {
      asks.push({
        type: 'ASK',
        id: billing.id,
        name: `เจ้าหนี้: ${billing.partnerName}`,
        desc: `เลขที่ใบส่งของ/วางบิล: ${billing.docNumber}`,
        qty: 1,
        price: billing.amount,
        actionLabel: 'จ่ายชำระเงิน (SETTLE)',
        rawType: 'billing',
        color: 'amber'
      });
    });

    // Open Job Positions are BIDS (Company bidding to buy talent from market)
    jobs.filter(j => j.status === 'open').forEach(job => {
      bids.push({
        type: 'BID',
        id: job.id,
        name: `รับสมัคร: ${job.title}`,
        desc: `แผนก ${job.department} (${job.type})`,
        qty: job.applicantsCount || 1,
        price: 35000, // Synthetic recruitment unit cost
        actionLabel: 'ปิดรับสมัคร (CLOSE BID)',
        rawType: 'job',
        color: 'emerald'
      });
    });

    // If there's none, provide simulated bids to keep the terminal highly active
    if (bids.length === 0) {
      bids.push({
        type: 'BID',
        id: 'sim_bid_1',
        name: 'สัญญารับเหมาบริการภายนอก',
        desc: 'ลูกค้าจ้างบำรุงรักษาซอฟต์แวร์รายไตรมาส',
        qty: 1,
        price: 180000,
        actionLabel: 'เติมเงินทุน (LIQUIDATE)',
        rawType: 'sale_sim',
        color: 'emerald'
      });
      bids.push({
        type: 'BID',
        id: 'sim_bid_2',
        name: 'บิดประมูลงานจัดจ้างอบรมสัมนา',
        desc: 'หน่วยงานรัฐวิสาหกิจเสนอเข้าแข่งขัน',
        qty: 2,
        price: 95000,
        actionLabel: 'รับเงินงวดงาน (COLLECT)',
        rawType: 'sale_sim',
        color: 'blue'
      });
    }

    return {
      asks: asks.sort((a, b) => a.price - b.price), // lowest asks first
      bids: bids.sort((a, b) => b.price - a.price)  // highest bids first
    };
  }, [leaves, partnerBillings, jobs]);

  // Handle Match / Fill operation on the stock board
  const handleOrderMatch = (order: any) => {
    const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    if (order.rawType === 'leave') {
      onApproveLeave(order.id);
      setNewsFeed(prev => [
        { id: Math.random().toString(), time: timeStr, text: `จับคู่สำเร็จ [MATCHED]: อนุมัติการลาพักผ่อน คุณ ${order.name.replace('ลาหยุด: ', '')} เรียบร้อย สัญญาได้รับการเติมเต็ม`, type: 'success' },
        ...prev
      ]);
    } else if (order.rawType === 'billing') {
      // Simulate settling billing by posting a negative transaction to treasury cashflow
      const transaction: CashFlowTransaction = {
        id: Math.random().toString(),
        type: 'expense',
        category: 'ชำระค่าสินค้า/บริการคู่ค้า',
        amount: order.price,
        date: new Date().toISOString().split('T')[0],
        description: `จ่ายวางบิลอัตโนมัติจากตลาดหลักทรัพย์ HR: ${order.name}`,
        status: 'completed'
      };
      onAddTransaction(transaction);
      setNewsFeed(prev => [
        { id: Math.random().toString(), time: timeStr, text: `จับคู่สำเร็จ [SETTLED]: อนุมัติเบิกจ่ายชำระเงินคู่ค้า ฿${order.price.toLocaleString()} ยอดหมุนเวียนคงเหลือปรับสมดุล`, type: 'danger' },
        ...prev
      ]);
    } else if (order.rawType === 'sale_sim') {
      // Fulfill bid by injecting a sale record
      const sale: SalesRecord = {
        id: Math.random().toString(),
        date: new Date().toISOString().split('T')[0],
        amount: order.price,
        notes: `เติมสภาพคล่องอัตโนมัติจาก Stock Terminal: ${order.name}`
      };
      onAddSale(sale);
      setNewsFeed(prev => [
        { id: Math.random().toString(), time: timeStr, text: `จับคู่สำเร็จ [LIQUIDATED]: ป้อนเม็ดเงินระดมทุนยอดขายใหม่ ฿${order.price.toLocaleString()} ดัชนีหุ้นหลักเด้งรับทันที`, type: 'success' },
        ...prev
      ]);
    } else {
      setNewsFeed(prev => [
        { id: Math.random().toString(), time: timeStr, text: `ยกเลิกรายการสมัครชั่วคราว: ข้อตกลงสัญญางานมีเงื่อนไขรัดกุมสูง ยังไม่สามารถประมวลผลได้`, type: 'info' },
        ...prev
      ]);
    }
  };

  // Submit Trade Simulation Form
  const handleTradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradeAmount || isNaN(Number(tradeAmount))) return;
    
    const amount = parseFloat(tradeAmount);
    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (tradeFormType === 'BUY') {
      // Injects a simulated direct cash sale
      const sale: SalesRecord = {
        id: Math.random().toString(),
        date: dateStr,
        amount: amount,
        notes: `ระดมทุนยอดขายสตรีมตลาดหุ้น: ${tradeNotes || 'ไม่ระบุหมายเหตุ'}`
      };
      onAddSale(sale);
      
      setNewsFeed(prev => [
        { id: Math.random().toString(), time: timeStr, text: `TRADE: อัดฉีดยอดขายหนุนดัชนีกองทุนบริษัท ฿${amount.toLocaleString()} (เพิ่มมูลค่าหุ้นหลักโดยตรง)`, type: 'success' },
        ...prev
      ]);
    } else {
      // Disburses cash expense
      const transaction: CashFlowTransaction = {
        id: Math.random().toString(),
        type: 'expense',
        category: tradeCategory,
        amount: amount,
        date: dateStr,
        description: `ถอนสภาพคล่อง/จ่ายต้นทุนตลาดหุ้น: ${tradeNotes || 'ถอนสภาพคล่อง'}`,
        status: 'completed'
      };
      onAddTransaction(transaction);

      setNewsFeed(prev => [
        { id: Math.random().toString(), time: timeStr, text: `TRADE: เบิกเงินปันผล/จ่ายสภาพคล่องออกตลาด ฿${amount.toLocaleString()} หมวด [${tradeCategory}]`, type: 'danger' },
        ...prev
      ]);
    }

    setTradeAmount('');
    setTradeNotes('');
  };

  return (
    <div id="hr-stock-terminal" className="space-y-6 text-slate-100 font-sans">
      
      {/* GLOWING HEADER BLOCK */}
      <div className="bg-slate-900 border border-slate-800 rounded-sm p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 left-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs text-[9px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest animate-pulse">
              LIVE BROADCASTING
            </span>
            <span className="text-[10px] text-slate-500 font-mono">STABLE CHANNEL // WORKSPACE 1</span>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight mt-1 uppercase font-sans">
            ระบบจำลองตลาดหุ้นองค์กร <span className="text-blue-500">HR STOCK MARKET BOARD</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            แปลงข้อมูลพนักงาน อัตราเข้าปฏิบัติงาน ยอดขายรายวัน และเงินทุนหมุนเวียนในคลังเป็นดัชนีชี้วัดสไตล์ตลาดทุนเรียลไทม์ เพื่อการบริหารและวิเคราะห์เชิงประสิทธิภาพที่เห็นภาพรวมเด่นชัดที่สุด
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-500 block">INDEX VALUATION</span>
            <span className="text-lg font-black text-emerald-400 font-mono">฿{metrics.valuation.toLocaleString()}</span>
          </div>
          <div className="w-px h-8 bg-slate-800"></div>
          <div className="flex gap-2">
            <button
              onClick={() => setSimulationActive(!simulationActive)}
              className={`px-3 py-1.5 rounded-xs text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition ${
                simulationActive 
                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/30' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              {simulationActive ? (
                <>
                  <Activity className="w-3.5 h-3.5 text-emerald-400 animate-spin" /> LIVEFEED ON
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> FEED PAUSED
                </>
              )}
            </button>
            <button
              onClick={() => setJitter(0)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xs text-slate-400 text-xs flex items-center justify-center cursor-pointer"
              title="Reset stock fluctuations"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* REAL-TIME HORIZONTAL TICKER TAPE */}
      <div className="bg-slate-950 border border-slate-850 p-2 overflow-hidden relative rounded-xs select-none shadow-inner text-left">
        <div className="absolute top-0 bottom-0 left-0 w-12 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none"></div>
        
        <div className="flex whitespace-nowrap gap-8 text-[11px] font-mono tracking-wide animate-marquee">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-slate-500 font-bold">$HR_COMP (ดัชนีรวมบริษัท):</span>
            <span className="text-white font-black">฿{metrics.stockPrice.toFixed(2)}</span>
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${metrics.stockPriceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {metrics.stockPriceChange >= 0 ? '+' : ''}{metrics.stockPriceChange.toFixed(2)}%
              {metrics.stockPriceChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-slate-500 font-bold">$ATT_YLD (อัตราเข้างาน):</span>
            <span className="text-white font-black">{metrics.attendanceRate.toFixed(1)}%</span>
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${jitter >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {jitter >= 0 ? '+' : ''}{(jitter * 0.1).toFixed(2)}%
              {jitter >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-slate-500 font-bold">$SLS_VAL (ดัชนียอดขายสะสม):</span>
            <span className="text-emerald-400 font-black">฿{metrics.totalSalesAmount.toLocaleString()}</span>
            <span className="text-emerald-400 text-[10px] font-bold inline-flex items-center gap-0.5">
              +{metrics.salesPerformanceRatio.toFixed(1)}% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-slate-500 font-bold">$LIQUID_TREASURY (สภาพคล่องคลัง):</span>
            <span className="text-blue-400 font-black">฿{metrics.treasuryBalance.toLocaleString()}</span>
            <span className="text-slate-400 text-[9px]">(STABLE LIQUIDITY)</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-slate-500 font-bold">$EMP_CAP (พนักงานทั้งระบบ):</span>
            <span className="text-white font-black">{metrics.totalEmployeesCount} คน</span>
            <span className="text-emerald-400 text-[10px] font-bold inline-flex items-center gap-0.5">
              +{metrics.activeEmployeesCount} ACTV
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-slate-500 font-bold">$LVE_VOL (ยอดใบลาคงค้าง):</span>
            <span className="text-amber-400 font-black">{leaves.filter(l => l.status === 'pending').length} ใบลา</span>
            <span className="text-slate-400 text-[9px]">(WAITING MATCH)</span>
          </div>
        </div>
      </div>

      {/* CORE TRADING SYSTEM GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COMPONENT: TRADINGVIEW-STYLE CANDLE CHART & MARKET ACTION PANEL */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* CHARTS CONTAINER */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-sm shadow-xl flex flex-col text-left">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">CHART ANALYSIS</span>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400 animate-pulse" /> กราฟดัชนีหลักทรัพย์มูลค่าสุทธิของบริษัท (Company Net Assets & Valuation)
                </h3>
              </div>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-sm border border-slate-850">
                <span className="px-2 py-0.5 text-[9px] font-mono bg-blue-500/20 text-blue-400 font-bold rounded-xs border border-blue-500/10">15D INTERVAL</span>
                <span className="px-2 py-0.5 text-[9px] font-mono text-slate-400">MA(5): ACTIVE</span>
              </div>
            </div>

            {/* CHART VIEWPORT */}
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stockChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorStockPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} />
                  <YAxis 
                    yAxisId="left"
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 9, fill: '#3b82f6', fontFamily: 'monospace' }} 
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 9, fill: '#10b981', fontFamily: 'monospace' }} 
                  />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '4px', fontSize: '11px', color: '#f8fafc' }}
                    labelStyle={{ fontWeight: 'bold', color: '#38bdf8' }}
                  />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="price" 
                    stroke="#3b82f6" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorStockPrice)" 
                    name="ดัชนีราคาหุ้นรวม" 
                  />
                  <Area 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="มูลค่าองค์กร (M)" 
                    stroke="#10b981" 
                    strokeWidth={1.5}
                    fillOpacity={1} 
                    fill="url(#colorCash)" 
                    name="มูลค่าบริษัท (ล้านบาท)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* LOWER STATS GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-800">
              <div className="bg-slate-950 p-2.5 rounded-sm border border-slate-850">
                <span className="text-[10px] text-slate-500 font-mono block">DAY RANGE</span>
                <span className="text-xs font-bold font-mono text-white">
                  ฿{(metrics.stockPrice * 0.98).toFixed(2)} - ฿{(metrics.stockPrice * 1.03).toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-sm border border-slate-850">
                <span className="text-[10px] text-slate-500 font-mono block">PE RATIO (EFFICIENCY)</span>
                <span className="text-xs font-bold font-mono text-white">12.4x</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-sm border border-slate-850">
                <span className="text-[10px] text-slate-500 font-mono block">VOL (EMPLOYEES ACTV)</span>
                <span className="text-xs font-bold font-mono text-emerald-400">
                  {metrics.activeEmployeesCount} / {metrics.totalEmployeesCount}
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-sm border border-slate-850">
                <span className="text-[10px] text-slate-500 font-mono block">TREASURY STABILITY</span>
                <span className="text-xs font-bold font-mono text-blue-400">EXCELLENT (AAA)</span>
              </div>
            </div>
          </div>

          {/* DYNAMIC ORDER BOOK / PENDING OPERATIONS CONTRACT LIST */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-sm shadow-xl flex flex-col text-left">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">PENDING ORDER BOOK</span>
              <h3 className="text-sm font-bold text-white mb-1">
                กระดานจับคู่ใบคำขอและเอกสารจัดซื้อจัดจ้าง (HR Order Book - Bids & Asks)
              </h3>
              <p className="text-[11px] text-slate-400 mb-4">
                แสดงใบคำขอลาของพนักงาน (Asks - ต้องการขายชั่วโมงงาน) และใบแจ้งหนี้หรือการเปิดรับตำแหน่งของแผนก (Bids - ต้องการซื้อชั่วโมงงาน/บุคลากร) กด MATCH เพื่ออนุมัติทันที
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* ASKS (แดง / ลาหยุด & เจ้าหนี้ส่งของ) */}
              <div className="bg-slate-950 border border-slate-850 rounded-sm p-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-2">
                  <span className="text-xs font-mono font-bold text-rose-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span> ASKS (คำขอเบิกจ่าย/ขอลาหยุดสะสม)
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{orderBook.asks.length} ORDERS</span>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {orderBook.asks.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs font-mono">
                      --- NO INCOMING ASKS ---
                    </div>
                  ) : (
                    orderBook.asks.map((ask) => (
                      <div key={ask.id} className="p-2 bg-slate-900 border border-slate-850 rounded-sm flex justify-between items-center hover:border-rose-900 transition text-[11px] font-mono">
                        <div>
                          <p className="font-bold text-slate-200 text-left line-clamp-1">{ask.name}</p>
                          <p className="text-[10px] text-slate-400 text-left">{ask.desc}</p>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="font-bold text-rose-400">฿{ask.price.toLocaleString()}</p>
                          <button
                            onClick={() => handleOrderMatch(ask)}
                            className="mt-1 px-1.5 py-0.5 bg-rose-950/40 text-rose-400 hover:bg-rose-900 hover:text-white border border-rose-800/60 rounded-xs text-[9px] font-bold font-sans cursor-pointer transition flex items-center gap-0.5"
                          >
                            <Check className="w-2.5 h-2.5" /> MATCH
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* BIDS (เขียว / ประกาศรับงาน & ยอดขายระดมทุน) */}
              <div className="bg-slate-950 border border-slate-850 rounded-sm p-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-2">
                  <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> BIDS (เปิดรับกำลังพล/เตรียมทุนหมุนเวียน)
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{orderBook.bids.length} ORDERS</span>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {orderBook.bids.map((bid) => (
                    <div key={bid.id} className="p-2 bg-slate-900 border border-slate-850 rounded-sm flex justify-between items-center hover:border-emerald-900 transition text-[11px] font-mono">
                      <div>
                        <p className="font-bold text-slate-200 text-left line-clamp-1">{bid.name}</p>
                        <p className="text-[10px] text-slate-400 text-left">{bid.desc}</p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="font-bold text-emerald-400">฿{bid.price.toLocaleString()}</p>
                        <button
                          onClick={() => handleOrderMatch(bid)}
                          className="mt-1 px-1.5 py-0.5 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900 hover:text-white border border-emerald-800/60 rounded-xs text-[9px] font-bold font-sans cursor-pointer transition flex items-center gap-0.5"
                        >
                          <Check className="w-2.5 h-2.5" /> MATCH
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: INDIVIDUAL STOCK ASSETS, QUICK TRANSACT & RECENT DEALS */}
        <div className="lg:col-span-4 space-y-6 text-left">
          
          {/* QUICK TRANSACT TERMINAL */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-sm shadow-xl">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">QUICK ORDER PANEL</span>
            <h3 className="text-sm font-bold text-white mb-3">แผงยิงคำสั่งเพิ่มเม็ดเงิน / ป้อนต้นทุน (Transact Cash)</h3>
            
            <div className="flex bg-slate-950 p-1 rounded-sm border border-slate-850 mb-4">
              <button
                onClick={() => setTradeFormType('BUY')}
                className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-xs transition cursor-pointer ${
                  tradeFormType === 'BUY' 
                    ? 'bg-emerald-500 text-slate-950 font-black' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                BUY (ป้อนยอดขายหนุนหุ้น)
              </button>
              <button
                onClick={() => setTradeFormType('SELL')}
                className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-xs transition cursor-pointer ${
                  tradeFormType === 'SELL' 
                    ? 'bg-rose-500 text-white font-black' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                SELL (ถอนเงินจ่ายต้นทุน)
              </button>
            </div>

            <form onSubmit={handleTradeSubmit} className="space-y-4">
              {tradeFormType === 'SELL' && (
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">หมวดหมู่ค่าใช้จ่าย / การถอนทุน</label>
                  <select
                    value={tradeCategory}
                    onChange={(e) => setTradeCategory(e.target.value)}
                    className="w-full bg-slate-950 text-xs border border-slate-800 p-2.5 rounded-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="ชำระค่าสินค้า/บริการคู่ค้า">จ่ายหนี้บริษัทคู่ค้า</option>
                    <option value="ค่าสาธารณูปโภค">ค่าสาธารณูปโภค (น้ำ/ไฟ/เน็ต)</option>
                    <option value="จัดซื้ออุปกรณ์และทรัพย์สิน">จัดซื้อคอมพิวเตอร์/ทรัพย์สิน</option>
                    <option value="ถอนทุนสวัสดิการพนักงาน">งบสวัสดิการ & สันทนาการ</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                  {tradeFormType === 'BUY' ? 'ยอดขายระดมทุน (บาท)' : 'จำนวนเงินค่าใช้จ่าย (บาท)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-mono">฿</span>
                  <input
                    type="number"
                    required
                    placeholder="ป้อนตัวเลขยอดเงิน..."
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    className="w-full bg-slate-950 pl-7 pr-4 py-2 text-xs border border-slate-800 rounded-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">หมายเหตุข้อมูลรายการตลาด</label>
                <input
                  type="text"
                  placeholder="เช่น ดีลสัญญาลูกค้ากลุ่มอสังหาฯ..."
                  value={tradeNotes}
                  onChange={(e) => setTradeNotes(e.target.value)}
                  className="w-full bg-slate-950 text-xs border border-slate-800 p-2.5 rounded-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className={`w-full py-2.5 rounded-xs text-xs font-black uppercase tracking-wider transition cursor-pointer font-mono ${
                  tradeFormType === 'BUY' 
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950' 
                    : 'bg-rose-500 hover:bg-rose-400 text-white'
                }`}
              >
                EXECUTE {tradeFormType} ORDER NOW
              </button>
            </form>
          </div>

          {/* DEPARTMENT STOCK PORTFOLIO (แผงกองทุนแผนก) */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-sm shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">SECTOR INDEX</span>
                <h3 className="text-sm font-bold text-white">ดัชนีแบ่งตามแผนก (Sectors)</h3>
              </div>
              <span className="text-[10px] font-mono text-blue-400 font-bold">ALL ACTIVE</span>
            </div>

            <div className="space-y-2">
              {metrics.deptStocks.map((dept, index) => (
                <div key={index} className="p-2.5 bg-slate-950 border border-slate-850 rounded-sm flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-blue-500/30 rounded-xs shrink-0 flex flex-col justify-end overflow-hidden">
                      <div className={`w-full ${dept.isUp ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ height: `${60 + (dept.price % 40)}%` }}></div>
                    </div>
                    <div>
                      <span className="text-slate-300 font-black block leading-none">{dept.symbol}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{dept.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-black block leading-none">฿{dept.price.toLocaleString()}</span>
                    <span className={`text-[10px] font-bold block mt-0.5 inline-flex items-center gap-0.5 ${dept.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {dept.isUp ? '+' : ''}{dept.change.toFixed(2)}%
                      {dept.isUp ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* INDIVIDUAL EMPLOYEE TICKERS (หุ้นรายบุคคลยอดนิยม) */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-sm shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">INDIVIDUAL VALUE</span>
                <h3 className="text-sm font-bold text-white">หุ้นพนักงานชั้นนำ (Top High-Value Talent)</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">TOP MOMENTUM</span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {metrics.empStocks.slice(0, 5).map((emp, index) => (
                <div key={emp.id} className="p-2.5 bg-slate-950 border border-slate-850 rounded-sm flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-bold">#{index + 1}</span>
                    <div>
                      <span className="text-slate-200 font-black block leading-none">{emp.symbol}</span>
                      <span className="text-[9px] text-slate-500 block mt-0.5 line-clamp-1">{emp.role}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-black block leading-none">฿{emp.price.toLocaleString()}</span>
                    <span className={`text-[9px] font-bold inline-flex items-center gap-0.5 ${emp.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {emp.isUp ? '+' : ''}{emp.change.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* FOOTER TICKER: AUDIT LOGS AND LIVE FEED NEWS */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-sm shadow-xl text-left">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-3">
          <span className="text-xs font-mono font-bold text-blue-400 flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-blue-400" /> สตรีมข้อมูลข่าวสารและการประมวลผลระบบ (Live Market News & Engine Activity)
          </span>
          <span className="text-[10px] font-mono text-slate-500">AUTO-REFRESHING IN REALTIME</span>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-[11px] divide-y divide-slate-850/40">
          {newsFeed.map((news) => {
            let textColor = 'text-slate-300';
            let dotColor = 'bg-blue-400';
            if (news.type === 'success') {
              textColor = 'text-emerald-400';
              dotColor = 'bg-emerald-500 animate-pulse';
            } else if (news.type === 'danger') {
              textColor = 'text-rose-400';
              dotColor = 'bg-rose-500';
            }

            return (
              <div key={news.id} className="pt-2 flex items-start gap-2.5">
                <span className="text-slate-500 shrink-0 font-bold">[{news.time}]</span>
                <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${dotColor}`}></span>
                <p className={`${textColor} leading-relaxed`}>{news.text}</p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
