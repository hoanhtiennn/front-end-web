const RoomCard = ({ room, index, onClick }) => {
  const isTallCard = index % 3 === 0;
  return (
    <div
      onClick={() => onClick && onClick(room.id)}
      className={`group relative flex flex-col overflow-hidden rounded-3xl bg-white cursor-pointer transition-all duration-500 hover:-translate-y-2 shadow-sm border border-gray-100/50 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:border-blue-100 ${isTallCard ? "md:col-span-1 md:row-span-2" : ""}`}
    >
      <div
        className={`relative w-full overflow-hidden ${isTallCard ? "h-full md:h-auto md:grow" : "h-64"}`}
      >
        <img
          src={room.image}
          alt={room.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-black/30 opacity-60 group-hover:opacity-40 transition-opacity duration-500"></div>
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start gap-2 z-10">
          {room.planType === 'ULTRA' ? (
            <span className="bg-gradient-to-r from-cyan-400 to-blue-600 px-3 py-1 text-[11px] font-black text-white rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.6)] border border-cyan-300">
              💎 ULTRA
            </span>
          ) : room.planType === 'PRO' ? (
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-[11px] font-black text-white rounded-full uppercase tracking-wider shadow-lg shadow-orange-500/30 border border-amber-300">
              👑 PRO
            </span>
          ) : (
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white rounded-full uppercase border border-white/40 tracking-wider">
              {room.tag || "Mới"}
            </span>
          )}
          <div className="flex flex-col items-end text-white glass-effect bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20 shadow-lg">
            <span className="text-xl font-black tracking-tight">{room.price}</span>
            <span className="text-[10px] uppercase font-semibold text-gray-200">
              triệu/tháng
            </span>
          </div>
        </div>
      </div>
      <div className={`p-5 flex flex-col gap-3 relative z-20 bg-white ${isTallCard ? "md:p-6" : ""}`}>
        <h3 className="text-[17px] font-bold text-gray-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-rose-500 group-hover:to-orange-500 transition-colors line-clamp-2 leading-tight">
          {room.title}
        </h3>
        <div className="flex items-center gap-2 text-gray-500">
          <span className="text-rose-500 font-bold opacity-70">📍</span>
          <p className="text-sm truncate font-medium">
            {[room.address, room.ward, room.district, room.city].filter(Boolean).join(", ")}
          </p>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex gap-2 text-[13px] font-semibold text-gray-400">
            <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-100">40m²</span>
            <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-100">Ban công</span>
          </div>
          <button className="text-[13px] font-extrabold text-white bg-rose-500 group-hover:bg-orange-500 px-3 py-1.5 rounded-full transition-colors uppercase tracking-wide flex items-center gap-1 shadow-sm">
            Khám phá <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;