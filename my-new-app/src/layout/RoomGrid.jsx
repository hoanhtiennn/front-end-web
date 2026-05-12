import RoomCard from "../RoomCard";
import AddRoomCard from "../AddRoomCard";

/**
 * Component bố cục dạng lưới hiển thị danh sách các thẻ phòng trọ (RoomCard)
 */
const RoomGrid = ({ user, filteredRooms, onAddRoomClick }) => {
  return (
    <main className="container mx-auto px-6 py-16 md:py-24">
      <div className="mb-12 flex items-baseline justify-between border-b border-zinc-100 pb-6">
        <h2 className="text-3xl font-black text-zinc-950 tracking-tight">
          Gợi ý phòng <span className="text-rose-600">nổi bật</span>
        </h2>
        <span className="text-sm text-zinc-500 font-medium">
          Tìm thấy {filteredRooms.length} kết quả
        </span>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 grid-flow-row-dense">
        {user?.role === "LANDLORD" && (
          <AddRoomCard onClick={onAddRoomClick} />
        )}

        {filteredRooms.length > 0 ? (
          filteredRooms.map((room, index) => (
            <RoomCard key={room.id} room={room} index={index} />
          ))
        ) : (
          <div className="col-span-full py-20 text-center rounded-3xl border-2 border-dashed border-zinc-200 bg-white">
            <span className="text-6xl mb-6 block">☹</span>
            <p className="text-xl font-bold text-zinc-800">Không tìm thấy phòng phù hợp.</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default RoomGrid;