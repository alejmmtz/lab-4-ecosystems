import {
  ORDER_STATUS_LABELS,
  OrderStatus,
  type Order,
} from "../../types/types";

interface TrackingOrderPanelProps {
  order: Order;
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
  actionDisabled?: boolean;
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  [OrderStatus.CREATED]: "bg-blue text-white",
  [OrderStatus.IN_DELIVERY]: "bg-yellow text-black",
  [OrderStatus.DELIVERED]: "bg-black text-white",
};

export default function TrackingOrderPanel({
  order,
  title = "Order",
  actionLabel,
  onAction,
  actionLoading = false,
  actionDisabled = false,
}: TrackingOrderPanelProps) {
  const deliverySummary = order.deliveryId
    ? order.deliveryPosition
      ? "Rider visible on map"
      : "Rider assigned"
    : "Waiting for a rider";

  return (
    <div className="bg-white shadow-sm h-full rounded-md border-2 border-black p-6 flex flex-col justify-between gap-6 text-center">
      <div className="flex flex-col gap-4">
        <h3 className="text-3xl font-bold text-black/50">{title}</h3>
        <div className="text-5xl font-londrina text-blue">#{order.id}</div>

        <div
          className={`text-4xl font-londrina p-4 rounded-md border-2 border-black ${STATUS_STYLES[order.status]}`}
        >
          {ORDER_STATUS_LABELS[order.status]}
        </div>

        <p className="text-lg font-bold text-black/50">Total ${order.total}</p>

        <div className="rounded-md border-2 border-black/10 bg-gray-50 px-4 py-4 text-left">
          <p className="font-figtree text-xs uppercase tracking-wide text-black/40">
            Destination
          </p>
          <p className="font-mono text-sm text-black">
            {order.destination.lat.toFixed(6)}, {order.destination.lng.toFixed(6)}
          </p>

          <p className="mt-4 font-figtree text-xs uppercase tracking-wide text-black/40">
            Delivery
          </p>
          <p className="font-figtree text-sm font-bold text-black">
            {deliverySummary}
          </p>
        </div>
      </div>

      {onAction && actionLabel && (
        <button
          onClick={onAction}
          disabled={actionDisabled || actionLoading}
          className="w-full rounded-md bg-blue px-4 py-4 font-londrina text-3xl uppercase text-white transition-all hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {actionLoading ? "Updating..." : actionLabel}
        </button>
      )}
    </div>
  );
}
