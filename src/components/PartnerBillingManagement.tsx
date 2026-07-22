import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { safeStorage } from '../lib/safeStorage';
import { PartnerBilling, PartnerCompany } from '../types';
import { 
  FileText, Plus, Search, Filter, Edit3, Trash2, 
  CheckCircle, AlertCircle, X, HelpCircle, Phone, 
  User, DollarSign, Calendar, RefreshCw, Eye, ClipboardList,
  Building2, Mail, MapPin, PlusCircle, Check, ChevronRight,
  TrendingUp, Activity, Sparkles, Layers, Award, ShieldCheck,
  ArrowRight, ChevronDown, Workflow, Users, Percent, BarChart3, Coins,
  Volume2, VolumeX, Truck
} from 'lucide-react';

interface PartnerBillingManagementProps {
  billings: PartnerBilling[];
  onAddBilling: (newBilling: PartnerBilling) => void;
  onUpdateBilling: (updatedBilling: PartnerBilling) => void;
  onDeleteBilling: (id: string) => void;
  partners: PartnerCompany[];
  onAddPartner: (newPartner: PartnerCompany) => void;
  onUpdatePartner: (updatedPartner: PartnerCompany) => void;
  onDeletePartner: (id: string) => void;
  carriers?: string[];
  onUpdateCarriers?: (updatedCarriers: string[]) => void;
}

