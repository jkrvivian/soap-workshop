import { useState, useEffect, useCallback } from "react";
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

import {Movement} from "../types/type";
import MovementRow from "../components/MovementRow";

// 定義簡化的資料結構
interface LowStockItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  level: "critical" | "warning";
}

export default function Dashboard() {
  const [materialCount, setMaterialCount] = useState<number>(0);
  const [productCount, setProductCount] = useState<number>(0);
  const [recentMovements, setRecentMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  // 這裡未來會接 Tauri Invoke 抓取真實數據
  const [stats] = useState({
    material_count: 24,
    product_count: 156,
  });


  const getMaterialandProductNumber = useCallback(async () => {
    setLoading(true);
    try {
      const product = await invoke<number>("count_products");
      setProductCount(product);
      const material = await invoke<number>("count_materials");
      setMaterialCount(material);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  }, []);

  const getRecentInventoryLogs = useCallback(async () => {
    setLoading(true);
    try {
      const movements = await invoke<Movement[]>("list_recent_movements");
      setRecentMovements(movements);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    getMaterialandProductNumber();
    getRecentInventoryLogs();
  }, [getMaterialandProductNumber, getRecentInventoryLogs]);


  return (
    <div className="space-y-10 pb-12">
      {/* 歡迎語與日期 */}
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

      {/* 數據小卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<Beaker className="text-soap-wood group-hover:text-white" />}
          label="原料種類"
          value={materialCount}
          unit="種"
          onClick={() => navigate("/materials")}
        />
        <StatCard
          icon={<Package className="text-soap-wood group-hover:text-white" />}
          label="成品總量"
          value={productCount}
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
              <LowStockRow
                name="初榨橄欖油"
                qty={1.2}
                unit="kg"
                level="critical"
              />
              <LowStockRow
                name="甜杏仁油"
                qty={0.5}
                unit="L"
                level="critical"
              />
              <LowStockRow
                name="薰衣草精油"
                qty={80}
                unit="ml"
                level="warning"
              />
              <LowStockRow
                name="氫氧化鈉"
                qty={2.1}
                unit="kg"
                level="warning"
              />
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
                {recentMovements.length > 0 ? recentMovements.map((movement) => (
                  <MovementRow
                    key={movement.id}
                    m={movement}
                  />
                )) : (
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
                className="text-xs font-bold text-soap-accent hover:text-soap-stone"
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

// --- 子組件：統計卡片 ---
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

// --- 子組件：低庫存列 ---
function LowStockRow({ name, qty, unit, level }: LowStockItem) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-stone-50 transition-colors">
      <div className="flex items-center gap-3">
        <div
          className={`w-2 h-2 rounded-full ${level === "critical" ? "bg-red-500 animate-pulse" : "bg-orange-400"}`}
        />
        <span className="font-bold text-soap-stone">{name}</span>
      </div>
      <div className="text-right">
        <span
          className={`font-mono font-bold ${level === "critical" ? "text-red-600" : "text-orange-600"}`}
        >
          僅剩 {qty}
        </span>
        <span className="text-xs text-soap-accent ml-1">{unit}</span>
      </div>
    </div>
  );
}

