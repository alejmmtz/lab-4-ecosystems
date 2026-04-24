import { useEffect } from "react";
import { PanelRightClose, Minus, Plus } from "lucide-react";
import { type Product } from "../../../types/types";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  removeFromCart: (id: number) => void;
  updateQuantity?: (id: number, delta: number) => void;
  subtotal: number;
  total: number;
  tip: number;
  destination: { lat: number; lng: number } | null;
  setDestination: (val: { lat: number; lng: number }) => void;
  handleCheckout: () => void;
  submitting: boolean;
  success: boolean;
  error: string;
}

function LocationMarker({
  position,
  setPosition,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  position: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setPosition: any;
}) {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return position === null ? null : <Marker position={position}></Marker>;
}

export default function CartSidebar({
  isOpen,
  onClose,
  cart,

  updateQuantity,
  subtotal,
  total,
  tip,
  destination,
  setDestination,
  handleCheckout,
  submitting,
  success,
  error,
}: CartSidebarProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const defaultCenter = { lat: 3.4516, lng: -76.532 };

  const displayTip = cart.length > 0 ? tip : 0;

  return (
    <>
      <div
        className={`fixed inset-0 backdrop-blur-lg z-40 transition-opacity duration-500 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 h-full w-96 border-l-2 border-black/25 bg-white flex flex-col z-50 transform transition-all duration-500 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="bg-blue px-6 py-4 flex justify-between items-center">
          <h3 className="text-white text-3xl tracking-tight font-londrina">
            Your Order
          </h3>
          <button
            onClick={onClose}
            className="text-white text-4xl font-londrina cursor-pointer hover:opacity-80 transition-opacity"
          >
            <PanelRightClose />
          </button>
        </div>

        <div className="flex-1 px-6 py-4 divide-y divide-black/10 overflow-y-auto">
          {cart.length === 0 && (
            <p className="text-black/30 text-lg font-figtree py-6 text-center">
              Add items to get started
            </p>
          )}
          {cart.map((i) => (
            <div
              key={i.product.id}
              className="flex justify-between items-center py-4"
            >
              <div className="flex-1">
                <p className="font-bold capitalize font-londrina text-black text-md leading-none mb-1">
                  <span className="text-xl mr-2"> {i.product.name}</span>

                  <span className="text-md text-black/75">
                    ( ${i.product.price} )
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-3 text-black/60 font-figtree font-medium">
                {updateQuantity ? (
                  <div className="flex items-center gap-2 border border-black/20 rounded px-1">
                    <button
                      onClick={() => updateQuantity(i.product.id, -1)}
                      className="hover:text-blue cursor-pointer"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-4 text-center">{i.quantity}</span>
                    <button
                      onClick={() => updateQuantity(i.product.id, 1)}
                      className="hover:text-blue cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                ) : (
                  <span>{i.quantity} ×</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t-2 border-black/25 px-6 py-4 space-y-2 text-sm font-figtree">
          <div className="flex justify-between text-base text-black/50 font-bold">
            <h3>Subtotal</h3>
            <h3>${subtotal}</h3>
          </div>
          <div className="flex justify-between text-base text-black/50 font-bold">
            <h3>Tip</h3>
            <h3>${displayTip}</h3>
          </div>
          <div className="flex justify-between font-bold text-2xl text-black mt-2 pt-2">
            <h3>Total</h3>
            <h3>${total}</h3>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="flex flex-col gap-2 mb-4">
            <p className="text-sm font-bold tracking-tight text-black font-figtree">
              Select delivery location
            </p>

            {/* EL MAPA REEMPLAZA AL INPUT TEXT */}
            <div className="h-48 w-full rounded-md overflow-hidden border-2 border-black z-0 relative">
              <MapContainer
                center={destination || defaultCenter}
                zoom={14}
                style={{ height: "100%", width: "100%", zIndex: 0 }}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <LocationMarker
                  position={destination}
                  setPosition={setDestination}
                />
              </MapContainer>
            </div>

            {!destination && (
              <p className="text-red-500 text-xs font-figtree font-bold">
                Please click on the map to select a destination.
              </p>
            )}
          </div>

          {success && (
            <div className="font-londrina border-2 border-black bg-yellow text-black text-xl font-medium px-4 py-3 mb-3 uppercase text-center">
              Order placed!
            </div>
          )}
          {error && (
            <div className="font-londrina border-2 border-blue bg-white text-blue text-lg font-medium px-4 py-3 mb-3">
              {error}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={submitting || !cart.length || !destination}
            className="w-full bg-blue text-white font-bold p-4 text-2xl uppercase hover:bg-black duration-500 disabled:opacity-40 disabled:cursor-not-allowed font-londrina cursor-pointer transition-all"
          >
            {submitting ? "Placing…" : "Order"}
          </button>
        </div>
      </div>
    </>
  );
}
