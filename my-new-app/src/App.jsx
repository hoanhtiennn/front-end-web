import { useState } from "react";
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
import { MOCK_ROOMS } from "./data/mockData";

function MainApp() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("LOGIN");
  const [isLocating, setIsLocating] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  
  const { user } = useUser();
  
  const filteredRooms = MOCK_ROOMS.filter((room) =>
    room.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGetLocation = () => { /* Logic GPS giữ nguyên */ };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <Navbar onAuthClick={(mode) => { setAuthMode(mode); setShowAuth(true); }} />

      {showAuth && <AuthPage mode={authMode} onBack={() => setShowAuth(false)} />}
      {showAddRoom && <AddRoomForm onBack={() => setShowAddRoom(false)} />}

      <Hero />

      <SearchBar 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        onLocationClick={handleGetLocation}
        isLocating={isLocating}
      />

      <main className="container mx-auto px-6 py-16 md:py-24">
        <div className="mb-12 flex items-baseline justify-between border-b border-zinc-100 pb-6">
          <h2 className="text-3xl font-black text-zinc-950 tracking-tight">Gợi ý phòng <span className="text-rose-600 italic">nổi bật</span></h2>
          <span className="text-sm text-zinc-500 font-medium">Tìm thấy {filteredRooms.length} kết quả</span>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 grid-flow-row-dense">
          {user?.role === "LANDLORD" && <AddRoomCard onClick={() => setShowAddRoom(true)} />}
          {filteredRooms.map((room, index) => (
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