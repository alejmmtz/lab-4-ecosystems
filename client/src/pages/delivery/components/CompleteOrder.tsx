import { ORDER_STATUS_LABELS, type Order } from "../../../types/types";

interface CompletedOrderProps {
  order: Order;
}

export default function CompletedOrder({ order }: CompletedOrderProps) {
  return (
    <div className="border-b-2 border-black cursor-pointer py-4 bg-white flex justify-between items-center group hover:bg-blue transition-all hover:px-4 duration-500">
      <div className="flex-1">
        <h3 className="text-3xl font-bold font-londrina text-blue group-hover:text-white transition-all leading-none">
          Order #{order.id}
        </h3>
        {order.total != null && (
          <p className="text-md font-black font-londrina text-blue/75 group-hover:text-white/75 mt-1">
            ${order.total}
          </p>
        )}
      </div>

      <span className="shrink-0 px-3 py-1 rounded-md text-base font-londrina font-bold uppercase bg-black text-white">
        {ORDER_STATUS_LABELS[order.status]}
      </span>
    </div>
  );
}
