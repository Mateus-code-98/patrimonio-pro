import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import * as LucideIcons from 'lucide-react';
import { ChevronDown, X } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
  icon?: string;
}

interface CustomSelectProps {
  value: any;
  onChange: (value: any) => void;
  options: Option[];
  label?: string;
  className?: string;
  buttonClassName?: string;
  multiple?: boolean;
  disabled?: boolean;
  disableClear?: boolean;
}

// Helper for dynamic icons
const Icon = ({ name, className }: { name: string; className?: string }) => {
  if (name?.startsWith("data:")) {
    return <img src={name} className={className || "w-4 h-4 rounded shadow-sm"} alt="icon" />;
  }
  const LucideIcon = (LucideIcons as any)[name] || LucideIcons.Wallet;
  return <LucideIcon className={className || "w-4 h-4"} />;
};

export function CustomSelect({ 
  value, 
  onChange, 
  options, 
  label, 
  className = "", 
  buttonClassName = "",
  multiple = false,
  disabled = false,
  disableClear = false,
}: CustomSelectProps) {
  const filteredOptions = options.filter(o => {
    if (multiple && Array.isArray(value) && value.includes(o.value)) return false;
    return true;
  });

  const selectedOptions = multiple 
    ? (Array.isArray(value) ? options.filter(o => value.includes(o.value)) : [])
    : [options.find(o => o.value === value)].filter(Boolean);

  const handleClearAll = (e: React.MouseEvent) => {
    if (disableClear) return;
    e.stopPropagation();
    onChange(multiple ? [] : null);
  };

  const handleRemove = (e: React.MouseEvent, val: any) => {
    if (disableClear) return;
    e.stopPropagation();
    if (multiple && Array.isArray(value)) {
      onChange(value.filter(v => v !== val));
    } else {
      onChange("");
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {label && <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1.5 block">{label}</label>}
      <Listbox value={value} onChange={onChange} multiple={multiple} disabled={disabled}>
        <div className="relative">
          <Listbox.Button as="div" className={`relative w-full cursor-default rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600 shadow-xl ${disabled ? 'opacity-50 cursor-not-allowed bg-zinc-900 border border-zinc-800 px-4 text-left h-[38px] flex items-center text-zinc-500' : (buttonClassName || 'bg-zinc-900 border border-zinc-800 px-4 text-left h-[38px] flex items-center text-zinc-200 sm:text-xs font-bold hover:bg-zinc-800/80')}`}>
            <div className="flex flex-wrap gap-1 pr-6">
              {selectedOptions.length > 0 ? (
                selectedOptions.map((opt, idx) => (
                  <span key={idx} className={`group flex items-center gap-1.5 ${multiple ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-tight' : 'text-zinc-200'}`}>
                    {opt.icon && <Icon name={opt.icon} className={`w-3 h-3 ${multiple ? 'text-emerald-500/70' : 'text-zinc-500'}`} />}
                    <span className="block truncate">{opt.label}</span>
                    {multiple && !disabled && !disableClear && (
                      <button
                        type="button"
                        onClick={(e) => handleRemove(e, opt.value)}
                        className="p-0.5 hover:bg-emerald-500/20 rounded-full transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </span>
                ))
              ) : (
                <span className="text-zinc-600 italic">Selecione...</span>
              )}
            </div>
            <span className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
              {selectedOptions.length > 0 && !disabled && !disableClear && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="p-1 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <ChevronDown
                className="h-4 w-4 text-zinc-500 pointer-events-none"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-50 mt-1 max-h-60 min-w-full w-max overflow-auto rounded-xl bg-zinc-900 py-1 text-xs shadow-2xl ring-1 ring-black/5 focus:outline-none border border-zinc-800 backdrop-blur-xl">
              {filteredOptions.length === 0 ? (
                <div className="py-4 px-4 text-center text-zinc-600 italic">Nenhum resultado</div>
              ) : (
                filteredOptions.map((option, optionIdx) => (
                  <Listbox.Option
                    key={optionIdx}
                    className={({ active, selected }) =>
                      `relative cursor-default select-none py-2.5 px-4 transition-all ${
                        selected ? 'bg-emerald-500/10' : active ? 'bg-zinc-800' : ''
                      }`
                    }
                    value={option.value}
                  >
                  {({ selected }) => (
                    <span
                      className={`flex items-center gap-2 ${
                        selected ? 'font-black text-emerald-500' : 'font-bold text-zinc-400'
                      } uppercase text-[10px] tracking-tight`}
                    >
                      {option.icon && <Icon name={option.icon} className={`w-3.5 h-3.5 ${selected ? 'text-emerald-500' : 'text-zinc-500'}`} />}
                      <span className="block truncate">{option.label}</span>
                    </span>
                  )}
                </Listbox.Option>
              )))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}
