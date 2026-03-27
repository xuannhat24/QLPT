import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Home, 
  LayoutDashboard, 
  FileText, 
  Users, 
  BarChart, 
  LogOut, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  AlertCircle,
  Trash2,
  Shield,
  UserCheck,
  Edit,
  ShoppingCart
} from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Header, Page } from '../components/Header';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { useToast } from '../context/ToastContext';

interface AdminPageProps {
  user: SupabaseUser | null;
  onLogout: () => void;
  onNavigate: (page: Page) => void;
}

interface Profile {
  id: string;
  full_name: string;
  phone: string;
  role: string;
  avatar_url: string;
}

interface Listing {
  id: string;
  owner_id: string;
  title: string;
  price: number;
  image_url: string;
  type: string;
  location: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  ownerInfo?: Profile;
}

interface Product {
  id: string;
  owner_id: string;
  title: string;
  price: number;
  image_url: string;
  category: string;
  condition: string;
  status: string;
  created_at: string;
  ownerInfo?: Profile;
}

interface Report {
  id: string;
  reporter_id: string;
  target_id: string;
  target_type: 'listing' | 'user';
  reason: string;
  status: 'pending' | 'resolved';
  created_at: string;
  reporterInfo?: Profile;
}

interface OverallStats {
  totalListings: number;
  totalUsers: number;
  totalRevenue: number;
  activeContracts: number;
  totalProducts: number;
}

type AdminView = 'dashboard' | 'listings' | 'users' | 'reports';

