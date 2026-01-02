import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Plus,
  AlertCircle,
  Edit2,
  ArrowLeftRight,
  Save,
  ChevronLeft,
  AlertTriangle,
  Trash2,
} from "lucide-react";

import {
  Product,
  MovementActionType,
  ViewMode,
  PRODUCT_UNIT_LIST,
} from "../types/type";
import {
  PRODUCT_FILTERS,
  ProductFilterType,
  PRODUCT_CATEGORIES,
} from "../types/filters";
import { FilterButton } from "../components/FilterButton";

export default function Products() {
  // --- state management ---
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ProductFilterType>("all");

  // UI mode switching
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedItem, setSelectedItem] = useState<Product | null>(null);

  // --- data loading ---
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invoke<Product[]>("list_products");
      setProducts(data);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const getFilteredProducts = () => {
    return products.filter((p) => {
      if (filter === "all") return true;
      return p.category === PRODUCT_FILTERS[filter].label;
    });
  };

  const filteredProducts = getFilteredProducts();

  const deleteProduct = useCallback(
    async (productId: number) => {
      setLoading(true);
      try {
        await invoke("remove_product", { product: { id: productId } });
        await loadProducts();
      } catch (err) {
        setError(err as string);
      } finally {
        setLoading(false);
      }
    },
    [loadProducts],
  );

  // --- keyboard shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "n") {
        e.preventDefault();
        setSelectedItem(null);
        setViewMode("add");
      }
      if (e.key === "Escape") {
        setViewMode("list");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getStatusStyle = (qty: number) => {
    if (qty <= 0) return "text-red-600 bg-red-50 border-red-200 font-bold";
    if (qty < 10)
      return "text-orange-600 bg-orange-50 border-orange-200 font-bold";
    return "text-stone-500 bg-stone-50 border-stone-200";
  };

  if (viewMode === "list") {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-soap-stone">產品管理</h1>
            <p className="text-soap-accent">管理成品庫存</p>
          </div>
          <button
            onClick={() => {
              setSelectedItem(null);
              setViewMode("add");
            }}
            className="flex items-center gap-2 bg-soap-wood text-white px-6 py-2.5 rounded-lg shadow hover:bg-soap-stone transition-all"
          >
            <Plus size={18} /> 新增產品 (Alt+N)
          </button>
        </div>

        {/* filters */}
        <div className="flex gap-4 overflow-x-auto pb-2 items-center">
          {Object.values(PRODUCT_FILTERS).map((filterConfig) => (
            <FilterButton
              key={filterConfig.key}
              label={filterConfig.label}
              isActive={filter === filterConfig.key}
              onClick={() => setFilter(filterConfig.key as ProductFilterType)}
            />
          ))}
        </div>

        {loading && <p className="text-center py-8">載入中...</p>}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-red-600" size={20} />
            <p className="text-red-600 font-medium">錯誤: {error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-wider font-bold text-stone-500">
                  <th className="px-6 py-4">產品名稱</th>
                  <th className="px-6 py-4">類型</th>
                  <th className="px-6 py-4 text-right">現存量</th>
                  <th className="px-6 py-4">單位</th>
                  <th className="px-6 py-4">狀態</th>
                  <th className="px-6 py-4 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-stone-400"
                    >
                      暫無產品資料
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-stone-50 transition-colors group"
                    >
                      <td className="px-6 py-4 font-semibold text-soap-stone">
                        {m.name}
                      </td>
                      <td className="px-6 py-4 text-soap-accent text-sm">
                        {m.category ?? "未分類"}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold">
                        {m.current_stock}
                      </td>
                      <td className="px-6 py-4 text-sm text-soap-accent">
                        {m.unit}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs border ${getStatusStyle(m.current_stock)}`}
                        >
                          {m.current_stock <= 0
                            ? "缺貨"
                            : m.current_stock < 10
                              ? "低庫存"
                              : "正常"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedItem(m);
                            setViewMode("movement");
                          }}
                          className="p-2 hover:bg-soap-beige rounded-full text-soap-wood transition-colors"
                          title="紀錄異動"
                        >
                          <ArrowLeftRight size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(m);
                            setViewMode("edit");
                          }}
                          className="p-2 hover:bg-soap-beige rounded-full text-soap-accent transition-colors"
                          title="編輯"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(m);
                            deleteProduct(m.id);
                          }}
                          className="p-2 hover:bg-soap-beige rounded-full text-soap-accent transition-colors"
                          title="刪除"
                        >
                          <Trash2 size={16} />
                        </button>
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => setViewMode("list")}
        className="flex items-center gap-1 text-soap-accent hover:text-soap-stone transition-colors font-medium"
      >
        <ChevronLeft size={20} /> 返回列表 (Esc)
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="px-8 py-6 bg-stone-50 border-b border-stone-200">
          <h2 className="text-xl font-bold text-soap-stone">
            {viewMode === "add" && "✨ 新增產品"}
            {viewMode === "edit" && `✏️ 編輯: ${selectedItem?.name}`}
            {viewMode === "movement" && `⚖️ 庫存異動: ${selectedItem?.name}`}
          </h2>
        </div>

        <div className="p-8">
          {viewMode === "movement" ? (
            <MovementForm
              item={selectedItem!}
              onFinish={() => {
                setViewMode("list");
                loadProducts();
              }}
            />
          ) : (
            <CreateEditForm
              key={viewMode === "add" ? "add" : selectedItem?.id}
              viewMode={viewMode}
              item={selectedItem!}
              onFinish={() => {
                setViewMode("list");
                loadProducts();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function MovementForm({
  item,
  onFinish,
}: {
  item: Product;
  onFinish: () => void;
}) {
  const [mType, setMType] = useState<MovementActionType>("in");
  const [qty, setQty] = useState<number>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await invoke("add_product_inventory", {
        req: {
          item_id: item.id,
          item_type: "product",
          change_amount: qty,
          action_type: mType,
          note: item.note,
        },
      });
      onFinish();
    } catch (err) {
      alert(`異動失敗: ${err}`);
    }
  };

  const isInvalid = mType === "out" && qty > item.current_stock;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex bg-stone-100 p-1.5 rounded-xl">
        {(["in", "out", "adj"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setMType(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${mType === t ? "bg-white shadow-sm text-soap-wood" : "text-stone-400 hover:text-stone-600"}`}
          >
            {t === "in" && "入庫 (+)"} {t === "out" && "出庫 (-)"}{" "}
            {t === "adj" && "校準"}
          </button>
        ))}
      </div>

      <div className="space-y-2 text-center">
        <label className="block text-sm font-bold text-soap-accent uppercase tracking-widest">
          異動數量 ({item.unit})
        </label>
        <input
          type="number"
          step="1"
          required
          value={qty ?? ""}
          onChange={(e) => setQty(Number(e.target.value))}
          className={`w-full text-center text-4xl font-mono font-bold bg-transparent border border-stone-200 rounded-lg focus:ring-0 ${isInvalid ? "text-red-500" : "text-soap-stone"}`}
          placeholder="0"
          autoFocus
        />
        {isInvalid && (
          <p className="text-red-500 text-sm font-bold flex items-center justify-center gap-1 italic">
            <AlertTriangle size={14} /> 警告：出庫數量超過現有庫存！
          </p>
        )}
      </div>

      <div className="pt-4 space-y-3">
        <button
          disabled={isInvalid || qty <= 0}
          className="w-full bg-soap-stone text-white py-4 rounded-2xl font-bold shadow-lg hover:opacity-90 disabled:opacity-20 disabled:grayscale transition-all text-lg"
        >
          確認並更新庫存
        </button>
      </div>
    </form>
  );
}

