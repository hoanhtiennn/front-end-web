import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Eye,
  CheckCircle2,
  XCircle,
  X,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

const STATUS_CONFIG = {
  PENDING: {
    label: "Chờ duyệt (Auto)",
    cls: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  },
  PENDING_MANUAL: {
    label: "Chờ duyệt (Thủ công)",
    cls: "bg-orange-100 text-orange-800 border border-orange-200",
  },
  APPROVED: {
    label: "Đã duyệt",
    cls: "bg-green-100 text-green-800 border border-green-200",
  },
  REJECTED: {
    label: "Từ chối",
    cls: "bg-red-100 text-red-800 border border-red-200",
  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || {
    label: status,
    cls: "bg-gray-100 text-gray-700 border border-gray-200",
  };
  return (
    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function formatDate(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function AdminVerifications() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedReq, setSelectedReq] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  // Custom confirm modal state
  const [confirmDialog, setConfirmDialog] = useState(null); // { title, message, icon, variant, onConfirm }

  const token = () => localStorage.getItem("userToken");

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ page: 0, size: 200 });
      if (statusFilter) params.append("status", statusFilter);

      const res = await axios.get(`/api/verifications?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });

      // Bóc mảng từ PageResponse hoặc plain array
      let data = [];
      if (Array.isArray(res.data)) data = res.data;
      else if (Array.isArray(res.data?.content)) data = res.data.content;
      else if (Array.isArray(res.data?.result?.content))
        data = res.data.result.content;

      setRequests(data);
    } catch (err) {
      setError("Không thể tải danh sách yêu cầu xác minh.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const showConfirm = (opts) => setConfirmDialog(opts);
  const closeConfirm = () => setConfirmDialog(null);

  const handleApprove = (id) => {
    showConfirm({
      title: "Xác nhận Duyệt",
      message:
        "Bạn chắc chắn muốn DUYỆT yêu cầu xác minh này? Hành động này sẽ cập nhật trạng thái của Landlord.",
      variant: "success",
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await axios.put(
            `/api/verifications/${id}/approve`,
            {},
            {
              headers: { Authorization: `Bearer ${token()}` },
            },
          );
          setSelectedReq(null);
          fetchAll();
        } catch (err) {
          showConfirm({
            title: "Duyệt thất bại",
            message: err.response?.data?.message || err.message,
            variant: "error",
            onConfirm: closeConfirm,
          });
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) {
      showConfirm({
        title: "Thiếu thông tin",
        message: "Vui lòng nhập lý do từ chối trước khi xác nhận.",
        variant: "error",
        onConfirm: closeConfirm,
      });
      return;
    }
    try {
      setActionLoading(true);
      await axios.put(
        `/api/verifications/${id}/reject`,
        { reason: rejectReason },
        {
          headers: { Authorization: `Bearer ${token()}` },
        },
      );
      setSelectedReq(null);
      setRejectReason("");
      setShowRejectInput(false);
      fetchAll();
    } catch (err) {
      showConfirm({
        title: "Từ chối thất bại",
        message: err.response?.data?.message || err.message,
        variant: "error",
        onConfirm: closeConfirm,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = requests.filter(
    (r) => r.status === "PENDING" || r.status === "PENDING_MANUAL",
  ).length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = requests.filter((r) => r.status === "REJECTED").length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Quản lý Xác minh CCCD
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Kiểm duyệt giấy tờ tùy thân của chủ trọ
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {/* Stat counters */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Chờ duyệt",
            count: pendingCount,
            color: "text-yellow-700",
            bg: "bg-yellow-50 border-yellow-200",
          },
          {
            label: "Đã duyệt",
            count: approvedCount,
            color: "text-green-700",
            bg: "bg-green-50 border-green-200",
          },
          {
            label: "Từ chối",
            count: rejectedCount,
            color: "text-red-700",
            bg: "bg-red-50 border-red-200",
          },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border px-5 py-4 ${s.bg}`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-xs font-semibold text-gray-500 mt-0.5">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { value: "", label: "Tất cả" },
          { value: "PENDING", label: "Chờ duyệt (Auto)" },
          { value: "PENDING_MANUAL", label: "Chờ duyệt (Thủ công)" },
          { value: "APPROVED", label: "Đã duyệt" },
          { value: "REJECTED", label: "Từ chối" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
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
              <th className="px-6 py-4">Tài khoản</th>
              <th className="px-6 py-4">Họ tên (OCR)</th>
              <th className="px-6 py-4">Ngày gửi</th>
              <th className="px-6 py-4 text-center">Trạng thái</th>
              <th className="px-6 py-4 text-center">Tự động</th>
              <th className="px-6 py-4 text-right">Xử lý</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-10 text-center text-gray-400"
                >
                  Đang tải...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-10 text-center text-gray-400"
                >
                  Không có yêu cầu nào
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">
                      {r.userName || "—"}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {r.userEmail || "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700 font-medium">
                    {r.extractedName || "Chưa đọc"}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {formatDate(r.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    {r.autoVerified ? (
                      <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                        Tự động
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
                        Thủ công
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedReq(r);
                          setShowRejectInput(false);
                          setRejectReason("");
                        }}
                        title="Xem chi tiết"
                        className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                      {(r.status === "PENDING" ||
                        r.status === "PENDING_MANUAL") && (
                        <>
                          <button
                            onClick={() => handleApprove(r.id)}
                            title="Duyệt"
                            className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReq(r);
                              setShowRejectInput(true);
                            }}
                            title="Từ chối"
                            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===== Popup Chi Tiết ===== */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header popup */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-lg text-gray-900">
                  Chi tiết Xác minh
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedReq.userEmail}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedReq(null);
                  setShowRejectInput(false);
                  setRejectReason("");
                }}
                className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Thông tin cơ bản */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  {
                    label: "Họ tên (OCR)",
                    value: selectedReq.extractedName || "—",
                  },
                  {
                    label: "Số CCCD (OCR)",
                    value: selectedReq.extractedIdNumber || "—",
                  },
                  {
                    label: "Trạng thái",
                    value: <StatusBadge status={selectedReq.status} />,
                  },
                  {
                    label: "Confidence",
                    value:
                      selectedReq.confidenceScore != null
                        ? `${(selectedReq.confidenceScore * 100).toFixed(1)}%`
                        : "—",
                  },
                  {
                    label: "Ngày gửi",
                    value: formatDate(selectedReq.createdAt),
                  },
                  {
                    label: "Ngày duyệt",
                    value: formatDate(selectedReq.reviewedAt),
                  },
                  { label: "Ghi chú", value: selectedReq.note || "—" },
                  {
                    label: "Lý do từ chối",
                    value: selectedReq.rejectReason || "—",
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3"
                  >
                    <div className="text-xs text-gray-500 font-semibold mb-1">
                      {label}
                    </div>
                    <div className="font-semibold text-gray-900">{value}</div>
                  </div>
                ))}
              </div>

              {/* Ảnh CCCD */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Ảnh CCCD
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Mặt trước",
                      url: selectedReq.idCardFrontSignedUrl,
                    },
                    { label: "Mặt sau", url: selectedReq.idCardBackSignedUrl },
                  ].map(({ label, url }) => (
                    <div
                      key={label}
                      className="rounded-xl overflow-hidden border border-gray-200"
                    >
                      <div className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">
                        {label}
                      </div>
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={url}
                            alt={label}
                            className="w-full object-cover max-h-48 hover:opacity-90 transition-opacity cursor-zoom-in"
                          />
                        </a>
                      ) : (
                        <div className="h-32 flex items-center justify-center text-gray-400 text-xs bg-gray-50">
                          Không có ảnh
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Reject input — hiện khi PENDING hoặc PENDING_MANUAL */}
              {showRejectInput && (selectedReq.status === "PENDING" || selectedReq.status === "PENDING_MANUAL") && (
                <div className="border border-red-200 bg-red-50 rounded-xl p-4 space-y-3">
                  <label className="text-sm font-bold text-red-700">
                    Lý do từ chối *
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                    placeholder="Nhập lý do từ chối rõ ràng..."
                    className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none bg-white"
                  />
                </div>
              )}
            </div>

            {/* Footer actions — hiện khi PENDING hoặc PENDING_MANUAL */}
            {(selectedReq.status === "PENDING" || selectedReq.status === "PENDING_MANUAL") && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                {!showRejectInput ? (
                  <>
                    <button
                      onClick={() => setShowRejectInput(true)}
                      className="px-4 py-2 border border-red-300 text-red-700 font-semibold text-sm rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Từ chối
                    </button>
                    <button
                      onClick={() => handleApprove(selectedReq.id)}
                      disabled={actionLoading}
                      className="px-5 py-2 bg-black text-white font-semibold text-sm rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? "Đang xử lý..." : "Duyệt ngay"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setShowRejectInput(false)}
                      className="px-4 py-2 border border-gray-200 text-gray-700 font-semibold text-sm rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => handleReject(selectedReq.id)}
                      disabled={actionLoading || !rejectReason.trim()}
                      className="px-5 py-2 bg-red-600 text-white font-semibold text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-40"
                    >
                      {actionLoading ? "Đang xử lý..." : "Xác nhận Từ chối"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Custom Confirm/Alert Dialog ===== */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            {/* Icon area */}
            <div
              className={`flex flex-col items-center px-6 pt-8 pb-5 ${
                confirmDialog.variant === "success"
                  ? "bg-green-50"
                  : confirmDialog.variant === "error"
                    ? "bg-red-50"
                    : "bg-gray-50"
              }`}
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
                  confirmDialog.variant === "success"
                    ? "bg-green-100"
                    : confirmDialog.variant === "error"
                      ? "bg-red-100"
                      : "bg-gray-100"
                }`}
              >
                {confirmDialog.variant === "success" ? (
                  <CheckCircle2 size={28} className="text-green-600" />
                ) : confirmDialog.variant === "error" ? (
                  <AlertCircle size={28} className="text-red-600" />
                ) : (
                  <AlertCircle size={28} className="text-gray-600" />
                )}
              </div>
              <h3 className="font-bold text-lg text-gray-900 text-center">
                {confirmDialog.title}
              </h3>
              <p className="text-sm text-gray-500 text-center mt-1.5 leading-relaxed">
                {confirmDialog.message}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 px-6 py-4 bg-white">
              {/* Cancel button — only show for confirm dialogs (when it's not an error-only alert) */}
              {confirmDialog.variant === "success" && (
                <button
                  onClick={closeConfirm}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Hủy bỏ
                </button>
              )}
              <button
                onClick={() => {
                  closeConfirm();
                  confirmDialog.onConfirm();
                }}
                disabled={actionLoading}
                className={`flex-1 px-4 py-2.5 font-semibold text-sm rounded-xl transition-colors disabled:opacity-50 ${
                  confirmDialog.variant === "success"
                    ? "bg-black text-white hover:bg-gray-800"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {actionLoading
                  ? "Đang xử lý..."
                  : confirmDialog.variant === "success"
                    ? "Xác nhận Duyệt"
                    : "Đóng"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
