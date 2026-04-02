import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { CartDrawer } from '../components/CartDrawer';
import {
  Search, Plus, LayoutGrid, Armchair, Utensils,
  Sparkles, Trash2, Bed, PlusCircle, X, CheckCircle2, Loader2, ShoppingCart, Store, ShoppingBag, SearchSlash, Smartphone
} from 'lucide-react';
import { StoreSearchBar } from '../components/StoreSearchBar';
import { ProductSkeleton } from '../components/ProductSkeleton';
import { QuickViewModal } from '../components/QuickViewModal';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Eye, ChevronDown } from 'lucide-react';
import { ProductModal } from '../components/ProductModal';

interface StorePageProps {
  onNavigate: (page: string, params?: any) => void;
  user: SupabaseUser | null;
  onLogout: () => void;
}

export const StorePage = ({ onNavigate, user, onLogout }: StorePageProps) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Pagination State
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 12;

  // Quick View State
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showQuickView, setShowQuickView] = useState(false);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { showToast } = useToast();
  const { cartCount, addToCart } = useCart();

  const categories = [
    { id: 'all', label: 'Tất cả', icon: LayoutGrid },
    { id: 'electronics', label: 'Đồ điện tử', icon: Smartphone },
    { id: 'furniture', label: 'Nội thất', icon: Armchair },
    { id: 'kitchen', label: 'Bếp & Đồ dùng', icon: Utensils },
    { id: 'decor', label: 'Trang trí', icon: Sparkles },
    { id: 'cleaning', label: 'Vệ sinh', icon: Trash2 },
    { id: 'bedroom', label: 'Phòng ngủ', icon: Bed },
  ];

  const fetchProducts = async (isAppending = false) => {
    if (!isAppending) setLoading(true);
    else setLoadingMore(true);

    try {
      const from = page * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (debouncedSearch) {
        query = query.or(`title.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%`);
      }

      if (activeCategory !== 'all') {
        const categoryLabel = categories.find(c => c.id === activeCategory)?.label;
        if (categoryLabel) {
          query = query.eq('category', categoryLabel);
        }
      }

      const { data, error, count } = await query;
      
      if (error) throw error;

      if (isAppending) {
        setProducts(prev => [...prev, ...(data || [])]);
      } else {
        setProducts(data || []);
      }

      setHasMore(count ? (from + (data?.length || 0)) < count : false);
    } catch (error) {
      console.error('Error fetching products:', error);
      showToast('Không thể tải danh sách sản phẩm', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
    setHasMore(true);
  }, [activeCategory, debouncedSearch]);

  // Initial and Load More fetch
  useEffect(() => {
    fetchProducts(page > 0);
  }, [activeCategory, debouncedSearch, page]);

  const handleImageChange = (index: number, value: string) => {
    // ... removed old image handler
  };

  const handleCreateProduct = async () => {
    // ... removed old create logic
  };

  const filteredProducts = products;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <CartDrawer 
        isOpen={showCart} 
        onClose={() => setShowCart(false)} 
        onNavigate={onNavigate} 
        user={user}
      />

      {/* Floating Cart Button */}
      <button
        onClick={() => setShowCart(true)}
        className="fixed bottom-6 right-6 z-[100] bg-primary text-white w-14 h-14 rounded-2xl shadow-2xl shadow-orange-500/40 flex items-center justify-center hover:-translate-y-1 transition-all"
      >
        <ShoppingCart className="w-6 h-6" />
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-slate-900 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg">{cartCount}</span>
        )}
      </button>

      <Header 
        user={user} 
        onLogout={onLogout} 
        onNavigate={onNavigate} 
        activePath="store"
      >
        <StoreSearchBar 
          value={searchQuery} 
          onChange={setSearchQuery} 
          onClear={() => setSearchQuery('')} 
        />
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
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-primary hover:bg-primary-hover text-white px-6 md:px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Đăng bán đồ
                </button>
                {user && (
                  <button 
                    onClick={() => onNavigate('my-store')}
                    className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm px-6 md:px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center gap-2 border border-white/20"
                  >
                    <ShoppingBag className="w-4 h-4" /> Quản lý mua bán
                  </button>
                )}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {loading && page === 0 ? (
              Array.from({ length: 8 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))
            ) : products.length === 0 ? (
              <div className="col-span-full py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                <SearchSlash className="w-16 h-16 text-slate-200 mb-4" />
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  {searchQuery ? `Không tìm thấy kết quả cho "${searchQuery}"` : "Chưa có sản phẩm nào"}
                </h3>
                {searchQuery ? (
                   <button 
                    onClick={() => setSearchQuery('')}
                    className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-xs mt-4 uppercase shadow-xl hover:-translate-y-1 transition-transform"
                  >
                    Xóa tìm kiếm
                  </button>
                ) : (
                  <button onClick={() => setShowCreateModal(true)} className="bg-primary text-white px-8 py-3 rounded-xl font-black text-xs mt-4 uppercase shadow-xl hover:-translate-y-1 transition-transform">
                    Trở thành người bán đầu tiên
                  </button>
                )}
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
                     
                     {/* Quick View Overlay */}
                     <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <button 
                             onClick={(e) => {
                                 e.stopPropagation();
                                 setSelectedProduct(product);
                                 setShowQuickView(true);
                             }}
                             className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-primary hover:text-white"
                         >
                             <Eye className="w-4 h-4" /> Xem nhanh
                         </button>
                     </div>

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

           {/* Load More Button */}
           {!loading && hasMore && (
             <div className="mt-12 flex justify-center">
                <button 
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="bg-white hover:bg-slate-50 text-slate-600 px-10 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {loadingMore ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Tải thêm sản phẩm <ChevronDown className="w-5 h-5" />
                    </>
                  )}
                </button>
             </div>
           )}
        </div>
      </main>

      {/* QUICK VIEW MODAL */}
      <QuickViewModal 
        isOpen={showQuickView} 
        onClose={() => setShowQuickView(false)} 
        product={selectedProduct}
        onNavigate={onNavigate}
        onAddToCart={(p) => {
            if (user?.id === p.owner_id) {
                showToast('Bạn không thể tự mua hàng của chính mình!', 'warning');
                return;
            }
            addToCart({
                id: p.id,
                title: p.title,
                price: p.price,
                image_url: p.image_url,
                condition: p.condition,
                quantity: 1,
                owner_id: p.owner_id
            });
            showToast('Đã thêm vào giỏ hàng!', 'success');
            setShowQuickView(false);
        }}
      />

      <ProductModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        user={user} 
        onSuccess={() => fetchProducts()} 
      />

      <Footer />
    </div>
  );
};
