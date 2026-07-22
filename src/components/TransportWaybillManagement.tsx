import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TransportWaybill, PartnerCompany } from '../types';
import { 
  Truck, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  Printer, 
  Building2, 
  ChevronDown, 
  X, 
  Download, 
  Coins, 
  Percent, 
  ClipboardList,
  RefreshCw,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface SearchablePartnerSelectProps {
  value: string;
  onChange: (value: string) => void;
  partners: PartnerCompany[];
  onAddNewPartner?: () => void;
  placeholder?: string;
  required?: boolean;
}

function SearchablePartnerSelect({
  value,
  onChange,
  partners,
  onAddNewPartner,
  placeholder = "พิมพ์ค้นหาชื่อบริษัทคู่ค้าขนส่ง...",
  required = false
}: SearchablePartnerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPartners = useMemo(() => {
    if (!value.trim()) return partners;
    const q = value.toLowerCase().trim();
    return partners.filter(p => 
      p.name.toLowerCase().includes(q) ||
      (p.taxId && p.taxId.toLowerCase().includes(q)) ||
      (p.contactPerson && p.contactPerson.toLowerCase().includes(q)) ||
      (p.phone && p.phone.includes(q))
    );
  }, [partners, value]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-8 pr-16 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-indigo-500 bg-white font-sans text-xs text-slate-800 font-medium"
          required={required}
        />
        <div className="absolute right-2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(true);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer border-0 bg-transparent"
              title="ล้างข้อมูล"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer border-0 bg-transparent"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-sm shadow-xl max-h-56 overflow-y-auto animate-fade-in font-sans">
          <div className="p-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-[11px] font-bold text-slate-500">
            <span>เลือกคู่ค้าจากระบบ ({filteredPartners.length} ราย)</span>
            {onAddNewPartner && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onAddNewPartner();
                }}
                className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer bg-transparent border-0"
              >
                <Plus className="w-3 h-3" /> เพิ่มคู่ค้าใหม่
              </button>
            )}
          </div>

          {filteredPartners.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredPartners.map(p => {
                const isSelected = p.name === value;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onChange(p.name);
                      setIsOpen(false);
                    }}
                    className={`p-2 hover:bg-indigo-50/70 transition cursor-pointer flex justify-between items-center ${
                      isSelected ? 'bg-indigo-50 border-l-2 border-indigo-600' : ''
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="font-bold text-xs text-slate-800">{p.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 pl-5">
                        {p.taxId && <span>เลขภาษี: <strong className="font-mono text-slate-700">{p.taxId}</strong></span>}
                        {p.phone && <span>โทร: {p.phone}</span>}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3 text-center space-y-2">
              <p className="text-xs text-slate-500">
                ไม่พบข้อมูลคู่ค้าที่ตรงกับ <strong className="text-slate-800">"{value}"</strong>
              </p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xs cursor-pointer border-0"
              >
                ใช้ชื่อ "{value}" นี้
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface TransportWaybillManagementProps {
  waybills: TransportWaybill[];
  onAddWaybill: (waybill: Omit<TransportWaybill, 'id'>) => void;
  onUpdateWaybill: (waybill: TransportWaybill) => void;
  onDeleteWaybill: (id: string) => void;
  partners?: PartnerCompany[];
  carriers?: string[];
  onAddNewPartner?: () => void;
}

export default function TransportWaybillManagement({
  waybills = [],
  onAddWaybill,
  onUpdateWaybill,
  onDeleteWaybill,
  partners = [],
  carriers = ['Kerry Express', 'Flash Express', 'J&T Express', 'ไปรษณีย์ไทย (EMS)', 'รถขนส่งบริษัท', 'ขนส่งเอกชนทั่วไป'],
  onAddNewPartner
}: TransportWaybillManagementProps) {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWaybill, setEditingWaybill] = useState<TransportWaybill | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TransportWaybill | null>(null);
  const [printTarget, setPrintTarget] = useState<TransportWaybill | null>(null);

  // Form Field States
  const [waybillNumber, setWaybillNumber] = useState('');
  const [carrierName, setCarrierName] = useState(carriers[0] || 'Kerry Express');
  const [partnerName, setPartnerName] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Delivery receipt details (เล่มที่, เลขที่, จำนวน, ราคา)
  const [bookNumber, setBookNumber] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [totalPrice, setTotalPrice] = useState<number | ''>('');

  // Withholding Tax details (ใบหัก ณ ที่จ่าย)
  const [whtDocNumber, setWhtDocNumber] = useState('');
  const [whtRate, setWhtRate] = useState<number>(1); // 1% default for transport
  const [whtAmount, setWhtAmount] = useState<number | ''>('');
  const [isWhtAutoCalc, setIsWhtAutoCalc] = useState(true);

  // Status (รอใบเสร็จ / ได้รับใบเสร็จแล้ว / ยกเลิก)
  const [status, setStatus] = useState<'pending_receipt' | 'receipt_received' | 'cancelled'>('pending_receipt');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Auto-generate waybill number if empty
  const generateNewWaybillNo = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `WB-${dateStr}-${randomSuffix}`;
  };

  const generateNewWhtNo = () => {
    const year = new Date().getFullYear();
    const count = waybills.length + 1;
    return `WHT-${year}-${String(count).padStart(3, '0')}`;
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingWaybill(null);
    setWaybillNumber(generateNewWaybillNo());
    setCarrierName(carriers[0] || 'Kerry Express');
    setPartnerName('');
    setDeliveryDate(new Date().toISOString().split('T')[0]);
    setBookNumber('');
    setReceiptNumber('');
    setQuantity(1);
    setUnitPrice('');
    setTotalPrice('');
    setWhtDocNumber(generateNewWhtNo());
    setWhtRate(1);
    setWhtAmount('');
    setIsWhtAutoCalc(true);
    setStatus('pending_receipt');
    setTrackingNumber('');
    setNotes('');
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (wb: TransportWaybill) => {
    setEditingWaybill(wb);
    setWaybillNumber(wb.waybillNumber || '');
    setCarrierName(wb.carrierName || carriers[0] || '');
    setPartnerName(wb.partnerName || '');
    setDeliveryDate(wb.deliveryDate || new Date().toISOString().split('T')[0]);
    setBookNumber(wb.bookNumber || '');
    setReceiptNumber(wb.receiptNumber || '');
    setQuantity(wb.quantity || 1);
    setUnitPrice(wb.unitPrice ?? '');
    setTotalPrice(wb.totalPrice || 0);
    setWhtDocNumber(wb.whtDocNumber || '');
    setWhtRate(wb.whtRate ?? 1);
    setWhtAmount(wb.whtAmount ?? '');
    setIsWhtAutoCalc(false);
    setStatus(wb.status || 'pending_receipt');
    setTrackingNumber(wb.trackingNumber || '');
    setNotes(wb.notes || '');
    setIsFormOpen(true);
  };

  // Auto recalculate total price & WHT amount when Qty or Unit Price or WHT Rate changes
  useEffect(() => {
    if (quantity && unitPrice && typeof quantity === 'number' && typeof unitPrice === 'number') {
      const calcTotal = quantity * unitPrice;
      setTotalPrice(calcTotal);
      if (isWhtAutoCalc) {
        setWhtAmount(Math.round((calcTotal * (whtRate / 100)) * 100) / 100);
      }
    }
  }, [quantity, unitPrice, whtRate, isWhtAutoCalc]);

  useEffect(() => {
    if (isWhtAutoCalc && totalPrice && typeof totalPrice === 'number') {
      setWhtAmount(Math.round((totalPrice * (whtRate / 100)) * 100) / 100);
    }
  }, [totalPrice, whtRate, isWhtAutoCalc]);

  // Handle Submit Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName.trim()) {
      alert("กรุณาระบุชื่อบริษัทคู่ค้าขนส่ง");
      return;
    }

    const numericTotal = typeof totalPrice === 'number' ? totalPrice : parseFloat(totalPrice as string) || 0;
    const numericWht = typeof whtAmount === 'number' ? whtAmount : parseFloat(whtAmount as string) || (numericTotal * (whtRate / 100));

    const waybillData = {
      waybillNumber: waybillNumber.trim() || generateNewWaybillNo(),
      carrierName: carrierName.trim(),
      partnerName: partnerName.trim(),
      deliveryDate,
      bookNumber: bookNumber.trim(),
      receiptNumber: receiptNumber.trim(),
      quantity: typeof quantity === 'number' ? quantity : parseInt(quantity as string) || 1,
      unitPrice: typeof unitPrice === 'number' ? unitPrice : parseFloat(unitPrice as string) || undefined,
      totalPrice: numericTotal,
      whtDocNumber: whtDocNumber.trim(),
      whtRate,
      whtAmount: numericWht,
      status,
      trackingNumber: trackingNumber.trim(),
      notes: notes.trim(),
      createdAt: editingWaybill?.createdAt || new Date().toISOString()
    };

    if (editingWaybill) {
      onUpdateWaybill({ ...waybillData, id: editingWaybill.id });
    } else {
      onAddWaybill(waybillData);
    }

    setIsFormOpen(false);
  };

  // Quick Status Toggle
  const handleQuickToggleStatus = (wb: TransportWaybill) => {
    const nextStatus = wb.status === 'pending_receipt' ? 'receipt_received' : 'pending_receipt';
    onUpdateWaybill({ ...wb, status: nextStatus });
  };

  // Filtered list
  const filteredWaybills = useMemo(() => {
    return waybills.filter(wb => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || 
        wb.waybillNumber?.toLowerCase().includes(q) ||
        wb.partnerName?.toLowerCase().includes(q) ||
        wb.carrierName?.toLowerCase().includes(q) ||
        wb.receiptNumber?.toLowerCase().includes(q) ||
        wb.bookNumber?.toLowerCase().includes(q) ||
        wb.whtDocNumber?.toLowerCase().includes(q) ||
        wb.trackingNumber?.toLowerCase().includes(q);

      const matchesCarrier = carrierFilter === 'All' || wb.carrierName === carrierFilter;
      const matchesStatus = statusFilter === 'All' || wb.status === statusFilter;

      return matchesSearch && matchesCarrier && matchesStatus;
    });
  }, [waybills, searchTerm, carrierFilter, statusFilter]);

  // Statistics Summary
  const stats = useMemo(() => {
    const totalCount = waybills.length;
    const totalAmount = waybills.reduce((sum, w) => sum + (w.totalPrice || 0), 0);
    
    const pendingList = waybills.filter(w => w.status === 'pending_receipt');
    const pendingCount = pendingList.length;
    const pendingAmount = pendingList.reduce((sum, w) => sum + (w.totalPrice || 0), 0);

    const receivedList = waybills.filter(w => w.status === 'receipt_received');
    const receivedCount = receivedList.length;
    const receivedAmount = receivedList.reduce((sum, w) => sum + (w.totalPrice || 0), 0);

    const totalWhtAmount = waybills.reduce((sum, w) => sum + (w.whtAmount || 0), 0);

    return {
      totalCount,
      totalAmount,
      pendingCount,
      pendingAmount,
      receivedCount,
      receivedAmount,
      totalWhtAmount
    };
  }, [waybills]);

  return (
    <div id="transport-waybills-container" className="space-y-6 font-sans">
      
      {/* 🚚 TOP TITLE BAR */}
      <div className="bg-white p-5 rounded-md shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 text-white rounded-md shadow-sm">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                1. ใบขนส่ง & ใบหัก ณ ที่จ่าย (Transport Waybills)
              </h2>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold rounded-full">
                บิลคู่ค้าขนส่ง
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              จัดการรายการขนส่ง ใบเสร็จรับเงิน เล่มที่/เลขที่ หัก ณ ที่จ่าย (WHT) และติดตามสถานะ "รอใบเสร็จ"
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-sm shadow-sm transition flex items-center gap-1.5 cursor-pointer border-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ บันทึกใบขนส่งใหม่</span>
          </button>
        </div>
      </div>

      {/* 📊 SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Waybills */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold font-sans uppercase">รายการขนส่งทั้งหมด</span>
            <Truck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {stats.totalCount} <span className="text-xs font-normal text-slate-500 font-sans">รายการ</span>
          </div>
          <div className="text-xs font-bold text-indigo-700 font-mono">
            ฿{stats.totalAmount.toLocaleString()}
          </div>
        </div>

        {/* Card 2: Awaiting Receipts (รอใบเสร็จ) */}
        <div className="bg-amber-50/60 p-4 rounded-md border border-amber-200 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-amber-800">
            <span className="text-xs font-bold font-sans uppercase flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              รอใบเสร็จที่ส่งของ
            </span>
            <span className="px-2 py-0.5 bg-amber-200/70 text-amber-900 text-[10px] font-mono font-bold rounded-full">
              Pending
            </span>
          </div>
          <div className="text-xl font-black text-amber-900 font-mono">
            {stats.pendingCount} <span className="text-xs font-normal text-amber-700 font-sans">ฉบับ</span>
          </div>
          <div className="text-xs font-bold text-amber-800 font-mono">
            ยอดรวม ฿{stats.pendingAmount.toLocaleString()}
          </div>
        </div>

        {/* Card 3: Receipts Received (ได้รับใบเสร็จแล้ว) */}
        <div className="bg-emerald-50/60 p-4 rounded-md border border-emerald-200 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-emerald-800">
            <span className="text-xs font-bold font-sans uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ได้รับใบเสร็จแล้ว
            </span>
            <span className="px-2 py-0.5 bg-emerald-200/70 text-emerald-900 text-[10px] font-mono font-bold rounded-full">
              Received
            </span>
          </div>
          <div className="text-xl font-black text-emerald-900 font-mono">
            {stats.receivedCount} <span className="text-xs font-normal text-emerald-700 font-sans">ฉบับ</span>
          </div>
          <div className="text-xs font-bold text-emerald-800 font-mono">
            ยอดรวม ฿{stats.receivedAmount.toLocaleString()}
          </div>
        </div>

        {/* Card 4: Total Withholding Tax (ยอดหัก ณ ที่จ่าย) */}
        <div className="bg-blue-50/60 p-4 rounded-md border border-blue-200 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-blue-800">
            <span className="text-xs font-bold font-sans uppercase flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-blue-600" />
              ยอดรวมหัก ณ ที่จ่าย (WHT)
            </span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-blue-900 font-mono">
            ฿{stats.totalWhtAmount.toLocaleString()}
          </div>
          <div className="text-[11px] text-blue-700 font-sans">
            อัตรามาตรฐานขนส่ง 1% (ตามกฎหมายภาษี)
          </div>
        </div>
      </div>

      {/* 🔍 SEARCH & FILTER BAR */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อคู่ค้า, เลขใบขนส่ง, เล่มที่/เลขที่, เลขภาษี..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-sm text-xs focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white font-sans"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Carrier Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-sm text-xs">
            <Truck className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={carrierFilter}
              onChange={(e) => setCarrierFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">ทุกขนส่ง (All Carriers)</option>
              {carriers.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-sm text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">ทุกสถานะ (All Statuses)</option>
              <option value="pending_receipt">⏳ รอใบเสร็จที่ส่งของ (Pending)</option>
              <option value="receipt_received">✅ ได้รับใบเสร็จแล้ว (Received)</option>
              <option value="cancelled">❌ ยกเลิก (Cancelled)</option>
            </select>
          </div>

          {(searchTerm || carrierFilter !== 'All' || statusFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setCarrierFilter('All');
                setStatusFilter('All');
              }}
              className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-sm font-bold border-0 cursor-pointer"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* 📋 TRANSPORT WAYBILLS TABLE */}
      <div className="bg-white rounded-md shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <ClipboardList className="w-4 h-4 text-indigo-600" />
            <span>ตารางตารางข้อมูลใบขนส่งและใบหัก ณ ที่จ่าย ({filteredWaybills.length} รายการ)</span>
          </div>
          <span className="text-[11px] text-slate-500">
            เรียงตามวันที่จัดส่งล่าสุด
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-mono text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="py-2.5 px-3">วันที่ส่ง / เลขที่ขนส่ง</th>
                <th className="py-2.5 px-3">บริษัทขนส่ง & คู่ค้า</th>
                <th className="py-2.5 px-3">ใบเสร็จที่ส่งของ (เล่มที่/เลขที่)</th>
                <th className="py-2.5 px-3 text-right">จำนวน x ราคา</th>
                <th className="py-2.5 px-3 text-right">ยอดรวม (บาท)</th>
                <th className="py-2.5 px-3">ใบหัก ณ ที่จ่าย (WHT)</th>
                <th className="py-2.5 px-3 text-center">สถานะใบเสร็จ</th>
                <th className="py-2.5 px-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWaybills.length > 0 ? (
                filteredWaybills.map((wb) => {
                  const isPending = wb.status === 'pending_receipt';
                  const isReceived = wb.status === 'receipt_received';

                  return (
                    <tr key={wb.id} className="hover:bg-slate-50/80 transition">
                      
                      {/* Date & Waybill No */}
                      <td className="py-3 px-3 align-top space-y-0.5">
                        <div className="font-mono text-[11px] text-slate-500">{wb.deliveryDate}</div>
                        <div className="font-mono font-bold text-indigo-700">{wb.waybillNumber}</div>
                        {wb.trackingNumber && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Track: {wb.trackingNumber}
                          </div>
                        )}
                      </td>

                      {/* Carrier & Partner Name */}
                      <td className="py-3 px-3 align-top space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded-xs border border-indigo-100">
                            {wb.carrierName}
                          </span>
                        </div>
                        <div className="font-bold text-slate-900 text-xs">
                          {wb.partnerName}
                        </div>
                        {wb.notes && (
                          <p className="text-[10px] text-slate-500 line-clamp-1 italic">
                            "{wb.notes}"
                          </p>
                        )}
                      </td>

                      {/* Receipt Book No. & Receipt No. */}
                      <td className="py-3 px-3 align-top space-y-0.5 font-sans">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400 text-[10px]">เล่มที่:</span>
                          <strong className="font-mono text-slate-800">{wb.bookNumber || '-'}</strong>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400 text-[10px]">เลขที่:</span>
                          <strong className="font-mono text-indigo-800">{wb.receiptNumber || '-'}</strong>
                        </div>
                      </td>

                      {/* Quantity x Price */}
                      <td className="py-3 px-3 align-top text-right font-mono space-y-0.5">
                        <div className="text-slate-800 font-semibold">{wb.quantity} รายการ</div>
                        {wb.unitPrice ? (
                          <div className="text-[10px] text-slate-400">@ ฿{wb.unitPrice.toLocaleString()}</div>
                        ) : null}
                      </td>

                      {/* Total Price */}
                      <td className="py-3 px-3 align-top text-right font-mono font-black text-slate-900 text-sm">
                        ฿{wb.totalPrice.toLocaleString()}
                      </td>

                      {/* Withholding Tax WHT */}
                      <td className="py-3 px-3 align-top space-y-0.5">
                        {wb.whtDocNumber ? (
                          <div className="p-1.5 bg-blue-50/70 border border-blue-100 rounded-xs space-y-0.5">
                            <div className="font-mono font-bold text-[11px] text-blue-900">
                              {wb.whtDocNumber}
                            </div>
                            <div className="text-[10px] text-blue-700 flex justify-between items-center font-mono">
                              <span>หัก {wb.whtRate || 1}%:</span>
                              <strong className="font-bold">฿{(wb.whtAmount || 0).toLocaleString()}</strong>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">ไม่มีใบหัก</span>
                        )}
                      </td>

                      {/* Status & Quick Toggle */}
                      <td className="py-3 px-3 align-top text-center space-y-1.5">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                            <Clock className="w-3 h-3" />
                            รอใบเสร็จที่ส่งของ
                          </span>
                        )}
                        {isReceived && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            ได้รับใบเสร็จแล้ว
                          </span>
                        )}
                        {wb.status === 'cancelled' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <X className="w-3 h-3" />
                            ยกเลิก
                          </span>
                        )}

                        {/* Quick toggle button */}
                        <div>
                          <button
                            type="button"
                            onClick={() => handleQuickToggleStatus(wb)}
                            className={`px-2 py-0.5 rounded-xs text-[10px] font-bold transition cursor-pointer border-0 ${
                              isPending
                                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                            title="สลับสถานะใบเสร็จ"
                          >
                            {isPending ? '✓ อัปเดตเป็น ได้รับแล้ว' : '↺ เปลี่ยนเป็น รอใบเสร็จ'}
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 align-top text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => setPrintTarget(wb)}
                          className="p-1 hover:bg-slate-100 text-slate-600 rounded-xs transition cursor-pointer border-0"
                          title="พิมพ์ใบสำคัญส่งของ/หัก ณ ที่จ่าย"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(wb)}
                          className="p-1 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xs transition cursor-pointer border-0"
                          title="แก้ไขใบขนส่ง"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(wb)}
                          className="p-1 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xs transition cursor-pointer border-0"
                          title="ลบใบขนส่ง"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 space-y-2">
                    <Truck className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs">ไม่พบข้อมูลใบขนส่งตรงกับเงื่อนไขที่ค้นหา</p>
                    <button
                      type="button"
                      onClick={handleOpenAddModal}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-sm cursor-pointer border-0 inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> + เพิ่มรายการขนส่งใหม่
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📝 ADD / EDIT WAYBILL MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in no-print">
          <div className="bg-white rounded-md shadow-2xl border border-slate-200 w-full max-w-2xl p-6 space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-100 text-indigo-700 rounded-sm">
                  <Truck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase font-sans tracking-wide">
                    {editingWaybill ? 'แก้ไขข้อมูลใบขนส่ง (Edit Waybill)' : 'บันทึกใบขนส่ง & ใบหัก ณ ที่จ่ายใหม่'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-sans">
                    บันทึกรายละเอียดขนส่ง เล่มที่/เลขที่ใบเสร็จ ยอดหัก ณ ที่จ่าย และสถานะรับใบเสร็จ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer border-0 bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              
              {/* Row 1: Waybill No & Delivery Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    เลขที่ใบขนส่ง / อ้างอิงเอกสาร <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={waybillNumber}
                    onChange={(e) => setWaybillNumber(e.target.value)}
                    placeholder="WB-2026-XXXX"
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs font-mono font-bold bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    วันที่ส่งของ (Delivery Date) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs font-mono bg-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Carrier & Partner Search */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    บริษัทขนส่ง (Carrier) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white focus:outline-none focus:border-indigo-500 font-semibold"
                  >
                    {carriers.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    บิลคู่ค้าขนส่ง (Partner Name) <span className="text-rose-500">*</span>
                  </label>
                  <SearchablePartnerSelect
                    value={partnerName}
                    onChange={(val) => setPartnerName(val)}
                    partners={partners}
                    onAddNewPartner={onAddNewPartner}
                    placeholder="พิมพ์ค้นหาชื่อบริษัทคู่ค้าสั่งจ่าย..."
                    required
                  />
                </div>
              </div>

              {/* 📦 Section: Delivery Receipt Details (เล่มที่, เลขที่, จำนวน, ราคา) */}
              <div className="bg-slate-50 p-3.5 rounded-sm border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>รายละเอียดใบเสร็จรับเงินที่ส่งของ (Delivery Receipt Details)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">เล่มที่ (Book No.)</label>
                    <input
                      type="text"
                      value={bookNumber}
                      onChange={(e) => setBookNumber(e.target.value)}
                      placeholder="เช่น 001"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-sm text-xs font-mono bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">เลขที่ (Receipt No.)</label>
                    <input
                      type="text"
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value)}
                      placeholder="เช่น 045"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-sm text-xs font-mono font-bold text-indigo-900 bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">จำนวน (Quantity)</label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                      placeholder="1"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-sm text-xs font-mono bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">ราคา/ยอดรวม (บาท)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={totalPrice}
                      onChange={(e) => {
                        setIsWhtAutoCalc(true);
                        setTotalPrice(e.target.value ? Number(e.target.value) : '');
                      }}
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-sm text-xs font-mono font-black text-emerald-800 bg-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 🛡️ Section: Withholding Tax (ใบหัก ณ ที่จ่าย) */}
              <div className="bg-blue-50/50 p-3.5 rounded-sm border border-blue-100 space-y-3">
                <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                  <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-blue-600" />
                    <span>ข้อมูลใบหัก ณ ที่จ่าย (Withholding Tax - WHT)</span>
                  </div>
                  <label className="text-[10px] font-semibold text-blue-700 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isWhtAutoCalc}
                      onChange={(e) => setIsWhtAutoCalc(e.target.checked)}
                      className="rounded-xs text-blue-600"
                    />
                    <span>คำนวณยอดหักอัตโนมัติ</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      เลขที่ใบหัก ณ ที่จ่าย
                    </label>
                    <input
                      type="text"
                      value={whtDocNumber}
                      onChange={(e) => setWhtDocNumber(e.target.value)}
                      placeholder="WHT-2026-XXX"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-sm text-xs font-mono bg-white focus:outline-none focus:border-indigo-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      อัตราภาษีหัก ณ ที่จ่าย (%)
                    </label>
                    <select
                      value={whtRate}
                      onChange={(e) => {
                        const rate = Number(e.target.value);
                        setWhtRate(rate);
                        if (isWhtAutoCalc && totalPrice && typeof totalPrice === 'number') {
                          setWhtAmount(Math.round((totalPrice * (rate / 100)) * 100) / 100);
                        }
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-sm text-xs bg-white focus:outline-none focus:border-indigo-500 font-mono font-bold"
                    >
                      <option value={1}>1% (บริการค่าขนส่งทั่วไป)</option>
                      <option value={3}>3% (บริการอื่นๆ)</option>
                      <option value={5}>5% (ค่าเช่า/ค่าจ้างแรงงาน)</option>
                      <option value={0}>0% (ไม่มีหัก ณ ที่จ่าย)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      จำนวนเงินที่หัก (บาท)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={whtAmount}
                      onChange={(e) => {
                        setIsWhtAutoCalc(false);
                        setWhtAmount(e.target.value ? Number(e.target.value) : '');
                      }}
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-sm text-xs font-mono font-bold text-blue-900 bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Status Radio & Tracking */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    สถานะใบเสร็จ (Receipt Status) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <label className={`flex-1 p-2 rounded-sm border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                      status === 'pending_receipt'
                        ? 'bg-amber-50 border-amber-300 text-amber-900 ring-1 ring-amber-400'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}>
                      <input
                        type="radio"
                        name="status"
                        checked={status === 'pending_receipt'}
                        onChange={() => setStatus('pending_receipt')}
                        className="hidden"
                      />
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>รอใบเสร็จที่ส่งของ</span>
                    </label>

                    <label className={`flex-1 p-2 rounded-sm border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                      status === 'receipt_received'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 ring-1 ring-emerald-400'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}>
                      <input
                        type="radio"
                        name="status"
                        checked={status === 'receipt_received'}
                        onChange={() => setStatus('receipt_received')}
                        className="hidden"
                      />
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ได้รับใบเสร็จแล้ว</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    เลขพัสดุ / หมายเลข Tracking
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="เช่น KEX982301923TH"
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs font-mono bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  หมายเหตุเพิ่มเติม (Notes)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ระบุหมายเหตุการจัดส่ง สาขา หรือรายละเอียดเพิ่มเติม..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-sm cursor-pointer border-0"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-sm cursor-pointer shadow-xs border-0 flex items-center gap-1.5"
                >
                  <Truck className="w-4 h-4" />
                  <span>{editingWaybill ? 'บันทึกการแก้ไข' : 'บันทึกใบขนส่ง'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ⚠️ DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-fade-in no-print">
          <div className="bg-white rounded-md shadow-2xl border border-rose-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-full shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-rose-900">
                  ยืนยันการลบรายการใบขนส่ง?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  คุณต้องการลบรายการใบขนส่งเลขที่ <strong className="text-rose-700 font-bold font-mono">"{deleteTarget.waybillNumber}"</strong> (คู่ค้า: {deleteTarget.partnerName}) ใช่หรือไม่?
                </p>
              </div>
            </div>

            <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-sm cursor-pointer border-0"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteWaybill(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-sm cursor-pointer shadow-xs border-0 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>ยืนยันลบรายการ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🖨️ PRINT SLIP / RECEIPT PREVIEW MODAL */}
      {printTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in font-sans">
          <div className="bg-white rounded-md shadow-2xl border border-slate-300 w-full max-w-xl p-8 space-y-6 my-8 print:p-0 print:border-0 print:shadow-none">
            
            {/* Printable Area */}
            <div className="border border-slate-800 p-6 space-y-5 rounded-xs">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    ใบสำคัญขนส่ง & ใบหัก ณ ที่จ่าย
                  </h1>
                  <p className="text-[11px] text-slate-600 font-mono">TRANSPORT WAYBILL & WITHHOLDING TAX SLIP</p>
                </div>
                <div className="text-right font-mono text-xs">
                  <div className="font-bold text-indigo-900">เลขที่: {printTarget.waybillNumber}</div>
                  <div className="text-slate-500">วันที่: {printTarget.deliveryDate}</div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">ผู้ว่าจ้าง / คู่ค้าสั่งจ่าย:</span>
                  <div className="font-bold text-slate-900">{printTarget.partnerName}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">บริษัทขนส่ง (Carrier):</span>
                  <div className="font-bold text-indigo-800">{printTarget.carrierName}</div>
                </div>
              </div>

              {/* Receipt & Items Box */}
              <div className="border border-slate-200 rounded-xs p-3 space-y-2 bg-slate-50/50">
                <div className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-1">
                  รายละเอียดใบเสร็จรับเงินที่ส่งของ
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block">เล่มที่</span>
                    <strong>{printTarget.bookNumber || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">เลขที่</span>
                    <strong>{printTarget.receiptNumber || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">จำนวน</span>
                    <strong>{printTarget.quantity} รายการ</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">ราคารวม</span>
                    <strong className="text-slate-900">฿{printTarget.totalPrice.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Withholding Tax Info */}
              {printTarget.whtDocNumber && (
                <div className="border border-blue-200 bg-blue-50/30 rounded-xs p-3 space-y-1 text-xs">
                  <div className="font-bold text-blue-900 flex justify-between">
                    <span>ใบหัก ณ ที่จ่าย เลขที่: {printTarget.whtDocNumber}</span>
                    <span>อัตราภาษี: {printTarget.whtRate || 1}%</span>
                  </div>
                  <div className="flex justify-between text-blue-800 font-mono font-bold">
                    <span>จำนวนเงินที่หัก ณ ที่จ่าย:</span>
                    <span>฿{(printTarget.whtAmount || 0).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-3">
                <span className="text-slate-500">สถานะใบเสร็จ:</span>
                <span className="font-bold uppercase font-mono">
                  {printTarget.status === 'receipt_received' ? '✅ ได้รับใบเสร็จแล้ว' : '⏳ รอใบเสร็จที่ส่งของ'}
                </span>
              </div>
            </div>

            {/* Modal Buttons (Hidden when printing) */}
            <div className="flex justify-end gap-2 no-print">
              <button
                type="button"
                onClick={() => setPrintTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-sm border-0 cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-sm border-0 cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>สั่งพิมพ์เอกสาร</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
