import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import { divIcon } from "leaflet";
import { api } from "../../api/client";
import { supabase } from "../../hooks/useSupabase";
import { useKeyboardMovement } from "../../hooks/useKeyboardMovement";
import {
  ORDER_STATUS_LABELS,
  OrderBroadcastEvent,
  OrderStatus,
  type GeoPoint,
  type Order,
  type OrderPositionBroadcastPayload,
  type OrderStatusBroadcastPayload,
  type UpdateOrderPositionResponse,
} from "../../types/types";

type TrackingMode = "consumer" | "delivery";

interface OrderTrackingMapProps {
  orderId: number;
  mode: TrackingMode;
  destination: GeoPoint;
  initialStatus: OrderStatus;
  initialDeliveryPosition?: GeoPoint | null;
  fallbackDeliveryPosition?: GeoPoint;
  onDelivered?: () => void;
}

const destinationIcon = divIcon({
  className: "",
  html: `
    <div style="
      width:18px;
      height:18px;
      border-radius:999px;
      background:#ef4444;
      border:3px solid #ffffff;
      box-shadow:0 0 0 6px rgba(239,68,68,0.18);
    "></div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const deliveryIcon = divIcon({
  className: "",
  html: `
    <div style="
      width:20px;
      height:20px;
      border-radius:999px;
      background:#0f172a;
      border:3px solid #facc15;
      box-shadow:0 4px 14px rgba(15,23,42,0.3);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function MapViewportController({ position }: { position: GeoPoint }) {
  const map = useMap();

  useEffect(() => {
    const resizeId = window.setTimeout(() => {
      map.invalidateSize();
    }, 0);

    map.panTo([position.lat, position.lng], {
      animate: true,
      duration: 0.35,
    });

    return () => {
      window.clearTimeout(resizeId);
    };
  }, [map, position.lat, position.lng]);

  return null;
}

export default function OrderTrackingMap({
  orderId,
  mode,
  destination,
  initialStatus,
  initialDeliveryPosition = null,
  fallbackDeliveryPosition,
  onDelivered,
}: OrderTrackingMapProps) {
  const resolvedInitialPosition =
    initialDeliveryPosition ??
    (mode === "delivery" ? (fallbackDeliveryPosition ?? destination) : null);

  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [deliveryPosition, setDeliveryPosition] = useState<GeoPoint | null>(
    resolvedInitialPosition,
  );

  const onDeliveredRef = useRef(onDelivered);
  const deliveredNotificationRef = useRef(
    initialStatus === OrderStatus.DELIVERED,
  );
  // eslint-disable-next-line react-hooks/purity
  const heartbeatRef = useRef(Date.now());

  useEffect(() => {
    onDeliveredRef.current = onDelivered;
  }, [onDelivered]);

  useEffect(() => {
    const nextInitialPosition =
      initialDeliveryPosition ??
      (mode === "delivery" ? (fallbackDeliveryPosition ?? destination) : null);

    setStatus(initialStatus);
    setDeliveryPosition(nextInitialPosition);
    deliveredNotificationRef.current = initialStatus === OrderStatus.DELIVERED;
  }, [
    destination.lat,
    destination.lng,
    fallbackDeliveryPosition?.lat,
    fallbackDeliveryPosition?.lng,
    initialDeliveryPosition?.lat,
    initialDeliveryPosition?.lng,
    initialStatus,
    mode,
    orderId,
  ]);

  useEffect(() => {
    const channel = supabase.channel(`order:${orderId}`);

    // Init + Handler
    channel.on<OrderPositionBroadcastPayload>(
      "broadcast",
      { event: OrderBroadcastEvent.POSITION },
      ({ payload }) => {
        heartbeatRef.current = Date.now();
        setDeliveryPosition(payload);
      },
    );

    channel.on<OrderStatusBroadcastPayload>(
      "broadcast",
      { event: OrderBroadcastEvent.STATUS },
      ({ payload }) => {
        heartbeatRef.current = Date.now();
        setStatus(payload.status);

        if (
          payload.status === OrderStatus.DELIVERED &&
          !deliveredNotificationRef.current
        ) {
          deliveredNotificationRef.current = true;
          onDeliveredRef.current?.();
        }
      },
    );

    channel.subscribe(() => {
      heartbeatRef.current = Date.now();
    });

    // Heartbeat
    const heartbeatId = window.setInterval(() => {
      heartbeatRef.current = Date.now();
    }, 15000);

    // Cleanup
    return () => {
      window.clearInterval(heartbeatId);
      void supabase.removeChannel(channel);
    };
  }, [orderId]);

  useEffect(() => {
    if (mode !== "consumer") {
      return;
    }

    const syncOrderState = async () => {
      try {
        const { data } = await api.get<Order>(`/api/orders/${orderId}`);
        setStatus(data.status);
        setDeliveryPosition(data.deliveryPosition);
      } catch (error) {
        console.error("Error syncing tracked order:", error);
      }
    };

    void syncOrderState();

    const pollId = window.setInterval(() => {
      void syncOrderState();
    }, 2000);

    return () => {
      window.clearInterval(pollId);
    };
  }, [mode, orderId]);

  const persistPosition = async (position: GeoPoint) => {
    const { data } = await api.patch<UpdateOrderPositionResponse>(
      `/api/orders/${orderId}/position`,
      position,
    );

    setStatus(data.order.status);
    setDeliveryPosition(data.order.deliveryPosition);

    if (data.arrived && !deliveredNotificationRef.current) {
      deliveredNotificationRef.current = true;
      onDeliveredRef.current?.();
    }
  };

  useKeyboardMovement({
    enabled: mode === "delivery" && deliveryPosition !== null,
    initialPosition:
      deliveryPosition ??
      fallbackDeliveryPosition ??
      initialDeliveryPosition ??
      destination,
    onPositionChange: (position) => {
      setDeliveryPosition(position);
    },
    onPositionFlush: persistPosition,
  });

  const focusPosition = deliveryPosition ?? destination;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-md border-2 border-black">
      <div className="pointer-events-none absolute left-1/2 top-4 z-[1000] -translate-x-1/2 rounded-full bg-black/80 px-4 py-1.5 text-sm font-bold text-white">
        Order #{orderId} | {ORDER_STATUS_LABELS[status]}
      </div>

      {mode === "delivery" && deliveryPosition && (
        <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] rounded-md bg-black/80 px-3 py-2 font-mono text-xs text-yellow">
          Flechas: mover | {deliveryPosition.lat.toFixed(6)},{" "}
          {deliveryPosition.lng.toFixed(6)}
        </div>
      )}

      <MapContainer
        center={[focusPosition.lat, focusPosition.lng]}
        zoom={17}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        <MapViewportController position={focusPosition} />

        <Marker
          position={[destination.lat, destination.lng]}
          icon={destinationIcon}
        />

        {deliveryPosition && (
          <>
            <Marker
              position={[deliveryPosition.lat, deliveryPosition.lng]}
              icon={deliveryIcon}
            />
            <Polyline
              positions={[
                [deliveryPosition.lat, deliveryPosition.lng],
                [destination.lat, destination.lng],
              ]}
              color="#f59e0b"
              weight={4}
              dashArray="10 10"
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}
