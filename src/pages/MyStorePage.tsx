import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useToast } from '../context/ToastContext';
import {
  LayoutGrid, Trash2, Edit3, PlusCircle, X, CheckCircle2, Loader2, ArrowLeft,
  Store, AlertCircle, ShoppingBag, Package, Truck, Clock, DollarSign,
  CheckCheck, MapPin, ThumbsUp, ChevronDown
} from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { ProductModal } from '../components/ProductModal';

interface MyStorePageProps {
  onNavigate: (page: string, params?: any) => void;
  user: SupabaseUser | null;
  onLogout: () => void;
}

// ── Status helpers ──────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:   { label: 'Chờ xác nhận', color: 'text-amber-600',  bg: 'bg-amber-100',  icon: <Clock className="w-3 h-3"/> },
  confirmed: { label: 'Đã xác nhận',  color: 'text-blue-600',   bg: 'bg-blue-100',   icon: <ThumbsUp className="w-3 h-3"/> },
  shipping:  { label: 'Đang giao',     color: 'text-purple-600', bg: 'bg-purple-100', icon: <Truck className="w-3 h-3"/> },
  delivered: { label: 'Đã giao',       color: 'text-teal-600',   bg: 'bg-teal-100',   icon: <MapPin className="w-3 h-3"/> },
  completed: { label: 'Hoàn tất',      color: 'text-emerald-600',bg: 'bg-emerald-100',icon: <CheckCheck className="w-3 h-3"/> },
  failed:    { label: 'Thất bại',      color: 'text-rose-600',   bg: 'bg-rose-100',   icon: <X className="w-3 h-3"/> },
  cancelled: { label: 'Đã hủy',        color: 'text-slate-500',  bg: 'bg-slate-100',  icon: <X className="w-3 h-3"/> },
};

const TIMELINE_STEPS = [
  { key: 'pending',   label: 'Đặt hàng' },
  { key: 'confirmed', label: 'Xác nhận' },
  { key: 'shipping',  label: 'Đang giao' },
  { key: 'delivered', label: 'Đã nhận' },
];

