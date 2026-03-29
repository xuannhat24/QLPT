import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { User } from '@supabase/supabase-js';
import {
  MapPin,
  Home,
  Maximize,
  Banknote,
  Phone,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Droplets,
  Wifi,
  Wind,
  ParkingCircle,
  Cctv,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default marker icon (broken by bundlers)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface ListingDetailPageProps {
  onNavigate: (page: string, params?: any) => void;
  user: User | null;
  onLogout: () => void;
  params?: any;
}

export const ListingDetailPage = ({ onNavigate, user, onLogout, params }: ListingDetailPageProps) => {
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [messagingAction, setMessagingAction] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [mapLoading, setMapLoading] = useState(false);

  // Report State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  const { showToast } = useToast();

  const handleStartMessage = async () => {
    // Guard: yêu cầu đăng nhập trước
    if (!user) {
      showToast('Vui lòng đăng nhập để liên hệ chủ nhà!', 'warning');
      onNavigate('login');
      return;
    }

    if (!listing?.owner_id) {
      showToast('Không tìm thấy thông tin chủ trọ. Vui lòng thử lại.', 'error');
      return;
    }

    // Không tự nhắn tin với chính mình
    if (listing.owner_id === user.id) {
      showToast('Bạn là chủ của phòng này.', 'warning');
      return;
    }

    setMessagingAction(true);

    try {
      // 1. Check if conversation already exists between this tenant and this landlord
      const { data: existingConvs, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('tenant_id', user.id)
        .eq('landlord_id', listing.owner_id);

      if (fetchError) throw fetchError;

      let conversationId: string | null = null;

      if (existingConvs && existingConvs.length > 0) {
        conversationId = existingConvs[0].id;
      } else {
        // 2. Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            tenant_id: user.id,
            landlord_id: listing.owner_id
          })
          .select('id')
          .single();

        if (createError) throw createError;
        if (newConv) conversationId = newConv.id;
      }

      if (conversationId) {
        // 3. Send automated initial message (chỉ nếu conversation mới)
        if (!existingConvs || existingConvs.length === 0) {
          const messageContent = `Xin chào! Tôi đang quan tâm đến phòng: ${listing.title}`;
          await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              sender_id: user.id,
              content: messageContent
            });
          await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);
        }

        // 4. Lấy role của user để điều hướng đúng Portal
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        const role = profile?.role || 'tenant';
        const targetPage = (role === 'landlord' || role === 'admin') ? 'manage' : 'tenant';

        showToast('Đang mở cuộc trò chuyện...', 'success');
        onNavigate(targetPage, { tab: 'messages', activeChat: conversationId });
      }
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      showToast('Lỗi: ' + (error?.message || 'Không thể bắt đầu trò chuyện.'), 'error');
    } finally {
      setMessagingAction(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!user) {
      showToast('Vui lòng đăng nhập để báo cáo!', 'warning');
      onNavigate('login');
      return;
    }

    if (!reportReason.trim()) {
      showToast('Vui lòng nhập lý do báo cáo.', 'error');
      return;
    }

    setIsReporting(true);
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          target_id: listing.id,
          target_type: 'listing',
          reason: reportReason,
          status: 'pending'
        });

      if (error) throw error;

      showToast('Báo cáo đã được gửi cho quản trị viên xử lý.', 'success');
      setShowReportModal(false);
      setReportReason('');
    } catch (error: any) {
      console.error('Error submitting report:', error);
      showToast('Lỗi khi gửi báo cáo: ' + error.message, 'error');
    } finally {
      setIsReporting(false);
    }
  };


  // Giả lập dữ liệu nếu chưa có trên Supabase
  const mockListing = {
    id: params?.id || '1',
    title: 'Phòng trọ cao cấp, full nội thất, giờ giấc tự do',
    price: 3500000,
    deposit: 3500000,
    area: 25,
    type: 'Phòng trọ',
    location: 'Quận 7, TP. Hồ Chí Minh',
    street: 'Nguyễn Văn Linh',
    description: 'Phòng mới xây, dọn vào ở ngay. Khu vực an ninh, yên tĩnh, phù hợp cho sinh viên và người đi làm. Gần các trường ĐH Tôn Đức Thắng, RMIT. Có camera an ninh 24/7, khóa vân tay, chỗ để xe rộng rãi miễn phí. Không chung chủ, giờ giấc tự do.',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1de2d93688?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80'
    ],
    amenities: ['Máy lạnh', 'Tủ lạnh', 'Máy giặt chung', 'Wifi miễn phí', 'Chỗ để xe', 'Camera an ninh'],
    electricity_price: 3500,
    water_price: 20000,
    service_fee: 150000,
    landlord: {
      name: 'Nguyễn Văn A',
      phone: '0901234567',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
      joinDate: 'Tháng 1, 2023'
    }
  };

  useEffect(() => {
    // Tạm thời dùng mock data, sau này thay bằng query Supabase
    const fetchListing = async () => {
      setLoading(true);
      try {
        if (params?.id) {
          const { data, error } = await supabase
            .from('listings')
            .select('*')
            .eq('id', params.id)
            .single();

          let landlordData = mockListing.landlord;

          if (data && data.owner_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.owner_id)
              .single();

            if (profile) {
              landlordData = {
                name: profile.full_name || mockListing.landlord.name,
                phone: profile.phone || mockListing.landlord.phone,
                avatar: profile.avatar_url || mockListing.landlord.avatar,
                joinDate: profile.created_at
                  ? `Tháng ${new Date(profile.created_at).getMonth() + 1}, ${new Date(profile.created_at).getFullYear()}`
                  : mockListing.landlord.joinDate
              };
            }
          }

          if (data && !error) {
            // Merge với mock data nếu database thiếu cột mới
            setListing({
              ...mockListing,
              ...data,
              landlord: landlordData,
              images: data.images?.length > 0 ? data.images : mockListing.images,
              amenities: data.amenities?.length > 0 ? data.amenities : mockListing.amenities,
              electricity_price: data.electricity_price || mockListing.electricity_price,
              water_price: data.water_price || mockListing.water_price,
              deposit: data.deposit || mockListing.deposit,
              service_fee: data.service_fee || mockListing.service_fee
            });
          } else {
            setListing(mockListing);
          }
        } else {
          setListing(mockListing);
        }
      } catch (err) {
        console.error(err);
        setListing(mockListing);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [params?.id]);

  // Chuẩn hóa địa chỉ hẻm/kiệt Việt Nam
  // Ví dụ: "k151/77 Âu Cơ" → "Âu Cơ", "Kiệt 67 Hùng Vương" → "Hùng Vương"
  const normalizeStreet = (street: string): string => {
    if (!street) return '';
    return street
      // Loại bỏ: k151/77, K45/22, 123/45/6 (số nhà hẻm)
      .replace(/^[kK]\d+[\/\d]*/i, '')
      // Loại bỏ: Kiệt 67, Hẻm 123, Ngõ 45
      .replace(/^(kiệt|hẻm|ngõ|ngách|hẻm\s*số|ngõ\s*số)\s*\d+[\/\d]*/i, '')
      // Loại bỏ: 123/45 ở đầu (số nhà dạng hẻm)
      .replace(/^\d+[\/]\d+[\/\d]*/, '')
      // Loại bỏ: số nhà đơn giản ở đầu (ví dụ: "77 Âu Cơ" → "Âu Cơ")
      .replace(/^\d+\s+/, '')
      .trim();
  };

  const fetchGeocode = async (query: string): Promise<[number, number] | null> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'vi' } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    }
    return null;
  };

  // Geocoding: convert address to coordinates via Nominatim (3-tier fallback)
  useEffect(() => {
    if (!listing) return;

    const geocodeAddress = async () => {
      // Ưu tiên dùng lat/lng có sẵn trong DB
      if (listing.latitude && listing.longitude) {
        setMapCenter([Number(listing.latitude), Number(listing.longitude)]);
        return;
      }

      if (!listing.street && !listing.location) return;

      setMapLoading(true);

      try {
        // Lần 1: Thử với địa chỉ gốc đầy đủ
        const fullParts = [listing.street, listing.location, 'Đà Nẵng', 'Việt Nam'].filter(Boolean);
        let result = await fetchGeocode(fullParts.join(', '));

        // Lần 2: Nếu thất bại, thử với tên đường đã chuẩn hóa (bỏ số hẻm/kiệt)
        if (!result && listing.street) {
          const cleanStreet = normalizeStreet(listing.street);
          if (cleanStreet && cleanStreet !== listing.street) {
            const cleanParts = [cleanStreet, listing.location, 'Đà Nẵng', 'Việt Nam'].filter(Boolean);
            result = await fetchGeocode(cleanParts.join(', '));
          }
        }

        // Lần 3: Nếu vẫn thất bại, chỉ dùng quận/huyện
        if (!result && listing.location) {
          result = await fetchGeocode(`${listing.location}, Đà Nẵng, Việt Nam`);
        }

        if (result) {
          setMapCenter(result);
        }
      } finally {
        setMapLoading(false);
      }
    };

    geocodeAddress();
  }, [listing]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!listing) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} onLogout={onLogout} onNavigate={onNavigate as any} activePath="listing-detail" />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-6 flex items-center space-x-2">
          <button onClick={() => onNavigate('home')} className="hover:text-indigo-600">Trang chủ</button>
          <span>/</span>
          <button onClick={() => onNavigate('search')} className="hover:text-indigo-600">Phòng trọ</button>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate">{listing.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-8">

            {/* Image Gallery */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-100 mb-4 relative">
                <img
                  src={listing.images[activeImage]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-indigo-700 flex items-center shadow-sm">
                  <ShieldCheck className="w-4 h-4 mr-1" />
                  Tin đã xác thực
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {listing.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-indigo-600 opacity-100' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Key Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                {listing.title}
              </h1>
              <div className="flex items-start text-gray-600 mb-6">
                <MapPin className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-gray-400" />
                <span>{listing.street ? `${listing.street}, ` : ''}{listing.location}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y border-gray-100">
                <div>
                  <div className="text-sm text-gray-500 mb-1 flex items-center"><Banknote className="w-4 h-4 mr-1" />Mức giá</div>
                  <div className="font-bold text-red-600">{new Intl.NumberFormat('vi-VN').format(listing.price)} ₫/tháng</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1 flex items-center"><Maximize className="w-4 h-4 mr-1" />Diện tích</div>
                  <div className="font-semibold text-gray-900">{listing.area} m²</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1 flex items-center"><Home className="w-4 h-4 mr-1" />Loại phòng</div>
                  <div className="font-semibold text-gray-900">{listing.type || 'Phòng trọ'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1 flex items-center"><ShieldCheck className="w-4 h-4 mr-1" />Tiền cọc</div>
                  <div className="font-semibold text-gray-900">{new Intl.NumberFormat('vi-VN').format(listing.deposit)} ₫</div>
                </div>
              </div>
            </div>

            {/* Secondary Costs (AI Risk Analysis Hook) */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 shadow-sm border border-indigo-100 relative overflow-hidden">
              {/* Decorative background element */}
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>

              <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-indigo-600" />
                Chi phí phụ & Phân tích rủi ro
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
                <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-white">
                  <div className="flex items-center text-gray-600 text-sm mb-2">
                    <Zap className="w-4 h-4 mr-2 text-yellow-500" /> Điện
                  </div>
                  <div className="font-semibold text-gray-900">{new Intl.NumberFormat('vi-VN').format(listing.electricity_price)} ₫/kwh</div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-white">
                  <div className="flex items-center text-gray-600 text-sm mb-2">
                    <Droplets className="w-4 h-4 mr-2 text-blue-500" /> Nước
                  </div>
                  <div className="font-semibold text-gray-900">{new Intl.NumberFormat('vi-VN').format(listing.water_price)} ₫/khối</div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-white">
                  <div className="flex items-center text-gray-600 text-sm mb-2">
                    <ShieldCheck className="w-4 h-4 mr-2 text-green-500" /> Dịch vụ
                  </div>
                  <div className="font-semibold text-gray-900">{new Intl.NumberFormat('vi-VN').format(listing.service_fee)} ₫/tháng</div>
                </div>
              </div>

              {/* Placeholder for future AI analysis visualization */}
              <div className="mt-4 p-3 bg-white/60 rounded-lg text-sm text-indigo-800 flex items-start">
                <div className="bg-indigo-100 p-1.5 rounded-md mr-3 flex-shrink-0">
                  <Zap className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <strong>AI Đánh giá:</strong> Mức phi tiêu chuẩn khu vực này là 3.500₫/kwh. Mức giá nhà cung cấp đưa ra là hợp lý và ít rủi ro biến động.
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin mô tả</h3>
              <div className="text-gray-600 whitespace-pre-line leading-relaxed">
                {listing.description}
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Tiện ích nổi bật</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {listing.amenities.map((item: string, idx: number) => (
                  <div key={idx} className="flex items-center text-gray-700">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Map Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-indigo-600" />
                Vị trí trên bản đồ
              </h3>
              {mapLoading ? (
                <div className="flex items-center justify-center h-[350px] bg-gray-50 rounded-xl">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <span className="ml-3 text-gray-500">Đang tải bản đồ...</span>
                </div>
              ) : mapCenter ? (
                <MapContainer
                  center={mapCenter}
                  zoom={16}
                  scrollWheelZoom={false}
                  className="rounded-xl"
                  style={{ height: '350px', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={mapCenter}>
                    <Popup>
                      <div className="text-center">
                        <strong className="block text-sm">{listing.title}</strong>
                        <span className="text-xs text-gray-500">
                          {listing.street ? `${listing.street}, ` : ''}{listing.location}
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] bg-gray-50 rounded-xl">
                  <div className="text-center text-gray-400">
                    <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Không xác định được vị trí trên bản đồ</p>
                  </div>
                </div>
              )}
              {mapCenter && (
                <p className="mt-3 text-xs text-gray-400 text-center">
                  📍 {listing.street ? `${listing.street}, ` : ''}{listing.location}{listing.location ? ', Đà Nẵng' : ''}
                </p>
              )}
            </div>

          </div>

          {/* Sidebar - Right Side */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">

              {/* Landlord Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-indigo-100 mb-4">
                  <img src={listing.landlord.avatar} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{listing.landlord.name}</h3>
                <p className="text-sm text-gray-500 mb-4">Tham gia từ {listing.landlord.joinDate}</p>

                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors">
                    <Phone className="w-5 h-5 mr-2" />
                    {listing.landlord.phone}
                  </button>
                  <button
                    onClick={handleStartMessage}
                    disabled={messagingAction}
                    className="w-full flex items-center justify-center py-3 px-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    {messagingAction ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-700 border-t-transparent"></div>
                    ) : (
                      <>
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Nhắn tin
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Safety Tips */}
              <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
                <h4 className="flex items-center font-bold text-orange-800 mb-3">
                  <ShieldAlert className="w-5 h-5 mr-2" />
                  Lưu ý an toàn
                </h4>
                <ul className="text-sm text-orange-800/80 space-y-2 list-disc list-inside">
                  <li>Đọc kỹ hợp đồng trước khi ký.</li>
                </ul>
              </div>

              {/* Report Button */}
              <button
                onClick={() => user ? setShowReportModal(true) : onNavigate('login')}
                className="w-full flex items-center justify-center py-2 text-sm text-gray-500 hover:text-red-600 transition-colors font-medium border border-gray-200 border-dashed rounded-xl hover:border-red-200 hover:bg-red-50"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Báo cáo bài đăng này
              </button>

            </div>
          </div>
        </div>
      </main>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
                Báo cáo vi phạm
              </h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Hãy cho chúng tôi biết vấn đề bạn gặp phải với tin đăng này. Chúng tôi sẽ xem xét và xử lý sớm nhất có thể.
              </p>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Lý do báo cáo</label>
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[120px]"
                  placeholder="Ví dụ: Thông tin không đúng sự thật, lừa đảo, hình ảnh không đúng..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={isReporting}
                className="px-6 py-2 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center shadow-md shadow-red-200"
              >
                {isReporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Gửi báo cáo
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

// Simple Mock component to fix Missing Icon import
const ShieldAlert = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
);
