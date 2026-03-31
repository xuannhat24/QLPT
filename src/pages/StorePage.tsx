import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { CartDrawer } from '../components/CartDrawer';
import {
  Search, Plus, LayoutGrid, Armchair, Utensils,
  Sparkles, Trash2, Bed, PlusCircle, X, CheckCircle2, Loader2, ShoppingCart
} from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface StorePageProps {
  onNavigate: (page: string, params?: any) => void;
  user: SupabaseUser | null;
  onLogout: () => void;
}

export const StorePage = ({ onNavigate, user, onLogout }: StorePageProps) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  
  // Create Product State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useToast();
  const { cartCount } = useCart();
  const [productForm, setProductForm] = useState({
    title: '', price: '', category: 'Nội thất', 
    condition: 'Mới', brand: '', warranty: 'Không bảo hành', address_summary: '', 
    description: '', images: ['', '', ''], stock: 1
  });

  const categories = [
    { id: 'all', label: 'Tất cả', icon: LayoutGrid },
    { id: 'furniture', label: 'Nội thất', icon: Armchair },
    { id: 'kitchen', label: 'Bếp & Đồ dùng', icon: Utensils },
    { id: 'decor', label: 'Trang trí', icon: Sparkles },
    { id: 'cleaning', label: 'Vệ sinh', icon: Trash2 },
    { id: 'bedroom', label: 'Phòng ngủ', icon: Bed },
  ];

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...productForm.images];
    newImages[index] = value;
    setProductForm({ ...productForm, images: newImages });
  };

  const handleCreateProduct = async () => {
    if (!user) {
      showToast('Vui lòng đăng nhập để đăng bán đồ!', 'warning');
      return;
    }

    const validImages = productForm.images.filter(img => img.trim() !== '');
    if (!productForm.title || !productForm.price || validImages.length === 0) {
      showToast('Vui lòng điền tiêu đề, giá và ít nhất 1 ảnh!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('products')
        .insert({
          owner_id: user.id,
          title: productForm.title,
          price: parseInt(productForm.price.toString()),
          category: productForm.category,
          condition: productForm.condition,
          brand: productForm.brand,
          warranty: productForm.warranty,
          address_summary: productForm.address_summary,
          description: productForm.description,
          stock: parseInt(productForm.stock.toString()) || 1,
          image_url: validImages[0], 
          images: validImages,
          status: 'available'
        });

      if (error) throw error;

      showToast('Đăng bài bán đồ thành công!', 'success');
      setShowCreateModal(false);
      setProductForm({
        title: '', price: '', category: 'Nội thất', 
        condition: 'Mới', brand: '', warranty: 'Không bảo hành', 
        address_summary: '', description: '', images: ['', '', ''], stock: 1
      });
      fetchProducts();
    } catch (error) {
      console.error('Error creating product:', error);
      showToast('Có lỗi xảy ra khi lưu vào Database.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === categories.find(c => c.id === activeCategory)?.label);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <CartDrawer isOpen={showCart} onClose={() => setShowCart(false)} onNavigate={onNavigate} />

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 z-[100] bg-slate-900 text-white w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center hover:-translate-y-1 transition-all"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md">{cartCount}</span>
        </button>
      )}

      <Header user={user} onLogout={onLogout} onNavigate={onNavigate} activePath="store">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-sm outline-none transition-all" 
            placeholder="Tìm kiếm báo giá online..." 
            type="text"
          />
        </div>
      </Header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
        <div className="flex flex-col gap-10">
          {/* Hero Banner */}
          <section className="relative h-[250px] md:h-[300px] rounded-[32px] overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-10"></div>
            <img 
              alt="Store Hero" 
              className="absolute inset-0 w-full h-full object-cover" 
              src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=1920"
              referrerPolicy="no-referrer"
            />
            <div className="relative z-20 h-full flex flex-col justify-center px-8 md:px-12 text-white">
              <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight font-display">
                Chợ đồ cũ sinh viên<br/>Siêu tiết kiệm
              </h1>
              <p className="text-white/80 max-w-md mb-8 text-sm md:text-base font-medium">
                Tìm đồ gia dụng, nội thất giá siêu rẻ từ những người thuê trọ khác. Trải nghiệm trực tuyến, thanh toán an toàn.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-primary hover:bg-primary-hover text-white px-6 md:px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Đăng bán đồ
                </button>
              </div>
            </div>
          </section>

          {/* Categories */}
          <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {categories.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm border ${
                  activeCategory === cat.id 
                    ? 'bg-primary text-white border-primary shadow-orange-100' 
                    : 'bg-white text-slate-500 border-slate-100 hover:border-primary/50 hover:text-primary'
                }`}
              >
                <cat.icon className="w-5 h-5" />
                {cat.label}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {loading ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="font-bold text-slate-400">Đang tải sản phẩm...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                <Sparkles className="w-16 h-16 text-slate-200 mb-4" />
                <h3 className="text-xl font-black text-slate-900 mb-2">Chưa có sản phẩm nào</h3>
                <button onClick={() => setShowCreateModal(true)} className="bg-primary text-white px-8 py-3 rounded-xl font-black text-xs mt-4 uppercase shadow-xl hover:-translate-y-1 transition-transform">
                  Trở thành người bán đầu tiên
                </button>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <motion.div 
                   key={product.id}
                   layout
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   whileHover={{ y: -8 }}
                   className="group bg-white rounded-[24px] overflow-hidden border border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 flex flex-col"
                >
                   {/* Đã sửa SỰ KIỆN CLICK Điều hướng sang Trang Chi Tiết Mới */}
                   <div 
                     className="relative aspect-[4/5] bg-slate-50 overflow-hidden cursor-pointer"
                     onClick={() => onNavigate('store-detail', { id: product.id })}
                   >
                     <img 
                       alt={product.title} 
                       className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                       src={product.image_url}
                       referrerPolicy="no-referrer"
                     />
                     <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {product.condition && (
                            <div className="bg-primary text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg w-max">
                              {product.condition}
                            </div>
                        )}
                     </div>
                   </div>
                   <div className="p-6 flex flex-col grow">
                     <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">{product.category}</p>
                     <h3 
                       className="text-slate-900 font-bold text-base mb-3 group-hover:text-primary transition-colors font-display line-clamp-2 cursor-pointer"
                       onClick={() => onNavigate('store-detail', { id: product.id })}
                     >
                       {product.title}
                     </h3>
                     
                     <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                       <span className="text-xl font-black text-slate-900 font-display text-rose-500">{Number(product.price).toLocaleString()}đ</span>
                     </div>
                   </div>
                </motion.div>
              ))
            )}
           </div>
        </div>
      </main>

      {/* CREATE PRODUCT MODAL - Dành cho đăng bài bán hàng */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto pt-10 pb-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[40px] w-full max-w-4xl shadow-2xl overflow-hidden my-auto border border-slate-100"
            >
              <div className="bg-slate-900 px-8 py-8 text-white relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                     <PlusCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black font-display text-white">Đăng tin bán chuyên nghiệp</h3>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 transition-all text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                   <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <LayoutGrid className="w-5 h-5 text-primary" /> Album Hình ảnh (Tối đa 3 ảnh)
                   </h4>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {productForm.images.map((img, idx) => (
                         <div key={idx} className="relative">
                            <input 
                              className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 outline-none focus:border-primary/50 text-xs font-semibold pr-10"
                              placeholder={`URL Ảnh ${idx + 1} ${idx === 0 ? '(Bắt buộc)' : ''}`}
                              value={img}
                              onChange={(e) => handleImageChange(idx, e.target.value)}
                            />
                            {img && (
                                <img src={img} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md object-cover border border-slate-200" />
                            )}
                         </div>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-3">Tên sản phẩm *</label>
                        <input className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-primary/30 font-semibold" placeholder="Bàn Ghế Gỗ Xoài (Dưới 30 ký tự)" value={productForm.title} onChange={(e) => setProductForm({ ...productForm, title: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-3">Giá bán VNĐ *</label>
                        <input type="number" className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-primary/30 font-semibold" placeholder="Vd: 500000" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-3">Tình trạng</label>
                        <select className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none font-semibold appearance-none" value={productForm.condition} onChange={(e) => setProductForm({ ...productForm, condition: e.target.value })}>
                            <option value="Mới nguyên seal">Mới nguyên seal</option>
                            <option value="Như mới (Like New)">Như mới (Like New)</option>
                            <option value="Cũ (Chưa qua sửa chữa)">Cũ (Chưa qua sửa chữa)</option>
                            <option value="Cũ sửa chữa nhẹ">Cũ sửa chữa nhẹ</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-3">Bảo hành</label>
                        <select className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none font-semibold appearance-none" value={productForm.warranty} onChange={(e) => setProductForm({ ...productForm, warranty: e.target.value })}>
                            <option value="Không bảo hành">Không bảo hành</option>
                            <option value="Bảo hành 1 tháng">Bảo hành 1 tháng</option>
                            <option value="Bảo hành 3 tháng">Bảo hành 3 tháng</option>
                            <option value="Bảo hành hãng 12 tháng">Bảo hành hãng 12 tháng</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-3">Số lượng có sẵn *</label>
                        <input type="number" min="1" className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-primary/30 font-semibold" placeholder="Vd: 1" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 1 })} />
                      </div>
                  </div>
                  
                  <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-3">Danh mục</label>
                        <select className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none font-semibold appearance-none" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}>
                            {categories.filter(c => c.id !== 'all').map(c => (
                                <option key={c.id} value={c.label}>{c.label}</option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-3">Thương hiệu / Xuất xứ</label>
                        <input className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-primary/30 font-semibold" placeholder="Vd: Hòa Phát, Daikin..." value={productForm.brand} onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-3">Khu vực Giao dịch</label>
                        <input className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-primary/30 font-semibold" placeholder="Số nhà, Tên Đường, Quận..." value={productForm.address_summary} onChange={(e) => setProductForm({ ...productForm, address_summary: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-3">Mô tả chi tiết</label>
                        <textarea className="w-full bg-white border-2 border-slate-100 rounded-3xl px-6 py-4 outline-none focus:border-primary/30 font-semibold min-h-[140px] resize-none" placeholder="Hãy viết mô tả thật hay và rõ ràng để thu hút người mua nhé! Càng chi tiết càng bán nhanh..." value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
                      </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100 mt-8 flex gap-4">
                  <button onClick={() => setShowCreateModal(false)} className="flex-[1] py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 bg-slate-50 hover:bg-slate-100">Hủy</button>
                  <button onClick={handleCreateProduct} disabled={isSubmitting} className="flex-[3] bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2 hover:-translate-y-1 transition-all">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5"/> Hoàn tất đăng tin</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};
