import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Header } from '../components/Header';
import Messaging from '../components/Messaging';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { 
  Building,
  LayoutDashboard,
  Bed,
  FileText,
  MessageSquare,
  User,
  LogOut,
  DoorOpen,
  MapPin,
  Wallet,
  Calendar,
  Wrench,
  Droplets,
  Wind,
  PlusCircle,
  ChevronRight,
  MessageCircle, Search, Users, Phone, Video, Info, ImageIcon, Smile, 
  Send, Mail, PhoneCall, Ban, ShieldAlert, Edit3, Settings,
  ShoppingCart, Trash2, Edit, CheckCircle, Plus
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface TenantPageProps {
  onNavigate: (page: string) => void;
  user: SupabaseUser | null;
  onLogout: () => void;
  initialParams?: any;
}

export const TenantPage = ({ onNavigate, user, onLogout, initialParams }: TenantPageProps) => {
  const [activeTab, setActiveTab] = useState(initialParams?.tab || 'overview');

  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [productsData, setProductsData] = useState<any[]>([]);

  // Product Edit State
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productEditForm, setProductEditForm] = useState({
    title: '',
    price: 0,
    category: '',
    condition: ''
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTenantData();
    }
  }, [user]);

  const fetchTenantData = async () => {
    setLoading(true);
    try {
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('owner_id', user?.id);
      
      setProductsData(products || []);
    } catch (error) {
      console.error('Error fetching tenant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProductClick = (product: any) => {
    setEditingProduct(product);
    setProductEditForm({
      title: product.title || '',
      price: product.price || 0,
      category: product.category || '',
      condition: product.condition || ''
    });
  };

  const handleSaveProductEdit = async () => {
    if (!editingProduct) return;
    setIsSavingProduct(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          title: productEditForm.title,
          price: productEditForm.price,
          category: productEditForm.category,
          condition: productEditForm.condition
        })
        .eq('id', editingProduct.id);

      if (error) throw error;
      showToast('Cập nhật sản phẩm thành công!', 'success');
      setEditingProduct(null);
      fetchTenantData();
    } catch (error) {
      console.error('Error updating product:', error);
      showToast('Lỗi khi cập nhật sản phẩm.', 'error');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      showToast('Đã xóa sản phẩm.', 'success');
      fetchTenantData();
    } catch (error) {
      showToast('Lỗi khi xóa sản phẩm.', 'error');
    }
  };

  const handleToggleProductStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'available' ? 'sold' : 'available';
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      showToast(`Đã chuyển trạng thái sang ${newStatus === 'available' ? 'Đang bán' : 'Đã bán'}.`, 'success');
      fetchTenantData();
    } catch (error) {
      showToast('Lỗi khi cập nhật trạng thái.', 'error');
    }
  };

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'rooms', label: 'Phòng của tôi', icon: Bed },
    { id: 'contracts', label: 'Hợp đồng', icon: FileText },
    { id: 'store', label: 'Cửa hàng', icon: ShoppingCart },
    { id: 'messages', label: 'Tin nhắn', icon: MessageSquare, badge: 3 },
    { id: 'account', label: 'Tài khoản', icon: User },
  ];

  const currentYear = new Date().getFullYear().toString();

  // Mocks based on the HTML
  const monthlyElectric = [
    { month: 'T5', height: '60%' },
    { month: 'T6', height: '85%' },
    { month: 'T7', height: '40%' },
    { month: 'T8', height: '30%' },
    { month: 'T9', height: '55%' },
    { month: 'T10', height: '70%', isCurrent: true },
  ];

  const supportRequests = [
    {
      id: 1,
      title: 'Sửa bóng đèn phòng khách',
      code: '#SUP-8821',
      date: '12/10/2024',
      status: 'Đang xử lý',
      statusColor: 'bg-amber-100 text-amber-700 border-amber-200',
      icon: <Wrench className="w-5 h-5 text-amber-600" />,
      iconBg: 'bg-amber-100 dark:bg-amber-900/30'
    },
    {
      id: 2,
      title: 'Thông tắc bồn rửa mặt',
      code: '#SUP-8750',
      date: '05/10/2024',
      status: 'Hoàn thành',
      statusColor: 'bg-green-100 text-green-700 border-green-200',
      icon: <Droplets className="w-5 h-5 text-green-600" />,
      iconBg: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      id: 3,
      title: 'Vệ sinh điều hòa định kỳ',
      code: '#SUP-8612',
      date: '28/09/2024',
      status: 'Hoàn thành',
      statusColor: 'bg-green-100 text-green-700 border-green-200',
      icon: <Wind className="w-5 h-5 text-slate-600" />,
      iconBg: 'bg-slate-100 dark:bg-slate-800'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <Header user={user} onLogout={onLogout} onNavigate={onNavigate as any} activePath="tenant" />

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
          <div className="p-6 flex-1">
            <div className="flex items-center gap-3 text-primary mb-8 cursor-pointer" onClick={() => onNavigate('home')}>
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 font-display">Tenant Portal</h2>
            </div>
            
            <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${
                  activeTab === item.id 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Welcome Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Chào buổi sáng, {user?.user_metadata?.full_name?.split(' ').pop() || 'An'}! 👋</h2>
                  <p className="text-slate-500">Hôm nay là Thứ Hai, ngày 14 tháng 10 năm {currentYear}</p>
                </div>
                <button className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all active:scale-95">
                  <PlusCircle className="w-5 h-5" />
                  Gửi yêu cầu hỗ trợ
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Room Info */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600">
                      <DoorOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phòng hiện tại</p>
                      <h3 className="text-xl font-bold">Phòng 302</h3>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    123 Chu Văn An, Bình Thạnh, TP.HCM
                  </div>
                </div>

                {/* Payment Status */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tiền thuê tháng 10</p>
                      <h3 className="text-xl font-bold">3.500.000đ</h3>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                      Chưa thanh toán
                    </span>
                    <button className="text-xs font-bold text-primary hover:underline">Thanh toán ngay</button>
                  </div>
                </div>

                {/* Contract */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-green-600">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hết hạn hợp đồng</p>
                      <h3 className="text-xl font-bold">15/12/2024</h3>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">
                    Còn <strong className="text-slate-700 dark:text-slate-300">62 ngày</strong> hiệu lực
                  </div>
                </div>
              </div>

              {/* Usage Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-bold">Tiêu thụ Điện (kWh)</h3>
                      <p className="text-sm text-slate-500">Trung bình 142 kWh/tháng</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-primary">150</span>
                      <span className="text-sm text-slate-400"> kWh</span>
                    </div>
                  </div>
                  <div className="flex items-end justify-between h-48 gap-2">
                    {monthlyElectric.map((item, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 flex-1 group relative">
                        <div 
                          className={`w-full rounded-t-lg transition-all ${item.isCurrent ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-primary/20 group-hover:bg-primary/40'}`} 
                          style={{ height: item.height }}
                        ></div>
                        <span className={`text-[10px] font-bold ${item.isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                          {item.month}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-bold">Tiêu thụ Nước (m3)</h3>
                      <p className="text-sm text-slate-500">Trung bình 10 m3/tháng</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-primary">12</span>
                      <span className="text-sm text-slate-400"> m3</span>
                    </div>
                  </div>
                  <div className="relative h-48 w-full flex items-end">
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <path d="M0,80 Q20,20 40,60 T80,30 T100,50 L100,100 L0,100 Z" fill="rgba(255, 140, 0, 0.1)"></path>
                      <path d="M0,80 Q20,20 40,60 T80,30 T100,50" fill="none" stroke="#FF8C00" strokeLinecap="round" strokeWidth="2"></path>
                    </svg>
                    <div className="absolute bottom-[-24px] w-full flex justify-between px-1">
                      {monthlyElectric.map((item, i) => (
                        <span key={i} className={`text-[10px] font-bold ${item.isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                          {item.month}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Support Requests */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-lg font-bold">Yêu cầu hỗ trợ gần đây</h3>
                  <button className="text-sm font-semibold text-primary hover:underline">Xem tất cả</button>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {supportRequests.map((req) => (
                    <div key={req.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${req.iconBg}`}>
                          {req.icon}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{req.title}</p>
                          <p className="text-xs text-slate-500">Mã yêu cầu: {req.code} &bull; {req.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${req.statusColor}`}>
                          {req.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'messages' && (
            <Messaging user={user} role="tenant" initialActiveChat={initialParams?.activeChat} />
          )}

          {activeTab === 'store' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 font-display">Quản lý Cửa hàng</h2>
                  <p className="text-slate-500 font-medium">Bạn có {productsData.length} sản phẩm đang được rao bán.</p>
                </div>
                <button 
                  onClick={() => onNavigate('store')}
                  className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <PlusCircle className="w-5 h-5" />
                  Đăng sản phẩm mới
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {productsData.length === 0 ? (
                  <div className="col-span-full py-20 bg-white rounded-[32px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">Chưa có sản phẩm nào</h3>
                    <p className="text-slate-500 max-w-xs mb-8">Hãy đăng bán những đồ dùng bạn không còn sử dụng tới.</p>
                  </div>
                ) : productsData.map((product) => (
                  <div key={product.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                    <div className="aspect-[4/3] relative overflow-hidden bg-slate-50 flex items-center justify-center">
                      <img src={product.image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute top-4 left-4">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          product.status === 'available' ? 'bg-green-500 text-white shadow-lg' : 'bg-slate-500 text-white'
                        }`}>
                          {product.status === 'available' ? 'Đang bán' : 'Đã bán'}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-black text-slate-900 font-display line-clamp-1 text-sm">{product.title}</h3>
                        <span className="text-primary font-black text-sm">{Number(product.price).toLocaleString()}đ</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">{product.category} &bull; {product.condition}</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditProductClick(product)}
                          className="flex-1 py-3 bg-slate-100 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Sửa
                        </button>
                        <button 
                          onClick={() => handleToggleProductStatus(product.id, product.status)}
                          className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                            product.status === 'available' ? 'bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                          }`}
                        >
                          {product.status === 'available' ? 'Đã bán' : 'Bán lại'}
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                          title="Xóa sản phẩm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Placeholder for other tabs */}
          {activeTab !== 'overview' && activeTab !== 'messages' && (
            <div className="flex flex-col items-center justify-center h-96 text-slate-400">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                {activeTab === 'rooms' && <Bed className="w-8 h-8" />}
                {activeTab === 'contracts' && <FileText className="w-8 h-8" />}
                {activeTab === 'account' && <User className="w-8 h-8" />}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Tính năng đang phát triển</h3>
              <p className="text-sm">Trang {navItems.find(i => i.id === activeTab)?.label} sẽ sớm ra mắt.</p>
            </div>
          )}
        </main>
      </div>

      {/* MODAL SỬA SẢN PHẨM */}
      {editingProduct && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl relative border border-slate-100"
          >
            <div className="p-10 border-b border-slate-50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">Chỉnh sửa sản phẩm</span>
                <button 
                  onClick={() => setEditingProduct(null)}
                  className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>
              <h3 className="text-3xl font-black text-slate-900 font-display">Cập nhật thông tin</h3>
              <p className="text-slate-500 font-medium mt-1">Thay đổi các thông tin hiển thị của sản phẩm tại cửa hàng.</p>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tên sản phẩm *</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-primary/30 transition-all font-bold text-slate-900"
                    value={productEditForm.title} 
                    onChange={e => setProductEditForm({...productEditForm, title: e.target.value})} 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Giá bán (VND) *</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-primary/30 transition-all font-bold text-slate-900"
                      value={productEditForm.price} 
                      onChange={e => setProductEditForm({...productEditForm, price: Number(e.target.value)})} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Danh mục</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-primary/30 transition-all font-bold text-slate-900"
                      value={productEditForm.category} 
                      onChange={e => setProductEditForm({...productEditForm, category: e.target.value})} 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tình trạng sản phẩm</label>
                  <input 
                    type="text" 
                    placeholder="Mới 99%, Đã qua sử dụng..."
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-primary/30 transition-all font-bold text-slate-900"
                    value={productEditForm.condition} 
                    onChange={e => setProductEditForm({...productEditForm, condition: e.target.value})} 
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-5 rounded-3xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={handleSaveProductEdit}
                  disabled={isSavingProduct}
                  className="flex-[2] py-5 bg-primary text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-primary-hover transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3 active:scale-95"
                >
                  {isSavingProduct ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <CheckCircle className="w-5 h-5" />}
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
