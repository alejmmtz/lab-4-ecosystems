import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LocateFixed } from "lucide-react";
import { api, getCurrentUser } from "../../api/client";
import { OrderStatus, type Order } from "../../types/types";
import SectionHeader from "../components/SectionHeader";
import EmptyState from "../components/EmptyState";
import TrackingOrderPanel from "../components/TrackingOrderPanel";
import Navbar from "../components/NavBarConsumer";
import DeliveryOrder from "./components/DeliveryOrder";
import CompletedOrder from "./components/CompleteOrder";
import DeliveryMap from "./components/DeliveryMap";

const POLL_INTERVAL_MS = 10_000;

export default function Delivery() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDelivery, setActiveDelivery] = useState<Order | null>(null);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [completing, setCompleting] = useState(false);

  const user = getCurrentUser();
  const navigate = useNavigate();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user || user.role !== "delivery") {
      navigate("/auth", { replace: true });
    }
  }, [navigate, user, user?.role]);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await api.get<Order[]>("/api/orders");
      const data = response.data;
      setOrders(data);
      setError(null);

      const inProgress = data.find(
        (order) =>
          order.status === OrderStatus.IN_DELIVERY &&
          order.deliveryId === user?.id,
      );

      setActiveDelivery(inProgress ?? null);
    } catch (requestError) {
      console.error("Error fetching orders:", requestError);
      setError("Could not load orders. Retrying...");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void fetchOrders();

    pollRef.current = setInterval(() => {
      void fetchOrders();
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [fetchOrders]);

  const acceptOrder = async (orderId: number) => {
    if (activeDelivery) {
      return;
    }

    setAcceptingId(orderId);

    try {
      const response = await api.patch<Order>(`/api/orders/${orderId}/accept`);
      setActiveDelivery(response.data);
      await fetchOrders();
    } catch (requestError) {
      console.error("Error accepting order:", requestError);
      alert("Could not accept this order. It may have been taken already.");
    } finally {
      setAcceptingId(null);
    }
  };

  const markAsDelivered = async () => {
    if (!activeDelivery || completing) {
      return;
    }

    setCompleting(true);

    try {
      const response = await api.patch<Order>(
        `/api/orders/${activeDelivery.id}/deliver`,
      );

      setOrders((previousOrders) => {
        const withoutCurrent = previousOrders.filter(
          (order) => order.id !== response.data.id,
        );

        return [response.data, ...withoutCurrent];
      });
      setActiveDelivery(null);
      await fetchOrders();
    } catch (requestError) {
      console.error("Error completing order:", requestError);
      alert("Could not mark this order as delivered.");
    } finally {
      setCompleting(false);
    }
  };

  const handleFinish = useCallback(async () => {
    setActiveDelivery(null);
    await fetchOrders();
  }, [fetchOrders]);

  if (!user || user.role !== "delivery") {
    return null;
  }

  const available = orders.filter((order) => order.status === OrderStatus.CREATED);
  const done = orders.filter((order) => order.status === OrderStatus.DELIVERED);

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Navbar name={user.name} role="Rider" />

      <section className="bg-white w-full p-8">
        <div className="flex gap-4 w-full transition-all">
          <img
            src="https://images.pexels.com/photos/36990085/pexels-photo-36990085.jpeg"
            className="object-cover h-125 flex-1 min-w-0 rounded-md"
          />
          <img
            src="https://images.pexels.com/photos/36989857/pexels-photo-36989857.jpeg"
            className="object-cover h-125 flex-1 min-w-0 rounded-md"
          />
          <img
            src="https://images.pexels.com/photos/36989868/pexels-photo-36989868.jpeg"
            className="object-cover h-125 flex-1 min-w-0 rounded-md"
          />
        </div>
        <div className="flex items-center justify-between text-black uppercase text-5xl mt-2">
          <h1>Ready</h1>
          <h1>For</h1>
          <h1>The</h1>
          <h1>Next Drop?</h1>
        </div>
      </section>

      <section className="bg-white w-full p-8">
        <div className="flex items-center bg-black p-4 rounded-md text-white text-bold gap-2 text-2xl mt-2 tracking-tight">
          <LocateFixed />
          <h3>
            {activeDelivery
              ? "Navigating your current delivery..."
              : "Waiting for the next Munchy route"}
          </h3>
        </div>

        <div className="flex items-center justify-between uppercase gap-4 text-5xl mt-4 h-full pb-16">
          {activeDelivery ? (
            <>
              <div className="w-3/4 h-[500px] rounded-md">
                <DeliveryMap order={activeDelivery} onFinished={handleFinish} />
              </div>

              <div className="w-1/4 h-[500px]">
                <TrackingOrderPanel
                  order={activeDelivery}
                  title="Order"
                  actionLabel="Mark Delivered"
                  onAction={markAsDelivered}
                  actionLoading={completing}
                  actionDisabled={completing}
                />
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gray-50 border-2 border-black border-dashed flex items-center justify-center">
              <h2 className="text-3xl text-black/30 font-londrina">
                No active delivery
              </h2>
            </div>
          )}
        </div>
      </section>

      <div className="p-8 flex flex-col gap-16">
        <section>
          <SectionHeader title="Available Deliveries" />

          {loading ? (
            <p className="text-black/50 font-bold py-4">Loading orders...</p>
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
                  disabled={Boolean(activeDelivery) || acceptingId !== null}
                  loading={acceptingId === order.id}
                />
              ))}
            </div>
          )}
        </section>

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

      <footer>
        <div className="mt-8 w-full p-8 text-white text-center bg-black">
          <h1>delivermymunchies.com</h1>
        </div>
      </footer>
    </div>
  );
}
