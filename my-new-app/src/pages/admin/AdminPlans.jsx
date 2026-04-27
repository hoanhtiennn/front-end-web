import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Edit2, Package, Check, AlertCircle, X, Save } from "lucide-react";

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Modal State
  const [editingPlan, setEditingPlan] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const token = () => localStorage.getItem("userToken");

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Giả định backend có API này
      const res = await axios.get("/api/plans", {
        headers: { Authorization: `Bearer ${token()}` }
      });
      
      // Bóc tách dữ liệu linh hoạt theo nhiều format backend
      let rawData = res.data;

      // Backend đôi khi trả về JSON dạng string (double-serialized) → cần parse thêm 1 lần
      if (typeof rawData === "string") {
        try { rawData = JSON.parse(rawData); } catch (e) { /* giữ nguyên nếu parse lỗi */ }
      }

      let data = rawData?.result?.content || rawData?.result || rawData?.data || rawData?.content || rawData;

      // Nếu data vẫn là string, thử parse tiếp
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch (e) { /* giữ nguyên */ }
      }
      
      console.log("Plans API Response:", rawData);
      console.log("Extracted Data:", data);

      if (Array.isArray(data)) {
        // Sort: FREE -> PRO -> ULTRA
        const order = { FREE: 1, PRO: 2, ULTRA: 3 };
        data.sort((a, b) => (order[a.id] || 99) - (order[b.id] || 99));
        setPlans(data);
      } else {
        console.warn("Dữ liệu trả về không phải là mảng. Data:", data, "Raw:", rawData);
        setFallbackPlans();
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi khi gọi GET /api/plans:\n" + (err.response?.data?.message || err.message));
      // Fallback cho tới khi backend code xong
      setFallbackPlans();
      setError("Không thể tải cấu hình gói từ Server. Đang hiển thị dữ liệu mẫu.");
    } finally {
      setLoading(false);
    }
  }, []);

  const setFallbackPlans = () => {
    setPlans([
      { id: "FREE", displayName: "FREE", priceMonthly: 0, priceYearly: 0, maxPosts: 3, maxImages: 3 },
      { id: "PRO", displayName: "PRO", priceMonthly: 99000, priceYearly: 990000, maxPosts: 20, maxImages: 10 },
      { id: "ULTRA", displayName: "ULTRA", priceMonthly: 249000, priceYearly: 2490000, maxPosts: 999999, maxImages: 20 },
    ]);
  };

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await axios.put(`/api/plans/${editingPlan.id}`, editingPlan, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      setEditingPlan(null);
      fetchPlans(); // Refresh
      setError(null);
      alert("Cập nhật thành công!");
    } catch (err) {
      console.error(err);
      const backendMsg = err.response?.data?.message || err.response?.statusText || err.message;
      alert(`Cập nhật thất bại!\nMã lỗi: ${err.response?.status || 'Unknown'}\nChi tiết: ${backendMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEditChange = (field, value) => {
    setEditingPlan(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return "0đ";
    return price.toLocaleString("vi-VN") + "đ";
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tính năng Gói Dịch Vụ</h2>
          <p className="text-sm text-gray-500 mt-1">Cấu hình giới hạn và giá tiền từng gói</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-700 text-sm font-medium">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-10 text-gray-400">Đang tải cấu hình gói...</div>
        ) : (
          plans.map((p) => {
            const isFeatured = p.id === "PRO"; // Highlight PRO
            return (
              <div
                key={p.id}
                className={`relative bg-white border ${
                  isFeatured ? "border-black shadow-md" : "border-gray-200 shadow-sm"
                } rounded-xl p-6 flex flex-col transition-all hover:shadow-lg`}
              >
                {isFeatured && (
                  <div className="absolute top-0 right-6 -translate-y-1/2 px-3 py-1 bg-black text-white text-xs font-bold rounded-full">
                    HOT
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${isFeatured ? "bg-black text-white" : "bg-gray-100 text-gray-800"}`}>
                    <Package size={20} />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">{p.displayName || p.id}</h3>
                </div>
                
                <div className="mb-6">
                  <span className="text-3xl font-black text-gray-900">{formatPrice(p.priceMonthly)}</span>
                  <span className="text-gray-500 text-sm"> / tháng</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <Check size={16} className="text-black" />
                    Đăng tối đa: <span className="font-bold">{p.maxPosts > 1000 ? "Không giới hạn" : p.maxPosts}</span> tin
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <Check size={16} className="text-black" />
                    Tối đa: <span className="font-bold">{p.maxImages}</span> ảnh / tin
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <Check size={16} className="text-black" />
                    Giá theo năm: <span className="font-bold">{formatPrice(p.priceYearly)}</span>
                  </li>
                </ul>

                <button 
                  onClick={() => setEditingPlan(p)}
                  className="w-full py-2.5 flex items-center justify-center gap-2 border border-black text-black font-semibold rounded-md hover:bg-black hover:text-white transition-colors"
                >
                  <Edit2 size={16} />
                  Chỉnh sửa
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900">
                Chỉnh sửa Gói: <span className="text-blue-600">{editingPlan.id}</span>
              </h3>
              <button
                onClick={() => setEditingPlan(null)}
                className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tên hiển thị</label>
                <input
                  type="text"
                  value={editingPlan.displayName || ""}
                  onChange={(e) => handleEditChange("displayName", e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Giá theo tháng (VND)</label>
                  <input
                    type="number"
                    value={editingPlan.priceMonthly || 0}
                    onChange={(e) => handleEditChange("priceMonthly", Number(e.target.value))}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Giá theo năm (VND)</label>
                  <input
                    type="number"
                    value={editingPlan.priceYearly || 0}
                    onChange={(e) => handleEditChange("priceYearly", Number(e.target.value))}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Số tin tối đa</label>
                  <input
                    type="number"
                    value={editingPlan.maxPosts || 0}
                    onChange={(e) => handleEditChange("maxPosts", Number(e.target.value))}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    min="1"
                    required
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Ghi 999999 nếu không giới hạn</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Số ảnh tối đa / tin</label>
                  <input
                    type="number"
                    value={editingPlan.maxImages || 0}
                    onChange={(e) => handleEditChange("maxImages", Number(e.target.value))}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-700 font-semibold text-sm rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-black text-white font-semibold text-sm rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? "Đang lưu..." : (
                    <>
                      <Save size={16} /> Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}