const getStepIndex = (status: string) => {
  const map: Record<string, number> = { pending: 0, confirmed: 1, shipping: 2, delivered: 3, completed: 3 };
  return map[status] ?? -1;
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black ${cfg.bg} ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ── Timeline for buyer ──────────────────────────────────────────
function OrderTimeline({ status }: { status: string }) {
  if (['failed', 'cancelled'].includes(status)) return null;
  const current = getStepIndex(status);
  return (
    <div className="flex items-center justify-between py-6 px-2">
      {TIMELINE_STEPS.map((step, i) => (
        <React.Fragment key={step.key}>
          <div className="flex flex-col items-center relative z-10">
            <motion.div 
              initial={false}
              animate={{ 
                scale: i <= current ? 1 : 0.9,
                backgroundColor: i < current ? 'var(--primary)' : i === current ? '#fff' : '#f8fafc',
                borderColor: i <= current ? 'var(--primary)' : '#e2e8f0',
                color: i < current ? '#fff' : i === current ? 'var(--primary)' : '#94a3b8'
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all shadow-sm`}
            >
              {i < current ? <CheckCheck className="w-5 h-5"/> : i + 1}
            </motion.div>
            <span className={`text-[10px] sm:text-[11px] font-black mt-2 tracking-widest uppercase text-center transition-colors ${i <= current ? 'text-primary' : 'text-slate-400'}`}>
              {step.label}
            </span>
          </div>
          {i < TIMELINE_STEPS.length - 1 && (
            <div className="flex-1 h-0.5 mx-[-18px] mb-7 relative overflow-hidden bg-slate-100">
                <motion.div 
                    initial={false}
                    animate={{ width: i < current ? '100%' : '0%' }}
                    className="absolute inset-0 bg-primary"
                />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Seller action buttons ───────────────────────────────────────
const SELLER_ACTIONS: Record<string, { label: string; next: string; color: string; icon: React.ReactNode } | null> = {
  pending:   { label: 'Xác nhận đơn hàng',  next: 'confirmed', color: 'bg-blue-500 hover:bg-blue-600 text-white',    icon: <ThumbsUp className="w-4 h-4"/> },
  confirmed: { label: 'Bắt đầu giao hàng',  next: 'shipping',  color: 'bg-purple-500 hover:bg-purple-600 text-white', icon: <Truck className="w-4 h-4"/> },
  shipping:  { label: 'Xác nhận đã giao',   next: 'delivered', color: 'bg-teal-500 hover:bg-teal-600 text-white',     icon: <MapPin className="w-4 h-4"/> },
  delivered: null,
  completed: null,
  failed:    null,
  cancelled: null,
};

export const MyStorePage = ({ onNavigate, user, onLogout }: MyStorePageProps) => {
  const [activeTab, setActiveTab] = useState<'store' | 'sales' | 'purchases'>('store');
  const [products, setProducts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showNoteInput, setShowNoteInput] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const { showToast } = useToast();

  const categories = [
    { id: 'electronics', label: 'Đồ điện tử' },
    { id: 'furniture', label: 'Nội thất' },
    { id: 'kitchen', label: 'Bếp & Đồ dùng' },
    { id: 'decor', label: 'Trang trí' },
    { id: 'cleaning', label: 'Vệ sinh' },
    { id: 'bedroom', label: 'Phòng ngủ' },
  ];

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (activeTab === 'store') {
        const { data, error } = await supabase
          .from('products').select('*').eq('owner_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setProducts(data || []);
      } else if (activeTab === 'purchases') {
        const { data, error } = await supabase
          .from('orders').select('*').eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setPurchases(data || []);
      } else if (activeTab === 'sales') {
        const { data, error } = await supabase
          .from('orders').select('*')
          .filter('items', 'cs', JSON.stringify([{ owner_id: user.id }]))
          .order('created_at', { ascending: false });
        if (error) throw error;
        setSales(data || []);
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      showToast('Lỗi khi lấy dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) { onNavigate('login'); return; }
    fetchData();
  }, [user, activeTab]);

  // ── Seller: Update order status ─────────────────────────────
  const handleSellerUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const updatePayload: any = { status: newStatus };
      if (noteText.trim()) {
        updatePayload.seller_note = noteText.trim();
      }

      const { error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId);

      if (error) throw error;

      // Nếu Delivered → cũng trừ kho (COD chưa trừ lúc đặt)
      if (newStatus === 'delivered') {
        const order = sales.find(o => o.id === orderId);
        if (order?.items) {
          const myItems = order.items.filter((i: any) => i.owner_id === user?.id);
          for (const item of myItems) {
            await supabase.rpc('reduce_product_stock_and_hide', {
              product_id: item.id,
              quantity_bought: (item.quantity || 1)
            });
          }
        }
      }

      const labelMap: Record<string, string> = {
        confirmed: '✅ Đã xác nhận đơn hàng!',
        shipping:  '🚚 Đã chuyển sang trạng thái đang giao!',
        delivered: '📦 Đã xác nhận giao hàng thành công!',
        cancelled: '❌ Đã hủy đơn hàng.',
      };
      showToast(labelMap[newStatus] || 'Cập nhật thành công', 'success');
      setNoteText('');
      setShowNoteInput(null);
      fetchData();
    } catch (err: any) {
      showToast('Lỗi khi cập nhật trạng thái: ' + (err.message || ''), 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // ── Buyer: Cancel order ────────────────────────────────────
  const handleCancelOrder = async (id: string) => {
    if (!window.confirm('Bạn muốn hủy đơn hàng này?')) return;
    try {
      const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', id);
      if (error) throw error;
      showToast('Đã hủy đơn hàng thành công', 'success');
      fetchData();
    } catch { showToast('Không thể hủy đơn hàng.', 'error'); }
  };

  // ── Product edit ───────────────────────────────────────────
  const startEditProduct = (product: any) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const startCreateProduct = () => {
    setSelectedProduct(null);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa vĩnh viễn sản phẩm này?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      showToast('Đã xóa thành công', 'success');
      fetchData();
    } catch { showToast('Có lỗi xảy ra', 'error'); }
  };

  // ── Order card renderer (shared) ────────────────────────────
  const renderOrderCard = (order: any) => {
    const isSalesTab = activeTab === 'sales';
    let displayItems = order.items;
    let displayTotal = order.total_amount;

    if (isSalesTab && user) {
      displayItems = order.items.filter((i: any) => i.owner_id === user.id);
      displayTotal = displayItems.reduce((s: number, i: any) => s + Number(i.price) * (i.quantity || 1), 0);
    }

    const canBuyerCancel = !isSalesTab && ['pending', 'confirmed'].includes(order.status);
    const canSellerCancel = isSalesTab && ['pending', 'confirmed'].includes(order.status);
    const sellerAction = isSalesTab ? SELLER_ACTIONS[order.status] : null;
    const isUpdating = updatingOrderId === order.id;
    const showNote = showNoteInput === order.id;

    return (
      <motion.div
        key={order.id}
        layout
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-300"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Main Content Area (Items & Details) */}
          <div className="lg:col-span-8 p-4 sm:p-7 border-b lg:border-b-0 lg:border-r border-slate-100">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 bg-slate-900 rounded-xl text-white">
                  <span className="text-[10px] font-black uppercase tracking-widest font-mono shrink-0">
                    ID: {order.id.substring(0, 8).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Đặt ngày</span>
                  <span className="text-sm font-bold text-slate-900">
                    {new Date(order.created_at).toLocaleDateString('vi-VN', { 
                        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <StatusBadge status={order.status} />
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-black text-slate-500 uppercase tracking-wider">
                   {order.payment_method === 'cod' ? '💵 COD' : '💳 VNPAY'}
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-4">
              {displayItems.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 group">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100 shadow-sm transition-transform group-hover:scale-105">
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="font-black text-slate-900 text-base line-clamp-1 group-hover:text-primary transition-colors">{item.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-slate-400 uppercase">Số lượng:</span>
                        <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">{item.quantity || 1}</span>
                        <span className="text-slate-200">|</span>
                        <span className="text-xs font-black text-slate-900">{Number(item.price).toLocaleString()}đ</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-black text-slate-900 font-display">
                        {(Number(item.price) * (item.quantity || 1)).toLocaleString()}đ
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery Info */}
            <div className="mt-8 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-primary" /> Thông tin giao hàng
                </h5>
                <div className="flex flex-col gap-1">
                    <p className="text-sm font-bold text-slate-700 leading-relaxed">
                        {order.address}
                    </p>
                </div>
            </div>

            {/* Seller Note display */}
            {order.seller_note && (
              <div className="mt-4 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex gap-3 italic">
                <AlertCircle className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Cập nhật từ người bán:</span>
                    <p className="text-sm text-indigo-700 font-medium">{order.seller_note}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action & Status Sidebar Area */}
          <div className="lg:col-span-4 bg-slate-50/50 flex flex-col">
            {/* Timeline for buyer */}
            {!isSalesTab && !['failed','cancelled'].includes(order.status) && (
              <div className="p-7 flex-grow">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Tiến trình đơn hàng</h5>
                <OrderTimeline status={order.status} />
              </div>
            )}

            {/* Summary & Actions */}
            <div className={`p-7 ${(!isSalesTab && !['failed','cancelled'].includes(order.status)) ? 'border-t border-slate-100' : 'flex-grow flex flex-col justify-center'}`}>
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            {isSalesTab ? 'Lợi nhuận dự tính' : 'Tổng cộng'}
                        </span>
                        {canBuyerCancel && (
                             <button
                                onClick={() => handleCancelOrder(order.id)}
                                className="text-[10px] font-black text-rose-500 hover:text-white hover:bg-rose-500 border border-rose-200 hover:border-rose-500 px-3 py-1 rounded-lg transition-all uppercase tracking-widest"
                            >
                                Hủy đơn
                            </button>
                        )}
                    </div>
                    <p className="text-4xl font-black text-slate-900 font-display transition-all">
                        {Number(displayTotal).toLocaleString()}<span className="text-xl ml-1 text-slate-400">đ</span>
                    </p>
                </div>

                {/* Actions for seller */}
                {isSalesTab && (sellerAction || canSellerCancel) && (
                    <div className="space-y-4">
                        {sellerAction && (
                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowNoteInput(showNote ? null : order.id)}
                                    className="flex items-center gap-2 text-[11px] text-slate-400 hover:text-slate-900 font-black uppercase tracking-widest transition-colors"
                                >
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showNote ? 'rotate-180' : ''}`} />
                                    {showNote ? 'Ẩn ghi chú' : 'Thêm lời nhắn cho khách'}
                                </button>
                                
                                <AnimatePresence>
                                    {showNote && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                        <textarea
                                            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none shadow-inner"
                                            rows={2}
                                            placeholder="Ghi chú cho người mua (VD: Sẽ giao sớm)..."
                                            value={noteText}
                                            onChange={e => setNoteText(e.target.value)}
                                        />
                                    </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    disabled={isUpdating}
                                    onClick={() => handleSellerUpdateStatus(order.id, sellerAction.next)}
                                    className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${sellerAction.color} disabled:opacity-50`}
                                >
                                    {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : sellerAction.icon}
                                    {isUpdating ? 'Vui lòng chờ...' : sellerAction.label}
                                </button>
                            </div>
                        )}

                        {canSellerCancel && (
                             <button
                                disabled={isUpdating}
                                onClick={() => handleSellerUpdateStatus(order.id, 'cancelled')}
                                className="w-full py-4 rounded-2xl text-xs font-black text-slate-500 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                            >
                                Từ chối đơn hàng
                            </button>
                        )}
                    </div>
                )}

                {/* Non-actionable completed/failed state for seller */}
                {isSalesTab && !sellerAction && !canSellerCancel && (
                    <div className="py-4 px-5 bg-slate-100/50 rounded-2xl border border-slate-200/50 text-center">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Trạng thái cuối cùng</p>
                        <p className="text-sm font-bold text-slate-600"> {order.status === 'completed' ? 'Đã hoàn thành' : 'Đã hủy'}.</p>
                    </div>
                )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header user={user} onLogout={onLogout} onNavigate={onNavigate} activePath="my-store" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
        <div className="flex flex-col gap-8">

          {/* Title */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <button onClick={() => onNavigate('store')} className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-sm font-bold w-max mb-2">
                <ArrowLeft className="w-4 h-4" /> Về Chợ đồ cũ
              </button>
              <h1 className="text-3xl font-black text-slate-900 font-display flex items-center gap-3">
                <ShoppingBag className="w-8 h-8 text-primary" /> Quản lý Mua Bán
              </h1>
              <p className="text-slate-500 font-medium text-sm mt-1">Theo dõi mặt hàng rao bán và lịch sử giao dịch của bạn.</p>
            </div>
            {activeTab === 'store' && (
              <button onClick={startCreateProduct} className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center gap-2 w-max">
                <PlusCircle className="w-5 h-5" /> Đăng mặt hàng mới
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100 w-full md:w-max">
            {[
              { key: 'store', icon: <Store className="w-4 h-4"/>, label: 'Cửa hàng' },
              { key: 'purchases', icon: <Package className="w-4 h-4"/>, label: 'Đơn Mua' },
              { key: 'sales', icon: <DollarSign className="w-4 h-4"/>, label: 'Đơn Bán' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm uppercase tracking-wide transition-all flex-1 md:flex-none ${activeTab === tab.key ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-3 sm:p-6 min-h-[50vh]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="font-bold text-slate-400">Đang tải dữ liệu...</p>
              </div>
            ) : activeTab === 'store' ? (
              products.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Store className="w-16 h-16 text-slate-200 mb-4" />
                  <h3 className="text-xl font-black text-slate-900 mb-2">Gian hàng trống</h3>
                  <p className="text-slate-500 text-sm mb-6">Bạn chưa rao bán mặt hàng nào.</p>
                  <button onClick={() => onNavigate('store')} className="bg-primary/10 text-primary hover:bg-primary/20 px-6 py-3 rounded-xl font-black text-xs uppercase">Về Chợ</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                   {products.map(product => (
                    <motion.div key={product.id} layout className="bg-white rounded-[24px] overflow-hidden border border-slate-100 hover:shadow-xl transition-all duration-300 flex flex-col h-full shadow-sm">
                      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                        <img 
                          alt={product.title} 
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
                          src={product.image_url} 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 left-3">
                          <span className={`text-[10px] font-black text-white px-2.5 py-1.5 rounded-lg uppercase tracking-widest shadow-lg ${product.status === 'hidden' ? 'bg-slate-800/90' : 'bg-emerald-500/90'} backdrop-blur-sm`}>
                            {product.status === 'hidden' ? 'Đã Ẩn' : 'Đang Bán'}
                          </span>
                        </div>
                      </div>
                      <div className="p-5 flex flex-col flex-grow">
                        <h3 className="text-slate-900 font-bold text-sm mb-3 line-clamp-2 min-h-[40px] leading-snug">{product.title}</h3>
                        <div className="mt-auto">
                          <div className="flex items-baseline gap-1 mb-1">
                            <span className="text-lg font-black text-rose-500 font-display">{Number(product.price).toLocaleString()}đ</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                            <span>Tồn kho: {product.stock}</span>
                            <span className="text-primary italic">{product.category}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-5">
                          <button onClick={() => startEditProduct(product)} className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-orange-100/60 hover:bg-orange-100 text-orange-600 text-xs font-black uppercase transition-colors"><Edit3 className="w-3.5 h-3.5" /> Sửa</button>
                          <button onClick={() => handleDeleteProduct(product.id)} className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-100/60 hover:bg-red-100 text-red-600 text-xs font-black uppercase transition-colors"><Trash2 className="w-3.5 h-3.5" /> Xóa</button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            ) : (
              (activeTab === 'purchases' ? purchases : sales).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Package className="w-16 h-16 text-slate-200 mb-4" />
                  <h3 className="text-xl font-black text-slate-900 mb-2">Chưa có giao dịch</h3>
                  <p className="text-slate-500 text-sm">Bạn chưa có hóa đơn nào ở đây.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {(activeTab === 'purchases' ? purchases : sales).map(order => renderOrderCard(order))}
                </div>
              )
            )}
          </div>
        </div>
      </main>

      <ProductModal 
        isOpen={showProductModal} 
        onClose={() => setShowProductModal(false)} 
        user={user} 
        product={selectedProduct} 
        onSuccess={fetchData} 
      />

      <Footer />
    </div>
  );
};
