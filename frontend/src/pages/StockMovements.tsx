import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Plus,
  Search,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  ChevronLeft,
  Save,
  AlertTriangle,
  Calendar,
} from "lucide-react";

import { Movement } from "../types/type";
import MovementRow from "../components/MovementRow";

type ViewMode = "list" | "create";

export default function StockMovements() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filter, setFilter] = useState<
    "all" | "today" | "custom" | "material" | "product"
  >("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadData = async () => {
    try {
      const data = await invoke<Movement[]>("list_movements");
      setMovements(data);
    } catch (e) {
      console.error("載入失敗", e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getFilteredMovements = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return movements.filter((m) => {
      const movementDate = new Date(m.created_at);
      const movementDay = new Date(
        movementDate.getFullYear(),
        movementDate.getMonth(),
        movementDate.getDate(),
      );

      switch (filter) {
        case "today":
          return movementDay.getTime() === today.getTime();

        case "custom":
          if (!startDate && !endDate) return true;

          const start = startDate ? new Date(startDate) : null;
          const end = endDate ? new Date(endDate) : null;

          if (start && end) {
            return movementDate >= start && movementDate <= end;
          } else if (start) {
            return movementDate >= start;
          } else if (end) {
            return movementDate <= end;
          }
          return true;

        case "material":
          return m.item_type === "material";

        case "product":
          return m.item_type === "product";

        case "all":
        default:
          return true;
      }
    });
  };

  const filteredMovements = getFilteredMovements();

  // --- 列表畫面 ---
  if (viewMode === "list") {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-soap-stone font-sans">
              庫存異動紀錄
            </h1>
            <p className="text-soap-accent">追蹤每一克原料與每一塊皂的去向</p>
          </div>
          <button
            onClick={() => setViewMode("create")}
            className="flex items-center gap-2 bg-soap-wood text-white px-6 py-2.5 rounded-lg shadow hover:bg-soap-stone transition-all"
          >
            <Plus size={18} /> 新增異動 (Alt+N)
          </button>
        </div>

        {/* 快捷篩選列 */}
        <div className="flex gap-4 overflow-x-auto pb-2 items-center">
          <button
            onClick={() => setFilter("all")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
              filter === "all"
                ? "bg-soap-wood text-white shadow-sm"
                : "bg-white border border-stone-200 text-soap-accent hover:border-soap-wood"
            }`}
          >
            <Filter size={14} /> 全部
          </button>
          <button
            onClick={() => setFilter("today")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
              filter === "today"
                ? "bg-soap-wood text-white shadow-sm"
                : "bg-white border border-stone-200 text-soap-accent hover:border-soap-wood"
            }`}
          >
            今日
          </button>
          <button
            onClick={() => setFilter("material")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
              filter === "material"
                ? "bg-soap-wood text-white shadow-sm"
                : "bg-white border border-stone-200 text-soap-accent hover:border-soap-wood"
            }`}
          >
            原料類
          </button>
          <button
            onClick={() => setFilter("product")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
              filter === "product"
                ? "bg-soap-wood text-white shadow-sm"
                : "bg-white border border-stone-200 text-soap-accent hover:border-soap-wood"
            }`}
          >
            成品類
          </button>

          {/* Date Range Picker Toggle */}
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
              filter === "custom"
                ? "bg-soap-wood text-white shadow-sm"
                : "bg-white border border-stone-200 text-soap-accent hover:border-soap-wood"
            }`}
          >
            <Calendar size={14} /> 自訂日期
          </button>
        </div>

        {/* Date Range Inputs (Collapsible) */}
        {showDatePicker && (
          <div className="flex items-center gap-3 p-4 bg-stone-50 border border-stone-200 rounded-xl">
            <label className="text-sm font-bold text-soap-stone whitespace-nowrap">
              日期範圍：
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setFilter("custom");
              }}
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-soap-wood focus:border-soap-wood"
              placeholder="開始日期"
            />
            <span className="text-stone-400">至</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setFilter("custom");
              }}
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-soap-wood focus:border-soap-wood"
              placeholder="結束日期"
            />
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setFilter("all");
                setShowDatePicker(false);
              }}
              className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              清除
            </button>
          </div>
        )}

        {/* 異動列表 */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-wider font-bold text-stone-500">
                <th className="px-6 py-4">時間</th>
                <th className="px-6 py-4">類型</th>
                <th className="px-6 py-4">項目名稱</th>
                <th className="px-6 py-4 text-right">數量</th>
                <th className="px-6 py-4">關聯批次</th>
                <th className="px-6 py-4">備註/原因</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-stone-400"
                  >
                    尚無異動紀錄
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => <MovementRow m={m} key={m.id} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- 新增異動表單 ---
  return (
    <MovementEntryForm
      onCancel={() => setViewMode("list")}
      onFinish={() => {
        setViewMode("list");
        loadData();
      }}
    />
  );
}

function MovementEntryForm({
  onCancel,
  onFinish,
}: {
  onCancel: () => void;
  onFinish: () => void;
}) {
  const [itemType, setItemType] = useState<"material" | "product">("material");
  const [moveType, setMoveType] = useState<"in" | "out" | "adj">("in");
  const [searchQuery, setSearchQuery] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [relatedBatch, setRelatedBatch] = useState("");
  const [note, setNote] = useState("");
  // const [searchQuery, setBatchSearchQuery] = useState('');
  // const [selectedItem, setBatchSelectedItem] = useState<any>(null);  const [items, setItems] = useState<any[]>([]);
  // const [filteredItems, setBatchFilteredItems] = useState<any[]>([]);
  // const [loadingItems, setBatchLoadingItems] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      setLoadingItems(true);
      try {
        const command =
          itemType === "material" ? "list_materials" : "list_products";
        const data = await invoke<any[]>(command);
        setItems(data || []);
        setFilteredItems([]);
      } catch (e) {
        console.error("Failed to load items", e);
        setItems([]);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItems();
  }, [itemType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      alert("請選擇項目");
      return;
    }
    try {
      await invoke("add_inventory", {
        req: {
          item_id: selectedItem.id,
          item_type: itemType,
          change_amount: quantity,
          action_type: moveType,
          note: note ?? null,
        },
      });
      onFinish();
    } catch (err) {
      alert(`異動失敗: ${err}`);
    }
  };

  const searchOnInput = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredItems([]);
      return;
    }

    const filtered = items.filter((item) => item.name.includes(query));
    setFilteredItems(filtered);
  };

  useEffect(() => {
    const fetchItems = async () => {
      setLoadingItems(true);
      try {
        const command =
          itemType === "material" ? "list_materials" : "list_products";
        const data = await invoke<any[]>(command);
        setItems(data);
      } catch (e) {
        console.error("Failed to load items", e);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItems();
  }, [itemType]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={onCancel}
        className="flex items-center gap-1 text-soap-accent hover:text-soap-stone font-medium"
      >
        <ChevronLeft size={20} /> 返回紀錄列表 (Esc)
      </button>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden"
      >
        <div className="px-8 py-6 bg-soap-beige border-b border-stone-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-soap-stone uppercase tracking-tight">
            ⚖️ 建立庫存異動
          </h2>
          <div className="flex bg-stone-200/50 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setItemType("material")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${itemType === "material" ? "bg-white text-soap-wood shadow-sm" : "text-stone-400"}`}
            >
              原料
            </button>
            <button
              type="button"
              onClick={() => setItemType("product")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${itemType === "product" ? "bg-white text-soap-wood shadow-sm" : "text-stone-400"}`}
            >
              成品
            </button>
          </div>
        </div>

        <div className="p-10 space-y-8 font-sans">
          {/* Select action type */}
          <div className="grid grid-cols-3 gap-3">
            {(["in", "out", "adj"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setMoveType(t)}
                className={`py-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  moveType === t
                    ? "border-soap-wood bg-stone-50 text-soap-wood ring-4 ring-soap-wood/5"
                    : "border-stone-100 text-stone-400 hover:border-stone-200"
                }`}
              >
                {t === "in" && (
                  <>
                    <ArrowUpCircle size={24} />{" "}
                    <span className="font-bold">入庫 / 進貨</span>
                  </>
                )}
                {t === "out" && (
                  <>
                    <ArrowDownCircle size={24} />{" "}
                    <span className="font-bold">出庫 / 領用</span>
                  </>
                )}
                {t === "adj" && (
                  <>
                    <RefreshCw size={24} />{" "}
                    <span className="font-bold">庫存校準</span>
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Search for item */}
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-bold text-soap-stone mb-2">
                搜尋項目名稱 (油脂、精油、或肥皂名稱)
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-3.5 text-stone-400"
                  size={18}
                />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border-stone-200 rounded-xl focus:ring-soap-wood"
                  placeholder="輸入名稱關鍵字..."
                  value={searchQuery}
                  onChange={(e) => searchOnInput(e.target.value)}
                  autoFocus
                />
              </div>
              {/* list the possible items */}
              {searchQuery && (
                <div className="mt-2 border border-stone-100 rounded-lg bg-white overflow-hidden">
                  {loadingItems ? (
                    <div className="p-4 text-center text-xs text-stone-400">
                      載入中...
                    </div>
                  ) : filteredItems.length > 0 ? (
                    <ul className="divide-y divide-stone-100 max-h-48 overflow-y-auto">
                      {filteredItems.map((item) => (
                        <li
                          key={item.id}
                          onClick={() => {
                            setSelectedItem(item);
                            setSearchQuery(item.name);
                            setFilteredItems([]);
                          }}
                          className={`px-4 py-3 cursor-pointer hover:bg-soap-beige transition-colors text-sm font-medium ${
                            selectedItem?.id === item.id
                              ? "bg-stone-100 text-soap-wood font-bold"
                              : "text-soap-stone"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span>{item.name}</span>
                            <span className="text-xs text-stone-400 font-normal">
                              {item.quantity} {item.unit || "kg"}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-xs text-stone-400">
                      找不到相符的項目
                    </div>
                  )}
                </div>
              )}

              {selectedItem && (
                <div className="mt-4 p-4 bg-soap-beige rounded-lg border border-soap-wood/20">
                  <p className="text-xs font-bold text-soap-accent mb-2">
                    已選擇項目
                  </p>
                  <div className="flex justify-between items-center text-sm font-bold text-soap-stone">
                    <span>{selectedItem.name}</span>
                    <span className="text-soap-accent">
                      庫存：{selectedItem.current_stock}{" "}
                      {selectedItem.unit || "kg"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-8 pt-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-soap-stone">
                  異動數量
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full text-3xl font-mono font-bold py-3 bg-transparent border-b-4 border-stone-200 focus:border-soap-wood outline-none text-soap-stone placeholder-stone-200"
                    placeholder="0.00"
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                  <span className="absolute right-0 bottom-4 font-bold text-soap-accent">
                    {selectedItem?.unit || "單位"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-soap-stone">
                  關聯批次 (可選)
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute left-3 top-3.5 text-stone-300"
                    size={18}
                  />
                  <input
                    type="text"
                    className="w-full pl-10 py-3 bg-stone-50 border-stone-200 rounded-xl"
                    placeholder="例如：#20241220A"
                    value={relatedBatch}
                    onChange={(e) => setRelatedBatch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-soap-stone">
                異動原因或來源/去向
              </label>
              <textarea
                rows={2}
                className="w-full bg-stone-50 border-stone-200 rounded-xl px-4 py-3"
                placeholder="例如：向 XX 原料行購買、某某客戶訂購、製作某批號皂使用..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-soap-wood text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:opacity-90 flex justify-center items-center gap-2 active:scale-95 transition-all"
            >
              <Save size={20} /> 確認提交紀錄 (Enter)
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-10 py-4 border border-stone-200 rounded-2xl text-soap-accent font-bold hover:bg-stone-50"
            >
              取消
            </button>
          </div>
        </div>
      </form>

      {/* Notice */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-5 flex gap-4">
        <AlertTriangle className="text-orange-500 shrink-0" size={24} />
        <div className="text-sm text-orange-700">
          <p className="font-bold mb-1">溫馨提醒：</p>
          <ul className="list-disc list-inside space-y-0.5 opacity-80 font-medium">
            <li>如果是「校準」，系統會直接覆蓋該項目的現存總量。</li>
            <li>出庫數量若大於現存量，系統將標記為異常。</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
