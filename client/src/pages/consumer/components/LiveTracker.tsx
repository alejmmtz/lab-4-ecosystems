import OrderTrackingMap from "../../components/OrderTrackingMap";
import { type Order } from "../../../types/types";

interface LiveTrackerProps {
  order: Order;
  onArrived: () => void;
}

export default function LiveTracker({ order, onArrived }: LiveTrackerProps) {
  return (
    <OrderTrackingMap
      orderId={order.id}
      mode="consumer"
      destination={order.destination}
      initialStatus={order.status}
      initialDeliveryPosition={order.deliveryPosition}
      onDelivered={onArrived}
    />
  );
}
