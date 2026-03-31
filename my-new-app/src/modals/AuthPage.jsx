import axios from "axios";
import { useState, useActionState, useRef, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useUser } from "../contexts/UserContext";

const getTokenPayload = (token) => {
  if (!token) return {};
  try {
    const payloadBase64Url = token.split('.')[1];
    const payloadBase64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(payloadBase64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return {};
  }
};

const AuthPage = ({ mode, onBack }) => {
  const { login } = useUser();

  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState(mode);
  const [selectedRole, setSelectedRole] = useState("STUDENT");
  
  const selectedRoleRef = useRef(selectedRole);
  useEffect(() => {
    selectedRoleRef.current = selectedRole;
  }, [selectedRole]);

  // State cho luồng quên mật khẩu
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const [state, formAction, isPending] = useActionState(
    async (prev, formData) => {
      const email = formData.get("email");
      const password = formData.get("password");
      const role = formData.get("role");

      // Validate phía client khi đăng ký
      if (view === "REGISTER") {
        const phone = formData.get("phone");
        if (!/^0\d{9}$/.test(phone)) {
          return { error: "Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 chữ số!" };
        }
        if (password !== formData.get("confirmPassword")) {
          return { error: "Mật khẩu xác nhận không khớp. Vui lòng thử lại!" };
        }
      }

      try {
        if (view === "LOGIN") {
          // --- ĐĂNG NHẬP ---
          const response = await axios.post("/auth/login", { email, password });
          const { token } = response.data;
          const payload = getTokenPayload(token);
          const backendRole = payload.role || response.data.role;
          
          // Kiểm tra xem backendRole có khớp với vai trò (Người thuê / Chủ trọ) đang tick không
          // (Bỏ qua kiểm tra nếu tài khoản là ADMIN hệ thống)
          if (backendRole && backendRole !== "ADMIN" && backendRole !== role) {
            const dbRoleName = backendRole === "LANDLORD" ? "Chủ trọ" : "Người thuê";
            return { error: `Sai vai trò! Tài khoản này là "${dbRoleName}". Vui lòng chọn đúng màn hình đăng nhập.` };
          }

          const userRole = backendRole || role; // Ưu tiên role từ DB
          const userName = payload.fullName || payload.full_name || payload.name || payload.sub?.split("@")[0] || email.split("@")[0];

          localStorage.setItem("userToken", token);
          try {
            const profileRes = await axios.get("/api/users/me", { headers: { Authorization: `Bearer ${token}` } });
            const u = profileRes.data;
            login({ id: u.id, name: u.fullName || u.full_name || u.email?.split("@")[0], email: u.email, phone: u.phone, role: u.role, plan: u.plan, avatarUrl: u.avatar_url || u.avatarUrl, token });
          } catch (e) {
            login({ name: userName, role: userRole, token });
          }
          onBack();
          return { success: true };
        } else {
          // --- ĐĂNG KÝ ---
          const fullName = formData.get("fullName");
          const phone = formData.get("phone");
          await axios.post("/auth/register", {
            full_name: fullName, // Có thể backend dùng camelCase (fullName) hoặc snake_case (full_name)
            phone,
            email,
            password,
            role: role // Truyền rõ chữ LANDLORD hoặc STUDENT xuống database
          });
          // Tự động đăng nhập sau khi đăng ký thành công
          const loginRes = await axios.post("/auth/login", { email, password });
          const { token } = loginRes.data;
          const payload = getTokenPayload(token);
          const backendRole = payload.role || loginRes.data.role;
          
          const userRole = backendRole || role;
          const userName = payload.fullName || payload.full_name || payload.name || fullName;

          localStorage.setItem("userToken", token);
          try {
            const profileRes = await axios.get("/api/users/me", { headers: { Authorization: `Bearer ${token}` } });
            const u = profileRes.data;
            login({ id: u.id, name: u.fullName || u.full_name || u.email?.split("@")[0], email: u.email, phone: u.phone, role: u.role, plan: u.plan, avatarUrl: u.avatar_url || u.avatarUrl, token });
          } catch (e) {
            login({ name: userName, role: userRole, token });
          }
          onBack();
          return { success: true };
        }
      } catch (error) {
        return { error: error.response?.data?.message ?? "Đã có lỗi xảy ra. Vui lòng thử lại!" };
      }
    },
    null,
  );

  // --- ĐĂNG NHẬP BẰNG GOOGLE ---
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setGoogleError("");
      try {
        // Gửi access_token lên backend để xác thực
        const response = await axios.post("/auth/login-google", {
          token: tokenResponse.access_token,
          role: selectedRoleRef.current, // Gửi role mong muốn lên kèm cho Backend (dành cho lần đầu đăng kí qua Google)
        });

        const { token, full_name, fullName, name, email } = response.data;
        const payload = getTokenPayload(token);
        const backendRole = payload.role || response.data.role;

        if (backendRole && backendRole !== "ADMIN" && backendRole !== selectedRoleRef.current) {
          const dbRoleName = backendRole === "LANDLORD" ? "Chủ trọ" : "Người thuê";
          throw new Error(`Sai vai trò! Tài khoản Google này là "${dbRoleName}". Vui lòng chọn đúng màn hình tiếp tục.`);
        }

        const userRole = backendRole || selectedRoleRef.current; // Ưu tiên role từ Database hơn
        const tokenEmail = payload.email || payload.sub || email;
        const userName = payload.fullName || payload.full_name || payload.name || full_name || fullName || name || tokenEmail?.split("@")[0] || "Người dùng Google";

        localStorage.setItem("userToken", token);
        try {
          const profileRes = await axios.get("/api/users/me", { headers: { Authorization: `Bearer ${token}` } });
          const u = profileRes.data;
          login({ id: u.id, name: u.fullName || u.full_name || u.email?.split("@")[0], email: u.email, phone: u.phone, role: u.role, plan: u.plan, avatarUrl: u.avatar_url || u.avatarUrl, token });
        } catch (e) {
          login({ name: userName, role: userRole, token });
        }
        onBack();
      } catch (err) {
        setGoogleError(err.response?.data?.message ?? err.message ?? "Đăng nhập Google thất bại. Vui lòng thử lại!");
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setGoogleError("Đã huỷ đăng nhập Google hoặc có lỗi xảy ra.");
    },
  });

  // --- LUỒNG QUÊN MẬT KHẨU ---

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);
    try {
      await axios.post("/auth/forgot-password", { email: forgotEmail });
      setOtp(["", "", "", "", "", ""]);
      setView("VERIFY_OTP");
    } catch (err) {
      setForgotError(err.response?.data?.message ?? "Không tìm thấy email. Vui lòng thử lại!");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setForgotError("");
    const otpString = otp.join("");
    if (otpString.length < 6) {
      setForgotError("Vui lòng nhập đủ 6 số mã OTP!");
      return;
    }
    setForgotLoading(true);
    try {
      await axios.post("/auth/verify-otp", { email: forgotEmail, otp: otpString });
      setView("RESET_PASSWORD");
    } catch (err) {
      setForgotError(err.response?.data?.message ?? "Mã OTP không đúng. Vui lòng kiểm tra lại!");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError("");
    const newPassword = e.target.newPassword.value;
    const confirmPassword = e.target.confirmPassword.value;
    if (newPassword !== confirmPassword) {
      setForgotError("Mật khẩu xác nhận không khớp!");
      return;
    }
    setForgotLoading(true);
    try {
      await axios.post("/auth/reset-password", { email: forgotEmail, newPassword });
      setForgotEmail("");
      setForgotError("");
      setView("LOGIN");
    } catch (err) {
      setForgotError(err.response?.data?.message ?? "Đặt lại mật khẩu thất bại. Vui lòng thử lại!");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
      <div className="w-full max-w-md rounded bg-white p-6 shadow border border-gray-300">
        <h2 className="text-2xl font-bold text-gray-800">
          {view === "LOGIN" && "Đăng nhập"}
          {view === "REGISTER" && "Đăng ký tài khoản"}
          {view === "FORGOT_PASSWORD" && "Quên mật khẩu"}
          {view === "VERIFY_OTP" && "Nhập mã xác nhận"}
          {view === "RESET_PASSWORD" && "Đặt lại mật khẩu"}
        </h2>

        {view === "FORGOT_PASSWORD" ? (
          <form onSubmit={handleSendOtp} className="mt-8 space-y-4">
            <p className="text-sm text-gray-600">
              Nhập email của bạn để nhận mã OTP 6 số.
            </p>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => { setForgotEmail(e.target.value); setForgotError(""); }}
              placeholder="Email của bạn"
              required
              className="w-full rounded border border-gray-300 p-2 text-gray-900"
            />
            {forgotError && (
              <p className="text-sm text-red-600 bg-red-100 p-2 rounded border border-red-200">{forgotError}</p>
            )}
            <button disabled={forgotLoading} className="w-full rounded bg-blue-600 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50">
              {forgotLoading ? "ĐANG GỬI..." : "GỬI MÃ OTP →"}
            </button>
            <button type="button" onClick={() => setView("LOGIN")} className="w-full text-sm font-bold text-gray-500 hover:underline">
              Quay lại Đăng nhập
            </button>
          </form>
        ) : view === "VERIFY_OTP" ? (
          <form onSubmit={handleVerifyOtp} className="mt-8 space-y-4">
            <p className="text-sm text-gray-600">
              Mã OTP đã được gửi đến <span className="font-bold">{forgotEmail}</span>.
            </p>
            <div className="flex justify-center gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                  onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                  className="w-12 h-12 rounded border border-gray-300 text-center text-xl font-bold text-gray-900 focus:border-blue-500 focus:outline-none"
                />
              ))}
            </div>
            {forgotError && (
              <p className="text-sm text-red-600 bg-red-100 p-2 rounded border border-red-200">{forgotError}</p>
            )}
            <button disabled={forgotLoading} className="w-full rounded bg-blue-600 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50">
              {forgotLoading ? "ĐANG XÁC NHẬN..." : "XÁC NHẬN MÃ OTP →"}
            </button>
            <button type="button" onClick={() => { setForgotError(""); setView("FORGOT_PASSWORD"); }} className="w-full text-sm font-bold text-gray-500 hover:underline">
              Gửi lại mã OTP
            </button>
          </form>
        ) : view === "RESET_PASSWORD" ? (
          <form onSubmit={handleResetPassword} className="mt-8 space-y-4">
            <p className="text-sm text-gray-600">Nhập mật khẩu mới của bạn.</p>
            <input
              name="newPassword"
              type="password"
              placeholder="Mật khẩu mới"
              required
              className="w-full rounded border border-gray-300 p-2 text-gray-900"
            />
            <input
              name="confirmPassword"
              type="password"
              placeholder="Xác nhận mật khẩu"
              required
              className="w-full rounded border border-gray-300 p-2 text-gray-900"
            />
            {forgotError && (
              <p className="text-sm text-red-600 bg-red-100 p-2 rounded border border-red-200">{forgotError}</p>
            )}
            <button disabled={forgotLoading} className="w-full rounded bg-blue-600 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50">
              {forgotLoading ? "ĐANG CẬP NHẬT..." : "ĐẶT LẠI MẬT KHẨU →"}
            </button>
          </form>
        ) : (
          <form action={formAction} className="mt-8 space-y-4">
            {/* Chọn vai trò: Chủ trọ (is_active=2) | Người thuê (is_active=3) */}
            <div className="grid grid-cols-2 gap-2 mt-4 mb-2 bg-gray-100 p-1 rounded">
              <label className="flex cursor-pointer items-center justify-center rounded py-2 px-4 shadow-sm bg-gray-200 has-checked:bg-blue-600 has-checked:text-white text-center">
                <input type="radio" name="role" value="STUDENT" checked={selectedRole === "STUDENT"} onChange={(e) => setSelectedRole(e.target.value)} className="hidden" />{" "}
                Người thuê
              </label>
              <label className="flex cursor-pointer items-center justify-center rounded py-2 px-4 shadow-sm bg-gray-200 has-checked:bg-blue-600 has-checked:text-white text-center">
                <input type="radio" name="role" value="LANDLORD" checked={selectedRole === "LANDLORD"} onChange={(e) => setSelectedRole(e.target.value)} className="hidden" />{" "}
                Chủ trọ
              </label>
            </div>

            {view === "REGISTER" && (
              <>
                <input
                  name="fullName"
                  type="text"
                  placeholder="Họ và tên"
                  required
                  className="w-full rounded border border-gray-300 p-2 text-gray-900 focus:outline-none focus:border-blue-500"
                />
                <input
                  name="phone"
                  type="tel"
                  placeholder="Số điện thoại (ví dụ: 098...)"
                  required
                  className="w-full rounded border border-gray-300 p-2 text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </>
            )}

            <input
              name="email"
              type="email"
              defaultValue=""
              placeholder="Email của bạn đuôi @gmail.com"
              required
              className="w-full rounded border border-gray-300 p-2 text-gray-900 focus:outline-none focus:border-blue-500"
            />

            <div className="relative group">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                defaultValue=""
                placeholder="Mật khẩu"
                required
                className="w-full rounded border border-gray-300 p-2 text-gray-900 pr-10 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" x2="22" y1="2" y2="22" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {view === "LOGIN" && (
              <div className="flex items-center justify-between px-1 mt-2">
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setView("FORGOT_PASSWORD"); }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Quên mật khẩu?
                </a>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setView("REGISTER"); }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Đăng ký tài khoản
                </a>
              </div>
            )}

            {view === "REGISTER" && (
              <div className="relative group">
                <input
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Xác nhận mật khẩu"
                  required
                  className="w-full rounded border border-gray-300 p-2 text-gray-900 pr-10 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" x2="22" y1="2" y2="22" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            )}

            {state?.error && (
              <div className="text-sm text-red-600 bg-red-100 p-2 rounded border border-red-200">
                {state.error}
              </div>
            )}

            <button
              disabled={isPending}
              className="w-full rounded bg-blue-600 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "ĐANG XỬ LÝ..." : view === "LOGIN" ? "ĐĂNG NHẬP" : "HOÀN TẤT ĐĂNG KÝ"}
            </button>

            {/* Divider */}
            <div className="relative flex items-center py-2">
              <div className="grow border-t border-gray-300" />
              <span className="mx-2 text-xs text-gray-500">HOẶC</span>
              <div className="grow border-t border-gray-300" />
            </div>

            {/* Nút đăng nhập Google */}
            {googleError && (
              <p className="text-sm text-red-600 bg-red-100 p-2 rounded border border-red-200 text-center">{googleError}</p>
            )}
            <button
              type="button"
              onClick={() => { setGoogleError(""); handleGoogleLogin(); }}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-2 rounded border border-gray-300 bg-white py-2 font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {googleLoading ? (
                <span>Đang xử lý...</span>
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {googleLoading ? "" : "Tiếp tục bằng Google"}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full text-sm text-center text-blue-600 hover:underline mt-2 inline-block"
            >
              Quay lại trang chính
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
