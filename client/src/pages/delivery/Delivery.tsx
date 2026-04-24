// pages/delivery/Delivery.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api, getCurrentUser } from "../../api/client";
import { type Order } from "../../types/types";
import Navbar from "../components/NavBar";
import SectionHeader from "../components/SectionHeader";
import EmptyState from "../components/EmptyState";
import DeliveryOrder from "./components/DeliveryOrder";
import CompletedOrder from "./components/CompleteOrder";
import DeliveryMap from "./components/DeliveryMap";

const POLL_INTERVAL_MS = 10_000; // Re-fetch orders every 10 seconds

export default function Delivery() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDelivery, setActiveDelivery] = useState<Order | null>(null);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  const user = getCurrentUser();
  const navigate = useNavigate();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Redirect unauthenticated users (or non-riders) immediately
  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await api.get("/api/order");
      const data: Order[] = response.data;
      setOrders(data);
      setError(null);

      // Restore active delivery state if the rider already owns one
      const inProgress = data.find(
        (o) => o.status === "Delivery" && o.deliveryId === user?.id,
      );
      setActiveDelivery(inProgress ?? null);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Could not load orders. Retrying…");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Initial fetch + polling for new available orders
  useEffect(() => {
    fetchOrders();

    pollRef.current = setInterval(fetchOrders, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchOrders]);

  const acceptOrder = async (orderId: number) => {
    // Guard: a rider can only carry one order at a time
    if (activeDelivery) return;

    setAcceptingId(orderId);
    try {
      const res = await api.patch(`/api/order/${orderId}/accept`);
      setActiveDelivery(res.data);
      // Refresh list so the accepted order no longer appears as "Available"
      await fetchOrders();
    } catch (err) {
      console.error("Error accepting order:", err);
      alert("Could not accept this order. It may have been taken already.");
    } finally {
      setAcceptingId(null);
    }
  };

  const handleFinish = useCallback(async () => {
    setActiveDelivery(null);
    await fetchOrders();
  }, [fetchOrders]);

  // ── Derived lists ──────────────────────────────────────────────────────────
  // "Available" = created and not yet accepted by anyone
  const available = orders.filter((o) => o.status === "Created");

  // "In Progress" = the active order this rider owns (shown separately via map)
  // "Delivered" = completed deliveries for the history section
  const done = orders.filter((o) => o.status === "Delivered");

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!user) return null; // Redirect is in-flight

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Navbar name={user.name} role="Rider" />

      <div className="p-8 flex flex-col gap-16">
        {/* ── Active delivery map ── */}
        {activeDelivery && (
          <section>
            <SectionHeader title="Current Navigation" />
            <div className="h-[500px] w-full mt-4">
              <DeliveryMap order={activeDelivery} onFinished={handleFinish} />
            </div>
          </section>
        )}

        {/* ── Available orders ── */}
        <section>
          <SectionHeader title="Available Deliveries" />

          {loading ? (
            <p className="text-black/50 font-bold py-4">Loading orders…</p>
          ) : error ? (
            <p className="text-red-500 font-bold py-4">{error}</p>
          ) : available.length === 0 ? (
            <EmptyState message="No orders to pick up" />
          ) : (
            <div className="flex flex-col">
              {available.map((order) => (
                <DeliveryOrder
                  key={order.id}
                  order={order}
                  onAccept={() => acceptOrder(order.id)}
                  // Disable all accept buttons while the rider has an active delivery
                  // or while a different accept request is in-flight
                  disabled={!!activeDelivery || acceptingId !== null}
                  loading={acceptingId === order.id}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── History ── */}
        {done.length > 0 && (
          <section>
            <SectionHeader title="History" />
            <div className="flex flex-col">
              {done.map((order) => (
                <CompletedOrder key={order.id} order={order} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
