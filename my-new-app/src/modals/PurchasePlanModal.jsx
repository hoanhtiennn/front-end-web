import React, { useState } from "react";
import { X, CheckCircle2, Crown, Sparkles } from "lucide-react";
import axios from "axios";

export default function PurchasePlanModal({ onBack }) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async (planName) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const postsToAdd = planName === 'PRO' ? 30 : 100;

      // Tạm thời bỏ qua cổng thanh toán, gọi thẳng API backend để cộng lượt
      await axios.post('/api/users/buy-package', {
        planName: planName,
        postsToAdd: postsToAdd
      }, { headers });

      alert(`🎉 Thành công! Hệ thống đã tự động cộng thêm ${postsToAdd} lượt đăng phòng cho Chủ trọ!`);
      onBack();
    } catch (err) {
      console.error(err);
      alert("⚠️ Đã có lỗi! Bạn đã copy Code Java Backend API tôi đưa chưa?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-[#0B0F19] rounded-3xl shadow-2xl overflow-hidden border border-gray-800 animate-[fadeIn_0.3s_ease-out]">
        
        {/* Close Button */}
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
          <div className="relative z-10 flex flex-col items-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-semibold tracking-widest text-amber-300 uppercase rounded-full bg-amber-500/10 border border-amber-500/20">
              <Sparkles className="w-4 h-4" /> Phiên bản giới hạn
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 mb-4">
              Nâng tầm tin đăng của bạn
            </h2>
            <p className="max-w-xl mx-auto text-gray-400 font-medium text-lg">
              Tiếp cận sinh viên dễ dàng hơn bao giờ hết với lượt hiển thị vô tận. Chọn gói cước phù hợp với phòng trọ của bạn.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            
            {/* VIP Plan */}
            <div className="relative flex flex-col p-8 bg-gradient-to-b from-gray-800/80 to-gray-900/90 rounded-2xl border border-gray-700 backdrop-blur-xl hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10 flex-1">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                  <Crown className="w-6 h-6 text-amber-500 uppercase" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">PRO Plan</h3>
                <div className="flex items-baseline justify-center gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-white">100k</span>
                  <span className="text-gray-500 font-medium">/tháng</span>
                </div>
                
                <ul className="text-left space-y-4 mb-8">
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span>Cộng thêm <strong className="text-white bg-amber-500/20 px-1 py-0.5 rounded">30 lượt</strong> tạo bài.</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span>Tích hợp biểu tượng PRO đỏ trên bài đăng (Tính năng sắp ra mắt).</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-300 opacity-60">
                    <X className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
                    <span>Hỗ trợ đẩy bài tự động lên trang nhất.</span>
                  </li>
                </ul>
              </div>
              
              <button 
                onClick={() => handlePurchase('PRO')}
                disabled={isLoading}
                className="relative z-10 w-full py-4 font-semibold text-white transition-all bg-gradient-to-r from-amber-600 to-amber-500 rounded-xl hover:from-amber-500 hover:to-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95 disabled:opacity-50"
              >
                {isLoading ? "Đang xử lý..." : "Mua gói PRO ngay"}
              </button>
            </div>

            {/* Ultra Plan */}
            <div className="relative flex flex-col p-8 bg-gradient-to-b from-blue-900/40 to-indigo-950/90 rounded-2xl border border-blue-500/30 backdrop-blur-xl hover:border-cyan-400/60 hover:shadow-[0_0_40px_rgba(6,182,212,0.2)] transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.5)] transform md:-translate-y-4 group">
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full text-xs font-bold text-white shadow-lg z-20 whitespace-nowrap">
                GÓI BEST SELLER
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-2xl opacity-100 group-hover:bg-cyan-500/20 transition-all rounded-2xl" />
              
              <div className="relative z-10 flex-1">
                <div className="w-14 h-14 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform group-hover:rotate-6">
                  <Sparkles className="w-7 h-7 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold flex items-center justify-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 mb-2 uppercase tracking-wide">
                  ULTRA PRO
                </h3>
                <div className="flex items-baseline justify-center gap-1 mb-6">
                  <span className="text-5xl font-extrabold text-white">300k</span>
                  <span className="text-blue-300 font-medium">/tháng</span>
                </div>
                
                <ul className="text-left space-y-4 mb-8">
                  <li className="flex items-start gap-3 text-gray-200">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Lượt đăng bài: <strong className="text-white bg-cyan-500/30 px-2 py-0.5 rounded shadow-sm relative overflow-hidden"><span className="relative z-10">+100 Bài</span></strong></span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-200">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Hiển thị "Chủ trọ xanh" ưu tiên lên kết quả tìm kiếm sinh viên.</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-200">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Theo dõi thống kê lượt xem phòng hàng ngày.</span>
                  </li>
                </ul>
              </div>
              
              <button 
                onClick={() => handlePurchase('ULTRA')}
                disabled={isLoading}
                className="relative z-10 w-full py-4 text-white font-bold transition-all bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] hover:scale-105 active:scale-95 overflow-hidden group/btn disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-white/20 -translate-x-[150%] skew-x-[30deg] group-hover/btn:animate-[shine_1s_ease-out]" />
                <span className="relative z-10">{isLoading ? "Đang xử lý..." : "Mở Khoá Ultra Ngay"}</span>
              </button>
            </div>

          </div>
          
          <div className="mt-8 text-sm text-gray-500">
            * Lượt đăng không có giá trị quy đổi thành tiền mặt. Áp dụng cho đến khi dùng hết.
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shine {
          100% { transform: translateX(150%) skewX(30deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}} />
    </div>
  );
}
