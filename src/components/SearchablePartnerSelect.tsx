import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, ChevronDown, Plus, Building2, CheckCircle2 } from 'lucide-react';
import { PartnerCompany } from '../types';

export interface SearchablePartnerSelectProps {
  value: string;
  onChange: (value: string) => void;
  partners: PartnerCompany[];
  onSelectPartner?: (partner: PartnerCompany) => void;
  onAddNewPartner?: () => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function SearchablePartnerSelect({
  value,
  onChange,
  partners = [],
  onSelectPartner,
  onAddNewPartner,
  placeholder = "พิมพ์ค้นหาชื่อบริษัทคู่ค้า / พิมพ์ระบุชื่อด้วยตนเอง...",
  required = false,
  className = ""
}: SearchablePartnerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter partners based on input search query
  const filteredPartners = useMemo(() => {
    if (!value || !value.trim()) return partners;
    const q = value.toLowerCase().trim();
    return partners.filter(p => 
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.taxId && p.taxId.toLowerCase().includes(q)) ||
      (p.contactPerson && p.contactPerson.toLowerCase().includes(q)) ||
      (p.phone && p.phone.includes(q))
    );
  }, [partners, value]);

  // Handle manual typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    onChange(newVal);
    setIsOpen(true);

    // Check if typed text matches an existing partner exactly
    const matched = partners.find(p => p.name.trim().toLowerCase() === newVal.trim().toLowerCase());
    if (matched && onSelectPartner) {
      onSelectPartner(matched);
    }
  };

  const handleSelectOption = (partner: PartnerCompany) => {
    onChange(partner.name);
    if (onSelectPartner) {
      onSelectPartner(partner);
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-8 pr-16 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-indigo-500 bg-white font-sans text-xs text-slate-800 font-medium transition-colors shadow-2xs"
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
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer border-0 bg-transparent transition-colors"
              title="ล้างข้อความ"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer border-0 bg-transparent transition-transform"
            title="เลือกคู่ค้าจากรายการ"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-2xl max-h-60 overflow-y-auto animate-fade-in font-sans">
          <div className="p-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-[11px] font-bold text-slate-600 sticky top-0 z-10">
            <span>ค้นพบคู่ค้าในระบบ ({filteredPartners.length} ราย)</span>
            {onAddNewPartner && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onAddNewPartner();
                }}
                className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer bg-transparent border-0 hover:underline"
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
                    onClick={() => handleSelectOption(p)}
                    className={`p-2.5 hover:bg-indigo-50/80 transition cursor-pointer flex justify-between items-center ${
                      isSelected ? 'bg-indigo-50 border-l-3 border-indigo-600' : ''
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="font-bold text-xs text-slate-800 truncate">{p.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 pl-5">
                        {p.taxId && <span>เลขภาษี: <strong className="font-mono text-slate-700">{p.taxId}</strong></span>}
                        {p.contactPerson && <span>ผู้ติดต่อ: {p.contactPerson}</span>}
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
            <div className="p-3.5 text-center space-y-2">
              <p className="text-xs text-slate-500">
                ไม่พบข้อมูลคู่ค้าที่ค้นหาด้วยคำว่า <strong className="text-slate-800 font-semibold">"{value}"</strong>
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-sm cursor-pointer border border-indigo-200 transition"
                >
                  ใช้ชื่อ "{value}" นี้ระบุเอง
                </button>
                {onAddNewPartner && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onAddNewPartner();
                    }}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-sm cursor-pointer transition flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> ลงทะเบียนคู่ค้าใหม่
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
