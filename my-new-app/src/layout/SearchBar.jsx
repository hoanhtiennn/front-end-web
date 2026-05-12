import { useState } from "react";
import { MapPin, Settings2, Target, Search } from "lucide-react";

/**
 * Component thanh tìm kiếm trung tâm, bao gồm:
 * - Tìm kiếm theo địa chỉ/từ khóa
 * - Nút "Bộ lọc" xổ xuống chọn mức giá, loại phòng, tiện ích
 * - Nút "Gần tôi" quét vị trí GPS với thanh kéo chọn bán kính
 */
const SearchBar = ({
  searchTerm,
  setSearchTerm,
  onLocationClick,
  onSearch,
  isLocating,
  filters,
  setFilters,
  searchRadius,
  setSearchRadius,
  onRadiusChange,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <section className="container mx-auto px-4 -mt-16 md:-mt-12 relative z-20 mb-8">
      <div
        className={`max-w-4xl mx-auto flex flex-col gap-2 bg-white p-2 md:p-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 ${showFilters ? "rounded-3xl" : "rounded-3xl md:rounded-full"}`}
      >
        <div className="flex flex-col md:flex-row items-center gap-2">
          <div className="flex grow items-center gap-3 w-full px-4 py-2 rounded-full focus-within:bg-gray-50 transition-all duration-300">
            <MapPin className="text-gray-400 shrink-0" size={20} />
            <input
              type="text"
              placeholder="Bạn muốn tìm phòng ở đâu?"
              className="w-full bg-transparent outline-none text-gray-900 font-semibold placeholder-gray-400 text-sm md:text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap md:flex-nowrap items-center justify-center md:justify-end gap-2 w-full md:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 shrink-0 rounded-full px-5 py-2.5 font-bold transition-colors ${showFilters ? "bg-rose-100 text-rose-600" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}
            >
              <Settings2 size={16} />
              <span className="text-sm">Bộ lọc</span>
            </button>

            <div
              className={`flex items-center gap-2 shrink-0 rounded-full border border-gray-200 bg-white p-1 pr-4 shadow-sm transition-all hover:border-gray-300 ${isLocating ? "opacity-50" : ""}`}
            >
              <button
                type="button"
                onClick={() => onLocationClick(searchRadius)}
                disabled={isLocating}
                className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center shrink-0 ${isLocating ? "bg-rose-100 text-rose-600" : "bg-rose-50 text-rose-500 hover:bg-rose-100"}`}
                title="Tìm quanh đây"
              >
                <Target
                  size={16}
                  className={isLocating ? "animate-pulse" : ""}
                />
              </button>
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                {isLocating ? "Đang quét" : "Gần tôi"}
              </span>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                onMouseUp={(e) => onRadiusChange?.(Number(e.target.value))}
                onTouchEnd={(e) => onRadiusChange?.(Number(e.target.value))}
                disabled={isLocating}
                className="w-20 md:w-24 lg:w-32 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-rose-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-rose-500 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:shadow-md"
              />
              <span className="text-sm font-bold text-rose-500 text-right min-w-[28px]">
                {searchRadius} km
              </span>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-col gap-4 px-4 py-3 border-t border-gray-100 mt-2 fade-in">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Loại phòng
                </label>
                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  value={filters?.roomType || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, roomType: e.target.value })
                  }
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
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Mức giá
                </label>
                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  value={`${filters?.minPrice || 0}-${filters?.maxPrice || ""}`}
                  onChange={(e) => {
                    const [min, max] = e.target.value.split("-");
                    setFilters({
                      ...filters,
                      minPrice: min !== "0" ? min : "",
                      maxPrice: max || "",
                    });
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
              <label className="text-xs font-bold text-gray-500 uppercase">
                Tiện ích
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  "Máy lạnh",
                  "Tủ lạnh",
                  "Giường",
                  "Wifi",
                  "Máy giặt",
                  "Chỗ để xe",
                  "Bếp",
                  "Thang máy",
                  "Tự do giờ giấc",
                ].map((amenity) => (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => {
                      const current = filters?.amenities || [];
                      const newAmenities = current.includes(amenity)
                        ? current.filter((a) => a !== amenity)
                        : [...current, amenity];
                      setFilters({ ...filters, amenities: newAmenities });
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${
                      (filters?.amenities || []).includes(amenity)
                        ? "bg-rose-50 border-rose-400 text-rose-700 shadow-sm"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {(filters?.amenities || []).includes(amenity) ? "✓ " : ""}
                    {amenity}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default SearchBar;
