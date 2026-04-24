// pages/delivery/components/DeliveryOrder.tsx
import type { Order } from "../../../types/types";

interface DeliveryOrderProps {
  order: Order;
  onAccept: () => void;
  /** Prevent accepting while the rider already has an active delivery */
  disabled?: boolean;
  /** Show a loading spinner on this specific row's button */
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
      className={`flex items-center gap-8 border-b-2 border-black py-6 px-4 transition-all
        ${disabled ? "opacity-50" : "group hover:bg-yellow"}`}
    >
      <div className="flex-1">
        <h3 className="text-4xl font-londrina text-blue group-hover:text-black transition-colors">
          Order #{order.id}
        </h3>
        <p className="text-black/50 font-bold">Total: ${order.total}</p>
      </div>

      <button
        onClick={onAccept}
        disabled={disabled || loading}
        className="bg-blue text-white px-6 py-2 rounded-md font-londrina uppercase text-xl
          hover:bg-black transition-all
          disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-blue
          min-w-[160px] flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            {/* Simple CSS spinner — no extra library needed */}
            <span
              className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
            Accepting…
          </>
        ) : (
          "Pick Up Munchy"
        )}
      </button>
    </div>
  );
}
