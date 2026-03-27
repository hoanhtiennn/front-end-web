import { useUser } from "../contexts/UserContext";

const Navbar = ({ onAuthClick }) => {
  const { user, logout } = useUser();
  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-white/70 border-b border-zinc-100 px-8 py-4 flex justify-between items-center">
      <div className="text-2xl font-black tracking-tighter text-rose-600 italic cursor-pointer">
        PRO.STAY
      </div>
      <div className="flex items-center gap-4">
        {!user ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAuthClick("LOGIN")}
              className="px-5 py-2 text-sm font-bold text-zinc-600 hover:text-rose-600 transition-colors"
            >
              Đăng nhập
            </button>
            <button
              onClick={() => onAuthClick("REGISTER")}
              className="bg-zinc-900 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-xl shadow-zinc-200 hover:bg-rose-600 transition-all active:scale-95"
            >
              Đăng ký ngay
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-5">
            <div className="flex flex-col items-end">
              <span className="text-sm font-black text-zinc-900 leading-none">
                {user.name}
              </span>
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-1">
                {user.role === "ADMIN"
                  ? "Admin"
                  : user.role === "LANDLORD"
                    ? "Chủ cho thuê"
                    : "Người tìm phòng"}
              </span>
            </div>
            <div className="h-9 w-9 rounded-full bg-zinc-100 border-2 border-rose-500 flex items-center justify-center font-bold text-rose-600">
              {user.name[0]}
            </div>
            <button
              onClick={logout}
              className="text-zinc-400 hover:text-red-500 font-bold text-xs uppercase tracking-tight"
            >
              Thoát
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
