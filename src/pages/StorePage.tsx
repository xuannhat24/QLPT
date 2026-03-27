import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useToast } from '../context/ToastContext';
import {
  Home,
  Search,
  User,
  LogOut,
  ShoppingCart,
  Heart,
  Star,
  ChevronLeft,
  ChevronRight,
  Plus,
  LayoutGrid,
  Armchair,
  Utensils,
  Sparkles,
  Trash2,
  Bed,
  PlusCircle,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Loader2
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
  
  // Create Product State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useToast();
  const [productForm, setProductForm] = useState({
    title: '',
    price: '',
    category: 'Nội thất',
    condition: 'Mới',
    description: '',
    image_url: '',
    images: ['']
  });

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [loadingOwner, setLoadingOwner] = useState(false);

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

  const handleCreateProduct = async () => {
    if (!user) {
      showToast('Vui lòng đăng nhập để đăng bán đồ!', 'warning');
      return;
    }

    if (!productForm.title || !productForm.price || !productForm.image_url) {
      showToast('Vui lòng điền đầy đủ các thông tin bắt buộc!', 'warning');
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
          description: productForm.description,
          image_url: productForm.image_url,
          images: productForm.images.filter(img => img.trim() !== ''),
          status: 'available'
        });

      if (error) throw error;

      showToast('Đăng bán sản phẩm thành công!', 'success');
      setShowCreateModal(false);
      setProductForm({
        title: '', price: '', category: 'Nội thất', 
        condition: 'Mới', description: '', image_url: '', images: ['']
      });
      fetchProducts();
    } catch (error) {
      console.error('Error creating product:', error);
      showToast('Hệ thống đang bảo trì. Vui lòng thử lại sau!', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchOwnerProfile = async (ownerId: string) => {
    if (!ownerId) return;
    setLoadingOwner(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', ownerId)
        .single();
      
      if (error) throw error;
      setOwnerProfile(data);
    } catch (error) {
      console.error('Error fetching owner profile:', error);
      setOwnerProfile(null);
    } finally {
      setLoadingOwner(false);
    }
  };

  useEffect(() => {
    if (selectedProduct) {
      fetchOwnerProfile(selectedProduct.owner_id);
    } else {
      setOwnerProfile(null);
    }
  }, [selectedProduct]);

  const handleContactSeller = async (sellerId: string) => {
    if (!user) {
      showToast("Vui lòng đăng nhập để liên hệ người bán!", "warning");
      onNavigate('login');
      return;
    }

    if (user.id === sellerId) {
      showToast("Bạn không thể nhắn tin cho chính mình!", "info");
      return;
    }

    try {
      // 1. Kiểm tra xem đã có hội thoại chưa
      const { data: existing, error: findError } = await supabase
        .from('conversations')
        .select('id, landlord_id, tenant_id')
        .or(`landlord_id.eq.${sellerId},tenant_id.eq.${sellerId}`)
        .or(`landlord_id.eq.${user.id},tenant_id.eq.${user.id}`);
      
      let conversation = existing?.find((c: any) => 
        (c.landlord_id === sellerId && c.tenant_id === user.id) || 
        (c.landlord_id === user.id && c.tenant_id === sellerId)
      );

      let conversationId = conversation?.id;

      // 2. Nếu chưa có -> Tạo mới
      if (!conversationId) {
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            landlord_id: sellerId,
            tenant_id: user.id
          })
          .select()
          .single();
        
        if (createError) throw createError;
        conversationId = newConv.id;
      }

      // 3. Lấy role của user để điều hướng đúng Portal
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      const role = profile?.role || 'tenant';
      const targetPage = (role === 'landlord' || role === 'admin') ? 'manage' : 'tenant';

      // 4. Điều hướng
      onNavigate(targetPage, { tab: 'messages', activeChat: conversationId });
      
    } catch (error) {
      console.error('Error in handleContactSeller:', error);
      showToast("Đã có lỗi xảy ra khi kết nối với người bán.", "error");
    }
  };

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => {
        const cat = categories.find(c => c.id === activeCategory);
        return p.category === cat?.label;
      });

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header user={user} onLogout={onLogout} onNavigate={onNavigate} activePath="store">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-sm outline-none transition-all" 
            placeholder="Tìm kiếm đồ dùng, nội thất..." 
            type="text"
          />
        </div>
      </Header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex flex-col gap-10">
          <section className="relative h-[300px] rounded-[32px] overflow-hidden group shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-10"></div>
            <img 
              alt="Store Hero" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
              src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=1920"
              referrerPolicy="no-referrer"
            />
            <div className="relative z-20 h-full flex flex-col justify-center px-12 text-white">
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-block bg-primary text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg mb-6 w-max shadow-lg"
              >
                Bộ sưu tập 2024
              </motion.span>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl font-black mb-4 leading-tight font-display"
              >
                Cửa hàng tiện ích<br/>Dành cho ngôi nhà mới
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-white/80 max-w-md mb-8 text-sm font-medium"
              >
                Trang bị đầy đủ cho căn phòng trọ của bạn với chi phí tiết kiệm nhất.
              </motion.p>
              <div className="flex gap-4">
                <button className="bg-white text-slate-900 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl">
                  Mua sắm ngay
                </button>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-primary text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-hover transition-all shadow-xl flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Đăng bài bán đồ
                </button>
              </div>
            </div>
          </section>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {loading ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-400 font-bold">Đang tải sản phẩm...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                <Sparkles className="w-16 h-16 text-slate-200 mb-4" />
                <h3 className="text-xl font-black text-slate-900 mb-2">Chưa có sản phẩm nào</h3>
                <p className="text-slate-500 max-w-xs mb-8">Hãy là người đầu tiên đăng bán đồ tại đây!</p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-primary text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-hover transition-all shadow-xl"
                >
                  Đăng bán ngay
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
                   className="group bg-white rounded-[24px] overflow-hidden border border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500"
                >
                   <div 
                     className="relative aspect-[4/5] bg-slate-50 overflow-hidden cursor-pointer"
                     onClick={() => setSelectedProduct(product)}
                   >
                     <img 
                       alt={product.title} 
                       className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                       src={product.image_url}
                       referrerPolicy="no-referrer"
                     />
                     <div className="absolute top-4 left-4 bg-primary text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg">
                       {product.condition}
                     </div>
                     <button className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur rounded-xl text-slate-400 hover:text-primary transition-all shadow-lg hover:scale-110">
                       <Heart className="w-5 h-5" />
                     </button>
                   </div>
                   <div className="p-6">
                     <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">{product.category}</p>
                     <h3 
                       className="text-slate-900 font-black text-base mb-3 group-hover:text-primary transition-colors font-display line-clamp-2 min-h-[3rem] cursor-pointer"
                       onClick={() => setSelectedProduct(product)}
                     >
                       {product.title}
                     </h3>
                     <div className="flex items-center justify-between mt-auto">
                       <div>
                         <span className="text-xl font-black text-slate-900 font-display">{Number(product.price).toLocaleString()}đ</span>
                       </div>
                       <button className="w-12 h-12 bg-slate-900 text-white rounded-2xl hover:bg-primary transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center group-hover:scale-110">
                         <ShoppingCart className="w-5 h-5" />
                       </button>
                     </div>
                   </div>
                </motion.div>
              ))
            )}
           </div>
        </div>
      </main>

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden my-auto"
            >
              <div className="bg-slate-900 px-8 py-10 text-white relative">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 transition-all text-white"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                     <PlusCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black font-display text-white">Đăng bài bán đồ mới</h3>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-3">Tên sản phẩm *</label>
                    <input 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-primary/30 transition-all font-semibold"
                      placeholder="Ví dụ: Bàn học gỗ 1m2"
                      value={productForm.title}
                      onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-3">Giá bán (VNĐ) *</label>
                    <input 
                      type="number"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-primary/30 transition-all font-semibold"
                      placeholder="500000"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                   <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-3">Hình ảnh sản phẩm (Link URL) *</label>
                   <input 
                     className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-primary/30 transition-all font-semibold text-xs"
                     placeholder="Dán link ảnh tại đây..."
                     value={productForm.image_url}
                     onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                   />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-3">Mô tả sản phẩm</label>
                  <textarea 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-6 py-4 outline-none focus:border-primary/30 transition-all font-semibold min-h-[120px] resize-none"
                    placeholder="Mô tả kỹ hơn về sản phẩm..."
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  />
                </div>
                <div className="pt-6 flex gap-4">
                  <button onClick={() => setShowCreateModal(false)} className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400">Hủy</button>
                  <button 
                    onClick={handleCreateProduct}
                    disabled={isSubmitting}
                    className="flex-[2] bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Đăng bán ngay'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 40 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 40 }}
               className="bg-white rounded-[48px] w-full max-w-5xl shadow-2xl overflow-hidden my-auto flex flex-col md:flex-row min-h-[600px]"
            >
               <div className="flex-1 bg-slate-50 relative">
                  <img src={selectedProduct.image_url} className="w-full h-full object-cover" />
                  <button onClick={() => setSelectedProduct(null)} className="absolute top-8 left-8 p-3 bg-white/20 rounded-2xl text-white">
                     <ChevronLeft className="w-6 h-6" />
                  </button>
               </div>
               <div className="flex-1 p-8 md:p-14 flex flex-col relative">
                  <button onClick={() => setSelectedProduct(null)} className="absolute top-8 right-8 p-3 bg-slate-100 rounded-2xl text-slate-400">
                     <X className="w-6 h-6" />
                  </button>
                  <div className="mb-8">
                     <h2 className="text-3xl font-black text-slate-900 mb-4 font-display">{selectedProduct.title}</h2>
                     <div className="text-3xl font-black text-primary font-display">{Number(selectedProduct.price).toLocaleString()}đ</div>
                  </div>
                  <div className="flex-1 space-y-8 overflow-y-auto pr-2">
                      <p className="text-slate-500 font-medium leading-relaxed">{selectedProduct.description || 'Không có mô tả.'}</p>
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-4">
                          <img src={ownerProfile?.avatar_url || 'https://ui-avatars.com/api/?name=' + ownerProfile?.full_name} className="w-12 h-12 rounded-2xl object-cover" />
                          <div>
                             <p className="font-black text-slate-900">{ownerProfile?.full_name || 'Người dùng'}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase">Người bán bài này</p>
                          </div>
                          <button onClick={() => handleContactSeller(selectedProduct.owner_id)} className="ml-auto p-3 bg-white text-primary rounded-xl shadow-sm hover:scale-110 transition-transform">
                             <MessageSquare className="w-5 h-5" />
                          </button>
                      </div>
                  </div>
                  <div className="mt-10 flex gap-4">
                     <button onClick={() => handleContactSeller(selectedProduct.owner_id)} className="flex-1 bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:bg-primary-hover transition-all">
                        Liên hệ ngay
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
