import { type Order } from "../../types/types";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow text-black border-black",
  preparing: "bg-blue text-white border-blue",
  delivered: "bg-black text-white border-black",
  cancelled: "bg-white text-black/40 border-black/20",
};

interface OrderCardProps {
  order: Order;
  actions?: React.ReactNode;
}

export default function OrderCard({ order, actions }: OrderCardProps) {
  const badge = STATUS_STYLE[order.status] ?? "bg-white text-blue border-blue";

  return (
    <div className="border-2 border-black p-6 bg-white flex justify-between items-center gap-6 group hover:bg-yellow transition-colors duration-200">
      <div className="flex-1">
        <div className="flex items-center gap-4 mb-1">
          <h3 className="text-3xl uppercase font-londrina text-black">
            Order #{order.id}
          </h3>
          <span
            className={`border-2 px-2 py-0.5 text-xs font-bold uppercase font-londrina ${badge}`}
          >
            {order.status}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {actions}
        <div className="text-right border-l-2 border-dashed border-black pl-6">
          <p className="text-4xl font-black font-londrina text-black">
            ${order.total}
          </p>
          <p className="text-xs font-bold uppercase tracking-widest text-black/40 font-figtree">
            Total
          </p>
        </div>
      </div>
    </div>
  );
}
