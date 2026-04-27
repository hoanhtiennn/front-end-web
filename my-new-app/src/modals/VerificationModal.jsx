import { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "../contexts/UserContext";
import {
  X, Upload, CheckCircle2, Clock, XCircle,
  ShieldCheck, AlertTriangle, Loader2, FileText, Image
} from "lucide-react";

const STATUS_CONFIG = {
  PENDING: {
    icon: Clock,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
    label: "Đang chờ xử lý tự động...",
    desc: "Hệ thống AI đang xác minh CCCD của bạn"
  },
  PENDING_MANUAL: {
    icon: Clock,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/30",
    label: "Chờ admin xét duyệt",
    desc: "Hệ thống đã chuyển sang xét duyệt thủ công"
  },
  APPROVED: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    label: "Đã xác minh thành công ✅",
    desc: "Tài khoản của bạn đã được xác minh danh tính"
  },
  REJECTED: {
    icon: XCircle,
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/30",
    label: "Bị từ chối",
    desc: ""
  },
};

const UploadBox = ({ label, hint, value, onChange, loading }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</label>
    <label className={`flex flex-col items-center justify-center w-full min-h-[120px] border-2 rounded-xl cursor-pointer transition-all ${
      value
        ? "border-violet-500/50 bg-violet-500/5"
        : "border-gray-700 border-dashed bg-gray-900/40 hover:border-gray-500 hover:bg-gray-900/60"
    } ${loading ? "opacity-50 pointer-events-none" : ""}`}>
      {loading ? (
        <div className="flex flex-col items-center gap-2 py-6">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          <p className="text-xs text-gray-500">Đang upload...</p>
        </div>
      ) : value ? (
        <div className="flex flex-col items-center gap-2 py-5">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          <p className="text-xs text-emerald-400 font-semibold">Đã upload thành công</p>
          <p className="text-[10px] text-gray-600 px-3 text-center break-all">{value}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-6 text-gray-500">
          <Image className="w-8 h-8 text-gray-600" />
          <p className="text-sm font-medium">Nhấn để chọn ảnh</p>
          <p className="text-[11px] text-gray-600">{hint}</p>
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
  const { user } = useUser();
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
    
    // Nếu user đã được verified từ trước (flag isVerified)
    if (user?.isVerified) {
      setStatus({ status: "APPROVED" });
      setLoadingStatus(false);
      return;
    }
    if (!token) { setLoadingStatus(false); return; }
    axios.get("/api/verifications/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!isMounted) return;
        const d = res.data?.result || res.data?.data || res.data;
        setStatus(d);
      })
      .catch(err => {
        if (!isMounted) return;
        if (err.response?.status !== 404) {
          console.error("Lỗi lấy trạng thái xác minh:", err);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingStatus(false);
      });
      
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
      const publicId = res.data?.public_id || res.data?.publicId;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[#0D1117] border border-gray-800 rounded-2xl p-8 text-center animate-[fadeUp_0.4s_ease-out]">
        <div className="relative w-20 h-20 mx-auto mb-5">
          <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-xl animate-pulse" />
          <div className="relative w-20 h-20 bg-violet-500/10 rounded-full border border-violet-500/30 flex items-center justify-center">
            <ShieldCheck className="w-10 h-10 text-violet-400" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Đã gửi xác minh!</h2>
        <p className="text-gray-400 text-sm">Hệ thống AI đang xử lý. Bạn sẽ nhận email thông báo kết quả.</p>
        <button onClick={onBack} className="mt-6 w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all">
          Đóng
        </button>
      </div>
      <style dangerouslySetInnerHTML={{__html:`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}} />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-[#0D1117] border border-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] animate-[fadeUp_0.3s_ease-out]">

        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-20 bg-violet-500/8 rounded-full blur-[60px] pointer-events-none" />

        {/* HEADER */}
        <div className="relative flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Xác minh CCCD</h2>
              <p className="text-xs text-gray-500">Tăng độ tin cậy cho tài khoản chủ trọ</p>
            </div>
          </div>
          <button onClick={onBack} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Trạng thái hiện tại */}
          {loadingStatus ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Đang kiểm tra trạng thái...
            </div>
          ) : status ? (() => {
            const cfg = STATUS_CONFIG[status.status] || STATUS_CONFIG["PENDING"];
            const Icon = cfg.icon;
            return (
              <div className={`flex items-start gap-3 p-4 rounded-xl border ${cfg.bg}`}>
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.color}`} />
                <div>
                  <p className={`font-bold text-sm ${cfg.color}`}>{cfg.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {status.status === "REJECTED" ? (status.rejectReason || "Thông tin không hợp lệ") : cfg.desc}
                  </p>
                  {status.status === "APPROVED" && (
                    <p className="text-xs text-emerald-500 mt-1 font-semibold">
                      Danh tính: {status.extractedName} — {status.extractedIdNumber}
                    </p>
                  )}
                </div>
              </div>
            );
          })() : (
            <div className="flex items-start gap-3 p-4 rounded-xl border bg-gray-900/50 border-gray-800">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-gray-200">Chưa xác minh</p>
                <p className="text-xs text-gray-500 mt-0.5">Upload ảnh CCCD để được xác minh danh tính</p>
              </div>
            </div>
          )}

          {/* Chỉ hiện form nếu chưa APPROVED */}
          {(!status || status.status === "REJECTED") && (
            <>
              <div className="h-px bg-gray-800" />

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
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ghi chú thêm</label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Thông tin bổ sung (nếu có)..."
                  className="w-full bg-gray-900/60 border border-gray-700/80 rounded-xl py-2.5 px-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-violet-500/60 focus:bg-gray-900 transition-all resize-none"
                />
              </div>

              {/* Privacy notice */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-gray-900/50 border border-gray-800">
                <FileText className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Ảnh CCCD được mã hoá và lưu trữ bảo mật. Hệ thống tự động xoá ảnh sau 7 ngày xử lý. Thông tin chỉ dùng để xác minh danh tính.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                  ⚠️ {error}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pb-2">
                <button
                  type="button"
                  onClick={onBack}
                  className="w-1/3 py-3 rounded-xl border border-gray-700 text-gray-400 font-semibold text-sm hover:bg-gray-800 hover:text-white transition-all"
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || isUploading || !frontId || !backId}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(139,92,246,0.25)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
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
            <button onClick={onBack} className="w-full py-3 rounded-xl border border-gray-700 text-gray-400 font-semibold text-sm hover:bg-gray-800 hover:text-white transition-all">
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
