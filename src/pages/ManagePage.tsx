import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../components/Header';
import Messaging from '../components/Messaging';
import { supabase } from '../lib/supabase';
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
  Lock as LockIcon,
  Camera,
  MapPin,
  Eye,
  EyeOff,
  BadgeCheck,
  X,
  Sparkles,
  ArrowLeft,
  Trash2,
  Zap,
  Droplets,
  ShieldCheck,
  Wrench,
  Calendar
} from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface ManagePageProps {
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

export const ManagePage = ({ onNavigate, user, onLogout, initialParams }: ManagePageProps) => {
  const [activeTab, setActiveTab] = useState(initialParams?.tab || 'overview');
  const [roomFilter, setRoomFilter] = useState('all');
  const [contractFilter, setContractFilter] = useState(initialParams?.filter || 'all');
  const [activeChat, setActiveChat] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

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

  // Real data states
  const [roomsData, setRoomsData] = useState<any[]>([]);
  const [contractsData, setContractsData] = useState<any[]>([]);
  const [invoicesData, setInvoicesData] = useState<any[]>([]);
  const [listingsData, setListingsData] = useState<any[]>([]);
  const [supportRequestsData, setSupportRequestsData] = useState<any[]>([]);

  // Add Room Modal states
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [addRoomStep, setAddRoomStep] = useState<1 | 2>(1);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [addingRoom, setAddingRoom] = useState(false);
  const [newRoomForm, setNewRoomForm] = useState({
    title: '',
    price: '',
    type: 'Phòng trọ',
    area: '',
    status: 'empty',
    note: '',
    image_url: '',
    tenant_id: '',
    electricity_price: 3500,
    water_price: 20000,
    service_fee: 150000,
    tenant_deposit: '',
    tenant_start_date: new Date().toISOString().split('T')[0],
    tenant_end_date: (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split('T')[0]; })()
  });

  // Add Listing Modal states
  const [showAddListingModal, setShowAddListingModal] = useState(false);
  const [addingListing, setAddingListing] = useState(false);
  const [listingForm, setListingForm] = useState({
    title: '', description: '', price: '', area: '', type: 'Phòng trọ',
    location: '', street: '', image_url: '',
    electricity_price: 3500, water_price: 20000, service_fee: 150000, deposit: ''
  });

  // Edit Room Modal states
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [savingRoomEdit, setSavingRoomEdit] = useState(false);
  const [editRoomForm, setEditRoomForm] = useState({
    title: '',
    price: '',
    type: 'Phòng trọ',
    area: '',
    status: 'empty',
    note: '',
    image_url: '',
    electricity_price: 3500,
    water_price: 20000,
    service_fee: 150000
  });

  // Delete Room Confirm Modal states
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<{id: string, title: string} | null>(null);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState('');

  // Room Detail Modal states
  const [showRoomDetailModal, setShowRoomDetailModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  // Tenant phone search states
  const [searchPhone, setSearchPhone] = useState('');
  const [searchingTenant, setSearchingTenant] = useState(false);
  const [foundTenant, setFoundTenant] = useState<any>(null);
  const [searchError, setSearchError] = useState('');

  // Tenant management states
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [showTenantProfile, setShowTenantProfile] = useState(false);

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        { data: rooms },
        { data: contracts },
        { data: invoices },
        { data: listings }
      ] = await Promise.all([
        supabase.from('rooms').select('*').eq('owner_id', user?.id),
        supabase.from('contracts').select('*, profiles!contracts_tenant_id_fkey(full_name, avatar_url, phone, gender, birth_date, permanent_address, id_card_number, id_card_date, id_card_place, zalo_phone, bank_name, bank_account_number, bank_account_name, emergency_contact_name, emergency_contact_phone), rooms(title)').eq('owner_id', user?.id),
        supabase.from('invoices').select('*, profiles!invoices_tenant_id_fkey(full_name, avatar_url, phone), rooms(title)').eq('owner_id', user?.id),
        supabase.from('listings').select('*').eq('owner_id', user?.id)
      ]);

      setRoomsData(rooms || []);
      setContractsData(contracts || []);
      setInvoicesData(invoices || []);
      setListingsData(listings || []);
      
      // Fetch support requests separately so it doesn't break the whole dashboard if the join fails
      const { data: supportRequests, error: supportError } = await supabase
        .from('support_requests')
        .select('*, rooms(title)')
        .eq('landlord_id', user?.id)
        .order('created_at', { ascending: false });
        
      if (supportError) {
        console.error('Error fetching support requests:', supportError);
      }
      
      // If we got support requests, try to fetch profiles manually since joining profiles directly via auth.users FK requires special views
      if (supportRequests && supportRequests.length > 0) {
        const tenantIds = [...new Set(supportRequests.map(req => req.tenant_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, phone')
          .in('id', tenantIds);
          
        const mappedRequests = supportRequests.map(req => ({
          ...req,
          profiles: profilesData?.find(p => p.id === req.tenant_id) || null
        }));
        setSupportRequestsData(mappedRequests);
      } else {
        setSupportRequestsData([]);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddRoomModal = () => {
    setShowAddRoomModal(true);
    setAddRoomStep(1);
    setSelectedListingId(null);
    setNewRoomForm({ title: '', price: '', type: 'Phòng trọ', area: '', status: 'empty', note: '', image_url: '', tenant_id: '', electricity_price: 3500, water_price: 20000, service_fee: 150000, tenant_deposit: '', tenant_start_date: new Date().toISOString().split('T')[0], tenant_end_date: (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split('T')[0]; })() });
    setSearchPhone('');
    setFoundTenant(null);
    setSearchError('');
  };

  const selectListingForRoom = (listing: any) => {
    setSelectedListingId(listing.id);
    setNewRoomForm({
      title: listing.title || '',
      price: listing.price?.toString() || '',
      type: listing.type || 'Phòng trọ',
      area: listing.area?.toString() || '',
      status: 'empty',
      note: '',
      image_url: listing.image_url || (listing.images && listing.images[0]) || '',
      tenant_id: '',
      electricity_price: listing.electricity_price || 3500,
      water_price: listing.water_price || 20000,
      service_fee: listing.service_fee || 150000,
      tenant_deposit: listing.deposit?.toString() || listing.price?.toString() || '',
      tenant_start_date: new Date().toISOString().split('T')[0],
      tenant_end_date: (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split('T')[0]; })()
    });
    setAddRoomStep(2);
  };

  const skipToManualEntry = () => {
    setSelectedListingId(null);
    setNewRoomForm({ title: '', price: '', type: 'Phòng trọ', area: '', status: 'empty', note: '', image_url: '', tenant_id: '', electricity_price: 3500, water_price: 20000, service_fee: 150000, tenant_deposit: '', tenant_start_date: new Date().toISOString().split('T')[0], tenant_end_date: (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split('T')[0]; })() });
    setAddRoomStep(2);
  };

  const handleAddRoom = async () => {
    if (!newRoomForm.title || !newRoomForm.price) return;
    setAddingRoom(true);
    try {
      const roomStatus = newRoomForm.tenant_id ? 'pending' : (newRoomForm.status || 'empty');
      
      // 1. Create the room
      const { data: newRoom, error: roomError } = await supabase.from('rooms').insert({
        owner_id: user?.id,
        title: newRoomForm.title,
        price: Number(newRoomForm.price),
        type: newRoomForm.type,
        area: newRoomForm.area ? Number(newRoomForm.area) : null,
        status: roomStatus,
        note: newRoomForm.note || null,
        image_url: newRoomForm.image_url || null,
        electricity_price: Number(newRoomForm.electricity_price) || 3500,
        water_price: Number(newRoomForm.water_price) || 20000,
        service_fee: Number(newRoomForm.service_fee) || 150000
      }).select().single();
      if (roomError) throw roomError;

      // 2. Create a contract linking tenant to this room IF tenant was selected
      if (newRoom && newRoomForm.tenant_id) {
        const { data: newContract, error: contractError } = await supabase.from('contracts').insert({
          owner_id: user?.id,
          tenant_id: newRoomForm.tenant_id,
          room_id: newRoom.id,
          start_date: newRoomForm.tenant_start_date,
          end_date: newRoomForm.tenant_end_date,
          deposit: newRoomForm.tenant_deposit ? Number(newRoomForm.tenant_deposit) : 0,
          status: 'pending'
        }).select().single();

        if (contractError) {
          console.error('Error creating contract:', contractError);
        } else if (newContract) {
          // 3. Send notification to tenant
          await supabase.from('notifications').insert({
            sender_id: user?.id,
            receiver_id: newRoomForm.tenant_id,
            type: 'contract_invite',
            title: 'Yêu cầu ký hợp đồng mới',
            message: `Chủ trọ đã thêm bạn vào phòng "${newRoom.title}". Vui lòng xác nhận hợp đồng để bắt đầu thuê.`,
            related_entity_id: newContract.id,
            action_url: 'tenant?tab=overview'
          });
        }
      }

      setShowAddRoomModal(false);
      await fetchDashboardData();
    } catch (err) {
      console.error('Error adding room:', err);
      alert('Đã có lỗi xảy ra. Kiểm tra console hoặc quyền (RLS) của database.');
    } finally {
      setAddingRoom(false);
    }
  };

  // Tạo bài đăng mới - CHỈ insert vào listings, KHÔNG tạo room
  const handleAddListing = async () => {
    if (!listingForm.title || !listingForm.price) return;
    setAddingListing(true);
    try {
      const { error } = await supabase.from('listings').insert({
        owner_id: user?.id,
        title: listingForm.title,
        description: listingForm.description || null,
        price: Number(listingForm.price),
        area: listingForm.area ? Number(listingForm.area) : null,
        type: listingForm.type,
        location: listingForm.location || null,
        street: listingForm.street || null,
        image_url: listingForm.image_url || null,
        images: listingForm.image_url ? [listingForm.image_url] : [],
        electricity_price: Number(listingForm.electricity_price) || 3500,
        water_price: Number(listingForm.water_price) || 20000,
        service_fee: Number(listingForm.service_fee) || 150000,
        deposit: listingForm.deposit ? Number(listingForm.deposit) : Number(listingForm.price),
        is_active: true,
        approval_status: 'approved'
      });
      if (error) throw error;
      setShowAddListingModal(false);
      setListingForm({ title: '', description: '', price: '', area: '', type: 'Phòng trọ', location: '', street: '', image_url: '', electricity_price: 3500, water_price: 20000, service_fee: 150000, deposit: '' });
      await fetchDashboardData();
    } catch (err) {
      console.error('Error adding listing:', err);
      alert('Đã có lỗi khi tạo bài đăng.');
    } finally {
      setAddingListing(false);
    }
  };

  const handleUpdateSupportRequest = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('support_requests').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      setSupportRequestsData(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
    } catch (err) {
      console.error('Error updating support request:', err);
      alert('Không thể cập nhật yêu cầu. Vui lòng thử lại.');
    }
  };

  const openEditRoomModal = (roomId: string) => {
    const r = roomsData.find(x => x.id === roomId);
    if (!r) return;
    setEditingRoomId(r.id);
    setEditRoomForm({
      title: r.title || '',
      price: r.price?.toString() || '',
      type: r.type || 'Phòng trọ',
      area: r.area?.toString() || '',
      status: r.status || 'empty',
      note: r.note || '',
      image_url: r.image_url || '',
      electricity_price: r.electricity_price || 3500,
      water_price: r.water_price || 20000,
      service_fee: r.service_fee || 150000
    });
    setShowEditRoomModal(true);
  };

  const handleSaveRoomEdit = async () => {
    if (!editingRoomId || !editRoomForm.title || !editRoomForm.price) return;
    setSavingRoomEdit(true);
    try {
      const { error } = await supabase.from('rooms').update({
        title: editRoomForm.title,
        price: Number(editRoomForm.price),
        type: editRoomForm.type,
        area: editRoomForm.area ? Number(editRoomForm.area) : null,
        status: editRoomForm.status,
        note: editRoomForm.note || null,
        image_url: editRoomForm.image_url || null,
        electricity_price: Number(editRoomForm.electricity_price) || 3500,
        water_price: Number(editRoomForm.water_price) || 20000,
        service_fee: Number(editRoomForm.service_fee) || 150000
      }).eq('id', editingRoomId);
      
      if (error) throw error;
      
      setShowEditRoomModal(false);
      await fetchDashboardData();
    } catch (err) {
      console.error('Error updating room:', err);
      alert('Đã có lỗi khi cập nhật phòng.');
    } finally {
      setSavingRoomEdit(false);
    }
  };

  const searchTenantByPhone = async () => {
    if (!searchPhone.trim()) return;
    setSearchingTenant(true);
    setSearchError('');
    setFoundTenant(null);
    setNewRoomForm(f => ({ ...f, tenant_id: '' }));
    try {
      // Search in profiles table by phone
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, avatar_url, role')
        .eq('phone', searchPhone.trim())
        .single();

      if (error || !profile) {
        setSearchError('Không tìm thấy người dùng với số điện thoại này. Vui lòng kiểm tra lại.');
        return;
      }

      // Check if this tenant already has an active contract (room assigned)
      const { data: activeContract } = await supabase
        .from('contracts')
        .select('id, rooms(title)')
        .eq('tenant_id', profile.id)
        .eq('status', 'active')
        .eq('owner_id', user?.id)
        .single();

      if (activeContract) {
        const roomName = (activeContract as any).rooms?.title || 'một phòng';
        setSearchError(`Người thuê này đã được gán vào "${roomName}". Mỗi số điện thoại chỉ được thuê 1 phòng.`);
        return;
      }

      setFoundTenant(profile);
      setNewRoomForm(f => ({ ...f, tenant_id: profile.id }));
    } catch (err) {
      console.error('Error searching tenant:', err);
      setSearchError('Đã có lỗi xảy ra khi tìm kiếm.');
    } finally {
      setSearchingTenant(false);
    }
  };

  const handleDeleteRoom = (roomId: string, roomTitle: string) => {
    setRoomToDelete({ id: roomId, title: roomTitle });
    setShowDeleteConfirmModal(true);
  };

  const executeDeleteRoom = async () => {
    if (!roomToDelete) return;
    setIsDeletingRoom(true);
    try {
      // Phải xóa các bảng có khóa ngoại trỏ tới room_id trước
      await supabase.from('listings').delete().eq('room_id', roomToDelete.id).eq('owner_id', user?.id);
      await supabase.from('support_requests').delete().eq('room_id', roomToDelete.id);
      await supabase.from('invoices').delete().eq('room_id', roomToDelete.id).eq('owner_id', user?.id);
      await supabase.from('contracts').delete().eq('room_id', roomToDelete.id).eq('owner_id', user?.id);
      
      const { error } = await supabase.from('rooms').delete().eq('id', roomToDelete.id).eq('owner_id', user?.id);
      if (error) throw error;
      
      await fetchDashboardData();
      setShowDeleteConfirmModal(false);
      
      // Hiện Toast Message đẹp
      setDeleteSuccessMessage(`Đã xóa thành công phòng "${roomToDelete.title}".`);
      setTimeout(() => setDeleteSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting room:', err);
      alert('Đã có lỗi khi xoá phòng (Có thể dữ liệu phòng đang bị ràng buộc ở nơi khác).');
    } finally {
      setIsDeletingRoom(false);
      setRoomToDelete(null);
    }
  };
  const handleViewProfile = (tenant: any) => {
    setSelectedTenant(tenant);
    setShowTenantProfile(true);
  };

  const [sendingProfileReminder, setSendingProfileReminder] = useState(false);
  const [profileReminderSent, setProfileReminderSent] = useState(false);

  const handleRequestProfileUpdate = async (tenant: any) => {
    if (!user || !tenant?.id) return;
    setSendingProfileReminder(true);
    try {
      // Detect which fields are missing
      const missingFields: string[] = [];
      if (!tenant.id_card_number) missingFields.push('Số CCCD/CMND');
      if (!tenant.permanent_address) missingFields.push('Địa chỉ thường trú');
      if (!tenant.birth_date) missingFields.push('Ngày sinh');
      if (!tenant.emergency_contact_name) missingFields.push('Tên người thân khẩn cấp');
      if (!tenant.emergency_contact_phone) missingFields.push('SĐT người thân khẩn cấp');

      const missingText = missingFields.length > 0
        ? `Thông tin còn thiếu: ${missingFields.join(', ')}.`
        : 'Vui lòng cập nhật đầy đủ thông tin hồ sơ.';

      const { error } = await supabase.from('notifications').insert({
        sender_id: user.id,
        receiver_id: tenant.id,
        type: 'profile_update_request',
        title: 'Yêu cầu cập nhật thông tin cá nhân',
        message: `Chủ trọ yêu cầu bạn bổ sung hồ sơ để hoàn tất thủ tục thuê phòng. ${missingText} Vui lòng vào mục Tài khoản để cập nhật.`,
        action_url: 'tenant?tab=account'
      });

      if (!error) {
        setProfileReminderSent(true);
        setTimeout(() => setProfileReminderSent(false), 4000);
      }
    } catch (err) {
      console.error('Error sending profile reminder:', err);
    } finally {
      setSendingProfileReminder(false);
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
    { id: 'support', label: 'Yêu cầu hỗ trợ', icon: Wrench, badge: supportRequestsData.filter(r => r.status === 'pending').length || undefined },
    { id: 'listings', label: 'Bài đăng', icon: ImageIcon },
    { id: 'messages', label: 'Tin nhắn', icon: MessageSquare },
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
    { label: 'Thêm phòng mới', icon: Plus },
    { label: 'Lập hợp đồng', icon: FileText },
    { label: 'Xuất hóa đơn', icon: Wallet },
    { label: 'Quản lý người ở', icon: User },
  ];

  const rooms = roomsData.map(r => {
    const activeContract = contractsData.find(c => c.room_id === r.id && c.status === 'active');
    let profileName = null;
    let tenantPhone = null;
    let tenantAvatar = null;
    let contractStart = null;
    let contractEnd = null;
    let contractDeposit = null;

    if (activeContract) {
      const profile = Array.isArray(activeContract.profiles) ? activeContract.profiles[0] : activeContract.profiles;
      if (profile) {
        profileName = profile.full_name;
        tenantPhone = profile.phone;
        tenantAvatar = profile.avatar_url;
      }
      contractStart = activeContract.start_date;
      contractEnd = activeContract.end_date;
      contractDeposit = activeContract.deposit;
    }

    return {
      id: r.id,
      title: r.title,
      price: `${Number(r.price).toLocaleString()}đ`,
      type: r.type || 'Phòng trọ',
      area: `${r.area} m²`,
      tenant: profileName,
      tenantPhone,
      tenantAvatar,
      contractStart,
      contractEnd,
      contractDeposit,
      status: r.status,
      statusLabel: r.status === 'occupied' ? 'Đang thuê' : r.status === 'repairing' ? 'Đang sửa' : r.status === 'pending' ? 'Chờ ký' : 'Trống',
      statusColor: r.status === 'occupied' ? 'bg-green-100 text-green-700' : r.status === 'repairing' ? 'bg-amber-100 text-amber-700' : r.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-orange-100 text-orange-700',
      image: r.image_url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=400',
      note: r.note,
      electricity_price: r.electricity_price,
      water_price: r.water_price,
      service_fee: r.service_fee
    };
  });

  const filteredRooms = roomFilter === 'all' ? rooms : rooms.filter(r => r.status === roomFilter);

  const contracts = contractsData.map(c => ({
    id: c.id,
    tenant: c.profiles?.full_name || 'N/A',
    initials: (c.profiles?.full_name || 'NA').split(' ').map((n: any) => n[0]).join('').toUpperCase().slice(0, 2),
    room: c.rooms?.title || 'N/A',
    period: `${new Date(c.start_date).toLocaleDateString('vi-VN')} - ${new Date(c.end_date).toLocaleDateString('vi-VN')}`,
    deposit: `${Number(c.deposit).toLocaleString()}đ`,
    status: c.status,
    statusLabel: c.status === 'active' ? 'Đang hiệu lực' : c.status === 'pending' ? 'Chờ ký' : c.status === 'expired' ? 'Đã hết hạn' : 'Đã chấm dứt',
    statusColor: c.status === 'active' ? 'bg-green-100 text-green-700' : c.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600',
    profiles: c.profiles
  }));

  const activeTenantsMap = new Map();
  contractsData.forEach(c => {
    if (c.status === 'active' && c.profiles) {
      if (!activeTenantsMap.has(c.tenant_id)) {
        const p = c.profiles;
        activeTenantsMap.set(c.tenant_id, {
          id: c.tenant_id,
          name: p.full_name || 'Người thuê',
          phone: p.phone,
          avatar: p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name || 'U')}&background=random`,
          room: c.rooms?.title || 'Chưa thuê',
          gender: p.gender,
          birth_date: p.birth_date,
          permanent_address: p.permanent_address,
          id_card_number: p.id_card_number,
          id_card_date: p.id_card_date,
          id_card_place: p.id_card_place,
          zalo_phone: p.zalo_phone,
          bank_name: p.bank_name,
          bank_account_number: p.bank_account_number,
          bank_account_name: p.bank_account_name,
          emergency_contact_name: p.emergency_contact_name,
          emergency_contact_phone: p.emergency_contact_phone,
          // Contract info
          contract_start: c.start_date,
          contract_end: c.end_date,
          deposit: c.deposit,
          contract_id: c.id
        });
      }
    }
  });
  const tenants = Array.from(activeTenantsMap.values());

  const invoices = invoicesData.map(inv => ({
    id: inv.id,
    tenant: inv.profiles?.full_name || 'N/A',
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
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-semibold text-sm ${
                    activeTab === item.id 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  ) : null}
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
                <button onClick={openAddRoomModal} className="bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-100">
                  <Plus className="w-5 h-5" />
                  Thêm phòng mới
                </button>
              </div>

              {roomsData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 mt-4">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 shadow-sm">
                    <Home className="w-12 h-12 opacity-80" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-3 font-display">Bạn chưa có phòng nào!</h3>
                  <p className="text-slate-500 max-w-md mb-8 font-medium">Chào mừng bạn đến với hệ thống quản lý. Hãy bắt đầu bằng việc tạo căn phòng đầu tiên cho khu trọ của bạn nhé.</p>
                  <button onClick={openAddRoomModal} className="bg-primary text-white font-black uppercase tracking-widest text-sm px-8 py-4 rounded-xl hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-100 hover:-translate-y-1">
                    <Plus className="w-5 h-5" />
                    Thêm phòng đầu tiên
                  </button>
                </div>
              ) : (
                <>
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

                  {/* Rooms Grid Compact */}
                  {filteredRooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                        <Search className="w-8 h-8 opacity-80" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">Không tìm thấy phòng nào</h3>
                      <p className="text-slate-500 max-w-sm">Không có phòng nào khớp với bộ lọc "<b>{roomFilter === 'empty' ? 'Trống' : roomFilter === 'occupied' ? 'Đang thuê' : 'Đang sửa'}</b>".</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-2">
                      {filteredRooms.map((room) => (
                        <motion.div 
                          key={room.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={() => {
                            setSelectedRoom(room);
                            setShowRoomDetailModal(true);
                          }}
                          className={`group cursor-pointer bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col`}
                        >
                          <div className="aspect-[4/3] relative overflow-hidden bg-slate-100 shrink-0">
                            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                              <span className={`text-[9px] font-black px-2 py-1.5 rounded-lg uppercase tracking-widest shadow-sm ${room.statusColor.split(' ').slice(0, 2).join(' ')}`}>
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
                          <div className="p-4 flex-1 flex flex-col justify-center bg-white relative z-20">
                            <h3 className="text-sm font-black text-slate-900 font-display truncate mb-1 group-hover:text-primary transition-colors">{room.title}</h3>
                            <p className="text-primary font-black text-sm">{room.price}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}
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
              </div>

              {tenants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6">
                    <Users className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có người thuê</h3>
                  <p className="text-slate-500 max-w-sm mb-6">Người thuê sẽ xuất hiện khi bạn tạo Hợp đồng thuê phòng đang có hiệu lực.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {tenants.map((tenant) => {
                    const daysLeft = tenant.contract_end ? Math.max(0, Math.ceil((new Date(tenant.contract_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : null;
                    const isExpiringSoon = daysLeft !== null && daysLeft <= 30 && daysLeft > 0;
                    return (
                    <motion.div key={tenant.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all group overflow-hidden">
                      {/* Card Header with Avatar */}
                      <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-6 pb-10">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl flex-shrink-0">
                            <img src={tenant.avatar} alt={tenant.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-black text-white font-display truncate text-lg">{tenant.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-black text-primary bg-primary/20 px-2 py-0.5 rounded-full uppercase tracking-widest">{tenant.room}</span>
                              {isExpiringSoon && <span className="text-[10px] font-black text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded-full uppercase">Sắp hết HĐ</span>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Info Rows */}
                      <div className="px-6 pt-4 pb-2 -mt-4 bg-white rounded-t-3xl relative space-y-2.5">
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="w-4 h-4 text-slate-300 flex-shrink-0" />
                          <span className="font-bold text-slate-700">{tenant.phone || <span className="text-slate-400">Chưa có SĐT</span>}</span>
                        </div>
                        {tenant.id_card_number && (
                          <div className="flex items-center gap-3 text-sm">
                            <BadgeCheck className="w-4 h-4 text-slate-300 flex-shrink-0" />
                            <span className="font-bold text-slate-700">{tenant.id_card_number}</span>
                          </div>
                        )}
                        {tenant.permanent_address && (
                          <div className="flex items-start gap-3 text-sm">
                            <MapPin className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
                            <span className="font-bold text-slate-700 line-clamp-2">{tenant.permanent_address}</span>
                          </div>
                        )}
                        {tenant.contract_end && (
                          <div className="flex items-center gap-3 text-sm">
                            <Calendar className="w-4 h-4 text-slate-300 flex-shrink-0" />
                            <span className={`font-bold ${isExpiringSoon ? 'text-orange-600' : 'text-slate-700'}`}>
                              HĐ đến {new Date(tenant.contract_end).toLocaleDateString('vi-VN')}
                              {daysLeft !== null && <span className="text-slate-400 font-medium"> ({daysLeft > 0 ? `còn ${daysLeft} ngày` : 'đã hết hạn'})</span>}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 px-6 pb-6 pt-4">
                        <button
                          onClick={() => handleViewProfile(tenant)}
                          className="flex-1 py-2.5 rounded-xl bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />Hồ sơ đầy đủ
                        </button>
                        <button
                          onClick={() => { setActiveTab('messages'); }}
                          className="flex-1 py-2.5 rounded-xl bg-primary/10 text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />Nhắn tin
                        </button>
                      </div>
                    </motion.div>
                  )})}
                </div>
              )}
            </motion.div>
          )}

          {/* Tenant Profile Modal */}
          <AnimatePresence>
          {showTenantProfile && selectedTenant && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowTenantProfile(false)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-8 flex-shrink-0">
                  <button onClick={() => setShowTenantProfile(false)} className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl flex-shrink-0">
                      <img src={selectedTenant.avatar} alt={selectedTenant.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white font-display">{selectedTenant.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-black text-primary bg-primary/20 px-3 py-1 rounded-full uppercase tracking-widest">{selectedTenant.room}</span>
                        {selectedTenant.gender && <span className="text-[10px] font-bold text-white/60 bg-white/10 px-3 py-1 rounded-full">{selectedTenant.gender}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="overflow-y-auto flex-1 p-8 space-y-6">

                  {/* Profile Completeness Warning */}
                  {(() => {
                    const missingFields: string[] = [];
                    if (!selectedTenant.id_card_number) missingFields.push('Số CCCD/CMND');
                    if (!selectedTenant.permanent_address) missingFields.push('Địa chỉ thường trú');
                    if (!selectedTenant.birth_date) missingFields.push('Ngày sinh');
                    if (!selectedTenant.emergency_contact_name) missingFields.push('Liên hệ khẩn cấp');
                    if (missingFields.length === 0) return null;
                    return (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-black text-amber-800 text-sm mb-1">Hồ sơ chưa đầy đủ</p>
                            <p className="text-amber-700 text-xs font-medium">Thiếu: <span className="font-bold">{missingFields.join(', ')}</span></p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Section: Liên hệ */}
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Phone className="w-3.5 h-3.5" />Thông tin liên hệ</p>
                    <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Số điện thoại</span>
                        <span className="font-bold text-slate-900">{selectedTenant.phone || <span className="text-slate-400">Chưa có</span>}</span>
                      </div>
                      {selectedTenant.zalo_phone && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500 font-medium">Zalo</span>
                          <span className="font-bold text-slate-900">{selectedTenant.zalo_phone}</span>
                        </div>
                      )}
                      {selectedTenant.permanent_address && (
                        <div className="flex justify-between text-sm gap-4">
                          <span className="text-slate-500 font-medium flex-shrink-0">Địa chỉ thường trú</span>
                          <span className="font-bold text-slate-900 text-right">{selectedTenant.permanent_address}</span>
                        </div>
                      )}
                      {selectedTenant.birth_date && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500 font-medium">Ngày sinh</span>
                          <span className="font-bold text-slate-900">{new Date(selectedTenant.birth_date).toLocaleDateString('vi-VN')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section: CCCD */}
                  {(selectedTenant.id_card_number || selectedTenant.id_card_date || selectedTenant.id_card_place) && (
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><BadgeCheck className="w-3.5 h-3.5" />Định danh pháp lý (CCCD/CMND)</p>
                      <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                        {selectedTenant.id_card_number && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-medium">Số CCCD</span>
                            <span className="font-bold text-slate-900 font-mono">{selectedTenant.id_card_number}</span>
                          </div>
                        )}
                        {selectedTenant.id_card_date && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-medium">Ngày cấp</span>
                            <span className="font-bold text-slate-900">{new Date(selectedTenant.id_card_date).toLocaleDateString('vi-VN')}</span>
                          </div>
                        )}
                        {selectedTenant.id_card_place && (
                          <div className="flex justify-between text-sm gap-4">
                            <span className="text-slate-500 font-medium flex-shrink-0">Nơi cấp</span>
                            <span className="font-bold text-slate-900 text-right">{selectedTenant.id_card_place}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Section: Liên hệ khẩn cấp */}
                  {(selectedTenant.emergency_contact_name || selectedTenant.emergency_contact_phone) && (
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><PhoneCall className="w-3.5 h-3.5" />Liên hệ khẩn cấp</p>
                      <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                        {selectedTenant.emergency_contact_name && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-medium">Người thân</span>
                            <span className="font-bold text-slate-900">{selectedTenant.emergency_contact_name}</span>
                          </div>
                        )}
                        {selectedTenant.emergency_contact_phone && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-medium">SĐT liên hệ</span>
                            <a href={`tel:${selectedTenant.emergency_contact_phone}`} className="font-bold text-primary hover:underline">{selectedTenant.emergency_contact_phone}</a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Section: Hợp đồng */}
                  {selectedTenant.contract_start && (
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><FileText className="w-3.5 h-3.5" />Thông tin Hợp đồng</p>
                      <div className="bg-primary/5 rounded-2xl p-4 space-y-3 border border-primary/10">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500 font-medium">Thời hạn</span>
                          <span className="font-bold text-slate-900">{new Date(selectedTenant.contract_start).toLocaleDateString('vi-VN')} → {new Date(selectedTenant.contract_end).toLocaleDateString('vi-VN')}</span>
                        </div>
                        {selectedTenant.deposit > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-medium">Tiền cọc</span>
                            <span className="font-black text-primary">{Number(selectedTenant.deposit).toLocaleString()}đ</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Section: Ngân hàng */}
                  {(selectedTenant.bank_name || selectedTenant.bank_account_number) && (
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Wallet className="w-3.5 h-3.5" />Thông tin ngân hàng</p>
                      <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                        {selectedTenant.bank_name && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-medium">Ngân hàng</span>
                            <span className="font-bold text-slate-900">{selectedTenant.bank_name}</span>
                          </div>
                        )}
                        {selectedTenant.bank_account_number && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-medium">Số tài khoản</span>
                            <span className="font-bold text-slate-900 font-mono">{selectedTenant.bank_account_number}</span>
                          </div>
                        )}
                        {selectedTenant.bank_account_name && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500 font-medium">Chủ tài khoản</span>
                            <span className="font-bold text-slate-900">{selectedTenant.bank_account_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>

                {/* Modal Footer */}
                <div className="border-t border-slate-100 p-6 space-y-3 flex-shrink-0">
                  {/* Nhắc điền hồ sơ - chỉ hiện nếu thiếu thông tin */}
                  {(!selectedTenant.id_card_number || !selectedTenant.permanent_address || !selectedTenant.birth_date || !selectedTenant.emergency_contact_name) && (
                    <button
                      onClick={() => handleRequestProfileUpdate(selectedTenant)}
                      disabled={sendingProfileReminder || profileReminderSent}
                      className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                        profileReminderSent
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                      } disabled:opacity-60`}
                    >
                      {profileReminderSent ? (
                        <><CheckCircle className="w-4 h-4" /><span>Đã gửi nhắc nhở!</span></>
                      ) : sendingProfileReminder ? (
                        <><div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /><span>Đang gửi...</span></>
                      ) : (
                        <><AlertCircle className="w-4 h-4" /><span>Nhắc người thuê bổ sung hồ sơ</span></>
                      )}
                    </button>
                  )}
                  <div className="flex gap-3">
                    {selectedTenant.phone && (
                      <a href={`tel:${selectedTenant.phone}`} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                        <Phone className="w-4 h-4" />Gọi điện
                      </a>
                    )}
                    <button onClick={() => { setShowTenantProfile(false); setActiveTab('messages'); }} className="flex-1 py-3 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                      <MessageSquare className="w-4 h-4" />Nhắn tin
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
          </AnimatePresence>



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
                  onClick={() => setShowAddListingModal(true)}
                  className="bg-primary text-white font-black uppercase tracking-widest text-xs py-4 px-8 rounded-2xl hover:bg-primary-hover transition-all shadow-lg shadow-orange-100 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Tạo bài đăng mới
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {listingsData.map((listing) => (
                  <div key={listing.id} className="bg-white rounded-[32px] overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                    <div className="relative aspect-video overflow-hidden">
                      <img 
                        src={listing.image_url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=400'} 
                        alt={listing.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg ${listing.is_active ? 'bg-green-500 text-white' : 'bg-slate-500 text-white'}`}>
                        {listing.is_active ? 'Đang hiển thị' : 'Tạm ẩn'}
                      </div>
                    </div>
                    <div className="p-8">
                      <h3 className="text-lg font-black text-slate-900 font-display mb-2 group-hover:text-primary transition-colors">{listing.title}</h3>
                      <p className="text-slate-500 text-sm font-medium mb-6 line-clamp-2">{listing.description}</p>
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
                ))}
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
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Người thân</th>
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
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-900">{contract.profiles?.emergency_contact_phone || '---'}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{contract.profiles?.emergency_contact_name || 'Chưa cập nhật'}</span>
                            </div>
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

          {activeTab === 'support' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 max-w-5xl"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 font-display">Yêu cầu hỗ trợ</h2>
                  <p className="text-slate-500">Tiếp nhận và xử lý sự cố từ người thuê</p>
                </div>
              </div>

              {supportRequestsData.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                    <Wrench className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có yêu cầu nào</h3>
                  <p className="text-slate-500 max-w-sm">Mọi thứ đang hoạt động tốt. Các yêu cầu sửa chữa từ người thuê sẽ hiện tại đây.</p>
                </div>
              ) : (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 overflow-hidden flex flex-col gap-4">
                  {supportRequestsData.map(req => {
                    const statusText = req.status === 'pending' ? 'Chờ xử lý' : req.status === 'processing' ? 'Đang sửa' : 'Hoàn thành';
                    const statusColor = req.status === 'pending' ? 'bg-orange-100 text-orange-700' : req.status === 'processing' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';
                    const Icon = req.status === 'pending' ? Clock : req.status === 'processing' ? Wrench : CheckCircle;
                    const date = new Date(req.created_at).toLocaleDateString('vi-VN');

                    return (
                      <div key={req.id} className="p-6 rounded-3xl border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                        <div className="flex items-start gap-4 flex-1">
                          <img 
                            src={req.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'} 
                            alt={req.profiles?.full_name || 'Người thuê'} 
                            className="w-12 h-12 rounded-full object-cover shrink-0" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="space-y-1">
                            <h4 className="font-black text-lg text-slate-900 group-hover:text-primary transition-colors">{req.title}</h4>
                            <p className="text-sm text-slate-500">{req.description}</p>
                            <div className="flex items-center gap-3 pt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {req.profiles?.full_name || 'Người thuê'}</span>
                              <span className="flex items-center gap-1"><HomeIcon className="w-3.5 h-3.5" /> {req.rooms?.title}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {date}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3 shrink-0">
                          <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1.5 ${statusColor}`}>
                            <Icon className="w-4 h-4" /> {statusText}
                          </span>
                          
                          {req.status !== 'resolved' && (
                            <div className="flex gap-2">
                              {req.status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateSupportRequest(req.id, 'processing')}
                                  className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs hover:bg-blue-600 hover:text-white transition-all"
                                >
                                  Tiếp nhận
                                </button>
                              )}
                              <button
                                onClick={() => handleUpdateSupportRequest(req.id, 'resolved')}
                                className="px-4 py-2 rounded-xl bg-green-50 text-green-600 font-bold text-xs hover:bg-green-600 hover:text-white transition-all"
                              >
                                Đã giải quyết
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'messages' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-1 overflow-hidden h-[calc(100vh-64px)] rounded-2xl border border-slate-200 shadow-sm"
            >
              <Messaging user={user} role="landlord" />
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
              setProfileSaveMsg(error ? 'Đã xảy ra lỗi, vui lòng thử lại!' : 'Lưu thành công!');
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
                      <h2 className="text-3xl font-black text-slate-900 font-display">{profileForm.full_name || user?.user_metadata?.full_name || 'Chưa cập nhật tên'}</h2>
                      <span className="bg-orange-100 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1"><BadgeCheck className="w-3 h-3" />Chủ trọ</span>
                    </div>
                    <p className="text-slate-500 font-bold text-sm mb-4">{user?.email}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                       <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 px-3 py-2 rounded-xl"><HomeIcon className="w-4 h-4" /> {roomsData.length} Phòng</div>
                       <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 px-3 py-2 rounded-xl"><Users className="w-4 h-4" /> {contractsData.length} Hợp đồng</div>
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
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600"><BadgeCheck className="w-5 h-5" /></div>
                          <div><h3 className="font-black text-slate-900 font-display">Định danh pháp lý</h3><p className="text-xs text-slate-400 font-medium">Bắt buộc để ký hợp đồng điện tử</p></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <InputField label="Số CCCD / CMND" icon={BadgeCheck} field="id_card_number" placeholder="012345678901" value={profileForm.id_card_number} onChange={v => updateProfileField('id_card_number', v)} />
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
                           <InputField label="Ngân hàng" icon={Shield} field="bank_name" placeholder="Vietcombank..." value={profileForm.bank_name} onChange={v => updateProfileField('bank_name', v)} />
                           <InputField label="Số tài khoản" icon={LockIcon} field="bank_account_number" placeholder="123456..." value={profileForm.bank_account_number} onChange={v => updateProfileField('bank_account_number', v)} />
                           <div className="md:col-span-2"><InputField label="Chủ tài khoản" icon={User} field="bank_account_name" placeholder="NGUYEN VAN A" value={profileForm.bank_account_name} onChange={v => updateProfileField('bank_account_name', v)} /></div>
                           <InputField label="Số Zalo" icon={Phone} field="zalo_phone" placeholder="0901..." value={profileForm.zalo_phone} onChange={v => updateProfileField('zalo_phone', v)} />
                           <InputField label="Người thân khẩn cấp" icon={Users} field="emergency_contact_name" placeholder="Tên người thân" value={profileForm.emergency_contact_name} onChange={v => updateProfileField('emergency_contact_name', v)} />
                           <div className="md:col-span-2">
                             <InputField label="SĐT người thân khẩn cấp" icon={PhoneCall} field="emergency_contact_phone" type="tel" placeholder="0901..." value={profileForm.emergency_contact_phone} onChange={v => updateProfileField('emergency_contact_phone', v)} />
                           </div>
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

          {activeTab !== 'overview' && activeTab !== 'rooms' && activeTab !== 'contracts' && activeTab !== 'messages' && activeTab !== 'account' && activeTab !== 'tenants' && activeTab !== 'invoices' && activeTab !== 'listings' && activeTab !== 'support' && (
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

      {/* Add Room Modal */}
      <AnimatePresence>
        {showAddRoomModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddRoomModal(false)} />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center gap-3">
                  {addRoomStep === 2 && (
                    <button onClick={() => setAddRoomStep(1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-700">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  <div>
                    <h3 className="text-xl font-black text-slate-900 font-display">
                      {addRoomStep === 1 ? 'Thêm phòng mới' : 'Thông tin phòng'}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mt-1">
                      {addRoomStep === 1 ? 'Chọn từ bài đăng hoặc nhập thủ công' : 'Xác nhận và chỉnh sửa thông tin trước khi tạo'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowAddRoomModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step Indicator */}
              <div className="px-8 py-4 flex items-center gap-3">
                <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${addRoomStep >= 1 ? 'text-primary' : 'text-slate-300'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] ${addRoomStep >= 1 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>1</div>
                  Chọn nguồn
                </div>
                <div className={`flex-1 h-0.5 rounded ${addRoomStep >= 2 ? 'bg-primary' : 'bg-slate-100'}`} />
                <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${addRoomStep >= 2 ? 'text-primary' : 'text-slate-300'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] ${addRoomStep >= 2 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>2</div>
                  Xác nhận
                </div>
              </div>

              {/* Modal Content */}
              <div className="px-8 py-4 overflow-y-auto flex-1">
                {addRoomStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col gap-4"
                  >
                    {/* Manual Entry Option */}
                    <button
                      onClick={skipToManualEntry}
                      className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 transition-all group text-left"
                    >
                      <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center flex-shrink-0 transition-colors">
                        <Edit3 className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <p className="font-black text-slate-700 group-hover:text-primary transition-colors">Nhập thủ công</p>
                        <p className="text-xs font-bold text-slate-400 mt-0.5">Tạo phòng mới với thông tin tùy chỉnh</p>
                      </div>
                    </button>

                    {/* Listings to Import */}
                    {listingsData.length > 0 && (
                      <>
                        <div className="flex items-center gap-3 mt-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Hoặc chọn từ bài đăng của bạn</span>
                        </div>
                        <div className="flex flex-col gap-3">
                          {listingsData.map((listing) => {
                            // Đếm số phòng đã tạo từ listing này (cho phép tạo nhiều)
                            const roomCount = roomsData.filter(r => r.title?.startsWith(listing.title?.split(' - ')[0])).length;
                            return (
                              <button
                                key={listing.id}
                                onClick={() => selectListingForRoom(listing)}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:border-primary hover:shadow-md hover:bg-primary/5 group transition-all text-left"
                              >
                                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100">
                                  <img 
                                    src={listing.image_url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=200'}
                                    alt={listing.title}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-slate-900 truncate group-hover:text-primary transition-colors">{listing.title}</p>
                                  <p className="text-sm font-black text-primary mt-0.5">{Number(listing.price).toLocaleString()}đ</p>
                                  <div className="flex items-center gap-3 mt-1">
                                    {listing.area && <span className="text-[10px] font-bold text-slate-400">{listing.area}m²</span>}
                                    {listing.type && <span className="text-[10px] font-bold text-slate-400">• {listing.type}</span>}
                                    {listing.location && <span className="text-[10px] font-bold text-slate-400">• {listing.location}</span>}
                                  </div>
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-2">
                                  {roomCount > 0 && (
                                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{roomCount} phòng</span>
                                  )}
                                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {listingsData.length === 0 && (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ImageIcon className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-400">Bạn chưa có bài đăng nào</p>
                        <p className="text-xs text-slate-300 mt-1">Hãy nhập thủ công ở trên để tạo phòng</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {addRoomStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col gap-5"
                  >
                    {selectedListingId && (
                      <div className="flex items-center gap-2 px-4 py-3 bg-green-50 rounded-xl text-green-700 text-xs font-bold">
                        <Sparkles className="w-4 h-4" />
                        Thông tin đã được điền tự động từ bài đăng
                      </div>
                    )}

                    {/* Image Preview */}
                    {newRoomForm.image_url && (
                      <div className="w-full h-48 rounded-2xl overflow-hidden border border-slate-100">
                        <img src={newRoomForm.image_url} alt="Room" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Title */}
                      <div className="md:col-span-2 flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên phòng *</label>
                        <input
                          type="text"
                          value={newRoomForm.title}
                          onChange={e => setNewRoomForm(f => ({ ...f, title: e.target.value }))}
                          placeholder="VD: Phòng 101, Phòng A1..."
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none"
                        />
                      </div>

                      {/* Price */}
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giá thuê (VNĐ) *</label>
                        <input
                          type="number"
                          value={newRoomForm.price}
                          onChange={e => setNewRoomForm(f => ({ ...f, price: e.target.value }))}
                          placeholder="VD: 3000000"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none"
                        />
                      </div>

                      {/* Area */}
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Diện tích (m²)</label>
                        <input
                          type="number"
                          value={newRoomForm.area}
                          onChange={e => setNewRoomForm(f => ({ ...f, area: e.target.value }))}
                          placeholder="VD: 25"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none"
                        />
                      </div>

                      {/* Type */}
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Loại phòng</label>
                        <select
                          value={newRoomForm.type}
                          onChange={e => setNewRoomForm(f => ({ ...f, type: e.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none appearance-none"
                        >
                          <option value="Phòng trọ">Phòng trọ</option>
                          <option value="Chung cư mini">Chung cư mini</option>
                          <option value="Căn hộ">Căn hộ</option>
                          <option value="Nhà nguyên căn">Nhà nguyên căn</option>
                          <option value="Ký túc xá">Ký túc xá</option>
                        </select>
                      </div>

                      {/* Utilities */}
                      <div className="md:col-span-2 pt-4 border-t border-slate-100 mt-2">
                        <div className="flex items-center gap-2 mb-4">
                          <Zap className="w-5 h-5 text-primary" />
                          <h4 className="font-black text-slate-900">Chi phí phụ & Phân tích rủi ro</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giá điện (đ/kwh)</label>
                            <div className="relative">
                              <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500" />
                              <input
                                type="number"
                                value={newRoomForm.electricity_price}
                                onChange={e => setNewRoomForm(f => ({ ...f, electricity_price: Number(e.target.value) }))}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 pl-11 transition-all outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giá nước (đ/khối)</label>
                            <div className="relative">
                              <Droplets className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                              <input
                                type="number"
                                value={newRoomForm.water_price}
                                onChange={e => setNewRoomForm(f => ({ ...f, water_price: Number(e.target.value) }))}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 pl-11 transition-all outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phí dịch vụ (đ/tháng)</label>
                            <div className="relative">
                              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                              <input
                                type="number"
                                value={newRoomForm.service_fee}
                                onChange={e => setNewRoomForm(f => ({ ...f, service_fee: Number(e.target.value) }))}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 pl-11 transition-all outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>


                      {/* Status */}
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trạng thái</label>
                        <select
                          value={newRoomForm.status}
                          onChange={e => setNewRoomForm(f => ({ ...f, status: e.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none appearance-none"
                        >
                          <option value="empty">Trống</option>
                          <option value="occupied">Đang thuê</option>
                          <option value="repairing">Đang sửa chữa</option>
                        </select>
                      </div>

                      {/* Tenant Search by Phone - Optional */}
                      <div className="md:col-span-2 flex flex-col gap-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tìm người thuê bằng SĐT (Tùy chọn nếu phòng đã có người)</label>
                        <div className="flex gap-3">
                          <div className="relative flex-1">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="tel"
                              value={searchPhone}
                              onChange={e => { setSearchPhone(e.target.value); setSearchError(''); }}
                              onKeyDown={e => e.key === 'Enter' && searchTenantByPhone()}
                              placeholder="VD: 0901234567"
                              className={`w-full rounded-2xl border bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 pl-12 transition-all outline-none ${
                                searchError ? 'border-red-300' : foundTenant ? 'border-green-300' : 'border-slate-200'
                              }`}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={searchTenantByPhone}
                            disabled={searchingTenant || !searchPhone.trim()}
                            className="px-6 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {searchingTenant ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Search className="w-4 h-4" />
                            )}
                            Tìm
                          </button>
                        </div>

                        {/* Search Error */}
                        {searchError && (
                          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 rounded-xl text-red-600 text-xs font-bold border border-red-100">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {searchError}
                          </div>
                        )}

                        {/* Found Tenant */}
                        {foundTenant && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col gap-4 mt-2"
                          >
                            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-2xl border border-green-200">
                              <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-green-200 flex-shrink-0">
                                <img
                                  src={foundTenant.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(foundTenant.full_name || 'U')}&background=random`}
                                  alt={foundTenant.full_name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-slate-900 truncate">{foundTenant.full_name || 'Người dùng'}</p>
                                <p className="text-xs font-bold text-slate-500">{foundTenant.phone}</p>
                                {foundTenant.role && (
                                  <span className="text-[10px] font-black text-green-700 bg-green-100 px-2 py-0.5 rounded-full uppercase tracking-widest mt-1 inline-block">
                                    {foundTenant.role === 'tenant' ? 'Người thuê' : foundTenant.role === 'landlord' ? 'Chủ trọ' : foundTenant.role}
                                  </span>
                                )}
                              </div>
                              <div className="flex-shrink-0">
                                <CheckCircle className="w-6 h-6 text-green-500" />
                              </div>
                            </div>

                            {/* New Contract Settings for Found Tenant */}
                            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 mt-2 space-y-4">
                              <div className="flex items-center gap-2 mb-2 text-slate-700">
                                <FileText className="w-5 h-5 text-primary" />
                                <h4 className="font-black text-sm uppercase tracking-widest">Thiết lập Hợp Đồng Nhanh</h4>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2 sm:col-span-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiền cọc (VNĐ)</label>
                                  <div className="relative">
                                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                      type="number"
                                      value={newRoomForm.tenant_deposit}
                                      onChange={e => setNewRoomForm(f => ({ ...f, tenant_deposit: e.target.value }))}
                                      placeholder="VD: 3000000"
                                      className="w-full rounded-2xl border border-slate-200 bg-white font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 pl-11 transition-all outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ngày bắt đầu</label>
                                  <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                      type="date"
                                      value={newRoomForm.tenant_start_date}
                                      onChange={e => setNewRoomForm(f => ({ ...f, tenant_start_date: e.target.value }))}
                                      className="w-full rounded-2xl border border-slate-200 bg-white font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 pl-11 transition-all outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ngày kết thúc</label>
                                  <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                      type="date"
                                      value={newRoomForm.tenant_end_date}
                                      onChange={e => setNewRoomForm(f => ({ ...f, tenant_end_date: e.target.value }))}
                                      className="w-full rounded-2xl border border-slate-200 bg-white font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 pl-11 transition-all outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Image URL */}
                      <div className="md:col-span-2 flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL Hình ảnh</label>
                        <input
                          type="url"
                          value={newRoomForm.image_url}
                          onChange={e => setNewRoomForm(f => ({ ...f, image_url: e.target.value }))}
                          placeholder="https://..."
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none"
                        />
                      </div>

                      {/* Note */}
                      <div className="md:col-span-2 flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ghi chú</label>
                        <textarea
                          value={newRoomForm.note}
                          onChange={e => setNewRoomForm(f => ({ ...f, note: e.target.value }))}
                          placeholder="Ghi chú thêm về phòng (tùy chọn)"
                          rows={3}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none resize-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Modal Footer */}
              {addRoomStep === 2 && (
                <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <button
                    onClick={() => setShowAddRoomModal(false)}
                    className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleAddRoom}
                    disabled={addingRoom || !newRoomForm.title || !newRoomForm.price}
                    className="bg-primary text-white font-black uppercase tracking-widest text-xs py-4 px-8 rounded-2xl hover:bg-primary-hover transition-all shadow-lg shadow-orange-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingRoom ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Tạo phòng
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Room Modal */}
      <AnimatePresence>
        {showEditRoomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditRoomModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-black text-slate-900 font-display">
                    Chỉnh sửa phòng
                  </h3>
                  <p className="text-xs font-bold text-slate-400 mt-1">
                    Cập nhật thông tin, giá thuê và chi phí phụ
                  </p>
                </div>
                <button onClick={() => setShowEditRoomModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <div className="px-8 py-6 overflow-y-auto flex-1">
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Title */}
                    <div className="md:col-span-2 flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên phòng *</label>
                      <input
                        type="text"
                        value={editRoomForm.title}
                        onChange={e => setEditRoomForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none"
                      />
                    </div>

                    {/* Price */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giá thuê (VNĐ) *</label>
                      <input
                        type="number"
                        value={editRoomForm.price}
                        onChange={e => setEditRoomForm(f => ({ ...f, price: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none"
                      />
                    </div>

                    {/* Area */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Diện tích (m²)</label>
                      <input
                        type="number"
                        value={editRoomForm.area}
                        onChange={e => setEditRoomForm(f => ({ ...f, area: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none"
                      />
                    </div>

                    {/* Type */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Loại phòng</label>
                      <select
                        value={editRoomForm.type}
                        onChange={e => setEditRoomForm(f => ({ ...f, type: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none appearance-none"
                      >
                        <option value="Phòng trọ">Phòng trọ</option>
                        <option value="Chung cư mini">Chung cư mini</option>
                        <option value="Căn hộ">Căn hộ</option>
                        <option value="Nhà nguyên căn">Nhà nguyên căn</option>
                        <option value="Ký túc xá">Ký túc xá</option>
                      </select>
                    </div>

                    {/* Status */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trạng thái</label>
                      <select
                        value={editRoomForm.status}
                        onChange={e => setEditRoomForm(f => ({ ...f, status: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none appearance-none"
                      >
                        <option value="empty">Trống</option>
                        <option value="occupied">Đang thuê</option>
                        <option value="repairing">Đang sửa chữa</option>
                      </select>
                    </div>

                    {/* Utilities */}
                    <div className="md:col-span-2 pt-4 border-t border-slate-100 mt-2">
                      <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-5 h-5 text-primary" />
                        <h4 className="font-black text-slate-900">Chi phí phụ & Phân tích rủi ro</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giá điện (đ/kwh)</label>
                          <div className="relative">
                            <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500" />
                            <input
                              type="number"
                              value={editRoomForm.electricity_price}
                              onChange={e => setEditRoomForm(f => ({ ...f, electricity_price: Number(e.target.value) }))}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 pl-11 transition-all outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giá nước (đ/khối)</label>
                          <div className="relative">
                            <Droplets className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                            <input
                              type="number"
                              value={editRoomForm.water_price}
                              onChange={e => setEditRoomForm(f => ({ ...f, water_price: Number(e.target.value) }))}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 pl-11 transition-all outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phí dịch vụ (đ/tháng)</label>
                          <div className="relative">
                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                            <input
                              type="number"
                              value={editRoomForm.service_fee}
                              onChange={e => setEditRoomForm(f => ({ ...f, service_fee: Number(e.target.value) }))}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 pl-11 transition-all outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Image URL */}
                    <div className="md:col-span-2 flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL Hình ảnh</label>
                      <input
                        type="url"
                        value={editRoomForm.image_url}
                        onChange={e => setEditRoomForm(f => ({ ...f, image_url: e.target.value }))}
                        placeholder="https://..."
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none"
                      />
                    </div>

                    {/* Note */}
                    <div className="md:col-span-2 flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ghi chú thêm</label>
                      <textarea
                        value={editRoomForm.note}
                        onChange={e => setEditRoomForm(f => ({ ...f, note: e.target.value }))}
                        placeholder="VD: Phòng mới sửa chữa 2024..."
                        rows={2}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                <button
                  onClick={() => setShowEditRoomModal(false)}
                  className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all bg-slate-200 text-slate-500 hover:bg-slate-300"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveRoomEdit}
                  disabled={savingRoomEdit || !editRoomForm.title || !editRoomForm.price}
                  className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-white hover:bg-primary-hover shadow-lg shadow-orange-100 flex justify-center items-center gap-2"
                >
                  {savingRoomEdit ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Lưu thay đổi'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {/* Add Listing Modal */}
        {showAddListingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddListingModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                <div>
                  <h3 className="text-xl font-black text-slate-900 font-display">Tạo bài đăng mới</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1">Bài đăng chỉ để quảng cáo, không tự tạo phòng quản lý</p>
                </div>
                <button onClick={() => setShowAddListingModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"><X className="w-5 h-5" /></button>
              </div>

              {/* Content */}
              <div className="px-8 py-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Title */}
                  <div className="md:col-span-2 flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiêu đề bài đăng *</label>
                    <input type="text" value={listingForm.title} onChange={e => setListingForm(f => ({ ...f, title: e.target.value }))} placeholder="VD: Phòng trọ cao cấp trung tâm Hải Châu..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none" />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2 flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mô tả chi tiết</label>
                    <textarea value={listingForm.description} onChange={e => setListingForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả phòng trọ, tiện ích, vị trí..." rows={4} className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none resize-none" />
                  </div>

                  {/* Price */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giá thuê (VNĐ/tháng) *</label>
                    <input type="number" value={listingForm.price} onChange={e => setListingForm(f => ({ ...f, price: e.target.value }))} placeholder="3000000" className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none" />
                  </div>

                  {/* Area */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Diện tích (m²)</label>
                    <input type="number" value={listingForm.area} onChange={e => setListingForm(f => ({ ...f, area: e.target.value }))} placeholder="25" className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none" />
                  </div>

                  {/* Type */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Loại phòng</label>
                    <select value={listingForm.type} onChange={e => setListingForm(f => ({ ...f, type: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none appearance-none">
                      <option value="Phòng trọ">Phòng trọ</option>
                      <option value="Chung cư mini">Chung cư mini</option>
                      <option value="Căn hộ">Căn hộ</option>
                      <option value="Căn hộ mini">Căn hộ mini</option>
                      <option value="Nhà nguyên căn">Nhà nguyên căn</option>
                    </select>
                  </div>

                  {/* Deposit */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiền cọc (VNĐ)</label>
                    <input type="number" value={listingForm.deposit} onChange={e => setListingForm(f => ({ ...f, deposit: e.target.value }))} placeholder="Bằng tiền thuê nếu bỏ trống" className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none" />
                  </div>

                  {/* Location */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quận/Huyện</label>
                    <select value={listingForm.location} onChange={e => setListingForm(f => ({ ...f, location: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none appearance-none">
                      <option value="">Chọn quận/huyện...</option>
                      <option value="Hải Châu">Hải Châu</option>
                      <option value="Thanh Khê">Thanh Khê</option>
                      <option value="Sơn Trà">Sơn Trà</option>
                      <option value="Ngũ Hành Sơn">Ngũ Hành Sơn</option>
                      <option value="Liên Chiểu">Liên Chiểu</option>
                      <option value="Cẩm Lệ">Cẩm Lệ</option>
                      <option value="Hòa Vang">Hòa Vang</option>
                    </select>
                  </div>

                  {/* Street */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ đường</label>
                    <input type="text" value={listingForm.street} onChange={e => setListingForm(f => ({ ...f, street: e.target.value }))} placeholder="VD: 45 Trần Phú" className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none" />
                  </div>

                  {/* Image URL */}
                  <div className="md:col-span-2 flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL Hình ảnh</label>
                    <input type="url" value={listingForm.image_url} onChange={e => setListingForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none" />
                    {listingForm.image_url && (
                      <div className="w-full h-40 rounded-2xl overflow-hidden border border-slate-100 mt-1">
                        <img src={listingForm.image_url} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>

                  {/* Utilities */}
                  <div className="md:col-span-2 pt-4 border-t border-slate-100 mt-2">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-5 h-5 text-primary" />
                      <h4 className="font-black text-slate-900">Chi phí phụ</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giá điện (đ/kwh)</label>
                        <input type="number" value={listingForm.electricity_price} onChange={e => setListingForm(f => ({ ...f, electricity_price: Number(e.target.value) }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giá nước (đ/khối)</label>
                        <input type="number" value={listingForm.water_price} onChange={e => setListingForm(f => ({ ...f, water_price: Number(e.target.value) }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phí dịch vụ (đ/tháng)</label>
                        <input type="number" value={listingForm.service_fee} onChange={e => setListingForm(f => ({ ...f, service_fee: Number(e.target.value) }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 p-4 transition-all outline-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                <button onClick={() => setShowAddListingModal(false)} className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all bg-slate-200 text-slate-500 hover:bg-slate-300">Hủy</button>
                <button onClick={handleAddListing} disabled={addingListing || !listingForm.title || !listingForm.price} className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-white hover:bg-primary-hover shadow-lg shadow-orange-100 flex justify-center items-center gap-2">
                  {addingListing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Đăng bài'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Room Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirmModal && roomToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-8 text-center">
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6 relative">
                  <div className="absolute inset-0 bg-red-400/20 rounded-full animate-ping"></div>
                  <AlertCircle className="w-12 h-12 relative z-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 font-display">Xác nhận xóa phòng?</h3>
                <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
                  Bạn sắp xóa vĩnh viễn phòng <strong className="text-slate-900 text-base">"{roomToDelete.title}"</strong>.<br />
                  Hành động này sẽ <strong className="text-red-500">xóa toàn bộ hợp đồng, hóa đơn và bài đăng</strong> liên quan. 
                  Không thể hoàn tác thao tác này!
                </p>
                
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowDeleteConfirmModal(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={executeDeleteRoom}
                    className="flex-1 py-3 rounded-xl font-black text-sm uppercase tracking-widest text-white bg-red-500 hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-100"
                  >
                    Xóa phòng
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Room Detail Modal */}
      <AnimatePresence>
        {showRoomDetailModal && selectedRoom && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
            onClick={() => setShowRoomDetailModal(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-4xl flex flex-col md:flex-row shadow-2xl overflow-hidden max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
                {/* Left side - Cover Image */}
                <div className="md:w-2/5 shrink-0 relative h-64 md:h-auto bg-slate-100">
                  <img src={selectedRoom.image} alt={selectedRoom.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                  <button onClick={() => setShowRoomDetailModal(false)} className="absolute top-4 left-4 p-2 rounded-xl bg-white/20 hover:bg-white/40 backdrop-blur-md text-white md:hidden z-10"><X className="w-5 h-5" /></button>
                  <div className="absolute bottom-6 left-6 right-6 text-white z-10">
                    <span className={`inline-block mb-3 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${selectedRoom.statusColor}`}>
                      {selectedRoom.statusLabel}
                    </span>
                    <h2 className="text-3xl font-black font-display leading-tight shadow-black/50 text-shadow-sm">{selectedRoom.title}</h2>
                  </div>
                </div>

                {/* Right side - Information */}
                <div className="md:w-3/5 flex-1 flex flex-col overflow-y-auto bg-white">
                  {/* Header strip */}
                  <div className="flex justify-between items-center px-6 md:px-8 py-5 border-b border-slate-100 shrink-0">
                    <h3 className="text-xl font-black text-slate-900 font-display">Chi tiết phòng</h3>
                    <button onClick={() => setShowRoomDetailModal(false)} className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hidden md:block"><X className="w-5 h-5" /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 space-y-6">

                    {/* Price + Quick Stats */}
                    <div>
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-3xl font-black text-primary font-display">{selectedRoom.price}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">/ Tháng</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 rounded-2xl p-3">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Loại phòng</p>
                          <p className="font-black text-slate-900 text-sm">{selectedRoom.type}</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-3">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Diện tích</p>
                          <p className="font-black text-slate-900 text-sm">{selectedRoom.area}</p>
                        </div>
                      </div>
                    </div>

                    {/* Utilities */}
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Zap className="w-3.5 h-3.5" />Chi phí dịch vụ</p>
                      <div className="bg-slate-50 rounded-2xl divide-y divide-slate-100">
                        <div className="flex items-center justify-between p-3 text-sm">
                          <div className="flex items-center gap-2 text-slate-600 font-bold"><Zap className="w-4 h-4 text-yellow-500" />Giá điện</div>
                          <span className="font-black text-slate-900">{selectedRoom.electricity_price?.toLocaleString() || '3,500'}đ<span className="text-slate-400 font-normal text-xs"> /kWh</span></span>
                        </div>
                        <div className="flex items-center justify-between p-3 text-sm">
                          <div className="flex items-center gap-2 text-slate-600 font-bold"><Droplets className="w-4 h-4 text-blue-500" />Giá nước</div>
                          <span className="font-black text-slate-900">{selectedRoom.water_price?.toLocaleString() || '20,000'}đ<span className="text-slate-400 font-normal text-xs"> /m³</span></span>
                        </div>
                        <div className="flex items-center justify-between p-3 text-sm">
                          <div className="flex items-center gap-2 text-slate-600 font-bold"><ShieldCheck className="w-4 h-4 text-green-500" />Phí dịch vụ</div>
                          <span className="font-black text-slate-900">{selectedRoom.service_fee?.toLocaleString() || '150,000'}đ<span className="text-slate-400 font-normal text-xs"> /tháng</span></span>
                        </div>
                      </div>
                    </div>

                    {/* Note */}
                    {selectedRoom.note && (
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Info className="w-3.5 h-3.5" />Ghi chú</p>
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                          <p className="text-sm font-medium text-amber-800 leading-relaxed">{selectedRoom.note}</p>
                        </div>
                      </div>
                    )}

                    {/* Tenant / Status Section */}
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Users className="w-3.5 h-3.5" />Tình trạng khai thác</p>

                      {selectedRoom.tenant ? (
                        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-orange-50 to-orange-100/30 overflow-hidden">
                          {/* Tenant Info */}
                          <div className="flex items-center gap-4 p-4">
                            <img
                              src={selectedRoom.tenantAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedRoom.tenant)}&background=random`}
                              alt="avatar"
                              className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-white"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-black text-slate-900 truncate">{selectedRoom.tenant}</p>
                              <p className="text-xs font-bold text-primary mt-0.5">{selectedRoom.tenantPhone || 'Chưa cập nhật SĐT'}</p>
                            </div>
                            <button
                              onClick={() => { setShowRoomDetailModal(false); setActiveTab('contracts'); }}
                              className="text-[10px] font-black px-3 py-2 bg-white text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm uppercase tracking-widest flex-shrink-0"
                            >Hợp đồng</button>
                          </div>

                          {/* Contract Details */}
                          <div className="bg-white/60 mx-4 mb-4 rounded-xl p-3 space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="font-bold text-slate-500">Bắt đầu</span>
                              <span className="font-black text-slate-800">{selectedRoom.contractStart ? new Date(selectedRoom.contractStart).toLocaleDateString('vi-VN') : '—'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="font-bold text-slate-500">Kết thúc</span>
                              <span className="font-black text-slate-800">{selectedRoom.contractEnd ? new Date(selectedRoom.contractEnd).toLocaleDateString('vi-VN') : '—'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="font-bold text-slate-500">Tiền cọc</span>
                              <span className="font-black text-primary">{selectedRoom.contractDeposit ? Number(selectedRoom.contractDeposit).toLocaleString() + 'đ' : '0đ'}</span>
                            </div>

                            {/* Contract Progress Bar */}
                            {selectedRoom.contractStart && selectedRoom.contractEnd && (() => {
                              const start = new Date(selectedRoom.contractStart).getTime();
                              const end = new Date(selectedRoom.contractEnd).getTime();
                              const now = Date.now();
                              const total = end - start;
                              const elapsed = now - start;
                              const pct = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
                              const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
                              const color = daysLeft <= 30 ? 'bg-red-500' : daysLeft <= 90 ? 'bg-orange-400' : 'bg-green-500';
                              return (
                                <div>
                                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                                    <span>Tiến độ HĐ</span>
                                    <span className={daysLeft <= 30 ? 'text-red-500' : daysLeft <= 90 ? 'text-orange-500' : 'text-green-600'}>{daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Đã hết hạn'}</span>
                                  </div>
                                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                    <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Quick Actions */}
                          <div className="flex gap-2 px-4 pb-4">
                            <a href={selectedRoom.tenantPhone ? `tel:${selectedRoom.tenantPhone}` : '#'} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-orange-100/50 hover:bg-primary-hover transition-all">
                              <Phone className="w-3.5 h-3.5" />Gọi ngay
                            </a>
                            <button onClick={() => { setShowRoomDetailModal(false); setActiveTab('messages'); }} className="flex-1 py-2.5 bg-white text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm hover:bg-slate-50 transition-all">
                              <MessageSquare className="w-3.5 h-3.5" />Nhắn tin
                            </button>
                          </div>
                        </div>

                      ) : selectedRoom.status === 'pending' ? (
                        <div className="p-5 rounded-2xl bg-orange-50 border border-orange-200">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center"><Clock className="w-5 h-5" /></div>
                            <div>
                              <p className="text-sm font-black text-orange-900">Chờ người thuê ký hợp đồng</p>
                              <p className="text-xs font-bold text-orange-600 mt-0.5">Hợp đồng đã gửi, đang chờ xác nhận</p>
                            </div>
                          </div>
                          <button onClick={() => { setShowRoomDetailModal(false); setActiveTab('contracts'); }} className="w-full py-2.5 border border-orange-300 text-orange-700 bg-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-50 transition-all">
                            <FileText className="w-4 h-4" />Xem hợp đồng chờ ký
                          </button>
                        </div>

                      ) : selectedRoom.status === 'repairing' ? (
                        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center"><Construction className="w-5 h-5" /></div>
                            <div>
                              <p className="text-sm font-black text-amber-900">Đang sửa chữa / Nâng cấp</p>
                              <p className="text-xs font-bold text-amber-700/80 leading-relaxed">{selectedRoom.note || 'Phòng đang được bảo trì.'}</p>
                            </div>
                          </div>
                        </div>

                      ) : (
                        <div className="p-5 rounded-2xl bg-green-50/50 border border-green-200/50 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 shrink-0"><Sparkles className="w-5 h-5" /></div>
                            <div>
                              <p className="text-sm font-black text-green-800">Phòng đang trống — Sẵn sàng cho thuê</p>
                              <p className="text-xs font-bold text-green-700/70">Dọn sạch sẽ, đón khách vào ở ngay.</p>
                            </div>
                          </div>
                          <button onClick={() => { setShowRoomDetailModal(false); setActiveTab('contracts'); }} className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-green-100 transition-all">
                            <Plus className="w-4 h-4" />Tạo Hợp Đồng Ngay
                          </button>
                          <button onClick={() => { setShowRoomDetailModal(false); setListingForm(prev => ({...prev, title: `Cho thuê ${selectedRoom.title}`, price: selectedRoom.price.replace(/[^0-9]/g, ''), area: selectedRoom.area.replace(/[^0-9.]/g, '')})); setShowAddListingModal(true); }} className="w-full py-2.5 bg-white hover:bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                            <MapPin className="w-4 h-4" />Đăng Marketing Tìm Khách
                          </button>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Footer Actions */}
                  <div className="border-t border-slate-100 px-6 md:px-8 py-4 flex items-center justify-between shrink-0">
                    <button
                      onClick={() => { setShowRoomDetailModal(false); openEditRoomModal(selectedRoom.id); }}
                      className="px-5 py-2.5 border border-slate-200 hover:border-slate-300 text-slate-600 bg-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm hover:shadow"
                    >
                      <Settings className="w-3.5 h-3.5" />Sửa thông số
                    </button>
                    <button
                      onClick={() => { setShowRoomDetailModal(false); handleDeleteRoom(selectedRoom.id, selectedRoom.title); }}
                      className="p-2.5 text-slate-300 hover:text-white hover:bg-red-500 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
