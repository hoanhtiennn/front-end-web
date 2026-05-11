import React, { useState, useEffect } from "react";
import { X, Heart, MapPin, Trash2, ExternalLink, HeartOff } from "lucide-react";
import axios from "axios";

// ════════════════════════════════════════════════
//  LocalStorage map: { [postId]: savedPostId }
//  Dùng savedPostId (ID của SavedPost entity) để DELETE
// ════════════════════════════════════════════════
/**
 * Lấy khóa (key) lưu trữ danh sách ID bài đăng đã lưu trong localStorage dựa trên userId
 */
function getSavedMapKey(userId) {
  return userId ? `saved_map_${userId}` : `saved_map_guest`;
}

/**
 * Đọc danh sách (map) các bài đăng đã lưu từ localStorage
 */
function getSavedMap(userId) {
  try {
    return JSON.parse(localStorage.getItem(getSavedMapKey(userId)) || "{}");
  } catch {
    return {};
  }
}

/**
 * Ghi đè danh sách (map) các bài đăng đã lưu vào localStorage
 */
function setSavedMap(map, userId) {
  localStorage.setItem(getSavedMapKey(userId), JSON.stringify(map));
}

/**
 * Trả về mảng các ID bài đăng đã được lưu ở dưới client (localStorage)
 */
export function getLocalSavedIds(userId) {
  return Object.keys(getSavedMap(userId));
}

/**
 * Kiểm tra xem một bài đăng cụ thể đã được lưu (thả tim) hay chưa
 */
export function isPostSaved(postId, userId) {
  const map = getSavedMap(userId);
  return postId in map;
}

/**
 * Chuyển đổi trạng thái lưu/bỏ lưu bài đăng, đồng bộ với API backend và fallback về localStorage
 */
export async function toggleSavePost(postId, currentlySaved, userId) {
  const token = localStorage.getItem("userToken");
  const map = getSavedMap(userId);

  try {
    if (currentlySaved) {
      // Lấy savedPostId từ map để gọi DELETE đúng endpoint
      const savedPostId = map[postId];
      if (savedPostId) {
        await axios.delete(`/api/saved-posts/${savedPostId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      delete map[postId];
    } else {
      // ✅ Đúng: POST /api/saved-posts/{postId} — postId là path variable
      const res = await axios.post(
        `/api/saved-posts/${postId}`,
        null,  // không có body
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // SavedPostReponse: { id: savedPostId, post: {...}, user: {...} }
      const savedPostId = res.data?.id;
      map[postId] = savedPostId || "local";
    }
  } catch (err) {
    console.warn("API lỗi, fallback localStorage:", err.message);
    if (currentlySaved) delete map[postId];
    else map[postId] = "local";
  }

  setSavedMap(map, userId);
  window.dispatchEvent(new CustomEvent('savedPostsChanged', { detail: { postId, isSaved: !currentlySaved } }));
  return !currentlySaved;
}

/**
 * Modal hiển thị danh sách các bài đăng (phòng trọ) mà người dùng đã lưu (thả tim)
 */
export default function SavedPostsModal({ onBack, onOpenRoom, refreshKey }) {
  const [savedPosts, setSavedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    /**
     * Tải danh sách các bài đăng đã lưu từ API hoặc localStorage
     */
    const load = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Lấy userId
      let uid = null;
      try {
        const meRes = await axios.get("/api/users/me", { headers });
        uid = meRes.data?.id ?? null;
        setUserId(uid);
      } catch {}

      try {
        // GET /api/saved-posts → List<SavedPostReponse>
        // Mỗi item có dạng: { id: "savedPostId", post: PostResponse{...}, user: UserResponse{...} }
        const res = await axios.get("/api/saved-posts", { headers });
        const data = Array.isArray(res.data) ? res.data : (res.data?.content || []);

        if (data.length > 0) {
          const freshMap = {};
          const posts = [];
          for (const item of data) {
            // item.id = savedPostId, item.post = post object
            const post = item.post;  
            const savedPostId = item.id;
            if (post?.id) {
              freshMap[post.id] = savedPostId;
              posts.push(post);
            }
          }
          // Đồng bộ lại map localStorage cho chính xác
          setSavedMap(freshMap, uid);
          setSavedPosts(posts);
        } else {
          setSavedPosts([]);
        }
      } catch {
        // Fallback: lấy id từ localStorage rồi fetch từng post
        const ids = getLocalSavedIds(uid);
        if (ids.length === 0) {
          setSavedPosts([]);
          setIsLoading(false);
          return;
        }
        const results = await Promise.allSettled(
          ids.map((id) => axios.get(`/api/posts/${id}`, { headers }))
        );
        const posts = results
          .filter((r) => r.status === "fulfilled")
          .map((r) => r.value.data);
        setSavedPosts(posts);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [refreshKey]);

  /**
   * Xử lý bỏ lưu một bài đăng cụ thể ra khỏi danh sách yêu thích
   */
  const handleUnsave = async (postId) => {
    await toggleSavePost(postId, true, userId);
    setSavedPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  /**
   * Lấy URL ảnh đầu tiên của bài đăng để hiển thị làm ảnh đại diện
   */
  const getImage = (post) => {
    if (post.images && post.images.length > 0) {
      return post.images[0].url || post.images[0].imageUrl;
    }
    return "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-[fadeIn_0.3s_ease-out]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">Bài Đã Lưu</h2>
              <p className="text-sm text-gray-500 font-medium">
                {isLoading ? "Đang tải..." : `${savedPosts.length} bài viết yêu thích`}
              </p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-red-500 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="animate-spin w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full" />
              <p className="text-gray-500 font-medium">Đang tải danh sách đã lưu...</p>
            </div>
          ) : savedPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center border-2 border-rose-100">
                <HeartOff className="w-10 h-10 text-rose-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-700">Chưa có bài lưu nào</h3>
              <p className="text-gray-400 max-w-xs text-sm leading-relaxed">
                Nhấn vào biểu tượng ❤️ trên bất kỳ bài đăng nào để lưu vào đây nhé!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {savedPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-rose-200 hover:bg-rose-50/30 transition-all group"
                >
                  {/* Ảnh */}
                  <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-gray-200">
                    <img
                      src={getImage(post)}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-base line-clamp-2 leading-snug mb-1 group-hover:text-rose-600 transition-colors">
                      {post.title}
                    </h4>
                    <div className="flex items-center gap-1 text-gray-500 text-sm mb-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="truncate">
                        {[post.address, post.ward, post.district, post.city].filter(Boolean).join(", ") || "Chưa có địa chỉ"}
                      </span>
                    </div>
                    <span className="inline-block bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-xs font-bold">
                      {post.price ? post.price.toLocaleString("vi-VN") + " đ/tháng" : "Thoả thuận"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => onOpenRoom && onOpenRoom(post.id)}
                      title="Xem chi tiết"
                      className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleUnsave(post.id)}
                      title="Bỏ lưu"
                      className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
