const AddRoomForm = ({ onBack }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xl p-6">
      <div className="w-full max-w-xl rounded-[2.5rem] bg-white p-10 shadow-2xl ring-1 ring-zinc-200">
        <h2 className="text-3xl font-black text-zinc-900 tracking-tight italic">
          ĐĂNG TIN PHÒNG MỚI
        </h2>
        <form className="mt-8 space-y-4 text-zinc-900">
          <input
            type="text"
            placeholder="Tên phòng trọ..."
            className="w-full rounded-2xl bg-zinc-100 p-4 outline-none focus:ring-2 focus:ring-rose-500/20"
          />
          <input
            type="text"
            placeholder="Địa chỉ..."
            className="w-full rounded-2xl bg-zinc-100 p-4 outline-none focus:ring-2 focus:ring-rose-500/20"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Giá (triệu)"
              className="w-full rounded-2xl bg-zinc-100 p-4 outline-none"
            />
            <input
              type="text"
              placeholder="Diện tích"
              className="w-full rounded-2xl bg-zinc-100 p-4 outline-none"
            />
          </div>
          <button
            type="button"
            className="w-full rounded-2xl bg-rose-600 py-4 font-black text-white shadow-xl shadow-rose-200 uppercase"
          >
            Hoàn tất đăng tin
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full text-sm font-bold text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Hủy bỏ
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddRoomForm;