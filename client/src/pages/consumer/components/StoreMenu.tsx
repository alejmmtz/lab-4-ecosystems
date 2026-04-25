import { isAxiosError } from "axios";
import { useState, useEffect } from "react";
import { api } from "../../../api/client";
import { type Product } from "../../../types/types";
import EmptyState from "../../components/EmptyState";
import CartSidebar from "./CartSidebar";

interface StoreMenuProps {
  storeId: number;
  onOrderSuccess?: () => void;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const TIP = 2000;

export default function StoreMenu({ storeId, onOrderSuccess }: StoreMenuProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [destination, setDestination] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 250);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    api
      .get(`/api/product?storeId=${storeId}`)
      .then((res) => setProducts(res.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [storeId]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      return existing
        ? prev.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          )
        : [...prev, { product, quantity: 1 }];
    });
    if (cart.length === 0) setIsCartOpen(true);
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((i) =>
          i.product.id === productId
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i,
        )
        .filter((i) => i.quantity > 0);
    });
  };
  const removeFromCart = (id: number) =>
    setCart((prev) => prev.filter((i) => i.product.id !== id));

  const subtotal = cart.reduce(
    (acc, i) => acc + i.product.price * i.quantity,
    0,
  );
  const total = subtotal > 0 ? subtotal + TIP : 0;
  const totalItems = cart.reduce((acc, i) => acc + i.quantity, 0);
  const handleCheckout = async () => {
    if (!cart.length || !destination) return;
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        // 1. Forzamos a que storeId sea un número para evitar errores en la base de datos
        storeId: Number(storeId),
        subtotal,
        total,
        tip: TIP,
        destination,
        address: "Ubicación del mapa",
        indications: "",
        items: cart.map((i) => ({
          // 2. Enviamos tanto 'productId' como 'id' para cubrir lo que el backend espere
          productId: i.product.id,
          id: i.product.id,
          quantity: i.quantity,
          // 3. Enviamos tanto 'unitPrice' como 'price'
          unitPrice: i.product.price,
          price: i.product.price,
        })),
      };

      console.log("Enviando orden corregida:", payload);

      await api.post("/api/orders", payload);

      setCart([]);
      setDestination(null);
      setSuccess(true);

      if (onOrderSuccess) onOrderSuccess();

      setTimeout(() => {
        setSuccess(false);
        setIsCartOpen(false);
      }, 4000);
    } catch (error: unknown) {
      // ... resto de tu manejo de errores (igual que antes)
      const serverError = isAxiosError(error)
        ? error.response?.data?.message || "Error al procesar la orden"
        : "Error al procesar la orden";
      const errorPayload = isAxiosError(error)
        ? error.response?.data
        : undefined;

      console.error("Error del backend:", errorPayload);
      setError(serverError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative w-full bg-white">
      <button
        onClick={() => setIsCartOpen(true)}
        className={`fixed top-8 right-8 bg-yellow cursor-pointer rounded-md text-black px-4 py-2 font-londrina uppercase text-2xl z-30 hover:bg-black hover:text-yellow transition-all duration-500 flex items-center gap-2 ${
          isScrolled
            ? "translate-x-0 opacity-100 visible"
            : "translate-x-[150%] opacity-0 invisible"
        }`}
      >
        <span>Cart</span>
        <span>( {totalItems} )</span>
      </button>

      <div className="w-full">
        {isLoading ? (
          <div className="p-12 text-center text-xl font-figtree">
            Loading menu...
          </div>
        ) : (
          <>
            {products.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-6 border-black border-b-2 hover:bg-yellow transition-all duration-500 group"
              >
                <div className="flex-1">
                  <h3 className="text-4xl capitalize font-semibold font-londrina text-blue group-hover:text-black group-hover:ml-4 transition-all duration-500">
                    {p.name} <span className="text-2xl">( ${p.price} )</span>
                  </h3>
                  <p className="text-black/60 text-base font-figtree mt-1 group-hover:text-black group-hover:ml-4 transition-all duration-500">
                    {p.description || "No description available."}
                  </p>
                </div>
                <div className="flex items-center gap-8 shrink-0">
                  <button
                    onClick={() => addToCart(p)}
                    className="font-londrina rounded-md shrink-0 group-hover:mr-4 group-hover:px-2 cursor-pointer text-3xl font-bold uppercase text-blue group-hover:bg-black group-hover:text-yellow transition-all duration-200"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}

            {products.length === 0 && (
              <div className="p-12">
                <EmptyState message="No products in this store yet" />
              </div>
            )}
          </>
        )}
      </div>

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        removeFromCart={removeFromCart}
        updateQuantity={updateQuantity}
        subtotal={subtotal}
        total={total}
        tip={TIP}
        destination={destination}
        setDestination={setDestination}
        handleCheckout={handleCheckout}
        submitting={submitting}
        success={success}
        error={error}
      />
    </div>
  );
}
