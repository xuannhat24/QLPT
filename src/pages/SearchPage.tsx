import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Select } from '../components/Select';
import { supabase } from '../lib/supabase';
import { 
  Home, 
  MapPin, 
  Search, 
  ChevronDown, 
  Square, 
  User,
  LogOut,
  Filter,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart
} from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';

const districts = ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu', 'Cẩm Lệ', 'Hòa Vang'];

interface SearchPageProps {
  onNavigate: (page: string, params?: any) => void;
  user: SupabaseUser | null;
  onLogout: () => void;
  initialParams?: any;
}

export const SearchPage = ({ onNavigate, user, onLogout, initialParams }: SearchPageProps) => {
  const [realListings, setRealListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchLocation, setSearchLocation] = useState(initialParams?.location || '');
  const [priceRange, setPriceRange] = useState(initialParams?.price || 'all');
  const [roomType, setRoomType] = useState(initialParams?.type || 'all');
  const [sortBy, setSortBy] = useState('newest');
  
  const sortOptions = [
    { value: 'newest', label: 'Mới đăng nhất' },
    { value: 'price_asc', label: 'Giá: Thấp đến Cao' },
    { value: 'price_desc', label: 'Giá: Cao đến Thấp' },
    { value: 'area_desc', label: 'Diện tích lớn nhất' }
  ];

  useEffect(() => {
    fetchListings();
  }, [searchLocation, priceRange, roomType, sortBy]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('listings')
        .select('*')
        .eq('is_active', true)
        .eq('approval_status', 'approved');

      if (searchLocation && searchLocation !== '') {
        query = query.ilike('location', `%${searchLocation}%`);
      }

      if (priceRange && priceRange !== 'all') {
        if (priceRange === 'under2') query = query.lt('price', 2000000);
        else if (priceRange === '2to5') query = query.gte('price', 2000000).lte('price', 5000000);
        else if (priceRange === 'over5') query = query.gt('price', 5000000);
      }

      if (roomType && roomType !== 'all') {
        query = query.or(`title.ilike.%${roomType}%,type.ilike.%${roomType}%`);
      }

      if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
      else if (sortBy === 'price_asc') query = query.order('price', { ascending: true });
      else if (sortBy === 'price_desc') query = query.order('price', { ascending: false });
      else if (sortBy === 'area_desc') query = query.order('area', { ascending: false, nullsFirst: false });

      const { data, error } = await query.limit(50);
      if (error) throw error;
      setRealListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchLocation('');
    setPriceRange('all');
    setRoomType('all');
    setSortBy('newest');
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-slate-50">
      <Header user={user} onLogout={onLogout} onNavigate={onNavigate} activePath="search" />

      <main className="max-w-7xl mx-auto w-full px-4 py-6 md:px-10 flex-1">
        <div className="mb-6">
          <nav className="flex items-center text-xs md:text-sm text-slate-500 mb-2 gap-2">
            <span className="hover:text-primary cursor-pointer" onClick={() => onNavigate('home')}>Trang chủ</span>
            <span>/</span>
            <span className="text-slate-900 font-medium">Kết quả tìm kiếm</span>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display text-slate-900">
                Phòng trọ tại {searchLocation || 'Đà Nẵng'}
              </h1>
              <p className="text-slate-500 mt-1">Tìm thấy {realListings.length} kết quả phù hợp với tiêu chí của bạn</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-500 whitespace-nowrap">Sắp xếp:</span>
              <Select 
                options={sortOptions}
                value={sortBy}
                onChange={setSortBy}
                className="min-w-[170px]"
                dropdownWidth="w-56"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-72 shrink-0">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold font-display text-lg flex items-center gap-2 text-slate-900">
                    <Filter className="w-5 h-5 text-primary" />
                    Bộ lọc tìm kiếm
                  </h3>
                  <button onClick={resetFilters} className="text-xs font-bold text-slate-400 hover:text-primary transition-colors">
                    Xóa lọc
                  </button>
                </div>
                
                <div className="mb-6">
                  <label className="text-sm font-bold block mb-3 text-slate-700">Khu vực</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                     <label className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <input 
                          type="radio" 
                          name="location"
                          checked={searchLocation === ''}
                          onChange={() => setSearchLocation('')}
                          className="w-4 h-4 text-primary focus:ring-primary border-slate-300" 
                        />
                        <span className={`text-sm font-medium ${searchLocation === '' ? 'text-primary font-bold' : 'text-slate-600'} group-hover:text-primary transition-colors`}>
                          Tất cả khu vực
                        </span>
                      </label>
                    {districts.map(district => (
                      <label key={district} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <input 
                          type="radio" 
                          name="location"
                          checked={searchLocation === district}
                          onChange={() => setSearchLocation(district)}
                          className="w-4 h-4 text-primary focus:ring-primary border-slate-300" 
                        />
                        <span className={`text-sm font-medium ${searchLocation === district ? 'text-primary font-bold' : 'text-slate-600'} group-hover:text-primary transition-colors`}>
                          {district}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-sm font-bold block mb-3 text-slate-700">Khoảng giá</label>
                  <div className="space-y-2">
                    {[
                      { id: 'all', label: 'Tất cả mức giá' },
                      { id: 'under2', label: 'Dưới 2 triệu' },
                      { id: '2to5', label: 'Từ 2 - 5 triệu' },
                      { id: 'over5', label: 'Trên 5 triệu' },
                    ].map(price => (
                      <label key={price.id} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <input 
                          type="radio" 
                          name="price"
                          checked={priceRange === price.id}
                          onChange={() => setPriceRange(price.id)}
                          className="w-4 h-4 text-primary focus:ring-primary border-slate-300" 
                        />
                        <span className={`text-sm font-medium ${priceRange === price.id ? 'text-primary font-bold' : 'text-slate-600'} group-hover:text-primary transition-colors`}>
                          {price.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-sm font-bold block mb-3 text-slate-700">Loại phòng</label>
                  <div className="space-y-2">
                    {[
                      { id: 'all', label: 'Tất cả loại' },
                      { id: 'Phòng trọ', label: 'Phòng trọ' },
                      { id: 'Căn hộ', label: 'Căn hộ mini' },
                      { id: 'Nhà nguyên căn', label: 'Nhà nguyên căn' },
                    ].map(type => (
                      <label key={type.id} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <input 
                          type="radio"
                          name="type" 
                          checked={roomType === type.id}
                          onChange={() => setRoomType(type.id)}
                          className="w-4 h-4 text-primary focus:ring-primary border-slate-300" 
                        />
                        <span className={`text-sm font-medium ${roomType === type.id ? 'text-primary font-bold' : 'text-slate-600'} group-hover:text-primary transition-colors`}>
                          {type.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-sm font-bold block mb-3 text-slate-700 opacity-50">Tiện ích (Sắp ra mắt)</label>
                  <div className="grid grid-cols-1 gap-2 opacity-50 pointer-events-none">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="rounded text-primary focus:ring-primary border-slate-300" />
                      <span className="text-sm text-slate-600">Máy lạnh</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="rounded text-primary focus:ring-primary border-slate-300" />
                      <span className="text-sm text-slate-600">Wifi miễn phí</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="grid grid-cols-1 gap-6">
              
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl h-48 animate-pulse border border-slate-100 flex p-2">
                    <div className="w-64 h-full bg-slate-100 rounded-xl"></div>
                    <div className="flex-1 p-4 space-y-4">
                      <div className="h-6 bg-slate-100 rounded-md w-3/4"></div>
                      <div className="h-4 bg-slate-100 rounded-md w-1/4"></div>
                      <div className="h-10 bg-slate-100 rounded-md w-full"></div>
                    </div>
                  </div>
                ))
              ) : realListings.length > 0 ? (
                realListings.map((item) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-primary/30 flex flex-col sm:flex-row hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="relative w-full sm:w-64 h-56 sm:h-auto shrink-0 p-2">
                      <div className="w-full h-full rounded-xl overflow-hidden relative">
                        <img 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                          src={item.image_url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800'}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                        />
                        {new Date(item.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 && (
                          <div className="absolute top-2 left-2 bg-primary text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-md">Mới</div>
                        )}
                        <button className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur rounded-xl text-slate-400 hover:text-red-500 hover:scale-110 transition-all shadow-sm">
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-5 flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                          <h3 className="font-bold font-display text-lg text-slate-900 leading-tight group-hover:text-primary transition-colors line-clamp-2 sm:line-clamp-1 pr-4">
                            {item.title}
                          </h3>
                          <span className="text-primary font-black text-xl whitespace-nowrap bg-primary/5 px-3 py-1 rounded-xl">
                            {Number(item.price).toLocaleString()}đ<span className="text-xs text-slate-400 font-bold ml-1">/tháng</span>
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-4">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="line-clamp-1 font-medium">{item.location || 'Đà Nẵng'}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <Square className="w-4 h-4 text-slate-400" />
                            <span>{item.area || '0'} m²</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Home className="w-4 h-4 text-slate-400" />
                            <span>{item.type || 'Phòng trọ'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Check className="w-4 h-4" />
                            <span>Đã kiểm duyệt</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                            <img className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Avatar" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-900">Chủ trọ</span>
                            <span className="text-[10px] font-bold text-slate-400">Đăng {new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                        <button 
                          className="text-sm font-black text-white bg-slate-900 hover:bg-primary px-5 py-2.5 rounded-xl transition-all shadow-md group-hover:shadow-primary/20"
                          onClick={() => onNavigate('listing-detail', { id: item.id })}
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <Search className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold font-display text-slate-900 mb-2">Không tìm thấy kết quả</h3>
                  <p className="text-slate-500 mb-6 max-w-sm">Rất tiếc, không có phòng trọ nào khớp với tiêu chí.</p>
                  <button onClick={resetFilters} className="bg-primary/10 text-primary font-bold px-6 py-3 rounded-xl hover:bg-primary hover:text-white transition-all">
                    Xóa tất cả bộ lọc
                  </button>
                </div>
              )}

              {realListings.length > 0 && (
                <div className="flex justify-center py-8">
                  <nav className="flex items-center gap-2">
                    <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:border-primary hover:text-primary transition-all shadow-sm">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-white font-black shadow-lg shadow-orange-100">1</button>
                    <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:border-primary hover:text-primary transition-all shadow-sm">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
