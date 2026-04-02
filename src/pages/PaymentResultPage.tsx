import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, ShoppingBag, ArrowRight, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PaymentResultPageProps {
  onNavigate: (page: string) => void;
  params?: any;
}

export const PaymentResultPage = ({ onNavigate, params }: PaymentResultPageProps) => {
  const [status, setStatus] = useState<'success' | 'failed' | 'loading'>('loading');
  const [amount, setAmount] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [isCod, setIsCod] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const vnp_ResponseCode = urlParams.get('vnp_ResponseCode') || params?.vnp_ResponseCode;
    const vnp_Amount = urlParams.get('vnp_Amount');
    const vnp_TxnRef = urlParams.get('vnp_TxnRef') || params?.vnp_TxnRef;
    const method = params?.method || (urlParams.get('vnp_ResponseCode') ? 'vnpay' : 'unknown');
    const paramAmount = params?.amount;

    const finalizeOrder = async () => {
      if (vnp_ResponseCode === '00') {
        setStatus('success');
        setIsCod(method === 'cod');

        if (vnp_TxnRef) {
          try {
            if (method === 'vnpay') {
              // ✅ Chỉ VNPAY: Trừ kho + chuyển 'completed'
              const { data: orderData, error: orderFetchError } = await supabase
                .from('orders')
                .select('id, items, status')
                .eq('id', vnp_TxnRef)
                .single();

              if (!orderFetchError && orderData) {
                if (orderData.status !== 'completed' && orderData.items) {
                  const itemsArr = Array.isArray(orderData.items)
                    ? orderData.items
                    : JSON.parse(orderData.items as string);

                  for (const item of itemsArr) {
                    await supabase.rpc('reduce_product_stock_and_hide', {
                      product_id: item.id,
                      quantity_bought: (item.quantity || 1)
                    });
                  }
                }

                await supabase
                  .from('orders')
                  .update({ status: 'completed' })
                  .eq('id', orderData.id);
              }
            }
            // 📦 COD: Giữ nguyên trạng thái 'pending' — nút Hủy sẽ xuất hiện trong "Đơn Mua"
          } catch (err) {
            console.error('Lỗi cập nhật hóa đơn:', err);
          }
        }
      } else {
        setStatus('failed');
        if (vnp_TxnRef) {
          try {
            await supabase
              .from('orders')
              .update({ status: 'failed' })
              .eq('id', vnp_TxnRef);
          } catch (err) {}
        }
      }

      if (vnp_Amount) {
        setAmount((parseInt(vnp_Amount) / 100).toLocaleString('vi-VN') + ' đ');
      } else if (paramAmount) {
        setAmount(Number(paramAmount).toLocaleString('vi-VN') + ' đ');
      }

      if (vnp_TxnRef) {
        setOrderId(vnp_TxnRef);
      }
    };

    finalizeOrder();
  }, [params]);

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
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl ${isCod ? 'bg-orange-100 text-orange-500 shadow-orange-500/10' : 'bg-green-100 text-green-500 shadow-green-500/10'}`}
            >
              {isCod
                ? <Clock strokeWidth={3} className="w-14 h-14" />
                : <CheckCircle2 strokeWidth={3} className="w-14 h-14" />
              }
            </motion.div>

            <h1 className="text-3xl font-black text-slate-900 mb-2 font-display">
              {isCod ? 'Đặt hàng thành công!' : 'Thanh toán thành công!'}
            </h1>
            <p className="text-slate-500 font-medium leading-relaxed mb-8">
              {isCod
                ? 'Đơn hàng COD của bạn đang chờ xử lý. Bạn có thể hủy đơn trong mục "Đơn Mua" nếu cần.'
                : 'Cảm ơn bạn đã mua sắm. Đơn của bạn đã được ghi nhận và hoàn tất.'}
            </p>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4 mb-8 text-left shadow-inner">
              <div className="flex justify-between items-center text-sm font-bold border-b border-slate-200 pb-3">
                <span className="text-slate-400">Số tiền:</span>
                <span className={`text-2xl font-black ${isCod ? 'text-orange-500' : 'text-green-600'}`}>{amount}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-400">Mã đơn hàng:</span>
                <span className="text-slate-900 bg-slate-200 px-3 py-1 rounded-lg text-xs tracking-wider font-mono">
                  {orderId.substring(0, 8).toUpperCase()}
                </span>
              </div>
              {isCod && (
                <div className="flex items-center gap-2 bg-orange-50 text-orange-600 px-3 py-2 rounded-xl text-xs font-bold border border-orange-100">
                  <Clock className="w-4 h-4 shrink-0" />
                  Thanh toán khi nhận hàng (COD)
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
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
          <div className="flex flex-col gap-3">
            {status === 'success' && (
              <button
                onClick={() => {
                  window.history.replaceState({}, document.title, '/');
                  onNavigate('my-store');
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                Xem đơn hàng của tôi
              </button>
            )}
            <button
              onClick={() => {
                window.history.replaceState({}, document.title, '/');
                onNavigate('store');
              }}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-500/30 hover:bg-primary-hover hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group"
            >
              <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Quay lại Cửa hàng
              <ArrowRight className="w-4 h-4 ml-1 opacity-50 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
