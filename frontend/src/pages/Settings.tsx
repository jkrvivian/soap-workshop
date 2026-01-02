import { invoke } from "@tauri-apps/api/core";
import {
  Settings as SettingsIcon,
  Database,
  Download,
  Upload,
  Trash2,
} from "lucide-react";

export default function Settings() {
  const handleExportDB = async () => {
    try {
      const path = await invoke<string>("export_database");
      console.log(`備份成功！檔案已存至：${path}`);
    } catch (e) {
      console.log(`備份失敗: ${e}`);
    }
  };

  const handleImportDB = async () => {
    try {
      const path = await invoke<string>("import_database");
      console.log(`匯入資料庫檔 ${path} 成功！`);
    } catch (e) {
      console.log(`匯入失敗: ${e}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-soap-stone flex items-center gap-2">
          <SettingsIcon size={24} /> 系統設定
        </h1>
        <p className="text-soap-accent">調整工作室系統的使用偏好與資料安全</p>
      </div>

      {/* 右側：實際設定內容 */}
      <div className="space-y-6">
        {/* 資料維護區塊 */}
        <section className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 space-y-6 font-sans">
          <div className="flex items-center gap-2 text-soap-stone font-bold border-b border-stone-100 pb-4">
            <Database size={18} className="text-soap-wood" /> 資料維護 (本地)
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleExportDB}
              className="p-4 border-2 border-stone-100 rounded-2xl flex flex-col items-center gap-3 hover:border-soap-wood hover:bg-stone-50 transition-all group"
            >
              <div className="p-3 bg-soap-beige rounded-full text-soap-wood group-hover:scale-110 transition-transform">
                <Download size={24} />
              </div>
              <div className="text-center">
                <p className="font-bold text-soap-stone">備份資料庫</p>
                <p className="text-[14px] text-soap-accent">匯出為.db 檔案</p>
              </div>
            </button>

            <button
              onClick={handleImportDB}
              className="p-4 border-2 border-stone-100 rounded-2xl flex flex-col items-center gap-3 hover:border-soap-wood hover:bg-stone-50 transition-all group"
            >
              <div className="p-3 bg-soap-beige rounded-full text-soap-wood group-hover:scale-110 transition-transform">
                <Upload size={24} />
              </div>
              <div className="text-center">
                <p className="font-bold text-soap-stone">匯入資料</p>
                <p className="text-[10px] text-soap-accent">從備份檔還原</p>
              </div>
            </button>
          </div>

          <div className="p-4 bg-red-50 rounded-xl flex items-start gap-3 border border-red-100">
            <Trash2 className="text-red-500 shrink-0 mt-1" size={18} />
            <div>
              <p className="text-sm font-bold text-red-700">危險區域</p>
              <p className="text-xs text-red-600 opacity-80">
                清除所有本地資料並重置系統，此動作無法復原。
              </p>
              <button className="mt-2 text-xs font-bold text-red-700 underline">
                立即清除
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
