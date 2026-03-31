import { useUser } from "../contexts/UserContext";

const Navbar = ({ onAuthClick, onEditProfileClick }) => {
  const { user, logout } = useUser();
  return (
    <nav className="bg-white border-b border-gray-300 px-8 py-4 flex justify-between items-center">
      <div className="text-xl font-bold text-blue-600 cursor-pointer">
        PRO.STAY
      </div>
      <div className="flex items-center gap-4">
        {!user ? (
          <div>
            <button
              onClick={() => onAuthClick("LOGIN")}
              className="text-blue-600 mr-4 hover:underline"
            >
              Đăng nhập
            </button>
            <button
              onClick={() => onAuthClick("REGISTER")}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Đăng ký
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex flex-col text-right">
              <span className="font-bold text-gray-800">
                {user.name}
              </span>
              <span className="text-xs text-gray-500">
                ({user.role})
              </span>
            </div>
            
            {user.avatarUrl && (
              <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border border-gray-300 object-cover" />
            )}
            
            <div className="flex gap-3 ml-2 border-l border-gray-300 pl-4">
              <button
                onClick={onEditProfileClick}
                className="text-blue-600 text-sm hover:underline"
              >
                Sửa hồ sơ
              </button>
              <button
                onClick={logout}
                className="text-red-500 text-sm hover:underline"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
