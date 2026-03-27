const Hero = () => (
  <header className="relative bg-zinc-950 text-white pt-24 pb-32">
    <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200')] bg-cover bg-center"></div>
    <div className="container relative mx-auto px-6 text-center">
      <span className="text-rose-500 font-semibold tracking-widest uppercase text-sm mb-3 block">
        Phòng trọ hiện đại, giá tốt
      </span>
      <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tighter max-w-4xl mx-auto uppercase">
        Tìm không gian sống <span className="text-rose-600 italic">tương lai</span> của bạn
      </h1>
      <p className="mt-6 text-xl text-zinc-300 max-w-xl mx-auto leading-relaxed">
        Hàng ngàn phòng trọ, căn hộ và studio chất lượng, hiện đại trên toàn Việt Nam.
      </p>
    </div>
  </header>
);
export default Hero;