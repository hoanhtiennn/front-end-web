import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Plus, Trash2, Loader2, AlertCircle, Tag } from "lucide-react";

export default function AdminAmenities() {
  const [amenities, setAmenities] = useState([]);
  const [newType, setNewType] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  const token = () => localStorage.getItem("userToken");

  // ── Lấy danh sách tiện ích từ DB ─────────────────────────────────────────
  const fetchAmenities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get("/api/amenities", {
        headers: { Authorization: `Bearer ${token()}` },
      });

      // Bóc data linh hoạt theo nhiều format backend
      let raw = res.data;
      let data =
        raw?.result?.content ||
        raw?.result ||
        raw?.data ||
        raw?.content ||
        raw;

      if (Array.isArray(data)) {
        setAmenities(data);
      } else {
        console.warn("Dữ liệu amenities không phải mảng:", raw);
        setAmenities([]);
      }
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách tiện ích: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAmenities();
  }, [fetchAmenities]);

  // ── Thêm tiện ích mới ─────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newType.trim()) return;
    try {
      setAdding(true);
      await axios.post(
        "/api/amenities",
        { type: newType.trim() },
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      setNewType("");
      await fetchAmenities(); // Refresh danh sách
    } catch (err) {
      console.error(err);
      alert("Thêm tiện ích thất bại: " + (err.response?.data?.message || err.message));
    } finally {
      setAdding(false);
    }
  };

  // ── Xóa tiện ích ─────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Xác nhận xóa tiện ích này?")) return;
    try {
      setDeletingId(id);
      await axios.delete(`/api/amenities/${id}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setAmenities((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
      alert("Xóa thất bại: " + (err.response?.data?.message || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tiện Ích</h2>
          <p className="text-sm text-gray-500 mt-1">
            Chuẩn hoá danh mục tiện ích cho toàn hệ thống
          </p>
        </div>
        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
          {amenities.length} tiện ích
        </span>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Input thêm mới */}
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex gap-3">
          <input
            type="text"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            placeholder="Nhập tên tiện ích mới (vd: Cửa sổ lớn)..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            onKeyDown={(e) => e.key === "Enter" && !adding && handleAdd()}
            disabled={adding}
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newType.trim()}
            className="px-6 py-2 bg-black text-white font-medium rounded-md hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Plus size={18} />
            )}
            {adding ? "Đang thêm..." : "Thêm Ngay"}
          </button>
        </div>

        {/* Danh sách */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
            <Loader2 size={20} className="animate-spin" />
            <span>Đang tải danh sách tiện ích...</span>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {amenities.map((amenity) => (
              <li
                key={amenity.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-gray-100 rounded-md text-gray-500">
                    <Tag size={14} />
                  </div>
                  <span className="font-medium text-gray-700">
                    {amenity.type || amenity.name}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(amenity.id)}
                  disabled={deletingId === amenity.id}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                >
                  {deletingId === amenity.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </li>
            ))}

            {amenities.length === 0 && !loading && (
              <li className="p-8 text-center text-gray-400">
                <Tag size={32} className="mx-auto mb-2 opacity-30" />
                <p>Chưa có tiện ích nào. Hãy thêm tiện ích đầu tiên!</p>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}