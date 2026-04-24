// pages/consumer/components/StoreList.tsx
import { type Store } from "../../../types/types";
import EmptyState from "../../components/EmptyState";

interface StoreListProps {
  stores: Store[];
  onSelectStore: (storeId: number) => void;
  isLoading?: boolean;
}

export default function StoreList({
  stores,
  onSelectStore,
  isLoading,
}: StoreListProps) {
  if (isLoading) {
    return (
      <div className="p-12 text-center text-xl font-figtree">
        Loading stores...
      </div>
    );
  }

  if (stores.length === 0) {
    return <EmptyState message="No stores available yet" />;
  }

  return (
    <div className="flex flex-col">
      {stores.map((store) => {
        const isOpen = store.status === "open";
        return (
          <div
            key={store.id}
            onClick={() => isOpen && onSelectStore(store.id)}
            className={`flex items-center gap-8 border-b-2 border-black py-4 hover:p-4 transition-all duration-500 group ${
              isOpen
                ? "cursor-pointer hover:bg-yellow"
                : "opacity-30 cursor-not-allowed"
            }`}
            role={isOpen ? "button" : undefined}
            tabIndex={isOpen ? 0 : -1}
            aria-disabled={!isOpen}
            onKeyDown={(e) => {
              if (isOpen && (e.key === "Enter" || e.key === " ")) {
                onSelectStore(store.id);
              }
            }}
          >
            <h3 className="text-5xl font-bold text-blue flex-1 group-hover:text-black transition-colors duration-200">
              {store.name}
            </h3>

            <h1
              className={`shrink-0 group-hover:px-2 text-3xl rounded-md font-bold uppercase ${
                isOpen
                  ? "text-blue group-hover:bg-black group-hover:text-yellow transition-all duration-200"
                  : "text-black/30"
              }`}
            >
              is {store.status}
            </h1>
          </div>
        );
      })}
    </div>
  );
}
