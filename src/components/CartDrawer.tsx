import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string, params?: any) => void;
}

export const CartDrawer = ({ isOpen, onClose, onNavigate }: CartDrawerProps) => {
  const { cartItems, cartTotal, cartCount, removeFromCart, updateQuantity, clearCart } = useCart();

  const handleCheckout = () => {
    onClose();
    // You could navigate to a checkout page or open VNPAY for the whole cart
    // For now, just show intent
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
            className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[201] w-full max-w-md bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-900">
              <div className="flex items-center gap-3 text-white">
                <ShoppingCart className="w-6 h-6" />
                <h2 className="text-lg font-black">Giỏ hàng</h2>
                {cartCount > 0 && (
                  <span className="bg-rose-500 text-white text-xs font-black px-2.5 py-1 rounded-full">
                    {cartCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto py-4 px-4 space-y-3">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-5">
                    <ShoppingBag className="w-12 h-12 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">Giỏ hàng trống</h3>
                  <p className="text-slate-400 text-sm mb-6 max-w-[200px]">Hãy thêm sản phẩm vào giỏ hàng để bắt đầu mua sắm nhé!</p>
                  <button
                    onClick={() => { onClose(); onNavigate('store'); }}
                    className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg"
                  >
                    Khám phá Chợ đồ cũ <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                cartItems.map(item => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group"
                  >
                    <div
                      className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer"
                      onClick={() => { onClose(); onNavigate('store-detail', { id: item.id }); }}
                    >
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-bold text-slate-900 text-sm line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => { onClose(); onNavigate('store-detail', { id: item.id }); }}
                      >
                        {item.title}
                      </p>
                      {item.condition && (
                        <span className="text-[10px] font-bold text-primary bg-orange-50 px-2 py-0.5 rounded-md mt-1 inline-block">
                          {item.condition}
                        </span>
                      )}
                      <p className="text-rose-500 font-black text-base mt-1">
                        {Number(item.price).toLocaleString()}đ
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between gap-2">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-primary flex items-center justify-center text-slate-600 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-black text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-primary flex items-center justify-center text-slate-600 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer: Total + Actions */}
            {cartItems.length > 0 && (
              <div className="border-t border-slate-100 p-6 space-y-4 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold text-sm">Tổng cộng ({cartCount} sản phẩm)</span>
                  <span className="text-2xl font-black text-slate-900">{Number(cartTotal).toLocaleString()}đ</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={clearCart}
                    className="px-4 py-3 rounded-2xl border-2 border-slate-200 text-slate-500 font-bold text-sm hover:border-red-200 hover:text-red-500 transition-colors"
                  >
                    Xóa tất cả
                  </button>
                  <button
                    onClick={handleCheckout}
                    className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Thanh toán VNPAY
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