export default function PartnerBillingManagement({
  billings,
  onAddBilling,
  onUpdateBilling,
  onDeleteBilling,
  partners = [],
  onAddPartner,
  onUpdatePartner,
  onDeletePartner,
  carriers: propsCarriers,
  onUpdateCarriers
}: PartnerBillingManagementProps) {
  // Navigation / Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'documents' | 'partners'>('dashboard');
  const [dashboardLeftTab, setDashboardLeftTab] = useState<'partners' | 'recent_10'>('recent_10');
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');
  const [selectedPartnerDashboard, setSelectedPartnerDashboard] = useState<string>('All');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

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

  // Date Filters State (Day, Month, Year)
  const [filterDay, setFilterDay] = useState<string>('All');
  const [filterMonth, setFilterMonth] = useState<string>('All');
  const [filterYear, setFilterYear] = useState<string>('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentPartnerPage, setCurrentPartnerPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Reset partner page to 1 when search query changes
  useEffect(() => {
    setCurrentPartnerPage(1);
  }, [partnerSearchQuery]);

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
    // Interval check as fallback since local changes on same window don't trigger storage event
    const interval = setInterval(handleStorageChange, 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Filter bills that are billed but unpaid (status === 'billed')
  const unPaidBilledBillings = useMemo(() => {
    return billings.filter(b => b.status === 'billed');
  }, [billings]);

  // Sound triggers on notifications alert state
  useEffect(() => {
    if (isNotificationOpen && unPaidBilledBillings.length > 0) {
      playNotificationSound();
    }
  }, [isNotificationOpen, unPaidBilledBillings.length, playNotificationSound]);

  const handleMarkAsPaid = (item: PartnerBilling) => {
    playNotificationSound();
    const updatedRecord: PartnerBilling = {
      ...item,
      status: 'paid'
    };
    onUpdateBilling(updatedRecord);
    showSuccess(`บันทึกชำระเงินเรียบร้อยสำหรับเอกสารเลขที่ ${item.docNumber}`);
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => {
      setErrorMessage(null);
    }, 4000);
  };

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBilling, setEditingBilling] = useState<PartnerBilling | null>(null);
  const [billingToDelete, setBillingToDelete] = useState<PartnerBilling | null>(null);
  const [viewingDetails, setViewingDetails] = useState<PartnerBilling | null>(null);

  // Partner Modals
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerCompany | null>(null);
  const [partnerToDelete, setPartnerToDelete] = useState<PartnerCompany | null>(null);

  // Partner Form States
  const [pName, setPName] = useState('');
  const [pTaxId, setPTaxId] = useState('');
  const [pAddress, setPAddress] = useState('');
  const [pContactPerson, setPContactPerson] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [pNotes, setPNotes] = useState('');

  // Form States (for Add / Edit)
  const [partnerName, setPartnerName] = useState('');
  const [docType, setDocType] = useState<string>('delivery');
  const [docNumber, setDocNumber] = useState('');

  // Custom Document Types list (เพื่อความยืดหยุ่นในการเพิ่มเอกสารคู่ค้าและลบประเภทเอกสาร)
  const [docTypes, setDocTypes] = useState<{ key: string; label: string }[]>(() => {
    try {
      const saved = safeStorage.getItem('hr_doc_types_list');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { key: 'delivery', label: 'ใบส่งของ (Delivery Order)' },
      { key: 'billing', label: 'ใบวางบิล (Billing Statement)' },
      { key: 'invoice_receipt', label: 'ใบเสร็จรับเงิน/ใบกำกับภาษี (Receipt)' },
      { key: 'partner_doc', label: 'เอกสารคู่ค้า (Partner Document)' }
    ];
  });
  const [newDocTypeLabel, setNewDocTypeLabel] = useState('');
  const [isAddingNewDocType, setIsAddingNewDocType] = useState(false);
  const [amount, setAmount] = useState<number | ''>(0);
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'pending' | 'billed' | 'paid' | 'cancelled'>('pending');
  const [notes, setNotes] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');

  // Form States for custom added fields
  const [deliveryDocNumber, setDeliveryDocNumber] = useState('');
  const [billingDocNumber, setBillingDocNumber] = useState('');
  const [cnDocNumber, setCnDocNumber] = useState('');
  const [cnAmount, setCnAmount] = useState<number | ''>('');
  const [bookNumber, setBookNumber] = useState('');
  const [pageNumber, setPageNumber] = useState('');
  const [billingBookNumber, setBillingBookNumber] = useState('');
  const [billingPageNumber, setBillingPageNumber] = useState('');
  const [billingAmount, setBillingAmount] = useState<number | ''>('');
  const [transportCarrier, setTransportCarrier] = useState('');
  
  // Custom Carrier selection list & management states
  const [carriers, setCarriers] = useState<string[]>(() => {
    if (propsCarriers && propsCarriers.length > 0) return propsCarriers;
    try {
      const saved = safeStorage.getItem('hr_carriers_list');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['Kerry Express', 'Flash Express', 'J&T Express', 'ไปรษณีย์ไทย (EMS)', 'รถขนส่งบริษัท', 'ขนส่งเอกชนทั่วไป'];
  });

  useEffect(() => {
    if (propsCarriers && propsCarriers.length > 0) {
      setCarriers(propsCarriers);
    }
  }, [propsCarriers]);

  const [newCarrierInput, setNewCarrierInput] = useState('');
  const [isAddingNewCarrier, setIsAddingNewCarrier] = useState(false);
  const [isCarrierManagerOpen, setIsCarrierManagerOpen] = useState(false);
  const [carrierSearchQuery, setCarrierSearchQuery] = useState('');
  const [editingCarrierIndex, setEditingCarrierIndex] = useState<number | null>(null);
  const [editingCarrierValue, setEditingCarrierValue] = useState('');
  const [carrierToDelete, setCarrierToDelete] = useState<string | null>(null);

  // Helper to sync carriers to storage & database
  const saveCarriersList = useCallback((updatedList: string[]) => {
    setCarriers(updatedList);
    safeStorage.setItem('hr_carriers_list', JSON.stringify(updatedList));
    if (onUpdateCarriers) {
      onUpdateCarriers(updatedList);
    }
  }, [onUpdateCarriers]);

  // Handle Add New Carrier
  const handleAddNewCarrier = (carrierNameToAdd?: string) => {
    const targetName = (carrierNameToAdd || newCarrierInput).trim();
    if (!targetName) {
      showError("กรุณาระบุชื่อบริษัทขนส่ง");
      return;
    }
    if (carriers.some(c => c.toLowerCase() === targetName.toLowerCase())) {
      showError(`บริษัทขนส่ง "${targetName}" มีในระบบแล้ว`);
      return;
    }
    const updated = [...carriers, targetName];
    saveCarriersList(updated);
    setNewCarrierInput('');
    setIsAddingNewCarrier(false);
    setTransportCarrier(targetName);
    showSuccess(`เพิ่มบริษัทขนส่ง "${targetName}" ลงระบบเรียบร้อยแล้ว`);
    playNotificationSound();
  };

  // Handle Save Edit Carrier
  const handleSaveEditCarrier = (index: number) => {
    const trimmed = editingCarrierValue.trim();
    const oldName = carriers[index];
    if (!trimmed) {
      showError("กรุณาระบุชื่อบริษัทขนส่ง");
      return;
    }
    if (trimmed !== oldName && carriers.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      showError(`บริษัทขนส่ง "${trimmed}" มีในระบบแล้ว`);
      return;
    }
    const updated = [...carriers];
    updated[index] = trimmed;
    saveCarriersList(updated);

    // Update existing document records if needed
    if (oldName !== trimmed) {
      billings.forEach(item => {
        if (item.transportCarrier === oldName) {
          onUpdateBilling({ ...item, transportCarrier: trimmed });
        }
      });
      if (transportCarrier === oldName) {
        setTransportCarrier(trimmed);
      }
    }

    setEditingCarrierIndex(null);
    setEditingCarrierValue('');
    showSuccess(`แก้ไขชื่อบริษัทขนส่งเป็น "${trimmed}" เรียบร้อยแล้ว`);
    playNotificationSound();
  };

  // Handle Confirm Delete Carrier
  const handleConfirmDeleteCarrier = () => {
    if (!carrierToDelete) return;
    const target = carrierToDelete;
    const updated = carriers.filter(c => c !== target);
    saveCarriersList(updated);
    if (transportCarrier === target) {
      setTransportCarrier('');
    }
    setCarrierToDelete(null);
    showSuccess(`ลบบริษัทขนส่ง "${target}" ออกจากฐานข้อมูลเรียบร้อยแล้ว`);
    playNotificationSound();
  };

  // Dynamic list of years present in the documents
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    billings.forEach(item => {
      const parts = (item.issueDate || '').split('-');
      if (parts[0] && parts[0].length === 4) {
        years.add(parts[0]);
      }
    });
    if (years.size === 0) {
      years.add(new Date().getFullYear().toString());
    }
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [billings]);

  // Search and Filter logic
  const filteredBillings = useMemo(() => {
    return billings.filter(item => {
      const matchesSearch = 
        item.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.docNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.contactPerson && item.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = docTypeFilter === 'All' || item.docType === docTypeFilter;
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

      // Extract day, month, year from issueDate (format: YYYY-MM-DD)
      const dateParts = (item.issueDate || '').split('-');
      const itemYear = dateParts[0] || '';
      const itemMonth = dateParts[1] || '';
      const itemDay = dateParts[2] || '';

      const matchesYear = filterYear === 'All' || itemYear === filterYear;
      const matchesMonth = filterMonth === 'All' || itemMonth === filterMonth;
      const matchesDay = filterDay === 'All' || itemDay === filterDay;

      return matchesSearch && matchesType && matchesStatus && matchesYear && matchesMonth && matchesDay;
    });
  }, [billings, searchQuery, docTypeFilter, statusFilter, filterYear, filterMonth, filterDay]);

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, docTypeFilter, statusFilter, filterYear, filterMonth, filterDay]);

  const totalItems = filteredBillings.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBillings = useMemo(() => {
    return filteredBillings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBillings, startIndex]);

  // Calculations for Summary Dashboard Cards
  const stats = useMemo(() => {
    let totalDeliveryAmount = 0;
    let deliveryCount = 0;
    let totalBilledAmount = 0;
    let billedCount = 0;
    let totalPaidAmount = 0;
    let paidCount = 0;
    let totalPendingAmount = 0;
    let pendingCount = 0;

    billings.forEach(item => {
      if (item.status === 'cancelled') return;

      if (item.docType === 'delivery') {
        totalDeliveryAmount += item.amount;
        deliveryCount++;
      } else if (item.docType === 'billing') {
        totalBilledAmount += item.amount;
        billedCount++;
      }

      if (item.status === 'paid') {
        totalPaidAmount += item.amount;
        paidCount++;
      } else if (item.status === 'pending') {
        totalPendingAmount += item.amount;
        pendingCount++;
      } else if (item.status === 'billed') {
        totalPendingAmount += item.amount; // Billed is also outstanding/pending payment
        pendingCount++;
      }
    });

    return {
      deliveryCount,
      totalDeliveryAmount,
      billedCount,
      totalBilledAmount,
      paidCount,
      totalPaidAmount,
      pendingCount,
      totalPendingAmount
    };
  }, [billings]);

  // Calculations for Endlessloop Dashboard filtered by selectedPartnerDashboard
  const dashboardStats = useMemo(() => {
    let totalDeliveryAmount = 0;
    let deliveryCount = 0;
    let totalBilledAmount = 0;
    let billedCount = 0;
    let totalPaidAmount = 0;
    let paidCount = 0;
    let totalPendingAmount = 0;
    let pendingCount = 0;

    billings.forEach(item => {
      if (selectedPartnerDashboard !== 'All' && item.partnerName !== selectedPartnerDashboard) return;
      if (item.status === 'cancelled') return;

      if (item.docType === 'delivery') {
        totalDeliveryAmount += item.amount;
        deliveryCount++;
      } else if (item.docType === 'billing') {
        totalBilledAmount += item.amount;
        billedCount++;
      }

      if (item.status === 'paid') {
        totalPaidAmount += item.amount;
        paidCount++;
      } else if (item.status === 'pending') {
        totalPendingAmount += item.amount;
        pendingCount++;
      } else if (item.status === 'billed') {
        totalPendingAmount += item.amount; // Billed is also outstanding/pending payment
        pendingCount++;
      }
    });

    return {
      deliveryCount,
      totalDeliveryAmount,
      billedCount,
      totalBilledAmount,
      paidCount,
      totalPaidAmount,
      pendingCount,
      totalPendingAmount
    };
  }, [billings, selectedPartnerDashboard]);

  const unpaidBilledItems = useMemo(() => {
    return billings.filter(item => item.status === 'billed');
  }, [billings]);

  // Format YYYY-MM to Thai month name and year (BE)
  const formatThaiMonthYear = useCallback((yearStr: string, monthStr: string) => {
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const mIndex = parseInt(monthStr, 10) - 1;
    const thaiMonth = (mIndex >= 0 && mIndex < 12) ? months[mIndex] : monthStr;
    const thaiYear = parseInt(yearStr, 10) + 543;
    return `${thaiMonth} ${thaiYear}`;
  }, []);

  // Get latest 10 transactions in the latest month present, sorted by newest on top
  const latestMonthBillings = useMemo(() => {
    let targetYear = new Date().getFullYear().toString();
    let targetMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    
    let latestDateStr = '';
    billings.forEach(b => {
      if (b.issueDate && b.issueDate > latestDateStr) {
        latestDateStr = b.issueDate;
      }
    });
    
    if (latestDateStr) {
      const parts = latestDateStr.split('-');
      targetYear = parts[0];
      targetMonth = parts[1];
    }
    
    const filtered = billings.filter(b => {
      if (!b.issueDate) return false;
      const parts = b.issueDate.split('-');
      return parts[0] === targetYear && parts[1] === targetMonth;
    });
    
    const sorted = [...filtered].sort((a, b) => {
      const dateA = a.issueDate || '';
      const dateB = b.issueDate || '';
      if (dateB !== dateA) {
        return dateB.localeCompare(dateA);
      }
      return b.id.localeCompare(a.id);
    });
    
    return {
      items: sorted.slice(0, 10),
      year: targetYear,
      month: targetMonth
    };
  }, [billings]);

  const filteredPartners = useMemo(() => {
    return partners.filter(p => {
      const q = partnerSearchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.contactPerson && p.contactPerson.toLowerCase().includes(q)) ||
        (p.phone && p.phone.toLowerCase().includes(q)) ||
        (p.taxId && p.taxId.toLowerCase().includes(q)) ||
        (p.address && p.address.toLowerCase().includes(q))
      );
    });
  }, [partners, partnerSearchQuery]);

  const paginatedPartners = useMemo(() => {
    const startIndex = (currentPartnerPage - 1) * itemsPerPage;
    return filteredPartners.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPartners, currentPartnerPage, itemsPerPage]);

  const totalPartnerPages = Math.ceil(filteredPartners.length / itemsPerPage);

  // Open Add Modal
  const handleOpenAdd = () => {
    setPartnerName('');
    setDocType('delivery');
    setDocNumber('');
    setDeliveryDocNumber('');
    setBillingDocNumber('');
    setCnDocNumber('');
    setCnAmount('');
    setBookNumber('');
    setPageNumber('');
    setTransportCarrier('');
    setAmount(0);
    setIssueDate(new Date().toISOString().split('T')[0]);
    // Default due date to 30 days from now
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    setDueDate(futureDate.toISOString().split('T')[0]);
    setStatus('pending');
    setNotes('');
    setContactPerson('');
    setPhone('');
    setIsAddOpen(true);
  };

  // Open Add Partner Modal
  const handleOpenAddPartner = () => {
    setPName('');
    setPTaxId('');
    setPAddress('');
    setPContactPerson('');
    setPPhone('');
    setPEmail('');
    setPNotes('');
    setIsAddPartnerOpen(true);
  };

  // Open Edit Partner Modal
  const handleOpenEditPartner = (item: PartnerCompany) => {
    setEditingPartner(item);
    setPName(item.name);
    setPTaxId(item.taxId || '');
    setPAddress(item.address || '');
    setPContactPerson(item.contactPerson || '');
    setPPhone(item.phone || '');
    setPEmail(item.email || '');
    setPNotes(item.notes || '');
  };

  // Submit Add Partner
  const handleAddPartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!pName.trim()) {
        showError("กรุณาระบุชื่อบริษัทคู่ค้า");
        return;
      }

      const newPartner: PartnerCompany = {
        id: `PTN-${Date.now().toString().slice(-4)}`,
        name: pName.trim(),
        taxId: pTaxId.trim() || undefined,
        address: pAddress.trim() || undefined,
        contactPerson: pContactPerson.trim() || undefined,
        phone: pPhone.trim() || undefined,
        email: pEmail.trim() || undefined,
        notes: pNotes.trim() || undefined,
      };

      onAddPartner(newPartner);
      setPartnerName(pName.trim());
      if (pContactPerson.trim()) {
        setContactPerson(pContactPerson.trim());
      }
      if (pPhone.trim()) {
        setPhone(pPhone.trim());
      }
      setIsAddPartnerOpen(false);
      showSuccess(`ลงทะเบียนและเลือกคู่ค้า "${pName.trim()}" ในใบวางบิลสำเร็จ`);
    } catch (err: any) {
      showError(err?.message || "บันทึกข้อมูลคู่ค้าไม่สำเร็จ");
    }
  };

  // Submit Edit Partner
  const handleEditPartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!editingPartner) {
        showError("ไม่พบคู่ค้าที่ต้องการแก้ไข");
        return;
      }
      if (!pName.trim()) {
        showError("กรุณาระบุชื่อบริษัทคู่ค้า");
        return;
      }

      const updatedPartner: PartnerCompany = {
        id: editingPartner.id,
        name: pName.trim(),
        taxId: pTaxId.trim() || undefined,
        address: pAddress.trim() || undefined,
        contactPerson: pContactPerson.trim() || undefined,
        phone: pPhone.trim() || undefined,
        email: pEmail.trim() || undefined,
        notes: pNotes.trim() || undefined,
      };

      onUpdatePartner(updatedPartner);
      setEditingPartner(null);
      showSuccess(`แก้ไขข้อมูลคู่ค้า "${pName.trim()}" สำเร็จ`);
    } catch (err: any) {
      showError(err?.message || "แก้ไขข้อมูลคู่ค้าไม่สำเร็จ");
    }
  };

  // Delete Partner Confirm
  const handleDeletePartnerConfirm = () => {
    if (!partnerToDelete) return;
    onDeletePartner(partnerToDelete.id);
    setPartnerToDelete(null);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: PartnerBilling) => {
    setEditingBilling(item);
    setPartnerName(item.partnerName);
    setDocType(item.docType);
    setDocNumber(item.docNumber);
    setDeliveryDocNumber(item.deliveryDocNumber || '');
    setBillingDocNumber(item.billingDocNumber || '');
    setCnDocNumber(item.cnDocNumber || '');
    setCnAmount(item.cnAmount !== undefined ? item.cnAmount : '');
    setBookNumber(item.bookNumber || '');
    setPageNumber(item.pageNumber || '');
    setBillingBookNumber(item.billingBookNumber || '');
    setBillingPageNumber(item.billingPageNumber || '');
    setBillingAmount(item.billingAmount !== undefined ? item.billingAmount : '');
    setTransportCarrier(item.transportCarrier || '');
    setAmount(item.amount);
    setIssueDate(item.issueDate);
    setDueDate(item.dueDate);
    setStatus(item.status);
    setNotes(item.notes || '');
    setContactPerson(item.contactPerson || '');
    setPhone(item.phone || '');
  };

  // Submit Add
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resolvedAmount = amount || (billingAmount !== '' ? Number(billingAmount) : 0);
      
      if (!partnerName.trim()) {
        showError("กรุณาเลือกหรือระบุชื่อบริษัทคู่ค้า");
        return;
      }

      if (resolvedAmount <= 0) {
        showError("กรุณากรอกจำนวนเงินให้ถูกต้อง (ต้องเป็นตัวเลขที่มากกว่า 0)");
        return;
      }

      const finalDocNumber = docNumber.trim() || deliveryDocNumber.trim() || billingDocNumber.trim() || `DOC-${Date.now().toString().slice(-4)}`;
      const resolvedDocType = billingDocNumber.trim() ? 'billing' : (deliveryDocNumber.trim() ? 'delivery' : 'delivery');

      const newRecord: PartnerBilling = {
        id: `BILL-${Date.now().toString().slice(-4)}`,
        partnerName: partnerName.trim(),
        docType: resolvedDocType,
        docNumber: finalDocNumber,
        deliveryDocNumber: deliveryDocNumber.trim() || undefined,
        billingDocNumber: billingDocNumber.trim() || undefined,
        cnDocNumber: cnDocNumber.trim() || undefined,
        cnAmount: cnAmount !== '' ? Number(cnAmount) : undefined,
        bookNumber: bookNumber.trim() || undefined,
        pageNumber: pageNumber.trim() || undefined,
        billingBookNumber: billingBookNumber.trim() || undefined,
        billingPageNumber: billingPageNumber.trim() || undefined,
        transportCarrier: transportCarrier.trim() || undefined,
        amount: resolvedAmount,
        billingAmount: billingAmount !== '' ? Number(billingAmount) : undefined,
        issueDate,
        dueDate,
        status,
        notes: notes.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim() || undefined
      };

      onAddBilling(newRecord);
      setIsAddOpen(false);
      showSuccess(`บันทึกเอกสารเลขที่ ${finalDocNumber} สำเร็จ`);
    } catch (err: any) {
      showError(err?.message || "บันทึกข้อมูลเอกสารไม่สำเร็จ");
    }
  };

  // Submit Edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!editingBilling) {
        showError("ไม่พบเอกสารที่ต้องการแก้ไข");
        return;
      }

      const resolvedAmount = amount || (billingAmount !== '' ? Number(billingAmount) : 0);
      
      if (!partnerName.trim()) {
        showError("กรุณาเลือกหรือระบุชื่อบริษัทคู่ค้า");
        return;
      }

      if (resolvedAmount <= 0) {
        showError("กรุณากรอกจำนวนเงินให้ถูกต้อง (ต้องเป็นตัวเลขที่มากกว่า 0)");
        return;
      }

      const finalDocNumber = docNumber.trim() || deliveryDocNumber.trim() || billingDocNumber.trim() || editingBilling.docNumber;
      const resolvedDocType = billingDocNumber.trim() ? 'billing' : (deliveryDocNumber.trim() ? 'delivery' : 'delivery');

      const updatedRecord: PartnerBilling = {
        ...editingBilling,
        partnerName: partnerName.trim(),
        docType: resolvedDocType,
        docNumber: finalDocNumber,
        deliveryDocNumber: deliveryDocNumber.trim() || undefined,
        billingDocNumber: billingDocNumber.trim() || undefined,
        cnDocNumber: cnDocNumber.trim() || undefined,
        cnAmount: cnAmount !== '' ? Number(cnAmount) : undefined,
        bookNumber: bookNumber.trim() || undefined,
        pageNumber: pageNumber.trim() || undefined,
        billingBookNumber: billingBookNumber.trim() || undefined,
        billingPageNumber: billingPageNumber.trim() || undefined,
        transportCarrier: transportCarrier.trim() || undefined,
        amount: resolvedAmount,
        billingAmount: billingAmount !== '' ? Number(billingAmount) : undefined,
        issueDate,
        dueDate,
        status,
        notes: notes.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim() || undefined
      };

      onUpdateBilling(updatedRecord);
      setEditingBilling(null);
      showSuccess(`แก้ไขเอกสารเลขที่ ${finalDocNumber} สำเร็จ`);
    } catch (err: any) {
      showError(err?.message || "แก้ไขข้อมูลเอกสารไม่สำเร็จ");
    }
  };

  // Reset filter values
  const handleResetFilters = () => {
    setSearchQuery('');
    setDocTypeFilter('All');
    setStatusFilter('All');
    setFilterDay('All');
    setFilterMonth('All');
    setFilterYear('All');
  };

  // Thai document labels
  const getDocTypeLabel = (type: string) => {
    const matched = docTypes.find(d => d.key === type);
    if (matched) {
      // Return the label, stripping out any English suffix like " (Delivery Order)"
      return matched.label.split(' (')[0];
    }
    switch (type) {
      case 'delivery': return 'ใบส่งของ';
      case 'billing': return 'ใบวางบิล';
      case 'invoice_receipt': return 'ใบเสร็จ/ใบกำกับภาษี';
      case 'partner_doc': return 'เอกสารคู่ค้า';
      default: return type;
    }
  };

  const getDocTypeBadge = (type: string) => {
    const matched = docTypes.find(d => d.key === type);
    const label = matched ? matched.label.split(' (')[0] : type;
    
    let emoji = '📁';
    let colorClass = 'bg-slate-50 text-slate-700 border-slate-200';
    
    if (type === 'delivery') {
      emoji = '📦';
      colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (type === 'billing') {
      emoji = '📝';
      colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    } else if (type === 'invoice_receipt') {
      emoji = '🧾';
      colorClass = 'bg-teal-50 text-teal-700 border-teal-200';
    } else if (type === 'partner_doc') {
      emoji = '🤝';
      colorClass = 'bg-purple-50 text-purple-700 border-purple-200';
    } else {
      // Custom type styling
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
    }
    
    return (
      <span className={`px-2 py-0.5 border text-[11px] font-semibold rounded-sm inline-flex items-center gap-1 ${colorClass}`}>
        {emoji} {label}
      </span>
    );
  };

  // Thai status labels
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'รอดำเนินการ / รอวางบิล';
      case 'billed': return 'วางบิลแล้ว / รอชำระเงิน';
      case 'paid': return 'ชำระเงินเสร็จสิ้น';
      case 'cancelled': return 'ยกเลิกเอกสาร';
      default: return status;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold rounded-sm inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> รอวางบิล
          </span>
        );
      case 'billed':
        return (
          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold rounded-sm inline-flex items-center gap-1 animate-pulse">
            <AlertCircle className="w-3 h-3 text-rose-500" /> วางบิลแล้ว/รอชำระ
          </span>
        );
      case 'paid':
        return (
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold rounded-sm inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> ชำระเงินแล้ว
          </span>
        );
       case 'cancelled':
        return (
          <span className="px-2 py-0.5 bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-semibold rounded-sm inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span> ยกเลิกแล้ว
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Floating Success Toast */}
      {successMessage && (
        <div id="partner-success-toast" className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-sm shadow-xl flex items-center gap-2 border border-emerald-500 animate-bounce no-print">
          <CheckCircle className="w-4 h-4 text-white" />
          <span className="text-xs font-bold font-sans">{successMessage}</span>
        </div>
      )}

      {/* Floating Error Toast */}
      {errorMessage && (
        <div id="partner-error-toast" className="fixed bottom-5 right-5 z-50 bg-rose-600 text-white px-4 py-3 rounded-sm shadow-xl flex items-center gap-2 border border-rose-500 animate-bounce no-print">
          <AlertCircle className="w-4 h-4 text-white" />
          <span className="text-xs font-bold font-sans">{errorMessage}</span>
        </div>
      )}
      
      {/* ─── PERSISTENT TOP HEADER (REAL-TIME FILTERABLE) ─── */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-xs p-4 flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-sm">
            <Building2 className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-lg font-black text-slate-900 tracking-tight font-sans block">
              Partner<span className="text-blue-600">Hub</span>
            </span>
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Campaign & Billing Management
            </span>
          </div>
        </div>

        {/* Real-time Partner Filter Dropdown */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-full px-4 py-1.5 shadow-xs transition-colors">
          <Building2 className="w-3.5 h-3.5 text-violet-500" />
          <span className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wider">Partner:</span>
          <select
            value={selectedPartnerDashboard}
            onChange={(e) => {
              setSelectedPartnerDashboard(e.target.value);
              showSuccess(`อัพเดตตัวกรองสำหรับ: ${e.target.value === 'All' ? 'ทุกคู่ค้าในระบบ' : e.target.value}`);
            }}
            className="bg-transparent text-xs font-extrabold text-slate-800 focus:outline-none cursor-pointer pr-1 border-none focus:ring-0 py-0"
          >
            <option value="All">บริษัทคู่ค้าทั้งหมด (All Companies)</option>
            {partners.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* User Identity Info */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-slate-800 font-sans tracking-tight">JASON WOOD</p>
            <p className="text-[9px] font-mono font-bold text-violet-600 uppercase tracking-widest">Financial Director</p>
          </div>
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" 
              alt="Jason Wood" 
              className="w-10 h-10 rounded-full ring-2 ring-violet-500 ring-offset-2 object-cover shadow-xs"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse"></span>
          </div>
        </div>
      </div>

      {/* ─── PERSISTENT SUB-TAB TOOLBAR (BOARD, REPORT) ─── */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-xs p-3 flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        {/* Left Side: Project/Category select + Active Subtabs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Tab row */}
          <div className="flex items-center gap-1.5 p-0.5 bg-slate-50 border border-slate-100 rounded-sm w-full sm:w-auto">
            {/* DASHBOARD TAB (Dashboard) */}
            <button
              onClick={() => setActiveSubTab('dashboard')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 ${
                activeSubTab === 'dashboard'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${activeSubTab === 'dashboard' ? 'text-blue-600 animate-spin-slow' : 'text-slate-400'}`} />
              <span>สรุปยอดคู่ค้า (Dashboard)</span>
            </button>

            {/* BOARD TAB (Billing Documents List) */}
            <button
              onClick={() => setActiveSubTab('documents')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 ${
                activeSubTab === 'documents'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>Board (ใบส่งของ/วางบิล)</span>
              <span className="ml-1 px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[9px] font-mono font-bold">
                {billings.length}
              </span>
            </button>

            {/* REPORT TAB (Partner Directory) */}
            <button
              onClick={() => setActiveSubTab('partners')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 ${
                activeSubTab === 'partners'
                  ? 'bg-white text-emerald-600 shadow-xs border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Report (ทำเนียบคู่ค้า)</span>
              <span className="ml-1 px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[9px] font-mono font-bold">
                {partners.length}
              </span>
            </button>

            {/* NOTIFICATION TAB (แจ้งเตือนวางบิลค้างชำระ) */}
            <button
              type="button"
              onClick={() => setIsNotificationOpen(true)}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 relative cursor-pointer ${
                unPaidBilledBillings.length > 0
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100/60 font-black'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
              }`}
            >
              <span className="relative inline-block">
                <AlertCircle className={`w-3.5 h-3.5 ${unPaidBilledBillings.length > 0 ? 'animate-bounce text-rose-600' : 'text-slate-400'}`} />
                {unPaidBilledBillings.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                  </span>
                )}
              </span>
              <span>แจ้งเตือนค้างจ่าย ({unPaidBilledBillings.length})</span>
            </button>
          </div>
        </div>

        {/* Right Side: Quick Action + Config Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Carrier Manager Button */}
          <button
            type="button"
            onClick={() => {
              setIsCarrierManagerOpen(true);
              playNotificationSound();
            }}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 shadow-xs cursor-pointer border-0"
            title="จัดการรายชื่อบริษัทขนส่งในระบบ (เพิ่ม/แก้ไข/ลบ)"
          >
            <Truck className="w-3.5 h-3.5 text-white" />
            <span>จัดการขนส่ง ({carriers.length})</span>
          </button>

          {/* Contextual Action Button */}
          {activeSubTab === 'documents' && (
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider transition flex items-center gap-1 shadow-xs cursor-pointer border-0"
            >
              <Plus className="w-3.5 h-3.5" /> บันทึกเอกสาร
            </button>
          )}
          {activeSubTab === 'partners' && (
            <button
              onClick={handleOpenAddPartner}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider transition flex items-center gap-1 shadow-xs cursor-pointer border-0"
            >
              <Plus className="w-3.5 h-3.5" /> เพิ่มคู่ค้า
            </button>
          )}
        </div>
      </div>

      {/* ─── SUB-TAB RENDER LOGIC ─── */}

      {/* 1. ENDLESSLOOP PREMIUM DASHBOARD TAB */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* 1.0 ALERT WIDGET FOR BILLING OUTSTANDING */}
          {unPaidBilledBillings.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fade-in no-print">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0 animate-pulse">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-rose-900 font-sans uppercase tracking-wide flex items-center gap-1.5">
                    ตรวจพบเอกสารค้างชำระ (วางบิลแล้วแต่ยังไม่ชำระเงิน)
                  </h4>
                  <p className="text-[11px] text-rose-700 font-medium font-sans mt-0.5">
                    มีจำนวน <strong className="text-rose-900 text-xs font-black font-mono">{unPaidBilledBillings.length}</strong> รายการที่วางบิลแล้วแต่ยังไม่ได้รับการบันทึกชำระเงิน กรุณาตรวจสอบและปรับปรุงสถานะเมื่อได้รับเงิน/จ่ายเงินแล้ว
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNotificationOpen(true)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-sm text-[11px] font-black font-sans uppercase transition flex items-center gap-1.5 cursor-pointer shadow-xs border-0"
              >
                <span>เปิดดูรายการค้างจ่าย</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          )}
          
          {/* 1.1 THE 5 PIPELINE COLUMNS (KANBAN FLOW TRACKS) */}
          <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="min-w-[1100px] grid grid-cols-5 gap-3.5 items-start">
              
              {/* Column 1: Unaware (รอจัดเตรียม/รอจัดส่ง) */}
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-violet-400 rounded-full shadow-xs animate-ping"></span>
                    <span className="w-2.5 h-2.5 bg-violet-500 rounded-full shadow-xs absolute"></span>
                    <h3 className="text-[11px] font-mono font-bold uppercase text-slate-500 tracking-wider">Unaware</h3>
                  </div>
                  <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 font-mono font-black text-[10px] rounded-sm">
                    {billings.filter(b => b.status === 'pending' && b.docType === 'delivery').length}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800">รอส่งมอบสินค้า</h4>
                  <p className="text-[10px] text-slate-400 mt-1 italic leading-relaxed">
                    "สั่งของและอะไหล่รอบใหม่แล้ว... รอใบขนส่งสินค้าเข้าโกดัง"
                  </p>
                </div>
                <div className="space-y-2 pt-1">
                  {billings.filter(b => b.status === 'pending' && b.docType === 'delivery').length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-sm p-3 text-center text-[10px] text-slate-400">
                      ไม่มีใบค้างส่งมอบสินค้า
                    </div>
                  ) : (
                    billings.filter(b => b.status === 'pending' && b.docType === 'delivery').slice(0, 3).map(item => (
                      <div key={item.id} className="bg-white p-2.5 border border-slate-200 rounded-sm shadow-2xs space-y-1.5 hover:border-violet-300 transition">
                        <span className="font-extrabold text-[11px] text-slate-800 block truncate">{item.partnerName}</span>
                        <div className="flex justify-between items-baseline">
                          <span className="text-[9px] font-mono text-slate-400">{item.docNumber}</span>
                          <span className="text-xs font-black text-slate-900 font-mono">฿{item.amount.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div className="bg-violet-500 h-full w-2/5 rounded-full"></div>
                        </div>
                        <div className="flex justify-between items-center pt-0.5">
                          <span className="text-[8px] font-mono text-slate-400">นัด: {item.dueDate}</span>
                          <div className="flex -space-x-1.5">
                            <span className="p-0.5 bg-violet-50 text-violet-500 border border-violet-100 rounded-full"><Phone className="w-2 h-2" /></span>
                            <span className="p-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded-full"><User className="w-2 h-2" /></span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 2: Problem Aware (ใบส่งของรอดำเนินการ) */}
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-amber-400 rounded-full shadow-xs animate-pulse"></span>
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full shadow-xs absolute"></span>
                    <h3 className="text-[11px] font-mono font-bold uppercase text-slate-500 tracking-wider">Problem Aware</h3>
                  </div>
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 font-mono font-black text-[10px] rounded-sm">
                    {billings.filter(b => b.docType === 'delivery' && b.status !== 'pending' && b.status !== 'cancelled').length}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800">ตรวจรับใบส่งของแล้ว</h4>
                  <p className="text-[10px] text-slate-400 mt-1 italic leading-relaxed">
                    "รับของเสร็จนับครบถ้วน... เตรียมนำเข้ารอบวางบิลสิ้นเดือน"
                  </p>
                </div>
                <div className="space-y-2 pt-1">
                  {billings.filter(b => b.docType === 'delivery' && b.status !== 'pending' && b.status !== 'cancelled').length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-sm p-3 text-center text-[10px] text-slate-400">
                      ไม่มีใบตรวจของรอกระบวนการ
                    </div>
                  ) : (
                    billings.filter(b => b.docType === 'delivery' && b.status !== 'pending' && b.status !== 'cancelled').slice(0, 3).map(item => (
                      <div key={item.id} className="bg-white p-2.5 border border-slate-200 rounded-sm shadow-2xs space-y-1.5 hover:border-amber-300 transition">
                        <span className="font-extrabold text-[11px] text-slate-800 block truncate">{item.partnerName}</span>
                        <div className="flex justify-between items-baseline">
                          <span className="text-[9px] font-mono text-slate-400">{item.docNumber}</span>
                          <span className="text-xs font-black text-slate-900 font-mono">฿{item.amount.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full w-3/5 rounded-full"></div>
                        </div>
                        <div className="flex justify-between items-center pt-0.5">
                          <span className="text-[8px] font-mono text-slate-400">เสร็จ: {item.issueDate}</span>
                          <div className="flex -space-x-1.5">
                            <span className="p-0.5 bg-amber-50 text-amber-500 border border-amber-100 rounded-full"><MapPin className="w-2 h-2" /></span>
                            <span className="p-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded-full"><User className="w-2 h-2" /></span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 3: Solution Aware (ตรวจสอบความถูกต้อง/เตรียมวางบิล) */}
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-pink-400 rounded-full shadow-xs animate-pulse"></span>
                    <span className="w-2.5 h-2.5 bg-pink-500 rounded-full shadow-xs absolute"></span>
                    <h3 className="text-[11px] font-mono font-bold uppercase text-slate-500 tracking-wider">Solution Aware</h3>
                  </div>
                  <span className="px-1.5 py-0.5 bg-pink-100 text-pink-700 font-mono font-black text-[10px] rounded-sm">
                    {billings.filter(b => b.docType === 'billing' && b.status === 'pending').length}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800">ใบวางบิลค้างตรวจสอบ</h4>
                  <p className="text-[10px] text-slate-400 mt-1 italic leading-relaxed">
                    "ตรวจความถูกต้องของเอกสาร... รอยืนยันเพื่อตัดวงจรชำระ"
                  </p>
                </div>
                <div className="space-y-2 pt-1">
                  {billings.filter(b => b.docType === 'billing' && b.status === 'pending').length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-sm p-3 text-center text-[10px] text-slate-400">
                      ไม่มีใบวางบิลค้างตรวจ
                    </div>
                  ) : (
                    billings.filter(b => b.docType === 'billing' && b.status === 'pending').slice(0, 3).map(item => (
                      <div key={item.id} className="bg-white p-2.5 border border-slate-200 rounded-sm shadow-2xs space-y-1.5 hover:border-pink-300 transition">
                        <span className="font-extrabold text-[11px] text-slate-800 block truncate">{item.partnerName}</span>
                        <div className="flex justify-between items-baseline">
                          <span className="text-[9px] font-mono text-slate-400">{item.docNumber}</span>
                          <span className="text-xs font-black text-slate-900 font-mono">฿{item.amount.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div className="bg-pink-500 h-full w-4/5 rounded-full"></div>
                        </div>
                        <div className="flex justify-between items-center pt-0.5">
                          <span className="text-[8px] font-mono text-slate-400">รอบ: {item.dueDate}</span>
                          <div className="flex -space-x-1.5">
                            <span className="p-0.5 bg-pink-50 text-pink-500 border border-pink-100 rounded-full"><Mail className="w-2 h-2" /></span>
                            <span className="p-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded-full"><User className="w-2 h-2" /></span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 4: Product Aware (วางบิลแล้ว/รอครบกำหนดชำระ) */}
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-blue-400 rounded-full shadow-xs animate-pulse"></span>
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-xs absolute"></span>
                    <h3 className="text-[11px] font-mono font-bold uppercase text-slate-500 tracking-wider">Product Aware</h3>
                  </div>
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 font-mono font-black text-[10px] rounded-sm">
                    {billings.filter(b => b.status === 'billed').length}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800">วางบิลแล้ว/รอนัดชำระ</h4>
                  <p className="text-[10px] text-slate-400 mt-1 italic leading-relaxed">
                    "ตัดจ่ายรอบเงินสดในระบบแล้ว... อยู่ระหว่างรอนัดรับเช็คคู่ค้า"
                  </p>
                </div>
                <div className="space-y-2 pt-1">
                  {billings.filter(b => b.status === 'billed').length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-sm p-3 text-center text-[10px] text-slate-400">
                      ไม่มีรายการรอบชำระที่ค้าง
                    </div>
                  ) : (
                    billings.filter(b => b.status === 'billed').slice(0, 3).map(item => (
                      <div key={item.id} className="bg-white p-2.5 border border-slate-200 rounded-sm shadow-2xs space-y-1.5 hover:border-blue-300 transition">
                        <span className="font-extrabold text-[11px] text-slate-800 block truncate">{item.partnerName}</span>
                        <div className="flex justify-between items-baseline">
                          <span className="text-[9px] font-mono text-slate-400">{item.docNumber}</span>
                          <span className="text-xs font-black text-slate-900 font-mono">฿{item.amount.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full w-[95%] rounded-full animate-pulse"></div>
                        </div>
                        <div className="flex justify-between items-center pt-0.5">
                          <span className="text-[8px] font-mono text-slate-400">นัดจ่าย: {item.dueDate}</span>
                          <div className="flex -space-x-1.5">
                            <span className="p-0.5 bg-blue-50 text-blue-500 border border-blue-100 rounded-full"><Calendar className="w-2 h-2" /></span>
                            <span className="p-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded-full"><User className="w-2 h-2" /></span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 5: Highly Aware (ชำระเสร็จสมบูรณ์) */}
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-xs"></span>
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-xs absolute"></span>
                    <h3 className="text-[11px] font-mono font-bold uppercase text-slate-500 tracking-wider">Highly Aware</h3>
                  </div>
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 font-mono font-black text-[10px] rounded-sm">
                    {billings.filter(b => b.status === 'paid').length}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800">ชำระเสร็จสิ้นและออกใบเสร็จ</h4>
                  <p className="text-[10px] text-slate-400 mt-1 italic leading-relaxed">
                    "ชำระตรงเวลา... ประสิทธิภาพการบริหารงานเป็นที่น่าพอใจมาก"
                  </p>
                </div>
                <div className="space-y-2 pt-1">
                  {billings.filter(b => b.status === 'paid').length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-sm p-3 text-center text-[10px] text-slate-400">
                      ไม่มีรายการตัดจ่ายเสร็จสมบูรณ์
                    </div>
                  ) : (
                    billings.filter(b => b.status === 'paid').slice(0, 3).map(item => (
                      <div key={item.id} className="bg-white p-2.5 border border-slate-200 rounded-sm shadow-2xs space-y-1.5 hover:border-emerald-300 transition">
                        <span className="font-extrabold text-[11px] text-slate-800 block truncate">{item.partnerName}</span>
                        <div className="flex justify-between items-baseline">
                          <span className="text-[9px] font-mono text-slate-400">{item.docNumber}</span>
                          <span className="text-xs font-black text-slate-900 font-mono">฿{item.amount.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full w-full rounded-full"></div>
                        </div>
                        <div className="flex justify-between items-center pt-0.5">
                          <span className="text-[8px] font-mono text-slate-400">ตัดยอด: {item.issueDate}</span>
                          <div className="flex -space-x-1.5">
                            <span className="p-0.5 bg-emerald-50 text-emerald-500 border border-emerald-100 rounded-full"><Check className="w-2 h-2" /></span>
                            <span className="p-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded-full"><User className="w-2 h-2" /></span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* 1.2 THE 5 LARGE STATS CARDS (ENDLESSLOOP aesthetic) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Card 1: Deliveries Amount */}
            <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition duration-300">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Delivery Amount</span>
                <span className="px-1.5 py-0.5 bg-violet-50 text-violet-600 font-mono text-[9px] font-black rounded-sm uppercase">Active DO</span>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-black text-violet-600 font-mono tracking-tight">
                  ฿{dashboardStats.totalDeliveryAmount.toLocaleString()}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>เฉลี่ย/ใบ:</span>
                  <span className="font-mono font-bold text-slate-700">
                    ฿{dashboardStats.deliveryCount ? Math.round(dashboardStats.totalDeliveryAmount / dashboardStats.deliveryCount).toLocaleString() : '0'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full bg-violet-50 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-violet-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${dashboardStats.deliveryCount ? Math.min(100, (dashboardStats.deliveryCount / billings.length) * 100) : 0}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-violet-500 rounded-full inline-block"></span> {dashboardStats.deliveryCount} ฉบับ</span>
                  <div className="flex gap-1">
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-100 flex items-center justify-center text-[8px]"><Building2 className="w-2.5 h-2.5 text-slate-500" /></span>
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-100 flex items-center justify-center text-[8px]"><User className="w-2.5 h-2.5 text-slate-500" /></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Billed Amount */}
            <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition duration-300">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Billed Amount</span>
                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 font-mono text-[9px] font-black rounded-sm uppercase">Active BI</span>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-black text-indigo-600 font-mono tracking-tight">
                  ฿{dashboardStats.totalBilledAmount.toLocaleString()}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>เฉลี่ย/ใบ:</span>
                  <span className="font-mono font-bold text-slate-700">
                    ฿{dashboardStats.billedCount ? Math.round(dashboardStats.totalBilledAmount / dashboardStats.billedCount).toLocaleString() : '0'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full bg-indigo-50 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${dashboardStats.billedCount ? Math.min(100, (dashboardStats.billedCount / billings.length) * 100) : 0}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full inline-block"></span> {dashboardStats.billedCount} ฉบับ</span>
                  <div className="flex gap-1">
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-100 flex items-center justify-center text-[8px]"><Mail className="w-2.5 h-2.5 text-slate-500" /></span>
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-100 flex items-center justify-center text-[8px]"><User className="w-2.5 h-2.5 text-slate-500" /></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Pending Payments */}
            <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition duration-300">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Outstanding Debt</span>
                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 font-mono text-[9px] font-black rounded-sm uppercase">Pending</span>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-black text-amber-500 font-mono tracking-tight">
                  ฿{dashboardStats.totalPendingAmount.toLocaleString()}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>อัตราส่วนค้าง:</span>
                  <span className="font-mono font-bold text-amber-600">
                    {dashboardStats.totalPendingAmount && (dashboardStats.totalDeliveryAmount + dashboardStats.totalBilledAmount)
                      ? ((dashboardStats.totalPendingAmount / (dashboardStats.totalDeliveryAmount + dashboardStats.totalBilledAmount)) * 100).toFixed(1) + '%'
                      : '0%'
                    }
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full bg-amber-50 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${dashboardStats.totalPendingAmount && (dashboardStats.totalDeliveryAmount + dashboardStats.totalBilledAmount) ? Math.min(100, (dashboardStats.totalPendingAmount / (dashboardStats.totalDeliveryAmount + dashboardStats.totalBilledAmount)) * 100) : 0}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full inline-block"></span> {dashboardStats.pendingCount} รายการ</span>
                  <div className="flex gap-1">
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-100 flex items-center justify-center text-[8px]"><Calendar className="w-2.5 h-2.5 text-slate-500" /></span>
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-100 flex items-center justify-center text-[8px]"><User className="w-2.5 h-2.5 text-slate-500" /></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Paid Amount */}
            <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition duration-300">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Paid Finished</span>
                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 font-mono text-[9px] font-black rounded-sm uppercase">Success</span>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-black text-emerald-600 font-mono tracking-tight">
                  ฿{dashboardStats.totalPaidAmount.toLocaleString()}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>อัตราส่วนชำระ:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {dashboardStats.totalPaidAmount && (dashboardStats.totalDeliveryAmount + dashboardStats.totalBilledAmount)
                      ? ((dashboardStats.totalPaidAmount / (dashboardStats.totalDeliveryAmount + dashboardStats.totalBilledAmount)) * 100).toFixed(1) + '%'
                      : '0%'
                    }
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full bg-emerald-50 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${dashboardStats.totalPaidAmount && (dashboardStats.totalDeliveryAmount + dashboardStats.totalBilledAmount) ? Math.min(100, (dashboardStats.totalPaidAmount / (dashboardStats.totalDeliveryAmount + dashboardStats.totalBilledAmount)) * 100) : 0}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span> {dashboardStats.paidCount} สำเร็จ</span>
                  <div className="flex gap-1">
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-100 flex items-center justify-center text-[8px]"><Check className="w-2.5 h-2.5 text-slate-500" /></span>
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-100 flex items-center justify-center text-[8px]"><User className="w-2.5 h-2.5 text-slate-500" /></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 5: Total Transactions */}
            <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition duration-300">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Total Transaction</span>
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-mono text-[9px] font-black rounded-sm uppercase">Summary</span>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                  ฿{(dashboardStats.totalDeliveryAmount + dashboardStats.totalBilledAmount).toLocaleString()}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>ความพึงพอใจคู่ค้า:</span>
                  <span className="font-sans font-bold text-violet-600 flex items-center gap-0.5"><Award className="w-3 h-3" /> 99.8%</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-violet-500 to-indigo-600 h-full w-[85%] rounded-full"></div>
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-slate-900 rounded-full inline-block"></span> รวม {billings.filter(b => selectedPartnerDashboard === 'All' || b.partnerName === selectedPartnerDashboard).length} รายการ</span>
                  <div className="flex gap-1">
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-100 flex items-center justify-center text-[8px]"><ShieldCheck className="w-2.5 h-2.5 text-slate-500" /></span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* 1.3 VISUAL CHARTS GRID (CONCENTRIC FUNNELS AND SVG CIRCLES) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 1.3.1 LEFT MODULE: SUPPLIER ACTIVE CONTRACT LIST */}
            <div className="bg-white border border-slate-200 rounded-md p-4 lg:col-span-7 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-black text-slate-900 font-sans uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-violet-600" /> วิเคราะห์รายรับและการทำธุรกรรมของบริษัทคู่ค้าหลัก
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {dashboardLeftTab === 'recent_10'
                      ? `สรุปข้อมูลเปรียบเทียบมูลค่าธุรกรรมและเอกสารค้างชำระในรอบเดือน ${formatThaiMonthYear(latestMonthBillings.year, latestMonthBillings.month)}`
                      : 'สรุปข้อมูลเปรียบเทียบมูลค่าธุรกรรมและเอกสารค้างชำระของคู่ค้าหลักสะสมทั้งหมด'
                    }
                  </p>
                </div>
                
                {/* SUB-TAB SELECTOR */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-sm shrink-0">
                  <button
                    type="button"
                    onClick={() => setDashboardLeftTab('recent_10')}
                    className={`px-2.5 py-1 text-[10px] font-bold font-sans rounded-xs transition-all duration-150 cursor-pointer ${
                      dashboardLeftTab === 'recent_10'
                        ? 'bg-white text-violet-600 shadow-3xs border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    10 รายการล่าสุด
                  </button>
                  <button
                    type="button"
                    onClick={() => setDashboardLeftTab('partners')}
                    className={`px-2.5 py-1 text-[10px] font-bold font-sans rounded-xs transition-all duration-150 cursor-pointer ${
                      dashboardLeftTab === 'partners'
                        ? 'bg-white text-violet-600 shadow-3xs border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    เปรียบเทียบรายคู่ค้า
                  </button>
                </div>
              </div>

              {dashboardLeftTab === 'recent_10' ? (
                /* TAB 1: NEWEST 10 ITEMS - SORTED BY NEWEST ON TOP */
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 border border-slate-150 rounded-sm p-3 text-[10.5px] text-slate-600 font-sans gap-2">
                    <div>
                      รอบบัญชีปัจจุบัน: <strong className="text-slate-800 font-bold font-sans">{formatThaiMonthYear(latestMonthBillings.year, latestMonthBillings.month)}</strong>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <span>ค้างชำระในรอบเดือน: <strong className="text-rose-600 font-bold font-mono">฿{latestMonthBillings.items.filter(b => b.status === 'pending' || b.status === 'billed').reduce((sum, item) => sum + item.amount, 0).toLocaleString()}</strong></span>
                      <span>ชำระแล้ว: <strong className="text-emerald-600 font-bold font-mono">฿{latestMonthBillings.items.filter(b => b.status === 'paid').reduce((sum, item) => sum + item.amount, 0).toLocaleString()}</strong></span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 text-slate-400 text-[9px] font-mono font-bold uppercase tracking-wider border-b border-slate-100">
                          <th className="py-2.5 px-3">วันที่ / เลขที่เอกสาร</th>
                          <th className="py-2.5 px-3">ประเภทเอกสาร</th>
                          <th className="py-2.5 px-3">บริษัทคู่ค้าหลัก</th>
                          <th className="py-2.5 px-3 text-right">มูลค่าธุรกรรม</th>
                          <th className="py-2.5 px-3 text-center">สถานะการชำระเงิน</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {latestMonthBillings.items.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400 text-[11px] font-sans italic">
                              ไม่มีข้อมูลเอกสารหรือรายการธุรกรรมในรอบเดือนนี้
                            </td>
                          </tr>
                        ) : (
                          latestMonthBillings.items.map(item => {
                            return (
                              <tr key={item.id} className="hover:bg-slate-50/40 transition">
                                <td className="py-2.5 px-3">
                                  <span className="block font-semibold text-slate-700 font-mono text-[11px]">{item.issueDate}</span>
                                  <span className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider">{item.docNumber}</span>
                                </td>
                                <td className="py-2.5 px-3">
                                  {getDocTypeBadge(item.docType)}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-800">
                                  <span className="block truncate max-w-[150px]" title={item.partnerName}>{item.partnerName}</span>
                                  {item.contactPerson && <span className="text-[9px] font-sans text-slate-400 block font-normal">ติดต่อ: {item.contactPerson}</span>}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                  ฿{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {item.status === 'paid' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9.5px] font-bold border border-emerald-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                      ชำระแล้ว (Paid)
                                    </span>
                                  ) : item.status === 'billed' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[9.5px] font-black border border-rose-200 animate-pulse">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                      🔴 ค้างชำระ (Unpaid)
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[9.5px] font-bold border border-amber-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                      🟡 รอวางบิล (Pending)
                                    </span>
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
              ) : (
                /* TAB 2: ORIGINAL PARTNERS INDEX COMPARISON */
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 text-slate-400 text-[9px] font-mono font-bold uppercase tracking-wider border-b border-slate-100">
                        <th className="py-2.5 px-3">ชื่อบริษัทคู่ค้า</th>
                        <th className="py-2.5 px-3 text-right">ใบส่งของ (DO)</th>
                        <th className="py-2.5 px-3 text-right">ใบวางบิล (BI)</th>
                        <th className="py-2.5 px-3 text-right">ชำระแล้ว (PAID)</th>
                        <th className="py-2.5 px-3 text-center">ดัชนีประสิทธิภาพ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {partners.map(p => {
                        const pBillings = billings.filter(b => b.partnerName === p.name);
                        const pDO = pBillings.filter(b => b.docType === 'delivery' && b.status !== 'cancelled').reduce((acc, b) => acc + b.amount, 0);
                        const pBI = pBillings.filter(b => b.docType === 'billing' && b.status !== 'cancelled').reduce((acc, b) => acc + b.amount, 0);
                        const pPaid = pBillings.filter(b => b.status === 'paid').reduce((acc, b) => acc + b.amount, 0);
                        
                        // Calculate mock efficiency based on speed of paid vs total
                        const efficiency = pBillings.length > 0 
                          ? Math.round((pBillings.filter(b => b.status === 'paid').length / pBillings.length) * 100)
                          : 100;

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-3 px-3 font-semibold text-slate-800">
                              <span className="block truncate max-w-[200px]" title={p.name}>{p.name}</span>
                              <span className="text-[9px] font-mono text-slate-400">ID: {p.id} | {p.contactPerson}</span>
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-600">
                              ฿{pDO.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-indigo-600">
                              ฿{pBI.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-emerald-600">
                              ฿{pPaid.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="inline-flex items-center gap-1.5">
                                <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${efficiency >= 80 ? 'bg-emerald-500' : efficiency >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                    style={{ width: `${efficiency}%` }}
                                  ></div>
                                </div>
                                <span className="text-[9px] font-mono font-bold text-slate-500">{efficiency}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 1.3.2 RIGHT MODULES: CONCENTRIC ARC CHARTS (THE ENDLESSLOOP ICONIC LAYOUT) */}
            <div className="lg:col-span-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
              
              {/* Card A: Concentric Ring Funnel (Conversion Funnel) */}
              <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-900 font-sans uppercase tracking-wider">
                    วงจรการรับวางบิลคู่ค้า (CONCENTRIC FUNNEL)
                  </h3>
                  <p className="text-[10px] text-slate-400">เปรียบเทียบอัตราส่วนของเอกสารส่งของ ใบวางบิล และสถานะการชำระเงิน</p>
                </div>

                <div className="relative py-4 flex justify-center items-center">
                  {/* Concentric Circle SVGs replicating Endlessloop "Leads, Bookings, Customers" style */}
                  <svg viewBox="0 0 300 300" className="w-full max-w-[200px] h-auto">
                    {/* Outer circle - Delivery (Leads) */}
                    <circle cx="150" cy="150" r="120" stroke="#f4f4f5" strokeWidth="12" fill="none" />
                    <circle 
                      cx="150" 
                      cy="150" 
                      r="120" 
                      stroke="#8b5cf6" 
                      strokeWidth="12" 
                      strokeDasharray="753" 
                      strokeDashoffset={753 - (753 * 0.85)} 
                      strokeLinecap="round" 
                      fill="none" 
                      className="transition-all duration-1000 origin-center -rotate-90"
                    />

                    {/* Middle circle - Billed (Booking) */}
                    <circle cx="150" cy="150" r="95" stroke="#f4f4f5" strokeWidth="12" fill="none" />
                    <circle 
                      cx="150" 
                      cy="150" 
                      r="95" 
                      stroke="#ec4899" 
                      strokeWidth="12" 
                      strokeDasharray="596" 
                      strokeDashoffset={596 - (596 * 0.65)} 
                      strokeLinecap="round" 
                      fill="none" 
                      className="transition-all duration-1000 origin-center -rotate-90"
                    />

                    {/* Inner circle - Paid (Customers) */}
                    <circle cx="150" cy="150" r="70" stroke="#f4f4f5" strokeWidth="12" fill="none" />
                    <circle 
                      cx="150" 
                      cy="150" 
                      r="70" 
                      stroke="#10b981" 
                      strokeWidth="12" 
                      strokeDasharray="439" 
                      strokeDashoffset={439 - (439 * 0.45)} 
                      strokeLinecap="round" 
                      fill="none" 
                      className="transition-all duration-1000 origin-center -rotate-90"
                    />

                    {/* Center text */}
                    <text x="150" y="142" textAnchor="middle" className="fill-slate-800 text-2xl font-black font-sans">
                      {dashboardStats.totalPaidAmount && (dashboardStats.totalDeliveryAmount + dashboardStats.totalBilledAmount)
                        ? ((dashboardStats.totalPaidAmount / (dashboardStats.totalDeliveryAmount + dashboardStats.totalBilledAmount)) * 100).toFixed(0) + '%'
                        : '0%'
                      }
                    </text>
                    <text x="150" y="162" textAnchor="middle" className="fill-slate-400 font-mono text-[9px] font-bold uppercase tracking-widest">
                      CHART RATIO
                    </text>
                    <text x="150" y="176" textAnchor="middle" className="fill-violet-600 font-sans text-[8px] font-bold">
                      "Yes, this is for me!"
                    </text>
                  </svg>

                  {/* Funnel annotations */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col space-y-2 text-[10px] font-semibold">
                    <span className="flex items-center gap-1.5 text-violet-600 font-mono">
                      <span className="w-2.5 h-2.5 rounded-full bg-violet-600 inline-block"></span> 85% Delivery
                    </span>
                    <span className="flex items-center gap-1.5 text-pink-600 font-mono">
                      <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block"></span> 65% Billed
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-600 font-mono">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> 45% Paid
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex justify-between text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1 font-sans">ประเมินผลวงจรอัตโนมัติ:</span>
                  <span className="font-extrabold text-violet-600">เสถียรและตรงรอบบัญชี</span>
                </div>
              </div>

              {/* Card B: Concentric Semi-Circle Status Target (Target Board) */}
              <div className="bg-white border border-slate-200 rounded-md p-4 shadow-xs space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-900 font-sans uppercase tracking-wider">
                    เป้าหมายการประมวลผล (CONCENTRIC ARCH TARGET)
                  </h3>
                  <p className="text-[10px] text-slate-400">สถานะของตารางเอกสารทั้งหมดในระบบค้างจ่ายและจ่ายเสร็จสมบูรณ์</p>
                </div>

                <div className="relative py-2 flex justify-center items-center">
                  {/* Concentric semi-circles mimicking Endlessloop Done(30), Doing(6), To Do(14), Backlog(28) */}
                  <svg viewBox="0 0 300 150" className="w-full max-w-[220px] h-auto">
                    {/* Outer Ring - Paid */}
                    <path d="M 30,150 A 120,120 0 0,1 270,150" fill="none" stroke="#f4f4f5" strokeWidth="14" strokeLinecap="round" />
                    <path 
                      d="M 30,150 A 120,120 0 0,1 270,150" 
                      fill="none" 
                      stroke="#7c3aed" 
                      strokeWidth="14" 
                      strokeDasharray="377" 
                      strokeDashoffset={377 - (377 * (dashboardStats.paidCount / Math.max(1, billings.filter(b => selectedPartnerDashboard === 'All' || b.partnerName === selectedPartnerDashboard).length)))} 
                      strokeLinecap="round" 
                      className="transition-all duration-1000"
                    />

                    {/* Second Ring - Billed */}
                    <path d="M 55,150 A 95,95 0 0,1 245,150" fill="none" stroke="#f4f4f5" strokeWidth="14" strokeLinecap="round" />
                    <path 
                      d="M 55,150 A 95,95 0 0,1 245,150" 
                      fill="none" 
                      stroke="#ec4899" 
                      strokeWidth="14" 
                      strokeDasharray="298" 
                      strokeDashoffset={298 - (298 * (dashboardStats.billedCount / Math.max(1, billings.filter(b => selectedPartnerDashboard === 'All' || b.partnerName === selectedPartnerDashboard).length)))} 
                      strokeLinecap="round" 
                      className="transition-all duration-1000"
                    />

                    {/* Third Ring - Pending */}
                    <path d="M 80,150 A 70,70 0 0,1 220,150" fill="none" stroke="#f4f4f5" strokeWidth="14" strokeLinecap="round" />
                    <path 
                      d="M 80,150 A 70,70 0 0,1 220,150" 
                      fill="none" 
                      stroke="#f59e0b" 
                      strokeWidth="14" 
                      strokeDasharray="219" 
                      strokeDashoffset={219 - (219 * (dashboardStats.pendingCount / Math.max(1, billings.filter(b => selectedPartnerDashboard === 'All' || b.partnerName === selectedPartnerDashboard).length)))} 
                      strokeLinecap="round" 
                      className="transition-all duration-1000"
                    />

                    {/* Center text on bottom edge */}
                    <text x="150" y="145" textAnchor="middle" className="fill-slate-800 text-lg font-black font-sans">
                      #{billings.filter(b => selectedPartnerDashboard === 'All' || b.partnerName === selectedPartnerDashboard).length}
                    </text>
                    <text x="150" y="125" textAnchor="middle" className="fill-slate-400 font-mono text-[8px] font-bold uppercase tracking-wider">
                      TOTAL TABLES
                    </text>
                  </svg>

                  {/* Arcs description labels inside cards */}
                  <div className="absolute bottom-1 w-full flex justify-between px-2 text-[8px] font-bold text-slate-500 font-mono">
                    <span className="text-violet-600">Done ({dashboardStats.paidCount})</span>
                    <span className="text-pink-600">Doing ({dashboardStats.billedCount})</span>
                    <span className="text-amber-600">To Do ({dashboardStats.pendingCount})</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[9px] text-slate-400 font-sans">
                  <span className="flex items-center gap-1">ความเห็นร่วม:</span>
                  <span className="italic text-violet-600">"I love it, I need to share this"</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* 2. MAIN BILLING DOCUMENTS BOARD TAB */}
      {activeSubTab === 'documents' && (
        <>
          {/* Real-time Unpaid Billing Alert Banner */}
          {unpaidBilledItems.length > 0 && (
            <div id="unpaid-billing-alert-banner" className="bg-rose-50 border border-rose-200 rounded-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-rose-100 text-rose-600 rounded-sm shrink-0 flex items-center justify-center animate-pulse">
                  <AlertCircle className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-rose-800 font-sans">แจ้งเตือนวางบิลค้างชำระ (Unpaid Billings Alert)</h4>
                  <p className="text-[11px] text-rose-600 mt-0.5 font-sans">
                    มีเอกสารวางบิลที่ผ่านรอบการวางบิลแล้วแต่ยังไม่ได้รับการชำระเงินจำนวน <strong className="text-rose-800 font-mono text-xs">{unpaidBilledItems.length} ฉบับ</strong> รวมมูลค่าค้างจ่ายทั้งสิ้น <strong className="text-rose-800 font-mono text-xs">฿{unpaidBilledItems.reduce((acc, b) => acc + b.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-rose-100 text-rose-700 text-[10px] font-mono font-bold rounded-sm border border-rose-200 shrink-0 uppercase tracking-wider">
                Awaiting Payment
              </span>
            </div>
          )}

          {/* Summary Stats Panels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Deliveries */}
            <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">ใบส่งของรอดำเนินการ (DO)</span>
                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-xs font-mono">{stats.deliveryCount} ฉบับ</span>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-xl font-black text-slate-950 font-mono">฿{stats.totalDeliveryAmount.toLocaleString()}</p>
                <span className="text-[10px] text-slate-400">มูลค่ารวมส่งของ</span>
              </div>
            </div>

            {/* Card 2: Billed / Outstanding */}
            <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">ใบวางบิลในระบบ (BI)</span>
                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-xs font-mono">{stats.billedCount} ฉบับ</span>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-xl font-black text-indigo-600 font-mono">฿{stats.totalBilledAmount.toLocaleString()}</p>
                <span className="text-[10px] text-slate-400">มูลค่าวางบิล</span>
              </div>
            </div>

            {/* Card 3: Pending Payments */}
            <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 font-bold text-amber-600">ยอดค้างจ่ายคู่ค้าทั้งหมด</span>
                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-xs font-mono">{stats.pendingCount} รายการ</span>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-xl font-black text-amber-600 font-mono">฿{stats.totalPendingAmount.toLocaleString()}</p>
                <span className="text-[10px] text-slate-400">รอเคลียร์ชำระ</span>
              </div>
            </div>

            {/* Card 4: Paid completed */}
            <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 font-bold text-emerald-600">ชำระเงินเรียบร้อยแล้ว</span>
                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-xs font-mono">{stats.paidCount} สำเร็จ</span>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-xl font-black text-emerald-600 font-mono">฿{stats.totalPaidAmount.toLocaleString()}</p>
                <span className="text-[10px] text-slate-400">จ่ายแล้วสะสม</span>
              </div>
            </div>
          </div>

          {/* Filter and Search Panel */}
          <div className="bg-white p-4 border border-slate-200 rounded-sm flex flex-col lg:flex-row gap-3 items-center justify-between shadow-xs">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาตามชื่อคู่ค้า, เลขที่เอกสาร, ผู้ติดต่อ หรือรายละเอียด..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-sm text-xs focus:outline-none focus:border-blue-500 bg-white"
              />
            </div>

            <div className="flex flex-wrap gap-2.5 w-full lg:w-auto items-center">
              {/* Status Filter */}
              <div className="flex items-center gap-1 text-xs text-slate-500 flex-1 sm:flex-initial">
                <span className="whitespace-nowrap font-sans font-semibold">สถานะ:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-sm text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="All">ทุกสถานะเอกสาร</option>
                  <option value="pending">รอวางบิล / รอดำเนินการ</option>
                  <option value="billed">วางบิลแล้ว / รอชำระ</option>
                  <option value="paid">ชำระเงินเรียบร้อย</option>
                  <option value="cancelled">ยกเลิกแล้ว</option>
                </select>
              </div>

              {/* Day Filter */}
              <div className="flex items-center gap-1 text-xs text-slate-500 flex-1 sm:flex-initial">
                <span className="whitespace-nowrap font-sans font-semibold">วัน:</span>
                <select
                  value={filterDay}
                  onChange={(e) => setFilterDay(e.target.value)}
                  className="px-2 py-1.5 bg-white border border-slate-200 rounded-sm text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="All">ทุกวัน</option>
                  {Array.from({ length: 31 }, (_, i) => {
                    const d = String(i + 1).padStart(2, '0');
                    return <option key={d} value={d}>{d}</option>;
                  })}
                </select>
              </div>

              {/* Month Filter */}
              <div className="flex items-center gap-1 text-xs text-slate-500 flex-1 sm:flex-initial">
                <span className="whitespace-nowrap font-sans font-semibold">เดือน:</span>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="px-2 py-1.5 bg-white border border-slate-200 rounded-sm text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="All">ทุกเดือน</option>
                  <option value="01">มกราคม (01)</option>
                  <option value="02">กุมภาพันธ์ (02)</option>
                  <option value="03">มีนาคม (03)</option>
                  <option value="04">เมษายน (04)</option>
                  <option value="05">พฤษภาคม (05)</option>
                  <option value="06">มิถุนายน (06)</option>
                  <option value="07">กรกรฎาคม (07)</option>
                  <option value="08">สิงหาคม (08)</option>
                  <option value="09">กันยายน (09)</option>
                  <option value="10">ตุลาคม (10)</option>
                  <option value="11">พฤศจิกายน (11)</option>
                  <option value="12">ธันวาคม (12)</option>
                </select>
              </div>

              {/* Year Filter */}
              <div className="flex items-center gap-1 text-xs text-slate-500 flex-1 sm:flex-initial">
                <span className="whitespace-nowrap font-sans font-semibold">ปี:</span>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="px-2 py-1.5 bg-white border border-slate-200 rounded-sm text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="All">ทุกปี</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>{Number(year) + 543} ({year})</option>
                  ))}
                </select>
              </div>

              {/* Reset Filters button */}
              {(searchQuery || docTypeFilter !== 'All' || statusFilter !== 'All' || filterDay !== 'All' || filterMonth !== 'All' || filterYear !== 'All') && (
                <button
                  onClick={handleResetFilters}
                  className="px-2.5 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-sm text-xs transition flex items-center gap-1 cursor-pointer font-sans font-bold"
                >
                  <RefreshCw className="w-3 h-3" /> รีเซ็ตตัวกรอง
                </button>
              )}

              {/* Audio Settings Integration */}
              <div className="flex items-center gap-1.5 ml-auto border-l border-slate-200 pl-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const nv = !soundEnabled;
                    setSoundEnabled(nv);
                    safeStorage.setItem('hr_sound_enabled', JSON.stringify(nv));
                    if (nv) {
                      setTimeout(() => {
                        playNotificationSound();
                      }, 50);
                    }
                  }}
                  className={`p-1.5 rounded-sm border transition flex items-center gap-1 text-xs font-semibold cursor-pointer ${
                    soundEnabled 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}
                  title={soundEnabled ? "ปิดเสียงแจ้งเตือนระบบ" : "เปิดเสียงแจ้งเตือนระบบ"}
                >
                  {soundEnabled ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                      <span className="text-[10px] hidden sm:inline">เปิดเสียง</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] hidden sm:inline">ปิดเสียง</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={playNotificationSound}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-sm text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                  title="ทดสอบเสียงแจ้งเตือน"
                >
                  <span>📢 ทดสอบ</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Billing Table List */}
          <div className="bg-white border border-slate-200 rounded-sm shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">รหัส & คู่ค้า</th>
                    <th className="py-3 px-4 font-mono">เลขที่เอกสาร</th>
                    <th className="py-3 px-4 text-right">จำนวนเงิน (บาท)</th>
                    <th className="py-3 px-4 text-center">วันที่ออกเอกสาร</th>
                    <th className="py-3 px-4 text-center">ครบกำหนดชำระ</th>
                    <th className="py-3 px-4 text-center">สถานะ</th>
                    <th className="py-3 px-4 text-center">จัดการการดำเนินงาน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedBillings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-slate-400 font-sans">
                        ไม่พบข้อมูลเอกสารคู่ค้าและใบส่งวางบิลตามเงื่อนไขที่ระบุ
                      </td>
                    </tr>
                  ) : (
                    paginatedBillings.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition text-xs">
                        {/* Partner name & details */}
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-bold text-slate-800 block">{item.partnerName}</span>
                            {item.contactPerson && (
                              <span className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                <User className="w-3 h-3" /> {item.contactPerson} {item.phone && `(${item.phone})`}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Document Details (Separated Lines) */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-2 text-slate-700 font-sans text-xs">
                            {/* Render Delivery block if exists */}
                            {(item.deliveryDocNumber || item.docType === 'delivery') && (
                              <div className="space-y-0.5 border-l-2 border-blue-500 pl-2">
                                <div className="text-[10px] font-bold text-blue-600 uppercase flex items-center gap-1">
                                  <span>🚚 ใบส่งของ</span>
                                </div>
                                <div className="font-mono text-[11px]">
                                  <span className="text-slate-400">เลขที่ส่งของ:</span> <span className="font-bold text-slate-900">{item.deliveryDocNumber || item.docNumber}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-2 text-[10px] text-slate-500 font-mono">
                                  <div>
                                    <span className="text-slate-400">เล่มที่:</span> <span className="text-slate-700 font-semibold">{item.bookNumber || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">เลขที่:</span> <span className="text-slate-700 font-semibold">{item.pageNumber || '-'}</span>
                                  </div>
                                </div>
                                {(!item.billingDocNumber && item.docType !== 'billing') && (
                                  <div className="font-mono text-[11px]">
                                    <span className="text-slate-400">ราคา:</span> <span className="text-blue-600 font-bold">฿{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Render Billing block if exists */}
                            {(item.billingDocNumber || item.docType === 'billing') && (
                              <div className="space-y-0.5 border-l-2 border-violet-500 pl-2">
                                <div className="text-[10px] font-bold text-violet-600 uppercase flex items-center gap-1">
                                  <span>📄 ใบวางบิล</span>
                                </div>
                                <div className="font-mono text-[11px]">
                                  <span className="text-slate-400">เลขที่ใบวางบิล:</span> <span className="font-bold text-slate-900">{item.billingDocNumber || item.docNumber}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-2 text-[10px] text-slate-500 font-mono">
                                  <div>
                                    <span className="text-slate-400">เล่มที่:</span> <span className="text-slate-700 font-semibold">{item.billingBookNumber || item.bookNumber || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">เลขที่:</span> <span className="text-slate-700 font-semibold">{item.billingPageNumber || item.pageNumber || '-'}</span>
                                  </div>
                                </div>
                                <div className="font-mono text-[11px]">
                                  <span className="text-slate-400">ราคาใบวางบิล:</span> <span className="text-violet-600 font-bold">฿{(item.billingAmount !== undefined ? item.billingAmount : item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                              </div>
                            )}

                            {/* Render CN / credit details */}
                            {item.cnDocNumber && (
                              <div className="space-y-0.5 border-l-2 border-rose-500 pl-2">
                                <div className="text-[10px] font-bold text-rose-600 uppercase flex items-center gap-1">
                                  <span>ใบลดหนี้ (CN)</span>
                                </div>
                                <div className="font-mono text-[11px]">
                                  <span className="text-slate-400">เลขที่ CN:</span> <span className="font-bold text-slate-900">{item.cnDocNumber}</span>
                                </div>
                                {item.cnAmount !== undefined && item.cnAmount > 0 && (
                                  <div className="font-mono text-[11px] text-rose-600">
                                    <span className="text-rose-400">ราคา CN:</span> <span className="font-bold">-฿{item.cnAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {item.cnAmount !== undefined && item.cnAmount > 0 && (
                              <div className="font-mono text-emerald-600 flex items-center gap-1 border-t border-dashed border-slate-200 pt-1 mt-1 text-[11px]">
                                <span className="text-emerald-500 font-bold">ยอดที่ต้องจ่าย:</span>
                                <span className="font-black bg-emerald-50 px-1 rounded-xs">฿{((item.billingAmount !== undefined ? item.billingAmount : item.amount) - item.cnAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                            )}

                            {/* Transport Carrier Info if present */}
                            {item.transportCarrier && (
                              <div className="text-[10px] text-emerald-700 font-sans flex items-center gap-1 mt-1 bg-emerald-50/50 px-1.5 py-0.5 rounded-sm border border-emerald-100/30 w-max">
                                <span>🚚 ขนส่ง: {item.transportCarrier}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="space-y-1 text-right">
                            <span className="font-mono font-bold text-slate-700 block text-xs">
                              ฿{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            {item.cnAmount !== undefined && item.cnAmount > 0 && (
                              <>
                                <span className="font-mono text-[10px] text-rose-500 block">
                                  -฿{item.cnAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (CN)
                                </span>
                                <div className="border-t border-slate-100 pt-0.5 mt-0.5 inline-block">
                                  <span className="font-mono font-extrabold text-emerald-600 block text-xs" title="ยอดที่ต้องจ่าย">
                                    ฿{(item.amount - item.cnAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-sans block">ยอดต้องจ่าย</span>
                                </div>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Issue Date */}
                        <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                          {item.issueDate}
                        </td>

                        {/* Due Date */}
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span className={`${
                            item.status !== 'paid' && item.status !== 'cancelled' && new Date(item.dueDate) < new Date()
                              ? 'text-rose-600 font-bold bg-rose-50 px-1 py-0.5 rounded-sm border border-rose-100'
                              : 'text-slate-500'
                          }`}>
                            {item.dueDate}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 text-center">
                          {getStatusBadge(item.status)}
                        </td>

                        {/* Operations Controls */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* View Info button */}
                            <button
                              onClick={() => { playNotificationSound(); setViewingDetails(item); }}
                              className="p-1 hover:bg-slate-100 text-slate-500 rounded-sm transition cursor-pointer"
                              title="ดูรายละเอียดเอกสาร"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            
                            {/* Edit button */}
                            <button
                              onClick={() => { playNotificationSound(); handleOpenEdit(item); }}
                              className="p-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-sm transition cursor-pointer"
                              title="แก้ไขข้อมูลเอกสาร"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Cancel/Void button */}
                            {item.status !== 'cancelled' ? (
                              <button
                                onClick={() => {
                                  playNotificationSound();
                                  const updated = { ...item, status: 'cancelled' as const };
                                  onUpdateBilling(updated);
                                  showSuccess(`ยกเลิกเอกสารเลขที่ ${item.docNumber} สำเร็จแล้ว`);
                                }}
                                className="p-1 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-sm transition cursor-pointer"
                                title="ยกเลิกเอกสารฉบับนี้ (Void)"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  playNotificationSound();
                                  const updated = { ...item, status: 'pending' as const };
                                  onUpdateBilling(updated);
                                  showSuccess(`กู้คืนเอกสารเลขที่ ${item.docNumber} สู่สถานะรอดำเนินการแล้ว`);
                                }}
                                className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-sm transition cursor-pointer"
                                title="เปิดใช้งานเอกสารนี้อีกครั้ง"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete button (with confirmation warning) */}
                            <button
                              onClick={() => { playNotificationSound(); setBillingToDelete(item); }}
                              className="p-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-sm transition cursor-pointer"
                              title="ลบเอกสารคู่ออกระบบ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-150 px-4 py-3 bg-white">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage(prev => Math.max(prev - 1, 1));
                      playNotificationSound();
                    }}
                    className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-xs font-medium rounded-sm text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    ก่อนหน้า
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      setCurrentPage(prev => Math.min(prev + 1, totalPages));
                      playNotificationSound();
                    }}
                    className="relative ml-3 inline-flex items-center px-4 py-2 border border-slate-300 text-xs font-medium rounded-sm text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    ถัดไป
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between text-xs font-sans text-slate-500">
                  <div>
                    <p>
                      แสดงรายการที่ <span className="font-bold text-slate-900">{startIndex + 1}</span> ถึง{' '}
                      <span className="font-bold text-slate-900">{Math.min(startIndex + itemsPerPage, totalItems)}</span> จากทั้งหมด{' '}
                      <span className="font-bold text-slate-900">{totalItems}</span> รายการ
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-sm shadow-xs" aria-label="Pagination">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => {
                          setCurrentPage(1);
                          playNotificationSound();
                        }}
                        className="relative inline-flex items-center rounded-l-sm px-2.5 py-2 text-slate-400 ring-1 ring-inset ring-slate-305 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                        title="หน้าแรก"
                      >
                        «
                      </button>
                      <button
                        disabled={currentPage === 1}
                        onClick={() => {
                          setCurrentPage(prev => Math.max(prev - 1, 1));
                          playNotificationSound();
                        }}
                        className="relative inline-flex items-center px-2.5 py-2 text-slate-400 ring-1 ring-inset ring-slate-305 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                      >
                        ‹ ก่อนหน้า
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                        .map((p, idx, arr) => {
                          const isCurrent = p === currentPage;
                          return (
                            <React.Fragment key={p}>
                              {idx > 0 && arr[idx - 1] !== p - 1 && (
                                <span className="relative inline-flex items-center px-3 py-2 text-slate-500 ring-1 ring-inset ring-slate-305 bg-white select-none">...</span>
                              )}
                              <button
                                onClick={() => {
                                  setCurrentPage(p);
                                  playNotificationSound();
                                }}
                                className={`relative inline-flex items-center px-3 py-2 text-xs font-semibold ring-1 ring-inset focus:z-20 focus:outline-offset-0 transition cursor-pointer ${
                                  isCurrent
                                    ? 'z-10 bg-blue-600 text-white ring-blue-600'
                                    : 'text-slate-900 ring-slate-305 hover:bg-slate-50 bg-white'
                                }`}
                              >
                                {p}
                              </button>
                            </React.Fragment>
                          );
                        })}

                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => {
                          setCurrentPage(prev => Math.min(prev + 1, totalPages));
                          playNotificationSound();
                        }}
                        className="relative inline-flex items-center px-2.5 py-2 text-slate-400 ring-1 ring-inset ring-slate-305 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                      >
                        ถัดไป ›
                      </button>
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => {
                          setCurrentPage(totalPages);
                          playNotificationSound();
                        }}
                        className="relative inline-flex items-center rounded-r-sm px-2.5 py-2 text-slate-400 ring-1 ring-inset ring-slate-305 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                        title="หน้าสุดท้าย"
                      >
                        »
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeSubTab === 'partners' && (
        <>
          {/* Partners Filter & Search Panel */}
          <div className="bg-white p-4 border border-slate-200 rounded-sm flex flex-col lg:flex-row gap-3 items-center justify-between shadow-xs">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อบริษัทคู่ค้า, เลขประจำตัวผู้เสียภาษี, ชื่อผู้ติดต่อหลัก, เบอร์โทร..."
                value={partnerSearchQuery}
                onChange={(e) => setPartnerSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-sm text-xs focus:outline-none focus:border-emerald-500 bg-white"
              />
            </div>
            
            {partnerSearchQuery && (
              <button
                onClick={() => setPartnerSearchQuery('')}
                className="px-2.5 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-sm text-xs transition flex items-center gap-1 cursor-pointer font-sans font-bold"
              >
                <RefreshCw className="w-3 h-3" /> ล้างการค้นหา
              </button>
            )}
          </div>

          {/* Partner Directory List */}
          <div className="bg-white border border-slate-200 rounded-sm shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">ชื่อบริษัทคู่ค้า / ทะเบียน</th>
                    <th className="py-3 px-4">เลขประจำตัวผู้เสียภาษี</th>
                    <th className="py-3 px-4">ที่อยู่ติดต่อ</th>
                    <th className="py-3 px-4">ผู้ประสานงานหลัก</th>
                    <th className="py-3 px-4">ช่องทางติดต่อ</th>
                    <th className="py-3 px-4">บริการ / หมายเหตุ</th>
                    <th className="py-3 px-4 text-center">จัดการข้อมูล</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPartners.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-slate-400 font-sans">
                        ไม่พบข้อมูลรายชื่อบริษัทคู่ค้าในฐานข้อมูล
                      </td>
                    </tr>
                  ) : (
                    paginatedPartners.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-sm shrink-0">
                              <Building2 className="w-3.5 h-3.5" />
                            </span>
                            <div>
                              <span className="font-bold text-slate-800 block">{p.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">ID: {p.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {p.taxId || <span className="text-slate-300 italic">- ไม่ระบุ -</span>}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={p.address}>
                          {p.address || <span className="text-slate-300 italic">- ไม่ระบุ -</span>}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {p.contactPerson || <span className="text-slate-300 italic">- ไม่ระบุ -</span>}
                        </td>
                        <td className="py-3.5 px-4 space-y-1">
                          {p.phone && (
                            <div className="flex items-center gap-1 text-slate-600">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span className="font-mono">{p.phone}</span>
                            </div>
                          )}
                          {p.email && (
                            <div className="flex items-center gap-1 text-slate-600">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-sans truncate max-w-[150px]">{p.email}</span>
                            </div>
                          )}
                          {!p.phone && !p.email && <span className="text-slate-300 italic">- ไม่มีข้อมูล -</span>}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 italic max-w-xs truncate" title={p.notes}>
                          {p.notes || <span className="text-slate-300 italic">- ไม่มีบันทึก -</span>}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditPartner(p)}
                              className="p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-sm transition cursor-pointer"
                              title="แก้ไขข้อมูลคู่ค้า"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setPartnerToDelete(p)}
                              className="p-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-sm transition cursor-pointer"
                              title="ลบข้อมูลคู่ค้า"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPartnerPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-150 px-4 py-3 bg-white">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    disabled={currentPartnerPage === 1}
                    onClick={() => {
                      setCurrentPartnerPage(prev => Math.max(prev - 1, 1));
                      playNotificationSound();
                    }}
                    className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-xs font-medium rounded-sm text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    ก่อนหน้า
                  </button>
                  <button
                    disabled={currentPartnerPage === totalPartnerPages}
                    onClick={() => {
                      setCurrentPartnerPage(prev => Math.min(prev + 1, totalPartnerPages));
                      playNotificationSound();
                    }}
                    className="relative ml-3 inline-flex items-center px-4 py-2 border border-slate-300 text-xs font-medium rounded-sm text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    ถัดไป
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between text-xs font-sans text-slate-500">
                  <div>
                    <p>
                      แสดงคู่ค้าที่ <span className="font-bold text-slate-900">{(currentPartnerPage - 1) * itemsPerPage + 1}</span> ถึง{' '}
                      <span className="font-bold text-slate-900">{Math.min((currentPartnerPage - 1) * itemsPerPage + itemsPerPage, filteredPartners.length)}</span> จากทั้งหมด{' '}
                      <span className="font-bold text-slate-900">{filteredPartners.length}</span> รายการ
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-sm shadow-xs" aria-label="Pagination">
                      <button
                        disabled={currentPartnerPage === 1}
                        onClick={() => {
                          setCurrentPartnerPage(1);
                          playNotificationSound();
                        }}
                        className="relative inline-flex items-center rounded-l-sm px-2.5 py-2 text-slate-400 ring-1 ring-inset ring-slate-305 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                        title="หน้าแรก"
                      >
                        «
                      </button>
                      <button
                        disabled={currentPartnerPage === 1}
                        onClick={() => {
                          setCurrentPartnerPage(prev => Math.max(prev - 1, 1));
                          playNotificationSound();
                        }}
                        className="relative inline-flex items-center px-2.5 py-2 text-slate-400 ring-1 ring-inset ring-slate-305 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                      >
                        ‹ ก่อนหน้า
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: totalPartnerPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPartnerPages || Math.abs(p - currentPartnerPage) <= 1)
                        .map((p, idx, arr) => {
                          const isCurrent = p === currentPartnerPage;
                          return (
                            <React.Fragment key={p}>
                              {idx > 0 && arr[idx - 1] !== p - 1 && (
                                <span className="relative inline-flex items-center px-3 py-2 text-slate-500 ring-1 ring-inset ring-slate-305 bg-white select-none">...</span>
                              )}
                              <button
                                onClick={() => {
                                  setCurrentPartnerPage(p);
                                  playNotificationSound();
                                }}
                                className={`relative inline-flex items-center px-3 py-2 text-xs font-semibold ring-1 ring-inset focus:z-20 focus:outline-offset-0 transition cursor-pointer ${
                                  isCurrent
                                    ? 'z-10 bg-emerald-600 text-white ring-emerald-600'
                                    : 'text-slate-900 ring-slate-305 hover:bg-slate-50 bg-white'
                                }`}
                              >
                                {p}
                              </button>
                            </React.Fragment>
                          );
                        })}

                      <button
                        disabled={currentPartnerPage === totalPartnerPages}
                        onClick={() => {
                          setCurrentPartnerPage(prev => Math.min(prev + 1, totalPartnerPages));
                          playNotificationSound();
                        }}
                        className="relative inline-flex items-center px-2.5 py-2 text-slate-400 ring-1 ring-inset ring-slate-305 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                      >
                        ถัดไป ›
                      </button>
                      <button
                        disabled={currentPartnerPage === totalPartnerPages}
                        onClick={() => {
                          setCurrentPartnerPage(totalPartnerPages);
                          playNotificationSound();
                        }}
                        className="relative inline-flex items-center rounded-r-sm px-2.5 py-2 text-slate-400 ring-1 ring-inset ring-slate-305 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                        title="หน้าสุดท้าย"
                      >
                        »
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL: ADD RECORD */}
      {isAddOpen && (
        <div id="add-partner-billing-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 max-w-lg md:max-w-3xl lg:max-w-4xl w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide font-sans flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" /> เพิ่มข้อมูลเอกสารคู่ค้า & ใบส่งของวางบิล
              </h3>
              <button 
                onClick={() => setIsAddOpen(false)} 
                className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-700 block">ชื่อคู่ค้า / บริษัทพันธมิตร <span className="text-red-500">*</span></label>
                  <button
                    type="button"
                    onClick={handleOpenAddPartner}
                    className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline cursor-pointer bg-transparent border-0 outline-none"
                  >
                    <Plus className="w-3 h-3" /> ลงทะเบียนคู่ค้าใหม่
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={partners.some(p => p.name === partnerName) ? partnerName : ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        setPartnerName(val);
                        const matched = partners.find(p => p.name === val);
                        if (matched) {
                          setContactPerson(matched.contactPerson || '');
                          setPhone(matched.phone || '');
                        }
                      }
                    }}
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white font-sans text-xs font-semibold text-slate-800"
                  >
                    <option value="">-- เลือกจากคู่ค้าในระบบ --</option>
                    {partners.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name} {p.taxId ? `(${p.taxId})` : ''}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="หรือพิมพ์ระบุชื่อด้วยตนเอง..."
                    value={partnerName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPartnerName(val);
                      const matched = partners.find(p => p.name.trim().toLowerCase() === val.trim().toLowerCase());
                      if (matched) {
                        setContactPerson(matched.contactPerson || '');
                        setPhone(matched.phone || '');
                      }
                    }}
                    className="w-1/2 px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-sans text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">เลขที่เอกสารหลัก/อ้างอิง <span className="text-slate-400 font-normal">(เลือกกรอกแยกด้านล่างได้)</span></label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="เช่น DO-9988 / BI-10291"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-mono text-xs"
                  />
                </div>
              </div>

              {/* Delivery & Billing side-by-side in desktop/tablet, stacked in mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Delivery Document Group */}
                <div className="space-y-3 bg-blue-50/20 p-3 rounded-md border border-blue-100/60 flex flex-col justify-between">
                  <div className="space-y-1">
                    <label className="font-semibold text-blue-800 block flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span> 🚚 รายละเอียดใบส่งของ
                    </label>
                    <input
                      type="text"
                      value={deliveryDocNumber}
                      onChange={(e) => setDeliveryDocNumber(e.target.value)}
                      placeholder="เลขที่ใบส่งของ เช่น DO-2026-001"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-mono text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">เล่มที่ (Book No.)</label>
                      <input
                        type="text"
                        value={bookNumber}
                        onChange={(e) => setBookNumber(e.target.value)}
                        placeholder="เล่มที่"
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">เลขที่ (Page No.)</label>
                      <input
                        type="text"
                        value={pageNumber}
                        onChange={(e) => setPageNumber(e.target.value)}
                        placeholder="เลขที่ในเล่ม"
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">ราคา/จำนวนเงิน</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={amount || ''}
                          onChange={(e) => setAmount(e.target.value !== '' ? Number(e.target.value) : '')}
                          placeholder="0.00"
                          min={0}
                          step="any"
                          className="w-full pl-2 pr-5 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-mono font-bold text-xs"
                        />
                        <span className="absolute right-1 top-2 text-slate-400 font-semibold text-[9px]">บ.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing Document Group */}
                <div className="space-y-3 bg-violet-50/20 p-3 rounded-md border border-violet-100/60 flex flex-col justify-between">
                  <div className="space-y-1">
                    <label className="font-semibold text-violet-800 block flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 bg-violet-500 rounded-full"></span> 📄 รายละเอียดใบวางบิล
                    </label>
                    <input
                      type="text"
                      value={billingDocNumber}
                      onChange={(e) => setBillingDocNumber(e.target.value)}
                      placeholder="เลขที่ใบวางบิล เช่น BI-2026-001"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-mono text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">เล่มที่ (Book No.)</label>
                      <input
                        type="text"
                        value={billingBookNumber}
                        onChange={(e) => setBillingBookNumber(e.target.value)}
                        placeholder="เล่มที่"
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">เลขที่ (Page No.)</label>
                      <input
                        type="text"
                        value={billingPageNumber}
                        onChange={(e) => setBillingPageNumber(e.target.value)}
                        placeholder="เลขที่ในเล่ม"
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">ราคา/จำนวนเงิน</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={billingAmount || ''}
                          onChange={(e) => setBillingAmount(e.target.value !== '' ? Number(e.target.value) : '')}
                          placeholder="0.00"
                          min={0}
                          step="any"
                          className="w-full pl-2 pr-5 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-mono font-bold text-xs"
                        />
                        <span className="absolute right-1 top-2 text-slate-400 font-semibold text-[9px]">บ.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Separated Credit Note (CN) No. & CN Amount/Price */}
              <div className="grid grid-cols-2 gap-3 bg-rose-50/30 p-2.5 rounded-sm border border-rose-100/40">
                <div className="space-y-1">
                  <label className="font-semibold text-rose-700 block flex items-center gap-1 text-[11px]">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span> เลขที่ CN (ใบลดหนี้)
                  </label>
                  <input
                    type="text"
                    value={cnDocNumber}
                    onChange={(e) => setCnDocNumber(e.target.value)}
                    placeholder="เช่น CN-2026-001"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-rose-700 block flex items-center gap-1 text-[11px]">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span> ราคา CN (บาท)
                  </label>
                  <input
                    type="number"
                    value={cnAmount || ''}
                    onChange={(e) => setCnAmount(e.target.value !== '' ? Number(e.target.value) : '')}
                    placeholder="0.00"
                    step="any"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-mono text-xs"
                  />
                </div>
              </div>

              {/* Shipping Carrier Selector with Add Feature */}
              <div className="space-y-1 bg-slate-50/30 p-2.5 rounded-sm border border-slate-100">
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700 block text-xs">เลือกบริษัทขนส่ง (Carrier)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewCarrier(!isAddingNewCarrier);
                      playNotificationSound();
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer bg-transparent border-0 outline-none"
                  >
                    {isAddingNewCarrier ? "« เลือกจากรายการ" : "+ เพิ่มขนส่งใหม่"}
                  </button>
                </div>
                
                {!isAddingNewCarrier ? (
                  <select
                    value={transportCarrier}
                    onChange={(e) => setTransportCarrier(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white font-sans text-xs"
                  >
                    <option value="">-- ไม่ระบุ / ไม่ใช้ขนส่ง --</option>
                    {carriers.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={newCarrierInput}
                      onChange={(e) => setNewCarrierInput(e.target.value)}
                      placeholder="ระบุชื่อขนส่ง เช่น Flash, Kerry, รถโรงงาน..."
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = newCarrierInput.trim();
                        if (trimmed && !carriers.includes(trimmed)) {
                          const updated = [...carriers, trimmed];
                          setCarriers(updated);
                          safeStorage.setItem('hr_carriers_list', JSON.stringify(updated));
                          setTransportCarrier(trimmed);
                          setNewCarrierInput('');
                          setIsAddingNewCarrier(false);
                          showSuccess(`เพิ่มขนส่ง "${trimmed}" สำเร็จ`);
                          playNotificationSound();
                        }
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm font-bold text-xs cursor-pointer transition shrink-0 border-0"
                    >
                      เพิ่ม
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">สถานะเอกสาร <span className="text-red-500">*</span></label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white font-sans"
                  >
                    <option value="pending">รอวางบิล / รอดำเนินการ</option>
                    <option value="billed">วางบิลแล้ว / รอชำระเงิน</option>
                    <option value="paid">ชำระเงินเสร็จสิ้นแล้ว</option>
                    <option value="cancelled">ยกเลิกฉบับนี้</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">วันที่ออกเอกสาร <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">กำหนดชำระ / นัดจ่าย <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">ชื่อผู้ติดต่อคู่ค้า</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="คุณสมชาย ใจดี"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <div className="space-y-1 col-span-2">
                  <label className="font-semibold text-slate-700 block">เบอร์โทรศัพท์ผู้ติดต่อ</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="เช่น 08x-xxxxxxx"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">รายละเอียดสินค้า / หมายเหตุเพิ่มเติม</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ระบุรายละเอียดเพิ่มเติม สินค้าที่จัดส่ง หรือเงื่อนไขชำระเงินอื่นๆ..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white"
                ></textarea>
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-sm font-mono font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-mono font-bold uppercase tracking-wider shadow-xs transition cursor-pointer"
                >
                  บันทึกสำเร็จ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT RECORD */}
      {editingBilling && (
        <div id="edit-partner-billing-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 max-w-lg md:max-w-3xl lg:max-w-4xl w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide font-sans flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-blue-600" /> แก้ไขข้อมูลเอกสารคู่ค้า & ใบส่งของวางบิล
              </h3>
              <button 
                onClick={() => setEditingBilling(null)} 
                className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-700 block">ชื่อคู่ค้า / บริษัทพันธมิตร <span className="text-red-500">*</span></label>
                  <button
                    type="button"
                    onClick={handleOpenAddPartner}
                    className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline cursor-pointer bg-transparent border-0 outline-none"
                  >
                    <Plus className="w-3 h-3" /> ลงทะเบียนคู่ค้าใหม่
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={partners.some(p => p.name === partnerName) ? partnerName : ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        setPartnerName(val);
                        const matched = partners.find(p => p.name === val);
                        if (matched) {
                          setContactPerson(matched.contactPerson || '');
                          setPhone(matched.phone || '');
                        }
                      }
                    }}
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white font-sans text-xs font-semibold text-slate-800"
                  >
                    <option value="">-- เลือกจากคู่ค้าในระบบ --</option>
                    {partners.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name} {p.taxId ? `(${p.taxId})` : ''}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="หรือพิมพ์ระบุชื่อด้วยตนเอง..."
                    value={partnerName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPartnerName(val);
                      const matched = partners.find(p => p.name.trim().toLowerCase() === val.trim().toLowerCase());
                      if (matched) {
                        setContactPerson(matched.contactPerson || '');
                        setPhone(matched.phone || '');
                      }
                    }}
                    className="w-1/2 px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-sans text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">เลขที่เอกสารหลัก/อ้างอิง <span className="text-slate-400 font-normal">(เลือกกรอกแยกด้านล่างได้)</span></label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="เช่น DO-9988 / BI-10291"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-mono text-xs"
                  />
                </div>
              </div>

              {/* Delivery & Billing side-by-side in desktop/tablet, stacked in mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Delivery Document Group */}
                <div className="space-y-3 bg-blue-50/20 p-3 rounded-md border border-blue-100/60 flex flex-col justify-between">
                  <div className="space-y-1">
                    <label className="font-semibold text-blue-800 block flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span> 🚚 รายละเอียดใบส่งของ
                    </label>
                    <input
                      type="text"
                      value={deliveryDocNumber}
                      onChange={(e) => setDeliveryDocNumber(e.target.value)}
                      placeholder="เลขที่ใบส่งของ เช่น DO-2026-001"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-mono text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">เล่มที่ (Book No.)</label>
                      <input
                        type="text"
                        value={bookNumber}
                        onChange={(e) => setBookNumber(e.target.value)}
                        placeholder="เล่มที่"
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">เลขที่ (Page No.)</label>
                      <input
                        type="text"
                        value={pageNumber}
                        onChange={(e) => setPageNumber(e.target.value)}
                        placeholder="เลขที่ในเล่ม"
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">ราคา/จำนวนเงิน</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={amount || ''}
                          onChange={(e) => setAmount(e.target.value !== '' ? Number(e.target.value) : '')}
                          placeholder="0.00"
                          min={0}
                          step="any"
                          className="w-full pl-2 pr-5 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-mono font-bold text-xs"
                        />
                        <span className="absolute right-1 top-2 text-slate-400 font-semibold text-[9px]">บ.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing Document Group */}
                <div className="space-y-3 bg-violet-50/20 p-3 rounded-md border border-violet-100/60 flex flex-col justify-between">
                  <div className="space-y-1">
                    <label className="font-semibold text-violet-800 block flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 bg-violet-500 rounded-full"></span> 📄 รายละเอียดใบวางบิล
                    </label>
                    <input
                      type="text"
                      value={billingDocNumber}
                      onChange={(e) => setBillingDocNumber(e.target.value)}
                      placeholder="เลขที่ใบวางบิล เช่น BI-2026-001"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-mono text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">เล่มที่ (Book No.)</label>
                      <input
                        type="text"
                        value={billingBookNumber}
                        onChange={(e) => setBillingBookNumber(e.target.value)}
                        placeholder="เล่มที่"
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">เลขที่ (Page No.)</label>
                      <input
                        type="text"
                        value={billingPageNumber}
                        onChange={(e) => setBillingPageNumber(e.target.value)}
                        placeholder="เลขที่ในเล่ม"
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">ราคา/จำนวนเงิน</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={billingAmount || ''}
                          onChange={(e) => setBillingAmount(e.target.value !== '' ? Number(e.target.value) : '')}
                          placeholder="0.00"
                          min={0}
                          step="any"
                          className="w-full pl-2 pr-5 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-mono font-bold text-xs"
                        />
                        <span className="absolute right-1 top-2 text-slate-400 font-semibold text-[9px]">บ.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Separated Credit Note (CN) No. & CN Amount/Price */}
              <div className="grid grid-cols-2 gap-3 bg-rose-50/30 p-2.5 rounded-sm border border-rose-100/40">
                <div className="space-y-1">
                  <label className="font-semibold text-rose-700 block flex items-center gap-1 text-[11px]">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span> เลขที่ CN (ใบลดหนี้)
                  </label>
                  <input
                    type="text"
                    value={cnDocNumber}
                    onChange={(e) => setCnDocNumber(e.target.value)}
                    placeholder="เช่น CN-2026-001"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-rose-700 block flex items-center gap-1 text-[11px]">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span> ราคา CN (บาท)
                  </label>
                  <input
                    type="number"
                    value={cnAmount || ''}
                    onChange={(e) => setCnAmount(e.target.value !== '' ? Number(e.target.value) : '')}
                    placeholder="0.00"
                    step="any"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-mono text-xs"
                  />
                </div>
              </div>

              {/* Shipping Carrier Selector with Add Feature */}
              <div className="space-y-1 bg-slate-50/30 p-2.5 rounded-sm border border-slate-100">
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700 block text-xs">เลือกบริษัทขนส่ง (Carrier)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewCarrier(!isAddingNewCarrier);
                      playNotificationSound();
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer bg-transparent border-0 outline-none"
                  >
                    {isAddingNewCarrier ? "« เลือกจากรายการ" : "+ เพิ่มขนส่งใหม่"}
                  </button>
                </div>
                
                {!isAddingNewCarrier ? (
                  <select
                    value={transportCarrier}
                    onChange={(e) => setTransportCarrier(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white font-sans text-xs"
                  >
                    <option value="">-- ไม่ระบุ / ไม่ใช้ขนส่ง --</option>
                    {carriers.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={newCarrierInput}
                      onChange={(e) => setNewCarrierInput(e.target.value)}
                      placeholder="ระบุชื่อขนส่ง เช่น Flash, Kerry, รถโรงงาน..."
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = newCarrierInput.trim();
                        if (trimmed && !carriers.includes(trimmed)) {
                          const updated = [...carriers, trimmed];
                          setCarriers(updated);
                          safeStorage.setItem('hr_carriers_list', JSON.stringify(updated));
                          setTransportCarrier(trimmed);
                          setNewCarrierInput('');
                          setIsAddingNewCarrier(false);
                          showSuccess(`เพิ่มขนส่ง "${trimmed}" สำเร็จ`);
                          playNotificationSound();
                        }
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm font-bold text-xs cursor-pointer transition shrink-0 border-0"
                    >
                      เพิ่ม
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">สถานะเอกสาร <span className="text-red-500">*</span></label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white font-sans"
                  >
                    <option value="pending">รอวางบิล / รอดำเนินการ</option>
                    <option value="billed">วางบิลแล้ว / รอชำระเงิน</option>
                    <option value="paid">ชำระเงินเสร็จสิ้นแล้ว</option>
                    <option value="cancelled">ยกเลิกฉบับนี้</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">วันที่ออกเอกสาร <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">กำหนดชำระ / นัดจ่าย <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 bg-white font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">ชื่อผู้ติดต่อคู่ค้า</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="คุณสมชาย ใจดี"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <div className="space-y-1 col-span-2">
                  <label className="font-semibold text-slate-700 block">เบอร์โทรศัพท์ผู้ติดต่อ</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="เช่น 08x-xxxxxxx"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">รายละเอียดสินค้า / หมายเหตุเพิ่มเติม</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ระบุรายละเอียดเพิ่มเติม สินค้าที่จัดส่ง หรือเงื่อนไขชำระเงินอื่นๆ..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white"
                ></textarea>
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBilling(null)}
                  className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-sm font-mono font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-mono font-bold uppercase tracking-wider shadow-xs transition cursor-pointer"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETAILS INSPECTOR */}
      {viewingDetails && (
        <div id="view-partner-billing-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-slate-400" /> ตรวจสอบรายละเอียดเอกสารคู่ค้า
              </h3>
              <button 
                onClick={() => setViewingDetails(null)} 
                className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-4 border border-slate-100 rounded-sm space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] text-slate-400 font-mono">ID: {viewingDetails.id}</span>
                  {getDocTypeBadge(viewingDetails.docType)}
                </div>
                <h4 className="font-extrabold text-sm text-slate-800 font-sans leading-tight mt-1">{viewingDetails.partnerName}</h4>
              </div>

              <div className="space-y-2 border border-slate-100 p-3.5 rounded-sm">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">เลขที่เอกสารอ้างอิงหลัก:</span>
                  <span className="font-mono font-bold text-slate-800">{viewingDetails.docNumber}</span>
                </div>
                {viewingDetails.deliveryDocNumber && (
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">เลขที่ใบส่งของ:</span>
                    <span className="font-mono font-bold text-blue-600">{viewingDetails.deliveryDocNumber}</span>
                  </div>
                )}
                {viewingDetails.billingDocNumber && (
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">เลขที่ใบวางบิล:</span>
                    <span className="font-mono font-bold text-violet-600">{viewingDetails.billingDocNumber}</span>
                  </div>
                )}
                {viewingDetails.bookNumber && (
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">เล่มที่ใบส่งของ (Book No.):</span>
                    <span className="font-mono font-bold text-slate-800">{viewingDetails.bookNumber}</span>
                  </div>
                )}
                {viewingDetails.pageNumber && (
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">เลขที่ใบส่งของ (Page No.):</span>
                    <span className="font-mono font-bold text-slate-800">{viewingDetails.pageNumber}</span>
                  </div>
                )}
                {viewingDetails.billingBookNumber && (
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">เล่มที่ใบวางบิล (Book No.):</span>
                    <span className="font-mono font-bold text-slate-800">{viewingDetails.billingBookNumber}</span>
                  </div>
                )}
                {viewingDetails.billingPageNumber && (
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">เลขที่ใบวางบิล (Page No.):</span>
                    <span className="font-mono font-bold text-slate-800">{viewingDetails.billingPageNumber}</span>
                  </div>
                )}
                {viewingDetails.transportCarrier && (
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">ขนส่ง:</span>
                    <span className="font-sans font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-xs text-[10px]">{viewingDetails.transportCarrier}</span>
                  </div>
                )}
                {viewingDetails.cnDocNumber && (
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">เลขที่ CN (ใบลดหนี้):</span>
                    <span className="font-mono font-bold text-rose-600">{viewingDetails.cnDocNumber}</span>
                  </div>
                )}
                {viewingDetails.cnAmount !== undefined && (
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">จำนวนเงิน/ราคา CN:</span>
                    <span className="font-mono font-bold text-rose-600">฿{viewingDetails.cnAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">ราคาใบส่งของ:</span>
                  <span className="font-mono font-bold text-slate-800">฿{viewingDetails.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {viewingDetails.billingAmount !== undefined && (
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">ราคาใบวางบิล:</span>
                    <span className="font-mono font-bold text-violet-700">฿{viewingDetails.billingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {viewingDetails.cnAmount !== undefined && viewingDetails.cnAmount > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-50 bg-emerald-50/50 px-1 rounded-xs">
                    <span className="text-emerald-700 font-bold">ยอดที่ต้องจ่าย (หัก CN):</span>
                    <span className="font-mono font-black text-emerald-600 text-sm">฿{((viewingDetails.billingAmount !== undefined ? viewingDetails.billingAmount : viewingDetails.amount) - viewingDetails.cnAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">วันที่ออกเอกสาร:</span>
                  <span className="font-mono text-slate-700">{viewingDetails.issueDate}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">กำหนดจ่าย/วางบิล:</span>
                  <span className="font-mono font-bold text-slate-700">{viewingDetails.dueDate}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">สถานะปัจจุบัน:</span>
                  <span>{getStatusBadge(viewingDetails.status)}</span>
                </div>
              </div>

              {(viewingDetails.contactPerson || viewingDetails.phone) && (
                <div className="border border-slate-100 p-3.5 rounded-sm space-y-2 bg-blue-50/25">
                  <h5 className="font-bold text-slate-700 font-sans">ข้อมูลผู้ติดต่อคู่ค้า</h5>
                  {viewingDetails.contactPerson && (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{viewingDetails.contactPerson}</span>
                    </div>
                  )}
                  {viewingDetails.phone && (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono">{viewingDetails.phone}</span>
                    </div>
                  )}
                </div>
              )}

              {viewingDetails.notes && (
                <div className="space-y-1.5">
                  <span className="font-semibold text-slate-400 block">หมายเหตุ / สินค้า / บริการ:</span>
                  <div className="bg-slate-50 border border-slate-100 rounded-sm p-3 text-slate-700 italic leading-relaxed">
                    &ldquo;{viewingDetails.notes}&rdquo;
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setViewingDetails(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAFETY DELETION WARNING MODAL */}
      {billingToDelete && (
        <div id="delete-partner-billing-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-red-600 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600 animate-pulse" /> ยืนยันการลบเอกสารออกจากระบบ
              </h3>
              <button 
                onClick={() => setBillingToDelete(null)} 
                className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600">
              <div className="bg-rose-50 border border-rose-100 rounded-sm p-4 flex gap-3 text-rose-800">
                <div>
                  <p className="font-bold">⚠️ คำเตือนความปลอดภัยระบบการเงิน:</p>
                  <p className="mt-1 leading-relaxed">
                    คุณกำลังจะลบเอกสาร <strong>{getDocTypeLabel(billingToDelete.docType)}</strong> เลขที่ <strong>{billingToDelete.docNumber}</strong> ของ <strong>{billingToDelete.partnerName}</strong> ออกจากฐานข้อมูลโดยถาวร การดำเนินการนี้ไม่สามารถย้อนคืนได้
                  </p>
                </div>
              </div>

              <div className="border border-slate-100 rounded-sm p-3.5 bg-slate-50/50 space-y-2">
                <p><strong>ชื่อคู่ค้า:</strong> {billingToDelete.partnerName}</p>
                <p><strong>ประเภทและเลขที่:</strong> {getDocTypeLabel(billingToDelete.docType)} ({billingToDelete.docNumber})</p>
                <p><strong>จำนวนเงินสุทธิ:</strong> ฿{billingToDelete.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p><strong>วันที่ออกเอกสาร / ครบกำหนด:</strong> {billingToDelete.issueDate} / {billingToDelete.dueDate}</p>
                <p><strong>สถานะปัจจุบัน:</strong> <span className="font-bold">{getStatusLabel(billingToDelete.status)}</span></p>
              </div>

              <p className="text-[11px] text-slate-400 text-center">
                กรุณาตรวจสอบความถูกต้องของรายการ หรือยืนยันเมื่อได้รับอนุมัติจากฝ่ายบัญชีเท่านั้น
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setBillingToDelete(null)}
                className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteBilling(billingToDelete.id);
                  setBillingToDelete(null);
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-sm text-xs font-mono font-bold uppercase tracking-wider shadow-sm transition cursor-pointer"
              >
                ยืนยันลบข้อมูลถาวร
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD PARTNER */}
      {isAddPartnerOpen && (
        <div id="add-partner-modal" className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide font-sans flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" /> เพิ่มข้อมูลบริษัทคู่ค้าใหม่
              </h3>
              <button 
                onClick={() => setIsAddPartnerOpen(false)} 
                className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPartnerSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">ชื่อบริษัทคู่ค้า / ซัพพลายเออร์ <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  placeholder="เช่น บริษัท สยามโลจิสติกส์ จำกัด"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-emerald-500 text-slate-700 bg-white font-sans"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
                  <input
                    type="text"
                    value={pTaxId}
                    onChange={(e) => setPTaxId(e.target.value)}
                    placeholder="เลข 13 หลัก"
                    maxLength={13}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-emerald-500 text-slate-700 bg-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">ผู้ติดต่อหลัก (Contact Person)</label>
                  <input
                    type="text"
                    value={pContactPerson}
                    onChange={(e) => setPContactPerson(e.target.value)}
                    placeholder="ชื่อผู้ประสานงานหลัก"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-emerald-500 text-slate-700 bg-white font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="text"
                    value={pPhone}
                    onChange={(e) => setPPhone(e.target.value)}
                    placeholder="เช่น 02-123-4567, 089-123-4567"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-emerald-500 text-slate-700 bg-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">อีเมลติดต่อ</label>
                  <input
                    type="email"
                    value={pEmail}
                    onChange={(e) => setPEmail(e.target.value)}
                    placeholder="contact@company.com"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-emerald-500 text-slate-700 bg-white font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">ที่อยู่สำนักงาน / คลังสินค้า</label>
                <textarea
                  value={pAddress}
                  onChange={(e) => setPAddress(e.target.value)}
                  placeholder="ระบุที่อยู่จัดส่งและออกใบกำกับภาษี..."
                  rows={2}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-emerald-500 text-slate-700 bg-white font-sans resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">รายละเอียดบริการ / หมายเหตุเพิ่มเติม</label>
                <textarea
                  value={pNotes}
                  onChange={(e) => setPNotes(e.target.value)}
                  placeholder="เช่น ผลิตภัณฑ์ที่สั่งบ่อย, รอบจัดส่ง, เครดิตเทอม"
                  rows={2}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-emerald-500 text-slate-700 bg-white font-sans resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddPartnerOpen(false)}
                  className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-sm font-mono font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm font-mono font-bold uppercase tracking-wider shadow-xs transition cursor-pointer"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PARTNER */}
      {editingPartner && (
        <div id="edit-partner-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide font-sans flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" /> แก้ไขข้อมูลบริษัทคู่ค้า
              </h3>
              <button 
                onClick={() => setEditingPartner(null)} 
                className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditPartnerSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">ชื่อบริษัทคู่ค้า / ซัพพลายเออร์ <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  placeholder="เช่น บริษัท สยามโลจิสติกส์ จำกัด"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-emerald-500 text-slate-700 bg-white font-sans"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
                  <input
                    type="text"
                    value={pTaxId}
                    onChange={(e) => setPTaxId(e.target.value)}
                    placeholder="เลข 13 หลัก"
                    maxLength={13}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-emerald-500 text-slate-700 bg-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">ผู้ติดต่อหลัก (Contact Person)</label>
                  <input
                    type="text"
                    value={pContactPerson}
                    onChange={(e) => setPContactPerson(e.target.value)}
                    placeholder="ชื่อผู้ประสานงานหลัก"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-emerald-500 text-slate-700 bg-white font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="text"
                    value={pPhone}
                    onChange={(e) => setPPhone(e.target.value)}
                    placeholder="เช่น 02-123-4567, 089-123-4567"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-emerald-500 text-slate-700 bg-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">อีเมลติดต่อ</label>
                  <input
                    type="email"
                    value={pEmail}
                    onChange={(e) => setPEmail(e.target.value)}
                    placeholder="contact@company.com"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-emerald-500 text-slate-700 bg-white font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">ที่อยู่สำนักงาน / คลังสินค้า</label>
                <textarea
                  value={pAddress}
                  onChange={(e) => setPAddress(e.target.value)}
                  placeholder="ระบุที่อยู่จัดส่งและออกใบกำกับภาษี..."
                  rows={2}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-emerald-500 text-slate-700 bg-white font-sans resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">รายละเอียดบริการ / หมายเหตุเพิ่มเติม</label>
                <textarea
                  value={pNotes}
                  onChange={(e) => setPNotes(e.target.value)}
                  placeholder="เช่น ผลิตภัณฑ์ที่สั่งบ่อย, รอบจัดส่ง, เครดิตเทอม"
                  rows={2}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-sm focus:outline-none focus:border-emerald-500 text-slate-700 bg-white font-sans resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPartner(null)}
                  className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-sm font-mono font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm font-mono font-bold uppercase tracking-wider shadow-xs transition cursor-pointer"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SAFETY DELETION WARNING MODAL: PARTNER */}
      {partnerToDelete && (
        <div id="delete-partner-modal" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-red-600 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600 animate-pulse" /> ยืนยันการลบข้อมูลบริษัทคู่ค้า
              </h3>
              <button 
                onClick={() => setPartnerToDelete(null)} 
                className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600">
              <div className="bg-rose-50 border border-rose-100 rounded-sm p-4 flex gap-3 text-rose-800">
                <div>
                  <p className="font-bold">⚠️ คำเตือนระบบ:</p>
                  <p className="mt-1 leading-relaxed">
                    คุณกำลังจะลบข้อมูลของบริษัท <strong>{partnerToDelete.name}</strong> ออกจากระบบทำเนียบคู่ค้าอย่างถาวร ประวัติและเอกสารใบวางบิลใดๆ จะยังคงอยู่แต่ชื่อบริษัทจะไม่ปรากฏให้เลือกอีกต่อไป
                  </p>
                </div>
              </div>

              <div className="border border-slate-100 rounded-sm p-3.5 bg-slate-50/50 space-y-1">
                <p><strong>ชื่อบริษัทคู่ค้า:</strong> {partnerToDelete.name}</p>
                {partnerToDelete.taxId && <p><strong>เลขผู้เสียภาษี:</strong> {partnerToDelete.taxId}</p>}
                {partnerToDelete.contactPerson && <p><strong>ผู้ติดต่อหลัก:</strong> {partnerToDelete.contactPerson}</p>}
                {partnerToDelete.phone && <p><strong>เบอร์โทรศัพท์:</strong> {partnerToDelete.phone}</p>}
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPartnerToDelete(null)}
                className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDeletePartnerConfirm}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-sm text-xs font-mono font-bold uppercase tracking-wider shadow-sm transition cursor-pointer"
              >
                ยืนยันลบข้อมูลถาวร
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BILLINGS PENDING PAYMENT ALERTS */}
      {isNotificationOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-fade-in text-xs">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                  <AlertCircle className="w-4 h-4 animate-pulse text-rose-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 font-sans">
                    รายการแจ้งเตือนเอกสารค้างชำระเงิน
                  </h3>
                  <p className="text-[10px] text-slate-400 font-sans">
                    รายการสถานะ "วางบิลแล้ว/รอชำระ" ที่ยังไม่ได้ชำระเงิน
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsNotificationOpen(false)} 
                className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {unPaidBilledBillings.length === 0 ? (
                <div className="text-center py-8 px-4 bg-emerald-50 border border-emerald-100 rounded-sm space-y-2">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-emerald-800">ไม่มีเอกสารค้างชำระในฐานข้อมูล!</p>
                  <p className="text-[10px] text-emerald-600">เอกสารที่วางบิลทั้งหมดได้รับการชำระเงินเรียบร้อยแล้ว</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-sm flex justify-between items-center">
                    <span>ตารางแสดงเอกสารค้างรับ/ค้างจ่าย</span>
                    <span>พบทั้งหมด {unPaidBilledBillings.length} รายการ</span>
                  </div>
                  
                  {unPaidBilledBillings.map(item => {
                    // Calculate if overdue
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const due = new Date(item.dueDate);
                    due.setHours(0,0,0,0);
                    const isOverdue = today.getTime() > due.getTime();
                    const diffTime = Math.abs(today.getTime() - due.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    return (
                      <div key={item.id} className={`p-3.5 border rounded-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition ${
                        isOverdue 
                          ? 'bg-rose-50/40 border-rose-200 hover:bg-rose-50/70' 
                          : 'bg-white border-slate-200 hover:border-slate-350'
                      }`}>
                        
                        {/* Info details */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-slate-800 font-sans truncate">{item.partnerName}</span>
                            {getDocTypeBadge(item.docType)}
                            {isOverdue ? (
                              <span className="px-2 py-0.2 bg-red-100 text-red-700 border border-red-200 text-[10px] font-black rounded-sm">
                                ⚠️ เกินกำหนดชำระ {diffDays} วัน
                              </span>
                            ) : (
                              <span className="px-2 py-0.2 bg-blue-50 text-blue-700 border border-blue-150 text-[10px] font-semibold rounded-sm">
                                📅 อีก {diffDays} วันครบกำหนด
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-[11px] text-slate-500">
                            <div>
                              <span className="font-semibold text-slate-400">เลขที่เอกสาร:</span>{' '}
                              <span className="font-mono font-bold text-slate-700">{item.docNumber}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-400">วันครบกำหนด:</span>{' '}
                              <span className="font-mono text-slate-700">{item.dueDate}</span>
                            </div>
                            {item.contactPerson && (
                              <div className="col-span-2 sm:col-span-1 truncate">
                                <span className="font-semibold text-slate-400">ผู้ติดต่อ:</span>{' '}
                                <span className="text-slate-700">{item.contactPerson}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center gap-3.5 self-end md:self-auto flex-shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">จำนวนเงินสุทธิ</span>
                            <span className="text-sm font-black text-slate-900 font-mono">฿{item.amount.toLocaleString()}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* View Document details button */}
                            <button
                              type="button"
                              onClick={() => {
                                setViewingDetails(item);
                                setIsNotificationOpen(false);
                              }}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-sm cursor-pointer transition border border-slate-200"
                              title="ดูรายละเอียดเอกสาร"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Mark as paid button */}
                            <button
                              type="button"
                              onClick={() => {
                                handleMarkAsPaid(item);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-sm cursor-pointer transition flex items-center gap-1 shadow-2xs"
                              title="บันทึกว่าชำระเงินแล้ว"
                            >
                              <Check className="w-3 h-3 text-white" />
                              <span>ชำระเงินแล้ว</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center border-t border-slate-100 pt-3 text-[11px] text-slate-500">
              <span className="italic">* เมื่อคลิก "ชำระเงินแล้ว" ระบบจะปรับปรุงสถานะและปลดการแจ้งเตือนทันที</span>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('billed');
                  setActiveSubTab('documents');
                  setIsNotificationOpen(false);
                }}
                className="px-3 py-1 bg-slate-150 hover:bg-slate-200 text-slate-700 rounded-sm font-bold transition flex items-center gap-1 cursor-pointer border-0"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>ไปที่บอร์ดเอกสารค้างจ่าย</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🚚 CARRIER MANAGEMENT MODAL */}
      {isCarrierManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in no-print">
          <div className="bg-white rounded-md shadow-2xl border border-slate-200 w-full max-w-xl p-6 space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-sm">
                  <Truck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 font-sans uppercase tracking-wide">
                    จัดการบริษัทขนส่ง (Carrier Management)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-sans">
                    เพิ่ม แก้ไข และลบรายชื่อบริษัทขนส่งสำหรับเลือกใช้งานในใบวางบิล/จัดส่ง
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCarrierManagerOpen(false);
                  setEditingCarrierIndex(null);
                }}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer border-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add New Carrier Box */}
            <div className="bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-sm space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                + เพิ่มบริษัทขนส่งใหม่ลงระบบ
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCarrierInput}
                  onChange={(e) => setNewCarrierInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewCarrier();
                    }
                  }}
                  placeholder="ระบุชื่อบริษัทขนส่ง เช่น SCG Express, Kerry, DHL..."
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-sm text-xs bg-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddNewCarrier()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-sm cursor-pointer transition shrink-0 flex items-center gap-1 border-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มขนส่ง</span>
                </button>
              </div>
            </div>

            {/* Search Carrier Filter */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={carrierSearchQuery}
                onChange={(e) => setCarrierSearchQuery(e.target.value)}
                placeholder="ค้นหารายชื่อบริษัทขนส่ง..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-sm text-xs bg-white focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>

            {/* Carriers List Table */}
            <div className="border border-slate-200 rounded-sm overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase font-bold">
                  <tr>
                    <th className="py-2 px-3">ลำดับ</th>
                    <th className="py-2 px-3">ชื่อบริษัทขนส่ง (Carrier Name)</th>
                    <th className="py-2 px-3 text-center">เอกสารอ้างอิง</th>
                    <th className="py-2 px-3 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {carriers
                    .filter(c => c.toLowerCase().includes(carrierSearchQuery.toLowerCase()))
                    .map((carrierName, idx) => {
                      const docCount = billings.filter(b => b.transportCarrier === carrierName).length;
                      const originalIndex = carriers.indexOf(carrierName);
                      const isEditing = editingCarrierIndex === originalIndex;

                      return (
                        <tr key={carrierName + idx} className="hover:bg-slate-50/60 transition">
                          <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                            #{originalIndex + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingCarrierValue}
                                onChange={(e) => setEditingCarrierValue(e.target.value)}
                                className="px-2 py-1 border border-indigo-300 rounded-xs text-xs bg-white w-full focus:outline-none font-medium"
                                autoFocus
                              />
                            ) : (
                              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                {carrierName}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              docCount > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {docCount} ฉบับ
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-1.5">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditCarrier(originalIndex)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xs font-bold text-[10px] cursor-pointer border-0"
                                >
                                  บันทึก
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCarrierIndex(null)}
                                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xs font-bold text-[10px] cursor-pointer border-0"
                                >
                                  ยกเลิก
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCarrierIndex(originalIndex);
                                    setEditingCarrierValue(carrierName);
                                  }}
                                  className="p-1 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-xs transition cursor-pointer border-0"
                                  title="แก้ไขชื่อขนส่ง"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCarrierToDelete(carrierName)}
                                  className="p-1 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xs transition cursor-pointer border-0"
                                  title="ลบบริษัทขนส่ง"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2 text-[11px] text-slate-400 border-t border-slate-100">
              <span>รวมทั้งสิ้น <strong>{carriers.length}</strong> บริษัทขนส่ง</span>
              <button
                type="button"
                onClick={() => setIsCarrierManagerOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-sm cursor-pointer transition border-0"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ DELETE CARRIER CONFIRMATION WARNING MODAL */}
      {carrierToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-fade-in no-print">
          <div className="bg-white rounded-md shadow-2xl border border-rose-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-full shrink-0 animate-bounce">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-rose-900 font-sans">
                  ยืนยันการลบบริษัทขนส่ง? (Confirm Delete Carrier)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  คุณต้องการลบบริษัทขนส่ง <strong className="text-rose-700 font-bold">"{carrierToDelete}"</strong> ออกจากฐานข้อมูลระบบใช่หรือไม่?
                </p>
                {billings.filter(b => b.transportCarrier === carrierToDelete).length > 0 && (
                  <p className="text-[11px] text-amber-600 bg-amber-50 p-2 rounded-xs border border-amber-200 mt-2 font-sans leading-relaxed">
                    ⚠️ คำเตือน: มีเอกสารในระบบจำนวน <strong>{billings.filter(b => b.transportCarrier === carrierToDelete).length} ฉบับ</strong> ที่ใช้บริษัทขนส่งนี้อยู่ การลบจะทำให้ออกจากตัวเลือก แต่ไม่ส่งผลกระทบต่อประวัติเอกสารเดิม
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCarrierToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-sm cursor-pointer transition border-0"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCarrier}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-sm cursor-pointer transition flex items-center gap-1.5 shadow-xs border-0"
              >
                <Trash2 className="w-4 h-4 text-white" />
                <span>ยืนยันลบบริษัทขนส่ง</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
