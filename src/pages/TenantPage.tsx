import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Header } from '../components/Header';
import Messaging from '../components/Messaging';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useToast } from '../context/ToastContext';
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
  Maximize2, Layers, CheckCircle, Home, Zap, ShieldCheck, X,
  BadgeCheck, Lock as LockIcon, Camera, Clock, Filter, ArrowUpDown, MoreVertical, Construction
} from 'lucide-react';

interface TenantPageProps {
  onNavigate: (page: string, params?: any) => void;
  user: SupabaseUser | null;
  onLogout: () => void;
  initialParams?: any;
}

interface InputFieldProps {
  label: string;
  icon?: any;
  field: string;
  type?: string;
  placeholder?: string;
  value: any;
  onChange: (value: string) => void;
}

const InputField = ({ label, icon: Icon, type = 'text', placeholder = '', value, onChange }: InputFieldProps) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        className={`w-full rounded-2xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 ${Icon ? 'pl-11' : ''} transition-all outline-none text-sm`} 
      />
    </div>
  </div>
);

export const TenantPage = ({ onNavigate, user, onLogout, initialParams }: TenantPageProps) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState(initialParams?.tab || 'overview');
  const [activeChatId, setActiveChatId] = useState<string | null>(initialParams?.activeChat || null);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [tenantRooms, setTenantRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [pendingContracts, setPendingContracts] = useState<any[]>([]);
  const [signingContract, setSigningContract] = useState<string | null>(null);

  // Sync initialParams changes (e.g. when navigating from a notification while already on this page)
  useEffect(() => {
    if (initialParams?.tab) {
      setActiveTab(initialParams.tab);
    }
    if (initialParams?.activeChat) {
      setActiveChatId(initialParams.activeChat);
    }
  }, [initialParams]);

  // Support Requests states
  const [supportRequestsData, setSupportRequestsData] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [showAddRequestModal, setShowAddRequestModal] = useState(false);
  const [newRequestForm, setNewRequestForm] = useState({ roomId: '', title: '', description: '' });
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Profile form states
  const [profileForm, setProfileForm] = useState({
    full_name: '', phone: '', gender: '', birth_date: '',
    permanent_address: '',
    id_card_number: '', id_card_date: '', id_card_place: '',
    bank_name: '', bank_account_number: '', bank_account_name: '',
    zalo_phone: '', emergency_contact_name: '', emergency_contact_phone: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveMsg, setProfileSaveMsg] = useState('');

  // Password reset states
  const [passwordForm, setPasswordForm] = useState({ old: '', new: '', confirm: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (initialParams?.tab) {
      setActiveTab(initialParams.tab);
    }
  }, [initialParams]);

  // Fetch rooms assigned to this tenant via contracts
  useEffect(() => {
    if (user) {
      console.log('[DEBUG] User ID:', user.id);
      fetchTenantRooms();
      fetchSupportRequests();
      fetchPendingContracts();
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) {
        console.log('[DEBUG] Loaded Profile ID:', data.id);
        setProfileForm({
          full_name: data.full_name || '',
          phone: data.phone || '',
          gender: data.gender || '',
          birth_date: data.birth_date || '',
          permanent_address: data.permanent_address || '',
          id_card_number: data.id_card_number || '',
          id_card_date: data.id_card_date || '',
          id_card_place: data.id_card_place || '',
          bank_name: data.bank_name || '',
          bank_account_number: data.bank_account_number || '',
          bank_account_name: data.bank_account_name || '',
          zalo_phone: data.zalo_phone || '',
          emergency_contact_name: data.emergency_contact_name || '',
          emergency_contact_phone: data.emergency_contact_phone || ''
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchPendingContracts = async () => {
    if (!user) return;
    try {
      // Cần gọi RPC để đọc hợp đồng nhằm vượt qua RLS cản quyền Tenant
      const { data: contractsWithData, error } = await supabase
        .rpc('get_pending_contracts', { p_tenant_id: user.id });

      if (error) throw error;

      console.log('[DEBUG] Final Pending Contracts:', contractsWithData);
      setPendingContracts(contractsWithData || []);
    } catch (err) {
      console.error('Error fetching pending contracts:', err);
      // Fallback an toàn
      setPendingContracts([]);
    }
  };

  const handleSignContract = async (contract: any) => {
    setSigningContract(contract.id);
    try {
      // Sử dụng RPC thay vì Update trực tiếp để qua rào RLS
      const { error: rpcError } = await supabase.rpc('accept_contract', { 
        p_contract_id: contract.id 
      });
      
      if (rpcError) throw rpcError;

      // Refresh data sau khi RPC cập nhật contracts, rooms và tạo notifications
      await Promise.all([
        fetchTenantRooms(),
        fetchPendingContracts()
      ]);
      
      showToast('Ký hợp đồng thành công! Bạn hiện đã là người thuê chính thức của phòng này.', 'success');
    } catch (err) {
      console.error('Error signing contract:', err);
      showToast('Đã có lỗi khi ký hợp đồng. Vui lòng thử lại.', 'error');
    } finally {
      setSigningContract(null);
    }
  };

  const handleRejectContract = async (contract: any) => {
    if (!window.confirm(`Bạn có chắc muốn TỪ CHỐI hợp đồng phòng ${contract.rooms?.title}?`)) return;
    
    setSigningContract(contract.id);
    try {
      const { error: rpcError } = await supabase.rpc('reject_contract', { 
        p_contract_id: contract.id 
      });
      
      if (rpcError) throw rpcError;

      // Refresh data 
      await fetchPendingContracts();
      
      showToast('Đã từ chối lời mời hợp đồng thành công!', 'success');
    } catch (err) {
      console.error('Error rejecting contract:', err);
      showToast('Đã có lỗi khi từ chối hợp đồng. Vui lòng thử lại.', 'error');
    } finally {
      setSigningContract(null);
    }
  };

  const fetchSupportRequests = async () => {
    if (!user) return;
    setLoadingRequests(true);
    try {
      const { data, error } = await supabase
        .from('support_requests')
        .select(`*, rooms(title)`)
        .eq('tenant_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setSupportRequestsData(data || []);
    } catch (err) {
      console.error('Error fetching support requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!newRequestForm.roomId || !newRequestForm.title || !newRequestForm.description) return;
    
    setSubmittingRequest(true);
    try {
      // get owner_id from rooms directly
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('owner_id')
        .eq('id', newRequestForm.roomId)
        .single();
        
      if (roomError || !roomData?.owner_id) {
        showToast('Không tìm thấy thông tin phòng/chủ trọ. Vui lòng thử lại.', 'error');
        setSubmittingRequest(false);
        return;
      }
      
      const landlordId = roomData.owner_id;

      const { error } = await supabase.from('support_requests').insert({
        tenant_id: user?.id,
        room_id: newRequestForm.roomId,
        landlord_id: landlordId,
        title: newRequestForm.title,
        description: newRequestForm.description,
        status: 'pending'
      });
      if (error) throw error;
      setShowAddRequestModal(false);
      setNewRequestForm({ roomId: '', title: '', description: '' });
      await fetchSupportRequests();
      showToast('Gửi yêu cầu hỗ trợ thành công!', 'success');
    } catch (err) {
      console.error('Error submitting request:', err);
      showToast('Đã có lỗi xảy ra. Vui lòng thử lại.', 'error');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const fetchTenantRooms = async () => {
    if (!user) return;
    setLoadingRooms(true);
    try {
      // Lấy Profile hiện tại để lấy SĐT
      const { data: myProfile, error: profileError } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .single();

      console.log('[TenantRooms] My profile:', myProfile, 'Error:', profileError);

      const myPhone = myProfile?.phone || null;
      if (!myPhone) {
        setTenantRooms([]);
        return;
      }

      // Khôi phục gọi RPC function để fetch xuyên qua RLS
      const { data: rooms, error: rpcError } = await supabase
        .rpc('get_tenant_rooms', { tenant_phone: myPhone });

      if (rpcError) {
        console.error('[TenantRooms] RPC error:', rpcError);
        setTenantRooms([]);
        return;
      }

      if (rooms && rooms.length > 0) {
        const mapped = rooms.map((r: any) => ({
          id: r.id || r.room_id,
          title: r.title || r.room_title,
          price: r.price || r.room_price,
          type: r.type || r.room_type,
          area: r.area || r.room_area,
          status: r.status || r.room_status,
          image_url: r.image_url || r.room_image_url,
          note: r.note || r.room_note,
          contract_id: r.contract_id,
          contract_start: r.contract_start,
          contract_end: r.contract_end,
          deposit: r.contract_deposit || r.deposit,
          landlord_name: r.landlord_name || 'Chủ trọ',
          landlord_phone: r.landlord_phone || '',
          electricity_price: r.electricity_price,
          water_price: r.water_price,
          service_fee: r.service_fee,
          owner_id: r.owner_id
        }));
        console.log('[TenantRooms] Raw result:', rooms);
        console.log('[TenantRooms] Mapped rooms:', mapped);
        setTenantRooms(mapped);
      } else {
        setTenantRooms([]);
      }
    } catch (error) {
      console.error('[TenantRooms] Error:', error);
    } finally {
      setLoadingRooms(false);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'rooms', label: 'Phòng của tôi', icon: Bed },
    { id: 'contracts', label: 'Hợp đồng', icon: FileText },
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

          {/* Render Log Debug - visible only in console */}
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
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Chào, {user?.user_metadata?.full_name?.split(' ').pop() || 'bạn'}! 👋</h2>
                  <p className="text-slate-500">Hôm nay là {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      fetchTenantRooms();
                      fetchPendingContracts();
                      fetchSupportRequests();
                    }}
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all active:scale-95"
                    title="Cập nhật dữ liệu"
                  >
                    <ArrowUpDown className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                      if (tenantRooms.length > 0) {
                        setNewRequestForm(f => ({ ...f, roomId: tenantRooms[0].id }));
                      }
                      setShowAddRequestModal(true);
                    }}
                    className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <PlusCircle className="w-5 h-5" />
                    Gửi yêu cầu hỗ trợ
                  </button>
                </div>
              </div>

              {/* Pending Invites - Always show at top if exists */}
              {pendingContracts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Lời mời ký hợp đồng mới ({pendingContracts.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {pendingContracts.map((contract) => (
                      <motion.div 
                        key={contract.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-orange-50 border border-orange-200 rounded-[2rem] p-6 md:p-8 relative overflow-hidden group shadow-lg shadow-orange-100/50 flex flex-col md:col-span-2"
                      >
                        <div className="absolute top-0 right-0 p-6">
                          <BadgeCheck className="w-24 h-24 text-orange-200/30 group-hover:text-orange-300/40 transition-colors" />
                        </div>
                        <div className="relative z-10 flex flex-col h-full">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <span className="px-4 py-1.5 bg-white text-orange-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-orange-100 shadow-sm inline-block mb-3">Yêu cầu xác nhận</span>
                              <h4 className="text-xl md:text-3xl font-black text-slate-900 mb-1 font-display">Phòng: {contract.rooms?.title}</h4>
                              <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                                {contract.profiles?.avatar_url ? (
                                  <img src={contract.profiles.avatar_url} alt="avt" className="w-6 h-6 rounded-full object-cover" />
                                ) : (
                                  <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center"><User className="w-3.5 h-3.5 text-slate-500" /></div>
                                )}
                                Theo yêu cầu của: <span className="text-slate-700">{contract.profiles?.full_name}</span> 
                                {contract.profiles?.phone && <span className="text-slate-400">({contract.profiles.phone})</span>}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tiền cọc yêu cầu</p>
                              <p className="text-2xl font-black text-primary">{Number(contract.deposit || 0).toLocaleString()}đ</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 flex-1">
                            {/* Cột 1: Thông tin phòng cơ bản */}
                            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-orange-100 shadow-sm flex flex-col justify-center">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mb-1 flex items-center gap-1"><Building className="w-3 h-3"/> Loại phòng & Diện tích</p>
                              <p className="text-lg font-black text-slate-900">{contract.rooms?.type || 'Phòng trọ'} • {contract.rooms?.area}m²</p>
                            </div>
                            
                            {/* Cột 2: Thời hạn thuê */}
                            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-orange-100 shadow-sm flex flex-col justify-center">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> Thời hạn hợp đồng</p>
                              <p className="text-[13px] font-bold text-slate-700 leading-tight">
                                Từ: <span className="text-slate-900">{new Date(contract.start_date || new Date()).toLocaleDateString('vi-VN')}</span><br/>
                                Đến: <span className="text-slate-900">{new Date(contract.end_date || new Date()).toLocaleDateString('vi-VN')}</span>
                              </p>
                            </div>

                            {/* Cột 3: Giá thuê */}
                            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-orange-100 shadow-sm flex flex-col justify-center">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mb-1 flex items-center gap-1"><Wallet className="w-3 h-3"/> Giá thuê / tháng</p>
                              <p className="text-xl font-black text-slate-900">{Number(contract.rooms?.price).toLocaleString()}đ</p>
                            </div>

                            {/* Cột 4: Biểu phí & DV định mức */}
                            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-orange-100 shadow-sm flex flex-col justify-center">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1"><Layers className="w-3 h-3"/> Phí dịch vụ mặc định</p>
                              <div className="space-y-1">
                                <p className="text-[11px] font-bold text-slate-600 flex justify-between"><span>Điện:</span> <span className="text-slate-900">{Number(contract.rooms?.electricity_price || 3500).toLocaleString()}đ/kWh</span></p>
                                <p className="text-[11px] font-bold text-slate-600 flex justify-between"><span>Nước:</span> <span className="text-slate-900">{Number(contract.rooms?.water_price || 20000).toLocaleString()}đ/m³</span></p>
                                <p className="text-[11px] font-bold text-slate-600 flex justify-between"><span>Phí DV:</span> <span className="text-slate-900">{Number(contract.rooms?.service_fee || 150000).toLocaleString()}đ/tháng</span></p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-auto flex justify-end gap-3 border-t border-orange-200/50 pt-6">
                            <button 
                              onClick={() => handleRejectContract(contract)}
                              disabled={signingContract === contract.id}
                              className="px-6 py-4 bg-white text-slate-500 font-bold uppercase text-[11px] hover:text-red-600 rounded-2xl border border-orange-100 transition-all hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                            >
                              Từ chối
                            </button>
                            <button 
                              onClick={() => handleSignContract(contract)}
                              disabled={signingContract === contract.id}
                              className="bg-primary text-white px-8 font-black uppercase tracking-widest text-[11px] py-4 rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group/btn"
                            >
                              {signingContract === contract.id ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              ) : <CheckCircle className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />}
                              Xác nhận & Ký hợp đồng điện tử
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Rooms */}
              {tenantRooms.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Phòng đang thuê ({tenantRooms.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {tenantRooms.map((room) => {
                      const contractEndDate = room.contract_end ? new Date(room.contract_end) : null;
                      const today = new Date();
                      const diffTime = contractEndDate ? contractEndDate.getTime() - today.getTime() : 0;
                      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      const currentMonth = new Date().getMonth() + 1;

                      return (
                        <div key={room.id} className="grid grid-cols-1 md:grid-cols-1 gap-6 md:col-span-3 lg:col-span-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Room Info */}
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                  <Building className="w-8 h-8" />
                                </div>
                                <div>
                                  <h3 className="text-xl font-black text-slate-900 dark:text-white font-display">{room.title}</h3>
                                  <p className="text-sm font-bold text-slate-500">{room.type} • {room.area}m²</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mb-4">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">P. {room.title}, Tầng 2, Q. Liên Chiểu</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                  {[1, 2].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 overflow-hidden">
                                      <img src={`https://i.pravatar.cc/100?u=${room.id}${i}`} alt="tentant" className="w-full h-full object-cover" />
                                    </div>
                                  ))}
                                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-black text-slate-400">
                                    +1
                                  </div>
                                </div>
                                <span className="text-xs font-bold text-slate-400 ml-2">Bạn và 2 người khác</span>
                              </div>
                            </div>

                            {/* Rent Info */}
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center text-orange-600">
                                  <Wallet className="w-7 h-7" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tiền thuê tháng {currentMonth}</p>
                                  <h3 className="text-2xl font-black dark:text-white font-display">{Number(room.price).toLocaleString()}đ</h3>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                <User className="w-4 h-4 text-primary" />
                                <span className="text-sm font-bold text-slate-600 dark:text-slate-300 truncate">Chủ trọ: {room.landlord_name}</span>
                              </div>
                            </div>

                            {/* Contract */}
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center text-green-600">
                                  <Calendar className="w-7 h-7" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hết hạn hợp đồng</p>
                                  <h3 className="text-xl font-black dark:text-white font-display">{contractEndDate ? contractEndDate.toLocaleDateString('vi-VN') : 'N/A'}</h3>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-bold text-slate-500">
                                  Còn <strong className="text-slate-900 dark:text-primary text-lg">{daysLeft}</strong> ngày
                                </div>
                                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-[9px] font-black uppercase tracking-widest">Đang hiệu lực</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty State when no rooms and no pending contracts */}
              {tenantRooms.length === 0 && pendingContracts.length === 0 && (
                <div className="bg-white dark:bg-slate-900 p-20 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 text-center flex flex-col items-center">
                  <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-200 dark:text-slate-700 mb-8 ring-8 ring-slate-50/50">
                    <DoorOpen className="w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 font-display">Bạn chưa thuê phòng nào</h3>
                  <p className="text-slate-500 max-w-sm mb-10 font-medium leading-relaxed">Hiện tại bạn chưa được bàn giao phòng. Hãy cung cấp Số điện thoại cho chủ trọ để được thêm vào phòng và ký hợp đồng điện tử.</p>
                  <button onClick={() => onNavigate('search')} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all flex items-center gap-3 shadow-2xl shadow-slate-200">
                    <Search className="w-4 h-4" />
                    Tìm kiếm phòng trọ
                  </button>
                </div>
              )}

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
                  <button 
                    onClick={() => {
                      if (tenantRooms.length > 0) {
                        setNewRequestForm(f => ({ ...f, roomId: tenantRooms[0].id }));
                      }
                      setShowAddRequestModal(true);
                    }}
                    className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <PlusCircle className="w-4 h-4" /> Gửi yêu cầu
                  </button>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loadingRequests ? (
                    <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
                  ) : supportRequestsData.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 font-bold text-sm">Chưa có yêu cầu hỗ trợ nào.</div>
                  ) : supportRequestsData.slice(0, 5).map((req) => {
                    const statusText = req.status === 'pending' ? 'Đã gửi' : req.status === 'processing' ? 'Đang xử lý' : 'Hoàn thành';
                    const statusColor = req.status === 'pending' ? 'bg-slate-100 text-slate-700 border-slate-200' : req.status === 'processing' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-green-100 text-green-700 border-green-200';
                    const iconBg = req.status === 'pending' ? 'bg-slate-100' : req.status === 'processing' ? 'bg-amber-100' : 'bg-green-100';
                    const Icon = req.status === 'pending' ? MessageCircle : req.status === 'processing' ? Wrench : CheckCircle;
                    const date = new Date(req.created_at).toLocaleDateString('vi-VN');
                    
                    return (
                    <div key={req.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group cursor-pointer gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
                          <Icon className={`w-5 h-5 ${req.status === 'pending' ? 'text-slate-600' : req.status === 'processing' ? 'text-amber-600' : 'text-green-600'}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{req.title}</p>
                          <p className="text-xs text-slate-500">Phòng: {req.rooms?.title} &bull; {date}</p>
                        </div>
                      </div>
                      <div className="flex items-center self-start md:self-auto shrink-0">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusColor}`}>
                          {statusText}
                        </span>
                      </div>
                    </div>
                  )})}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'messages' && (
          <Messaging user={user} role="tenant" initialActiveChat={activeChatId} />
          )}

          {/* Rooms Tab - Real Data */}
          {activeTab === 'rooms' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 font-display">Phòng của tôi</h2>
                  <p className="text-slate-500 font-medium">Danh sách các phòng bạn đang thuê.</p>
                </div>
              </div>

              {loadingRooms ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-500 font-bold mt-4 animate-pulse">Đang tải dữ liệu...</p>
                </div>
              ) : tenantRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6">
                    <Home className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có phòng nào</h3>
                  <p className="text-slate-500 max-w-sm">Bạn chưa được gán vào phòng nào. Vui lòng liên hệ chủ trọ để được thêm vào phòng.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-8">
                  {tenantRooms.map((room) => {
                    const contractStart = new Date(room.contract_start);
                    const contractEnd = new Date(room.contract_end);
                    const today = new Date();
                    
                    const totalDays = Math.max(1, Math.ceil((contractEnd.getTime() - contractStart.getTime()) / (1000 * 60 * 60 * 24)));
                    const elapsedDays = Math.max(0, Math.ceil((today.getTime() - contractStart.getTime()) / (1000 * 60 * 60 * 24)));
                    const daysLeft = Math.max(0, totalDays - elapsedDays);
                    const progressPercent = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
                    
                    const isExpiringSoon = daysLeft > 0 && daysLeft <= 30;
                    const isExpired = daysLeft === 0;

                    return (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-primary/5 overflow-hidden transition-all group flex flex-col md:flex-row"
                    >
                      {/* Left Side: Cinematic Image Banner */}
                      <div className="relative md:w-1/3 shrink-0 overflow-hidden h-64 md:h-auto">
                        <img 
                          src={room.image_url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=600'}
                          alt={room.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        
                        {/* Glassmorphism Badge */}
                        <div className="absolute top-6 left-6">
                          <span className={`${isExpired ? 'bg-red-500/80 border-red-400' : 'bg-white/20 border-white/40'} backdrop-blur-md border text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-2xl flex items-center gap-2`}>
                            {!isExpired && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>}
                            {isExpired ? 'Hết hạn' : 'Đang thuê'}
                          </span>
                        </div>

                        {/* Landlord Contact Context Overlay */}
                        <div className="absolute bottom-6 left-6 right-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg text-white">
                              <User className="w-6 h-6" />
                            </div>
                            <div className="text-white">
                              <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Chủ trọ</p>
                              <p className="font-bold">{room.landlord_name}</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-4">
                            <button 
                              disabled={isStartingChat}
                              onClick={async () => {
                                if (!room.owner_id || !user) {
                                  setActiveTab('messages');
                                  return;
                                }
                                setIsStartingChat(true);
                                try {
                                  const { data: existingConvs } = await supabase
                                    .from('conversations')
                                    .select('id')
                                    .eq('tenant_id', user.id)
                                    .eq('landlord_id', room.owner_id);

                                  let conversationId: string | null = null;
                                  if (existingConvs && existingConvs.length > 0) {
                                    conversationId = existingConvs[0].id;
                                  } else {
                                    const { data: newConv } = await supabase
                                      .from('conversations')
                                      .insert({ tenant_id: user.id, landlord_id: room.owner_id })
                                      .select('id')
                                      .single();
                                    if (newConv) conversationId = newConv.id;
                                  }
                                  if (conversationId) setActiveChatId(conversationId);
                                } catch (err) {
                                  console.error('Lỗi khởi tạo chat:', err);
                                } finally {
                                  setIsStartingChat(false);
                                  setActiveTab('messages');
                                }
                              }}
                              className="flex-1 py-2.5 rounded-xl bg-primary/90 hover:bg-primary backdrop-blur-md text-white font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                              <MessageSquare className="w-4 h-4" /> Message
                            </button>
                            {room.landlord_phone && (
                              <a href={`tel:${room.landlord_phone}`} className="w-10 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-all">
                                <Phone className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Information */}
                      <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-2xl font-black text-slate-900 font-display">{room.title}</h3>
                            <span className="text-2xl font-black text-primary font-display">{Number(room.price).toLocaleString()}đ<span className="text-sm text-slate-400 font-bold">/th</span></span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mb-8">
                            {room.type && (
                              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5" /> {room.type}
                              </span>
                            )}
                            {room.area && (
                              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-1.5">
                                <Maximize2 className="w-3.5 h-3.5" /> {room.area} m²
                              </span>
                            )}
                          </div>

                          {/* Utilities Info - Gradient Cards */}
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Thông số dịch vụ</p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-4 border border-yellow-100/50">
                              <div className="flex items-center gap-2 mb-2 text-yellow-600 text-xs font-black uppercase tracking-widest">
                                <Zap className="w-4 h-4" /> Điện
                              </div>
                              <div className="font-black text-slate-900 text-sm">{Number(room.electricity_price || 3500).toLocaleString()}<span className="text-slate-400 font-bold text-[10px] ml-1">đ/kwh</span></div>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-100/50">
                              <div className="flex items-center gap-2 mb-2 text-blue-600 text-xs font-black uppercase tracking-widest">
                                <Droplets className="w-4 h-4" /> Nước
                              </div>
                              <div className="font-black text-slate-900 text-sm">{Number(room.water_price || 20000).toLocaleString()}<span className="text-slate-400 font-bold text-[10px] ml-1">đ/khối</span></div>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100/50">
                              <div className="flex items-center gap-2 mb-2 text-green-600 text-xs font-black uppercase tracking-widest">
                                <ShieldCheck className="w-4 h-4" /> Dịch vụ
                              </div>
                              <div className="font-black text-slate-900 text-sm">{Number(room.service_fee || 150000).toLocaleString()}<span className="text-slate-400 font-bold text-[10px] ml-1">đ/tháng</span></div>
                            </div>
                          </div>
                        </div>

                        {/* Contract Progress */}
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 relative overflow-hidden">
                          {isExpiringSoon && (
                            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                          )}
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nội dung Hợp đồng</p>
                            {room.deposit > 0 && (
                              <span className="text-xs font-bold text-slate-500">Cọc: <span className="font-black text-slate-900">{Number(room.deposit).toLocaleString()}đ</span></span>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold">
                              <span className="text-slate-900">{contractStart.toLocaleDateString('vi-VN')}</span>
                              <span className={`${isExpiringSoon ? 'text-orange-600' : 'text-slate-900'}`}>{contractEnd.toLocaleDateString('vi-VN')}</span>
                            </div>
                            
                            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className={`h-full rounded-full relative ${
                                  isExpiringSoon ? 'bg-orange-500' : isExpired ? 'bg-red-500' : 'bg-green-500'
                                }`}
                              >
                                <div className="absolute inset-0 bg-white/20 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]"></div>
                              </motion.div>
                            </div>
                            
                            <div className="flex justify-end text-[10px] font-black uppercase tracking-widest">
                              {isExpired ? (
                                <span className="text-red-500">Đã hết hạn</span>
                              ) : isExpiringSoon ? (
                                <span className="text-orange-500">Sắp hết hạn (Còn {daysLeft} ngày)</span>
                              ) : (
                                <span className="text-slate-400">Đã qua {elapsedDays} ngày / Còn {daysLeft} ngày</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )})}
                </div>
              )}
            </motion.div>
          )}

          {/* Contracts Tab - Real Data */}
          {activeTab === 'contracts' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 font-display">Hợp đồng thuê</h2>
                  <p className="text-slate-500 font-medium">Danh sách hợp đồng thuê phòng của bạn.</p>
                </div>
              </div>

              {loadingRooms ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-500 font-bold mt-4 animate-pulse">Đang tải dữ liệu...</p>
                </div>
              ) : tenantRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6">
                    <FileText className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có hợp đồng</h3>
                  <p className="text-slate-500 max-w-sm">Bạn chưa có hợp đồng thuê nào. Khi chủ trọ thêm bạn vào phòng, hợp đồng sẽ hiển thị tại đây.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {tenantRooms.map((room) => {
                    const startDate = room.contract_start ? new Date(room.contract_start) : null;
                    const endDate = room.contract_end ? new Date(room.contract_end) : null;
                    const daysLeft = endDate ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
                    const totalDays = startDate && endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 1;
                    const progress = totalDays > 0 ? Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100)) : 0;

                    return (
                      <motion.div
                        key={room.contract_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
                      >
                        {/* Contract Header */}
                        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary flex-shrink-0">
                              <FileText className="w-7 h-7" />
                            </div>
                            <div>
                              <h3 className="text-lg font-black text-slate-900">Hợp đồng - {room.title}</h3>
                              <p className="text-sm text-slate-500 font-medium">Mã HĐ: #{room.contract_id?.slice(0, 8).toUpperCase()}</p>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-700 border border-green-200 self-start">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Đang hiệu lực
                          </span>
                        </div>

                        {/* Contract Details */}
                        <div className="p-6 md:p-8 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phòng</p>
                              <p className="font-bold text-slate-900 flex items-center gap-2">
                                <Bed className="w-4 h-4 text-slate-400" />
                                {room.title}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chủ trọ</p>
                              <p className="font-bold text-slate-900 flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-400" />
                                {room.landlord_name}
                              </p>
                              {room.landlord_phone && (
                                <p className="text-xs text-slate-500 flex items-center gap-2 ml-6">
                                  <Phone className="w-3 h-3" /> {room.landlord_phone}
                                </p>
                              )}
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiền thuê/tháng</p>
                              <p className="font-black text-primary text-lg">{Number(room.price).toLocaleString()}đ</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiền cọc</p>
                              <p className="font-bold text-slate-900">{room.deposit > 0 ? `${Number(room.deposit).toLocaleString()}đ` : 'Không yêu cầu'}</p>
                            </div>
                          </div>

                          {/* Timeline */}
                          <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời hạn hợp đồng</p>
                              <span className="text-xs font-bold text-slate-500">Còn {daysLeft} ngày</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-bold text-slate-700">
                                <Calendar className="w-4 h-4 inline mr-1 text-slate-400" />
                                {startDate?.toLocaleDateString('vi-VN')}
                              </span>
                              <span className="font-bold text-slate-700">
                                {endDate?.toLocaleDateString('vi-VN')}
                                <Calendar className="w-4 h-4 inline ml-1 text-slate-400" />
                              </span>
                            </div>
                            {/* Progress Bar */}
                            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-primary to-orange-400 h-full rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-center text-slate-500 font-bold">Đã qua {progress}% thời hạn</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'account' && (() => {
            if (!profileLoading && !profileForm.full_name && user?.id) {
              setProfileLoading(true);
              supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
                if (data) setProfileForm({
                  full_name: data.full_name || '',
                  phone: data.phone || '',
                  gender: data.gender || '',
                  birth_date: data.birth_date || '',
                  permanent_address: data.permanent_address || '',
                  id_card_number: data.id_card_number || '',
                  id_card_date: data.id_card_date || '',
                  id_card_place: data.id_card_place || '',
                  bank_name: data.bank_name || '',
                  bank_account_number: data.bank_account_number || '',
                  bank_account_name: data.bank_account_name || '',
                  zalo_phone: data.zalo_phone || '',
                  emergency_contact_name: data.emergency_contact_name || '',
                  emergency_contact_phone: data.emergency_contact_phone || ''
                });
                setProfileLoading(false);
              });
            }

            const handleUpdatePassword = async (e: React.FormEvent) => {
              e.preventDefault();
              if (passwordForm.new !== passwordForm.confirm) {
                setPasswordMsg('Mật khẩu xác nhận không khớp!');
                return;
              }
              setPasswordLoading(true);
              const { error } = await supabase.auth.updateUser({ password: passwordForm.new });
              setPasswordLoading(false);
              setPasswordMsg(error ? 'Lỗi: ' + error.message : 'Cập nhật mật khẩu thành công!');
              if (!error) setPasswordForm({ old: '', new: '', confirm: '' });
              setTimeout(() => setPasswordMsg(''), 3000);
            };

            const handleSaveProfile = async () => {
              if (!user?.id) return;
              setProfileSaving(true);
              const { error } = await supabase.from('profiles').update(profileForm).eq('id', user.id);
              setProfileSaving(false);
              setProfileSaveMsg(error ? 'Đã xảy ra lỗi!' : 'Lưu thành công!');
              setTimeout(() => setProfileSaveMsg(''), 3000);
            };

            const updateProfileField = (field: string, val: string) => {
              setProfileForm(f => ({ ...f, [field]: val }));
            };

            return (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto w-full flex flex-col gap-8 pb-20">
                {/* Profile Header Card */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-3xl overflow-hidden ring-4 ring-slate-50 shadow-xl relative">
                      <img src={user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-xl shadow-lg flex items-center justify-center hover:scale-110 transition-transform border-4 border-white"><Camera className="w-5 h-5" /></button>
                  </div>
                  <div className="text-center md:text-left flex-1 relative z-10">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                      <h2 className="text-3xl font-black text-slate-900 font-display">{profileForm.full_name || user?.user_metadata?.full_name || 'Khách thuê'}</h2>
                      <span className="bg-emerald-100 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1"><BadgeCheck className="w-3 h-3" />Người thuê</span>
                    </div>
                    <p className="text-slate-500 font-bold text-sm mb-4">{user?.email}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                       <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 px-3 py-2 rounded-xl"><Home className="w-4 h-4" /> {tenantRooms.length} Phòng đang thuê</div>
                    </div>
                  </div>
                </div>

                {profileLoading ? (
                  <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Form Info */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><User className="w-5 h-5" /></div>
                          <div><h3 className="font-black text-slate-900 font-display">Thông tin cá nhân</h3><p className="text-xs text-slate-400 font-medium">Thông tin hiển thị trên hệ thống</p></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <InputField label="Họ và tên" icon={User} field="full_name" placeholder="Nguyễn Văn A" value={profileForm.full_name} onChange={v => updateProfileField('full_name', v)} />
                          <InputField label="Số điện thoại" icon={Phone} field="phone" type="tel" placeholder="0901 234 567" value={profileForm.phone} onChange={v => updateProfileField('phone', v)} />
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giới tính</label>
                            <select value={profileForm.gender} onChange={e => updateProfileField('gender', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none text-sm"><option value="">Chọn giới tính</option><option value="Nam">Nam</option><option value="Nữ">Nữ</option><option value="Khác">Khác</option></select>
                          </div>
                          <InputField label="Ngày sinh" icon={Calendar} field="birth_date" type="date" value={profileForm.birth_date} onChange={v => updateProfileField('birth_date', v)} />
                          <div className="md:col-span-2"><InputField label="Địa chỉ thường trú" icon={MapPin} field="permanent_address" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" value={profileForm.permanent_address} onChange={v => updateProfileField('permanent_address', v)} /></div>
                        </div>
                      </div>

                      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600"><CheckCircle className="w-5 h-5" /></div>
                          <div><h3 className="font-black text-slate-900 font-display">Định danh pháp lý</h3><p className="text-xs text-slate-400 font-medium">Bắt buộc để ký hợp đồng điện tử</p></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <InputField label="Số CCCD / CMND" icon={Layers} field="id_card_number" placeholder="012345678901" value={profileForm.id_card_number} onChange={v => updateProfileField('id_card_number', v)} />
                          <InputField label="Ngày cấp" icon={Calendar} field="id_card_date" type="date" value={profileForm.id_card_date} onChange={v => updateProfileField('id_card_date', v)} />
                          <div className="md:col-span-2"><InputField label="Nơi cấp" icon={MapPin} field="id_card_place" placeholder="Cục Cảnh sát QLHC về TTXH" value={profileForm.id_card_place} onChange={v => updateProfileField('id_card_place', v)} /></div>
                        </div>
                      </div>

                      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600"><Wallet className="w-5 h-5" /></div>
                          <div><h3 className="font-black text-slate-900 font-display">Tài chính & Liên hệ</h3><p className="text-xs text-slate-400 font-medium">Thông tin thanh toán và khẩn cấp</p></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <InputField label="Tên ngân hàng" icon={ShieldCheck} field="bank_name" placeholder="Vietcombank, MB Bank..." value={profileForm.bank_name} onChange={v => updateProfileField('bank_name', v)} />
                          <InputField label="Số tài khoản" icon={Home} field="bank_account_number" placeholder="1234567890" value={profileForm.bank_account_number} onChange={v => updateProfileField('bank_account_number', v)} />
                          <div className="md:col-span-2"><InputField label="Tên chủ tài khoản" icon={User} field="bank_account_name" placeholder="NGUYEN VAN A" value={profileForm.bank_account_name} onChange={v => updateProfileField('bank_account_name', v)} /></div>
                          <InputField label="Số Zalo" icon={Phone} field="zalo_phone" type="tel" placeholder="0901 234 567" value={profileForm.zalo_phone} onChange={v => updateProfileField('zalo_phone', v)} />
                          <InputField label="Tên người thân (khẩn cấp)" icon={Users} field="emergency_contact_name" placeholder="Nguyễn Văn B" value={profileForm.emergency_contact_name} onChange={v => updateProfileField('emergency_contact_name', v)} />
                          <div className="md:col-span-2"><InputField label="SĐT người thân (khẩn cấp)" icon={PhoneCall} field="emergency_contact_phone" type="tel" placeholder="0901 234 567" value={profileForm.emergency_contact_phone} onChange={v => updateProfileField('emergency_contact_phone', v)} /></div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <button onClick={handleSaveProfile} disabled={profileSaving} className="bg-primary text-white font-black uppercase tracking-widest text-xs px-10 py-5 rounded-2xl hover:bg-primary-hover transition-all flex items-center gap-2 shadow-xl shadow-orange-100 hover:-translate-y-1 disabled:opacity-60">{profileSaving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang lưu...</> : <><CheckCircle className="w-4 h-4" /> Lưu thông tin hồ sơ</>}</button>
                        {profileSaveMsg && <span className={`text-sm font-bold ${profileSaveMsg.includes('lỗi') ? 'text-red-500' : 'text-green-600'}`}>{profileSaveMsg}</span>}
                      </div>
                    </div>

                    {/* Right Column: Security & Settings */}
                    <div className="flex flex-col gap-8">
                       <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm overflow-hidden relative">
                         <div className="flex items-center gap-3 mb-6">
                           <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center"><LockIcon className="w-5 h-5" /></div>
                           <div><h3 className="font-black text-slate-900 font-display">Bảo mật</h3><p className="text-xs text-slate-400 font-medium">Đổi mật khẩu tài khoản</p></div>
                         </div>
                         <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu mới</label>
                              <div className="relative">
                                <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type={showPassword ? 'text' : 'password'} value={passwordForm.new} onChange={e => setPasswordForm(f => ({ ...f, new: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 p-4 pl-11 transition-all outline-none text-sm" placeholder="••••••••" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Xác nhận mật khẩu</label>
                              <div className="relative">
                                <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type={showPassword ? 'text' : 'password'} value={passwordForm.confirm} onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 p-4 pl-11 transition-all outline-none text-sm" placeholder="••••••••" />
                              </div>
                            </div>
                            <button type="submit" disabled={passwordLoading} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-lg shadow-slate-100 disabled:opacity-60">{passwordLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</button>
                            {passwordMsg && <p className={`text-[10px] font-bold text-center ${passwordMsg.includes('Cập nhật') ? 'text-green-600' : 'text-red-500'}`}>{passwordMsg}</p>}
                         </form>
                       </div>

                       <div className="bg-red-50/50 rounded-3xl border border-red-100 p-8">
                         <div className="flex items-center gap-3 mb-4 text-red-600">
                           <ShieldAlert className="w-5 h-5" />
                           <h3 className="font-black font-display">Vùng nguy hiểm</h3>
                         </div>
                         <p className="text-[10px] font-bold text-red-400 mb-6 leading-relaxed">Xóa tài khoản sẽ xóa vĩnh viễn tất cả dữ liệu phòng trọ và hợp đồng. Hành động này không thể hoàn tác!</p>
                         <button className="w-full py-3 rounded-xl border-2 border-red-200 text-red-600 font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white hover:border-red-600 transition-all">Xóa tài khoản vĩnh viễn</button>
                       </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })()}

          {activeTab !== 'overview' && activeTab !== 'messages' && activeTab !== 'rooms' && activeTab !== 'contracts' && activeTab !== 'account' && (
            <div className="flex flex-col items-center justify-center h-96 text-slate-400">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Tính năng đang phát triển</h3>
              <p className="text-sm">Trang {navItems.find(i => i.id === activeTab)?.label} sẽ sớm ra mắt.</p>
            </div>
          )}
        </main>
      </div>

      {/* Add Support Request Modal */}
      {showAddRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900 font-display">Gửi yêu cầu hỗ trợ</h3>
                <p className="text-xs font-bold text-slate-400 mt-1">Thông báo sửa chữa, sự cố đến chủ trọ</p>
              </div>
              <button onClick={() => setShowAddRequestModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-8 py-6 overflow-y-auto">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phòng gặp sự cố *</label>
                  <select
                    value={newRequestForm.roomId}
                    onChange={e => setNewRequestForm(f => ({ ...f, roomId: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none appearance-none"
                  >
                    <option value="">Chọn phòng...</option>
                    {tenantRooms.map(room => (
                      <option key={room.id} value={room.id}>{room.title}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiêu đề *</label>
                  <input
                    type="text"
                    value={newRequestForm.title}
                    onChange={e => setNewRequestForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="VD: Hư bóng đèn nhà tắm"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mô tả chi tiết *</label>
                  <textarea
                    value={newRequestForm.description}
                    onChange={e => setNewRequestForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Mô tả cụ thể tình trạng sự cố để chủ trọ dễ dàng nắm bắt..."
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-4">
              <button
                onClick={() => setShowAddRequestModal(false)}
                className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all bg-slate-200 text-slate-500 hover:bg-slate-300"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitRequest}
                disabled={submittingRequest || !newRequestForm.roomId || !newRequestForm.title || !newRequestForm.description}
                className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-white hover:bg-primary-hover shadow-lg shadow-orange-100 flex justify-center items-center gap-2"
              >
                {submittingRequest ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : 'Gửi yêu cầu'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
