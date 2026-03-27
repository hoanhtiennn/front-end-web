import axios from "axios";
import { useState, useActionState } from "react";
import { useUser } from "../contexts/UserContext";

const AuthPage = ({ mode, onBack }) => {
  const { login } = useUser();

  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState(mode);

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

      // Map vai trò → is_active: LANDLORD=2, TENANT=3
      const isActiveValue = role === "LANDLORD" ? 2 : 3;

      try {
        if (view === "LOGIN") {
          // --- ĐĂNG NHẬP ---
          const response = await axios.post("/auth/login", { email, password });
          const { token, is_active } = response.data;

          // Admin (is_active=1): bỏ qua kiểm tra vai trò
          if (is_active === 1) {
            localStorage.setItem("userToken", token);
            login({ name: email.split("@")[0], role: "ADMIN", token });
            onBack();
            return { success: true };
          }

          // Kiểm tra vai trò đã chọn có khớp với tài khoản không
          if (is_active !== isActiveValue) {
            const expectedRole = is_active === 2 ? "Chủ trọ" : "Người thuê";
            return { error: `Sai vai trò! Tài khoản này là "${expectedRole}". Vui lòng chọn đúng vai trò.` };
          }

          localStorage.setItem("userToken", token);
          login({ name: email.split("@")[0], role, token });
          onBack();
          return { success: true };
        } else {
          // --- ĐĂNG KÝ ---
          const fullName = formData.get("fullName");
          const phone = formData.get("phone");
          await axios.post("/auth/register", {
            full_name: fullName,
            phone,
            email,
            password,
            is_active: isActiveValue,
          });
          // Tự động đăng nhập sau khi đăng ký thành công
          const loginRes = await axios.post("/auth/login", { email, password });
          const { token } = loginRes.data;
          localStorage.setItem("userToken", token);
          login({ name: fullName, role, token });
          onBack();
          return { success: true };
        }
      } catch (error) {
        return { error: error.response?.data?.message ?? "Đã có lỗi xảy ra. Vui lòng thử lại!" };
      }
    },
    null,
  );

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xl p-6">
      <div className="w-full max-w-md rounded-[2.5rem] bg-white p-10 shadow-2xl ring-1 ring-zinc-200">
        <h2 className="text-3xl font-black text-zinc-900 tracking-tight">
          {view === "LOGIN" && "Đăng nhập"}
          {view === "REGISTER" && "Đăng ký tài khoản"}
          {view === "FORGOT_PASSWORD" && "Quên mật khẩu"}
          {view === "VERIFY_OTP" && "Nhập mã xác nhận"}
          {view === "RESET_PASSWORD" && "Đặt lại mật khẩu"}
        </h2>

        {view === "FORGOT_PASSWORD" ? (
          <form onSubmit={handleSendOtp} className="mt-8 space-y-4">
            <p className="text-sm text-zinc-500 font-medium">
              Nhập email của bạn để nhận mã OTP 6 số.
            </p>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => { setForgotEmail(e.target.value); setForgotError(""); }}
              placeholder="Email của bạn"
              required
              className="w-full rounded-2xl border-none bg-zinc-100 p-4 outline-none focus:ring-2 focus:ring-rose-500/20"
            />
            {forgotError && (
              <p className="text-xs text-red-600 font-bold bg-red-50 p-3 rounded-2xl text-center">{forgotError}</p>
            )}
            <button disabled={forgotLoading} className="w-full rounded-2xl bg-zinc-900 py-4 font-black text-white shadow-xl hover:bg-black transition-all disabled:opacity-50">
              {forgotLoading ? "ĐANG GỬI..." : "GỬI MÃ OTP →"}
            </button>
            <button type="button" onClick={() => setView("LOGIN")} className="w-full text-sm font-bold text-zinc-400">
              Quay lại Đăng nhập
            </button>
          </form>
        ) : view === "VERIFY_OTP" ? (
          <form onSubmit={handleVerifyOtp} className="mt-8 space-y-4">
            <p className="text-sm text-zinc-500 font-medium">
              Mã OTP đã được gửi đến <span className="font-bold text-zinc-800">{forgotEmail}</span>.
            </p>
            <div className="flex justify-center gap-3">
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
                  className="w-16 h-16 rounded-2xl bg-zinc-100 text-center text-2xl font-black outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                />
              ))}
            </div>
            {forgotError && (
              <p className="text-xs text-red-600 font-bold bg-red-50 p-3 rounded-2xl text-center">{forgotError}</p>
            )}
            <button disabled={forgotLoading} className="w-full rounded-2xl bg-zinc-900 py-4 font-black text-white shadow-xl hover:bg-black transition-all disabled:opacity-50">
              {forgotLoading ? "ĐANG XÁC NHẬN..." : "XÁC NHẬN MÃ OTP →"}
            </button>
            <button type="button" onClick={() => { setForgotError(""); setView("FORGOT_PASSWORD"); }} className="w-full text-sm font-bold text-zinc-400">
              Gửi lại mã OTP
            </button>
          </form>
        ) : view === "RESET_PASSWORD" ? (
          <form onSubmit={handleResetPassword} className="mt-8 space-y-4">
            <p className="text-sm text-zinc-500 font-medium">Nhập mật khẩu mới của bạn.</p>
            <input
              name="newPassword"
              type="password"
              placeholder="Mật khẩu mới"
              required
              className="w-full rounded-2xl border-none bg-zinc-100 p-4 outline-none focus:ring-2 focus:ring-rose-500/20"
            />
            <input
              name="confirmPassword"
              type="password"
              placeholder="Xác nhận mật khẩu"
              required
              className="w-full rounded-2xl border-none bg-zinc-100 p-4 outline-none focus:ring-2 focus:ring-rose-500/20"
            />
            {forgotError && (
              <p className="text-xs text-red-600 font-bold bg-red-50 p-3 rounded-2xl text-center">{forgotError}</p>
            )}
            <button disabled={forgotLoading} className="w-full rounded-2xl bg-rose-600 py-4 font-black text-white shadow-xl hover:bg-rose-700 transition-all disabled:opacity-50">
              {forgotLoading ? "ĐANG CẬP NHẬT..." : "ĐẶT LẠI MẬT KHẨU →"}
            </button>
          </form>
        ) : (
          <form action={formAction} className="mt-8 space-y-4">
            {/* Chọn vai trò: Chủ trọ (is_active=2) | Người thuê (is_active=3) */}
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-100 p-1.5 font-bold text-sm">
              <label className="flex cursor-pointer items-center justify-center rounded-xl py-3 has-[:checked]:bg-white has-[:checked]:text-rose-600 transition-all text-zinc-500 shadow-xs">
                <input type="radio" name="role" value="TENANT" defaultChecked className="hidden" />{" "}
                Người thuê
              </label>
              <label className="flex cursor-pointer items-center justify-center rounded-xl py-3 has-[:checked]:bg-white has-[:checked]:text-rose-600 transition-all text-zinc-500 shadow-xs">
                <input type="radio" name="role" value="LANDLORD" className="hidden" />{" "}
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
                  className="w-full rounded-2xl border-none bg-zinc-100 p-4 outline-none focus:ring-2 focus:ring-rose-500/20"
                />
                <input
                  name="phone"
                  type="tel"
                  placeholder="Số điện thoại (ví dụ: 098...)"
                  required
                  className="w-full rounded-2xl border-none bg-zinc-100 p-4 outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </>
            )}

            <input
              name="email"
              type="email"
              defaultValue=""
              placeholder="Email của bạn đuôi @gmail.com"
              required
              className="w-full rounded-2xl border-none bg-zinc-100 p-4 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
            />

            <div className="relative group">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                defaultValue=""
                placeholder="Mật khẩu"
                required
                className="w-full rounded-2xl border-none bg-zinc-100 p-4 pr-12 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-zinc-400 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200"
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
                  className="text-xs font-bold text-rose-500 hover:underline underline-offset-4"
                >
                  Quên mật khẩu?
                </a>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setView("REGISTER"); }}
                  className="text-xs font-bold text-zinc-500 hover:text-rose-600 transition-colors"
                >
                  Đăng ký tài khoản
                </a>
              </div>
            )}

            {view === "REGISTER" && (
              <div className="relative group animate-in fade-in slide-in-from-top-2 duration-300">
                <input
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Xác nhận mật khẩu"
                  required
                  className="w-full rounded-2xl border-none bg-zinc-100 p-4 pr-12 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200"
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
              <div className="text-xs text-red-600 font-bold bg-red-50 p-4 rounded-2xl text-center border border-red-100 animate-pulse">
                {state.error}
              </div>
            )}

            <button
              disabled={isPending}
              className="w-full rounded-2xl bg-rose-600 py-4 font-black text-white shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {isPending ? "ĐANG XỬ LÝ..." : view === "LOGIN" ? "ĐĂNG NHẬP →" : "HOÀN TẤT ĐĂNG KÝ →"}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full text-sm font-bold text-zinc-400 hover:text-zinc-600 transition-colors"
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
