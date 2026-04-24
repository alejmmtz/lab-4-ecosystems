// pages/storeowner/StoreOwner.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api, getCurrentUser } from "../../api/client";
import { type Store, type Order } from "../../types/types";
import Navbar from "../components/NavBar";
import SectionHeader from "../components/SectionHeader";
import EmptyState from "../components/EmptyState";
import StoreStatusBanner from "./components/StoreStatusBanner";
import { PendingOrderRow, CompletedOrderRow } from "./components/StoreOrderRow";
import AddProductForm from "./components/AddProductForm";

export default function StoreOwner() {
  const [store, setStore] = useState<Store | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  const user = getCurrentUser();
  const navigate = useNavigate();

  // Redirect unauthenticated users immediately
  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
  }, [user, navigate]);

  const fetchData = useCallback(async () => {
    try {
      const [storeRes, orderRes] = await Promise.all([
        api.get("/api/store"),
        api.get("/api/order"),
      ]);

      const myStore = storeRes.data.find((s: Store) => s.ownerId === user?.id);
      setStore(myStore ?? null);
      setOrders(orderRes.data);
    } catch (error) {
      console.error("Error fetching store data:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Optimistic toggle with rollback on failure
  const toggleStatus = async () => {
    if (!store) return;
    const newStatus = store.status === "open" ? "closed" : "open";
    setStore({ ...store, status: newStatus }); // optimistic update
    try {
      await api.patch(`/api/store/${store.id}`, { status: newStatus });
    } catch (error) {
      console.error("Error toggling store status:", error);
      setStore({ ...store, status: store.status }); // rollback
    }
  };

  const acceptOrder = async (id: number) => {
    setAcceptingId(id);
    try {
      await api.patch(`/api/order/${id}/accept`);
      await fetchData();
    } catch (error) {
      console.error("Error accepting order:", error);
      alert("Could not accept this order. Please try again.");
    } finally {
      setAcceptingId(null);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (!user) return null; // redirect is in-flight

  const pendingOrders = orders.filter((o) => o.status === "Created");
  const otherOrders = orders.filter((o) => o.status !== "Created");

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Navbar name={store?.name ?? user.name} role="Store" onLogout={logout} />

      <div className="p-8 flex flex-col gap-16">
        {/* Store status toggle */}
        <section>
          {store ? (
            <StoreStatusBanner store={store} onToggle={toggleStatus} />
          ) : (
            <p className="text-black/30 font-figtree py-6">Loading store…</p>
          )}
        </section>

        {/* Orders + Add product */}
        <div className="flex gap-16 items-start">
          <section className="flex-1 min-w-0">
            <SectionHeader title="Incoming Orders" />

            {orders.length === 0 ? (
              <EmptyState message="No orders yet" />
            ) : (
              <div className="flex flex-col">
                {pendingOrders.map((order) => (
                  <PendingOrderRow
                    key={order.id}
                    order={order}
                    onAccept={acceptOrder}
                    accepting={acceptingId === order.id}
                  />
                ))}
                {otherOrders.map((order) => (
                  <CompletedOrderRow key={order.id} order={order} />
                ))}
              </div>
            )}
          </section>

          {/* Only render the form once we know which store this owner manages */}
          {store && <AddProductForm storeId={store.id} onCreated={fetchData} />}
        </div>
      </div>

      <footer className="mt-auto">
        <div className="w-full p-8 text-white text-center bg-black font-figtree">
          <h1>delivermymunchies.com</h1>
        </div>
      </footer>
    </div>
  );
}
