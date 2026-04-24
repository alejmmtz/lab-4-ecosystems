// pages/storeowner/components/AddProductForm.tsx
import { useState } from "react";
import { api } from "../../../api/client";

interface AddProductFormProps {
  storeId: number;
  onCreated?: () => void;
}

interface ProductDraft {
  name: string;
  price: string;
  description: string;
}

const EMPTY: ProductDraft = { name: "", price: "", description: "" };

export default function AddProductForm({
  storeId,
  onCreated,
}: AddProductFormProps) {
  const [product, setProduct] = useState<ProductDraft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await api.post("/api/product", {
        storeId, // ← previously missing: products were created without an owner store
        name: product.name,
        price: Number(product.price),
        description: product.description,
      });
      setProduct(EMPTY);
      onCreated?.();
    } catch (err) {
      console.error("Error creating product:", err);
      setError("Could not save the product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = !!product.name && !!product.price && !saving;

  return (
    <aside className="w-80 shrink-0 border-2 border-black p-6 sticky top-8">
      <h2 className="text-4xl font-bold font-londrina text-blue border-b-2 border-black pb-3 mb-6">
        Add Item
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase font-figtree text-black/50 tracking-widest">
            Name
          </label>
          <input
            type="text"
            placeholder="e.g. Bandeja Paisa"
            value={product.name}
            onChange={(e) => setProduct({ ...product, name: e.target.value })}
            className="border-b-2 border-black py-2 outline-none font-figtree text-lg placeholder:text-black/20 bg-transparent focus:border-blue transition-colors duration-200"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase font-figtree text-black/50 tracking-widest">
            Price
          </label>
          <input
            type="number"
            placeholder="0"
            min={0}
            value={product.price}
            onChange={(e) => setProduct({ ...product, price: e.target.value })}
            className="border-b-2 border-black py-2 outline-none font-figtree text-lg placeholder:text-black/20 bg-transparent focus:border-blue transition-colors duration-200"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase font-figtree text-black/50 tracking-widest">
            Description
          </label>
          <textarea
            placeholder="What makes it special?"
            value={product.description}
            onChange={(e) =>
              setProduct({ ...product, description: e.target.value })
            }
            rows={3}
            className="border-b-2 border-black py-2 outline-none font-figtree text-base placeholder:text-black/20 resize-none bg-transparent focus:border-blue transition-colors duration-200"
          />
        </div>

        {error && (
          <p className="text-sm font-figtree font-bold text-red-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-2 bg-blue text-white font-bold font-londrina text-2xl uppercase py-3 hover:bg-black transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </aside>
  );
}
