import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, PlusCircle, CheckCircle2, Loader2, Camera, Tag, Box, 
  ShieldCheck, MapPin, LayoutGrid, Info, Eye
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { useToast } from '../context/ToastContext';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  product?: any; // If provided, we are in Edit mode
  onSuccess: () => void;
}

const CATEGORIES = [
  { id: 'electronics', label: 'Đồ điện tử' },
  { id: 'furniture', label: 'Nội thất' },
  { id: 'kitchen', label: 'Bếp & Đồ dùng' },
  { id: 'decor', label: 'Trang trí' },
  { id: 'cleaning', label: 'Vệ sinh' },
  { id: 'bedroom', label: 'Phòng ngủ' },
];

const CONDITIONS = [
  'Mới nguyên seal',
  'Như mới (Like New)',
  'Cũ (Chưa qua sửa chữa)',
  'Cũ sửa chữa nhẹ'
];

const WARRANTIES = [
  'Không bảo hành',
  'Bảo hành 1 tháng',
  'Bảo hành 3 tháng',
  'Bảo hành hãng 12 tháng'
];

export const ProductModal = ({ isOpen, onClose, user, product, onSuccess }: ProductModalProps) => {
  const isEdit = !!product;
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  
  const [form, setForm] = useState({
    title: '',
    price: '',
    category: 'Nội thất',
    condition: 'Mới nguyên seal',
    brand: '',
    warranty: 'Không bảo hành',
    address_summary: '',
    description: '',
    images: ['', '', ''],
    stock: 1,
    status: 'available'
  });

  useEffect(() => {
    if (isEdit && product) {
      let imgs = [...(product.images || [])];
      while (imgs.length < 3) imgs.push('');
      if (imgs.length > 3) imgs = imgs.slice(0, 3);
      
      setForm({
        title: product.title || '',
        price: product.price?.toString() || '',
        category: product.category || 'Nội thất',
        condition: product.condition || 'Mới nguyên seal',
        brand: product.brand || '',
        warranty: product.warranty || 'Không bảo hành',
        address_summary: product.address_summary || '',
        description: product.description || '',
        images: imgs,
        stock: product.stock || 1,
        status: product.status || 'available'
      });
    } else {
      setForm({
        title: '',
        price: '',
        category: 'Nội thất',
        condition: 'Mới nguyên seal',
        brand: '',
        warranty: 'Không bảo hành',
        address_summary: '',
        description: '',
        images: ['', '', ''],
        stock: 1,
        status: 'available'
      });
    }
  }, [product, isEdit, isOpen]);

  const handleImageChange = (idx: number, val: string) => {
    const newImgs = [...form.images];
    newImgs[idx] = val;
    setForm({ ...form, images: newImgs });
  };

  const handleSubmit = async () => {
    if (!user) {
      showToast('Vui lòng đăng nhập!', 'warning');
      return;
    }

    const validImages = form.images.filter(img => img.trim() !== '');
    if (!form.title || !form.price || validImages.length === 0) {
      showToast('Vui lòng điền đủ thông tin bắt buộc (*)', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        owner_id: user.id,
        title: form.title,
        price: parseInt(form.price),
        category: form.category,
        condition: form.condition,
        brand: form.brand,
        warranty: form.warranty,
        address_summary: form.address_summary,
        description: form.description,
        stock: parseInt(form.stock.toString()) || 1,
        image_url: validImages[0],
        images: validImages,
        status: form.status
      };

      if (isEdit) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', product.id);
        if (error) throw error;
        showToast('Cập nhật thành công!', 'success');
      } else {
        const { error } = await supabase
          .from('products')
          .insert(payload);
        if (error) throw error;
        showToast('Đăng tin thành công!', 'success');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Submit Product Error:', error);
      showToast(error.message || 'Có lỗi xảy ra khi lưu Database.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const firstValidImage = form.images.find(img => img.trim() !== '') || 'https://via.placeholder.com/400x500?text=Tr%E1%BB%8D+Pro';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-[40px] w-full max-w-6xl h-[90vh] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/20"
          >
            {/* LEFT: FORM SECTION */}
            <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-slate-100">
               {/* Header */}
               <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:rotate-6 ${isEdit ? 'bg-indigo-500 shadow-indigo-200' : 'bg-primary shadow-orange-200'}`}>
                        {isEdit ? <PlusCircle className="text-white w-6 h-6 rotate-45" /> : <PlusCircle className="text-white w-6 h-6" />}
                     </div>
                     <div>
                        <h3 className="text-2xl font-black font-display text-slate-900 leading-none mb-1">
                           {isEdit ? 'Sửa bài rao bán' : 'Đăng tin rao bán'}
                        </h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Cung cấp thông tin chi tiết</p>
                     </div>
                  </div>
                  <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all">
                     <X className="w-5 h-5" />
                  </button>
               </div>

               {/* Scrollable Form Area */}
               <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <div className="space-y-10">
                     
                     {/* Images Section */}
                     <section>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                           <Camera className="w-4 h-4 text-primary" /> Album Hình ảnh <span className="text-primary">*</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                           {form.images.map((img, idx) => (
                              <div key={idx} className="relative group">
                                 <input 
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3.5 outline-none focus:border-primary/30 text-xs font-bold pr-10 transition-all transition-shadow focus:bg-white focus:shadow-lg focus:shadow-orange-500/5"
                                    placeholder={`Link ảnh ${idx + 1}${idx === 0 ? ' (Chính)' : ''}`}
                                    value={img}
                                    onChange={(e) => handleImageChange(idx, e.target.value)}
                                 />
                                 <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                                    {img ? (
                                       <img src={img} className="w-7 h-7 rounded-lg object-cover border border-slate-200 shadow-sm"  referrerPolicy="no-referrer" />
                                    ) : (
                                       <Camera className="w-4 h-4 text-slate-300" />
                                    )}
                                 </div>
                              </div>
                           ))}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 mt-3 italic flex items-center gap-1.5"><Info className="w-3.5 h-3.5"/> Nhập link ảnh trực tuyến (ưu tiên ảnh thật) để khách hàng tin tưởng hơn.</p>
                     </section>

                     {/* Basic Info */}
                     <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Thông tin cơ bản</h4>
                           <div>
                              <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 px-1">Tên sản phẩm <span className="text-primary">*</span></label>
                              <input 
                                 className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-primary/30 font-bold transition-all focus:bg-white"
                                 placeholder="Vd: Bàn làm việc thông minh"
                                 value={form.title}
                                 onChange={(e) => setForm({ ...form, title: e.target.value })}
                              />
                           </div>
                           <div>
                              <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 px-1">Giá bán VNĐ <span className="text-primary">*</span></label>
                              <div className="relative">
                                 <input 
                                    type="number"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-primary/30 font-black transition-all focus:bg-white text-primary text-lg"
                                    placeholder="500.000"
                                    value={form.price}
                                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                                 />
                                 <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">đ</span>
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 px-1">Tình trạng</label>
                                 <select 
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none font-bold appearance-none transition-all focus:bg-white"
                                    value={form.condition}
                                    onChange={(e) => setForm({ ...form, condition: e.target.value })}
                                 >
                                    {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                                 </select>
                              </div>
                              <div>
                                 <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 px-1">Tồn kho</label>
                                 <input 
                                    type="number"
                                    min="1"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-primary/30 font-bold transition-all focus:bg-white text-center"
                                    value={form.stock}
                                    onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 1 })}
                                 />
                              </div>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Phân loại & Bảo hành</h4>
                           <div>
                              <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 px-1">Danh mục</label>
                              <select 
                                 className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none font-bold appearance-none transition-all focus:bg-white"
                                 value={form.category}
                                 onChange={(e) => setForm({ ...form, category: e.target.value })}
                              >
                                 {CATEGORIES.map(c => <option key={c.id} value={c.label}>{c.label}</option>)}
                              </select>
                           </div>
                           <div>
                              <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 px-1">Hãng / Thương hiệu</label>
                              <input 
                                 className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-primary/30 font-bold transition-all focus:bg-white"
                                 placeholder="Hòa Phát, Ikea, Apple..."
                                 value={form.brand}
                                 onChange={(e) => setForm({ ...form, brand: e.target.value })}
                              />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 px-1">Bảo hành</label>
                                 <select 
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none font-bold appearance-none transition-all focus:bg-white text-xs"
                                    value={form.warranty}
                                    onChange={(e) => setForm({ ...form, warranty: e.target.value })}
                                 >
                                    {WARRANTIES.map(w => <option key={w}>{w}</option>)}
                                 </select>
                              </div>
                              <div>
                                 <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 px-1">Trạng thái</label>
                                 <select 
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none font-bold appearance-none transition-all focus:bg-white"
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                 >
                                    <option value="available">Công khai</option>
                                    <option value="hidden">Ẩn tạm thời</option>
                                 </select>
                              </div>
                           </div>
                        </div>
                     </section>

                     {/* Detailed Content */}
                     <section className="space-y-6">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Chi tiết tin đăng</h4>
                        <div>
                           <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary"/> Địa chỉ giao dịch</label>
                           <input 
                              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-primary/30 font-bold transition-all focus:bg-white"
                              placeholder="Khu vực Mỹ Đình, Quận Nam Từ Liêm..."
                              value={form.address_summary}
                              onChange={(e) => setForm({ ...form, address_summary: e.target.value })}
                           />
                        </div>
                        <div>
                           <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2 px-1">Mô tả sản phẩm</label>
                           <textarea 
                              className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-6 py-5 outline-none focus:border-primary/30 font-bold min-h-[160px] resize-none transition-all focus:bg-white"
                              placeholder="Mô tả kỹ để người dùng tin tưởng chốt đơn nhanh hơn..."
                              value={form.description}
                              onChange={(e) => setForm({ ...form, description: e.target.value })}
                           />
                        </div>
                     </section>
                  </div>
               </div>

               {/* Footer Action */}
               <div className="px-8 py-6 border-t border-slate-100 bg-white flex gap-4">
                  <button onClick={onClose} className="flex-[1] py-4 rounded-2xl font-black text-xs uppercase tracking-[0.1em] text-slate-400 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95">Hủy</button>
                  <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`flex-[2.5] flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-95 disabled:opacity-50 ${isEdit ? 'bg-slate-900 shadow-slate-900/20' : 'bg-primary shadow-orange-500/20 hover:bg-orange-600'}`}
                  >
                     {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> {isEdit ? 'Lưu thay đổi' : 'Đăng tin ngay'}</>}
                  </button>
               </div>
            </div>

            {/* RIGHT: LIVE PREVIEW SECTION */}
            <div className="hidden lg:flex w-[400px] bg-slate-50 p-10 flex-col overflow-y-auto items-center">
               <div className="sticky top-0 w-full">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">
                     <Eye className="w-4 h-4" /> Live Preview
                  </div>
                  
                  <div className="bg-white rounded-[32px] overflow-hidden border border-slate-200 shadow-2xl w-full flex flex-col group transform transition-transform hover:-translate-y-2 duration-500">
                     <div className="aspect-[4/5] bg-slate-100 relative overflow-hidden">
                        <img 
                           src={firstValidImage} 
                           alt="Preview" 
                           className="w-full h-full object-cover" 
                           referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 left-4">
                           <div className="bg-primary/90 text-white text-[9px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-widest shadow-lg">
                              {form.condition || 'Mới'}
                           </div>
                        </div>
                     </div>
                     <div className="p-6">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">{form.category}</p>
                        <h4 className="text-slate-900 font-bold text-base mb-3 line-clamp-2 h-12 leading-snug">{form.title || 'Tiêu đề sản phẩm'}</h4>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                           <span className="text-xl font-black text-slate-900 font-display">
                              {Number(form.price || 0).toLocaleString()} <span className="text-sm">đ</span>
                           </span>
                        </div>
                     </div>
                  </div>

                  <div className="mt-10 p-6 bg-primary/5 rounded-3xl border border-primary/10">
                     <h5 className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mẹo đăng bán
                     </h5>
                     <ul className="space-y-3">
                        <li className="text-[11px] text-slate-600 font-bold leading-relaxed flex items-start gap-2">• Hình ảnh thực tế giúp giao dịch nhanh gấp 2 lần.</li>
                        <li className="text-[11px] text-slate-600 font-bold leading-relaxed flex items-start gap-2">• Giá cả hợp lý sẽ thu hút nhiều người nhắn tin.</li>
                     </ul>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
