import { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";

export default function Auth() {
  const [view, setView] = useState<"login" | "register">("login");

  return (
    <div className="h-screen w-full flex overflow-hidden">
      <div className="w-1/2 relative bg-center bg-cover shrink-0 bg-[url('https://images.pexels.com/photos/33929957/pexels-photo-33929957.jpeg')]">
        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-transparent to-transparent" />
        <div className="absolute bottom-8 left-8 right-4">
          <p className="text-white text-5xl pr-22 font-bold tracking-tighter font-londrina">
            Order a Munchie wherever and whenever you want
          </p>
        </div>
      </div>
      <div className="w-1/2 p-18 bg-white flex flex-col overflow-y-auto transition-all">
        <img
          src="/munchies-logo-03.svg"
          className="w-full h-auto object-contain object-left"
          style={{ animation: "fadeUp 1.0s ease forwards" }}
        />

        <div className="flex-1 flex flex-col justify-center">
          <div key={view} style={{ animation: "fadeUp 0.50s ease forwards" }}>
            {view === "login" ? (
              <Login onSwitchToRegister={() => setView("register")} />
            ) : (
              <Register onSwitchToLogin={() => setView("login")} />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-8">
          <p className="text-sm font-bold tracking-tight text-black/40">
            delivermymunchies.com
          </p>
          <p className="text-sm font-bold tracking-tight text-black/40">
            @mymunchiesclub
          </p>
        </div>
      </div>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(-25px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
