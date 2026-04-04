import { useState, useRef } from "react";
import axios from "axios";
import { useUser } from "../contexts/UserContext";

const EditProfileModal = ({ onBack }) => {
  const { user, updateUser, logout } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Tải ảnh đại diện
  const [previewAvatar, setPreviewAvatar] = useState(user.avatarUrl || "");
  const [avatarBlob, setAvatarBlob] = useState(null);
  const fileInputRef = useRef(null);

  // Xóa tài khoản
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 1. XỬ LÝ CHỌN FILE VÀ NÉN THÀNH BASE64
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn một file hình ảnh hợp lệ!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_DIMENSION = 200; // kích thước siêu nhỏ gọn nhẹ DB
        
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        
        // Tạo blob chuẩn File để gửi lên Backend
        canvas.toBlob((blob) => {
          setAvatarBlob(blob);
        }, "image/jpeg", 0.6);

        // Vẫn giữ Base64 để hiển thị chớp nhoáng trên giao diện web
        const base64DataUrl = canvas.toDataURL("image/jpeg", 0.6);
        setPreviewAvatar(base64DataUrl);
        setError(""); // Clear error nếu có
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // 2. LƯU THAY ĐỔI
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.target);
    const fullName = formData.get("fullName");
    const phone = formData.get("phone");
    const password = formData.get("password");

    try {
      if (!user.id) throw new Error("Chưa có ID người dùng, vui lòng đăng nhập lại!");

      // Dùng FormData thay vì JSON chuẩn để Backend có thể đọc file
      const apiFormData = new FormData();
      apiFormData.append("fullName", fullName);
      apiFormData.append("full_name", fullName); // Gửi cả 2 tên đề phòng backend dùng snake_case
      apiFormData.append("phone", phone);
      apiFormData.append("plan", user.plan || "FREE");

      // Luôn gửi password (dù là rỗng) để Backend không bị lỗi NULL Pointer Exception khi gọi .strip()
      apiFormData.append("password", password ? password.trim() : "");

      if (avatarBlob) {
        apiFormData.append("avatar", avatarBlob, "avatar.jpg");
      }

      const response = await axios.put(`/api/users/${user.id}`, apiFormData, {
        headers: { 
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      
      const userData = response.data;
      updateUser({
        name: userData.fullName || userData.full_name || fullName,
        phone: userData.phone || phone,
        avatarUrl: userData.avatar_url || userData.avatarUrl || previewAvatar
      });
      
      onBack();
    } catch (err) {
      if (err.response?.data) {
        // Ép in toàn bộ object lỗi của backend ra màn hình (hoặc chuỗi nếu backend trả chuỗi)
        const errorData = typeof err.response.data === "object" ? JSON.stringify(err.response.data) : err.response.data;
        setError("LỖI 400 BAD REQUEST: " + errorData);
      } else {
        setError(err.message || "Cập nhật thất bại.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. XOÁ TÀI KHOẢN
  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setError("");
    try {
      await axios.delete(`/api/users/${user.id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      // Thoát ra hoàn toàn
      onBack();
      logout();
      window.location.reload(); // Reset lại toàn bộ ứng dụng sạch sẽ
    } catch (err) {
      setError(err.response?.data?.message || "Không thể xoá tài khoản lúc này!");
      setDeleteLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 overflow-y-auto">
      <div className="w-full max-w-md bg-white p-6 rounded shadow border border-gray-300 my-auto">
        
        {/* NẾU ĐANG XÁC NHẬN XOÁ */}
        {showDeleteConfirm ? (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-zinc-900 mb-2">Chắc chắn xoá?</h2>
            <p className="text-sm text-zinc-500 font-medium mb-8">
              Tất cả dữ liệu cá nhân bao gồm cả tin nhắn của bạn sẽ biến mất vĩnh viễn. Hành động này không thể hoàn tác!
            </p>
            
            {error && <div className="text-xs text-red-600 font-bold bg-red-50 p-3 rounded-xl mb-4 text-center">{error}</div>}
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); setError(""); }}
                disabled={deleteLoading}
                className="w-full rounded bg-gray-200 py-2 font-bold text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              >
                HUỶ BỎ
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="w-full rounded bg-red-600 py-2 font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? "ĐANG XÓA..." : "VẪN XOÁ"}
              </button>
            </div>
          </div>
        ) : (
          /* FORM SỬA BÌNH THƯỜNG */
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Hồ sơ của bạn</h2>
            <p className="text-sm text-gray-500 mb-6">Tuỳ chỉnh thông tin cá nhân trên hệ thống.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* KHU VỰC AVATAR */}
              <div className="flex items-center gap-4 py-2 border-b border-gray-200 pb-4">
                <div className="w-16 h-16 border rounded bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center text-xl font-bold text-gray-500">
                  {previewAvatar ? (
                    <img src={previewAvatar} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="bg-gray-50 w-full h-full flex items-center justify-center">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-bold text-gray-700">Ảnh đại diện</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1 rounded border border-gray-300 bg-white text-sm hover:bg-gray-50"
                    >
                      Tải lên từ máy
                    </button>
                    {previewAvatar && previewAvatar !== user.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewAvatar(user.avatarUrl)}
                        className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-sm hover:bg-gray-300"
                      >
                        Khôi phục
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* INPUT FIELDS */}
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Email <span className="font-normal text-xs text-gray-500">(Chỉ đọc)</span></label>
                <input 
                  disabled 
                  value={user.email || ""} 
                  className="w-full rounded border border-gray-300 bg-gray-100 p-2 text-gray-500" 
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Họ và tên</label>
                <input 
                  name="fullName"
                  defaultValue={user.name || ""} 
                  required
                  placeholder="Họ và tên hiển thị"
                  className="w-full rounded border border-gray-300 p-2 text-gray-900" 
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Số điện thoại</label>
                <input 
                  name="phone"
                  type="tel"
                  defaultValue={user.phone || ""} 
                  placeholder="Nhập đủ 10 số, ví dụ 0123456789"
                  className="w-full rounded border border-gray-300 p-2 text-gray-900" 
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">Mật khẩu mới (Tuỳ chọn)</label>
                <input 
                  name="password"
                  type="password"
                  placeholder="Bỏ trống nếu không muốn đổi pass"
                  className="w-full rounded border border-gray-300 p-2 text-gray-900" 
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-100 p-3 rounded border border-red-200">
                  {error}
                </div>
              )}

              <div className="pt-4 flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onBack}
                    disabled={loading}
                    className="w-1/3 rounded border border-gray-300 bg-white py-2 font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    HỦY
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 rounded bg-blue-600 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "ĐANG LƯU..." : "LƯU THAY ĐỔI"}
                  </button>
                </div>
                
                {/* NÚT XOÁ TÀI KHOẢN MÀU ĐỎ */}
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full rounded border border-red-500 bg-white py-2 font-bold text-red-600 hover:bg-red-50 mt-4"
                >
                  XOÁ TÀI KHOẢN VĨNH VIỄN
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default EditProfileModal;
