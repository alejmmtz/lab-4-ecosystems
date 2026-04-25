import OrderTrackingMap from "../../components/OrderTrackingMap";
import { type Order } from "../../../types/types";

interface DeliveryMapProps {
  order: Order;
  onFinished: () => void;
}

export default function DeliveryMap({
  order,
  onFinished,
}: DeliveryMapProps) {
  const fallbackDeliveryPosition = order.deliveryPosition ?? {
    lat: 3.4516,
    lng: -76.532,
  };

  return (
    <OrderTrackingMap
      orderId={order.id}
      mode="delivery"
      destination={order.destination}
      initialStatus={order.status}
      initialDeliveryPosition={order.deliveryPosition}
      fallbackDeliveryPosition={fallbackDeliveryPosition}
      onDelivered={onFinished}
    />
  );
}
