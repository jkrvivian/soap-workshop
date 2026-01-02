import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import {
  AlertTriangle,
  Activity,
  Package,
  ArrowUpRight,
  ChevronRight,
  Beaker,
} from "lucide-react";

import { Movement, Material, Product } from "../types/type";
import MovementRow from "../components/MovementRow";

export default function Dashboard() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recentMovements, setRecentMovements] = useState<Movement[]>([]);

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const materials = await invoke<Material[]>("list_materials");
      setMaterials(materials);
      const products = await invoke<Product[]>("list_products");
      setProducts(products);
      const movements = await invoke<Movement[]>("list_recent_movements");
      setRecentMovements(movements);
    } catch (e) {
      console.error("載入失敗", e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getIndangerMaterials = () => {
    return materials.filter((m) => {
      return m.low_stock_alert !== null && m.current_stock <= m.low_stock_alert;
    });
  };

  const filteredMaterials = getIndangerMaterials();

  return (
    <div className="space-y-10 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-soap-stone font-sans tracking-tight">
            工作室概況
          </h1>
          <p className="text-soap-accent font-medium mt-1">
            今天是{" "}
            {new Date().toLocaleDateString("zh-TW", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/movements")}
            className="flex items-center gap-2 bg-white border border-stone-200 px-5 py-2.5 rounded-xl text-sm font-bold text-soap-stone shadow-sm hover:bg-stone-50 transition-all"
          >
            <Activity size={16} /> 快速紀錄異動
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<Beaker className="text-soap-wood group-hover:text-white" />}
          label="原料種類"
          value={materials.length}
          unit="種"
          onClick={() => navigate("/materials")}
        />
        <StatCard
          icon={<Package className="text-soap-wood group-hover:text-white" />}
          label="成品總量"
          value={products.length}
          unit="塊"
          onClick={() => navigate("/products")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-bold text-soap-stone flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={20} /> 低庫存提醒
            </h2>
            <button
              onClick={() => navigate("/materials")}
              className="text-xs font-bold text-soap-wood hover:underline flex items-center"
            >
              查看全部 <ChevronRight size={14} />
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="divide-y divide-stone-100">
              <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-stone-50 font-medium">
                  {filteredMaterials.length > 0 ? (
                    filteredMaterials.map((material) => (
                      <LowStockRow m={material} key={material.id} />
                    ))
                  ) : (
                    <tr>
                      <td className="px-6 py-12 text-center text-stone-400">
                        🎊 恭喜！目前沒有低庫存的原料！🎊
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-bold text-soap-stone flex items-center gap-2">
              <Activity className="text-soap-accent" size={20} /> 最近庫存異動
            </h2>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-stone-50 font-medium">
                {recentMovements.length > 0 ? (
                  recentMovements.map((movement) => (
                    <MovementRow key={movement.id} m={movement} />
                  ))
                ) : (
                  <tr>
                    <td className="px-6 py-12 text-center text-stone-400">
                      暫無異動紀錄
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="bg-stone-50 p-3 text-center">
              <button
                onClick={() => navigate("/movements")}
                className="text-sm font-bold text-soap-accent hover:text-soap-stone"
              >
                查看完整歷史紀錄
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, unit, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md hover:border-soap-wood cursor-pointer transition-all group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-soap-beige rounded-xl group-hover:bg-soap-wood group-hover:text-white transition-colors">
          {icon}
        </div>
        <ArrowUpRight
          size={18}
          className="text-stone-300 group-hover:text-soap-wood"
        />
      </div>
      <div>
        <p className="text-sm font-bold text-soap-accent uppercase tracking-wider">
          {label}
        </p>
        <p className="text-3xl font-black text-soap-stone mt-1">
          {value}{" "}
          <span className="text-sm font-bold text-soap-accent">{unit}</span>
        </p>
      </div>
    </div>
  );
}

function LowStockRow({ m }: { m: Material }) {
  return (
    <tr className="flex items-center justify-between p-4 hover:bg-stone-50 transition-colors">
      <td className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full "bg-red-500 animate-pulse"`} />
        <span className="font-bold text-soap-stone">{m.name}</span>
      </td>
      <td className="text-left">
        <span className="font-mono font-bold"> 應備有 {m.low_stock_alert}</span>
        <span className="text-ms ml-1 font-bold">{m.unit}</span>
      </td>
      <td className="text-right text-red-600">
        <span className="font-mono font-bold">僅剩 {m.current_stock}</span>
        <span className="text-ms ml-1 font-bold">{m.unit}</span>
      </td>
    </tr>
  );
}
