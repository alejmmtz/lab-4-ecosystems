import {
  ORDER_STATUS_LABELS,
  OrderStatus,
  type Order,
} from "../../types/types";

const STATUS_STYLE: Record<OrderStatus, string> = {
  [OrderStatus.CREATED]: "text-yellow  group-hover:text-white ",
  [OrderStatus.IN_DELIVERY]: "text-blue  group-hover:text-white",
  [OrderStatus.DELIVERED]: "text-black group-hover:text-white",
};

interface OrderCardProps {
  order: Order;
  actions?: React.ReactNode;
}

export default function OrderCard({ order, actions }: OrderCardProps) {
  const badge = STATUS_STYLE[order.status];

  return (
    <div className="border-b-2 border-black cursor-pointer py-4 bg-white flex justify-between items-center  group hover:bg-blue transition-all hover:px-4  duration-500">
      <div className="flex-1">
        <div className="flex-col items-center gap-4 ">
          <h3 className="text-3xl font-bold font-londrina text-blue group-hover:text-white transition-all">
            Order #{order.id}
          </h3>{" "}
          <p className="text-md font-black font-londrina text-blue/75 group-hover:text-white/75">
            ${order.total}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {actions}
        <div className="text-rightpl-6">
          <span
            className={`text-2xl font-bold uppercase transition-all font-londrina ${badge}`}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>
      </div>
    </div>
  );
}
