import React from "react";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  FileText,
  Package,
  Wrench,
  BarChart2,
  LogOut,
} from "lucide-react";

export default function AdminLayout({ activeTab, setActiveTab, onExit, children }) {
  const navItems = [
    { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { id: "users", label: "Người dùng", icon: Users },
    { id: "verifications", label: "Xác minh CCCD", icon: ShieldCheck },
    { id: "posts", label: "Bài đăng", icon: FileText },
    { id: "plans", label: "Gói dịch vụ", icon: Package },
    { id: "amenities", label: "Tiện ích", icon: Wrench },
    { id: "stats", label: "Thống kê", icon: BarChart2 },
  ];

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Sidebar - Dark theme but minimalist */}
      <aside className="w-64 bg-gray-950 text-white flex flex-col h-full border-r border-gray-800">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold tracking-wider uppercase flex items-center gap-2">
            <span className="w-6 h-6 bg-white text-gray-950 flex items-center justify-center font-black rounded-sm">
              T
            </span>
            TroTot Admin
          </h1>
        </div>

        <nav className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white text-black"
                    : "text-gray-400 hover:bg-gray-900 hover:text-white"
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={onExit}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-900 rounded-md transition-colors"
          >
            <LogOut size={18} />
            Thoát Admin
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden shadow-[-10px_0_30px_rgba(0,0,0,0.03)] z-10 relative">
        <header className="h-16 flex items-center px-8 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold capitalize text-black">
            {navItems.find((n) => n.id === activeTab)?.label || "Admin"}
          </h2>
          <div className="ml-auto flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold border border-gray-200">
              AD
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
          {children}
        </div>
      </main>
    </div>
  );
}
