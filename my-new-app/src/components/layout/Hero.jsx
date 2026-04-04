import { Search } from "lucide-react";

const Hero = () => (
  <header className="relative mx-auto mt-2 md:mt-4 w-[calc(100%-2rem)] md:w-[calc(100%-4rem)] max-w-[1400px] h-[550px] md:h-[650px] rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden">
    {/* Photo Background */}
    <div 
      className="absolute inset-0 bg-cover bg-center"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}
    ></div>
    
    {/* Gradient Overlay for Readability */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/60"></div>

    <div className="relative h-full container mx-auto px-6 py-20 flex flex-col justify-center items-center text-center z-10 mt-[-20px]">
      
      {/* Glassmorphism Title Box */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 p-8 md:p-12 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.3)] w-full max-w-4xl transform transition-transform hover:scale-[1.01] duration-500">
        <span className="inline-block py-1.5 px-5 rounded-full bg-rose-500 text-white text-[13px] font-black tracking-widest uppercase mb-6 shadow-[0_0_20px_rgba(244,63,94,0.4)]">
          ✨ KHÔNG GIAN SỐNG TRONG MƠ
        </span>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 text-white tracking-tighter drop-shadow-md leading-[1.1]">
          Sống Trọn Vẹn, <br className="hidden md:block"/> Đầy Cảm Hứng.
        </h1>
        <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-sm">
          Khám phá hàng ngàn phòng trọ và căn hộ cao cấp với trải nghiệm tìm kiếm thanh lịch, tối giản & thông minh nhất.
        </p>
      </div>

    </div>
  </header>
);
export default Hero;