const SearchBar = ({ searchTerm, setSearchTerm, onLocationClick, onSearch, isLocating }) => (
  <section className="container mx-auto px-4 mt-6 mb-8">
    <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-2 border border-gray-300 p-3 rounded bg-white shadow-sm">
      <div className="flex grow items-center gap-2 border border-gray-300 bg-white px-3 py-2 rounded focus-within:border-blue-500">
        <span className="text-gray-500 font-bold">🔍</span>
        <input 
          type="text" 
          placeholder="Nhập địa chỉ, quận hoặc tên đường..." 
          className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-500 text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
        />
      </div>
      <div className="flex gap-2">
        <button 
          onClick={onLocationClick} 
          disabled={isLocating}
          className="flex items-center justify-center gap-1 rounded bg-blue-100 px-4 py-2 text-blue-700 hover:bg-blue-200 border border-blue-200 whitespace-nowrap text-sm font-bold disabled:opacity-50"
        >
          <span>📍</span>
          <span>{isLocating ? "Đang quét..." : "Tìm gần tôi"}</span>
        </button>
        <button 
          onClick={onSearch}
          className="hidden md:block rounded bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700"
        >
          Tìm kiếm
        </button>
      </div>
    </div>
  </section>
);
export default SearchBar;