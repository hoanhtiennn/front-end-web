import React from "react";
import { MapPin, TrendingUp, Search } from "lucide-react";

export default function AdminPostStats() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Thống Kê Chi Tiết</h2>
          <p className="text-sm text-gray-500 mt-1">
            Phân tích số liệu vị trí & từ khóa hot
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-100 text-black flex items-center justify-center rounded-lg">
              <MapPin size={20} />
            </div>
            <h3 className="font-bold text-gray-900">Top Khu Vực Được Tìm Kiếm</h3>
          </div>
          <ul className="space-y-4">
            {["Quận 7, TP.HCM", "Quận Bình Thạnh, TP.HCM", "Quận 10, TP.HCM"].map(
              (loc, i) => (
                <li key={i} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{loc}</span>
                    <span className="text-gray-500 font-bold">{100 - i * 20}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-900"
                      style={{ width: `${100 - i * 20}%` }}
                    />
                  </div>
                </li>
              )
            )}
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-100 text-black flex items-center justify-center rounded-lg">
              <Search size={20} />
            </div>
            <h3 className="font-bold text-gray-900">Top Loại Phòng HOT</h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {[
              { type: "Chung cư mini", val: 4500 },
              { type: "Phòng trọ có gác", val: 3200 },
              { type: "Kí túc xá", val: 1540 },
            ].map((item, i) => (
              <li
                key={i}
                className="py-3 flex items-center justify-between first:pt-0"
              >
                <span className="font-medium text-gray-700">{item.type}</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded-md">
                  {item.val.toLocaleString()} lượt
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