export const AdminPage = ({ user, onLogout, onNavigate }: AdminPageProps) => {
  const [currentView, setCurrentView] = useState<AdminView>('listings');
  
  // Listings State
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [listings, setListings] = useState<Listing[]>([]);
  
  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [listingMode, setListingMode] = useState<'room' | 'product'>('room');
  
  // Users State
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [userFilter, setUserFilter] = useState<'all' | 'landlord' | 'tenant' | 'admin'>('all');

  // Shared State
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Edit Listing State
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [editForm, setEditForm] = useState<{ title: string, price: number, type: string, location: string }>({ title: '', price: 0, type: '', location: '' });

  // Edit User State
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [userEditForm, setUserEditForm] = useState<{ full_name: string, phone: string, role: string }>({ full_name: '', phone: '', role: 'tenant' });
  
  // Edit Product State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productEditForm, setProductEditForm] = useState<{ title: string, price: number, category: string, condition: string }>({ 
    title: '', 
    price: 0, 
    category: '', 
    condition: '' 
  });

  // View User State
  const [viewingUser, setViewingUser] = useState<Profile | null>(null);

  // Create User State
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'tenant'
  });

  // Reports State
  const [reportsList, setReportsList] = useState<Report[]>([]);
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });

  // Overall Statistics State
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalListings: 0,
    totalUsers: 0,
    totalRevenue: 0,
    activeContracts: 0,
    totalProducts: 0
  });

  const { showToast } = useToast();

  // Navigation & Highlight State
  const [highlightedListingId, setHighlightedListingId] = useState<string | null>(null);

  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchOverallStats();
    } else if (currentView === 'users') {
      fetchUsers();
    } else if (currentView === 'reports') {
      fetchReports();
    }
  }, [currentView]);

  useEffect(() => {
    if (currentView === 'listings') {
      if (listingMode === 'room') fetchListings();
      else fetchProducts();
    }
  }, [currentView, listingMode]);

  // ===================== LISTINGS LOGIC =====================
  const fetchListings = async () => {
    try {
      setLoading(true);
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (listingsError) throw listingsError;
      
      if (!listingsData || listingsData.length === 0) {
        setListings([]);
        return;
      }

      const ownerIds = [...new Set(listingsData.map(l => l.owner_id).filter(id => id))];
      let profilesMap = new Map();
      
      if (ownerIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, phone, role, avatar_url')
          .in('id', ownerIds);
          
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
        } else if (profilesData) {
          profilesData.forEach(p => profilesMap.set(p.id, p));
        }
      }
      
      const mergedListings = listingsData.map(listing => ({
        ...listing,
        ownerInfo: profilesMap.get(listing.owner_id)
      }));

      setListings(mergedListings as Listing[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Không thể tải dữ liệu tin đăng.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      
      if (!productsData || productsData.length === 0) {
        setProducts([]);
        return;
      }

      const ownerIds = [...new Set(productsData.map(p => p.owner_id).filter(id => id))];
      let profilesMap = new Map();
      
      if (ownerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, phone, role, avatar_url')
          .in('id', ownerIds);
          
        profilesData?.forEach(p => profilesMap.set(p.id, p));
      }
      
      const mergedProducts = productsData.map(product => ({
        ...product,
        ownerInfo: profilesMap.get(product.owner_id)
      }));

      setProducts(mergedProducts as Product[]);
    } catch (error) {
      console.error('Error fetching products:', error);
      showToast('Không thể tải dữ liệu sản phẩm.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProductStatus = async (id: string, status: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận trạng thái',
      message: `Cập nhật trạng thái sản phẩm thành "${status === 'available' ? 'Có sẵn' : 'Đã bán/Ẩn'}"?`,
      type: 'info',
      onConfirm: async () => {
        try {
          setActionLoading(id);
          const { error } = await supabase
            .from('products')
            .update({ status: status })
            .eq('id', id);

          if (error) throw error;
          
          setProducts(prev => prev.map(p => p.id === id ? { ...p, status: status } : p));
          showToast('Cập nhật trạng thái sản phẩm thành công!', 'success');
        } catch (error: any) {
          showToast(error.message || 'Lỗi cập nhật sản phẩm.', 'error');
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const handleDeleteProduct = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa sản phẩm',
      message: 'Bạn có chắc muốn xóa vĩnh viễn sản phẩm này?',
      type: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(id);
          const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

          if (error) throw error;
          
          setProducts(prev => prev.filter(p => p.id !== id));
          showToast('Đã xóa sản phẩm thành công!', 'success');
        } catch (error: any) {
          showToast(error.message || 'Lỗi khi xóa sản phẩm.', 'error');
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const handleEditProductClick = (product: Product) => {
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
    try {
      setActionLoading('saving-product');
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
      
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...productEditForm } : p));
      setEditingProduct(null);
      showToast('Cập nhật sản phẩm thành công!', 'success');
    } catch (error: any) {
      console.error('Error updating product:', error);
      showToast(error.message || 'Lỗi khi lưu chỉnh sửa sản phẩm.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận thay đổi',
      message: `Bạn có chắc muốn ${status === 'approved' ? 'duyệt' : 'từ chối'} tin đăng này?`,
      type: 'warning',
      onConfirm: async () => {
        try {
          setActionLoading(id);
          const { data, error } = await supabase
            .from('listings')
            .update({ approval_status: status })
            .eq('id', id)
            .select();

          if (error) throw error;
          if (!data || data.length === 0) throw new Error("Không có quyền chỉnh sửa ở Database.");
          
          setListings(prev => prev.map(l => l.id === id ? { ...l, approval_status: status } : l));
          showToast(`Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} tin đăng!`, 'success');
        } catch (error: any) {
          showToast(error.message || 'Lỗi cập nhật trạng thái.', 'error');
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const handleDeleteListing = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa tin đăng',
      message: 'Bạn có chắc chắn muốn xóa tin đăng này khỏi hệ thống không?',
      type: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(id);
          const { data, error } = await supabase
            .from('listings')
            .update({ is_active: false })
            .eq('id', id)
            .select();

          if (error) throw error;
          if (!data || data.length === 0) throw new Error("Lỗi Database: Không thể xóa.");
          
          setListings(prev => prev.filter(l => l.id !== id));
          showToast('Đã xóa bài đăng khỏi hệ thống!', 'success');
        } catch (error: any) {
          showToast(error.message || 'Lỗi khi xóa tin đăng.', 'error');
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const handleEditClick = (listing: Listing) => {
    setHighlightedListingId(null); // Clear highlight when starting edit
    setEditingListing(listing);
    setEditForm({
      title: listing.title || '',
      price: listing.price || 0,
      type: listing.type || '',
      location: listing.location || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingListing) return;
    try {
      setActionLoading('saving');
      const { data, error } = await supabase
        .from('listings')
        .update({ 
          title: editForm.title,
          price: editForm.price,
          type: editForm.type,
          location: editForm.location
        })
        .eq('id', editingListing.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Không có quyền chỉnh sửa ở Database (RLS).");
      
      setListings(prev => prev.map(l => l.id === editingListing.id ? { ...l, ...editForm } : l));
      setEditingListing(null);
      showToast('Cập nhật tin đăng thành công!', 'success');
    } catch (error: any) {
      console.error('Error updating listing:', error);
      showToast(error.message || 'Đã xảy ra lỗi khi lưu chỉnh sửa.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const listingStats = {
    pending: listings.filter(l => l.approval_status === 'pending').length,
    approved: listings.filter(l => l.approval_status === 'approved').length,
    rejected: listings.filter(l => l.approval_status === 'rejected').length,
    totalProducts: products.length,
    availableProducts: products.filter(p => p.status === 'available').length,
    soldProducts: products.filter(p => p.status === 'sold').length
  };

  const currentListings = listings.filter(l => l.approval_status === activeTab);

  // ===================== USERS LOGIC =====================
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: true }); // Group by role roughly
      if (error) throw error;
      setUsersList(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Không thể tải dữ liệu người dùng.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUserClick = (user: Profile) => {
    setEditingUser(user);
    setUserEditForm({
      full_name: user.full_name || '',
      phone: user.phone || '',
      role: user.role || 'tenant'
    });
  };

  const handleSaveUserEdit = async () => {
    if (!editingUser) return;
    try {
      setActionLoading('saving-user');
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          full_name: userEditForm.full_name,
          phone: userEditForm.phone,
          role: userEditForm.role 
        })
        .eq('id', editingUser.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Chặn bởi RLS. Không thể lưu.");
      
      setUsersList(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...userEditForm } : u));
      setEditingUser(null);
      showToast('Cập nhật người dùng thành công!', 'success');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showToast(error.message || 'Lỗi khi lưu.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa hồ sơ người dùng',
      message: 'Bạn có chắc muốn xoá vĩnh viễn hồ sơ người dùng này? Hành động này không thể hoàn tác.',
      type: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(id);
          const { data, error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id)
            .select();

          if (error) throw error;
          if (!data || data.length === 0) throw new Error("Không thể xoá. Có thể do ràng buộc dữ liệu hoặc RLS.");
          
          setUsersList(prev => prev.filter(u => u.id !== id));
          showToast('Đã xoá hồ sơ người dùng thành công!', 'success');
        } catch (error: any) {
          showToast(error.message || 'Lỗi khi xoá hồ sơ.', 'error');
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const userStats = {
    total: usersList.length,
    landlord: usersList.filter(u => u.role === 'landlord').length,
    tenant: usersList.filter(u => u.role === 'tenant').length,
    admin: usersList.filter(u => u.role === 'admin').length,
  };

  const currentUsers = usersList.filter(u => userFilter === 'all' || u.role === userFilter);

  const handleCreateUser = async () => {
    if (!newUserForm.email || !newUserForm.password || !newUserForm.full_name) {
      showToast('Vui lòng điền Email, Mật khẩu và Họ tên.', 'info');
      return;
    }

    try {
      setActionLoading('creating-user');
      
      // 1. Tạo một temp client KHÔNG lưu session để tránh làm Admin bị logout
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });
      
      // 2. Tạo user trong Auth qua temp client
      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: newUserForm.email,
        password: newUserForm.password,
        options: {
          data: {
            full_name: newUserForm.full_name,
            role: newUserForm.role
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 3. Cập nhật thủ công vào profiles để đảm bảo có số điện thoại (trong trường hợp trigger chưa có)
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            full_name: newUserForm.full_name,
            phone: newUserForm.phone,
            role: newUserForm.role,
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.warn('Profile update warning:', profileError);
        }

        showToast(`Thành công! Đã tạo tài khoản cho ${newUserForm.full_name}.`, 'success');
        setShowCreateUserModal(false);
        setNewUserForm({ email: '', password: '', full_name: '', phone: '', role: 'tenant' });
        fetchUsers();
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      let errorMsg = error.message || 'Lỗi khi tạo người dùng.';
      if (errorMsg === 'User already registered') {
        errorMsg = 'Email này đã được đăng ký tài khoản trên hệ thống. Vui lòng sử dụng email khác.';
      }
      showToast(errorMsg, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // ===================== REPORTS & STATS LOGIC =====================
  const fetchOverallStats = async () => {
    try {
      setLoading(true);
      const [
        { count: listingsCount },
        { count: usersCount },
        { data: revenueData },
        { count: contractsCount },
        { count: productsCount }
      ] = await Promise.all([
        supabase.from('listings').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('invoices').select('amount').eq('status', 'paid'), // Giả định status đã thanh toán
        supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('products').select('*', { count: 'exact', head: true })
      ]) as any[];

      const totalRevenue = revenueData?.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0) || 0;

      setOverallStats({
        totalListings: listingsCount || 0,
        totalUsers: usersCount || 0,
        totalRevenue,
        activeContracts: contractsCount || 0,
        totalProducts: productsCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      if (reportsData && reportsData.length > 0) {
        const reporterIds = [...new Set(reportsData.map(r => r.reporter_id).filter(id => id))];
        let profilesMap = new Map();

        if (reporterIds.length > 0) {
          const { data: profilesData } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', reporterIds);
          profilesData?.forEach(p => profilesMap.set(p.id, p));
        }

        const mergedReports = reportsData.map(r => ({
          ...r,
          reporterInfo: profilesMap.get(r.reporter_id)
        }));
        setReportsList(mergedReports);
      } else {
        setReportsList([]);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReportStatus = async (reportId: string, newStatus: 'resolved') => {
    try {
      setActionLoading(reportId);
      const { error } = await supabase.from('reports').update({ status: newStatus }).eq('id', reportId);
      if (error) throw error;
      setReportsList(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
    } catch (error) {
      showToast('Không thể cập nhật trạng thái báo cáo.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa báo cáo',
      message: 'Xóa vĩnh viễn báo cáo này khỏi hệ thống?',
      type: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(reportId);
          const { error } = await supabase.from('reports').delete().eq('id', reportId);
          if (error) throw error;
          setReportsList(prev => prev.filter(r => r.id !== reportId));
          showToast('Đã xóa báo cáo.', 'success');
        } catch (error: any) {
          showToast('Lỗi khi xóa báo cáo.', 'error');
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const filteredReports = reportsList.filter(r => reportFilter === 'all' || r.status === reportFilter);

  // ===================== HELPERS =====================
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}`;
  };

  // ===================== RENDER =====================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header user={user} onLogout={onLogout} onNavigate={onNavigate} activePath="admin" />

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col sticky top-16 h-[calc(100vh-64px)] overflow-y-auto shrink-0">
          <div className="p-6 flex-1">
            <div className="flex items-center gap-3 text-primary mb-8 cursor-pointer" onClick={() => onNavigate('home')}>
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 font-display">Admin Portal</h2>
            </div>
            
            <nav className="space-y-2">
              <button 
                onClick={() => setCurrentView('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${currentView === 'dashboard' ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Bảng điều khiển</span>
              </button>
              <button 
                onClick={() => setCurrentView('listings')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-semibold text-sm ${currentView === 'listings' ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5" />
                  <span>Quản lý tin đăng</span>
                </div>
                {!loading && (
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {listings.length + products.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setCurrentView('users')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-semibold text-sm ${currentView === 'users' ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5" />
                  <span>Quản lý người dùng</span>
                </div>
                {!loading && (
                   <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {usersList.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setCurrentView('reports')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${currentView === 'reports' ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <BarChart className="w-5 h-5" />
                <span>Báo cáo và phản hồi</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full overflow-hidden">
            
            {/* VIEW: QUẢN LÝ TIN ĐĂNG */}
            {currentView === 'listings' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col w-full h-full">
                <div className="mb-8 shrink-0 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Danh sách Tin đăng</h2>
                    <p className="text-slate-500">Quản lý và kiểm duyệt các nội dung đăng tải trên hệ thống.</p>
                  </div>
                  <div className="flex bg-slate-200/50 p-1 rounded-xl w-fit">
                    <button 
                      onClick={() => setListingMode('room')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${listingMode === 'room' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Phòng trọ
                    </button>
                    <button 
                      onClick={() => setListingMode('product')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${listingMode === 'product' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Bán hàng
                    </button>
                  </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 shrink-0">
                  {listingMode === 'room' ? (
                    <>
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                           onClick={() => setActiveTab('pending')}>
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
                          <Clock className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 font-medium">Chờ duyệt</p>
                          <p className="text-2xl font-bold">{loading ? '-' : listingStats.pending}</p>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                           onClick={() => setActiveTab('approved')}>
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 font-medium">Đã đăng</p>
                          <p className="text-2xl font-bold">{loading ? '-' : listingStats.approved}</p>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                           onClick={() => setActiveTab('rejected')}>
                        <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                          <XCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 font-medium">Đã từ chối</p>
                          <p className="text-2xl font-bold">{loading ? '-' : listingStats.rejected}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                          <ShoppingCart className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 font-medium">Tổng sản phẩm</p>
                          <p className="text-2xl font-bold">{loading ? '-' : listingStats.totalProducts}</p>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                          <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 font-medium">Có sẵn</p>
                          <p className="text-2xl font-bold">{loading ? '-' : listingStats.availableProducts}</p>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm">
                        <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
                          <XCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 font-medium">Đã bán</p>
                          <p className="text-2xl font-bold">{loading ? '-' : listingStats.soldProducts}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Filters & Tabs */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col flex-1">
                  {listingMode === 'room' ? (
                    <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 overflow-x-auto shrink-0">
                      <button 
                        onClick={() => setActiveTab('pending')}
                        className={`py-4 px-4 border-b-2 font-bold text-sm whitespace-nowrap ${activeTab === 'pending' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 font-medium'}`}
                      >
                        Chờ duyệt ({loading ? '-' : listingStats.pending})
                      </button>
                      <button 
                        onClick={() => setActiveTab('approved')}
                        className={`py-4 px-4 border-b-2 font-bold text-sm whitespace-nowrap ${activeTab === 'approved' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 font-medium'}`}
                      >
                        Đã đăng ({loading ? '-' : listingStats.approved})
                      </button>
                      <button 
                        onClick={() => setActiveTab('rejected')}
                        className={`py-4 px-4 border-b-2 font-bold text-sm whitespace-nowrap ${activeTab === 'rejected' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 font-medium'}`}
                      >
                        Đã từ chối ({loading ? '-' : listingStats.rejected})
                      </button>
                    </div>
                  ) : (
                    <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 overflow-x-auto shrink-0">
                      <div className="py-4 px-4 font-bold text-sm text-primary">
                        Tất cả bài đăng bán hàng ({loading ? '-' : products.length})
                      </div>
                    </div>
                  )}
                  
                  <div className="overflow-x-auto min-h-[300px] flex-1">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                        <p>Đang tải dữ liệu...</p>
                      </div>
                    ) : (listingMode === 'room' ? currentListings : products).length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <AlertCircle className="w-12 h-12 mb-4 text-slate-300" />
                        <p>Không có {listingMode === 'room' ? 'tin đăng' : 'sản phẩm'} nào ở trạng thái này.</p>
                      </div>
                    ) : listingMode === 'room' ? (
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Hình ảnh</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tiêu đề</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Người đăng</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày đăng</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {currentListings.map((listing) => (
                            <tr key={listing.id} 
                                onClick={() => listing.id === highlightedListingId && setHighlightedListingId(null)}
                                className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all ${
                                  listing.id === highlightedListingId ? 'bg-orange-50/80 dark:bg-orange-900/20 ring-2 ring-inset ring-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : ''
                                }`}>
                              <td className="px-6 py-4">
                                <div className="w-16 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden relative">
                                  {listing.image_url ? (
                                    <img className="w-full h-full object-cover" alt={listing.title} src={listing.image_url}/>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                                      <Home className="w-5 h-5" />
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{listing.title}</div>
                                <div className="text-xs text-slate-500 italic mt-0.5">{listing.type} • {listing.location}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 overflow-hidden border border-white">
                                    {listing.ownerInfo?.avatar_url ? (
                                      <img src={listing.ownerInfo.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                                    ) : (
                                      getInitials(listing.ownerInfo?.full_name)
                                    )}
                                  </div>
                                  <div className="text-xs">
                                    <div className="font-bold text-slate-900">{listing.ownerInfo?.full_name || 'N/A'}</div>
                                    <div className="text-slate-500">{listing.ownerInfo?.phone || 'N/A'}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                                {formatDate(listing.created_at)}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                  listing.approval_status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                                  listing.approval_status === 'rejected' ? 'bg-red-100 text-red-700' : 
                                  'bg-orange-100 text-orange-700'
                                }`}>
                                  {listing.approval_status === 'approved' ? 'Đã duyệt' : 
                                   listing.approval_status === 'rejected' ? 'Đã từ chối' : 'Chờ duyệt'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {actionLoading === listing.id ? (
                                  <Loader2 className="w-5 h-5 animate-spin text-primary ml-auto" />
                                ) : (
                                  <div className="flex items-center justify-end gap-1">
                                    <button onClick={() => handleEditClick(listing)} 
                                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded transition-all" title="Chỉnh sửa nhanh">
                                      <Edit className="w-5 h-5" />
                                    </button>
                                    <button className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded transition-all" title="Xem chi tiết"
                                            onClick={() => onNavigate('listing-detail' as Page)}>
                                      <Eye className="w-5 h-5" />
                                    </button>
                                    {listing.approval_status !== 'approved' && (
                                      <button onClick={() => handleUpdateStatus(listing.id, 'approved')} 
                                              className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-100 rounded transition-all" title="Phê duyệt">
                                        <CheckCircle className="w-5 h-5" />
                                      </button>
                                    )}
                                    {listing.approval_status === 'pending' && (
                                      <button onClick={() => handleUpdateStatus(listing.id, 'rejected')} 
                                              className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-100 rounded transition-all" title="Từ chối">
                                        <XCircle className="w-5 h-5" />
                                      </button>
                                    )}
                                    <button onClick={() => handleDeleteListing(listing.id)} 
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded transition-all" title="Xóa">
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Hình ảnh</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tên sản phẩm</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Danh mục</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Giá bán</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Người bán</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {products.map((product) => (
                            <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all">
                              <td className="px-6 py-4">
                                <div className="w-16 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden relative">
                                  {product.image_url ? (
                                    <img className="w-full h-full object-cover" alt={product.title} src={product.image_url}/>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                                      <Home className="w-5 h-5" />
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{product.title}</div>
                                <div className="text-xs text-slate-500 italic mt-0.5">{product.condition}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                                  {product.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-primary">
                                {product.price.toLocaleString('vi-VN')}đ
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 overflow-hidden border border-white">
                                      {product.ownerInfo?.avatar_url ? (
                                        <img src={product.ownerInfo.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                                      ) : (
                                        getInitials(product.ownerInfo?.full_name)
                                      )}
                                    </div>
                                    <div className="text-xs">
                                      <div className="font-bold text-slate-900">{product.ownerInfo?.full_name || 'N/A'}</div>
                                      <div className="text-slate-500">{product.ownerInfo?.phone || 'N/A'}</div>
                                    </div>
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                    product.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {product.status === 'available' ? 'Có sẵn' : 'Đã bán'}
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <div className="flex items-center justify-end gap-1">
                                    <button onClick={() => handleEditProductClick(product)} 
                                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded transition-all" title="Chỉnh sửa sản phẩm">
                                      <Edit className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleUpdateProductStatus(product.id, product.status === 'available' ? 'sold' : 'available')} 
                                            className={`p-1.5 rounded transition-all ${product.status === 'available' ? 'text-slate-400 hover:text-orange-600 hover:bg-orange-100' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-100'}`}
                                            title={product.status === 'available' ? 'Đánh dấu đã bán' : 'Đánh dấu có sẵn'}>
                                      {product.status === 'available' ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                    </button>
                                    <button onClick={() => handleDeleteProduct(product.id)} 
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded transition-all" title="Xóa">
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                 </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* MODAL SỬA TIN ĐĂNG */}
                {editingListing && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
                      <div className="p-6 border-b border-slate-100">
                        <h3 className="text-xl font-bold text-slate-900">Chỉnh sửa Tin đăng</h3>
                      </div>
                      <div className="p-6 space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Tiêu đề</label>
                          <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none" 
                            value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Giá thuê (VND)</label>
                          <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none" 
                            value={editForm.price} onChange={e => setEditForm({...editForm, price: Number(e.target.value)})} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Loại phòng</label>
                          <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none" 
                            placeholder="Ví dụ: Phòng trọ, Căn hộ..."
                            value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Vị trí (Khu vực)</label>
                          <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none" 
                            placeholder="Ví dụ: Quận Thanh Khê, Đà Nẵng"
                            value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} />
                        </div>
                      </div>
                      <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                        <button onClick={() => setEditingListing(null)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Hủy</button>
                        <button onClick={handleSaveEdit} disabled={actionLoading === 'saving'} className="px-4 py-2 text-sm font-bold bg-primary text-white hover:bg-primary-hover rounded-lg flex items-center gap-2 transition-colors">
                          {actionLoading === 'saving' && <Loader2 className="w-4 h-4 animate-spin"/>}
                          Lưu thay đổi
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODAL SỬA SẢN PHẨM */}
                {editingProduct && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
                      <div className="p-6 border-b border-slate-100">
                        <h3 className="text-xl font-bold text-slate-900">Chỉnh sửa Sản phẩm</h3>
                      </div>
                      <div className="p-6 space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Tên sản phẩm</label>
                          <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none" 
                            value={productEditForm.title} onChange={e => setProductEditForm({...productEditForm, title: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Giá bán (VND)</label>
                          <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none" 
                            value={productEditForm.price} onChange={e => setProductEditForm({...productEditForm, price: Number(e.target.value)})} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Danh mục</label>
                          <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none" 
                            value={productEditForm.category} onChange={e => setProductEditForm({...productEditForm, category: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Tình trạng</label>
                          <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none" 
                            value={productEditForm.condition} onChange={e => setProductEditForm({...productEditForm, condition: e.target.value})} />
                        </div>
                      </div>
                      <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                        <button onClick={() => setEditingProduct(null)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Hủy</button>
                        <button onClick={handleSaveProductEdit} disabled={actionLoading === 'saving-product'} className="px-4 py-2 text-sm font-bold bg-primary text-white hover:bg-primary-hover rounded-lg flex items-center gap-2 transition-colors">
                          {actionLoading === 'saving-product' && <Loader2 className="w-4 h-4 animate-spin"/>}
                          Lưu thay đổi
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* VIEW: QUẢN LÝ NGƯỜI DÙNG */}
            {currentView === 'users' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col w-full h-full">
                <div className="mb-8 shrink-0 flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Quản lý Người dùng</h2>
                    <p className="text-slate-500">Phân quyền, kiểm tra tài khoản và quản lý thành viên.</p>
                  </div>
                  <button onClick={() => setShowCreateUserModal(true)} 
                          className="px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary-hover shadow-sm transition-colors md:block">
                    + Thêm người dùng
                  </button>
                </div>

                {/* Users Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 shrink-0">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                    <p className="text-sm text-slate-500 font-medium mb-1">Tổng thành viên</p>
                    <p className="text-3xl font-black text-slate-900">{loading ? '-' : userStats.total}</p>
                  </div>
                  <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 shadow-sm flex flex-col justify-center">
                    <p className="text-sm text-emerald-600 font-medium mb-1">Chủ trọ (Landlord)</p>
                    <p className="text-3xl font-black text-emerald-700">{loading ? '-' : userStats.landlord}</p>
                  </div>
                  <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 shadow-sm flex flex-col justify-center">
                    <p className="text-sm text-blue-600 font-medium mb-1">Người thuê (Tenant)</p>
                    <p className="text-3xl font-black text-blue-700">{loading ? '-' : userStats.tenant}</p>
                  </div>
                  <div className="bg-purple-50 p-5 rounded-xl border border-purple-100 shadow-sm flex flex-col justify-center">
                    <p className="text-sm text-purple-600 font-medium mb-1">Quản trị viên</p>
                    <p className="text-3xl font-black text-purple-700">{loading ? '-' : userStats.admin}</p>
                  </div>
                </div>

                {/* Users Filter & Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col flex-1">
                  <div className="flex border-b border-slate-200 px-6 overflow-x-auto shrink-0 bg-slate-50/50">
                    {[
                      { id: 'all', label: 'Tất cả' },
                      { id: 'landlord', label: 'Chủ trọ' },
                      { id: 'tenant', label: 'Người thuê' },
                      { id: 'admin', label: 'Admin' }
                    ].map(tab => (
                      <button 
                        key={tab.id}
                        onClick={() => setUserFilter(tab.id as any)}
                        className={`py-4 px-4 border-b-2 font-bold text-sm whitespace-nowrap transition-colors ${userFilter === tab.id ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="overflow-x-auto min-h-[300px] flex-1">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                        <p>Đang tải tài khoản...</p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="bg-white border-b border-slate-200 sticky top-0 z-10">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tài khoản</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Liên hệ</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Phân quyền gốc</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Cập nhật quyền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  {u.avatar_url ? (
                                    <img src={u.avatar_url} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                                      {getInitials(u.full_name)}
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-bold text-slate-900">{u.full_name || 'Người dùng ẩn'}</p>
                                    <p className="text-xs text-slate-400 font-mono mt-0.5" title={u.id}>{u.id.substring(0,8)}...</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-slate-600 font-medium">{u.phone || 'Chưa cung cấp'}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${
                                  u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                  u.role === 'landlord' ? 'bg-emerald-100 text-emerald-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {u.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                                  {u.role === 'landlord' && <Home className="w-3 h-3 mr-1" />}
                                  {u.role === 'tenant' && <UserCheck className="w-3 h-3 mr-1" />}
                                  {u.role || 'Chưa rõ'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {actionLoading === u.id ? (
                                  <Loader2 className="w-5 h-5 animate-spin text-slate-400 ml-auto" />
                                ) : (
                                  <div className="flex justify-end items-center gap-2">
                                    <button onClick={() => setViewingUser(u)} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-100 rounded transition-all" title="Xem thông tin">
                                      <Eye className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleEditUserClick(u)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-all" title="Chỉnh sửa">
                                      <Edit className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded transition-all" title="Xóa hồ sơ">
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                          {currentUsers.length === 0 && !loading && (
                            <tr>
                              <td colSpan={4} className="text-center py-12 text-slate-400">
                                Không có người dùng nào phù hợp.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* MODAL SỬA USER */}
                {editingUser && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
                      <div className="p-6 border-b border-slate-100">
                        <h3 className="text-xl font-bold text-slate-900">Sửa thông tin Người dùng</h3>
                        <p className="text-sm text-slate-500 font-mono mt-1">ID: {editingUser.id.substring(0,8)}...</p>
                      </div>
                      <div className="p-6 space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Họ và Tên</label>
                          <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none" 
                            value={userEditForm.full_name} onChange={e => setUserEditForm({...userEditForm, full_name: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Số điện thoại</label>
                          <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none" 
                            value={userEditForm.phone} onChange={e => setUserEditForm({...userEditForm, phone: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Phân quyền (Role)</label>
                          <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none" 
                            value={userEditForm.role} onChange={e => setUserEditForm({...userEditForm, role: e.target.value})}>
                            <option value="tenant">Người thuê (Tenant)</option>
                            <option value="landlord">Chủ trọ (Landlord)</option>
                            <option value="admin">Quản trị viên (Admin)</option>
                          </select>
                        </div>
                      </div>
                      <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                        <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Hủy</button>
                        <button onClick={handleSaveUserEdit} disabled={actionLoading === 'saving-user'} className="px-4 py-2 text-sm font-bold bg-primary text-white hover:bg-primary-hover rounded-lg flex items-center gap-2 transition-colors">
                          {actionLoading === 'saving-user' && <Loader2 className="w-4 h-4 animate-spin"/>}
                          Lưu thay đổi
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODAL THÊM USER MỚI */}
                {showCreateUserModal && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
                      <div className="p-6 border-b border-slate-100">
                        <h3 className="text-xl font-bold text-slate-900">Thêm Người dùng mới</h3>
                        <p className="text-sm text-slate-500 font-medium mt-1">Hệ thống sẽ gửi yêu cầu tạo tài khoản mới.</p>
                      </div>
                      <div className="p-6 space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Email (Tên đăng nhập) *</label>
                          <input type="email" placeholder="email@example.com" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none" 
                            value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Mật khẩu *</label>
                          <input type="password" placeholder="Min 6 characters" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none" 
                            value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Họ và Tên *</label>
                            <input type="text" placeholder="Nguyễn Văn A" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none" 
                              value={newUserForm.full_name} onChange={e => setNewUserForm({...newUserForm, full_name: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Số điện thoại</label>
                            <input type="text" placeholder="0123..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none" 
                              value={newUserForm.phone} onChange={e => setNewUserForm({...newUserForm, phone: e.target.value})} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Phân quyền (Role) *</label>
                          <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none" 
                            value={newUserForm.role} onChange={e => setNewUserForm({...newUserForm, role: e.target.value})}>
                            <option value="tenant">Người thuê (Tenant)</option>
                            <option value="landlord">Chủ trọ (Landlord)</option>
                            <option value="admin">Quản trị viên (Admin)</option>
                          </select>
                        </div>
                      </div>
                      <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                        <button onClick={() => setShowCreateUserModal(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Hủy</button>
                        <button onClick={handleCreateUser} disabled={actionLoading === 'creating-user'} className="px-4 py-2 text-sm font-bold bg-primary text-white hover:bg-primary-hover rounded-lg flex items-center gap-2 transition-colors">
                          {actionLoading === 'creating-user' && <Loader2 className="w-4 h-4 animate-spin"/>}
                          Tạo tài khoản
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODAL XEM CHI TIẾT USER */}
                {viewingUser && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative border border-slate-100">
                      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-lg font-bold text-slate-900">Hồ sơ Cầm tay</h3>
                        <button onClick={() => setViewingUser(null)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-1.5 rounded-lg transition-colors">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="p-6 flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-4 border-slate-50 shadow-sm shrink-0 bg-slate-100">
                          {viewingUser.avatar_url ? (
                            <img src={viewingUser.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                              {getInitials(viewingUser.full_name)}
                            </div>
                          )}
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 mb-1">{viewingUser.full_name || 'Người dùng ẩn'}</h4>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold capitalize mb-6 ${
                          viewingUser.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          viewingUser.role === 'landlord' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {viewingUser.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                          {viewingUser.role === 'landlord' && <Home className="w-3 h-3 mr-1" />}
                          {viewingUser.role === 'tenant' && <UserCheck className="w-3 h-3 mr-1" />}
                          {viewingUser.role || 'Chưa rõ'}
                        </span>
                        
                        <div className="w-full space-y-3">
                          <div className="flex flex-col bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 text-left flex items-center gap-1">
                              <Shield className="w-3 h-3" /> Mã tài khoản (ID)
                            </span>
                            <span className="text-sm font-mono text-slate-700 break-all text-left">{viewingUser.id}</span>
                          </div>
                          <div className="flex flex-col bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 text-left flex items-center gap-1">
                              <Users className="w-3 h-3" /> Số điện thoại liên hệ
                            </span>
                            <span className="text-sm font-medium text-slate-800 text-left">{viewingUser.phone || 'Chưa cung cấp'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* VIEW: BẢNG ĐIỀU KHIỂN (DASHBOARD) */}
            {currentView === 'dashboard' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col w-full h-full">
                <div className="mb-8 shrink-0">
                  <h2 className="text-2xl font-bold text-slate-900">Bảng điều khiển Hệ thống</h2>
                  <p className="text-slate-500">Phân tích dữ liệu tổng thể và hiệu suất kinh doanh.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-primary transition-colors"
                       onClick={() => { setCurrentView('listings'); setListingMode('room'); }}>
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-500 mb-1">Tin Thuê Phòng</p>
                    <p className="text-3xl font-black text-slate-900">{loading ? '...' : overallStats.totalListings}</p>
                    <div className="mt-2 text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded inline-block">Listings</div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-primary transition-colors"
                       onClick={() => { setCurrentView('listings'); setListingMode('product'); }}>
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-500 mb-1">Sản phẩm Bán</p>
                    <p className="text-3xl font-black text-slate-900">{loading ? '...' : overallStats.totalProducts}</p>
                    <div className="mt-2 text-xs text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded inline-block">Store</div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-primary transition-colors"
                       onClick={() => setCurrentView('users')}>
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                      <Users className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-500 mb-1">Thành viên</p>
                    <p className="text-3xl font-black text-slate-900">{loading ? '...' : overallStats.totalUsers}</p>
                    <div className="mt-2 text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded inline-block">Users</div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                      <Shield className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-500 mb-1">Hợp đồng thuê</p>
                    <p className="text-3xl font-black text-slate-900">{loading ? '...' : overallStats.activeContracts}</p>
                    <div className="mt-2 text-xs text-purple-600 font-bold bg-purple-50 px-2 py-1 rounded inline-block">Running</div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mb-4">
                      <BarChart className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-500 mb-1">Doanh thu (Ước tính)</p>
                    <p className="text-2xl font-black text-slate-900">{loading ? '...' : overallStats.totalRevenue.toLocaleString('vi-VN')} đ</p>
                    <div className="mt-2 text-xs text-slate-600 font-bold bg-slate-50 px-2 py-1 rounded inline-block">Payment Based</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 flex flex-col justify-center items-center text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <BarChart className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Biểu đồ đang phát triển</h3>
                    <p className="text-slate-500 text-sm max-w-xs">Hệ thống đang tích hợp thư viện Chart.js để hiển thị biến động giá và lượng truy cập.</p>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Hoạt động gần đây</h3>
                    <div className="space-y-6">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800">
                              {i === 1 ? 'Quản trị viên vừa phê duyệt 1 tin đăng' : 
                               i === 2 ? 'Người dùng "Nguyễn Văn A" vừa đăng ký' : 
                               'Tin đăng "Phòng trọ giá rẻ" vừa được cập nhật'}
                            </p>
                            <p className="text-xs text-slate-400 font-medium mt-1">Cách đây {i * 15} phút</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* VIEW: BÁO CÁO (REPORTS) */}
            {currentView === 'reports' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col w-full h-full">
                <div className="mb-8 shrink-0">
                  <h2 className="text-2xl font-bold text-slate-900">Quản lý Báo cáo & Phản hồi</h2>
                  <p className="text-slate-500">Xử lý các kiến nghị về vi phạm tin đăng hoặc lỗi hệ thống.</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col flex-1">
                  <div className="flex border-b border-slate-200 px-6 overflow-x-auto bg-slate-50/50">
                    {[
                      { id: 'all', label: 'Tất cả' },
                      { id: 'pending', label: 'Chưa xử lý' },
                      { id: 'resolved', label: 'Đã giải quyết' }
                    ].map(tab => (
                      <button 
                        key={tab.id}
                        onClick={() => setReportFilter(tab.id as any)}
                        className={`py-4 px-4 border-b-2 font-bold text-sm transition-colors ${reportFilter === tab.id ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="overflow-x-auto min-h-[400px]">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                        <p>Đang tải báo cáo...</p>
                      </div>
                    ) : filteredReports.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <AlertCircle className="w-12 h-12 mb-4 text-slate-200" />
                        <p>Chưa có báo cáo nào từ người dùng.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="bg-white border-b border-slate-200 sticky top-0 z-10">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Người báo cáo</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lý do / Nội dung</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Đối tượng</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredReports.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  {r.reporterInfo?.avatar_url ? (
                                    <img src={r.reporterInfo.avatar_url} alt="avt" className="w-8 h-8 rounded-full" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                      {getInitials(r.reporterInfo?.full_name)}
                                    </div>
                                  )}
                                  <span className="text-sm font-bold text-slate-700">{r.reporterInfo?.full_name || 'User'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm text-slate-600 max-w-sm font-medium">{r.reason}</p>
                                <span className="text-[10px] text-slate-400 block mt-1">{formatDate(r.created_at)}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase">
                                  {r.target_type === 'listing' ? 'Tin đăng' : 'Người dùng'}
                                </span>
                                <p className="text-[10px] text-slate-400 font-mono mt-1">{r.target_id.substring(0,8)}...</p>
                              </td>
                              <td className="px-6 py-4">
                                {r.status === 'pending' ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-orange-100 text-orange-600">Chờ lệnh</span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-600">Đã xong</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  {r.target_type === 'listing' && (
                                    <button 
                                      onClick={() => {
                                        setHighlightedListingId(r.target_id);
                                        setCurrentView('listings');
                                        // Auto scroll to top to see listings
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                      }}
                                      className="p-1.5 text-primary hover:bg-primary/10 rounded" 
                                      title="Xem tin đăng bị báo cáo"
                                    >
                                      <Eye className="w-5 h-5" />
                                    </button>
                                  )}
                                  {r.status === 'pending' && (
                                    <button onClick={() => handleUpdateReportStatus(r.id, 'resolved')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="Đánh dấu đã giải quyết">
                                      <CheckCircle className="w-5 h-5" />
                                    </button>
                                  )}
                                  <button onClick={() => handleDeleteReport(r.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Xóa báo cáo">
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* VIEW: OLD FALLBACK */}
            {(currentView !== 'listings' && currentView !== 'users' && currentView !== 'reports' && currentView !== 'dashboard') && (
              <div className="flex flex-col items-center justify-center h-full w-full text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                <BarChart className="w-16 h-16 mb-4 text-slate-200" />
                <h2 className="text-xl font-bold text-slate-600 mb-2">Tính năng đang phát triển</h2>
                <p>Khu vực này đang được xây dựng.</p>
              </div>
            )}

        </main>
      </div>

      {/* GLOBAL CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden"
          >
            <div className={`p-6 ${confirmModal.type === 'danger' ? 'bg-red-50' : 'bg-orange-50'}`}>
              <div className="flex items-center gap-3 mb-2">
                {confirmModal.type === 'danger' ? (
                  <Trash2 className="w-6 h-6 text-red-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                )}
                <h3 className="text-lg font-bold text-slate-900">{confirmModal.title}</h3>
              </div>
              <p className="text-slate-600 font-medium leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="p-4 bg-white flex justify-end gap-3">
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                className={`px-6 py-2 text-sm font-bold text-white rounded-xl shadow-lg transition-transform active:scale-95 ${
                  confirmModal.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-hover'
                }`}
              >
                Xác nhận
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
