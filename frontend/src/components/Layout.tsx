import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Beaker,
  Package,
  ArrowLeftRight,
  Layers,
  Users,
  Settings,
} from "lucide-react";

const navItems = [
  { to: "/", label: "儀表板", icon: <LayoutDashboard size={20} /> },
  { to: "/materials", label: "原料管理", icon: <Beaker size={20} /> },
  { to: "/products", label: "產品管理", icon: <Package size={20} /> },
  { to: "/movements", label: "庫存異動", icon: <ArrowLeftRight size={20} /> },
  // { to: "/batches", label: "生產批次", icon: <Layers size={20} /> },
  // { to: "/customers", label: "客戶管理", icon: <Users size={20} /> },
  { to: "/settings", label: "設定", icon: <Settings size={20} /> },
];

export default function Layout() {
  return (
    <div className="flex h-screen w-full bg-soap-beige text-soap-stone overflow-hidden">
      {/* 左側功能列 */}
      <aside className="w-64 bg-white border-r border-stone-200 flex flex-col">
        <div className="p-6 text-xl font-bold border-b border-stone-100 flex items-center gap-2">
          <div className="w-8 h-8 bg-soap-wood rounded-full" />
          工作室管理
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-soap-wood text-white shadow-md"
                    : "hover:bg-stone-100 text-soap-stone"
                }`
              }
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* 主畫面 */}
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
