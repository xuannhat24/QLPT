import React from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StoreSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
}

export const StoreSearchBar = ({ value, onChange, onClear, placeholder = "Tìm kiếm đồ dùng giá hời...", className = "" }: StoreSearchBarProps) => {
  return (
    <div className={`relative w-full group ${className}`}>
      {/* Icon Search */}
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5 group-focus-within:text-primary transition-colors" />
      
      {/* Search Input */}
      <input 
        className="w-full pl-12 pr-12 py-3 bg-slate-100 hover:bg-slate-200/50 focus:bg-white border-2 border-transparent focus:border-primary/20 rounded-2xl text-sm font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 placeholder:font-semibold" 
        placeholder={placeholder} 
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {/* Clear Button */}
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-xl bg-slate-200 text-slate-500 hover:bg-rose-100 hover:text-rose-500 transition-all shadow-sm"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Border Glow for Premium feel */}
      <div className="absolute inset-0 -z-10 bg-primary/10 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
};
