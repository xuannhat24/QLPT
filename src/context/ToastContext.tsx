import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%', scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: 20, x: '-50%', scale: 0.95 }}
            className={`fixed bottom-12 left-1/2 z-[9999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md min-w-[320px] max-w-md ${
              toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400/20 text-white' :
              toast.type === 'error' ? 'bg-red-500/90 border-red-400/20 text-white' :
              toast.type === 'warning' ? 'bg-amber-500/90 border-amber-400/20 text-white' :
              'bg-blue-500/90 border-blue-400/20 text-white'
            }`}
          >
            <div className="shrink-0">
              {toast.type === 'success' && <CheckCircle className="w-6 h-6" />}
              {toast.type === 'error' && <XCircle className="w-6 h-6" />}
              {toast.type === 'warning' && <AlertCircle className="w-6 h-6" />}
              {toast.type === 'info' && <Info className="w-6 h-6" />}
            </div>
            <p className="font-bold text-sm leading-tight">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
};
