import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api, getCurrentUser } from "../../api/client";
import { OrderStatus, type Store, type Order } from "../../types/types";
import Navbar from "../components/NavBar";
import SectionHeader from "../components/SectionHeader";
import EmptyState from "../components/EmptyState";
import StoreStatusBanner from "./components/StoreStatus";
import { PendingOrderRow, CompletedOrderRow } from "./components/StoreOrder";
import AddProductForm from "./components/AddProductForm";

export default function StoreOwner() {
  const [store, setStore] = useState<Store | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  const user = getCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth", { replace: true });
    }
  }, [navigate, user]);

  const fetchData = useCallback(async () => {
    try {
      const [storeResponse, orderResponse] = await Promise.all([
        api.get<Store[]>("/api/store"),
        api.get<Order[]>("/api/orders"),
      ]);

      const myStore = storeResponse.data.find(
        (currentStore) => currentStore.ownerId === user?.id,
      );

      setStore(myStore ?? null);
      setOrders(orderResponse.data);
    } catch (error) {
      console.error("Error fetching store data:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const toggleStatus = async () => {
    if (!store) {
      return;
    }

    const newStatus = store.status === "open" ? "closed" : "open";
    setStore({ ...store, status: newStatus });

    try {
      await api.patch(`/api/store/${store.id}`, { status: newStatus });
    } catch (error) {
      console.error("Error toggling store status:", error);
      setStore({ ...store, status: store.status });
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/auth");
  };

  if (!user) {
    return null;
  }

  const createdOrders = orders.filter(
    (order) => order.status === OrderStatus.CREATED,
  );
  const inDeliveryOrders = orders.filter(
    (order) => order.status === OrderStatus.IN_DELIVERY,
  );
  const deliveredOrders = orders.filter(
    (order) => order.status === OrderStatus.DELIVERED,
  );

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Navbar name={store?.name ?? user.name} role="Store" onLogout={logout} />

      <div className="p-8 flex flex-col gap-16">
        <section>
          {store ? (
            <StoreStatusBanner store={store} onToggle={toggleStatus} />
          ) : (
            <p className="text-black/30 font-figtree py-6">Loading store...</p>
          )}
        </section>

        <div className="flex gap-16 items-start">
          <section className="flex-1 min-w-0">
            <SectionHeader title="Incoming Orders" />

            {createdOrders.length === 0 ? (
              <EmptyState message="No orders yet" />
            ) : (
              <div className="flex flex-col">
                {createdOrders.map((order) => (
                  <PendingOrderRow key={order.id} order={order} />
                ))}
              </div>
            )}

            <SectionHeader title="Orders In Delivery" />

            {inDeliveryOrders.length === 0 ? (
              <EmptyState message="No orders in delivery" />
            ) : (
              <div className="flex flex-col">
                {inDeliveryOrders.map((order) => (
                  <CompletedOrderRow key={order.id} order={order} />
                ))}
              </div>
            )}

            <SectionHeader title="Delivered Orders" />

            {deliveredOrders.length === 0 ? (
              <EmptyState message="No delivered orders yet" />
            ) : (
              <div className="flex flex-col">
                {deliveredOrders.map((order) => (
                  <CompletedOrderRow key={order.id} order={order} />
                ))}
              </div>
            )}
          </section>

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
