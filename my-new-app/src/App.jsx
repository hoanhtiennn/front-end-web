import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { UserProvider, useUser } from "./context/UserContext";
import Navbar from "./components/Navbar";
import Hero from "./layout/Hero";
import SearchBar from "./layout/SearchBar";
import Footer from "./layout/Footer";
import RoomCard from "./components/RoomCard";
import AddRoomCard from "./components/AddRoomCard";
import AuthPage from "./features/modals/AuthPage";
import AddRoomForm from "./features/modals/AddRoomForm";
import EditProfileModal from "./features/modals/EditProfileModal";
import PurchasePlanModal from "./features/modals/PurchasePlanModal";
import RoomDetailModal from "./features/modals/RoomDetailModal";
import PaymentResultModal from "./features/modals/PaymentResultModal";
import MyPostsModal from "./features/modals/MyPostsModal";
import SavedPostsModal from "./features/modals/SavedPostsModal";
import VerificationModal from "./features/modals/VerificationModal";
import AdminApp from "./pages/admin/AdminApp";

/**
 * Component chính chứa toàn bộ giao diện, state và luồng logic hoạt động của ứng dụng
 */
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
  const [searchRadius, setSearchRadius] = useState(4);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [showSavedPosts, setShowSavedPosts] = useState(false);
  const [savedRefreshKey, setSavedRefreshKey] = useState(0);
  const [editingPost, setEditingPost] = useState(null);
  const [showVerification, setShowVerification] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  // Vị trí GPS đã xác nhận (null = chưa từng click "Gần tôi")
  const [confirmedLocation, setConfirmedLocation] = useState(null);
  const [locationToast, setLocationToast] = useState(null); // toast nhỏ khi GPS lỗi
  const [rooms, setRooms] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentEndpoint, setCurrentEndpoint] = useState("/api/posts");
  const [currentParams, setCurrentParams] = useState({});
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  const DEFAULT_PAGE_SIZE = 16;

  const isPaymentReturn = new URLSearchParams(window.location.search).has(
    "vnp_ResponseCode",
  );

  const { user } = useUser();

  /**
   * Đảm bảo người dùng đã đăng nhập trước khi thực thi một hành động.
   * Nếu chưa đăng nhập, hiển thị modal đăng nhập và chặn hành động đó.
   */
  const enforceAuth = (callback) => {
    if (!user) {
      setAuthMode("LOGIN");
      setShowAuth(true);
      return;
    }
    return callback();
  };

  /**
   * Trích xuất mảng dữ liệu từ nhiều định dạng phản hồi API khác nhau,
   * giúp chuẩn hóa cấu trúc list đầu vào cho các hàm xử lý.
   */
  const extractList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload?.result)) return payload.result;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.content)) return payload.data.content;
    if (Array.isArray(payload?.data?.result)) return payload.data.result;
    return [];
  };

  /**
   * Phân tích thông tin phân trang (siêu dữ liệu) từ phản hồi API
   * Xác định tổng số trang, tổng số mục và trạng thái còn trang tiếp theo hay không.
   */
  const parseMeta = (payload, currentPage, pageSize, currentItemsCount) => {
    const root = payload?.data || payload || {};
    const totalPagesRaw = root.totalPages ?? root.page?.totalPages;
    const totalPages = Number(totalPagesRaw);
    const hasTotalPages = Number.isFinite(totalPages) && totalPages > 0;
    const totalItems =
      root.totalElements ?? root.totalItems ?? root.page?.totalElements;

    const hasNextRaw = root.hasNext ?? root.page?.hasNext;
    const hasNextBoolean =
      typeof hasNextRaw === "boolean"
        ? hasNextRaw
        : root.last === false || root.page?.last === false;

    if (typeof hasNextBoolean === "boolean") {
      return {
        hasMore: hasNextBoolean,
        totalPages: hasTotalPages ? totalPages : undefined,
        totalItems,
      };
    }

    if (hasTotalPages) {
      return { hasMore: currentPage < totalPages, totalPages, totalItems };
    }

    return {
      hasMore: currentItemsCount >= pageSize,
      totalPages: hasTotalPages ? totalPages : undefined,
      totalItems,
    };
  };

  /**
   * Ánh xạ dữ liệu bài đăng thô từ API sang cấu trúc thuộc tính phòng trọ chuẩn (RoomCard format).
   * Xử lý trường hợp thiếu hình ảnh, định dạng địa chỉ, và trích xuất điểm/lượt xem.
   */
  const mapPostToRoom = (p) => {
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
      amenities: Array.isArray(p.amenities) ? p.amenities : [],
      viewCount: p.postStat?.viewCount ?? p.postStats?.viewCount ?? p.viewCount ?? p.view_count ?? p.stats?.viewCount ?? 0,
      rankingScore: p.postStat?.rankingScore ?? p.postStats?.rankingScore ?? p.rankingScore ?? p.ranking_score ?? p.stats?.rankingScore ?? 0,
    };
  };

  /**
   * Gọi API GET để lấy một trang dữ liệu bài đăng (phân trang).
   * @param {Object} args Bao gồm endpoint, headers, params, page, pageSize.
   */
  const fetchPostsPage = useCallback(
    async ({
      endpoint,
      headers,
      params = {},
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
    }) => {
      const query = new URLSearchParams({
        ...params,
        page: String(page),
        size: String(pageSize),
      });

      const res = await axios.get(`${endpoint}?${query.toString()}`, {
        headers,
      });
      const items = extractList(res.data);
      const meta = parseMeta(res.data, page, pageSize, items.length);

      return { items, meta };
    },
    [DEFAULT_PAGE_SIZE],
  );

  /**
   * Luồng tải và sắp xếp danh sách phòng trọ chính:
   * 1. Lấy dữ liệu phân trang từ API.
   * 2. Chuẩn hóa dữ liệu qua `mapPostToRoom`.
   * 3. Sắp xếp ưu tiên hiển thị theo Gói dịch vụ (ULTRA > PRO > FREE) và theo điểm đánh giá.
   * 4. Cập nhật các state phân trang.
   */
  const loadRooms = useCallback(
    async ({ endpoint, params = {}, page = 1, retryWithoutToken = false }) => {
      try {
        setIsLoadingRooms(true);

        const token = localStorage.getItem("userToken");
        const headers =
          token && !retryWithoutToken
            ? { Authorization: `Bearer ${token}` }
            : {};

        const { items, meta } = await fetchPostsPage({
          endpoint,
          headers,
          params,
          page,
        });

        const planPriority = { ULTRA: 2, PRO: 1, FREE: 0 };
        const mappedRooms = items.map(mapPostToRoom)
          .sort((a, b) => {
            const tierDiff = (planPriority[b.planType] ?? 0) - (planPriority[a.planType] ?? 0);
            if (tierDiff !== 0) return tierDiff;
            return (b.rankingScore ?? 0) - (a.rankingScore ?? 0);
          });

        setRooms(mappedRooms);
        setCurrentPage(page);
        setTotalPages(meta.totalPages ?? 1);
        setTotalResults(meta.totalItems ?? mappedRooms.length);
        setHasMore(meta.hasMore);
        setCurrentEndpoint(endpoint);
        setCurrentParams(params);

        return { items: mappedRooms, meta };
      } catch (err) {
        if (err.response?.status === 401 && !retryWithoutToken) {
          return loadRooms({ endpoint, params, page, retryWithoutToken: true });
        }

        setRooms([]);
        setHasMore(false);
        setTotalPages(1);
        setTotalResults(0);

        console.error("Lỗi lấy bài đăng:", err);
        throw err;
      } finally {
        setIsLoadingRooms(false);
      }
    },
    [fetchPostsPage],
  );

  /**
   * Hook khởi tạo: Tự động tải trang 1 danh sách phòng (sắp xếp theo RankingScore giảm dần)
   */
  useEffect(() => {
    const fetchRealPosts = async () => {
      try {
        await loadRooms({ endpoint: "/api/posts", params: { sort: "postStat.rankingScore,desc" }, page: 1 });
      } catch {
      }
    };

    fetchRealPosts();
  }, [user, loadRooms]);

  /**
   * Gọi API tìm kiếm các phòng trọ lân cận trong bán kính xung quanh tọa độ GPS chỉ định.
   */
  const fetchNearbyRooms = async (lat, lng, radius = searchRadius) => {
    try {
      await loadRooms({
        endpoint: "/api/posts/nearby",
        params: { lat, lng, radius },
        page: 1,
      });
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

  /**
   * Thuật toán tạo mảng hiển thị thanh phân trang thông minh.
   * Chèn tự động dấu '...' nếu tổng số trang lớn hơn 7 để giao diện gọn gàng.
   */
  const buildPageRange = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const range = [1];
    const left = Math.max(2, currentPage - 1);
    const right = Math.min(totalPages - 1, currentPage + 1);

    if (left > 2) {
      range.push("start-ellipsis");
    }

    for (let page = left; page <= right; page += 1) {
      range.push(page);
    }

    if (right < totalPages - 1) {
      range.push("end-ellipsis");
    }

    range.push(totalPages);
    return range;
  };

  /**
   * Xử lý chuyển trang, gọi lại API loadRooms với trang mới
   */
  const handlePageChange = async (page) => {
    if (page < 1 || page === currentPage || isLoadingRooms) return;
    if (totalPages && page > totalPages) return;

    try {
      await loadRooms({
        endpoint: currentEndpoint,
        params: currentParams,
        page,
      });
    } catch {
    }
  };

  const GEOLOCATION_OPTIONS = {
    enableHighAccuracy: true,
    timeout: 12000,
    maximumAge: 0,
  };

  /**
   * Luồng xử lý định vị:
   * 1. Bật HTML5 Geolocation để xin quyền lấy GPS từ thiết bị.
   * 2. Gọi fetchNearbyRooms và dùng API Goong dịch tọa độ thành địa chỉ thật.
   * 3. Fallback dùng cached location nếu user từ chối hoặc lỗi.
   */
  const handleGetLocation = (radiusParam = searchRadius) =>
    enforceAuth(() => {
      setIsLocating(true);
      if (!navigator.geolocation) {
        alert("Trình duyệt không hỗ trợ định vị GPS!");
        setIsLocating(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          localStorage.setItem(
            "lastKnownLocation",
            JSON.stringify({ latitude, longitude, ts: Date.now() }),
          );

          // Lưu vào state để slider biết dùng tọa độ này khi kéo sau này
          setConfirmedLocation({ lat: latitude, lng: longitude });

          setSearchTerm(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          fetchNearbyRooms(latitude, longitude).finally(() =>
            setIsLocating(false),
          );

          (async () => {
            try {
              const GOONG_KEY = import.meta.env.VITE_GOONG_API_KEY;
              if (!GOONG_KEY?.trim()) return;
              const res = await axios.get(
                `https://rsapi.goong.io/Geocode?latlng=${latitude},${longitude}&api_key=${GOONG_KEY.trim()}`,
                { timeout: 3000 },
              );
              const formatted = res.data?.results?.[0]?.formatted_address;
              if (formatted) setSearchTerm(formatted);
            } catch {
            }
          })();
        },
        () => {
          try {
            const cached = JSON.parse(
              localStorage.getItem("lastKnownLocation") || "null",
            );
            const cacheAge = Date.now() - Number(cached?.ts || 0);
            if (
              cached?.latitude &&
              cached?.longitude &&
              cacheAge <= 90 * 1000
            ) {
              setSearchTerm(
                `${Number(cached.latitude).toFixed(6)}, ${Number(cached.longitude).toFixed(6)}`,
              );
              // Cấp nhật confirmedLocation từ cache hợp lệ
              setConfirmedLocation({ lat: cached.latitude, lng: cached.longitude });
              fetchNearbyRooms(cached.latitude, cached.longitude).finally(() =>
                setIsLocating(false),
              );
              return;
            }
          } catch {
          }

          alert("Không thể lấy vị trí nhanh. Vui lòng bật GPS hoặc thử lại.");
          setIsLocating(false);
        },
        GEOLOCATION_OPTIONS,
      );
    });
  // Kéo slider bán kính → tự động xin GPS mới (không cache) rồi search
  const handleRadiusChange = (radius) => {
    if (!navigator.geolocation) return;
    if (isLocating) return; // đang định vị thì bỏ qua
    setIsLocating(true);
    setLocationToast(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        localStorage.setItem(
          "lastKnownLocation",
          JSON.stringify({ latitude: lat, longitude: lng, ts: Date.now() }),
        );
        setConfirmedLocation({ lat, lng });
        setSearchTerm(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        // Reverse geocode địa chỉ (không block search)
        const GOONG_KEY = import.meta.env.VITE_GOONG_API_KEY;
        if (GOONG_KEY?.trim()) {
          axios.get(
            `https://rsapi.goong.io/Geocode?latlng=${lat},${lng}&api_key=${GOONG_KEY.trim()}`,
            { timeout: 3000 },
          ).then(r => {
            const addr = r.data?.results?.[0]?.formatted_address;
            if (addr) setSearchTerm(addr);
          }).catch(() => {});
        }
        fetchNearbyRooms(lat, lng, radius).finally(() => setIsLocating(false));
      },
      () => {
        // GPS bị từ chối — nếu có vị trí cũ thì dùng lại, không mở trang mới
        setIsLocating(false);
        if (confirmedLocation) {
          fetchNearbyRooms(confirmedLocation.lat, confirmedLocation.lng, radius);
        } else {
          setLocationToast("📍 Bật GPS để tìm phòng gần đây");
          setTimeout(() => setLocationToast(null), 3000);
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }, // maximumAge: 0 = luôn lấy tươi
    );
  };

  /**
   * Luồng tìm kiếm đa bộ lọc (Text, Giá, Loại phòng, Tiện ích).
   * Kết hợp gọi API tìm kiếm gốc và lọc tiếp ở client-side (với mảng tiện ích).
   */
  const handleSearch = async () =>
    enforceAuth(() => {
      const searchParams = {};
      if (searchTerm.trim()) searchParams.title = searchTerm.trim();
      if (filters.minPrice) searchParams.minPrice = filters.minPrice;
      if (filters.maxPrice) searchParams.maxPrice = filters.maxPrice;
      if (filters.roomType) searchParams.roomType = filters.roomType;

      const fetchSearch = async () => {
        try {
          const { items, meta } = await loadRooms({
            endpoint: "/api/posts",
            params: searchParams,
            page: 1,
          });

          let resultRooms = items;

          if (filters.amenities && filters.amenities.length > 0) {
            resultRooms = resultRooms.filter((room) => {
              const roomAmenities = new Set(
                room.amenities.map((a) =>
                  (a.type || a.name || a || "").toString().toLowerCase(),
                ),
              );

              return filters.amenities.every((selectedAmenity) =>
                roomAmenities.has(selectedAmenity.toLowerCase()),
              );
            });

            setRooms(resultRooms);
            setTotalResults(resultRooms.length);
            setHasMore(false);
            setTotalPages(1);
          } else {
            setTotalResults(meta.totalItems ?? resultRooms.length);
          }
        } catch (err) {
          console.error("Search API Error:", err);
          alert("Lỗi khi tìm kiếm, vui lòng thử lại!");
        }
      };

      fetchSearch();
    });

  if (isAdminView) {
    return <AdminApp onExit={() => setIsAdminView(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans overflow-x-hidden">
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
        onAdminClick={() => setIsAdminView(true)}
      />

      {showAuth && (
        <AuthPage mode={authMode} onBack={() => setShowAuth(false)} />
      )}
      {showVerification && (
        <VerificationModal onBack={() => setShowVerification(false)} />
      )}
      {showAddRoom && <AddRoomForm onBack={() => setShowAddRoom(false)} />}
      {editingPost && (
        <AddRoomForm
          existingPost={editingPost}
          onBack={() => {
            setEditingPost(null);
            setShowMyPosts(true);
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
        searchRadius={searchRadius}
        setSearchRadius={setSearchRadius}
        onRadiusChange={handleRadiusChange}
      />

      {/* Toast GPS nhỏ */}
      {locationToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-gray-900/90 text-white text-sm font-semibold rounded-full shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          {locationToast}
        </div>
      )}

      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-6 flex items-end justify-between border-b border-gray-200 pb-5 text-gray-900 relative">
          <div>
            <h2 className="text-3xl font-black tracking-tight mb-2">
              Gợi ý phòng nổi bật
            </h2>
            <div className="w-24 h-1.5 bg-linear-to-r from-rose-500 to-orange-400 rounded-full -mb-6"></div>
          </div>
        </div>

        {isLoadingRooms ? (
          <div className="flex flex-col justify-center items-center py-32">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-gray-200 border-t-rose-500 shadow-md"></div>
            <p className="mt-4 text-gray-500 font-medium animate-pulse">
              Đang tìm kiếm phòng trọ tốt nhất...
            </p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-24 text-center bg-white rounded-[2rem] border border-gray-100 shadow-xs">
            <div className="w-24 h-24 mb-6 bg-linear-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center shadow-inner">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Không tìm thấy phòng nào
            </h3>
            <p className="text-gray-500 max-w-md">
              Rất tiếc, không có bài đăng nào khớp với tìm kiếm của bạn. Vui
              lòng thử lại với các tiêu chí khác hoặc khu vực rộng hơn.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
        )}

        {(totalPages > 1 || hasMore) && !isLoadingRooms && rooms.length > 0 && (
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm font-medium text-gray-500">
              Trang {currentPage} / {totalPages} · Tổng {totalResults} bài
            </div>
            <div className="mt-3 flex items-center gap-1 sm:mt-0">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>

              {totalPages > 1 &&
                buildPageRange().map((pageNum, index) => {
                  if (typeof pageNum === "string") {
                    return (
                      <span
                        key={`${pageNum}-${index}`}
                        className="inline-flex h-9 min-w-8 items-center justify-center rounded-lg border border-transparent bg-transparent text-sm text-gray-400"
                      >
                        …
                      </span>
                    );
                  }

                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => handlePageChange(pageNum)}
                      className={`h-9 min-w-8 rounded-lg border px-3 text-sm font-semibold transition ${
                        pageNum === currentPage
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

              <button
                type="button"
                disabled={!hasMore}
                onClick={() => handlePageChange(currentPage + 1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

/**
 * Root Component của ứng dụng, chịu trách nhiệm bọc MainApp bên trong UserProvider
 * để quản lý và chia sẻ Context trạng thái tài khoản.
 */
export default function App() {
  return (
    <UserProvider>
      <MainApp />
    </UserProvider>
  );
}
