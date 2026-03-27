const SearchBar = ({ searchTerm, setSearchTerm, onLocationClick, isLocating }) => (
  <section className="container mx-auto px-6 -mt-16 relative z-10">
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-4 items-stretch">
      <button 
        onClick={onLocationClick} 
        disabled={isLocating}
        className="group flex flex-col items-center justify-center gap-1 rounded-3xl bg-rose-600 px-8 py-5 text-white shadow-2xl shadow-rose-200 transition-all hover:bg-rose-700 active:scale-95 md:w-48"
      >
        <span className="text-2xl group-hover:animate-bounce">📍</span>
        <span className="text-[10px] font-black uppercase tracking-tighter whitespace-nowrap">
          {isLocating ? "Đang quét..." : "Tìm gần tôi"}
        </span>
      </button>

      <div className="grow backdrop-blur-lg bg-white/95 p-3 rounded-4xl shadow-2xl shadow-zinc-900/5 ring-1 ring-zinc-100 flex items-center gap-3">
        <div className="flex grow items-center gap-3 rounded-full bg-zinc-100 px-6 py-4 transition-all focus-within:ring-2 focus-within:ring-rose-300">
          <span className="text-zinc-400 font-black">🔍</span>
          <input 
            type="text" 
            placeholder="Nhập địa chỉ, quận hoặc tên đường..." 
            className="w-full bg-transparent outline-none text-zinc-800 placeholder-zinc-400 text-lg font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="hidden md:block rounded-full bg-zinc-900 px-10 py-4 text-lg font-bold text-white hover:bg-black transition-colors">Tìm kiếm</button>
      </div>
    </div>
  </section>
);
export default SearchBar;