import { useState } from "react";

const SearchBar = ({ searchTerm, setSearchTerm, onLocationClick, onSearch, isLocating, filters, setFilters }) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
  <section className="container mx-auto px-4 -mt-16 md:-mt-20 relative z-20 mb-16">
    <div className="max-w-4xl mx-auto flex flex-col gap-3 bg-white p-3 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-gray-100 transition-all duration-300">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex grow items-center gap-3 bg-gray-50/50 px-5 py-3 rounded-full focus-within:bg-white focus-within:ring-2 focus-within:ring-rose-500/50 transition-all duration-300">
          <span className="text-xl">📍</span>
          <input 
            type="text" 
            placeholder="Bạn muốn tìm phòng ở đâu?" 
            className="w-full bg-transparent outline-none text-gray-900 font-semibold placeholder-gray-400 text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <button 
            type="button"
            onClick={() => setShowFilters(!showFilters)} 
            className="flex items-center justify-center gap-2 rounded-2xl md:rounded-full bg-orange-50 px-6 py-4 text-orange-600 hover:bg-orange-100 hover:text-orange-700 font-bold transition-colors"
          >
            <span className="text-lg">⚙️</span>
            <span className="hidden md:inline">Bộ lọc</span>
          </button>
          <button 
            type="button"
            onClick={onLocationClick} 
            disabled={isLocating}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-2xl md:rounded-full bg-gray-100 px-6 py-4 text-gray-700 hover:bg-gray-200 hover:text-gray-900 font-bold transition-colors disabled:opacity-50"
          >
            <span className="text-lg">🎯</span>
            <span>{isLocating ? "Đang quét..." : "Gần tôi"}</span>
          </button>
          <button 
            type="button"
            onClick={onSearch}
            className="hidden md:flex items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-10 py-4 text-base font-black text-white hover:shadow-lg hover:shadow-rose-500/40 hover:scale-105 transition-all duration-300"
          >
            🔍 TÌM KIẾM
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-col gap-4 px-2 py-3 border-t border-gray-100 mt-2 fade-in">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Loại phòng</label>
              <select 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                value={filters?.roomType || ""}
                onChange={(e) => setFilters({ ...filters, roomType: e.target.value })}
              >
                <option value="">Tất cả các loại</option>
                <option value="PHONG_TRO">Phòng trọ</option>
                <option value="PHONG_TRO_GAC">Phòng trọ có gác</option>
                <option value="CHUNG_CU_MINI">Chung cư mini</option>
                <option value="NHA_NGUYEN_CAN">Nhà nguyên căn</option>
                <option value="PHONG_GEP">Phòng ghép</option>
                <option value="KI_TUC_XA">Kí túc xá</option>
              </select>
            </div>
            
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Mức giá</label>
              <select 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                value={`${filters?.minPrice || 0}-${filters?.maxPrice || ""}`}
                onChange={(e) => {
                  const [min, max] = e.target.value.split("-");
                  setFilters({ ...filters, minPrice: min !== "0" ? min : "", maxPrice: max || "" });
                }}
              >
                <option value="0-">Tất cả các mức giá</option>
                <option value="0-2000000">Dưới 2 triệu</option>
                <option value="2000000-4000000">Từ 2 - 4 triệu</option>
                <option value="4000000-7000000">Từ 4 - 7 triệu</option>
                <option value="7000000-">Trên 7 triệu</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-50 pt-3">
            <label className="text-xs font-bold text-gray-500 uppercase">Tiện ích</label>
            <div className="flex flex-wrap gap-2">
              {["Máy lạnh", "Tủ lạnh", "Giường", "Wifi", "Máy giặt", "Chỗ để xe", "Bếp", "Thang máy", "Tự do giờ giấc"].map(amenity => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => {
                    const current = filters?.amenities || [];
                    const newAmenities = current.includes(amenity)
                      ? current.filter(a => a !== amenity)
                      : [...current, amenity];
                    setFilters({ ...filters, amenities: newAmenities });
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${
                    (filters?.amenities || []).includes(amenity)
                      ? "bg-rose-50 border-rose-400 text-rose-700 shadow-sm"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {(filters?.amenities || []).includes(amenity) ? "✓ " : ""}{amenity}
                </button>
              ))}
            </div>
          </div>
          
          <button type="button" onClick={onSearch} className="md:hidden mt-2 flex items-center justify-center rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-6 py-3 text-sm font-black text-white hover:shadow-lg transition-all">
            ÁP DỤNG LỌC
          </button>
        </div>
      )}
    </div>
  </section>
  );
};

export default SearchBar;