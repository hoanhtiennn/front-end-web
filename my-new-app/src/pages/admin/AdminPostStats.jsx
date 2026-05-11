import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  TrendingUp, CreditCard, BarChart2, RefreshCw, AlertTriangle,
  Crown, Zap, Package, DollarSign, Calendar,
} from "lucide-react";

// ── Màu theo loại gói ──
const PLAN_COLORS = {
  PRO:   { bar: "#6366f1", light: "bg-indigo-500",  badge: "bg-indigo-100 text-indigo-700" },
  ULTRA: { bar: "#f59e0b", light: "bg-amber-500",   badge: "bg-amber-100  text-amber-700"  },
  FREE:  { bar: "#94a3b8", light: "bg-slate-400",   badge: "bg-slate-100  text-slate-600"  },
};

/**
 * Sinh dữ liệu thống kê mẫu ngẫu nhiên cho 12 tháng (khi chưa có API thực)
 */
function generateFallbackData() {
  const months = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];
  return months.map((month, i) => ({
    month,
    year: 2026,
    PRO:   Math.floor(Math.random() * 20 + 5),
    ULTRA: Math.floor(Math.random() * 10 + 2),
    FREE:  0,
    totalRevenue: 0, // sẽ tính lại ở dưới
  })).map(row => ({
    ...row,
    totalRevenue: row.PRO * 99000 + row.ULTRA * 249000,
  }));
}

/**
 * Component biểu đồ cột (Bar Chart) tự chế bằng CSS hiển thị số lượng gói PRO/ULTRA
 */
