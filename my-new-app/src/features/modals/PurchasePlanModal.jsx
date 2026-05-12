import React, { useState, useEffect } from "react";
import { X, CheckCircle2, Crown, Sparkles, Calendar, Zap, Loader2 } from "lucide-react";
import axios from "axios";
import { useUser } from "../../context/UserContext";

// Fallback tĩnh nếu API lỗi
const FALLBACK_PLANS = {
  PRO: {
    monthly: 100000,
    yearly: 900000,
    maxPostsMonthly: 30,
  },
  ULTRA: {
    monthly: 300000,
    yearly: 2700000,
    maxPostsMonthly: 100,
  },
};

const PLAN_FEATURES = {
  PRO: (maxPosts) => [
    { text: `Cộng thêm <strong>${maxPosts ?? 30} lượt</strong> tạo bài mỗi tháng.` },
    { text: "Huy hiệu PRO nổi bật trên bài đăng." },
    { text: "Đẩy bài tự động lên trang nhất.", disabled: true },
  ],
  ULTRA: (maxPosts) => [
    { text: `Lượt đăng bài: <strong>+${maxPosts ?? 100} Bài</strong> mỗi tháng.` },
    { text: 'Hiển thị "Chủ trọ xanh" ưu tiên tìm kiếm.' },
    { text: "Theo dõi thống kê lượt xem phòng hàng ngày." },
  ],
};

/**
 * Định dạng số tiền tệ sang chuẩn Việt Nam Đồng (VNĐ)
 */
function formatVND(amount) {
  return Number(amount).toLocaleString("vi-VN") + "đ";
}

/**
 * Trích xuất email từ payload của JWT token mà không cần gọi API
 */
function getEmailFromToken(token) {
  try {
    if (!token) return "";
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return "";
    const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);
    return payload.email || payload.sub || "";
  } catch {
    return "";
  }
}

/**
 * Modal cho phép người dùng chọn và mua gói dịch vụ (PRO/ULTRA)
 */
