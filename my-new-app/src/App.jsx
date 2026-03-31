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
import { MOCK_ROOMS } from "./data/mockData";

function MainApp() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("LOGIN");
  const [isLocating, setIsLocating] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  
  const { user } = useUser();
  
  const [rooms, setRooms] = useState(MOCK_ROOMS);

  const fetchNearbyRooms = async (lat, lng) => {
    try {
      const token = localStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`/api/posts/nearby?lat=${lat}&lng=${lng}&radius=5`, { headers });
      
      // Fallback format data mapping in case backend returns different structure than Mock
      const rawData = res.data?.content || res.data || [];
      const fetchedRooms = Array.isArray(rawData) ? rawData.map(p => ({
        id: p.id,
        title: p.title || "Phòng trọ",
        price: (p.price || 0) / 1000000, // Đổi sang triệu
        address: p.address || "",
        tag: p.roomType || "",
        image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800", 
      })) : [];
      
      setRooms(fetchedRooms);
    } catch (err) {
      console.error("fetchNearbyRooms Error:", err);
      console.error("Response Data:", err.response?.data);
      if (err.response?.status === 404) {
        alert("API /api/posts/nearby chưa hoạt động hoặc sai đường dẫn!");
      } else if (err.response?.status === 401) {
        alert("Vui lòng đăng nhập để xem danh sách phòng lân cận!");
      } else if (err.response?.status === 400) {
        alert(`Lỗi dữ liệu (400): ${err.response?.data?.message || JSON.stringify(err.response?.data)}`);
      } else {
        alert("Có lỗi xảy ra khi lấy danh sách phòng từ Backend. Nhấn F12 sang tab Console để xem chi tiết!");
      }
    }
  };

  const handleGetLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ định vị GPS!");
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        
        // Gọi API đảo ngược toạ độ thành chữ (Reverse Geocoding)
        try {
          const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (res.data && res.data.display_name) {
            // Lấy địa chỉ hiển thị, cắt ngắn bớt nếu quá dài
            const addressParts = res.data.display_name.split(",").slice(0, 4).join(",");
            setSearchTerm(addressParts);
          } else {
            setSearchTerm(`${latitude}, ${longitude}`);
          }
        } catch (e) {
          setSearchTerm(`${latitude}, ${longitude}`); // Fallback
        }

        fetchNearbyRooms(latitude, longitude).finally(() => setIsLocating(false));
      },
      (err) => {
        alert("Không thể lấy vị trí. Vui lòng cấp quyền GPS cho web.");
        setIsLocating(false);
      }
    );
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setRooms(MOCK_ROOMS);
      return;
    }
    try {
      // Gọi API Nominatim miễn phí chuyển đổi chữ -> toạ độ
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchTerm)}&format=json&limit=1`);
      if (res.data && res.data.length > 0) {
        const { lat, lon } = res.data[0];
        await fetchNearbyRooms(lat, lon);
      } else {
        alert("Không tìm thấy toạ độ cho địa chỉ này!");
        setRooms([]);
      }
    } catch (err) {
      alert("Lỗi tìm kiếm toạ độ!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Navbar 
        onAuthClick={(mode) => { setAuthMode(mode); setShowAuth(true); }} 
        onEditProfileClick={() => setShowEditProfile(true)}
      />

      {showAuth && <AuthPage mode={authMode} onBack={() => setShowAuth(false)} />}
      {showAddRoom && <AddRoomForm onBack={() => setShowAddRoom(false)} />}
      {showEditProfile && <EditProfileModal onBack={() => setShowEditProfile(false)} />}

      <Hero />

      <SearchBar 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        onSearch={handleSearch}
        onLocationClick={handleGetLocation}
        isLocating={isLocating}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between border-b border-gray-300 pb-4">
          <h2 className="text-xl font-bold text-gray-800">Gợi ý phòng nổi bật</h2>
          <span className="text-sm text-gray-500">Tìm thấy {rooms.length} kết quả</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {user?.role === "LANDLORD" && <AddRoomCard onClick={() => setShowAddRoom(true)} />}
          {rooms.map((room, index) => (
            <RoomCard key={room.id} room={room} index={index} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return <UserProvider><MainApp /></UserProvider>;
}