import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { LocateFixed } from "lucide-react";
import { api, getCurrentUser } from "../../api/client";
import { OrderStatus, type Order, type Store } from "../../types/types";
import SectionHeader from "../components/SectionHeader";
import EmptyState from "../components/EmptyState";
import OrderCard from "../components/OrderCard";
import TrackingOrderPanel from "../components/TrackingOrderPanel";
import StoreList from "./components/StoreList";
import StoreMenu from "./components/StoreMenu";
import LiveTracker from "./components/LiveTracker";
import Navbar from "../components/NavBarConsumer";

export default function Consumer() {
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  const user = getCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== "consumer") {
      navigate("/auth", { replace: true });
    }
  }, [navigate, user, user?.role]);

  const fetchMyOrders = useCallback(async () => {
    try {
      const response = await api.get<Order[]>("/api/orders");
      setMyOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== "consumer") {
      return;
    }

    const loadConsumerData = async () => {
      try {
        const [storeResponse, orderResponse] = await Promise.all([
          api.get<Store[]>("/api/store"),
          api.get<Order[]>("/api/orders"),
        ]);

        setStores(storeResponse.data);
        setMyOrders(orderResponse.data);
      } catch (error) {
        console.error("Error loading consumer dashboard:", error);
      }
    };

    void loadConsumerData();
  }, [user, user?.id, user?.role]);

  if (!user || user.role !== "consumer") {
    return null;
  }

  const selectedStore = stores.find((store) => store.id === selectedStoreId);
  const activeOrder = myOrders.find(
    (order) => order.status !== OrderStatus.DELIVERED,
  );

  const handleArrived = () => {
    toast.success("Tu repartidor ha llegado.", { duration: 6000 });
    void fetchMyOrders();
  };

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Navbar name={user.name} role="Consumer" />

      <section className="bg-white w-full p-8 ">
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
        <div className="flex items-center justify-between text-black uppercase text-5xl mt-2 ">
          <h1>Craving</h1>
          <h1>For</h1>
          <h1>Something</h1>
          <h1>Unmatched?</h1>
        </div>
      </section>

      <section className="bg-white w-full h-1/2 p-8 ">
        <div className="flex items-center bg-black p-4 rounded-md text-white text-bold gap-2 text-2xl mt-2 tracking-tight">
          <LocateFixed />
          <h3>
            {activeOrder
              ? "Tracking your Munchy..."
              : "Where are you waiting for your Munchy?"}
          </h3>
        </div>

        <div className="flex items-center justify-between uppercase gap-4 text-5xl mt-4 h-full pb-16">
          {activeOrder ? (
            <>
              <div className="w-3/4 h-[500px] rounded-md">
                <LiveTracker order={activeOrder} onArrived={handleArrived} />
              </div>

              <div className="w-1/4 h-[500px]">
                <TrackingOrderPanel order={activeOrder} title="Order" />
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gray-50 border-2 border-black border-dashed flex items-center justify-center">
              <h2 className="text-3xl text-black/30 font-londrina">
                No active orders
              </h2>
            </div>
          )}
        </div>
      </section>

      <div className="p-8 flex flex-col gap-16">
        <section>
          <SectionHeader
            title={selectedStore ? `${selectedStore.name} menu` : "Stores"}
          >
            {selectedStoreId && (
              <button
                onClick={() => setSelectedStoreId(null)}
                className="bg-blue text-white rounded-md font-bold py-2 px-6 text-lg uppercase hover:bg-black hover:border-black transition-colors duration-200 font-londrina cursor-pointer"
              >
                Go Back
              </button>
            )}
          </SectionHeader>

          {selectedStoreId ? (
            <StoreMenu
              storeId={selectedStoreId}
              onOrderSuccess={fetchMyOrders}
            />
          ) : (
            <StoreList stores={stores} onSelectStore={setSelectedStoreId} />
          )}
        </section>

        <section>
          <SectionHeader title={`${user.name}'s orders`} />
          <div className="flex flex-col ">
            {myOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
            {myOrders.length === 0 && (
              <EmptyState message="Place your first order" />
            )}
          </div>
        </section>
      </div>
      <footer>
        <div className="mt-8 w-full p-8 text-white text-center bg-black">
          <h1>delivermymunchies.com</h1>
        </div>
      </footer>
    </div>
  );
}
