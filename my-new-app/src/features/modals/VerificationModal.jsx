import { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "../../context/UserContext";
import {
  X, Upload, CheckCircle2, Clock, XCircle,
  ShieldCheck, AlertTriangle, Loader2, FileText, Image
} from "lucide-react";

const STATUS_CONFIG = {
  PENDING: {
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-50 border-amber-200",
    label: "Đang chờ xử lý tự động...",
    desc: "Hệ thống AI đang xác minh CCCD của bạn"
  },
  PENDING_MANUAL: {
    icon: Clock,
    color: "text-blue-500",
    bg: "bg-blue-50 border-blue-200",
    label: "Chờ admin xét duyệt",
    desc: "Hệ thống đã chuyển sang xét duyệt thủ công"
  },
  APPROVED: {
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-50 border-emerald-200",
    label: "Đã xác minh thành công ✅",
    desc: "Tài khoản của bạn đã được xác minh danh tính"
  },
  REJECTED: {
    icon: XCircle,
    color: "text-rose-500",
    bg: "bg-rose-50 border-rose-200",
    label: "Bị từ chối",
    desc: ""
  },
};

const UploadBox = ({ label, hint, value, onChange, loading }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</label>
    <label className={`flex flex-col items-center justify-center w-full min-h-[120px] border-2 rounded-xl cursor-pointer transition-all ${
      value
        ? "border-emerald-400/50 bg-emerald-50"
        : "border-gray-200 border-dashed bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
    } ${loading ? "opacity-50 pointer-events-none" : ""}`}>
      {loading ? (
        <div className="flex flex-col items-center gap-2 py-6">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
          <p className="text-xs text-gray-500">Đang upload...</p>
        </div>
      ) : value ? (
        <div className="flex flex-col items-center gap-2 py-5">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          <p className="text-xs text-emerald-600 font-semibold">Đã upload thành công</p>
          <p className="text-[10px] text-gray-500 px-3 text-center break-all">{value}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-6 text-gray-500">
          <Image className="w-8 h-8 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">Nhấn để chọn ảnh</p>
          <p className="text-[11px] text-gray-500">{hint}</p>
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
        disabled={loading}
      />
    </label>
  </div>
);

const VerificationModal = ({ onBack }) => {
  const { user, updateUser } = useUser();
  const token = localStorage.getItem("userToken");

  const [status, setStatus] = useState(null);   // trạng thái hiện tại
  const [loadingStatus, setLoadingStatus] = useState(true);

  const [frontId, setFrontId] = useState("");
  const [backId, setBackId]   = useState("");
  const [note, setNote]       = useState("");

  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack]   = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState(false);

  // Kiểm tra trạng thái xác minh hiện tại
  useEffect(() => {
    let isMounted = true;
    setStatus(null);
    setLoadingStatus(true);

    if (!token) {
      setLoadingStatus(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        // Refresh profile trước để tránh tình trạng "mới mở modal vẫn hiện chưa xác minh".
        const meRes = await axios.get("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const me = meRes.data?.result || meRes.data?.data || meRes.data;
        const nextVerified = me?.isVerified || me?.is_verified || false;
        if (isMounted) {
          updateUser({ isVerified: nextVerified });
        }
        if (nextVerified) {
          if (isMounted) setStatus({ status: "APPROVED" });
          return;
        }
      } catch (err) {
        if (isMounted) {
          console.warn("Không thể refresh profile xác minh:", err?.message);
        }
      }

      try {
        const res = await axios.get("/api/verifications/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!isMounted) return;
        const d = res.data?.result || res.data?.data || res.data;
        setStatus(d);
      } catch (err) {
        if (!isMounted) return;
        if (err.response?.status !== 404) {
          console.error("Lỗi lấy trạng thái xác minh:", err);
        }
      } finally {
        if (isMounted) setLoadingStatus(false);
      }
    };
    fetchStatus();
      
    return () => { isMounted = false; };
  // dùng user.id thay vì user để tránh loop vô hạn
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id, user?.isVerified]);

  const uploadFile = async (file, setId, setUploading) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post("/api/upload/verification", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      const payload = res.data?.result || res.data?.data || res.data || {};
      const publicId =
        payload.public_id ||
        payload.publicId ||
        payload.id ||
        payload.fileId ||
        payload.secure_url;
      if (!publicId) throw new Error("Không nhận được public_id từ server");
      setId(publicId);
    } catch (err) {
      setError("Upload ảnh thất bại: " + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!frontId || !backId) {
      setError("Vui lòng upload đủ ảnh CCCD mặt trước và mặt sau!");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await axios.post("/api/verifications", {
        idCardFrontPublicId: frontId,
        idCardBackPublicId:  backId,
        idCardFrontId: frontId,
        idCardBackId: backId,
        frontImagePublicId: frontId,
        backImagePublicId: backId,
        note: note || null,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "";
      // Nếu backend báo already verified → hiện màn hình đã xác minh
      if (msg.toLowerCase().includes("already verified")) {
        setStatus({ status: "APPROVED" });
      } else {
        setError("Gửi thất bại: " + msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isUploading = uploadingFront || uploadingBack;

  // SUCCESS SCREEN
  if (success) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white border border-gray-100 shadow-2xl rounded-3xl p-8 text-center animate-[fadeUp_0.4s_ease-out]">
        <div className="relative w-20 h-20 mx-auto mb-5">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
          <div className="relative w-20 h-20 bg-emerald-50 rounded-full border border-emerald-100 flex items-center justify-center">
            <ShieldCheck className="w-10 h-10 text-emerald-500" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Đã gửi xác minh!</h2>
        <p className="text-gray-500 text-sm">Hệ thống AI đang xử lý. Bạn sẽ nhận email thông báo kết quả.</p>
        <button onClick={onBack} className="mt-6 w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold transition-all">
          Đóng
        </button>
      </div>
      <style dangerouslySetInnerHTML={{__html:`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}} />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] animate-[fadeUp_0.3s_ease-out] overflow-hidden">

        {/* HEADER */}
        <div className="relative flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 bg-white z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">Xác minh CCCD</h2>
              <p className="text-xs text-gray-500">Tăng độ tin cậy cho tài khoản chủ trọ</p>
            </div>
          </div>
          <button onClick={onBack} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-white z-0">

          {/* Trạng thái hiện tại */}
          {loadingStatus ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Đang kiểm tra trạng thái...
            </div>
          ) : status ? (() => {
            const cfg = STATUS_CONFIG[status.status] || STATUS_CONFIG["PENDING"];
            const Icon = cfg.icon;
            return (
              <div className={`flex items-start gap-3 p-4 rounded-2xl border ${cfg.bg}`}>
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.color}`} />
                <div>
                  <p className={`font-bold text-sm ${cfg.color}`}>{cfg.label}</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {status.status === "REJECTED" ? (status.rejectReason || "Thông tin không hợp lệ") : cfg.desc}
                  </p>
                  {status.status === "APPROVED" && (
                    <p className="text-xs text-emerald-600 mt-1 font-semibold">
                      Danh tính: {status.extractedName} — {status.extractedIdNumber}
                    </p>
                  )}
                </div>
              </div>
            );
          })() : (
            <div className="flex items-start gap-3 p-4 rounded-2xl border bg-amber-50 border-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-amber-700">Chưa xác minh</p>
                <p className="text-xs text-amber-600/80 mt-0.5">Upload ảnh CCCD để được xác minh danh tính</p>
              </div>
            </div>
          )}

          {/* Chỉ hiện form nếu chưa APPROVED */}
          {(!status || status.status === "REJECTED") && (
            <>
              <div className="h-px bg-gray-100" />

              {/* Upload boxes */}
              <UploadBox
                label="📷 CCCD mặt trước *"
                hint="Ảnh rõ nét, đủ 4 góc, không bị loá"
                value={frontId}
                loading={uploadingFront}
                onChange={e => uploadFile(e.target.files[0], setFrontId, setUploadingFront)}
              />
              <UploadBox
                label="📷 CCCD mặt sau *"
                hint="Ảnh mặt sau của căn cước công dân"
                value={backId}
                loading={uploadingBack}
                onChange={e => uploadFile(e.target.files[0], setBackId, setUploadingBack)}
              />

              {/* Ghi chú */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Ghi chú thêm</label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Thông tin bổ sung (nếu có)..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Privacy notice */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
                <FileText className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-700/80 leading-relaxed">
                  Ảnh CCCD được mã hoá và lưu trữ bảo mật. Hệ thống tự động xoá ảnh sau 7 ngày xử lý. Thông tin chỉ dùng để xác minh danh tính.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl font-medium">
                  ⚠️ {error}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pb-2">
                <button
                  type="button"
                  onClick={onBack}
                  className="w-1/3 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all shadow-sm"
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || isUploading || !frontId || !backId}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:opacity-90 text-white font-bold text-sm shadow-[0_8px_20px_rgba(244,63,94,0.2)] hover:shadow-[0_8px_25px_rgba(244,63,94,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...</>
                  ) : (
                    <><ShieldCheck className="w-4 h-4" /> Gửi xác minh</>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Nếu APPROVED hoặc PENDING → chỉ hiện nút đóng */}
          {status && (status.status === "APPROVED" || status.status === "PENDING" || status.status === "PENDING_MANUAL") && (
            <button onClick={onBack} className="w-full py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-bold text-sm hover:bg-gray-100 transition-all shadow-sm">
              Đóng
            </button>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html:`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}} />
    </div>
  );
};

export default VerificationModal;