function CreateEditForm({
  viewMode,
  item,
  onFinish,
}: {
  viewMode: "add" | "edit";
  item: Product;
  onFinish: () => void;
}) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Extract form data
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      if (viewMode === "add") {
        await invoke("add_product", {
          product: {
            name: String(payload.name),
            category: String(payload.category),
            unit: String(payload.unit),
            current_stock: 0,
            note: payload.note ? String(payload.note) : null,
          },
        });
      } else if (viewMode === "edit") {
        await invoke("update_product", {
          id: item?.id,
          req: {
            name: String(payload.name),
            category: String(payload.category),
            note: payload.note ? String(payload.note) : null,
          },
        });
      }

      onFinish();
    } catch (err) {
      alert(`異動失敗: ${err}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-2">
          <label className="block text-sm font-bold text-soap-stone mb-2">
            產品名稱
          </label>
          <input
            name="name"
            type="text"
            required
            defaultValue={item?.name ?? ""}
            className="w-full border border-stone-200 rounded-lg focus:ring-soap-wood focus:border-soap-wood"
            autoFocus
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-bold text-soap-stone mb-2">
            產品分類
          </label>
          <select
            name="category"
            defaultValue={item?.category ?? "洗顏"}
            className="w-full border border-stone-200 rounded-lg"
          >
            {Object.values(PRODUCT_CATEGORIES).map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-soap-stone mb-2">
            單位
          </label>
          <select
            name="unit"
            defaultValue={item?.unit ?? "個"}
            className={`w-full border border-stone-200 rounded-lg`}
          >
            {Object.values(PRODUCT_UNIT_LIST).map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-soap-stone mb-2">
            當前庫存
          </label>
          <input
            name="current_stock"
            type="number"
            defaultValue={item?.current_stock ?? 0}
            disabled
            className="w-full border border-stone-200 rounded-lg opacity-50 cursor-not-allowed"
          />
          <p className="text-xs text-stone-400 mt-1">通過異動功能更新</p>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-bold text-soap-stone mb-2">
            備註
          </label>
          <textarea
            name="note"
            rows={3}
            defaultValue={item?.note ?? ""}
            className="w-full border border-stone-200 rounded-lg"
            placeholder="記錄任何備註信息..."
          />
        </div>
      </div>
      <div className="pt-4 flex gap-3">
        <button
          type="submit"
          className="flex-1 bg-soap-wood text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-soap-stone shadow-md transition-all"
        >
          <Save size={18} /> 儲存資料
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="px-8 py-3 border border-stone-200 rounded-xl text-soap-accent hover:bg-stone-50 font-medium"
        >
          取消
        </button>
      </div>
    </form>
  );
}
