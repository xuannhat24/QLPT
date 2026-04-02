import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { CartDrawer } from '../components/CartDrawer';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  Tag, Box, MapPin, ShieldCheck, Star, ArrowRight, ShoppingCart, MessageSquare, AlertCircle, Loader2, Heart
} from 'lucide-react';

interface StoreDetailPageProps {
  onNavigate: (page: string, params?: any) => void;
  user: User | null;
  onLogout: () => void;
  params?: any;
}

export const StoreDetailPage = ({ onNavigate, user, onLogout, params }: StoreDetailPageProps) => {
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const { showToast } = useToast();
  const { addToCart, isInCart, cartCount } = useCart();

  const handleAddToCart = () => {
    if (!product) return;
    if (!user) {
      showToast('Vui lòng đăng nhập để thêm vào giỏ hàng!', 'warning');
      onNavigate('login');
      return;
    }

    if (user.id === product.owner_id) {
      showToast('Bạn không thể tự mua hàng của chính mình!', 'warning');
      return;
    }
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image_url: product.image_url,
      condition: product.condition,
      quantity: 1,
      owner_id: product.owner_id,
    });
    showToast(`Đã thêm "${product.title.substring(0, 30)}..." vào giỏ hàng!`, 'success');
    setShowCart(true);
  };

  useEffect(() => {
    const fetchProductDetail = async () => {
      if (!params?.id) {
        showToast("Không tìm thấy mã sản phẩm!", "error");
        onNavigate('store');
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) throw error;
        setProduct(data);

        // Fetch Related Products
        if (data?.category) {
          const { data: related } = await supabase
            .from('products')
            .select('*')
            .eq('category', data.category)
            .neq('id', data.id)
            .limit(4);
          if (related) setRelatedProducts(related);
        }

        if (data?.owner_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.owner_id)
            .single();
          if (profile) setOwnerProfile(profile);
        }
      } catch (err) {
        console.error('Error fetching product detail:', err);
        showToast("Lỗi khi tải thông tin sản phẩm.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
    // Reset scroll when product changes
    window.scrollTo(0, 0);
  }, [params?.id]);

  const handleBuyNow = async () => {
    if (!product) return;
    if (!user) {
      showToast("Vui lòng đăng nhập để mua hàng!", "warning");
      onNavigate('login');
      return;
    }
    
    if (user.id === product.owner_id) {
      showToast("Tất nhiên bạn không thể tự mua hàng của chính mình!", "info");
      return;
    }

    onNavigate('checkout', { singleProduct: {
      id: product.id,
      title: product.title,
      price: product.price,
      image_url: product.image_url,
      condition: product.condition,
      quantity: 1,
      owner_id: product.owner_id
    }});
  };

  const handleContactSeller = async () => {
    if (!product) return;
    if (!user) {
      showToast("Vui lòng đăng nhập để liên hệ người bán!", "warning");
      onNavigate('login');
      return;
    }
    
    const sellerId = product.owner_id;
    if (user.id === sellerId) {
      showToast("Bạn không thể chat với chính mình!", "info");
      return;
    }
    
    setIsProcessing(true);
    try {
      const { data: existing } = await supabase
        .from('conversations')
        .select('id, landlord_id, tenant_id')
        .or(`landlord_id.eq.${sellerId},tenant_id.eq.${sellerId}`)
        .or(`landlord_id.eq.${user.id},tenant_id.eq.${user.id}`);
      
      let conversation = existing?.find((c: any) => 
        (c.landlord_id === sellerId && c.tenant_id === user.id) || 
        (c.landlord_id === user.id && c.tenant_id === sellerId)
      );

      let conversationId = conversation?.id;

      if (!conversationId) {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({ landlord_id: sellerId, tenant_id: user.id })
          .select()
          .single();
        conversationId = newConv?.id;
      }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      const role = profile?.role || 'tenant';
      const targetPage = (role === 'landlord' || role === 'admin') ? 'manage' : 'tenant';

      onNavigate(targetPage, { tab: 'messages', activeChat: conversationId });
      
    } catch (error) {
      console.error('Lỗi Chat:', error);
      showToast("Đã có lỗi xảy ra khi tạo luồng tin nhắn.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="font-bold text-slate-500">Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-4">
        <h2 className="text-2xl font-black text-slate-800">Không tìm thấy sản phẩm này</h2>
        <button onClick={() => onNavigate('store')} className="text-primary font-bold hover:underline">Quay lại cửa hàng</button>
      </div>
    );
  }

  const galleryImages = Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image_url || 'https://via.placeholder.com/800?text=No+Image'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
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
        onNavigate={onNavigate as any} 
        activePath="store" 
      />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Breadcrumb Navigation */}
        <div className="text-sm font-semibold text-slate-400 mb-8 flex items-center space-x-2">
          <button onClick={() => onNavigate('home')} className="hover:text-primary transition-colors">Trang chủ</button>
          <span>/</span>
          <button onClick={() => onNavigate('store')} className="hover:text-primary transition-colors">Chợ đồ cũ</button>
          <span>/</span>
          <span className="text-slate-900 truncate max-w-xs">{product.category}</span>
          <span>/</span>
          <span className="text-slate-900 truncate hidden sm:block max-w-sm">{product.title}</span>
        </div>

        {/* 2-Column Product Layout (ChoTot Replica) */}
        <div className="bg-white rounded-[40px] w-full shadow-2xl xl:shadow-slate-200/50 overflow-hidden flex flex-col lg:flex-row relative border border-slate-100 mb-12">
           
           {/* LEFT VIEW: Images & Content description */}
           <div className="w-full lg:w-[60%] border-r border-slate-100 bg-white">
              <div className="w-full bg-slate-50/50 flex flex-col p-4 sm:p-8">
                  {/* Main Image Spotlight */}
                  <div className="relative aspect-video lg:aspect-[4/3] w-full mx-auto rounded-3xl overflow-hidden shadow-sm border border-slate-200/50 bg-slate-100 group">
                     <img 
                       src={galleryImages[activeImageIndex] || 'https://via.placeholder.com/800x600?text=No+Image'} 
                       className="w-full h-full object-cover cursor-zoom-in group-hover:scale-105 transition-transform duration-500" 
                       onClick={() => window.open(galleryImages[activeImageIndex], '_blank')}
                       referrerPolicy="no-referrer"
                     />
                     <div className="absolute top-4 left-4">
                        {product.condition && (
                            <div className="bg-primary/90 backdrop-blur text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg">
                              {product.condition}
                            </div>
                        )}
                     </div>
                  </div>
                  
                  {/* Thumbnails Row */}
                  {galleryImages.length > 1 && (
                     <div className="flex items-center justify-center gap-3 mt-6 h-20 overflow-x-auto pb-2 scrollbar-hide px-2">
                        {galleryImages.map((img: string, idx: number) => (
                           img && (
                           <button 
                             key={idx} 
                             onClick={() => setActiveImageIndex(idx)}
                             className={`flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden cursor-pointer border-[3px] transition-all hover:-translate-y-1 ${activeImageIndex === idx ? 'border-primary opacity-100 shadow-xl shadow-orange-500/20' : 'border-transparent opacity-50 hover:opacity-100'}`}
                           >
                              <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                           </button>
                           )
                        ))}
                     </div>
                  )}
              </div>

              {/* Informative Table & Long Description */}
              <div className="p-6 sm:p-10 border-t border-slate-50">
                 <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4 font-display leading-tight">{product.title}</h2>
                 <p className="text-3xl font-black text-primary font-display mb-8 lg:hidden">{Number(product.price).toLocaleString()}đ</p>
                 
                 <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 mb-10 border border-slate-100 grid grid-cols-2 gap-y-8 gap-x-6">
                    <div>
                       <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Tag className="w-4 h-4 text-slate-300"/> Tình trạng</div>
                       <div className="font-bold text-slate-800 text-sm">{product.condition || 'N/A'}</div>
                    </div>
                    <div>
                       <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Box className="w-4 h-4 text-slate-300"/> Hãng sản xuất</div>
                       <div className="font-bold text-slate-800 text-sm">{product.brand || 'Khác'}</div>
                    </div>
                    <div>
                       <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-slate-300"/> Bảo hành</div>
                       <div className="font-bold text-slate-800 text-sm">{product.warranty || 'Không bảo hành'}</div>
                    </div>
                    <div>
                       <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-300"/> Giao dịch tại</div>
                       <div className="font-bold text-slate-800 text-sm line-clamp-2">{product.address_summary || 'Trao đổi qua Chat'}</div>
                    </div>
                 </div>

                 <div className="prose prose-slate max-w-none">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">Chi tiết mô tả người bán</h4>
                    <p className="whitespace-pre-wrap text-slate-600 font-medium leading-loose text-sm sm:text-base">
                       {product.description || 'Chưa có thông tin mô tả chi tiết cho sản phẩm này.'}
                    </p>
                 </div>
              </div>
           </div>

           {/* RIGHT VIEW: Sticky Price & Purchase Actions */}
           <div className="w-full lg:w-[40%] sm:p-10 p-6 bg-slate-50/50 shadow-[inset_10px_0_20px_rgba(0,0,0,0.01)] flex flex-col items-stretch">
              <div className="lg:sticky lg:top-24 flex flex-col gap-8">
                
                {/* Price Desktop Component */}
                <div className="hidden lg:block bg-white p-8 rounded-3xl border border-orange-100 shadow-sm">
                    <div className="flex items-end justify-between mb-3">
                       <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Mức giá ưu đãi</p>
                       <p className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1"><Box className="w-3 h-3"/> Tồn kho: {product.stock || 1}</p>
                    </div>
                    <div className="text-5xl font-black text-primary font-display flex items-baseline gap-2">
                       {Number(product.price).toLocaleString()} <span className="text-2xl text-orange-200">đ</span>
                    </div>
                </div>

                {/* Seller ID Card */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                   <div className="flex items-center gap-5 mb-6">
                       <img src={ownerProfile?.avatar_url || 'https://ui-avatars.com/api/?name=' + ownerProfile?.full_name} className="w-20 h-20 rounded-full object-cover ring-4 ring-slate-50" />
                       <div>
                          <p className="font-black text-slate-900 text-xl font-display">{ownerProfile?.full_name || 'Hệ thống Trọ Pro'}</p>
                        
                       </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4 py-5 border-y border-slate-100 mb-5 text-center bg-slate-50/50 rounded-2xl">
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Đánh giá</p>
                         <p className="text-sm font-black text-slate-900 flex justify-center items-center gap-1.5">5.0 <Star className="w-4 h-4 text-amber-400 fill-amber-400"/></p>
                      </div>
                      <div className="border-l border-slate-200">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Hình thức bán</p>
                         <p className="text-sm font-bold text-primary">Cá nhân tự do</p>
                      </div>
                   </div>
                   <button onClick={() => showToast('Chức năng đánh giá user đang phát triển!', 'info')} className="w-full text-sm font-bold text-slate-500 hover:text-primary transition-colors flex items-center justify-center gap-1">
                      Xem cửa hàng của người này <ArrowRight className="w-4 h-4" />
                   </button>
                </div>

                {/* Master Action Buttons */}
                <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleBuyNow} 
                      className="w-full bg-primary text-white py-4 rounded-[20px] font-black text-sm sm:text-base uppercase tracking-widest shadow-xl shadow-orange-500/30 hover:bg-orange-600 transition-all flex items-center justify-center gap-3 group hover:-translate-y-1"
                    >
                       <ShoppingCart className="w-5 h-5 group-active:scale-110 transition-transform" />
                       Mua Ngay
                    </button>

                    <button 
                      onClick={handleAddToCart}
                      className={`w-full py-4 rounded-[20px] font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 group hover:-translate-y-1 border-2 ${
                        isInCart(product.id)
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-primary hover:text-primary'
                      }`}
                    >
                       <Heart className={`w-5 h-5 transition-transform group-hover:scale-110 ${ isInCart(product.id) ? 'fill-emerald-500 text-emerald-500' : ''}`} />
                       {isInCart(product.id) ? 'Đã trong Giỏ hàng ✓' : 'Thêm vào Giỏ hàng'}
                    </button>

                    <button 
                      onClick={handleContactSeller} 
                      disabled={isProcessing}
                      className="w-full bg-slate-900 text-white py-4 rounded-[20px] font-black text-sm uppercase tracking-widest shadow-xl hover:shadow-2xl hover:shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 group hover:-translate-y-1"
                    >
                       {isProcessing ? <Loader2 className="w-5 h-5 animate-spin"/> : <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                       Nhắn tin người bán
                    </button>
                 </div>

                {/* Platform Trust Warning */}
                <div className="bg-orange-50/80 p-6 rounded-3xl border border-orange-100 flex items-start gap-4">
                   <AlertCircle className="w-6 h-6 text-orange-500 shrink-0 mt-0.5" />
                   <p className="text-xs text-orange-800 font-medium leading-relaxed">
                      <strong className="block mb-1 text-sm font-bold">Mẹo từ Trọ Pro:</strong> 
                      Khuyến khích bạn sử dụng tính năng "Chốt Đơn An Toàn" để Trọ Pro có thể bảo vệ và hoàn tiền nếu hàng hóa gặp vấn đề. Hạn chế chuyển tiền riêng bên ngoài!
                   </p>
                </div>
              </div>
           </div>
        </div>

        {/* RELATED PRODUCTS SECTION */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 font-display">Các sản phẩm cùng danh mục</h3>
              <button 
                onClick={() => onNavigate('store')}
                className="text-primary font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all"
              >
                Xem tất cả <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <div 
                  key={p.id}
                  onClick={() => onNavigate('store-detail', { id: p.id })}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-100 hover:shadow-xl transition-all cursor-pointer group"
                >
                  <div className="aspect-[4/5] overflow-hidden relative">
                    <img 
                      src={p.image_url} 
                      alt={p.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/90 backdrop-blur text-[10px] font-black px-2 py-1 rounded-lg text-slate-900 border border-slate-100 uppercase tracking-widest">{p.condition}</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h4 className="font-bold text-slate-800 mb-2 truncate group-hover:text-primary transition-colors">{p.title}</h4>
                    <p className="text-primary font-black text-lg">{Number(p.price).toLocaleString()}đ</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
