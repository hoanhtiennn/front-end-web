import { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Luồng lấy thông tin người dùng khi ứng dụng khởi chạy:
  // 1. Kiểm tra token trong localStorage.
  // 2. Nếu có token, gọi API /api/users/me để lấy thông tin.
  // 3. Chuẩn hóa dữ liệu trả về và lưu vào state `user`.
  // 4. Nếu lỗi (token hết hạn), xóa token khỏi localStorage.
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (token) {
      axios.get("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        const u = res.data?.result || res.data?.data || res.data;
        setUser({ 
          id: u.id, 
          name: u.fullName || u.full_name || u.name || u.email?.split("@")[0], 
          email: u.email,
          phone: u.phone,
          role: u.role, 
          plan: u.plan,
          avatarUrl: u.avatar_url || u.avatarUrl || u.profilePicture || u.photo,
          isVerified: u.isVerified || u.is_verified || false,
          remainingPosts: u.remainingPosts ?? u.remaining_posts ?? null,
          token 
        });
      })
      .catch((err) => {
        console.error("Token invalid or expired", err);
        localStorage.removeItem("userToken");
      });
    }
  }, []);

  /**
   * Lưu thông tin người dùng vào state sau khi đăng nhập thành công
   */
  const login = (userData) => setUser(userData);
  
  /**
   * Xóa token khỏi localStorage và reset state `user` khi đăng xuất
   */
  const logout = () => {
    localStorage.removeItem("userToken");
    setUser(null);
  };

  /**
   * Cập nhật từng phần thông tin người dùng (VD: đổi tên, avatar)
   */
  const updateUser = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
  };

  return (
    <UserContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

/**
 * Hook custom để sử dụng UserContext nhanh chóng
 */
export const useUser = () => useContext(UserContext);
