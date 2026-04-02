import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string, params?: any) => void;
  user: any | null;
}

export const CartDrawer = ({ isOpen, onClose, onNavigate, user }: CartDrawerProps) => {
  const { cartItems, cartTotal, cartCount, removeFromCart, updateQuantity, clearCart } = useCart();
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Update selection when cart items change (e.g. initial load or items added)
  useEffect(() => {
    if (isOpen && cartItems.length > 0 && selectedIds.size === 0) {
      setSelectedIds(new Set(cartItems.map(item => item.id)));
    }
  }, [isOpen, cartItems.length]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === cartItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cartItems.map(item => item.id)));
    }
  };

  const selectedItems = cartItems.filter(item => selectedIds.has(item.id));
  const selectedTotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const selectedCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (selectedItems.length === 0) return;
    
    // Final check for self-purchase
    if (user) {
      const selfOwnedItem = selectedItems.find(item => item.owner_id === user.id);
      if (selfOwnedItem) {
        alert(`Bạn không thể mua sản phẩm "${selfOwnedItem.title}" vì bạn là người đăng tin này!`);
        return;
      }
    }
    
    onClose();
    onNavigate('checkout', { items: selectedItems });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[201] w-full max-w-md bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                   <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-lg font-black text-slate-900 leading-tight">Giỏ hàng</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cartCount} sản phẩm</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all border border-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto py-4 px-4 space-y-4">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16">
                  <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-inner">
                    <ShoppingBag className="w-10 h-10 text-orange-200" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2 font-display">Giỏ hàng trống</h3>
                  <p className="text-slate-400 text-sm mb-8 max-w-[240px] font-medium leading-relaxed">Hãy thêm sản phẩm vào giỏ hàng để bắt đầu mua sắm cùng TroPro nhé!</p>
                  <button
                    onClick={() => { onClose(); onNavigate('store'); }}
                    className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.1em] flex items-center gap-3 shadow-xl hover:bg-orange-500 transition-all active:scale-95"
                  >
                    Khám phá ngay <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  {/* Select All */}
                  <div 
                    className="flex items-center gap-3 px-2 mb-2 cursor-pointer group"
                    onClick={toggleSelectAll}
                  >
                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${selectedIds.size === cartItems.length ? 'bg-orange-500 border-orange-500 shadow-md shadow-orange-500/20' : 'border-slate-200 group-hover:border-orange-300 bg-white'}`}>
                        {selectedIds.size === cartItems.length && <Check className="w-3.5 h-3.5 text-white stroke-[4]" />}
                    </div>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Chọn tất cả</span>
                  </div>

                  {cartItems.map(item => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`flex gap-4 p-4 rounded-3xl border transition-all duration-300 relative overflow-hidden ${selectedIds.has(item.id) ? 'bg-orange-50/30 border-orange-200 ring-1 ring-orange-100' : 'bg-white border-slate-100 shadow-sm'}`}
                    >
                      {/* Selection Checkbox Overlay or side */}
                      <div 
                        className="flex items-center"
                        onClick={() => toggleSelect(item.id)}
                      >
                         <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${selectedIds.has(item.id) ? 'bg-orange-500 border-orange-500 shadow-sm shadow-orange-500/20' : 'border-slate-200 bg-white'}`}>
                            {selectedIds.has(item.id) && <Check className="w-3.5 h-3.5 text-white stroke-[4]" />}
                         </div>
                      </div>

                      <div
                        className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer border border-slate-100 shadow-sm"
                        onClick={() => { onClose(); onNavigate('store-detail', { id: item.id }); }}
                      >
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      
                      <div className="flex-1 min-w-0 py-0.5">
                        <p
                          className={`font-bold text-sm mb-1 line-clamp-1 cursor-pointer transition-colors ${selectedIds.has(item.id) ? 'text-slate-900' : 'text-slate-700 hover:text-orange-500'}`}
                          onClick={() => { onClose(); onNavigate('store-detail', { id: item.id }); }}
                        >
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                           <span className="text-[11px] font-black text-orange-500 tabular-nums">
                             {Number(item.price).toLocaleString()}đ
                           </span>
                           {item.condition && (
                            <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                              {item.condition}
                            </span>
                           )}
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-1 mt-auto">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-xl bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-500 flex items-center justify-center text-slate-400 transition-all shadow-sm active:scale-90"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-black text-slate-900 tabular-nums">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-xl bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-500 flex items-center justify-center text-slate-400 transition-all shadow-sm active:scale-90"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end justify-between">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-red-50 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all border border-transparent hover:border-red-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="text-right">
                           <p className="text-xs font-black text-slate-400 uppercase tracking-tighter">Thành tiền</p>
                           <p className="text-sm font-black text-slate-900 tabular-nums">
                             {(Number(item.price) * item.quantity).toLocaleString()}đ
                           </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}
            </div>

            {/* Footer: Total + Actions */}
            {cartItems.length > 0 && (
              <div className="border-t border-slate-100 p-6 space-y-5 bg-white">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-black text-[11px] uppercase tracking-widest">Đang chọn {selectedCount} món</span>
                        <span className="text-sm font-black text-slate-400 tabular-nums">{Number(selectedTotal).toLocaleString()}đ</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-900 font-black text-sm uppercase tracking-widest">TỔNG THANH TOÁN</span>
                      <span className="text-2xl font-black text-orange-500 tabular-nums font-display leading-none">{Number(selectedTotal).toLocaleString()} <span className="text-sm">đ</span></span>
                    </div>
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={clearCart}
                    className="flex-1 py-4 rounded-2xl border-2 border-slate-100 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 hover:text-red-500 hover:border-red-100 transition-all flex items-center justify-center gap-2"
                  >
                    Xóa tất cả
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={selectedItems.length === 0}
                    className={`flex-[1.5] py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:shadow-none ${selectedItems.length > 0 ? 'bg-orange-500 text-white shadow-orange-500/30 hover:bg-orange-600 hover:-translate-y-1' : 'bg-slate-200 text-slate-400'}`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Thanh toán ({selectedCount})
                  </button>
                </div>
                <p className="text-[10px] text-center font-bold text-slate-400 leading-relaxed px-4 italic">
                    * Giá sản phẩm chưa bao gồm phí vận chuyển tùy theo khu vực giao dịch.
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
