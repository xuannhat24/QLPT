import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { motion } from 'motion/react';
import { MapPin, Phone, User as UserIcon, Receipt, CreditCard, Wallet, Truck, Loader2, ArrowLeft } from 'lucide-react';

interface CheckoutPageProps {
  onNavigate: (page: string, params?: any) => void;
  user: User | null;
  onLogout: () => void;
  params?: any;
}

export const CheckoutPage = ({ onNavigate, user, onLogout, params }: CheckoutPageProps) => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'vnpay'>('cod');

  // Items to checkout
  const checkoutItems = params?.singleProduct ? [params.singleProduct] : (params?.items || cartItems);
  const currentTotal = params?.singleProduct 
    ? (Number(params.singleProduct.price) * (params.singleProduct.quantity || 1))
    : checkoutItems.reduce((acc: number, cur: any) => acc + (Number(cur.price) * (cur.quantity || 1)), 0);

  useEffect(() => {
    // If no items to checkout and not loading, redirect to store
    if (!checkoutItems || checkoutItems.length === 0) {
      showToast('Không có sản phẩm nào để thanh toán', 'warning');
      onNavigate('store');
      return;
    }

    // Load user profile
    const loadProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name, phone, permanent_address')
            .eq('id', user.id)
            .single();

          if (!error && data) {
            setFullName(data.full_name || user.email?.split('@')[0] || '');
            setPhone(data.phone || '');
            setAddress(data.permanent_address || '');
          } else {
             setFullName(user.email?.split('@')[0] || '');
          }
        } catch (err) {
          console.error("Lỗi khi tải thông tin người dùng", err);
        }
      }
      setIsLoading(false);
    };

    loadProfile();
  }, [user, checkoutItems.length]);

  const handleSubmitOrder = async () => {
    if (!user) {
      showToast('Vui lòng đăng nhập để đặt hàng!', 'warning');
      onNavigate('login');
      return;
    }

    if (!phone.trim() || !address.trim() || !fullName.trim()) {
      showToast('Vui lòng điền đầy đủ thông tin giao hàng!', 'error');
      return;
    }

    // Final prevention for self-purchase
    const selfOwnedItem = checkoutItems.find((item: any) => item.owner_id === user.id);
    if (selfOwnedItem) {
      showToast(`Bạn không thể tự mua sản phẩm "${selfOwnedItem.title}" của chính mình!`, 'error');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Insert into orders table
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          items: checkoutItems,
          total_amount: currentTotal,
          phone: phone.trim(),
          address: address.trim(),
          payment_method: paymentMethod,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Xóa giỏ hàng nếu mua từ giỏ hàng (không phải mua 1 món)
      if (!params?.singleProduct) {
         clearCart();
      }

      // 2. Handle Payment Method Branching
      if (paymentMethod === 'cod') {
         // Sang trang kết quả thành công cho COD
         showToast('Đặt hàng thành công!', 'success');
         // Giả lập redirect tới PaymentResult (Hoặc trang Order Success)
         onNavigate('payment-result', { vnp_ResponseCode: '00', vnp_TxnRef: newOrder.id, method: 'cod', amount: currentTotal });
      } else {
         // VNPAY
         showToast('Đang kết nối VNPay...', 'info');
         const response = await fetch('http://localhost:3001/create-payment-url', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
                amount: currentTotal,
                orderId: newOrder.id,
                orderInfo: `Thanh toan don hang`
             }),
         });

         if (!response.ok) throw new Error('Cổng thanh toán từ chối kết nối');

         const data = await response.json();
         if (data.url) {
            window.location.href = data.url;
         } else {
            throw new Error('Chưa lấy được URL thanh toán');
         }
      }
    } catch (err: any) {
      console.error("Lỗi đặt hàng:", err);
      showToast(err.message || "Đã có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="font-bold text-slate-500">Đang khởi tạo thanh toán...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header user={user} onLogout={onLogout} onNavigate={onNavigate as any} activePath="store" />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
         <div className="mb-6">
            <button 
               onClick={() => onNavigate('store')} 
               className="flex items-center text-sm font-bold text-slate-500 hover:text-primary transition-colors"
            >
               <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại cửa hàng
            </button>
         </div>

         <div className="flex flex-col lg:flex-row gap-8">
            {/* LẼFT COLUMN: FORM & METH0DS */}
            <div className="w-full lg:w-[60%] space-y-8">
               
               {/* Thông tin giao hàng */}
               <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 sm:p-8 rounded-[30px] shadow-sm border border-slate-100"
               >
                  <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                        <UserIcon className="w-5 h-5"/>
                     </div>
                     Thông tin đặt hàng
                  </h2>

                  <div className="space-y-5">
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Họ và tên người nhận</label>
                        <input 
                           type="text" 
                           value={fullName}
                           onChange={(e) => setFullName(e.target.value)}
                           placeholder="Nhập họ và tên đầy đủ"
                           className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-slate-900"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Số điện thoại <span className="text-red-500">*</span></label>
                        <div className="relative">
                           <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                           <input 
                              type="tel" 
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="Nhập số điện thoại liên hệ"
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-slate-900"
                           />
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Địa chỉ giao hàng <span className="text-red-500">*</span></label>
                        <div className="relative">
                           <MapPin className="absolute left-5 top-[18px] w-5 h-5 text-slate-400" />
                           <textarea 
                              rows={3}
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              placeholder="Nhập địa chỉ nhận hàng chi tiết (Tòa nhà, số nhà, ngõ/hẻm, tên đường...)"
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-slate-900 resize-none"
                           />
                        </div>
                     </div>
                  </div>
               </motion.div>

               {/* Phương thức thanh toán */}
               <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white p-6 sm:p-8 rounded-[30px] shadow-sm border border-slate-100"
               >
                  <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-primary">
                        <Wallet className="w-5 h-5"/>
                     </div>
                     Phương thức thanh toán
                  </h2>

                  <div className="space-y-4">
                     <label className={`block border-2 rounded-2xl p-5 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary bg-orange-50/30' : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cod' ? 'border-primary' : 'border-slate-300'}`}>
                                 {paymentMethod === 'cod' && <div className="w-3 h-3 rounded-full bg-primary" />}
                              </div>
                              <div>
                                 <p className="font-bold text-slate-900 text-base flex items-center gap-2">Thanh toán khi nhận hàng <Truck className="w-4 h-4 text-emerald-500"/></p>
                                 <p className="text-sm text-slate-500 mt-1">Giao hàng tận nơi, xem hàng trước khi thanh toán</p>
                              </div>
                           </div>
                        </div>
                        <input type="radio" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="hidden" />
                     </label>

                     <label className={`block border-2 rounded-2xl p-5 cursor-pointer transition-all ${paymentMethod === 'vnpay' ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'vnpay' ? 'border-blue-500' : 'border-slate-300'}`}>
                                 {paymentMethod === 'vnpay' && <div className="w-3 h-3 rounded-full bg-blue-500" />}
                              </div>
                              <div>
                                 <p className="font-bold text-slate-900 text-base flex items-center gap-2">Thanh toán VNPAY <CreditCard className="w-4 h-4 text-blue-500"/></p>
                                 <p className="text-sm text-slate-500 mt-1">An toàn, bảo mật, xác nhận ngay lập tức</p>
                              </div>
                           </div>
                           <img src="https://vnpay.vn/s1/vnpay.vn/images/logo.svg" alt="VNPAY" className="h-6" />
                        </div>
                        <input type="radio" value="vnpay" checked={paymentMethod === 'vnpay'} onChange={() => setPaymentMethod('vnpay')} className="hidden" />
                     </label>
                  </div>
               </motion.div>

            </div>

            {/* RIGHT COLUMN: ORDER SUMMARY */}
            <div className="w-full lg:w-[40%]">
               <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white p-6 sm:p-8 rounded-[30px] shadow-sm border border-slate-100 lg:sticky lg:top-24"
               >
                  <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                        <Receipt className="w-5 h-5"/>
                     </div>
                     Tóm tắt đơn hàng
                  </h2>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto mb-6 pr-2">
                     {checkoutItems.map((item: any) => (
                        <div key={item.id} className="flex gap-4 py-4 border-b border-slate-50 last:border-0">
                           <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50">
                              <img src={item.image_url || 'https://via.placeholder.com/150'} alt={item.title} className="w-full h-full object-cover"/>
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900 text-sm line-clamp-2">{item.title}</p>
                              <div className="flex justify-between items-center mt-2">
                                 <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">SL: {item.quantity || 1}</span>
                                 <span className="text-rose-500 font-bold text-sm">{(Number(item.price) * (item.quantity||1)).toLocaleString()}đ</span>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>

                  <div className="border-t border-slate-100 pt-6 space-y-3 mb-8">
                     <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                        <span>Tạm tính ({checkoutItems.reduce((acc: number, cur: any) => acc + (cur.quantity || 1), 0)} SP)</span>
                        <span>{Number(currentTotal).toLocaleString()}đ</span>
                     </div>
                     <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                        <span>Phí giao hàng</span>
                        <span className="text-emerald-500 text-xs px-2 py-0.5 bg-emerald-50 rounded-md">Trao đổi riêng</span>
                     </div>
                     <div className="flex justify-between items-end pt-4 border-t border-slate-50 mt-4">
                        <span className="text-base font-black text-slate-900">Tổng thanh toán</span>
                        <span className="text-3xl font-black text-rose-500 font-display">{Number(currentTotal).toLocaleString()}đ</span>
                     </div>
                  </div>

                  <button 
                     onClick={handleSubmitOrder}
                     disabled={isSubmitting}
                     className={`w-full py-4 rounded-2xl font-black text-[15px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all ${
                        isSubmitting ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
                        : paymentMethod === 'vnpay' ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-blue-500/30 hover:-translate-y-1' 
                        : 'bg-rose-500 hover:bg-rose-600 text-white hover:shadow-rose-500/30 hover:-translate-y-1'
                     }`}
                  >
                     {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : null}
                     {isSubmitting ? 'Đang xử lý...' : paymentMethod === 'vnpay' ? 'Đặt hàng & Thanh toán VNPAY' : 'Xác nhận Đặt hàng'}
                  </button>

                  <p className="text-xs font-bold text-slate-400 text-center mt-4 px-4 leading-relaxed">
                     Bằng việc đặt hàng, bạn đồng ý với Điều khoản sử dụng & Chính sách bảo vệ người mua của Trọ Pro.
                  </p>
               </motion.div>
            </div>
         </div>
      </main>

      <Footer />
    </div>
  );
};
