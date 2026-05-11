import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import {
  Users, Home, ShieldCheck, CreditCard, TrendingUp, RefreshCw,
  CheckCircle2, XCircle, Clock, AlertTriangle,
} from "lucide-react";

/**
 * Component hiển thị thẻ thống kê số liệu (StatCard) với biểu tượng và màu sắc
 */
function StatCard({ title, value, sub, icon, accent, loading }) {
  // Gán vào biến viết hoa để dùng làm JSX component — linter nhận biết rõ ràng hơn
  const Icon = icon;
  return (
    <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div className={`w-10 h-10 flex items-center justify-center rounded-lg border ${accent.bg} ${accent.border}`}>
          <Icon size={18} className={accent.icon} />
        </div>
      </div>
      {loading ? (
        <div className="h-9 w-24 bg-gray-100 animate-pulse rounded-lg" />
      ) : (
        <h3 className="text-3xl font-black text-gray-900">{value}</h3>
      )}
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

StatCard.propTypes = {
  title:   PropTypes.string.isRequired,
  value:   PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sub:     PropTypes.string,
  icon:    PropTypes.elementType.isRequired,
  accent:  PropTypes.shape({
    bg:     PropTypes.string.isRequired,
    border: PropTypes.string.isRequired,
    icon:   PropTypes.string.isRequired,
  }).isRequired,
  loading: PropTypes.bool,
};

StatCard.defaultProps = {
  value:   "—",
  sub:     null,
  loading: false,
};

/**
 * Component trang chủ của Admin, hiển thị bảng tóm tắt và số liệu tổng quan của hệ thống
 */
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = () => localStorage.getItem("userToken");

  /**
   * Gọi API lấy dữ liệu thống kê tổng quan của toàn bộ hệ thống
   */
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setStats(res.data?.result ?? res.data);
    } catch (err) {
      setError("Không thể tải số liệu tổng quan.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  let summaryContent = null;
  if (loading) {
    summaryContent = (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 animate-pulse rounded-lg" />)}
      </div>
    );
  } else if (stats) {
    summaryContent = (
      <div className="space-y-3">
        {[
          { label: "Bài đăng đang hiển thị",    value: stats.activePosts,         icon: CheckCircle2, color: "text-green-600",  bg: "bg-green-50" },
          { label: "Bài đăng đã đóng",           value: stats.closedPosts,          icon: XCircle,      color: "text-gray-400",  bg: "bg-gray-50" },
          { label: "Yêu cầu xác minh đang chờ", value: stats.pendingVerifications, icon: Clock,        color: "text-orange-500", bg: "bg-orange-50" },
          { label: "Tổng người dùng đăng ký",    value: stats.totalUsers,           icon: Users,        color: "text-blue-600",  bg: "bg-blue-50" },
          { label: "Tổng lượt mua gói dịch vụ", value: stats.totalSubscriptions,   icon: CreditCard,   color: "text-purple-600", bg: "bg-purple-50" },
        ].map(row => {
          const RowIcon = row.icon;
          return (
            <div key={row.label} className={`flex items-center justify-between px-4 py-3 rounded-xl ${row.bg}`}>
              <div className="flex items-center gap-3">
                <RowIcon size={16} className={row.color} />
                <span className="text-sm font-medium text-gray-700">{row.label}</span>
              </div>
              <span className="font-bold text-gray-900">{row.value?.toLocaleString("vi-VN")}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // Tách nested ternary trong Quick Actions
  const verificationSub = stats?.pendingVerifications > 0
    ? `${stats.pendingVerifications} đang chờ`
    : "Không có yêu cầu mới";

  const cards = [
    {
      title: "Tổng Người Dùng",
      value: stats?.totalUsers?.toLocaleString("vi-VN") ?? "—",
      sub: "Toàn bộ tài khoản hệ thống",
      icon: Users,
      accent: { bg: "bg-blue-50", border: "border-blue-100", icon: "text-blue-600" },
    },
    {
      title: "Bài Đăng Đang Mở",
      value: stats?.activePosts?.toLocaleString("vi-VN") ?? "—",
      sub: stats ? `+ ${stats.closedPosts} đã đóng` : "",
      icon: Home,
      accent: { bg: "bg-green-50", border: "border-green-100", icon: "text-green-600" },
    },
    {
      title: "Chờ Xác Minh",
      value: stats?.pendingVerifications?.toLocaleString("vi-VN") ?? "—",
      sub: "CCCD cần kiểm duyệt",
      icon: ShieldCheck,
      accent: {
        bg: stats?.pendingVerifications > 0 ? "bg-orange-50" : "bg-gray-50",
        border: stats?.pendingVerifications > 0 ? "border-orange-100" : "border-gray-100",
        icon: stats?.pendingVerifications > 0 ? "text-orange-500" : "text-gray-400",
      },
    },
    {
      title: "Gói Dịch Vụ",
      value: stats?.totalSubscriptions?.toLocaleString("vi-VN") ?? "—",
      sub: "Tổng lượt đăng ký gói",
      icon: CreditCard,
      accent: { bg: "bg-purple-50", border: "border-purple-100", icon: "text-purple-600" },
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tổng Quan Hệ Thống</h2>
          <p className="text-sm text-gray-500 mt-0.5">Số liệu thực tế từ cơ sở dữ liệu</p>
        </div>
        <button
          onClick={fetchStats}
          className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <StatCard key={c.title} {...c} loading={loading} />
        ))}
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Quick Summary */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-5">Bảng Tóm Tắt</h3>
          {summaryContent}
        </div>

        {/* Quick actions */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-5">Truy Cập Nhanh</h3>
          <div className="space-y-3">
            {[
              { label: "Quản lý người dùng", sub: `${stats?.totalUsers ?? "..."} tài khoản`,    icon: Users,       color: "text-blue-600",   bg: "bg-blue-50" },
              { label: "Duyệt xác minh",      sub: verificationSub,                              icon: ShieldCheck, color: "text-orange-500", bg: "bg-orange-50" },
              { label: "Bài đăng hệ thống",   sub: `${stats?.totalPosts ?? "..."} bài tổng cộng`, icon: Home,      color: "text-green-600",  bg: "bg-green-50" },
              { label: "Gói dịch vụ",         sub: `${stats?.totalSubscriptions ?? "..."} lượt`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
            ].map(item => {
              const ItemIcon = item.icon;
              return (
                <div key={item.label} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:opacity-80 transition-opacity ${item.bg}`}>
                  <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <ItemIcon size={16} className={item.color} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
