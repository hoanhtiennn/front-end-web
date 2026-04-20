import { useState, useEffect } from "react";
import axios from "axios";
import { UserProvider, useUser } from "./contexts/UserContext";
// Import Components
import Navbar from "./components/Navbar";
import Hero from "./components/layout/Hero";
import SearchBar from "./components/layout/SearchBar";
import Footer from "./components/layout/Footer";
import RoomCard from "./components/RoomCard";
import AddRoomCard from "./components/AddRoomCard";
// Import Modals & Data
import AuthPage from "./modals/AuthPage";
import AddRoomForm from "./modals/AddRoomForm";
import EditProfileModal from "./modals/EditProfileModal";
import PurchasePlanModal from "./modals/PurchasePlanModal";
import RoomDetailModal from "./modals/RoomDetailModal";
import PaymentResultModal from "./modals/PaymentResultModal";
import MyPostsModal from "./modals/MyPostsModal";
import SavedPostsModal from "./modals/SavedPostsModal";
import VerificationModal from "./modals/VerificationModal";

function MainApp() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    roomType: "",
    amenities: [],
  });
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("LOGIN");
  const [isLocating, setIsLocating] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [showSavedPosts, setShowSavedPosts] = useState(false);
  const [savedRefreshKey, setSavedRefreshKey] = useState(0);
  const [editingPost, setEditingPost] = useState(null);
  const [showVerification, setShowVerification] = useState(false);

  // Kiểm tra xem có phải là trang return từ VNPay không
  const isPaymentReturn = new URLSearchParams(window.location.search).has(
    "vnp_ResponseCode",
  );

  const { user } = useUser();

  const enforceAuth = (callback) => {
    if (!user) {
      setAuthMode("LOGIN");
      setShowAuth(true);
      return;
    }
    return callback();
  };

  // Khởi tạo mảng rỗng thay vì dữ liệu ảo
  const [rooms, setRooms] = useState([]);

  // Tự động lấy danh sách bài đăng thật khi vừa mở trang
  useEffect(() => {
    const fetchRealPosts = async (retryWithoutToken = false) => {
      try {
        // Trang chủ có thể yêu cầu Token xác thực
        const token = localStorage.getItem("userToken");
        const headers =
          token && !retryWithoutToken
            ? { Authorization: `Bearer ${token}` }
            : {};
        // QUAN TRỌNG: Backend của bạn KHÔNG nhận page=0, bắt buộc page=1 trở lên (Lỗi 400 Bad Request)
        const res = await axios.get("/api/posts?page=1&size=20", { headers });
        const rawData = res.data?.content || res.data || [];

        const fetchedRooms = Array.isArray(rawData)
          ? rawData.map((p) => {
              // Trích xuất hình ảnh thật nếu có
              let imgUrl =
                "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800";
              if (p.images && p.images.length > 0) {
                imgUrl = p.images[0].url || p.images[0].imageUrl || imgUrl;
              }

              return {
                id: p.id,
                title: p.title || "Phòng trọ",
                price: (p.price || 0) / 1000000,
                address: p.address || p.city || "Chưa cập nhật địa chỉ",
                tag: p.roomType || "",
                image: imgUrl,
                planType: p.userPlan || p.plan || (p.user && p.user.plan) || "FREE",
                isOwnerVerified: p.user?.isVerified || p.ownerVerified || false,
              };
            })
          : [];
        setRooms(fetchedRooms);
      } catch (err) {
        if (err.response?.status === 401 && !retryWithoutToken) {
          // Nếu báo lỗi 401 do auth, thử lấy dữ liệu mà không cần token
          fetchRealPosts(true);
        } else {
          setRooms([]);
          console.error("Lỗi lấy bài đăng:", err);
        }
      }
    };
    fetchRealPosts();
  }, [user]);

  const fetchNearbyRooms = async (lat, lng) => {
    try {
      const token = localStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(
        `/api/posts/nearby?lat=${lat}&lng=${lng}&radius=2&page=1&size=20`,
        { headers },
      );

      // Expand parsing to cover different result wrappers
      let rawData = [];
      if (Array.isArray(res.data)) rawData = res.data;
      else if (Array.isArray(res.data?.content)) rawData = res.data.content;
      else if (Array.isArray(res.data?.result)) rawData = res.data.result;
      else if (Array.isArray(res.data?.data)) rawData = res.data.data;
      else if (Array.isArray(res.data?.data?.content))
        rawData = res.data.data.content;

      console.log("Nearby API Response:", res.data);
      console.log("Parsed Raw Data:", rawData);
      const fetchedRooms = Array.isArray(rawData)
        ? rawData.map((p) => {
            let imgUrl =
              "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800";
            if (p.images && p.images.length > 0) {
              imgUrl = p.images[0].url || p.images[0].imageUrl || imgUrl;
            }
            return {
              id: p.id,
              title: p.title || "Phòng trọ",
              price: (p.price || 0) / 1000000, // Đổi sang triệu
              address: p.address || p.city || "",
              tag: p.roomType || "",
              image: imgUrl,
              planType:
                p.userPlan || p.plan || (p.user && p.user.plan) || "FREE",
            };
          })
        : [];

      setRooms(fetchedRooms);
    } catch (err) {
      console.error("fetchNearbyRooms Error:", err);
      console.error("Response Data:", err.response?.data);
      if (err.response?.status === 404) {
        alert("API /api/posts/nearby chưa hoạt động hoặc sai đường dẫn!");
      } else if (err.response?.status === 401) {
        alert("Vui lòng đăng nhập để xem danh sách phòng lân cận!");
      } else if (err.response?.status === 400) {
        alert(
          `Lỗi dữ liệu (400): ${err.response?.data?.message || JSON.stringify(err.response?.data)}`,
        );
      } else {
        alert(
          "Có lỗi xảy ra khi lấy danh sách phòng từ Backend. Nhấn F12 sang tab Console để xem chi tiết!",
        );
      }
    }
  };

  const handleGetLocation = () =>
    enforceAuth(() => {
      setIsLocating(true);
      if (!navigator.geolocation) {
        alert("Trình duyệt không hỗ trợ định vị GPS!");
        setIsLocating(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;

          // Gọi API đảo ngược toạ độ thành chữ (Reverse Geocoding) thông qua Goong API
          try {
            const GOONG_KEY = import.meta.env.VITE_GOONG_API_KEY;
            if (!GOONG_KEY) throw new Error("Missing Goong API Key");

            const res = await axios.get(
              `https://rsapi.goong.io/Geocode?latlng=${latitude},${longitude}&api_key=${GOONG_KEY}`,
            );
            if (res.data && res.data.results && res.data.results.length > 0) {
              // Lấy địa chỉ hiển thị
              const addressParts = res.data.results[0].formatted_address;
              setSearchTerm(addressParts);
            } else {
              setSearchTerm(`${latitude}, ${longitude}`);
            }
          } catch (e) {
            setSearchTerm(`${latitude}, ${longitude}`); // Fallback
          }

          fetchNearbyRooms(latitude, longitude).finally(() =>
            setIsLocating(false),
          );
        },
        (err) => {
          alert("Không thể lấy vị trí. Vui lòng cấp quyền GPS cho web.");
          setIsLocating(false);
        },
      );
    });

  const handleSearch = async () =>
    enforceAuth(() => {
      // Generate query parameters based on filters
      const queryParams = new URLSearchParams();
      queryParams.append("page", "1");
      // Tăng size lên 100 để bộ lọc cục bộ hoạt động tốt hơn
      queryParams.append("size", "100");
      if (searchTerm.trim()) queryParams.append("title", searchTerm.trim());
      if (filters.minPrice) queryParams.append("minPrice", filters.minPrice);
      if (filters.maxPrice) queryParams.append("maxPrice", filters.maxPrice);
      if (filters.roomType) queryParams.append("roomType", filters.roomType);

      const qs = queryParams.toString();

      // Call standard search API
      const fetchSearch = async () => {
        try {
          const token = localStorage.getItem("userToken");
          const headers = token ? { Authorization: `Bearer ${token}` } : {};

          // Use GET /api/posts with all parameters (matches Swagger SearchRequest via query params)
          const res = await axios.get(`/api/posts?${qs}`, { headers });
          let rawData = [];
          if (Array.isArray(res.data)) rawData = res.data;
          else if (Array.isArray(res.data?.content)) rawData = res.data.content;
          else if (Array.isArray(res.data?.result)) rawData = res.data.result;
          else if (Array.isArray(res.data?.data)) rawData = res.data.data;
          else if (Array.isArray(res.data?.data?.content))
            rawData = res.data.data.content;

          const fetchedRooms = Array.isArray(rawData)
            ? rawData.map((p) => {
                let imgUrl =
                  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800";
                if (p.images && p.images.length > 0) {
                  imgUrl = p.images[0].url || p.images[0].imageUrl || imgUrl;
                }
                return {
                  id: p.id,
                  title: p.title || "Phòng trọ",
                  price: (p.price || 0) / 1000000,
                  address: p.address || p.city || "",
                  tag: p.roomType || "",
                  image: imgUrl,
                  planType:
                    p.userPlan || p.plan || (p.user && p.user.plan) || "FREE",
                  amenities: Array.isArray(p.amenities) ? p.amenities : [], // Nhớ trích xuất mảng tiện ích
                };
              })
            : [];

          // Nếu người dùng chọn Tiện ích, ta bắt buộc phải LỌC CỤC BỘ (Local Filtering) ở Frontend
          // Vì Backend xử lý param mảng tiện ích array không tốt (trả ra 0 kết quả).
          let resultRooms = fetchedRooms;
          if (filters.amenities && filters.amenities.length > 0) {
            resultRooms = resultRooms.filter((room) => {
              // Chuẩn hoá mảng tên tiện ích của phòng
              const roomAmenities = room.amenities.map((a) =>
                (a.type || a.name || a || "").toString().toLowerCase(),
              );

              // Kiểm tra: Hàm every() đảm bảo phòng đó phải có TẤT CẢ các tiện ích người dùng yêu cầu
              return filters.amenities.every((selectedAminity) =>
                roomAmenities.includes(selectedAminity.toLowerCase()),
              );
            });
          }

          setRooms(resultRooms);
        } catch (err) {
          console.error("Search API Error:", err);
          alert("Lỗi khi tìm kiếm, vui lòng thử lại!");
        }
      };
      fetchSearch();
    });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Navbar
        onAuthClick={(mode) => {
          setAuthMode(mode);
          setShowAuth(true);
        }}
        onEditProfileClick={() => setShowEditProfile(true)}
        onPricingClick={() => setShowPricing(true)}
        onMyPostsClick={() => setShowMyPosts(true)}
      onSavedPostsClick={() => {
          setSavedRefreshKey((k) => k + 1);
          setShowSavedPosts(true);
        }}
        onVerifyClick={() => setShowVerification(true)}
      />

      {showAuth && (
        <AuthPage mode={authMode} onBack={() => setShowAuth(false)} />
      )}
      {showVerification && <VerificationModal onBack={() => setShowVerification(false)} />}
      {showAddRoom && <AddRoomForm onBack={() => setShowAddRoom(false)} />}
      {editingPost && (
        <AddRoomForm
          existingPost={editingPost}
          onBack={() => {
            setEditingPost(null);
            setShowMyPosts(true); // Quay lại danh sách sau khi sửa
          }}
        />
      )}
      {showMyPosts && !editingPost && (
        <MyPostsModal
          onBack={() => setShowMyPosts(false)}
          onEditPost={(post) => {
            setShowMyPosts(false);
            setEditingPost(post);
          }}
          onViewPost={(id) => {
            setShowMyPosts(false);
            setSelectedRoomId(id);
          }}
        />
      )}
      {showEditProfile && (
        <EditProfileModal onBack={() => setShowEditProfile(false)} />
      )}
      {showPricing && (
        <PurchasePlanModal onBack={() => setShowPricing(false)} />
      )}
      {selectedRoomId && (
        <RoomDetailModal
          roomId={selectedRoomId}
          onBack={() => setSelectedRoomId(null)}
        />
      )}
      {showSavedPosts && (
        <SavedPostsModal
          refreshKey={savedRefreshKey}
          onBack={() => setShowSavedPosts(false)}
          onOpenRoom={(id) => {
            setShowSavedPosts(false);
            setSelectedRoomId(id);
          }}
        />
      )}
      {isPaymentReturn && <PaymentResultModal />}

      <Hero />

      <SearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSearch={handleSearch}
        onLocationClick={handleGetLocation}
        isLocating={isLocating}
        filters={filters}
        setFilters={setFilters}
      />

      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-10 flex items-end justify-between border-b border-gray-200 pb-5 text-gray-900 relative">
          <div>
            <h2 className="text-3xl font-black tracking-tight mb-2">
              Gợi ý phòng nổi bật
            </h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-rose-500 to-orange-400 rounded-full mb-[-23px]"></div>
          </div>
          <span className="text-sm font-semibold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
            Tìm thấy{" "}
            <span className="font-black text-rose-600">{rooms.length}</span> kết
            quả
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {user?.role === "LANDLORD" && (
            <AddRoomCard onClick={() => setShowAddRoom(true)} />
          )}
          {rooms.map((room, index) => (
            <RoomCard
              key={room.id}
              room={room}
              index={index}
              onClick={() => enforceAuth(() => setSelectedRoomId(room.id))}
            />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <MainApp />
    </UserProvider>
  );
}
