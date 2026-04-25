import {
  ORDER_STATUS_LABELS,
  OrderStatus,
  type Order,
} from "../../../types/types";

interface PendingOrderRowProps {
  order: Order;
  onAccept?: (id: number) => void;
  accepting?: boolean;
  actionLabel?: string;
}

export function PendingOrderRow({
  order,
  onAccept,
  accepting = false,
  actionLabel = "Aceptar",
}: PendingOrderRowProps) {
  const hasAction = typeof onAccept === "function";

  return (
    <div className="flex items-center gap-8 border-b-2 border-black py-6 hover:bg-yellow hover:px-4 transition-all duration-500 group">
      <div className="flex-1 min-w-0">
        <h3 className="text-5xl font-bold font-londrina text-blue group-hover:text-black transition-colors duration-200 leading-none">
          Order #{order.id}
        </h3>
        <p className="font-figtree text-black/50 mt-1 text-lg group-hover:text-black transition-colors duration-300">
          ${order.total}
        </p>
      </div>

      <span className="shrink-0 px-3 py-1 rounded-md text-base font-londrina font-bold uppercase bg-yellow text-black">
        {ORDER_STATUS_LABELS[OrderStatus.CREATED]}
      </span>

      {hasAction && (
        <button
          onClick={() => onAccept(order.id)}
          disabled={accepting}
          className="shrink-0 text-2xl font-bold font-londrina uppercase text-blue group-hover:bg-black group-hover:text-yellow group-hover:px-3 rounded-md transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {accepting ? "Accepting..." : actionLabel}
        </button>
      )}
    </div>
  );
}

interface CompletedOrderRowProps {
  order: Order;
}

export function CompletedOrderRow({ order }: CompletedOrderRowProps) {
  return (
    <div className="flex items-center gap-8 border-b-2 border-black/20 py-5 opacity-50">
      <h3 className="text-4xl font-bold font-londrina text-black flex-1 leading-none">
        Order #{order.id}
      </h3>
      <p className="font-figtree text-black/50 text-lg">${order.total}</p>
      <span className="shrink-0 px-3 py-1 rounded-md text-base font-londrina font-bold uppercase bg-black text-white">
        {ORDER_STATUS_LABELS[order.status]}
      </span>
    </div>
  );
}
