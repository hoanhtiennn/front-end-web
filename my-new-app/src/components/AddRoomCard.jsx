const AddRoomCard = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-zinc-200 bg-white p-8 transition-all duration-300 hover:border-rose-500 hover:bg-rose-50/30 cursor-pointer min-h-[400px]"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 transition-all duration-300 group-hover:bg-rose-600 group-hover:text-white group-hover:rotate-90">
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

      <div className="mt-6 text-center">
        <h3 className="text-xl font-black text-zinc-900 tracking-tight">
          Đăng tin mới
        </h3>
        <p className="mt-2 text-sm font-medium text-zinc-400 group-hover:text-zinc-500">
          Chia sẻ không gian của bạn <br /> với mọi người ngay hôm nay.
        </p>
      </div>

      <div className="absolute bottom-4 right-4 text-zinc-100 group-hover:text-rose-100 transition-colors">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round opacity-20"
        >
          <path d="m3 21 1.9-1.9a2.44 2.44 0 0 0 0-3.44l-1.9-1.9"></path>
          <path d="m21 3-1.9 1.9a2.44 2.44 0 0 0 0 3.44l1.9 1.9"></path>
        </svg>
      </div>
    </div>
  );
};

export default AddRoomCard;