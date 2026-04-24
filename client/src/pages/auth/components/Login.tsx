import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../api/client";
import { AxiosError } from "axios";
import FormField from "./FormField";

interface LoginProps {
  onSwitchToRegister: () => void;
}

export default function Login({ onSwitchToRegister }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("access_token", data.session.access_token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          role: data.user.user_metadata.role,
          name: data.user.user_metadata.name,
        }),
      );
      navigate(`/${data.user.user_metadata.role}`);
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
        Welcome back to the Club!
      </h1>

      {error && (
        <div className="font-londrina border-2 border-blue bg-yellow text-blue text-lg font-medium px-4 py-4 mb-6 -mt-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <FormField
          label="Email"
          type="email"
          placeholder="munchies@mail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autocomplete="on"
        />
        <FormField
          label="Password"
          type="password"
          placeholder="shhh! This is Secret"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue text-white font-bold p-4 text-xl uppercase rounded-md hover:bg-black transition-colors duration-200 disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center font-londrina mb-2 cursor-pointer"
        >
          {isLoading ? "Hold up..." : "Login"}
        </button>
      </form>

      <button
        type="button"
        onClick={onSwitchToRegister}
        className="w-full border-2 border-blue text-blue font-bold p-4 text-xl uppercase rounded-md hover:bg-black hover:border-black hover:text-white transition-colors duration-200 font-londrina cursor-pointer"
      >
        Create Account
      </button>
    </div>
  );
}
