import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { 
  Home, 
  Search, 
  MapPin, 
  ArrowRight, 
  Square, 
  Wind, 
  DoorOpen,
  Mail,
  Phone,
  Facebook,
  Instagram,
  Twitter,
  User,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { listings, areas } from '../constants';
import { User as SupabaseUser } from '@supabase/supabase-js';

export const HomePage = ({ 
  onNavigate, 
  user, 
  onLogout 
}: { 
  onNavigate: (page: string, params?: any) => void,
  user: SupabaseUser | null,
  onLogout: () => void
}) => {
  const [realListings, setRealListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchLocation, setSearchLocation] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const [roomType, setRoomType] = useState('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const districts = ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu', 'Cẩm Lệ', 'Hòa Vang'];

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      setRealListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    onNavigate('search', {
      location: searchLocation,
      price: priceRange,
      type: roomType
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <Header user={user} onLogout={onLogout} onNavigate={onNavigate} activePath="home" />

      <main>
        {/* Hero Section */}
        <section className="relative w-full h-[600px] flex items-center justify-center px-4 md:px-8 py-8">
          <div className="absolute inset-0 z-0 overflow-hidden rounded-[32px] mx-4 my-4 md:mx-8 md:my-8 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"></div>
            <img 
              alt="Hero Background" 
              className="w-full h-full object-cover" 
              src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=1920"
              referrerPolicy="no-referrer"
            />
          </div>
          
          <div className="relative z-10 max-w-4xl w-full px-4 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight font-display"
            >
              Tìm phòng trọ ưng ý cùng <span className="text-primary block mt-2">Trọ Pro</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-slate-200 mb-10 max-w-2xl mx-auto"
            >
              Hàng nghìn phòng trọ sạch đẹp, giá rẻ và đầy đủ tiện nghi đang chờ đón bạn.
            </motion.p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-2 md:p-3 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2"
            >
              {/* Location Selector */}
              <div
                className="flex-1 flex items-center px-4 border-b md:border-b-0 md:border-r border-slate-200 relative cursor-pointer group py-2"
                onClick={() => {
                  setShowSuggestions(!showSuggestions);
                  setShowPriceDropdown(false);
                  setShowTypeDropdown(false);
                }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mr-3 group-hover:scale-110 transition-transform">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Địa điểm</p>
                  <p className="text-sm font-bold text-slate-700 truncate">
                    {searchLocation || 'Tất cả khu vực'}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showSuggestions ? '' : 'rotate-180'}`} />

                {/* Suggestions Dropdown */}
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-50 overflow-hidden"
                  >
                    <p className="px-5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">Khu vực Đà Nẵng</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchLocation('');
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-5 py-3 text-sm font-bold text-slate-600 hover:bg-primary/5 hover:text-primary transition-colors flex items-center gap-3"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                      Tất cả khu vực
                    </button>
                    {districts.map((district) => (
                      <button
                        key={district}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchLocation(district);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-5 py-3 text-sm font-bold text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors flex items-center gap-3"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${searchLocation === district ? 'bg-primary' : 'bg-slate-300'}`}></div>
                        {district}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Price Selector */}
              <div
                className="flex-1 flex items-center px-4 border-b md:border-b-0 md:border-r border-slate-200 py-2 group relative cursor-pointer"
                onClick={() => {
                  setShowPriceDropdown(!showPriceDropdown);
                  setShowSuggestions(false);
                  setShowTypeDropdown(false);
                }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mr-3 group-hover:scale-110 transition-transform">
                  <Search className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Khoảng giá</p>
                  <p className="text-sm font-bold text-slate-700 truncate">
                    {priceRange === 'all' ? 'Tất cả mức giá' :
                     priceRange === 'under2' ? 'Dưới 2 triệu' :
                     priceRange === '2to5' ? '2 - 5 triệu' : 'Trên 5 triệu'}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showPriceDropdown ? '' : 'rotate-180'}`} />

                {/* Price Dropdown */}
                {showPriceDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-50 overflow-hidden"
                  >
                    {[
                      { id: 'all', label: 'Tất cả mức giá' },
                      { id: 'under2', label: 'Dưới 2 triệu' },
                      { id: '2to5', label: '2 - 5 triệu' },
                      { id: 'over5', label: 'Trên 5 triệu' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPriceRange(item.id);
                          setShowPriceDropdown(false);
                        }}
                        className="w-full text-left px-5 py-3 text-sm font-bold text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors flex items-center gap-3"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${priceRange === item.id ? 'bg-primary' : 'bg-slate-300'}`}></div>
                        {item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Type Selector */}
              <div
                className="flex-1 flex items-center px-4 py-2 group relative cursor-pointer"
                onClick={() => {
                  setShowTypeDropdown(!showTypeDropdown);
                  setShowSuggestions(false);
                  setShowPriceDropdown(false);
                }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mr-3 group-hover:scale-110 transition-transform">
                  <Home className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loại phòng</p>
                  <p className="text-sm font-bold text-slate-700 truncate">
                    {roomType === 'all' ? 'Tất cả loại' : roomType}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showTypeDropdown ? '' : 'rotate-180'}`} />

                {/* Type Dropdown */}
                {showTypeDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-50 overflow-hidden"
                  >
                    {[
                      { id: 'all', label: 'Tất cả loại' },
                      { id: 'Phòng trọ', label: 'Phòng trọ' },
                      { id: 'Căn hộ', label: 'Căn hộ mini' },
                      { id: 'Nhà nguyên căn', label: 'Nhà nguyên căn' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setRoomType(item.id);
                          setShowTypeDropdown(false);
                        }}
                        className="w-full text-left px-5 py-3 text-sm font-bold text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors flex items-center gap-3"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${roomType === item.id ? 'bg-primary' : 'bg-slate-300'}`}></div>
                        {item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              <button
                onClick={handleSearch}
                className="bg-primary text-white font-black uppercase tracking-widest text-xs px-10 py-4 rounded-xl hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-xl shadow-orange-100 active:scale-95"
              >
                <Search className="w-4 h-4" />
                Tìm kiếm
              </button>
            </motion.div>
          </div>
        </section>

        {/* Featured Section */}
        <section id="new-listings" className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 font-display">Phòng trọ mới đăng</h2>
              <p className="text-slate-500 mt-1">Cập nhật những tin đăng mới nhất hàng ngày</p>
            </div>
            <a className="text-primary font-semibold flex items-center gap-1 hover:underline cursor-pointer" onClick={(e) => { e.preventDefault(); onNavigate('search'); }}>
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-slate-50 rounded-xl aspect-[4/3] animate-pulse"></div>
              ))
            ) : realListings.length > 0 ? (
              realListings.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -5 }}
                  onClick={() => onNavigate('listing-detail', { id: item.id })}
                  className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-100 cursor-pointer"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      src={item.image_url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800'}
                      referrerPolicy="no-referrer"
                    />
                    {new Date(item.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 && (
                      <div className="absolute top-2 left-2 text-white text-[10px] font-black px-2 py-1 rounded bg-primary uppercase tracking-widest">MỚI</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-black text-slate-900 line-clamp-1 font-display">{item.title}</h3>
                    <div className="flex items-center text-primary font-black my-2">
                      <span className="text-lg">{Number(item.price).toLocaleString()}đ</span>
                      <span className="text-xs font-bold text-slate-400 ml-1">/tháng</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1">
                        <Square className="w-3 h-3" />
                        {item.area || '0'}m²
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.location || 'Đà Nẵng'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center">
                <p className="text-slate-400 font-bold">Chưa có bài đăng nào.</p>
              </div>
            )}
          </div>
        </section>

        {/* Popular Areas */}
        <section className="bg-slate-100 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4 font-display">Khu vực nổi bật</h2>
              <p className="text-slate-500">Khám phá phòng trọ tại các quận huyện nhộn nhịp nhất</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {areas.map((area) => (
                <a key={area.name} className="relative h-64 rounded-xl overflow-hidden group cursor-pointer" href="#">
                  <img 
                    alt={area.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    src={area.image}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="text-lg font-bold font-display">{area.name}</p>
                    <p className="text-xs opacity-80">{area.count} tin đăng</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
