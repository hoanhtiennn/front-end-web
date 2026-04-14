import React, { useState } from "react";
import { X, CheckCircle2, Crown, Sparkles, Calendar, Zap } from "lucide-react";
import axios from "axios";
import { useUser } from "../contexts/UserContext";

const PLANS = {
  PRO: {
    monthly: 100000,
    yearly: 900000, // ~25% giảm
    features: [
      { icon: "✅", text: "Cộng thêm <strong>30 lượt</strong> tạo bài mỗi tháng." },
      { icon: "✅", text: "Huy hiệu PRO nổi bật trên bài đăng." },
      { icon: "❌", text: "Đẩy bài tự động lên trang nhất.", disabled: true },
    ],
  },
  ULTRA: {
    monthly: 300000,
    yearly: 2700000, // ~25% giảm
    features: [
      { icon: "✅", text: "Lượt đăng bài: <strong>+100 Bài</strong> mỗi tháng." },
      { icon: "✅", text: 'Hiển thị "Chủ trọ xanh" ưu tiên tìm kiếm.' },
      { icon: "✅", text: "Theo dõi thống kê lượt xem phòng hàng ngày." },
    ],
  },
};

function formatVND(amount) {
  return amount.toLocaleString("vi-VN") + "đ";
}

export default function PurchasePlanModal({ onBack }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isMonthly, setIsMonthly] = useState(true);
  const { user } = useUser();

  const handlePurchase = async (planId) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        alert("Vui lòng đăng nhập để mua gói!");
        setIsLoading(false);
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };

      // Gọi API với đúng body mà backend yêu cầu
      const subRes = await axios.post(
        "/api/subscriptions",
        {
          email: user?.email || "",
          planId: planId,       // "PRO" hoặc "ULTRA"
          isMonthly: isMonthly, // true = theo tháng, false = theo năm
        },
        { headers }
      );

      // Backend trả về paymentUrl trực tiếp
      const paymentUrl =
        subRes.data?.paymentUrl ||
        subRes.data?.payment_url ||
        subRes.data?.url ||
        (typeof subRes.data === "string" ? subRes.data : null);

      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        throw new Error(
          "Không nhận được URL thanh toán. Kiểm tra lại response Backend."
        );
      }
    } catch (err) {
      console.error("VNPay Error:", err);
      const msg =
        err.response?.data?.message || err.message || "Lỗi không xác định";
      alert(`❌ Lỗi thanh toán: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-[#0B0F19] rounded-3xl shadow-2xl overflow-hidden border border-gray-800 animate-[fadeIn_0.3s_ease-out]">
        {/* Close */}
        <button
          onClick={onBack}
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-white bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative p-8 md:p-12 text-center overflow-hidden">
          {/* Background Glows */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 flex flex-col items-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-semibold tracking-widest text-amber-300 uppercase rounded-full bg-amber-500/10 border border-amber-500/20">
              <Sparkles className="w-4 h-4" /> Phiên bản giới hạn
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 mb-4">
              Nâng tầm tin đăng của bạn
            </h2>
            <p className="max-w-xl mx-auto text-gray-400 font-medium text-lg">
              Tiếp cận sinh viên dễ dàng hơn bao giờ hết với lượt hiển thị vô tận.
            </p>
          </div>

          {/* Monthly / Yearly Toggle */}
          <div className="relative z-10 flex items-center justify-center mb-10">
            <div className="inline-flex items-center gap-1 bg-gray-900 border border-gray-700 rounded-2xl p-1">
              <button
                onClick={() => setIsMonthly(true)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isMonthly
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Calendar className="w-4 h-4" />
                Theo tháng
              </button>
              <button
                onClick={() => setIsMonthly(false)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  !isMonthly
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Zap className="w-4 h-4" />
                Theo năm
                <span className="ml-1 text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-full">
                  -25%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* PRO Plan */}
            <div className="relative flex flex-col p-8 bg-gradient-to-b from-gray-800/80 to-gray-900/90 rounded-2xl border border-gray-700 backdrop-blur-xl hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex-1">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                  <Crown className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">
                  PRO Plan
                </h3>
                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className="text-4xl font-extrabold text-white">
                    {formatVND(isMonthly ? PLANS.PRO.monthly : PLANS.PRO.yearly)}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mb-6">
                  {isMonthly ? "/ tháng" : "/ năm (tiết kiệm " + formatVND(PLANS.PRO.monthly * 12 - PLANS.PRO.yearly) + ")"}
                </p>

                <ul className="text-left space-y-4 mb-8">
                  {PLANS.PRO.features.map((f, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-3 ${f.disabled ? "opacity-40" : "text-gray-300"}`}
                    >
                      <span className="shrink-0 mt-0.5">
                        {f.disabled ? (
                          <X className="w-5 h-5 text-gray-600" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-amber-500" />
                        )}
                      </span>
                      <span dangerouslySetInnerHTML={{ __html: f.text }} />
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => handlePurchase("PRO")}
                disabled={isLoading}
                className="relative z-10 w-full py-4 font-semibold text-white transition-all bg-gradient-to-r from-amber-600 to-amber-500 rounded-xl hover:from-amber-500 hover:to-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95 disabled:opacity-50"
              >
                {isLoading ? "Đang xử lý..." : "Mua gói PRO ngay"}
              </button>
            </div>

            {/* ULTRA Plan */}
            <div className="relative flex flex-col p-8 bg-gradient-to-b from-blue-900/40 to-indigo-950/90 rounded-2xl border border-blue-500/30 backdrop-blur-xl hover:border-cyan-400/60 hover:shadow-[0_0_40px_rgba(6,182,212,0.2)] transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.5)] transform md:-translate-y-4 group">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full text-xs font-bold text-white shadow-lg z-20 whitespace-nowrap">
                GÓI BEST SELLER
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-2xl opacity-100 group-hover:bg-cyan-500/20 transition-all" />

              <div className="relative z-10 flex-1">
                <div className="w-14 h-14 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform group-hover:rotate-6">
                  <Sparkles className="w-7 h-7 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold flex items-center justify-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 mb-2 uppercase tracking-wide">
                  ULTRA PRO
                </h3>
                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className="text-5xl font-extrabold text-white">
                    {formatVND(isMonthly ? PLANS.ULTRA.monthly : PLANS.ULTRA.yearly)}
                  </span>
                </div>
                <p className="text-blue-300 text-sm mb-6">
                  {isMonthly ? "/ tháng" : "/ năm (tiết kiệm " + formatVND(PLANS.ULTRA.monthly * 12 - PLANS.ULTRA.yearly) + ")"}
                </p>

                <ul className="text-left space-y-4 mb-8">
                  {PLANS.ULTRA.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-200">
                      <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                      <span dangerouslySetInnerHTML={{ __html: f.text }} />
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handlePurchase("ULTRA")}
                disabled={isLoading}
                className="relative z-10 w-full py-4 text-white font-bold transition-all bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] hover:scale-105 active:scale-95 overflow-hidden group/btn disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-white/20 -translate-x-[150%] skew-x-[30deg] group-hover/btn:animate-[shine_1s_ease-out]" />
                <span className="relative z-10">
                  {isLoading ? "Đang xử lý..." : "Mở Khoá Ultra Ngay"}
                </span>
              </button>
            </div>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            * Lượt đăng không có giá trị quy đổi thành tiền mặt. Áp dụng cho đến khi dùng hết.
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes shine { 100% { transform: translateX(150%) skewX(30deg); } }
          @keyframes fadeIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        `
      }} />
    </div>
  );
}
