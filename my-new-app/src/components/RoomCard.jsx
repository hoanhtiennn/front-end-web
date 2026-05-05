import { useState, useEffect } from "react";
import { Heart, ShieldCheck, Eye } from "lucide-react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { toggleSavePost, isPostSaved } from "../features/modals/SavedPostsModal";

const RoomCard = ({ room, index, onClick }) => {
  const { user } = useUser();
  const userId = user?.id ?? null;

  // ── Like state ──
  const [isSaved, setIsSaved] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);

  useEffect(() => {
    setIsSaved(isPostSaved(room.id, userId));
  }, [room.id, userId]);

  const handleToggleSave = async (e) => {
    e.stopPropagation(); // Không mở modal chi tiết
    const token = localStorage.getItem("userToken");
    if (!token) {
      alert("Vui lòng đăng nhập để lưu bài yêu thích!");
      return;
    }
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 600);
    const next = await toggleSavePost(room.id, isSaved, userId);
    setIsSaved(next);
  };

  return (
    <div
      onClick={() => onClick && onClick(room.id)}
      className={`group relative flex flex-col overflow-hidden rounded-3xl bg-white cursor-pointer transition-all duration-500 hover:-translate-y-2 shadow-sm border border-gray-100/50 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:border-blue-100`}
    >
      {/* ── Ảnh ── */}
      <div className={`relative w-full overflow-hidden aspect-square`}>
        <img
          src={room.image}
          alt={room.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-black/30 opacity-60 group-hover:opacity-40 transition-opacity duration-500"></div>

        {/* Top row: badge + price */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start gap-2 z-10">
          {/* Plan badge */}
          {room.planType === "ULTRA" ? (
            <span className="bg-gradient-to-r from-cyan-400 to-blue-600 px-3 py-1 text-[11px] font-black text-white rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.6)] border border-cyan-300">
              💎 ULTRA
            </span>
          ) : room.planType === "PRO" ? (
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-[11px] font-black text-white rounded-full uppercase tracking-wider shadow-lg shadow-orange-500/30 border border-amber-300">
              👑 PRO
            </span>
          ) : (
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white rounded-full uppercase border border-white/40 tracking-wider">
              {room.tag || "Mới"}
            </span>
          )}

          {/* Price */}
          <div className="flex flex-col items-end text-white bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20 shadow-lg">
            <span className="text-xl font-black tracking-tight">
              {room.price}
            </span>
            <span className="text-[10px] uppercase font-semibold text-gray-200">
              triệu/tháng
            </span>
          </div>
        </div>

        {/* Heart button */}
        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={handleToggleSave}
            className={`w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-md border transition-all duration-300 shadow-lg
              ${
                isSaved
                  ? "bg-rose-500 border-rose-400 shadow-rose-500/50"
                  : "bg-black/30 border-white/20 hover:bg-rose-500/80 hover:border-rose-300"
              }
              ${likeAnim ? "scale-125" : "scale-100"}
            `}
          >
            <Heart
              className={`w-4 h-4 transition-all ${isSaved ? "fill-white text-white" : "text-white"}`}
            />
          </button>
        </div>

        {/* Verified badge - góc dưới trái ảnh */}
        {room.isOwnerVerified && (
          <div className="absolute bottom-4 left-4 z-10">
            <span className="flex items-center gap-1 bg-emerald-500/90 backdrop-blur-md text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-lg border border-emerald-400/50">
              <ShieldCheck className="w-3 h-3" /> Đã xác minh
            </span>
          </div>
        )}
      </div>

      {/* ── Nội dung ── */}
      <div className="p-5 flex flex-col gap-3 bg-white">
        <h3 className="text-[17px] font-bold text-gray-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-rose-500 group-hover:to-orange-500 transition-colors line-clamp-2 leading-tight">
          {room.title}
        </h3>

        {room.isOwnerVerified && (
          <div className="flex items-center gap-1 text-emerald-600 text-[12px] font-bold -mt-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Chủ trọ đã xác minh danh tính
          </div>
        )}

        <div className="flex items-center gap-2 text-gray-500">
          <span className="text-rose-500 font-bold opacity-70">📍</span>
          <p className="text-sm truncate font-medium">
            {[room.address, room.ward, room.district, room.city]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          {/* View count */}
          <div className="flex items-center gap-1.5 text-gray-400 text-[13px] font-semibold">
            <Eye className="w-3.5 h-3.5" />
            <span>{(room.viewCount ?? 0).toLocaleString("vi-VN")} lượt xem</span>
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
