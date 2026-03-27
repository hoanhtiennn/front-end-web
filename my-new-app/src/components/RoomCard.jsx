const RoomCard = ({ room, index }) => {
  const isTallCard = index % 3 === 0;
  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:shadow-xl ${isTallCard ? "md:col-span-1 md:row-span-2" : ""}`}
    >
      <div
        className={`relative w-full overflow-hidden ${isTallCard ? "h-full md:h-auto md:grow" : "h-60"}`}
      >
        <img
          src={room.image}
          alt={room.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-zinc-900/60 via-zinc-900/10 to-transparent"></div>
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center gap-2">
          <span className="backdrop-blur-sm bg-zinc-900/30 px-3 py-1 text-xs font-semibold text-white rounded-full uppercase tracking-wider">
            {room.tag || "Mới"}
          </span>
          <div className="flex items-baseline text-white">
            <span className="text-2xl font-black">{room.price}</span>
            <span className="ml-1 text-xs font-medium opacity-80">
              triệu/tháng
            </span>
          </div>
        </div>
      </div>
      <div className={`p-5 flex flex-col gap-1 ${isTallCard ? "md:p-6" : ""}`}>
        <h3 className="text-xl font-bold text-zinc-950 leading-snug group-hover:text-rose-600 transition-colors">
          {room.title}
        </h3>
        <div className="flex items-center gap-1.5 text-zinc-600">
          <span className="text-rose-500 font-black">@</span>
          <p className="text-sm">{room.address}</p>
        </div>
        <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
          <div className="flex gap-3 text-xs text-zinc-500 font-medium">
            <span>40m²</span>
            <span>•</span>
            <span>Ban công</span>
          </div>
          <button className="text-sm font-semibold text-rose-600 hover:text-rose-700">
            Khám phá →
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;