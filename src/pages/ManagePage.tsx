import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import Messaging from '../components/Messaging';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { 
  LayoutDashboard, 
  Home as HomeIcon, 
  FileText, 
  MessageSquare, 
  User, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  Bed,
  Wallet,
  ChevronRight,
  LogOut,
  Home,
  Filter,
  ArrowUpDown,
  Maximize2,
  Users,
  MoreVertical,
  Construction,
  Info,
  Layers,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  ChevronLeft,
  Search,
  FileClock,
  Settings,
  Edit3,
  Phone,
  Video,
  PlusCircle,
  Image as ImageIcon,
  Smile,
  Send,
  MoreHorizontal,
  ShieldAlert,
  Ban,
  Mail,
  PhoneCall,
  MessageCircle,
  Shield,
  Lock,
  Camera,
  MapPin,
  Eye,
  EyeOff,
  BadgeCheck,
  ShoppingCart,
  Trash2,
  Edit
} from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface ManagePageProps {
  onNavigate: (page: string, params?: any) => void;
  user: SupabaseUser | null;
  onLogout: () => void;
  initialParams?: any;
}

export const ManagePage = ({ onNavigate, user, onLogout, initialParams }: ManagePageProps) => {
  const [activeTab, setActiveTab] = useState(initialParams?.tab || 'overview');

  useEffect(() => {
    if (initialParams?.tab) {
      setActiveTab(initialParams.tab);
    }
  }, [initialParams]);
  const [roomFilter, setRoomFilter] = useState('all');
  const [contractFilter, setContractFilter] = useState('all');
  const [activeChat, setActiveChat] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Real data states
  const [roomsData, setRoomsData] = useState<any[]>([]);
  const [contractsData, setContractsData] = useState<any[]>([]);
  const [invoicesData, setInvoicesData] = useState<any[]>([]);
  const [tenantsData, setTenantsData] = useState<any[]>([]);
  const [listingsData, setListingsData] = useState<any[]>([]);
  const [productsData, setProductsData] = useState<any[]>([]);

  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Create Listing State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listingForm, setListingForm] = useState({
    title: '',
    type: 'Phòng trọ',
    price: '',
    area: '',
    deposit: '',
    location: 'Hòa Hải, Ngũ Hành Sơn',
    street: '',
    description: '',
    images: [''],
    amenities: [] as string[],
    electricity_price: '3500',
    water_price: '20000',
    service_fee: '150000',
    room_id: null as string | null
  });

  // Edit Product State
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productEditForm, setProductEditForm] = useState({
    title: '',
    price: 0,
    category: '',
    condition: ''
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const amenitiesList = [
    'Wifi miễn phí', 'Máy lạnh', 'Tủ lạnh', 'Máy giặt', 
    'Chỗ để xe', 'Camera an ninh', 'Khóa vân tay', 
    'Giờ giấc tự do', 'Vệ sinh khép kín', 'Ban công'
  ];

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        { data: rooms },
        { data: contracts },
        { data: invoices },
        { data: tenants },
        { data: listings },
        { data: products }
      ] = await Promise.all([
        supabase.from('rooms').select('*').eq('owner_id', user?.id),
        supabase.from('contracts').select('*, tenants(full_name), rooms(title)').eq('owner_id', user?.id),
        supabase.from('invoices').select('*, tenants(full_name), rooms(title)').eq('owner_id', user?.id),
        supabase.from('tenants').select('*').eq('owner_id', user?.id),
        supabase.from('listings').select('*').eq('owner_id', user?.id),
        supabase.from('products').select('*').eq('owner_id', user?.id)
      ]);

      setRoomsData(rooms || []);
      setContractsData(contracts || []);
      setInvoicesData(invoices || []);
      setTenantsData(tenants || []);
      setListingsData(listings || []);
      setProductsData(products || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateListing = async () => {
    if (!user) return;
    
    // Validation
    if (!listingForm.title || !listingForm.price || !listingForm.location) {
      showToast('Vui lòng điền đầy đủ các thông tin bắt buộc!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Geocoding (Placeholder or basic logic)
      let latitude = 15.9753; // Mặc định Đà Nẵng
      let longitude = 108.2524;

      try {
        const query = `${listingForm.street}, ${listingForm.location}, Đà Nẵng, Việt Nam`;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
        const data = await res.json();
        if (data && data.length > 0) {
          latitude = parseFloat(data[0].lat);
          longitude = parseFloat(data[0].lon);
        }
      } catch (err) {
        console.warn("Geocoding failed, using defaults", err);
      }

      // 2. Insert to Supabase
      const { error } = await supabase
        .from('listings')
        .insert({
          owner_id: user.id,
          title: listingForm.title,
          description: listingForm.description,
          price: parseInt(listingForm.price.toString()),
          area: parseFloat(listingForm.area.toString()),
          location: listingForm.location,
          type: listingForm.type,
          street: listingForm.street,
          images: listingForm.images.filter(img => img.trim() !== ''),
          image_url: listingForm.images[0] || '',
          amenities: listingForm.amenities,
          electricity_price: parseInt(listingForm.electricity_price.toString()),
          water_price: parseInt(listingForm.water_price.toString()),
          service_fee: parseInt(listingForm.service_fee.toString()),
          deposit: parseInt(listingForm.deposit.toString()) || 0,
          latitude,
          longitude,
          approval_status: 'pending',
          is_active: true
        });

      if (error) throw error;

      showToast('Đã đăng bài thành công! Tin của bạn đang chờ quản trị viên duyệt.', 'success');
      setShowCreateModal(false);
      setCreateStep(1);
      setListingForm({
        title: '', type: 'Phòng trọ', price: '', area: '', deposit: '',
        location: 'Hòa Hải, Ngũ Hành Sơn', street: '', description: '',
        images: [''], amenities: [], electricity_price: '3500', 
        water_price: '20000', service_fee: '150000', room_id: null
      });
      fetchDashboardData(); // Refresh list
    } catch (error) {
      console.error('Error creating listing:', error);
      showToast('Đã có lỗi xảy ra. Vui lòng thử lại.', 'error');
    } finally {
      setIsSubmitting(false);
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
      fetchDashboardData();
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
      fetchDashboardData();
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
      fetchDashboardData();
    } catch (error) {
      showToast('Lỗi khi cập nhật trạng thái.', 'error');
    }
  };



  const calculateMonthlyRevenue = () => {
    // Initialize an array of 6 months ending at current month or Dec of selected year
    const currentYear = new Date().getFullYear();
    const isCurrentYear = selectedYear === currentYear.toString();
    const endMonth = isCurrentYear ? new Date().getMonth() : 11; // 0-indexed
    
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      let d = new Date(Number(selectedYear), endMonth - i, 1);
      last6Months.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        label: `T${d.getMonth() + 1}`,
        revenue: 0
      });
    }

    // Filter paid invoices in the selected year
    const paidInvoices = invoicesData.filter(inv => inv.status === 'paid' && new Date(inv.due_date).getFullYear().toString() === selectedYear);

    // Aggregate revenue to matching months
    paidInvoices.forEach(inv => {
      const invDate = new Date(inv.due_date);
      const invMonth = invDate.getMonth() + 1;
      const invYear = invDate.getFullYear();
      
      const targetMonth = last6Months.find(m => m.month === invMonth && m.year === invYear);
      if (targetMonth) {
        targetMonth.revenue += Number(inv.amount);
      }
    });

    // Calculate chart height relative to max revenue (minimum 5M to have some height)
    const maxRevenue = Math.max(...last6Months.map(m => m.revenue), 5000000);
    
    return last6Months.map(m => ({
      ...m,
      height: m.revenue > 0 ? Math.max((m.revenue / maxRevenue) * 100, 10) : 5, // minimum 5% height to be visible
      displayValue: (m.revenue / 1000000).toFixed(1) + 'M'
    }));
  };

  const chartData = calculateMonthlyRevenue();

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'rooms', label: 'Danh sách phòng', icon: HomeIcon },
    { id: 'tenants', label: 'Người thuê', icon: Users },
    { id: 'contracts', label: 'Hợp đồng', icon: FileText },
    { id: 'invoices', label: 'Hóa đơn', icon: Wallet },
    { id: 'listings', label: 'Bài đăng', icon: ImageIcon },
    { id: 'store', label: 'Cửa hàng', icon: ShoppingCart },
    { id: 'messages', label: 'Tin nhắn', icon: MessageSquare, badge: 3 },
    { id: 'account', label: 'Tài khoản', icon: User },
  ];

  const stats = [
    { 
      label: 'Tổng số phòng', 
      value: roomsData.length.toString(), 
      change: '+0%', 
      trend: 'up', 
      icon: HomeIcon,
      color: 'bg-primary/10 text-primary',
      badge: 'bg-green-100 text-green-700'
    },
    { 
      label: 'Phòng đang trống', 
      value: roomsData.filter(r => r.status === 'empty').length.toString(), 
      change: `${roomsData.filter(r => r.status === 'empty').length} trống`, 
      trend: 'neutral', 
      icon: Bed,
      color: 'bg-orange-100 text-orange-600',
      badge: 'bg-orange-100 text-orange-700'
    },
    { 
      label: 'Doanh thu tháng này', 
      value: `${invoicesData.filter(inv => inv.status === 'paid').reduce((acc, inv) => acc + Number(inv.amount), 0).toLocaleString()}đ`, 
      change: '+0%', 
      trend: 'up', 
      icon: Wallet,
      color: 'bg-emerald-100 text-emerald-600',
      badge: 'bg-green-100 text-green-700'
    },
  ];

  const recentListings = listingsData.slice(0, 3).map(l => ({
    id: l.id,
    title: l.title,
    price: `${Number(l.price).toLocaleString()}đ`,
    status: l.is_active ? 'Đang hiển thị' : 'Tạm ẩn',
    statusColor: l.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600',
    image: l.image_url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=200'
  }));

  const quickActions = [
    { label: 'Thêm phòng mới', icon: Plus, action: () => { setActiveTab('rooms'); } },
    { label: 'Lập hợp đồng', icon: FileText, action: () => { setActiveTab('contracts'); } },
    { label: 'Xuất hóa đơn', icon: Wallet, action: () => { setActiveTab('invoices'); } },
    { label: 'Quản lý người ở', icon: User, action: () => { setActiveTab('tenants'); } },
  ];

  const rooms = roomsData.map(r => ({
    id: r.id,
    title: r.title,
    price: `${Number(r.price).toLocaleString()}đ`,
    type: r.type || 'Phòng trọ',
    area: `${r.area} m²`,
    tenant: contractsData.find(c => c.room_id === r.id && c.status === 'active')?.tenants?.full_name || null,
    status: r.status,
    statusLabel: r.status === 'occupied' ? 'Đang thuê' : r.status === 'repairing' ? 'Đang sửa' : 'Trống',
    statusColor: r.status === 'occupied' ? 'bg-green-100 text-green-700 border-l-green-500' : r.status === 'repairing' ? 'bg-amber-100 text-amber-700 border-l-amber-500' : 'bg-orange-100 text-orange-700 border-l-orange-500',
    image: r.image_url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=400',
    note: r.note
  }));

  const filteredRooms = roomFilter === 'all' ? rooms : rooms.filter(r => r.status === roomFilter);

  const contracts = contractsData.map(c => ({
    id: c.id,
    tenant: c.tenants?.full_name || 'N/A',
    initials: (c.tenants?.full_name || 'NA').split(' ').map((n: any) => n[0]).join('').toUpperCase().slice(0, 2),
    room: c.rooms?.title || 'N/A',
    period: `${new Date(c.start_date).toLocaleDateString('vi-VN')} - ${new Date(c.end_date).toLocaleDateString('vi-VN')}`,
    deposit: `${Number(c.deposit).toLocaleString()}đ`,
    status: c.status,
    statusLabel: c.status === 'active' ? 'Đang hiệu lực' : c.status === 'expired' ? 'Đã hết hạn' : 'Đã chấm dứt',
    statusColor: c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
  }));

  const tenants = tenantsData.map(t => ({
    id: t.id,
    name: t.full_name,
    email: t.email,
    phone: t.phone,
    avatar: t.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.full_name)}&background=random`,
    room: contractsData.find(c => c.tenant_id === t.id && c.status === 'active')?.rooms?.title || 'Chưa thuê'
  }));

  const invoices = invoicesData.map(inv => ({
    id: inv.id,
    tenant: inv.tenants?.full_name || 'N/A',
    room: inv.rooms?.title || 'N/A',
    amount: `${Number(inv.amount).toLocaleString()}đ`,
    dueDate: new Date(inv.due_date).toLocaleDateString('vi-VN'),
    status: inv.status,
    statusLabel: inv.status === 'paid' ? 'Đã thanh toán' : inv.status === 'unpaid' ? 'Chưa thanh toán' : 'Quá hạn',
    statusColor: inv.status === 'paid' ? 'bg-green-100 text-green-700' : inv.status === 'unpaid' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
  }));

  const filteredContracts = contractFilter === 'all' ? contracts : contracts.filter(c => c.status === contractFilter);



  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <Header user={user} onLogout={onLogout} onNavigate={onNavigate} activePath="manage" />

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
          <div className="p-6 flex-1">
            <div className="flex items-center gap-3 text-primary mb-8">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 font-display">Landlord CMS</h2>
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
                </button>
              ))}
            </nav>
          </div>

        </aside>

        {/* Main Content */}
        <main className={`flex-1 flex flex-col ${activeTab === 'messages' ? '' : 'p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full'}`}>
          {activeTab === 'overview' && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 font-display">
                  Chào buổi sáng, {user?.user_metadata?.full_name?.split(' ').pop() || 'Thành'}!
                </h2>
                <p className="text-slate-500 font-medium">Dưới đây là thống kê tình hình kinh doanh của bạn hôm nay.</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-xl ${stat.color}`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${stat.badge}`}>
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{stat.label}</p>
                    <h3 className="text-3xl font-black mt-1 text-slate-900 font-display">{stat.value}</h3>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart Mockup */}
                <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-xl font-bold text-slate-900 font-display">Doanh thu 6 tháng gần nhất ({selectedYear})</h3>
                    <select 
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="text-sm font-bold bg-slate-50 border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="2024">Năm 2024</option>
                      <option value="2023">Năm 2023</option>
                      <option value="2022">Năm 2022</option>
                    </select>
                  </div>
                  
                  <div className="relative h-[300px] w-full flex items-end justify-between px-4">
                    {chartData.map((data, i) => (
                      <div key={i} className="flex flex-col items-center gap-4 w-12 md:w-16">
                        <div className="w-full bg-slate-50 rounded-t-2xl h-full relative overflow-hidden group">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${data.height}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="absolute bottom-0 left-0 right-0 bg-primary/20 rounded-t-2xl"
                          />
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${data.height * 0.7}%` }}
                            transition={{ duration: 1.2, delay: i * 0.1 }}
                            className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-2xl shadow-[0_-4px_10px_rgba(255,152,0,0.3)]"
                          />
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 flex items-center justify-center">
                            <span className="bg-white text-primary text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                              {data.displayValue}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-400">{data.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Listings */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-slate-900 font-display">Tin đăng gần đây</h3>
                    <button className="text-primary text-sm font-bold hover:underline">Xem tất cả</button>
                  </div>
                  
                  <div className="space-y-6 flex-1">
                    {recentListings.map((listing) => (
                      <div key={listing.id} className="flex gap-4 group cursor-pointer">
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100">
                          <img 
                            src={listing.image} 
                            alt={listing.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate group-hover:text-primary transition-colors">{listing.title}</p>
                          <p className="text-xs font-bold text-primary mt-0.5">{listing.price}</p>
                          <span className={`inline-flex mt-2 items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${listing.statusColor}`}>
                            {listing.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button className="mt-8 w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold text-sm hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 group">
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    Tạo tin mới
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-10 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-8 font-display">Thao tác nhanh</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {quickActions.map((action, i) => (
                    <button 
                      key={i}
                      onClick={action.action}
                      className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-slate-50 hover:bg-primary/10 hover:text-primary transition-all group border border-transparent hover:border-primary/20"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <action.icon className="w-7 h-7" />
                      </div>
                      <span className="text-sm font-bold text-slate-700 group-hover:text-primary">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'rooms' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 font-display">Danh sách phòng</h2>
                  <p className="text-slate-500 font-medium">Quản lý và theo dõi trạng thái các phòng trọ của bạn.</p>
                </div>
                <button className="bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-100">
                  <Plus className="w-5 h-5" />
                  Thêm phòng mới
                </button>
              </div>

              {/* Filters & Stats */}
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
                  {[
                    { id: 'all', label: 'Tất cả', count: roomsData.length },
                    { id: 'empty', label: 'Trống', count: roomsData.filter(r => r.status === 'empty').length },
                    { id: 'occupied', label: 'Đang thuê', count: roomsData.filter(r => r.status === 'occupied').length },
                    { id: 'repairing', label: 'Đang sửa', count: roomsData.filter(r => r.status === 'repairing').length },
                  ].map((filter) => (
                    <button 
                      key={filter.id}
                      onClick={() => setRoomFilter(filter.id)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        roomFilter === filter.id 
                          ? 'bg-white shadow-sm text-primary' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {filter.label} ({filter.count})
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                    <Filter className="w-4 h-4" />
                    Bộ lọc
                  </button>
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                    <ArrowUpDown className="w-4 h-4" />
                    Sắp xếp
                  </button>
                </div>
              </div>

              {/* Rooms Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredRooms.map((room) => (
                  <motion.div 
                    key={room.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all border-l-4 ${room.statusColor}`}
                  >
                    <div className="aspect-video relative overflow-hidden">
                      <div className="absolute top-3 right-3 z-10">
                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm ${room.statusColor.split(' ').slice(0, 2).join(' ')}`}>
                          {room.statusLabel}
                        </span>
                      </div>
                      <img 
                        alt={room.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        src={room.image}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-black text-slate-900 font-display">{room.title}</h3>
                        <p className="text-primary font-black text-lg">{room.price}</p>
                      </div>
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                          <Layers className="w-4 h-4 text-slate-400" />
                          <span>{room.type}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                          <Maximize2 className="w-4 h-4 text-slate-400" />
                          <span>{room.area}</span>
                        </div>
                        {room.tenant ? (
                          <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span>Khách: {room.tenant}</span>
                          </div>
                        ) : room.status === 'repairing' ? (
                          <div className="flex items-center gap-3 text-sm font-bold text-amber-600">
                            <Construction className="w-4 h-4" />
                            <span>{room.note}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 text-sm font-bold text-slate-400 italic">
                            <Info className="w-4 h-4" />
                            <span>Sẵn sàng đón khách</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                          room.status === 'empty' 
                            ? 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-orange-100' 
                            : 'bg-slate-100 text-slate-600 hover:bg-primary hover:text-white'
                        }`}>
                          {room.status === 'empty' ? 'Cho thuê ngay' : room.status === 'repairing' ? 'Cập nhật tiến độ' : 'Chi tiết'}
                        </button>
                        <button className="w-12 h-12 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition-all">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Add New Room Placeholder */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="group flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer min-h-[400px]"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all mb-6 shadow-sm">
                    <Plus className="w-8 h-8" />
                  </div>
                  <p className="font-black text-slate-600 group-hover:text-primary transition-all font-display">Thêm phòng mới</p>
                  <p className="text-xs font-bold text-slate-400 mt-2">Nhanh chóng mở rộng hệ thống</p>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === 'tenants' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 font-display">Quản lý người thuê</h2>
                  <p className="text-slate-500 font-medium">Danh sách tất cả khách hàng đang thuê trọ của bạn.</p>
                </div>
                <button className="bg-primary text-white font-black uppercase tracking-widest text-xs py-4 px-8 rounded-2xl hover:bg-primary-hover transition-all shadow-lg shadow-orange-100 flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" />
                  Thêm người thuê
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tenants.map((tenant) => (
                  <div key={tenant.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-50 shadow-sm">
                        <img src={tenant.avatar} alt={tenant.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 font-display">{tenant.name}</h3>
                        <p className="text-xs font-bold text-primary uppercase tracking-widest">{tenant.room}</p>
                      </div>
                    </div>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                        <Mail className="w-4 h-4 text-slate-300" />
                        {tenant.email}
                      </div>
                      <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                        <Phone className="w-4 h-4 text-slate-300" />
                        {tenant.phone}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-3 rounded-xl bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">Hồ sơ</button>
                      <button className="flex-1 py-3 rounded-xl bg-primary/10 text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all">Nhắn tin</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'invoices' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 font-display">Quản lý hóa đơn</h2>
                  <p className="text-slate-500 font-medium">Theo dõi tình trạng thanh toán tiền phòng và dịch vụ.</p>
                </div>
                <button className="bg-primary text-white font-black uppercase tracking-widest text-xs py-4 px-8 rounded-2xl hover:bg-primary-hover transition-all shadow-lg shadow-orange-100 flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" />
                  Lập hóa đơn mới
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Khách thuê</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phòng</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Số tiền</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hạn thanh toán</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-8 py-6">
                            <span className="font-black text-slate-900 font-display">{inv.tenant}</span>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-xs font-bold text-slate-500">{inv.room}</span>
                          </td>
                          <td className="px-8 py-6">
                            <span className="font-black text-slate-900">{inv.amount}</span>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-xs font-bold text-slate-500">{inv.dueDate}</span>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${inv.statusColor}`}>
                              {inv.statusLabel}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'listings' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 font-display">Quản lý bài đăng</h2>
                  <p className="text-slate-500 font-medium">Các tin đăng quảng bá phòng trọ của bạn trên hệ thống.</p>
                </div>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-primary text-white font-black uppercase tracking-widest text-xs py-4 px-8 rounded-2xl hover:bg-primary-hover transition-all shadow-lg shadow-orange-100 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Tạo bài đăng mới
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {listingsData.length === 0 ? (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    <ImageIcon className="w-16 h-16 text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold">Bạn chưa có bài đăng nào.</p>
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className="mt-4 text-primary font-bold hover:underline"
                    >
                      Bắt đầu đăng bài ngay
                    </button>
                  </div>
                ) : (
                  listingsData.map((listing) => (
                    <div key={listing.id} className="bg-white rounded-[32px] overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                      <div className="relative aspect-video overflow-hidden">
                        <img 
                          src={listing.image_url || listing.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=400'} 
                          alt={listing.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg ${
                          listing.approval_status === 'approved' 
                            ? (listing.is_active ? 'bg-green-500 text-white' : 'bg-slate-500 text-white')
                            : listing.approval_status === 'rejected' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                        }`}>
                          {listing.approval_status === 'approved' 
                            ? (listing.is_active ? 'Đang hiển thị' : 'Tạm ẩn')
                            : listing.approval_status === 'rejected' ? 'Bị từ chối' : 'Chờ duyệt'}
                        </div>
                      </div>
                      <div className="p-8">
                        <h3 className="text-lg font-black text-slate-900 font-display mb-2 group-hover:text-primary transition-colors line-clamp-1">{listing.title}</h3>
                        <p className="text-slate-500 text-sm font-medium mb-6 line-clamp-2">{listing.description || 'Không có mô tả.'}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-black text-primary font-display">{Number(listing.price).toLocaleString()}đ</span>
                          <div className="flex gap-2">
                            <button className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-primary transition-all">
                              <Edit3 className="w-5 h-5" />
                            </button>
                            <button className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 transition-all">
                              <Ban className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'contracts' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-8"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 font-display">Quản lý Hợp đồng</h2>
                  <p className="text-slate-500 font-medium">Xem và quản lý tất cả các hợp đồng thuê phòng của bạn.</p>
                </div>
                <button className="bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-100">
                  <Plus className="w-5 h-5" />
                  Tạo hợp đồng mới
                </button>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Đang hiệu lực', value: contractsData.filter(c => c.status === 'active').length.toString(), sub: '+0 hợp đồng mới', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
                  { label: 'Chờ ký', value: contractsData.filter(c => c.status === 'pending').length.toString(), sub: 'Cần xử lý trong tuần', icon: FileClock, color: 'text-orange-600', bg: 'bg-orange-100' },
                  { label: 'Sắp hết hạn', value: contractsData.filter(c => {
                    const endDate = new Date(c.end_date);
                    const today = new Date();
                    const diffTime = endDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays > 0 && diffDays <= 30;
                  }).length.toString(), sub: 'Dưới 30 ngày', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-slate-500 text-xs font-black uppercase tracking-widest">{stat.label}</span>
                      <div className={`${stat.bg} ${stat.color} p-2 rounded-xl`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 font-display">{stat.value}</div>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* Filters & Table Section */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-wrap items-center gap-4">
                  <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Bộ lọc:</span>
                  <div className="flex gap-2">
                    {[
                      { id: 'all', label: 'Tất cả' },
                      { id: 'active', label: 'Đang hiệu lực' },
                      { id: 'pending', label: 'Chờ ký' },
                      { id: 'expired', label: 'Đã hết hạn' },
                    ].map((filter) => (
                      <button 
                        key={filter.id}
                        onClick={() => setContractFilter(filter.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          contractFilter === filter.id 
                            ? 'bg-primary text-white shadow-md shadow-orange-100' 
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <button className="p-2.5 border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:border-primary transition-all">
                      <Filter className="w-5 h-5" />
                    </button>
                    <button className="p-2.5 border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:border-primary transition-all">
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Khách thuê</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Phòng</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Thời gian</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Tiền cọc</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Trạng thái</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredContracts.map((contract) => (
                        <tr key={contract.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                                {contract.initials}
                              </div>
                              <div className="text-sm font-bold text-slate-900">{contract.tenant}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1.5 bg-slate-100 rounded-lg text-[10px] font-black text-slate-700 tracking-widest uppercase">
                              {contract.room}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-500">
                            {contract.period}
                          </td>
                          <td className="px-6 py-4 text-sm font-black text-slate-900">
                            {contract.deposit}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${contract.statusColor}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                contract.status === 'active' ? 'bg-green-500' : 
                                contract.status === 'pending' ? 'bg-primary' : 'bg-slate-400'
                              }`}></span>
                              {contract.statusLabel}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-slate-300 hover:text-primary transition-colors">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Hiển thị 1-{filteredContracts.length} trên tổng số {contractsData.length} hợp đồng
                  </span>
                  <div className="flex items-center gap-2">
                    <button className="p-2 border border-slate-200 rounded-xl text-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-all" disabled>
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-xl font-black text-sm shadow-md shadow-orange-100">1</button>
                    <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-50 rounded-xl font-black text-sm transition-all">2</button>
                    <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-50 rounded-xl font-black text-sm transition-all">3</button>
                    <button className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
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

          {activeTab === 'messages' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-1 overflow-hidden h-[calc(100vh-64px)] rounded-2xl border border-slate-200 shadow-sm"
            >
              <Messaging user={user} role="landlord" initialActiveChat={initialParams?.activeChat} />
            </motion.div>
          )}

          {activeTab === 'account' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto flex flex-col gap-8"
            >
              <div className="mb-2">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 font-display">Cài đặt tài khoản</h2>
                <p className="text-slate-500 font-medium">Quản lý thông tin cá nhân và thiết lập bảo mật của bạn.</p>
              </div>

              {/* Profile Header Card */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-3xl overflow-hidden ring-4 ring-slate-50 shadow-xl">
                    <img 
                      src={user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-xl shadow-lg flex items-center justify-center hover:scale-110 transition-transform border-4 border-white">
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                <div className="text-center md:text-left flex-1">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                    <h3 className="text-2xl font-black text-slate-900 font-display">{user?.user_metadata?.full_name || 'Nguyễn Văn A'}</h3>
                    <span className="bg-orange-100 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" />
                      Chủ trọ VIP
                    </span>
                  </div>
                  <p className="text-slate-500 font-bold text-sm mb-4">Chủ hệ thống trọ chuyên nghiệp • Tham gia từ 2023</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 px-3 py-2 rounded-xl">
                      <HomeIcon className="w-4 h-4" />
                      {roomsData.length} Phòng đang quản lý
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 px-3 py-2 rounded-xl">
                      <Users className="w-4 h-4" />
                      {tenantsData.length} Người đang thuê
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Personal Info */}
                <div className="lg:col-span-2 space-y-8">
                  <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h3 className="font-black text-slate-900 font-display flex items-center gap-3">
                        <User className="w-5 h-5 text-primary" />
                        Thông tin cá nhân
                      </h3>
                      <button className="text-primary text-xs font-black uppercase tracking-widest hover:underline">Chỉnh sửa</button>
                    </div>
                    <div className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên</label>
                          <input 
                            className="w-full rounded-2xl border-slate-100 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none" 
                            type="text" 
                            defaultValue={user?.user_metadata?.full_name || 'Nguyễn Văn A'}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email liên hệ</label>
                          <input 
                            className="w-full rounded-2xl border-slate-100 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none" 
                            type="email" 
                            defaultValue={user?.email || 'vana.nguyen@example.com'}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                          <input 
                            className="w-full rounded-2xl border-slate-100 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none" 
                            type="tel" 
                            defaultValue={user?.user_metadata?.phone || '0901 234 567'}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ thường trú</label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                              className="w-full rounded-2xl border-slate-100 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 pl-12 transition-all outline-none" 
                              type="text" 
                              defaultValue="123 Đường ABC, Quận 1, TP. HCM"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-8 flex justify-end">
                        <button className="bg-primary text-white font-black uppercase tracking-widest text-xs py-4 px-8 rounded-2xl hover:bg-primary-hover transition-all shadow-lg shadow-orange-100">
                          Lưu thay đổi
                        </button>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Right Column: Security & Settings */}
                <div className="space-y-8">
                  <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="font-black text-slate-900 font-display flex items-center gap-3">
                        <Shield className="w-5 h-5 text-primary" />
                        Bảo mật
                      </h3>
                    </div>
                    <div className="p-8">
                      <form className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu cũ</label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                              className="w-full rounded-2xl border-slate-100 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 pl-12 transition-all outline-none" 
                              placeholder="••••••••" 
                              type={showPassword ? 'text' : 'password'}
                            />
                            <button 
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu mới</label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                              className="w-full rounded-2xl border-slate-100 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 pl-12 transition-all outline-none" 
                              placeholder="Tối thiểu 8 ký tự" 
                              type={showPassword ? 'text' : 'password'}
                            />
                          </div>
                        </div>
                        <button className="w-full bg-slate-900 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                          Cập nhật mật khẩu
                        </button>
                      </form>
                    </div>
                  </section>

                  {/* Danger Zone */}
                  <section className="bg-red-50 rounded-3xl border border-red-100 p-8">
                    <h4 className="text-red-600 font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" />
                      Vùng nguy hiểm
                    </h4>
                    <p className="text-xs font-bold text-red-400 mb-6 leading-relaxed">
                      Xóa tài khoản sẽ xóa vĩnh viễn tất cả dữ liệu phòng trọ, hợp đồng và tin nhắn của bạn. Hành động này không thể hoàn tác.
                    </p>
                    <button className="w-full py-3 rounded-xl border-2 border-red-200 text-red-600 font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white hover:border-red-600 transition-all">
                      Xóa tài khoản vĩnh viễn
                    </button>
                  </section>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab !== 'overview' && activeTab !== 'rooms' && activeTab !== 'contracts' && activeTab !== 'messages' && activeTab !== 'account' && activeTab !== 'tenants' && activeTab !== 'invoices' && activeTab !== 'listings' && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-6">
                <Construction className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Tính năng đang phát triển</h3>
              <p className="text-slate-500 max-w-xs">Chúng tôi đang nỗ lực hoàn thiện tính năng này. Vui lòng quay lại sau!</p>
            </div>
          )}
        </main>
      </div>
      {/* Create Listing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[40px] w-full max-w-4xl shadow-2xl overflow-hidden my-auto"
          >
            {/* Modal Header */}
            <div className="bg-slate-900 px-8 md:px-12 py-10 text-white relative">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 transition-all"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black font-display text-white">Đăng tin cho thuê mới</h3>
              </div>
              
              {/* Stepper */}
              <div className="flex items-center gap-4 md:gap-8 mt-10 overflow-x-auto pb-4 md:pb-0">
                {[
                  { step: 1, label: 'Thông tin' },
                  { step: 2, label: 'Vị trí' },
                  { step: 3, label: 'Tiện ích & Ảnh' },
                  { step: 4, label: 'Chi phí & Mô tả' },
                ].map((s) => (
                  <div key={s.step} className="flex items-center gap-3 flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      createStep >= s.step ? 'bg-primary text-white' : 'bg-white/10 text-white/40'
                    }`}>
                      {s.step}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-widest ${
                      createStep === s.step ? 'text-white' : 'text-white/40'
                    }`}>
                      {s.label}
                    </span>
                    {s.step < 4 && <div className="hidden md:block w-8 h-[2px] bg-white/10"></div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 md:p-12">
              {/* Step 1: Basic Info */}
              {createStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-black text-slate-900 uppercase tracking-widest mb-3">Tiêu đề tin đăng *</label>
                      <input 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all font-semibold"
                        placeholder="Ví dụ: Phòng trọ cao cấp Quận 7 đầy đủ nội thất"
                        value={listingForm.title}
                        onChange={(e) => setListingForm({ ...listingForm, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-black text-slate-900 uppercase tracking-widest mb-3">Loại phòng</label>
                      <select 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-primary/30 transition-all font-semibold"
                        value={listingForm.type}
                        onChange={(e) => setListingForm({ ...listingForm, type: e.target.value })}
                      >
                        <option value="Phòng trọ">Phòng trọ</option>
                        <option value="Căn hộ mini">Căn hộ mini</option>
                        <option value="Nhà nguyên căn">Nhà nguyên căn</option>
                        <option value="Ở ghép">Ở ghép</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-black text-slate-900 uppercase tracking-widest mb-3">Giá thuê (đ/tháng) *</label>
                        <input 
                          type="number"
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-primary/30 transition-all font-semibold"
                          placeholder="3500000"
                          value={listingForm.price}
                          onChange={(e) => setListingForm({ ...listingForm, price: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-black text-slate-900 uppercase tracking-widest mb-3">Tiền cọc (đ)</label>
                        <input 
                          type="number"
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-primary/30 transition-all font-semibold"
                          placeholder="3500000"
                          value={listingForm.deposit}
                          onChange={(e) => setListingForm({ ...listingForm, deposit: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-black text-slate-900 uppercase tracking-widest mb-3">Diện tích (m²) *</label>
                      <input 
                        type="number"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-primary/30 transition-all font-semibold"
                        placeholder="25"
                        value={listingForm.area}
                        onChange={(e) => setListingForm({ ...listingForm, area: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Location */}
              {createStep === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-sm font-black text-slate-900 uppercase tracking-widest mb-3">Khu vực (Quận/Phường) *</label>
                      <select 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-primary/30 transition-all font-semibold"
                        value={listingForm.location}
                        onChange={(e) => setListingForm({ ...listingForm, location: e.target.value })}
                      >
                        <option value="Hòa Hải, Ngũ Hành Sơn">Hòa Hải, Ngũ Hành Sơn</option>
                        <option value="Mỹ An, Ngũ Hành Sơn">Mỹ An, Ngũ Hành Sơn</option>
                        <option value="Thanh Khê Tây, Thanh Khê">Thanh Khê Tây, Thanh Khê</option>
                        <option value="Hòa Khánh Nam, Liên Chiểu">Hòa Khánh Nam, Liên Chiểu</option>
                        <option value="Hòa Minh, Liên Chiểu">Hòa Minh, Liên Chiểu</option>
                        <option value="Thạch Thang, Hải Châu">Thạch Thang, Hải Châu</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-black text-slate-900 uppercase tracking-widest mb-3">Số nhà, Tên đường *</label>
                      <input 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-primary/30 transition-all font-semibold"
                        placeholder="Ví dụ: 123 Nguyễn Văn Linh"
                        value={listingForm.street}
                        onChange={(e) => setListingForm({ ...listingForm, street: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 flex gap-4">
                    <MapPin className="w-6 h-6 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-orange-900">Mẹo vị trí</p>
                      <p className="text-xs text-orange-800/70 mt-1 leading-relaxed">
                        Hãy điền chính xác địa chỉ để hệ thống tự động tìm tọa độ trên bản đồ. Việc này giúp khách hàng tìm thấy nhà bạn dễ hơn.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Images & Amenities */}
              {createStep === 3 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <label className="block text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Tiện ích miễn phí</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {amenitiesList.map((item) => (
                        <button
                          key={item}
                          onClick={() => {
                            const newAmenities = listingForm.amenities.includes(item)
                              ? listingForm.amenities.filter(i => i !== item)
                              : [...listingForm.amenities, item];
                            setListingForm({ ...listingForm, amenities: newAmenities });
                          }}
                          className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                            listingForm.amenities.includes(item)
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Hình ảnh (URL)</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {listingForm.images.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <input 
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-primary/30 transition-all font-semibold text-xs"
                            placeholder="Dán link ảnh tại đây..."
                            value={img}
                            onChange={(e) => {
                              const newImages = [...listingForm.images];
                              newImages[idx] = e.target.value;
                              setListingForm({ ...listingForm, images: newImages });
                            }}
                          />
                          {idx === listingForm.images.length - 1 && listingForm.images.length < 5 && (
                            <button 
                              onClick={() => setListingForm({ ...listingForm, images: [...listingForm.images, ''] })}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:scale-110 transition-transform"
                            >
                              <PlusCircle className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {listingForm.images[0] && (
                      <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
                        {listingForm.images.filter(img => img.trim() !== '').map((img, idx) => (
                          <div key={idx} className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-slate-100 shadow-sm relative group">
                            <img src={img} alt="Preview" className="w-full h-full object-cover" />
                            <button 
                              onClick={() => {
                                const newImages = listingForm.images.filter((_, i) => i !== idx);
                                setListingForm({ ...listingForm, images: newImages.length ? newImages : [''] });
                              }}
                              className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-black text-[10px] uppercase"
                            >
                              Xóa
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Fees & Description */}
              {createStep === 4 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-black text-slate-900 uppercase tracking-widest mb-3">Tiền điện (đ/số)</label>
                      <input 
                        type="number"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-primary/30 transition-all font-semibold"
                        value={listingForm.electricity_price}
                        onChange={(e) => setListingForm({ ...listingForm, electricity_price: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-black text-slate-900 uppercase tracking-widest mb-3">Tiền nước (đ/khối)</label>
                      <input 
                        type="number"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-primary/30 transition-all font-semibold"
                        value={listingForm.water_price}
                        onChange={(e) => setListingForm({ ...listingForm, water_price: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-black text-slate-900 uppercase tracking-widest mb-3">Phí dịch vụ (đ/tháng)</label>
                      <input 
                        type="number"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-primary/30 transition-all font-semibold"
                        value={listingForm.service_fee}
                        onChange={(e) => setListingForm({ ...listingForm, service_fee: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-black text-slate-900 uppercase tracking-widest mb-3">Mô tả chi tiết *</label>
                    <textarea 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-6 py-4 outline-none focus:border-primary/30 transition-all font-semibold min-h-[160px] resize-none"
                      placeholder="Nêu các ưu điểm của phòng, giờ giấc, quy định trọ..."
                      value={listingForm.description}
                      onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="mt-12 flex items-center justify-between border-t border-slate-100 pt-8">
                <button 
                  onClick={() => createStep > 1 && setCreateStep(createStep - 1)}
                  className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                    createStep > 1 ? 'text-slate-400 hover:bg-slate-50' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  Quay lại
                </button>
                <div className="flex gap-4">
                  {createStep < 4 ? (
                    <button 
                      onClick={() => setCreateStep(createStep + 1)}
                      className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2"
                    >
                      Tiếp theo
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button 
                      onClick={handleCreateListing}
                      disabled={isSubmitting}
                      className="bg-primary text-white px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-hover transition-all shadow-xl shadow-orange-500/20 flex items-center gap-2"
                    >
                      {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <CheckCircle className="w-4 h-4" />}
                      Hoàn tất & Đăng tin
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

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

      <Footer />
    </div>
  );
};
