import React from "react";
import { Edit2, Package, Check } from "lucide-react";

export default function AdminPlans() {
  const plans = [
    { name: "FREE", price: "0đ", posts: 3, images: 3, featured: false },
    { name: "PRO", price: "99,000đ", posts: 20, images: 10, featured: true },
    { name: "ULTRA", price: "249,000đ", posts: "Không giới hạn", images: 20, featured: false },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tính năng Gói Dịch Vụ</h2>
          <p className="text-sm text-gray-500 mt-1">Cấu hình giới hạn và giá tiền từng gói</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p, i) => (
          <div
            key={i}
            className={`relative bg-white border ${
              p.featured ? "border-black shadow-md" : "border-gray-200 shadow-sm"
            } rounded-xl p-6 flex flex-col`}
          >
            {p.featured && (
              <div className="absolute top-0 right-6 -translate-y-1/2 px-3 py-1 bg-black text-white text-xs font-bold rounded-full">
                HOT
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${p.featured ? "bg-black text-white" : "bg-gray-100 text-gray-800"}`}>
                <Package size={20} />
              </div>
              <h3 className="font-bold text-lg text-gray-900">{p.name}</h3>
            </div>
            
            <div className="mb-6">
              <span className="text-3xl font-black text-gray-900">{p.price}</span>
              <span className="text-gray-500 text-sm"> / tháng</span>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <Check size={16} className="text-black" />
                Đăng tối đa: <span className="font-bold">{p.posts}</span> tin
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <Check size={16} className="text-black" />
                Tối đa: <span className="font-bold">{p.images}</span> ảnh / tin
              </li>
            </ul>

            <button className="w-full py-2.5 flex items-center justify-center gap-2 border border-black text-black font-semibold rounded-md hover:bg-black hover:text-white transition-colors">
              <Edit2 size={16} />
              Chỉnh sửa
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
