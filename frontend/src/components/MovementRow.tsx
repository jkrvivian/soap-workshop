import { Movement } from "../types/type";
import { ArrowDownCircle, ArrowUpCircle, RefreshCw } from "lucide-react";

export default function MovementRow({ m }: { m: Movement }) {
  return (
    <tr className="hover:bg-stone-50 transition-colors">
      <td className="px-6 py-4 text-xs text-soap-accent font-mono">
        {new Date(m.created_at).toLocaleString("zh-TW", {
          hour12: false,
        })}
      </td>
      <td className="px-6 py-4">
        {m.action_type === "in" && (
          <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-md w-fit text-xs border border-green-100">
            <ArrowUpCircle size={12} /> 入庫
          </span>
        )}
        {m.action_type === "out" && (
          <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-md w-fit text-xs border border-red-100">
            <ArrowDownCircle size={12} /> 出庫
          </span>
        )}
        {m.action_type === "adj" && (
          <span className="flex items-center gap-1 text-soap-wood bg-stone-100 px-2 py-0.5 rounded-md w-fit text-xs border border-stone-200">
            <RefreshCw size={12} /> 校準
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-soap-stone">
        <span className="text-[10px] bg-stone-100 text-stone-400 px-1 rounded mr-2 uppercase">
          {m.item_type === "material" ? "原" : "成"}
        </span>
        {m.item_name}
      </td>
      <td
        className={`px-6 py-4 text-right font-mono font-bold ${m.action_type === "out" ? "text-red-500" : m.action_type === "adj" ? "text-soap-wood" : "text-green-600"}`}
      >
        {m.action_type === "in" && <>+{m.change_amount}</>}
        {m.action_type === "out" && <>-{m.change_amount}</>}
        {m.action_type === "adj" && <>={m.change_amount}</>}
        <span className="text-s font-normal text-soap-accent ml-0.5">
          {m.item_unit}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-soap-wood italic font-sans uppercase">
        {m.related_batch ?? "--"}
      </td>
      <td className="px-6 py-4 text-sm text-soap-accent truncate max-w-[200px]">
        {m.note ?? "--"}
      </td>
    </tr>
  );
}
