import { Search } from "lucide-react";

/**
 * Component hiển thị Banner nổi bật (Hero Section) ở ngay dưới thanh Navbar trên trang chủ
 * Thiết kế với background ảnh lớn và hiệu ứng mờ (Glassmorphism) để tạo điểm nhấn thị giác
 */
const Hero = () => (
  <header className="relative mx-auto mt-2 md:mt-4 w-[calc(100%-2rem)] md:w-[calc(100%-4rem)] max-w-[1400px] h-[400px] md:h-[500px] rounded-4xl md:rounded-5xl shadow-2xl overflow-hidden">
    {/* Photo Background */}
    <div 
      className="absolute inset-0 bg-cover bg-center"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}
    ></div>
    
    {/* Gradient Overlay for Readability */}
    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-black/60"></div>

    <div className="relative h-full container mx-auto px-6 py-10 flex flex-col justify-center items-center text-center z-10">
      
      {/* Glassmorphism Title Box */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 p-6 md:p-10 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.3)] w-full max-w-4xl transform transition-transform hover:scale-[1.01] duration-500">
        <span className="inline-block py-1 px-4 rounded-full bg-rose-500 text-white text-[12px] font-black tracking-widest uppercase mb-4 shadow-[0_0_20px_rgba(244,63,94,0.4)]">
          ✨ KHÔNG GIAN SỐNG TRONG MƠ
        </span>
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 text-white tracking-tighter drop-shadow-md leading-[1.1]">
          Sống Trọn Vẹn, <br className="hidden md:block"/> Đầy Cảm Hứng.
        </h1>
        <p className="text-base md:text-lg text-white/90 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-sm">
          Khám phá hàng ngàn phòng trọ và căn hộ cao cấp với trải nghiệm tìm kiếm thanh lịch, tối giản & thông minh nhất.
        </p>
      </div>

    </div>
  </header>
);
export default Hero;