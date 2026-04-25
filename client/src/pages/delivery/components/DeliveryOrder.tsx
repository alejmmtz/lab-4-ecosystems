import type { Order } from "../../../types/types";

interface DeliveryOrderProps {
  order: Order;
  onAccept: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function DeliveryOrder({
  order,
  onAccept,
  disabled = false,
  loading = false,
}: DeliveryOrderProps) {
  return (
    <div
      className={`flex items-center gap-8 border-b-2 border-black py-6 transition-all duration-500 ${
        disabled ? "opacity-50" : "group hover:bg-yellow hover:px-4"
      }`}
    >
      <div className="flex-1 min-w-0">
        <h3 className="text-5xl font-bold font-londrina text-blue group-hover:text-black transition-colors duration-200 leading-none">
          Order #{order.id}
        </h3>
        <p className="font-figtree text-black/50 mt-1 text-lg group-hover:text-black transition-colors duration-300">
          Total ${order.total}
        </p>
      </div>

      <button
        onClick={onAccept}
        disabled={disabled || loading}
        className="shrink-0 min-w-[180px] rounded-md bg-blue px-6 py-3 font-londrina text-2xl uppercase text-white transition-all duration-200 hover:bg-black hover:text-yellow disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-blue disabled:hover:text-white"
      >
        {loading ? "Accepting..." : "Pick Up Munchy"}
      </button>
    </div>
  );
}
