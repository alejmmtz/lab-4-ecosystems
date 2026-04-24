// pages/delivery/components/DeliveryMap.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import { supabase } from "../../../hooks/useSupabase";
import { api } from "../../../api/client";
import { type Order } from "../../../types/types";
import L from "leaflet";

const STEP = 0.0001;
const THROTTLE_MS = 1000;

const riderIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2972/2972185.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// ─── Sub-component: keeps the map view centred on the rider ───────────────────
function MapController({ pos }: { pos: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.panTo([pos.lat, pos.lng], { animate: true, duration: 0.4 });
  }, [pos, map]);
  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DeliveryMap({
  order,
  onFinished,
}: {
  order: Order;
  onFinished: () => void;
}) {
  const [pos, setPos] = useState({
    lat: order.deliveryPosition?.lat ?? 3.45,
    lng: order.deliveryPosition?.lng ?? -76.53,
  });

  // Keep a mutable ref so the keydown closure always reads the latest position
  // without needing to be recreated on every position change.
  const posRef = useRef(pos);

  // Refs that must outlive re-renders
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef(supabase.channel(`order:${order.id}`));
  const onFinishedRef = useRef(onFinished);

  // Keep onFinished ref current without re-registering the keydown listener
  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  // Subscribe the channel ONCE on mount, clean up on unmount
  useEffect(() => {
    const channel = channelRef.current;
    channel.subscribe();

    return () => {
      channel.unsubscribe();
      // Cancel any pending throttled DB write
      if (throttleRef.current) clearTimeout(throttleRef.current);
    };
  }, []); // intentionally empty — channel is tied to the order, not to any state

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Only respond to arrow keys
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
        return;
      e.preventDefault(); // prevent page scroll

      // Compute new position synchronously from the ref (no stale closures)
      const prev = posRef.current;
      const newPos = {
        lat:
          prev.lat +
          (e.key === "ArrowUp" ? STEP : e.key === "ArrowDown" ? -STEP : 0),
        lng:
          prev.lng +
          (e.key === "ArrowRight" ? STEP : e.key === "ArrowLeft" ? -STEP : 0),
      };

      // Update both ref and state
      posRef.current = newPos;
      setPos(newPos);

      // 1. Immediate visual update via Supabase Broadcast (consumer sees it instantly)
      channelRef.current.send({
        type: "broadcast",
        event: "position-update",
        payload: newPos,
      });

      // 2. Throttled DB write — once per THROTTLE_MS regardless of how many keys fire
      if (!throttleRef.current) {
        throttleRef.current = setTimeout(async () => {
          // Capture the *latest* position at the moment the timer fires
          const latestPos = posRef.current;
          try {
            const res = await api.patch(
              `/api/order/${order.id}/position`,
              latestPos,
            );

            // Backend returns { arrived: true } when ST_DWithin threshold is met
            if (res.data.arrived) {
              channelRef.current.send({
                type: "broadcast",
                event: "delivery-arrived",
                payload: latestPos,
              });
              onFinishedRef.current();
            }
          } catch (err) {
            console.error("Position sync failed:", err);
          } finally {
            throttleRef.current = null;
          }
        }, THROTTLE_MS);
      }
    },
    [order.id],
  ); // order.id is stable for the lifetime of this component

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden">
      {/* Keyboard hint overlay */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-black/70 text-white text-sm font-bold px-4 py-1.5 rounded-full pointer-events-none select-none">
        Use ↑ ↓ ← → arrow keys to move
      </div>

      <MapContainer
        center={[pos.lat, pos.lng]}
        zoom={17}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

        {/* Keeps the map centred on the rider as they move */}
        <MapController pos={pos} />

        {/* Destination marker (consumer location) */}
        <Marker position={[order.destination.lat, order.destination.lng]} />

        {/* Rider marker */}
        <Marker position={[pos.lat, pos.lng]} icon={riderIcon} />

        {/* Dashed line from rider to destination */}
        <Polyline
          positions={[
            [pos.lat, pos.lng],
            [order.destination.lat, order.destination.lng],
          ]}
          color="#1d4ed8"
          dashArray="6, 12"
          weight={3}
        />
      </MapContainer>
    </div>
  );
}
