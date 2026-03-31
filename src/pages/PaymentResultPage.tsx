import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, ShoppingBag, ArrowRight } from 'lucide-react';

interface PaymentResultPageProps {
  onNavigate: (page: string) => void;
}

export const PaymentResultPage = ({ onNavigate }: PaymentResultPageProps) => {
  const [status, setStatus] = useState<'success' | 'failed' | 'loading'>('loading');
  const [amount, setAmount] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');

  useEffect(() => {
    // VNPAY redirect return url parameters via URLSearchParams
    const params = new URLSearchParams(window.location.search);
    const vnp_ResponseCode = params.get('vnp_ResponseCode');
    const vnp_Amount = params.get('vnp_Amount');
    const vnp_TxnRef = params.get('vnp_TxnRef');

    if (vnp_ResponseCode === '00') {
      setStatus('success');
    } else {
      setStatus('failed');
    }

    if (vnp_Amount) {
      // Amount is returned marked up * 100 in VNPAY
      setAmount((parseInt(vnp_Amount) / 100).toLocaleString('vi-VN') + ' đ');
    }
    if (vnp_TxnRef) {
      setOrderId(vnp_TxnRef);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white p-10 rounded-[40px] max-w-md w-full shadow-2xl shadow-slate-200/50 text-center"
      >
        {status === 'loading' ? (
           <div className="py-20 flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-6 font-bold text-slate-500">Đang nhận kết quả thanh toán...</p>
           </div>
        ) : status === 'success' ? (
          <>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-28 h-28 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/10"
            >
               <CheckCircle2 strokeWidth={3} className="w-14 h-14" />
            </motion.div>
            <h1 className="text-3xl font-black text-slate-900 mb-2 font-display">Thanh toán thành công!</h1>
            <p className="text-slate-500 font-medium leading-relaxed mb-8">
               Cảm ơn bạn đã mua sắm. Đơn của bạn đã được thanh toán minh bạch qua chuẩn VNPAY.
            </p>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4 mb-8 text-left shadow-inner">
               <div className="flex justify-between items-center text-sm font-bold border-b border-slate-200 pb-3">
                  <span className="text-slate-400">Số tiền:</span>
                  <span className="text-green-600 text-2xl font-black">{amount}</span>
               </div>
               <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-400">Mã hợp đồng/giao dịch:</span>
                  <span className="text-slate-900 bg-slate-200 px-3 py-1 rounded-lg text-xs tracking-wider">{orderId}</span>
               </div>
            </div>
          </>
        ) : (
          <>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-28 h-28 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-500/10"
            >
               <XCircle strokeWidth={3} className="w-14 h-14" />
            </motion.div>
            <h1 className="text-3xl font-black text-slate-900 mb-2 font-display">Thanh toán thất bại!</h1>
            <p className="text-slate-500 font-medium leading-relaxed mb-8">
               Giao dịch của bạn đã bị hủy hoặc xảy ra lỗi từ phía hệ thống ngân hàng. Vui lòng thử lại sau.
            </p>
          </>
        )}

        {status !== 'loading' && (
          <button 
             onClick={() => {
                // Clear the URL path to go back cleanly without payment params loop
                window.history.replaceState({}, document.title, "/");
                onNavigate('store');
             }} 
             className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-500/30 hover:bg-primary-hover hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group"
          >
             <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
             Quay lại Cửa hàng
             <ArrowRight className="w-4 h-4 ml-1 opacity-50 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </motion.div>
    </div>
  );
};
