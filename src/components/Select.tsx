import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string; // Additional classes for the button
  dropdownWidth?: string; // E.g., 'w-56', 'w-full'
}

export const Select = ({ 
  options, 
  value, 
  onChange, 
  className = '', 
  dropdownWidth = 'w-56' 
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className={`flex items-center justify-between gap-2 bg-white border ${
          isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200'
        } text-slate-700 font-bold rounded-xl text-sm pl-4 pr-3 py-2 cursor-pointer hover:border-primary/50 transition-all shadow-sm ${className}`}
      >
        <span className="text-left truncate">{selectedOption?.label}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 py-2 ${dropdownWidth}`}
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm font-semibold transition-colors flex items-center justify-between group
                  ${value === option.value 
                    ? 'bg-primary/5 text-primary' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                {option.label}
                {value === option.value && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
