import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Trash2, Edit3 } from "lucide-react";

export default function AdminAmenities() {
  const [amenities, setAmenities] = useState([]);
  const [newType, setNewType] = useState("");

  useEffect(() => {
    // API lấy list tiện ích sẽ nằm ở đây. Ví dụ /api/amenities (hiện hệ thống chưa có API GET list chuẩn hóa nếu chưa có bài nào)
    // Tạm thời mock 1 số dữ liệu mẫu.
    setAmenities([
      { id: "1", type: "Máy lạnh" },
      { id: "2", type: "Ban công" },
      { id: "3", type: "Chỗ để xe" },
      { id: "4", type: "Bảo vệ 24/7" },
    ]);
  }, []);

  const handleAdd = () => {
    if (!newType.trim()) return;
    setAmenities([
      ...amenities,
      { id: Date.now().toString(), type: newType.trim() },
    ]);
    setNewType("");
  };

  const handleDelete = (id) => {
    setAmenities(amenities.filter((a) => a.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tính năng / Tiện ích</h2>
          <p className="text-sm text-gray-500 mt-1">
            Chuẩn hoá danh mục tiện ích cho toàn hệ thống
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex gap-3">
          <input
            type="text"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            placeholder="Nhập tên tiện ích mới (vd: Cửa sổ lớn)..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button
            onClick={handleAdd}
            className="px-6 py-2 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            Thêm Ngay
          </button>
        </div>

        <ul className="divide-y divide-gray-100">
          {amenities.map((amenity) => (
            <li
              key={amenity.id}
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
            >
              <span className="font-medium text-gray-700">{amenity.type}</span>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 text-gray-400 hover:text-black rounded-md hover:bg-gray-200 transition-colors">
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(amenity.id)}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
          {amenities.length === 0 && (
            <li className="p-8 text-center text-gray-500">Chưa có tiện ích nào</li>
          )}
        </ul>
      </div>
    </div>
  );
}
