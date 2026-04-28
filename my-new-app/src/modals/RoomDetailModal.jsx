import React, { useState, useEffect } from "react";
import {
  X,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  Navigation,
  Image as ImageIcon,
  Star,
  Send,
  MessageSquare,
  UserCircle,
  Heart,
  ShieldCheck,
} from "lucide-react";
import axios from "axios";
import { useUser } from "../contexts/UserContext";
import { toggleSavePost, isPostSaved } from "./SavedPostsModal";

// ──────────────────────────────────────────────
//  Component chọn sao (interactive)
// ──────────────────────────────────────────────
function StarPicker({ value, onChange, readonly = false, size = "w-6 h-6" }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition-transform ${!readonly ? "hover:scale-125 cursor-pointer" : "cursor-default"}`}
        >
          <Star
            className={`${size} transition-colors ${
              star <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "text-gray-300 fill-gray-100"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
//  Component hiển thị một đánh giá
// ──────────────────────────────────────────────
function ReviewItem({ review }) {
  const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ trước`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days} ngày trước`;
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  return (
    <div className="flex gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center shrink-0 overflow-hidden border-2 border-white shadow-sm">
        {review.userAvatar ? (
          <img
            src={review.userAvatar}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <UserCircle className="w-6 h-6 text-blue-400" />
        )}
      </div>

      {/* Nội dung */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="font-bold text-gray-800 text-sm truncate">
            {review.userName || review.userFullName || "Người dùng ẩn danh"}
          </span>
          <span className="text-xs text-gray-400 shrink-0">
            {timeAgo(review.createdAt)}
          </span>
        </div>
        <StarPicker value={review.rating} readonly size="w-4 h-4" />
        {review.comment && (
          <p className="text-gray-600 text-sm mt-1.5 leading-relaxed break-words">
            {review.comment}
          </p>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
//  Main Component
// ──────────────────────────────────────────────
export default function RoomDetailModal({ roomId, onBack }) {
  const { user } = useUser();
  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // ── Like/Save states ──
  const [isSaved, setIsSaved] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [saveCount, setSaveCount] = useState(null); // số lượt lưu của bài (cho chủ nhà xem)

  // ── Review states ──
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // ── Init saved state ──
  useEffect(() => {
    if (!roomId) return;
    setIsSaved(isPostSaved(roomId, user?.id));
    // Nếu là LANDLORD thì fetch số lượt lưu bài
    if (user?.role === "LANDLORD") {
      const token = localStorage.getItem("userToken");
      axios
        .get(`/api/saved-posts/count/${roomId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        .then((res) =>
          setSaveCount(
            typeof res.data === "number" ? res.data : (res.data?.count ?? null),
          ),
        )
        .catch(() => setSaveCount(null));
    }
  }, [roomId, user?.id, user?.role]);

  const handleToggleSave = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để lưu bài yêu thích!");
      return;
    }
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 600);
    const next = await toggleSavePost(roomId, isSaved, user.id);
    setIsSaved(next);
  };

  // ── Fetch room detail ──
  useEffect(() => {
    const fetchRoomDetail = async () => {
      try {
        const token = localStorage.getItem("userToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`/api/posts/${roomId}`, { headers });
        setRoom(res.data);
      } catch (err) {
        console.error("Lỗi lấy chi tiết phòng:", err);
        alert(
          "Không thể tải thông tin phòng này. Báo lỗi: " +
            JSON.stringify(err.response?.data || err.message),
        );
      } finally {
        setIsLoading(false);
      }
    };
    if (roomId) fetchRoomDetail();
  }, [roomId]);

  // ── Fetch reviews ──
  useEffect(() => {
    const fetchReviews = async () => {
      if (!roomId) return;
      setIsLoadingReviews(true);
      try {
        const token = localStorage.getItem("userToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`/api/posts/${roomId}/reviews`, {
          headers,
        });
        // Backend có thể trả: array hoặc { content: [...] }
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.content || res.data?.data || [];
        setReviews(data);
      } catch (err) {
        console.warn("Không lấy được reviews từ API:", err.message);
        // Fallback: lấy từ localStorage
        const stored = localStorage.getItem(`reviews_${roomId}`);
        if (stored) {
          try {
            setReviews(JSON.parse(stored));
          } catch (_) {}
        }
      } finally {
        setIsLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [roomId]);

  // ── Submit review ──
  const handleSubmitReview = async () => {
    setSubmitError("");
    if (myRating === 0) {
      setSubmitError("Vui lòng chọn số sao đánh giá!");
      return;
    }
    if (!myComment.trim()) {
      setSubmitError("Vui lòng nhập nội dung nhận xét!");
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("userToken");
    const payload = { rating: myRating, comment: myComment.trim() };

    try {
      const res = await axios.post(`/api/posts/${roomId}/reviews`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const newReview = res.data;
      setReviews((prev) => [newReview, ...prev]);
      setSubmitSuccess(true);
      setMyRating(0);
      setMyComment("");
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      console.warn("API lỗi, lưu review vào localStorage:", err.message);
      // Fallback: lưu vào localStorage
      const newReview = {
        id: `local_${Date.now()}`,
        rating: myRating,
        comment: myComment.trim(),
        userName: user?.name || "Bạn",
        userAvatar: user?.avatarUrl || null,
        createdAt: new Date().toISOString(),
      };
      const updated = [newReview, ...reviews];
      setReviews(updated);
      try {
        localStorage.setItem(`reviews_${roomId}`, JSON.stringify(updated));
      } catch (_) {}
      setSubmitSuccess(true);
      setMyRating(0);
      setMyComment("");
      setTimeout(() => setSubmitSuccess(false), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Helpers ──
  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        ).toFixed(1)
      : null;

  const canReview = user && user.role !== "LANDLORD";

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!room) return null;

  const images =
    room.images && room.images.length > 0
      ? room.images.map((img) => img.url || img.imageUrl)
      : ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200"];

  const landlord = room.user || {};
  const fullAddressString = [room.address, room.ward, room.district, room.city]
    .filter(Boolean)
    .join(", ");
  const hasAddress = !!fullAddressString;
  const destinationParam = encodeURIComponent(fullAddressString);

  const handleOpenMaps = () => {
    if (!hasAddress) {
      alert("Địa chỉ của phòng này chưa được cập nhật trên hệ thống!");
      return;
    }
    setIsGettingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsGettingLocation(false);
          const currentLat = position.coords.latitude;
          const currentLng = position.coords.longitude;
          window.open(
            `https://www.google.com/maps/dir/?api=1&origin=${currentLat},${currentLng}&destination=${destinationParam}`,
            "_blank",
          );
        },
        (error) => {
          setIsGettingLocation(false);
          console.warn("Không lấy được GPS:", error.message);
          window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${destinationParam}`,
            "_blank",
          );
        },
        { enableHighAccuracy: true, timeout: 8000 },
      );
    } else {
      setIsGettingLocation(false);
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${destinationParam}`,
        "_blank",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="relative w-full max-w-[1400px] max-h-[95vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-[fadeIn_0.3s_ease-out]">
        {/* Nút Đóng */}
        <button
          onClick={onBack}
          className="absolute top-4 right-4 z-20 p-2 text-gray-500 hover:text-white bg-white/80 hover:bg-red-500 rounded-full backdrop-blur-sm transition-all shadow-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ══ Khung Trái: Hình Ảnh & Chi tiết & REVIEWS ══ */}
        <div className="w-full md:w-[70%] flex flex-col bg-gray-100 overflow-y-auto custom-scrollbar">
          {/* Main Image View */}
          <div className="relative h-[400px] md:h-[500px] bg-gray-100 shrink-0">
            <img
              src={images[activeImageIndex]}
              alt={room.title}
              className="w-full h-full object-cover"
            />
            {/* Tag Badge */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              {room.status === "ACTIVE" && (
                <span className="bg-green-500 px-3 py-1 text-xs font-bold text-white rounded text-shadow shadow-md">
                  Đang cho thuê
                </span>
              )}
            </div>
            {/* Image Counter */}
            <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded-full flex items-center gap-2 text-white text-sm backdrop-blur-sm">
              <ImageIcon className="w-4 h-4" />
              <span>
                {activeImageIndex + 1} / {images.length}
              </span>
            </div>
          </div>

          {/* Sub Images List */}
          {images.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto bg-white border-b border-gray-200 shrink-0 min-h-[112px] scroll-smooth custom-scrollbar">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-32 h-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${activeImageIndex === idx ? "border-blue-500 scale-105" : "border-transparent opacity-70 hover:opacity-100"}`}
                >
                  <img
                    src={img}
                    alt={`Thumb ${idx}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Chi tiết Bài Viết */}
          <div className="p-6 md:p-8 bg-white grow">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm font-bold border border-blue-200">
                {room.roomType || "Phòng Trọ"}
              </span>
              <span className="text-gray-500 font-semibold text-sm">
                Đăng lúc:{" "}
                {room.createdAt
                  ? new Date(room.createdAt).toLocaleString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "Gần đây"}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-4 leading-tight">
              {room.title}
            </h1>

            <div className="flex items-start gap-3 text-gray-600 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <MapPin className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[15px] font-medium leading-relaxed">
                {[room.address, room.ward, room.district, room.city]
                  .filter(Boolean)
                  .join(", ") ||
                  room.location?.address ||
                  "Chưa cập nhật địa chỉ"}
              </p>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-3 border-b pb-2">
              Thông tin mô tả
            </h3>
            <div className="text-gray-700 leading-relaxed whitespace-pre-line mb-8">
              {room.description || "Chủ trọ chưa cập nhật mô tả chi tiết."}
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
              Tiện ích kèm theo
            </h3>
            <div className="flex flex-wrap gap-2 mb-8">
              {room.amenities && room.amenities.length > 0 ? (
                room.amenities.map((amenity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg text-sm text-gray-700 font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    {amenity.type || amenity.name || amenity}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic text-sm">
                  Không có tiện ích nào được liệt kê.
                </p>
              )}
            </div>

            {/* ════════════════════════════════════════
                SECTION: ĐÁNH GIÁ TỪ NGƯỜI THUÊ
            ════════════════════════════════════════ */}
            <div className="border-t border-gray-100 pt-8">
              {/* Header đánh giá */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-bold text-gray-900">
                    Đánh Giá Từ Người Thuê
                  </h3>
                </div>
                {avgRating && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-extrabold text-amber-600 text-lg">
                      {avgRating}
                    </span>
                    <span className="text-gray-400 text-sm">/ 5</span>
                    <span className="text-gray-400 text-xs">
                      ({reviews.length} lượt)
                    </span>
                  </div>
                )}
              </div>

              {/* Form gửi đánh giá — chỉ hiện cho TENANT */}
              {!user ? (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center mb-6">
                  <Star className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                  <p className="text-blue-700 font-semibold mb-1">
                    Đăng nhập để gửi đánh giá
                  </p>
                  <p className="text-blue-500 text-sm">
                    Chia sẻ trải nghiệm của bạn về phòng trọ này
                  </p>
                </div>
              ) : canReview ? (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 mb-6">
                  <p className="text-sm font-bold text-gray-700 mb-3">
                    Đánh giá của bạn:
                  </p>

                  {/* Star picker */}
                  <div className="flex items-center gap-3 mb-4">
                    <StarPicker
                      value={myRating}
                      onChange={setMyRating}
                      size="w-8 h-8"
                    />
                    <span className="text-sm text-gray-500 font-medium">
                      {myRating === 0 && "Chọn số sao"}
                      {myRating === 1 && "😞 Rất tệ"}
                      {myRating === 2 && "😕 Tệ"}
                      {myRating === 3 && "😐 Bình thường"}
                      {myRating === 4 && "😊 Tốt"}
                      {myRating === 5 && "🤩 Tuyệt vời!"}
                    </span>
                  </div>

                  {/* Comment textarea */}
                  <textarea
                    value={myComment}
                    onChange={(e) => setMyComment(e.target.value)}
                    placeholder="Chia sẻ nhận xét của bạn về phòng trọ này (vị trí, chủ trọ, tiện nghi...)"
                    rows={3}
                    maxLength={500}
                    className="w-full border border-blue-200 rounded-xl p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none bg-white placeholder-gray-400"
                  />
                  <div className="flex items-center justify-between mt-1 mb-3">
                    <span className="text-xs text-gray-400">
                      {myComment.length}/500 ký tự
                    </span>
                    {submitError && (
                      <span className="text-xs text-red-500 font-medium">
                        {submitError}
                      </span>
                    )}
                  </div>

                  {/* Success message */}
                  {submitSuccess && (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-3 text-sm font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      Đánh giá của bạn đã được gửi thành công!
                    </div>
                  )}

                  {/* Submit button */}
                  <button
                    onClick={handleSubmitReview}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 shadow-[0_4px_14px_0_rgba(37,99,235,0.3)] active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Gửi Đánh Giá
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6 text-center text-sm text-gray-500 italic">
                  Chủ trọ không thể gửi đánh giá cho bài viết.
                </div>
              )}

              {/* Danh sách đánh giá */}
              {isLoadingReviews ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                  <span className="ml-2 text-sm text-gray-500">
                    Đang tải đánh giá...
                  </span>
                </div>
              ) : reviews.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {reviews.map((review, idx) => (
                    <ReviewItem key={review.id || idx} review={review} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Star className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                  <p className="font-medium">Chưa có đánh giá nào</p>
                  <p className="text-sm">
                    Hãy là người đầu tiên đánh giá phòng trọ này!
                  </p>
                </div>
              )}
            </div>
            {/* END REVIEWS SECTION */}
          </div>
        </div>

        {/* ══ Khung Phải: Thông tin Giao dịch & Bản đồ ══ */}
        <div className="w-full md:w-[30%] flex flex-col bg-slate-50 border-t md:border-t-0 md:border-l border-gray-200 max-h-full overflow-y-auto">
          <div className="p-6 md:p-8 flex flex-col gap-6">
            {/* ── Nút Lưu bài (chỉ Người Thuê mới lưu được) ── */}
            {user?.role === "LANDLORD" ? (
              // Chủ nhà: xem số người đã lưu bài
              <div className="w-full flex items-center justify-center gap-4 py-5 px-6 rounded-2xl border-2 border-rose-100 bg-rose-50">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                  <Heart className="w-6 h-6 fill-rose-400 text-rose-400" />
                </div>
                <div>
                  <p className="text-3xl font-black text-rose-500 leading-none">
                    {saveCount !== null ? saveCount : "--"}
                  </p>
                  <p className="text-xs font-semibold text-rose-400 uppercase tracking-wide mt-0.5">
                    Người đã lưu bài
                  </p>
                </div>
              </div>
            ) : (
              // Người thuê / khách: nút lưu bài
              <button
                onClick={handleToggleSave}
                className={`w-full flex items-center justify-center gap-3 font-bold py-4 px-6 rounded-2xl border-2 transition-all duration-300 shadow-sm
                  ${
                    isSaved
                      ? "bg-rose-500 border-rose-500 text-white shadow-rose-500/30 hover:bg-rose-600"
                      : "bg-white border-gray-200 text-gray-600 hover:border-rose-400 hover:text-rose-500 hover:bg-rose-50"
                  }
                  ${likeAnim ? "scale-95" : ""}
                `}
              >
                <Heart
                  className={`w-6 h-6 transition-all duration-300 ${isSaved ? "fill-white text-white" : ""} ${likeAnim ? "scale-150" : "scale-100"}`}
                />
                <span className="text-base">
                  {isSaved ? "❤️ Đã lưu bài viết" : "Lưu bài viết"}
                </span>
              </button>
            )}

            {/* Price Box */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-bl-full pointer-events-none" />
              <p className="text-gray-500 font-medium mb-1">
                Giá thuê (VND/Tháng)
              </p>
              <h2 className="text-4xl font-black text-blue-600 mb-2">
                {room.price ? room.price.toLocaleString("vi-VN") : "Thoả thuận"}
              </h2>
              <div className="w-full h-px bg-gray-100 my-4" />
              <div className="flex justify-between items-center px-4">
                <span className="text-gray-600 font-medium">Diện tích:</span>
                <span className="text-xl font-bold text-gray-900">
                  {room.area ? room.area + " m²" : "--"}
                </span>
              </div>
              {/* Rating badge nhỏ trong price box */}
              {avgRating && (
                <div className="mt-3 flex justify-center">
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-amber-700 font-bold text-sm">
                      {avgRating}
                    </span>
                    <span className="text-gray-400 text-xs">
                      ({reviews.length} đánh giá)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Landlord Box */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                Thông tin liên hệ
              </h3>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm shrink-0 overflow-hidden">
                  {landlord.avatar ? (
                    <img
                      src={landlord.avatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-blue-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {landlord.fullName || landlord.name || "Chủ Trọ Ẩn Danh"}
                  </h3>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-bold uppercase border border-blue-100">
                      {landlord.role === "LANDLORD"
                        ? "CHỦ TRỌ"
                        : landlord.role || "THÀNH VIÊN"}
                    </span>
                    {landlord.plan && landlord.plan !== "FREE" && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-xs font-bold uppercase border border-amber-200">
                        {landlord.plan}
                      </span>
                    )}
                    {(landlord.isVerified || landlord.is_verified) && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-xs font-bold border border-emerald-200">
                        <ShieldCheck className="w-3 h-3" /> Đã xác minh
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  alert("Đang gọi cho: " + (landlord.fullName || "Chủ trọ"))
                }
                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 px-4 rounded-xl transition duration-200 shadow-[0_4px_14px_0_rgba(34,197,94,0.39)]"
              >
                <Phone className="w-5 h-5" />
                {landlord.phone || "09xxxx.xxxx (Chạm để gọi)"}
              </button>
            </div>

            {/* Google Maps */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex-1 flex flex-col">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                Vị trí trọ trên Bản Đồ
              </h3>

              <div className="w-full bg-slate-100 rounded-xl overflow-hidden border border-gray-200 flex-1 min-h-[150px] relative flex flex-col items-center justify-center text-center p-6 mb-4">
                {hasAddress ? (
                  <>
                    <MapPin className="w-12 h-12 text-red-500 mb-2 opacity-80" />
                    <p className="text-sm font-medium text-gray-600">
                      Đã cập nhật địa chỉ trọ
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    Chủ trọ chưa cập nhật địa chỉ trên hệ thống.
                  </p>
                )}
              </div>

              <button
                onClick={handleOpenMaps}
                disabled={isGettingLocation || !hasAddress}
                className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 px-4 rounded-xl transition duration-200 ${
                  hasAddress
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] active:scale-95 disabled:opacity-70 disabled:cursor-wait"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isGettingLocation ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang định vị của bạn...
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5" />
                    Dẫn đường tới đây (Google Maps)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
