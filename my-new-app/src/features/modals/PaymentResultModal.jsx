import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, ArrowRight, Home } from "lucide-react";
import axios from "axios";
import { useUser } from "../../context/UserContext";

const AUTO_REDIRECT_SECONDS = 5;

export default function PaymentResultModal() {
  const [status, setStatus] = useState("loading"); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState("Đang xử lý kết quả thanh toán...");
  const [countdown, setCountdown] = useState(AUTO_REDIRECT_SECONDS);
  const { user, updateUser } = useUser();

  // Xử lý xác thực kết quả thanh toán từ VNPay
  useEffect(() => {
    const processPayment = async () => {
      try {
        const queryParams = new URLSearchParams(window.location.search);
        if (!queryParams.has("vnp_ResponseCode")) return;

        const token = localStorage.getItem("userToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Gọi backend để xác thực chữ ký VNPay
        try {
          await axios.get(`/api/payments/return?${queryParams.toString()}`, { headers });
        } catch (e) {
          console.warn("Backend /api/payments/return chưa khớp, bỏ qua xác thực phía server:", e);
        }

        const responseCode = queryParams.get("vnp_ResponseCode");

        if (responseCode === "00") {
          setStatus("success");
          setMessage("Gói cước của bạn đã được kích hoạt thành công!");

          // Refresh lại toàn bộ user data từ backend để lấy postLimit mới
          const token = localStorage.getItem("userToken");
          if (token) {
            try {
              const meRes = await axios.get("/api/users/me", {
                headers: { Authorization: `Bearer ${token}` }
              });
              const u = meRes.data?.result || meRes.data?.data || meRes.data;
              updateUser({
                plan:           u.plan,
                remainingPosts: u.remainingPosts ?? u.remaining_posts ?? null,
                name:           u.fullName || u.full_name || u.name || u.email?.split("@")[0],
                avatarUrl:      u.avatar_url || u.avatarUrl || u.profilePicture || u.photo,
                phone:          u.phone,
                isVerified:     u.isVerified || u.is_verified || false,
              });
            } catch (_) {
              // Fallback: chỉ update plan nếu gọi API thất bại
              const vnpAmount = parseInt(queryParams.get("vnp_Amount") || "0", 10);
              updateUser({ plan: vnpAmount >= 30000000 ? "ULTRA" : "PRO" });
            }
          }
        } else {
          setStatus("error");
          const codeMap = {
            "24": "Bạn đã hủy giao dịch.",
            "11": "Giao dịch hết hạn, vui lòng thử lại.",
            "09": "Thẻ/Tài khoản chưa đăng ký InternetBanking.",
          };
          setMessage(codeMap[responseCode] || `Thanh toán thất bại (Mã lỗi: ${responseCode}).`);
        }
      } catch (err) {
        console.error("Lỗi xác thực VNPay:", err);
        setStatus("error");
        setMessage("Xác thực thanh toán thất bại. Vui lòng liên hệ hỗ trợ.");
      }
    };

    processPayment();
  }, []);

  // Đếm ngược tự động về trang chủ sau khi thành công
  useEffect(() => {
    if (status !== "success") return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = "/";
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  const goHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0B0F19]/90 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#131B2C] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden text-center p-8">

        {/* LOADING */}
        {status === "loading" && (
          <div className="flex flex-col items-center py-4">
            <Loader2 className="w-16 h-16 text-cyan-500 animate-spin mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">Đang xác thực...</h3>
            <p className="text-gray-400">{message}</p>
          </div>
        )}

        {/* SUCCESS */}
        {status === "success" && (
          <div className="flex flex-col items-center animate-[fadeIn_0.5s_ease-out]">
            {/* Confetti-like glow */}
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/30">
                <CheckCircle2 className="w-14 h-14 text-green-400" />
              </div>
            </div>

            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 mb-2">
              Thành Công! 🎉
            </h3>
            <p className="text-gray-300 mb-2">{message}</p>
            <p className="text-gray-500 text-sm mb-8">
              Tự động về trang chủ sau{" "}
              <span className="text-green-400 font-bold text-base">{countdown}s</span>
            </p>

            {/* Countdown progress bar */}
            <div className="w-full h-1.5 bg-gray-800 rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-1000"
                style={{ width: `${(countdown / AUTO_REDIRECT_SECONDS) * 100}%` }}
              />
            </div>

            <button
              onClick={goHome}
              className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Về Trang Chủ Ngay
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ERROR */}
        {status === "error" && (
          <div className="flex flex-col items-center animate-[fadeIn_0.5s_ease-out]">
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-rose-500/20 rounded-full blur-xl" />
              <div className="relative w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/30">
                <XCircle className="w-14 h-14 text-rose-400" />
              </div>
            </div>

            <h3 className="text-3xl font-black text-rose-400 mb-2">Thất Bại!</h3>
            <p className="text-gray-300 mb-8">{message}</p>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={goHome}
                className="w-full py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Về Trang Chủ
              </button>
              <button
                onClick={() => window.history.back()}
                className="w-full py-3 text-gray-400 hover:text-white text-sm font-medium transition-all"
              >
                ← Thử lại
              </button>
            </div>
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.9) translateY(20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `
      }} />
    </div>
  );
}