function BarChart({ data, planKeys }) {
  const maxVal = Math.max(...data.map(d => planKeys.reduce((s, k) => s + (d[k] || 0), 0)), 1);

  return (
    <div className="flex items-end gap-1 h-48 w-full">
      {data.map((row, i) => {
        const total = planKeys.reduce((s, k) => s + (row[k] || 0), 0);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            {/* Thanh cột xếp chồng */}
            <div
              className="relative w-full rounded-t-md overflow-hidden flex flex-col-reverse transition-all duration-500"
              style={{ height: `${(total / maxVal) * 100}%`, minHeight: total > 0 ? "4px" : "0" }}
              title={`${row.month}: ${total} gói`}
            >
              {planKeys.map(k => {
                const pct = total > 0 ? ((row[k] || 0) / total) * 100 : 0;
                return pct > 0 ? (
                  <div
                    key={k}
                    style={{ height: `${pct}%`, backgroundColor: PLAN_COLORS[k]?.bar || "#94a3b8" }}
                    className="w-full transition-all"
                  />
                ) : null;
              })}
            </div>

            {/* Tooltip số lượng */}
            <span className="hidden group-hover:block absolute -translate-y-10 text-[10px] font-bold bg-gray-900 text-white px-2 py-0.5 rounded pointer-events-none z-10">
              {total}
            </span>

            {/* Nhãn tháng */}
            <span className="text-[10px] text-gray-400 font-medium">{row.month}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Component biểu đồ cột đơn hiển thị tổng doanh thu
 */
function RevenueChart({ data }) {
  const maxVal = Math.max(...data.map(d => d.totalRevenue || 0), 1);
  return (
    <div className="flex items-end gap-1 h-36 w-full">
      {data.map((row, i) => {
        const pct = (row.totalRevenue / maxVal) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-emerald-500 to-emerald-300 transition-all duration-500"
              style={{ height: `${pct}%`, minHeight: row.totalRevenue > 0 ? "4px" : "0" }}
              title={`${row.month}: ${row.totalRevenue?.toLocaleString("vi-VN")}đ`}
            />
            <span className="text-[10px] text-gray-400 font-medium">{row.month}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Component hiển thị thống kê tổng doanh thu và lượng bán ra của các gói dịch vụ
 */
export default function AdminPostStats() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [isFallback, setIsFallback] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const token = () => localStorage.getItem("userToken");

  /**
   * Gọi API lấy báo cáo thống kê theo năm. Tự động fallback sang số ngẫu nhiên nếu lỗi.
   */
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsFallback(false);
    try {
      const res = await axios.get(`/api/subscriptions/subscription-stats?year=${selectedYear}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      // Backend nên trả về mảng: [{ month, year, PRO, ULTRA, FREE, totalRevenue }]
      const raw = res.data?.result ?? res.data;
      if (Array.isArray(raw) && raw.length > 0) {
        setMonthlyData(raw);
      } else {
        throw new Error("Dữ liệu rỗng hoặc không đúng định dạng");
      }
    } catch (err) {
      console.warn("API chưa sẵn sàng, dùng dữ liệu mẫu:", err.message);
      setMonthlyData(generateFallbackData());
      setIsFallback(true);
      setError("Backend chưa có API /api/subscriptions/subscription-stats — đang hiển thị dữ liệu mẫu.");
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── Tổng hợp số liệu ──
  const totalPRO   = monthlyData.reduce((s, r) => s + (r.PRO   || 0), 0);
  const totalULTRA = monthlyData.reduce((s, r) => s + (r.ULTRA || 0), 0);
  const totalRevenue = monthlyData.reduce((s, r) => s + (r.totalRevenue || 0), 0);
  const totalPurchases = totalPRO + totalULTRA;

  // Tháng tốt nhất
  const bestMonth = monthlyData.reduce((best, cur) => {
    const curTotal = (cur.PRO || 0) + (cur.ULTRA || 0);
    const bestTotal = (best?.PRO || 0) + (best?.ULTRA || 0);
    return curTotal >= bestTotal ? cur : best;
  }, null);

  const planKeys = ["PRO", "ULTRA"];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Thống Kê Doanh Thu Gói</h2>
          <p className="text-sm text-gray-500 mt-1">Gói đã bán và tổng tiền thu được theo từng tháng</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Chọn năm */}
          <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm">
            <Calendar size={14} className="text-gray-400" />
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-semibold text-gray-700 focus:outline-none"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchStats}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all bg-white"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>
      </div>

      {/* ── Warning nếu dùng fallback ── */}
      {isFallback && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm font-medium">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* ── 4 thẻ tổng hợp ── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Tổng lượt mua gói",
              value: totalPurchases.toLocaleString("vi-VN"),
              sub: `Trong năm ${selectedYear}`,
              icon: CreditCard,
              bg: "bg-blue-50", border: "border-blue-100", iconColor: "text-blue-600",
            },
            {
              label: "Gói PRO đã bán",
              value: totalPRO.toLocaleString("vi-VN"),
              sub: `${(totalPurchases ? (totalPRO/totalPurchases*100).toFixed(0) : 0)}% tổng lượt`,
              icon: Crown,
              bg: "bg-indigo-50", border: "border-indigo-100", iconColor: "text-indigo-600",
            },
            {
              label: "Gói ULTRA đã bán",
              value: totalULTRA.toLocaleString("vi-VN"),
              sub: `${(totalPurchases ? (totalULTRA/totalPurchases*100).toFixed(0) : 0)}% tổng lượt`,
              icon: Zap,
              bg: "bg-amber-50", border: "border-amber-100", iconColor: "text-amber-600",
            },
            {
              label: "Tổng doanh thu",
              value: totalRevenue.toLocaleString("vi-VN") + "đ",
              sub: bestMonth ? `Tháng tốt nhất: ${bestMonth.month}` : "—",
              icon: DollarSign,
              bg: "bg-emerald-50", border: "border-emerald-100", iconColor: "text-emerald-600",
            },
          ].map(card => {
            const CardIcon = card.icon;
            return (
              <div key={card.label} className={`p-5 bg-white border ${card.border} rounded-xl shadow-sm`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{card.label}</span>
                  <div className={`w-9 h-9 flex items-center justify-center rounded-lg ${card.bg} border ${card.border}`}>
                    <CardIcon size={16} className={card.iconColor} />
                  </div>
                </div>
                <p className="text-2xl font-black text-gray-900 truncate">{card.value}</p>
                <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Hai biểu đồ ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Biểu đồ gói bán theo tháng */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-indigo-50 border border-indigo-100 flex items-center justify-center rounded-lg">
              <BarChart2 size={16} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Số Gói Bán Theo Tháng</h3>
              <p className="text-xs text-gray-400">PRO + ULTRA</p>
            </div>
          </div>

          {/* Chú thích */}
          <div className="flex items-center gap-4 mt-3 mb-4">
            {planKeys.map(k => (
              <div key={k} className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: PLAN_COLORS[k].bar }} />
                {k}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="h-48 bg-gray-50 animate-pulse rounded-lg" />
          ) : (
            <BarChart data={monthlyData} planKeys={planKeys} />
          )}
        </div>

        {/* Biểu đồ doanh thu theo tháng */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-emerald-50 border border-emerald-100 flex items-center justify-center rounded-lg">
              <TrendingUp size={16} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Doanh Thu Theo Tháng (VNĐ)</h3>
              <p className="text-xs text-gray-400">Tổng tiền thu được từ gói trả phí</p>
            </div>
          </div>

          <div className="mt-3 mb-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <span className="w-3 h-3 rounded-sm bg-emerald-400" />
              Doanh thu
            </div>
          </div>

          {loading ? (
            <div className="h-36 bg-gray-50 animate-pulse rounded-lg" />
          ) : (
            <RevenueChart data={monthlyData} />
          )}
        </div>
      </div>

      {/* ── Bảng chi tiết theo tháng ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <Package size={16} className="text-gray-500" />
          <h3 className="font-bold text-gray-900 text-sm">Chi Tiết Theo Tháng</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tháng</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-indigo-600 uppercase tracking-wide">PRO</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-amber-600 uppercase tracking-wide">ULTRA</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tổng gói</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-emerald-600 uppercase tracking-wide">Doanh thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({length: 6}).map((_, i) => (
                  <tr key={i}>
                    {[1,2,3,4,5].map(j => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                monthlyData.map((row, i) => {
                  const total = (row.PRO || 0) + (row.ULTRA || 0);
                  const isBest = bestMonth?.month === row.month;
                  return (
                    <tr key={i} className={`hover:bg-gray-50 transition-colors ${isBest ? "bg-amber-50/50" : ""}`}>
                      <td className="px-6 py-3.5 font-semibold text-gray-800 flex items-center gap-2">
                        {row.month} {row.year}
                        {isBest && total > 0 && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                            🏆 Tốt nhất
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${row.PRO > 0 ? "bg-indigo-100 text-indigo-700" : "text-gray-300"}`}>
                          {row.PRO || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${row.ULTRA > 0 ? "bg-amber-100 text-amber-700" : "text-gray-300"}`}>
                          {row.ULTRA || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-gray-800">
                        {total > 0 ? total : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold text-emerald-700">
                        {row.totalRevenue > 0 ? row.totalRevenue.toLocaleString("vi-VN") + "đ" : <span className="text-gray-300 font-normal">—</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {!loading && (
              <tfoot className="bg-gray-900 text-white">
                <tr>
                  <td className="px-6 py-3.5 font-bold text-sm">TỔNG CỘNG</td>
                  <td className="px-4 py-3.5 text-center font-black text-indigo-300">{totalPRO}</td>
                  <td className="px-4 py-3.5 text-center font-black text-amber-300">{totalULTRA}</td>
                  <td className="px-4 py-3.5 text-center font-black">{totalPurchases}</td>
                  <td className="px-6 py-3.5 text-right font-black text-emerald-300">{totalRevenue.toLocaleString("vi-VN")}đ</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}