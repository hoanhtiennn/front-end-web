const AddRoomCard = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col items-center justify-center overflow-hidden rounded border-2 border-dashed border-gray-300 bg-white p-8 hover:bg-gray-50 cursor-pointer min-h-[300px]"
    >
      <div className="flex items-center justify-center rounded bg-gray-200 text-gray-500 p-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>

      <div className="mt-4 text-center">
        <h3 className="text-lg font-bold text-gray-800">
          Đăng tin mới
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Chia sẻ không gian của bạn <br /> với mọi người ngay hôm nay.
        </p>
      </div>
    </div>
  );
};

export default AddRoomCard;