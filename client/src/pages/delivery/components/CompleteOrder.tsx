// pages/delivery/components/CompletedOrder.tsx
import type { Order } from "../../../types/types";

interface CompletedOrderProps {
  order: Order;
}

export default function CompletedOrder({ order }: CompletedOrderProps) {
  return (
    <div className="flex items-center gap-8 border-b-2 border-black/20 py-5 opacity-40">
      <div className="flex-1">
        <h3 className="text-4xl font-bold font-londrina text-black leading-none">
          Order #{order.id}
        </h3>
        {order.total != null && (
          <p className="text-black/50 font-bold text-sm mt-0.5">
            ${order.total}
          </p>
        )}
      </div>

      <span className="shrink-0 px-3 py-1 rounded-md text-base font-londrina font-bold uppercase bg-black text-white">
        Delivered
      </span>
    </div>
  );
}
