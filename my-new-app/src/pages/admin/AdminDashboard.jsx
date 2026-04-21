import React from "react";
import { TrendingUp, Users, Home, CreditCard } from "lucide-react";

export default function AdminDashboard() {
  const stats = [
    { title: "Tổng Doanh Thu", value: "24,500,000đ", icon: TrendingUp },
    { title: "Người Dùng Mới", value: "142", icon: Users },
    { title: "Tin Đăng Đang Mở", value: "854", icon: Home },
    { title: "Giao Dịch Gói", value: "32", icon: CreditCard },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500">
                  {s.title}
                </span>
                <div className="w-10 h-10 bg-gray-50 flex items-center justify-center rounded-lg border border-gray-100">
                  <Icon size={20} className="text-gray-900" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-gray-900">{s.value}</h3>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-96 flex flex-col items-center justify-center text-gray-400">
          Biểu đồ Doanh Thu (Placeholder)
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-96 flex flex-col items-center justify-center text-gray-400">
          Hoạt động Gần Đây
        </div>
      </div>
    </div>
  );
}
