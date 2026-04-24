// pages/storeowner/components/StoreStatusBanner.tsx
import { Power } from "lucide-react";
import { type Store } from "../../../types/types";

interface StoreStatusBannerProps {
  store: Store;
  onToggle: () => void;
}

export default function StoreStatusBanner({
  store,
  onToggle,
}: StoreStatusBannerProps) {
  const isOpen = store.status === "open";

  return (
    <div
      className={`flex items-center justify-between border-b-2 border-black py-6 transition-all duration-500 cursor-pointer group hover:px-4 ${
        isOpen ? "hover:bg-yellow" : "hover:bg-black/5"
      }`}
      onClick={onToggle}
    >
      <div className="flex items-baseline gap-6">
        <h2 className="text-5xl font-bold font-londrina text-blue group-hover:text-black transition-colors duration-200">
          {store.name}
        </h2>
        <span
          className={`text-3xl font-londrina font-bold uppercase transition-colors duration-200 group-hover:text-black ${
            isOpen ? "text-blue" : "text-black/30"
          }`}
        >
          is {store.status}
        </span>
      </div>

      {/* stopPropagation prevents double-firing since the parent div already calls onToggle */}
      <button
        onClick={(e) => e.stopPropagation()}
        className={`shrink-0 flex items-center gap-2 text-2xl font-bold font-londrina uppercase rounded-md group-hover:px-3 transition-all duration-200 group-hover:bg-black group-hover:text-yellow ${
          isOpen ? "text-blue" : "text-black/30"
        }`}
      >
        <Power size={20} />
        Toggle
      </button>
    </div>
  );
}