export default function PurchasePlanModal({ onBack }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isMonthly, setIsMonthly] = useState(true);
  const [plansData, setPlansData] = useState(null);   // dữ liệu từ DB
  const [plansError, setPlansError] = useState(false); // fallback nếu lỗi
  const [isFetchingPlans, setIsFetchingPlans] = useState(true);
  const { user } = useUser();

  // Fetch danh sách gói từ backend
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    setIsFetchingPlans(true);
    axios
      .get("/api/plans", { headers })
      .then((res) => {
        const raw = res.data?.result || res.data?.data || res.data;
        const list = Array.isArray(raw) ? raw : [];
        // Map thành object keyed by plan id (PRO, ULTRA, FREE...)
        const mapped = {};
        list.forEach((p) => {
          const key = (p.id || p.planId || p.name || "").toString().toUpperCase();
          if (key) mapped[key] = p;
        });
        setPlansData(Object.keys(mapped).length > 0 ? mapped : null);
        setPlansError(Object.keys(mapped).length === 0);
      })
      .catch(() => {
        setPlansError(true);
        setPlansData(null);
      })
      .finally(() => setIsFetchingPlans(false));
  }, []);

  /**
   * Lấy giá tiền của một gói dựa trên DB hoặc giá trị mặc định (fallback)
   */
  const getPlanPrice = (planKey, monthly) => {
    const fromDb = plansData?.[planKey];
    if (fromDb) {
      return monthly
        ? (fromDb.priceMonthly ?? fromDb.price_monthly ?? FALLBACK_PLANS[planKey]?.monthly ?? 0)
        : (fromDb.priceYearly ?? fromDb.price_yearly ?? FALLBACK_PLANS[planKey]?.yearly ?? 0);
    }
    return monthly ? FALLBACK_PLANS[planKey]?.monthly ?? 0 : FALLBACK_PLANS[planKey]?.yearly ?? 0;
  };

  /**
   * Lấy số lượng bài đăng tối đa của một gói
   */
  const getMaxPosts = (planKey) => {
    const fromDb = plansData?.[planKey];
    return fromDb?.maxPosts ?? fromDb?.max_posts ?? FALLBACK_PLANS[planKey]?.maxPostsMonthly ?? null;
  };

  /**
   * Xử lý khi nhấn nút Mua gói: Gọi API tạo phiên thanh toán và chuyển hướng đến VNPay
   */
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
      const tokenEmail = getEmailFromToken(token);
      const buyerEmail = user?.email || tokenEmail;
      if (!buyerEmail) {
        throw new Error("Không tìm thấy email tài khoản để tạo phiên thanh toán.");
      }
      const returnPath = window.location.pathname || "/";
      const returnUrl = `${window.location.origin}${returnPath}`;

      // Gọi API với đúng body mà backend yêu cầu
      const subRes = await axios.post(
        "/api/subscriptions",
        {
          email: buyerEmail,
          planId: planId,       // "PRO" hoặc "ULTRA"
          isMonthly: isMonthly, // true = theo tháng, false = theo năm
          returnUrl,
          cancelUrl: returnUrl,
        },
        { headers }
      );

      // Backend trả về paymentUrl trực tiếp
      const payload = subRes.data?.result || subRes.data?.data || subRes.data;
      const paymentUrl =
        payload?.paymentUrl ||
        payload?.payment_url ||
        payload?.payUrl ||
        payload?.paymentLink ||
        payload?.payment?.url ||
        payload?.redirectUrl ||
        payload?.url ||
        payload?.checkoutUrl ||
        (typeof payload === "string" ? payload : null);

      if (paymentUrl) {
        const normalizedUrl = /^https?:\/\//i.test(paymentUrl)
          ? paymentUrl
          : `https://${paymentUrl}`;
        window.location.assign(normalizedUrl);
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
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-[900px] my-3 sm:my-4 bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200 animate-[fadeIn_0.3s_ease-out] max-h-[92vh] flex flex-col">
        {/* Close */}
        <button
          onClick={onBack}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2 text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-full border border-gray-300 shadow-sm transition-all"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative p-4 md:p-5 text-center overflow-y-auto overflow-x-hidden">
          {/* Background Glows */}
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-amber-200/35 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-200/35 rounded-full blur-[80px] pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 flex flex-col items-center mb-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 mb-3 text-[11px] font-semibold tracking-widest text-amber-700 uppercase rounded-full bg-amber-50 border border-amber-200">
              <Sparkles className="w-3.5 h-3.5" /> Phiên bản giới hạn
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 mb-2">
              Nâng tầm tin đăng của bạn
            </h2>
            <p className="max-w-xl mx-auto text-gray-600 font-medium text-sm md:text-base">
              Tiếp cận sinh viên dễ dàng hơn bao giờ hết với lượt hiển thị vô tận.
            </p>
          </div>

          {/* Monthly / Yearly Toggle */}
          <div className="relative z-10 flex items-center justify-center mb-5">
            <div className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-2xl p-1">
              <button
                onClick={() => setIsMonthly(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isMonthly
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Calendar className="w-4 h-4" />
                Theo tháng
              </button>
              <button
                onClick={() => setIsMonthly(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  !isMonthly
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                    : "text-gray-500 hover:text-gray-900"
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
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-[820px] mx-auto">
            {/* PRO Plan */}
            <div className="relative flex flex-col p-4 md:p-5 bg-gradient-to-b from-white to-amber-50/40 rounded-2xl border border-amber-100 hover:border-amber-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex-1">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
                  <Crown className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1 uppercase tracking-wide">
                  PRO Plan
                </h3>
                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className="text-3xl font-extrabold text-gray-900">
                    {formatVND(getPlanPrice("PRO", isMonthly))}
                  </span>
                </div>
                <p className="text-gray-500 text-xs md:text-sm mb-4">
                  {isMonthly ? "/ tháng" : "/ năm (tiết kiệm " + formatVND(getPlanPrice("PRO", true) * 12 - getPlanPrice("PRO", false)) + ")"}
                </p>

                <ul className="text-left space-y-2 mb-4">
                  {PLAN_FEATURES.PRO(getMaxPosts("PRO")).map((f, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-2.5 text-sm ${f.disabled ? "opacity-40 text-gray-400" : "text-gray-700"}`}
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
                className="relative z-10 w-full py-2.5 font-semibold text-sm text-white transition-all bg-gradient-to-r from-amber-600 to-amber-500 rounded-xl hover:from-amber-500 hover:to-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] active:scale-95 disabled:opacity-50"
              >
                {isLoading ? "Đang xử lý..." : "Mua gói PRO ngay"}
              </button>
            </div>

            {/* ULTRA Plan */}
            <div className="relative flex flex-col p-4 md:p-5 bg-gradient-to-b from-cyan-50 to-blue-50 rounded-2xl border border-cyan-200 hover:border-cyan-400/60 hover:shadow-[0_0_24px_rgba(6,182,212,0.2)] transition-all duration-300 shadow-[0_4px_18px_rgba(6,182,212,0.1)] transform md:-translate-y-1 group">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full text-[11px] font-bold text-white shadow-lg z-20 whitespace-nowrap">
                GÓI BEST SELLER
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-2xl opacity-100 group-hover:bg-cyan-500/20 transition-all" />

              <div className="relative z-10 flex-1">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform group-hover:rotate-6">
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-base md:text-lg font-bold flex items-center justify-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 mb-1 uppercase tracking-wide">
                  ULTRA PRO
                </h3>
                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {formatVND(getPlanPrice("ULTRA", isMonthly))}
                  </span>
                </div>
                <p className="text-blue-600 text-xs md:text-sm mb-4">
                  {isMonthly ? "/ tháng" : "/ năm (tiết kiệm " + formatVND(getPlanPrice("ULTRA", true) * 12 - getPlanPrice("ULTRA", false)) + ")"}
                </p>

                <ul className="text-left space-y-2 mb-4">
                  {PLAN_FEATURES.ULTRA(getMaxPosts("ULTRA")).map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                      <span dangerouslySetInnerHTML={{ __html: f.text }} />
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handlePurchase("ULTRA")}
                disabled={isLoading}
                className="relative z-10 w-full py-2.5 text-sm text-white font-bold transition-all bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl shadow-[0_8px_18px_rgba(6,182,212,0.25)] hover:shadow-[0_0_24px_rgba(6,182,212,0.45)] hover:scale-[1.02] active:scale-95 overflow-hidden group/btn disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-white/20 -translate-x-[150%] skew-x-[30deg] group-hover/btn:animate-[shine_1s_ease-out]" />
                <span className="relative z-10">
                  {isLoading ? "Đang xử lý..." : "Mở Khoá Ultra Ngay"}
                </span>
              </button>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500">
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
