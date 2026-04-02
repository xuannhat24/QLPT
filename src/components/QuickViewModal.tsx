import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, Info, MapPin, ShieldCheck, Tag } from 'lucide-react';

interface QuickViewModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: any) => void;
  onNavigate: (page: string, params?: any) => void;
}

export const QuickViewModal = ({ product, isOpen, onClose, onAddToCart, onNavigate }: QuickViewModalProps) => {
  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-xl bg-white/90 backdrop-blur shadow-md text-slate-500 hover:text-primary transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left: Image Side */}
            <div className="w-full md:w-1/2 aspect-square md:aspect-auto bg-slate-50 relative group">
              <img 
                src={product.image_url} 
                alt={product.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                <span className="bg-primary text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg">
                  {product.category}
                </span>
                <span className="bg-white/90 backdrop-blur text-slate-900 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg border border-slate-100">
                  {product.condition}
                </span>
              </div>
            </div>

            {/* Right: Info Side */}
            <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col overflow-y-auto">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 leading-tight font-display">{product.title}</h2>
                <div className="text-3xl font-black text-primary mb-6 font-display">
                  {Number(product.price).toLocaleString()}đ
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <Tag className="w-3 h-3" /> Thương hiệu
                    </p>
                    <p className="text-sm font-bold text-slate-700">{product.brand || 'No Brand'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <ShieldCheck className="w-3 h-3" /> Bảo hành
                    </p>
                    <p className="text-sm font-bold text-slate-700">{product.warranty || 'No Warranty'}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Khu vực giao dịch</p>
                            <p className="text-sm font-bold text-slate-700">{product.address_summary || 'Liên hệ để biết chi tiết'}</p>
                        </div>
                    </div>
                </div>

                <div className="prose prose-slate prose-sm mb-8">
                    <p className="text-slate-600 line-clamp-4 leading-relaxed font-medium capitalize">
                        {product.description || 'Chưa có mô tả chi tiết cho sản phẩm này...'}
                    </p>
                </div>
              </div>

              <div className="mt-auto pt-8 border-t border-slate-100 flex flex-col gap-3">
                <button 
                  onClick={() => onAddToCart(product)}
                  className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3 transition-all hover:-translate-y-1 active:scale-[0.98]"
                >
                  <ShoppingCart className="w-5 h-5" /> Thêm vào giỏ hàng
                </button>
                <button 
                  onClick={() => onNavigate('store-detail', { id: product.id })}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:-translate-y-1 active:scale-[0.98]"
                >
                  <Info className="w-5 h-5" /> Xem chi tiết đầy đủ
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
