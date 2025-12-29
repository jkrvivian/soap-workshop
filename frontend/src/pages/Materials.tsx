import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Plus, AlertCircle } from 'lucide-react';

interface Material {
  id: number;
  name: string;
  category: string | null;
  unit: string;
  current_stock: number;
  low_stock_alert: number | null;
  note: string | null;
  created_at: string;
}

export default function Materials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMaterials() {
      try {
        // Call the Tauri command - returns Material[]
        const data = await invoke<Material[]>("list_materials");
        console.log("Loaded materials:", data);
        setMaterials(data);
      } catch (err) {
        console.error("Error loading materials:", err);
        setError(err as string);
      } finally {
        setLoading(false);
      }
    }

    loadMaterials();
  }, []);

  // 取得狀態顏色
  const getStatusStyle = (qty: number, safe: number | null) => {
    const safeStock = safe || 0;
    if (qty <= 0) return 'text-red-600 bg-red-50 border-red-200';
    if (qty < safeStock) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-stone-500 bg-stone-50 border-stone-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold">原料庫存管理</h1>
          <p className="text-stone-500">管理油脂、精油與添加物</p>
        </div>
        <button className="flex items-center gap-2 bg-soap-wood text-white px-6 py-2.5 rounded-lg shadow-sm hover:opacity-90">
          <Plus size={18} /> 新增原料 (Alt+N)
        </button>
      </div>

      {/* Loading/Error States */}
      {loading && <p className="text-center py-8">載入中...</p>}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={20} />
          <p className="text-red-600">錯誤: {error}</p>
        </div>
      )}

      {/* 列表表格 */}
      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-sm font-semibold">
                <th className="px-6 py-4">原料名稱</th>
                <th className="px-6 py-4">類型</th>
                <th className="px-6 py-4 text-right">現存量</th>
                <th className="px-6 py-4">單位</th>
                <th className="px-6 py-4">狀態</th>
                <th className="px-6 py-4 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {materials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-stone-500">
                    暫無原料資料
                  </td>
                </tr>
              ) : (
                materials.map((material) => (
                  <tr key={material.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 font-medium">{material.name}</td>
                    <td className="px-6 py-4 text-stone-500 text-sm">{material.category || '未分類'}</td>
                    <td className="px-6 py-4 text-right font-mono">{material.current_stock.toFixed(1)}</td>
                    <td className="px-6 py-4 text-sm text-stone-500">{material.unit}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs border ${getStatusStyle(material.current_stock, material.low_stock_alert)}`}>
                        {material.current_stock <= 0 ? '缺貨' : material.current_stock < (material.low_stock_alert || 0) ? '低於安全庫存' : '正常'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-soap-wood hover:underline text-sm px-2">編輯</button>
                      <button className="text-stone-400 hover:underline text-sm px-2">異動</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}