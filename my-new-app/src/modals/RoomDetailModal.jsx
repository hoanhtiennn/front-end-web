import React, { useState, useEffect } from "react";
import { X, MapPin, Phone, User, CheckCircle2, Navigation, Image as ImageIcon } from "lucide-react";
import axios from "axios";

export default function RoomDetailModal({ roomId, onBack }) {
  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    const fetchRoomDetail = async () => {
      try {
        const token = localStorage.getItem("userToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`/api/posts/${roomId}`, { headers });
        setRoom(res.data);
      } catch (err) {
        console.error("Lỗi lấy chi tiết phòng:", err);
        console.error("CHI TIẾT LỖI TỪ BACKEND:", JSON.stringify(err.response?.data || err.message, null, 2));
        alert("Không thể tải thông tin phòng này. Báo lỗi: " + JSON.stringify(err.response?.data || err.message));
      } finally {
        setIsLoading(false);
      }
    };
    if (roomId) fetchRoomDetail();
  }, [roomId]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!room) return null;

  // Lấy danh sách ảnh thật, nếu không có lấy ảnh placeholder
  const images = room.images && room.images.length > 0 
    ? room.images.map(img => img.url || img.imageUrl)
    : ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200"];

  const landlord = room.user || {};
  const lat = room.latitude || 0;
  const lng = room.longitude || 0;
  const hasMapCoordinates = lat !== 0 && lng !== 0;

  // Lấy địa chỉ đầy đủ để làm đích đến cho Google Maps (Giúp Google Maps hiển thị đúng tên số nhà thay vì tự đoán từ Toạ độ)
  const fullAddressString = [room.address, room.ward, room.district, room.city].filter(Boolean).join(", ");
  const destinationParam = fullAddressString ? encodeURIComponent(fullAddressString) : `${lat},${lng}`;

  // Xử lý nút mở Google Maps Dẫn đường
  const handleOpenMaps = () => {
    if (!hasMapCoordinates && !fullAddressString) {
      alert("Tọa độ hoặc địa chỉ của phòng này chưa được cập nhật chính xác trên hệ thống!");
      return;
    }

    setIsGettingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsGettingLocation(false);
          const currentLat = position.coords.latitude;
          const currentLng = position.coords.longitude;
          // Mở Bản Đồ kèm ĐIỂM BẮT ĐẦU (origin) là Vị Trí Hiện Tại
          window.open(`https://www.google.com/maps/dir/?api=1&origin=${currentLat},${currentLng}&destination=${destinationParam}`, "_blank");
        },
        (error) => {
          setIsGettingLocation(false);
          // Fallback: Nếu họ từ chối quyền GPS, vẫn mở Google Map đặng họ tự chọn Vị trí xuất phát
          console.warn("Không lấy được GPS:", error.message);
          window.open(`https://www.google.com/maps/dir/?api=1&destination=${destinationParam}`, "_blank");
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setIsGettingLocation(false);
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destinationParam}`, "_blank");
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="relative w-full max-w-5xl max-h-[95vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-[fadeIn_0.3s_ease-out]">
        
        {/* Nút Đóng */}
        <button
          onClick={onBack}
          className="absolute top-4 right-4 z-20 p-2 text-gray-500 hover:text-white bg-white/80 hover:bg-red-500 rounded-full backdrop-blur-sm transition-all shadow-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Khung Trái: Hình Ảnh & Thông báo */}
        <div className="w-full md:w-[55%] flex flex-col bg-gray-100 overflow-y-auto custom-scrollbar">
          {/* Main Image View */}
          <div className="relative h-[300px] md:h-[400px] bg-black">
            <img 
              src={images[activeImageIndex]} 
              alt={room.title} 
              className="w-full h-full object-contain"
            />
            {/* Tag Badge */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              {room.status === 'ACTIVE' && (
                <span className="bg-green-500 px-3 py-1 text-xs font-bold text-white rounded text-shadow shadow-md">Đang cho thuê</span>
              )}
            </div>
            
            {/* Image Counter */}
            <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded-full flex items-center gap-2 text-white text-sm backdrop-blur-sm">
              <ImageIcon className="w-4 h-4" />
              <span>{activeImageIndex + 1} / {images.length}</span>
            </div>
          </div>
          
          {/* Sub Images List */}
          {images.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto bg-white border-b border-gray-200">
              {images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-blue-500 scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Chi tiết Bài Viết Nằm Dưới Ảnh */}
          <div className="p-6 md:p-8 bg-white grow">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm font-bold border border-blue-200">
                {room.roomType || "Phòng Trọ"}
              </span>
              <span className="text-gray-500 font-semibold text-sm">
                Đăng lúc: {room.createdAt ? new Date(room.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : "Gần đây"}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-4 leading-tight">
              {room.title}
            </h1>
            
            <div className="flex items-start gap-3 text-gray-600 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <MapPin className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[15px] font-medium leading-relaxed">
                {[room.address, room.ward, room.district, room.city].filter(Boolean).join(", ") || room.location?.address || "Chưa cập nhật địa chỉ"}
              </p>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-3 border-b pb-2">Thông tin mô tả</h3>
            <div className="text-gray-700 leading-relaxed whitespace-pre-line mb-8">
              {room.description || "Chủ trọ chưa cập nhật mô tả chi tiết."}
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Tiện ích kèm theo</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {room.amenities && room.amenities.length > 0 ? (
                room.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg text-sm text-gray-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    {amenity.type || amenity.name || amenity}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic text-sm">Không có tiện ích nào được liệt kê.</p>
              )}
            </div>
          </div>
        </div>

        {/* Khung Phải: Thông tin Giao dịch & Bản đồ (Sticky) */}
        <div className="w-full md:w-[45%] flex flex-col bg-slate-50 border-t md:border-t-0 md:border-l border-gray-200 max-h-full overflow-y-auto">
          
          <div className="p-6 md:p-8 flex flex-col gap-6">
            {/* Price Box */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-bl-full pointer-events-none" />
              <p className="text-gray-500 font-medium mb-1">Giá thuê (VND/Tháng)</p>
              <h2 className="text-4xl font-black text-blue-600 mb-2">
                {room.price ? room.price.toLocaleString('vi-VN') : "Thoả thuận"}
              </h2>
              <div className="w-full h-px bg-gray-100 my-4" />
              <div className="flex justify-between items-center px-4">
                <span className="text-gray-600 font-medium">Diện tích:</span>
                <span className="text-xl font-bold text-gray-900">{room.area ? room.area + " m²" : "--"}</span>
              </div>
            </div>

            {/* Landlord Box */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Thông tin liên hệ</h3>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm shrink-0 overflow-hidden">
                  {landlord.avatar ? (
                    <img src={landlord.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-blue-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{landlord.fullName || landlord.name || "Chủ Trọ Ẩn Danh"}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-bold uppercase border border-blue-100">
                      {landlord.role === 'LANDLORD' ? 'CHỦ TRỌ' : (landlord.role || 'THÀNH VIÊN')}
                    </span>
                    {landlord.plan && landlord.plan !== 'FREE' && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-xs font-bold uppercase border border-amber-200">
                        {landlord.plan}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => alert('Đang gọi cho: ' + (landlord.fullName || 'Chủ trọ'))}
                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 px-4 rounded-xl transition duration-200 shadow-[0_4px_14px_0_rgba(34,197,94,0.39)]"
              >
                <Phone className="w-5 h-5" />
                {landlord.phone || "09xxxx.xxxx (Chạm để gọi)"}
              </button>
            </div>

            {/* Google Maps Embed / Button */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex-1 flex flex-col">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Vị trí trọ trên Bản Đồ</h3>
              
              <div className="w-full bg-slate-100 rounded-xl overflow-hidden border border-gray-200 flex-1 min-h-[150px] relative flex flex-col items-center justify-center text-center p-6 mb-4">
                {hasMapCoordinates ? (
                  <>
                    <MapPin className="w-12 h-12 text-red-500 mb-2 opacity-80" />
                    <p className="text-sm font-medium text-gray-600">Đã cập nhật tọa độ GPS chuẩn xác</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-400 italic">Chủ trọ chưa ghim toạ độ cụ thể trên bản đồ.</p>
                  </>
                )}
              </div>

              <button 
                onClick={handleOpenMaps}
                disabled={isGettingLocation}
                className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 px-4 rounded-xl transition duration-200 ${
                  hasMapCoordinates 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] active:scale-95 disabled:opacity-70 disabled:cursor-wait' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isGettingLocation ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang tìm vị trí của bạn...
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5" />
                    Dẫn đường tới đây (Google Maps)
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
