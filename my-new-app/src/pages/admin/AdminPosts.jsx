import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Search, ExternalLink, Ban, Eye, ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from "lucide-react";

const STATUS_MAP = {
  ACTIVE: { label: "Đang hiển thị", cls: "bg-green-100 text-green-800 border-green-200" },
  CLOSED: { label: "Đã cho thuê",       cls: "bg-gray-200 text-gray-600 border-gray-300" },
};

const ROOM_TYPE_MAP = {
  ROOM:       "Phòng trọ",
  APARTMENT:  "Căn hộ",
  DORMITORY:  "KTX",
  HOUSE:      "Nhà nguyên căn",
  STUDIO:     "Studio",
};

function formatPrice(price) {
  if (!price) return "—";
  return new Intl.NumberFormat("vi-VN").format(price) + " đ";
}

function formatDate(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("vi-VN");
}

const PAGE_SIZE = 10;

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const token = () => localStorage.getItem("userToken");

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ page: page + 1, size: PAGE_SIZE });
      if (statusFilter) params.append("status", statusFilter);

      let res;
      try {
        // Thử gọi endpoint của Admin trước (để lấy cả bài ACTIVE và CLOSED)
        res = await axios.get(`/api/posts/admin?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token()}` },
        });
      } catch (adminErr) {
        // Fallback về API cũ nếu không có endpoint admin
        res = await axios.get(`/api/posts?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token()}` },
        });
      }

      // Bóc data từ PageResponse hoặc wrapped response
      let content = [];
      let total = 0;
      let pages = 0;

      if (Array.isArray(res.data)) {
        content = res.data;
        total = res.data.length;
        pages = 1;
      } else if (Array.isArray(res.data?.content)) {
        content = res.data.content;
        total = res.data.totalElements ?? res.data.content.length;
        pages = res.data.totalPages ?? 1;
      } else if (Array.isArray(res.data?.result?.content)) {
        content = res.data.result.content;
        total = res.data.result.totalElements ?? content.length;
        pages = res.data.result.totalPages ?? 1;
      }

      setPosts(content);
      setTotalElements(total);
      setTotalPages(pages);
    } catch (err) {
      setError("Không thể tải danh sách bài đăng.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Search and status filter client-side (trên trang hiện tại)
  const displayed = posts.filter(p => {
    if (statusFilter && p.status !== statusFilter) return false;
    
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.user?.email?.toLowerCase().includes(q) ||
      p.user?.fullName?.toLowerCase().includes(q) ||
      p.id?.toLowerCase().includes(q)
    );
  });

  const activeCount = posts.filter(p => p.status === "ACTIVE").length;
  const closedCount = posts.filter(p => p.status === "CLOSED").length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Bài Đăng Hệ Thống</h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý nội dung tin đăng phòng trọ</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm tiêu đề, email..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm w-56"
            />
          </div>
          <button
            onClick={() => { setPage(0); fetchPosts(); }}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-all"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Tổng bài",       count: totalElements,  color: "text-gray-800",   bg: "bg-gray-50 border-gray-200" },
          { label: "Đang hiển thị",  count: activeCount,    color: "text-green-700",  bg: "bg-green-50 border-green-200" },
          { label: "Đã cho thuê",    count: closedCount,    color: "text-gray-600",   bg: "bg-gray-100 border-gray-300" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border px-5 py-4 ${s.bg}`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "",       label: "Tất cả" },
          { value: "ACTIVE", label: "Đang hiển thị" },
          { value: "CLOSED", label: "Đã cho thuê" },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => { setStatusFilter(f.value); setPage(0); }}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
              statusFilter === f.value
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden text-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-200 text-gray-500 font-semibold uppercase text-[11px] tracking-wider">
              <th className="px-6 py-4">Bài đăng</th>
              <th className="px-6 py-4">Người đăng</th>
              <th className="px-6 py-4">Loại / Khu vực</th>
              <th className="px-6 py-4">Giá / Ngày đăng</th>
              <th className="px-6 py-4 text-center">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-400">Đang tải...</td></tr>
            ) : displayed.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-400">Không tìm thấy bài đăng nào</td></tr>
            ) : displayed.map(p => {
              const stCfg = STATUS_MAP[p.status] || { label: p.status, cls: "bg-gray-100 text-gray-600 border-gray-200" };
              const thumb = p.images?.[0]?.url;
              return (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  {/* Tên bài */}
                  <td className="px-6 py-4 max-w-[240px]">
                    <div className="flex items-start gap-3">
                      {thumb ? (
                        <img src={thumb} alt="" className="w-12 h-10 object-cover rounded-lg shrink-0 border border-gray-100" />
                      ) : (
                        <div className="w-12 h-10 bg-gray-100 rounded-lg shrink-0 flex items-center justify-center text-gray-300 text-xs">No img</div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900 truncate max-w-[160px]">{p.title}</div>
                        <div className="text-gray-400 text-[11px] mt-0.5 font-mono">{p.id?.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>

                  {/* Người đăng */}
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">{p.user?.fullName || "—"}</div>
                    <div className="text-xs text-gray-500">{p.user?.email || "—"}</div>
                  </td>

                  {/* Loại / Khu vực */}
                  <td className="px-6 py-4">
                    <div className="text-gray-700 font-medium">{ROOM_TYPE_MAP[p.roomType] || p.roomType || "—"}</div>
                    <div className="text-xs text-gray-400">{p.location?.district || p.location?.city || "—"}</div>
                  </td>

                  {/* Giá / Ngày */}
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{formatPrice(p.price)}</div>
                    <div className="text-xs text-gray-400">{formatDate(p.createdAt)}</div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${stCfg.cls}`}>
                      {stCfg.label}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button title="Xem chi tiết" className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors">
                        <Eye size={15} />
                      </button>
                      <button title="Ẩn / Hiện bài" className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors">
                        <Ban size={15} />
                      </button>
                      <a
                        href={`/posts/${p.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Mở bài đăng"
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex"
                      >
                        <ExternalLink size={15} />
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50">
            <span className="text-xs text-gray-500">
              Trang {page + 1} / {totalPages} · Tổng {totalElements} bài
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold border transition-colors ${
                      pageNum === page
                        ? "bg-black text-white border-black"
                        : "border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}