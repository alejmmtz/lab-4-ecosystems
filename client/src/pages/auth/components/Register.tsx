import { useState } from "react";
import { api } from "../../../api/client";
import { AxiosError } from "axios";
import FormField from "./FormField";
import { ShoppingBasket, Store, PackageCheck } from "lucide-react";

interface RegisterProps {
  onSwitchToLogin: () => void;
}

interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role: string;
  storeName?: string;
}

const ROLES = [
  { value: "consumer", label: "Consumer", icon: <ShoppingBasket /> },
  { value: "store", label: "Store Owner", icon: <Store /> },
  { value: "delivery", label: "Delivery", icon: <PackageCheck /> },
];

export default function Register({ onSwitchToLogin }: RegisterProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("consumer");
  const [storeName, setStoreName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const payload: RegisterPayload = { email, password, name, role };
      if (role === "store") payload.storeName = storeName;
      await api.post("/auth/register", payload);
      alert("¡Registro exitoso! Por favor, inicia sesión.");
      onSwitchToLogin();
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Error en el servidor.")
          : "Ocurrió un error.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full justify-between">
      <h1 className="text-5xl border-t-8 uppercase border-blue pt-4 text-blue mb-12 mt-4">
        Join the Munchies Club!
      </h1>

      {error && (
        <div className="font-londrina border-2 border-blue bg-yellow text-blue text-lg font-medium px-4 py-4 mb-6 -mt-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <FormField
          label="name"
          placeholder="Munchy"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="flex flex-col">
          <p className="text-lg font-bold tracking-tight text-black mb-2">
            I am a…
          </p>
          <div className="flex gap-2 pt-1">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`flex-1 border-2 py-4 font-bold uppercase tracking-tight flex flex-col items-center gap-1 font-londrina transition-colors duration-200 cursor-pointer rounded-md ${
                  role === r.value
                    ? "bg-blue border-blue text-white"
                    : "border-blue text-blue "
                }`}
              >
                <span className="text-2xl">{r.icon}</span>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {role === "store" && (
          <FormField
            label="Store Name"
            placeholder="The Munchies Dealer"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            required
          />
        )}

        <FormField
          label="Email"
          type="email"
          placeholder="example@mail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <FormField
          label="Password"
          type="password"
          placeholder="Make sure to keep it a Secret"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue text-white font-bold p-4 text-xl uppercase rounded-md hover:bg-black transition-colors duration-200 disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center font-londrina mb-2 cursor-pointer"
        >
          {isLoading ? "Hold up..." : "Create Account"}
        </button>
      </form>

      <button
        type="button"
        onClick={onSwitchToLogin}
        className="w-full border-2 border-blue text-blue font-bold p-4 text-xl uppercase rounded-md hover:bg-black hover:border-black hover:text-white transition-colors duration-200 font-londrina cursor-pointer"
      >
        Back to Login
      </button>
    </div>
  );
}
