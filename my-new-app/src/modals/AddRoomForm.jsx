import { useState } from "react";
import axios from "axios";
import { useUser } from "../contexts/UserContext";

const AddRoomForm = ({ onBack }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // States for form inputs
  const [images, setImages] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    address: "",
    ward: "",
    district: "",
    city: "",
    price: "",
    area: "",
    roomType: "PHONG_TRO_GAC",
    amenities: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        throw new Error("Vui lòng đăng nhập để đăng bài.");
      }

      // Theo Swagger UI, backend mong đợi các trường text là Query Parameters
      // và phần hình ảnh (images) thì gói trong FormData của Body.
      const queryParams = new URLSearchParams();
      queryParams.append("title", formData.title);
      queryParams.append("description", formData.description);
      queryParams.append("address", formData.address);
      queryParams.append("ward", formData.ward);
      queryParams.append("district", formData.district);
      queryParams.append("city", formData.city);
      // Optional coordinates
      queryParams.append("latitude", "10.762622"); // Default HCM
      queryParams.append("longitude", "106.660172");
      queryParams.append("price", formData.price.replace(/,/g, ""));
      queryParams.append("area", formData.area);
      queryParams.append("roomType", formData.roomType);
      
      // Parse amenities (comma separated string -> array of strings for Spring)
      const amenityList = formData.amenities.split(",").map((a) => a.trim()).filter((a) => a);
      if (amenityList.length > 0) {
        amenityList.forEach((amenity) => {
          queryParams.append("amenities", amenity);
        });
      }

      // Chuẩn bị form-data body chỉ chứa hình ảnh
      const data = new FormData();
      if (images.length > 0) {
        images.forEach((file) => {
          data.append("images", file);
        });
      }

      const url = `/api/posts?${queryParams.toString()}`;

      // Gửi request tới backend
      await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess(true);
      setTimeout(() => {
        onBack();
      }, 1500); // Tự động đóng sau 1.5s
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Đã có lỗi xảy ra. Vui lòng thử lại!"
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
        <div className="w-full max-w-sm bg-white p-6 rounded shadow border border-gray-300 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Đăng bài thành công!</h2>
          <p className="text-sm text-gray-500">Tin đăng của bạn đã được ghi nhận.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 md:p-6 overflow-hidden">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded shadow border border-gray-300">
        <div className="sticky top-0 z-10 bg-gray-100 px-6 py-4 border-b border-gray-300 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            ĐĂNG TIN PHÒNG MỚI
          </h2>
          <button onClick={onBack} className="text-gray-500 hover:text-gray-700 font-bold p-1">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="text-sm text-red-600 bg-red-100 p-2 rounded border border-red-200 text-center">
              {error}
            </div>
          )}

          {/* Tiêu đề & Loại phòng */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase">
              Thông tin cơ bản
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="Tiêu đề bài đăng..."
                className="w-full md:col-span-2 rounded border border-gray-300 p-2 text-gray-900 focus:outline-none focus:border-blue-500"
              />
              <select
                name="roomType"
                required
                value={formData.roomType}
                onChange={handleChange}
                className="w-full rounded border border-gray-300 p-2 text-gray-900 focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="PHONG_TRO_GAC">Phòng trọ có gác</option>
                <option value="PHONG_TRO">Phòng trọ</option>
                <option value="CHUNG_CU_MINI">Chung cư mini</option>
                <option value="NHA_NGUYEN_CAN">Nhà nguyên căn</option>
                <option value="PHONG_GEP">Phòng ghép</option>
                <option value="KI_TUC_XA">Kí túc xá</option>
              </select>
            </div>
          </div>

          {/* Vị trí */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase">
              Địa chỉ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="text" name="city" required value={formData.city} onChange={handleChange} placeholder="Thành phố" className="w-full rounded border border-gray-300 p-2 text-gray-900 focus:outline-none focus:border-blue-500" />
              <input type="text" name="district" required value={formData.district} onChange={handleChange} placeholder="Quận/Huyện" className="w-full rounded border border-gray-300 p-2 text-gray-900 focus:outline-none focus:border-blue-500" />
              <input type="text" name="ward" required value={formData.ward} onChange={handleChange} placeholder="Phường/Xã" className="w-full rounded border border-gray-300 p-2 text-gray-900 focus:outline-none focus:border-blue-500" />
            </div>
            <input type="text" name="address" required value={formData.address} onChange={handleChange} placeholder="Địa chỉ chi tiết (số nhà, tên đường)..." className="w-full rounded border border-gray-300 p-2 text-gray-900 focus:outline-none focus:border-blue-500" />
          </div>

          {/* Chi tiết cho thuê */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase">
              Chi tiết phòng
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <input type="number" name="price" required value={formData.price} onChange={handleChange} placeholder="Giá" className="w-full rounded border border-gray-300 p-2 text-gray-900 focus:outline-none focus:border-blue-500 pr-12" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">VNĐ</span>
              </div>
              <div className="relative">
                <input type="number" name="area" required value={formData.area} onChange={handleChange} placeholder="Diện tích" className="w-full rounded border border-gray-300 p-2 text-gray-900 focus:outline-none focus:border-blue-500 pr-10" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">m²</span>
              </div>
            </div>
            <input type="text" name="amenities" required value={formData.amenities} onChange={handleChange} placeholder="Tiện ích (Máy lạnh, Nhà vệ sinh riêng)..." className="w-full rounded border border-gray-300 p-2 text-gray-900 focus:outline-none focus:border-blue-500" />
            <textarea
              name="description"
              required
              rows="4"
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả chi tiết..."
              className="w-full rounded border border-gray-300 p-2 text-gray-900 focus:outline-none focus:border-blue-500 resize-none"
            ></textarea>
          </div>

          {/* Hình ảnh */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase">
              Hình ảnh phòng
            </h3>
            <label className="flex flex-col items-center justify-center w-full min-h-[120px] border-2 border-gray-300 border-dashed rounded bg-gray-50 hover:bg-gray-100 cursor-pointer">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <span className="text-3xl text-gray-400 mb-2">📸</span>
                <p className="text-sm text-gray-600">
                  Nhấn để chọn ảnh (Nhiều ảnh)
                </p>
              </div>
              <input type="file" name="images" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
            {images.length > 0 && (
              <p className="text-xs text-blue-600 font-bold px-1">
                Đã chọn {images.length} ảnh.
              </p>
            )}
          </div>

          <div className="pt-4 flex gap-2">
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="w-1/3 py-2 rounded border border-gray-300 bg-white text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-2/3 py-2 rounded bg-blue-600 font-bold text-white hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? "ĐANG XỬ LÝ..." : "TẠO BÀI ĐĂNG"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRoomForm;