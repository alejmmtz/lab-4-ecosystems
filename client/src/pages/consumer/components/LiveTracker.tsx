// pages/consumer/components/LiveTracker.tsx
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { supabase } from "../../../hooks/useSupabase";
import { type Order } from "../../../types/types";

const destinationIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const deliveryIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface LiveTrackerProps {
  order: Order;
  onArrived: () => void;
}

// ── Sub-component: keeps the map centred on the rider as they move ─────────────
function MapController({ pos }: { pos: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.panTo([pos.lat, pos.lng], { animate: true, duration: 0.5 });
  }, [pos, map]);
  return null;
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function LiveTracker({ order, onArrived }: LiveTrackerProps) {
  const [deliveryPos, setDeliveryPos] = useState<{
    lat: number;
    lng: number;
  } | null>(order.deliveryPosition ?? null);

  // Keep onArrived in a ref so the effect never needs to re-run when the
  // parent re-renders and passes a new function reference.
  const onArrivedRef = useRef(onArrived);
  useEffect(() => {
    onArrivedRef.current = onArrived;
  }, [onArrived]);

  useEffect(() => {
    const channel = supabase.channel(`order:${order.id}`);

    channel
      .on("broadcast", { event: "position-update" }, ({ payload }) => {
        setDeliveryPos(payload);
      })
      .on("broadcast", { event: "delivery-arrived" }, ({ payload }) => {
        setDeliveryPos(payload);
        onArrivedRef.current();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id]); // only re-subscribe if the order changes — not on every render

  const center = deliveryPos ?? order.destination;

  return (
    <div className="w-full h-full rounded-md overflow-hidden border-2 border-black relative z-0">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

        {/* Smoothly re-centres the map whenever deliveryPos changes */}
        <MapController pos={deliveryPos} />

        {/* Consumer's location */}
        <Marker
          position={[order.destination.lat, order.destination.lng]}
          icon={destinationIcon}
        >
          <Popup>Tu ubicación</Popup>
        </Marker>

        {/* Rider position — only shown once the delivery has started */}
        {deliveryPos && (
          <Marker
            position={[deliveryPos.lat, deliveryPos.lng]}
            icon={deliveryIcon}
          >
            <Popup>¡Tu Munchy en camino!</Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Subtle overlay when the rider hasn't moved yet */}
      {!deliveryPos && (
        <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none z-[1000]">
          <span className="bg-black/70 text-white text-sm font-bold px-4 py-1.5 rounded-full">
            Waiting for rider to start…
          </span>
        </div>
      )}
    </div>
  );
}
