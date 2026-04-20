import { useUser } from "../contexts/UserContext";
import { Heart, ShieldCheck, Clock, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

const VerifyBadge = ({ status }) => {
  if (!status) return null;
  if (status === "APPROVED") return (
    <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
      <ShieldCheck className="w-3 h-3" /> Đã XM
    </span>
  );
  if (status === "PENDING" || status === "PENDING_MANUAL") return (
    <span className="flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" /> Chờ duyệt
    </span>
  );
  if (status === "REJECTED") return (
    <span className="flex items-center gap-1 text-[10px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3" /> Từ chối
    </span>
  );
  return null;
};

const Navbar = ({ onAuthClick, onEditProfileClick, onPricingClick, onMyPostsClick, onSavedPostsClick, onVerifyClick }) => {
  const { user, logout } = useUser();
  const [verifyStatus, setVerifyStatus] = useState(null);

  useEffect(() => {
    if (!user || user.role !== "LANDLORD") return;
    // Nếu user đã verified → không cần gọi API
    if (user.isVerified) { setVerifyStatus("APPROVED"); return; }
    const token = localStorage.getItem("userToken");
    axios.get("/api/verifications/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const d = res.data?.result || res.data?.data || res.data;
        setVerifyStatus(d?.status || null);
      })
      .catch(() => setVerifyStatus(null));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.isVerified]);
  return (
    <nav className="bg-white/95 backdrop-blur-3xl sticky top-0 z-50 px-4 md:px-8 py-3 shadow-sm border-b border-rose-500/10">
      <div className="max-w-[1400px] mx-auto w-full flex justify-between items-center">
        <div className="text-2xl font-black cursor-pointer tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500 drop-shadow-sm hover:scale-[1.02] transition-transform duration-300">
          PRO.STAY
        </div>
        <div className="flex items-center gap-4">
          {!user ? (
            <div className="flex items-center gap-4 md:gap-6">
              <button
                onClick={() => onAuthClick("LOGIN")}
                className="text-gray-600 font-semibold hover:text-rose-500 transition-colors"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => onAuthClick("REGISTER")}
                className="bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold px-6 py-2.5 rounded-full shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 hover:-translate-y-0.5 transition-all duration-300"
              >
                Đăng ký
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 md:gap-5">
              
              {/* User Profile Pill */}
              <div className="flex items-center gap-3 bg-rose-50/80 px-2 py-1.5 rounded-full border border-rose-100 shadow-sm">
                <div className="flex flex-col text-right pl-3">
                  <span className="font-bold text-gray-900 text-[13px] leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] font-black tracking-widest text-rose-500 uppercase">
                    {user.role}
                  </span>
                </div>
                <div className="relative">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-400 to-orange-400 border-2 border-white shadow-sm flex items-center justify-center text-white font-bold text-base pt-0.5">
                      {user.name?.charAt(0) || "U"}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 border-l border-gray-200 pl-3 md:pl-5">
                {user.role === "LANDLORD" && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={onMyPostsClick}
                      className="text-gray-600 text-[13px] font-bold hover:text-rose-500 transition-colors hover:bg-rose-50 px-3 py-2 rounded-full"
                    >
                      Bài đăng
                    </button>
                    {verifyStatus === "APPROVED" ? (
                      <div className="flex items-center gap-1.5 px-3 py-2 text-emerald-600 text-[13px] font-black">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Đã xác minh</span>
                      </div>
                    ) : (
                      <button
                        onClick={onVerifyClick}
                        className="flex items-center gap-1.5 text-gray-600 text-[13px] font-bold hover:text-violet-600 transition-colors hover:bg-violet-50 px-3 py-2 rounded-full"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span className="hidden md:inline">Xác minh</span>
                        <VerifyBadge status={verifyStatus} />
                      </button>
                    )}
                    <button
                      onClick={onPricingClick}
                      className="bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold px-4 py-2 rounded-full text-[13px] hover:shadow-lg hover:shadow-rose-500/30 hover:-translate-y-0.5 transition-all duration-300 mr-1"
                    >
                      Mua Lượt
                    </button>
                  </div>
                )}
                {/* Saved Posts button — chỉ hiện cho người thuê (không phải LANDLORD) */}
                {user.role !== "LANDLORD" && (
                  <button
                    onClick={onSavedPostsClick}
                    title="Bài đã thích"
                    className="flex items-center gap-1.5 text-gray-600 text-[13px] font-bold hover:text-rose-500 transition-colors hover:bg-rose-50 px-3 py-2 rounded-full"
                  >
                    <Heart className="w-4 h-4" />
                    <span className="hidden sm:inline">Đã Thích</span>
                  </button>
                )}
                <button
                  onClick={onEditProfileClick}
                  className="text-gray-600 text-[13px] font-bold hover:text-rose-500 transition-colors hover:bg-rose-50 px-3 py-2 rounded-full"
                >
                  Hồ sơ
                </button>
                <button
                  onClick={logout}
                  className="text-red-500 text-[13px] font-bold hover:text-red-600 transition-colors hover:bg-red-50 px-3 py-2 rounded-full"
                >
                  Thoát
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
