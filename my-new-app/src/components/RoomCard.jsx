const RoomCard = ({ room, index }) => {
  const isTallCard = index % 3 === 0;
  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded border border-gray-300 bg-white hover:bg-gray-50 ${isTallCard ? "md:col-span-1 md:row-span-2" : ""}`}
    >
      <div
        className={`relative w-full overflow-hidden ${isTallCard ? "h-full md:h-auto md:grow" : "h-60"}`}
      >
        <img
          src={room.image}
          alt={room.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center gap-2">
          <span className="bg-blue-600 px-2 py-1 text-xs font-bold text-white rounded uppercase">
            {room.tag || "Mới"}
          </span>
          <div className="flex items-baseline text-white">
            <span className="text-xl font-bold">{room.price}</span>
            <span className="ml-1 text-xs">
              triệu/tháng
            </span>
          </div>
        </div>
      </div>
      <div className={`p-4 flex flex-col gap-2 ${isTallCard ? "md:p-4" : ""}`}>
        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600">
          {room.title}
        </h3>
        <div className="flex items-center gap-1.5 text-gray-600">
          <span className="text-blue-600 font-bold">@</span>
          <p className="text-sm">{room.address}</p>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-300 flex items-center justify-between">
          <div className="flex gap-2 text-xs text-gray-500">
            <span>40m²</span>
            <span>-</span>
            <span>Ban công</span>
          </div>
          <button className="text-sm font-bold text-blue-600 hover:underline">
            Khám phá
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;