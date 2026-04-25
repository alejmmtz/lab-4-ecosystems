import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface NavbarProps {
  name?: string;
  role?: string;
  onLogout?: () => void;
}

function obtainDayTimePeriod(): string {
  const hour: number = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning,";
  if (hour >= 12 && hour < 18) return "Good Afternoon,";
  if (hour >= 18 && hour < 22) return "Good Night,";
  return "Nice to see ya,";
}

export default function Navbar({ name, onLogout }: NavbarProps) {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 250);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div>
      <nav
        className={`bg-white/15 backdrop-blur-lg w-fit px-8 py-8 flex justify-between items-center z-50 fixed bottom-8 right-8 rounded-md transition-all duration-500 shadow-md ${
          isScrolled ? "translate-x-0" : "translate-x-150"
        }`}
      >
        <div className="flex-col items-center justify-between transition-all duration-500 ">
          <img
            src="/munchies-logo-03.svg "
            className="w-auto object-cover  mb-4 "
          />
          {name && (
            <h1 className="text-lg uppercase text-black mb-2">
              {obtainDayTimePeriod()} {name}!
            </h1>
          )}
          <button
            onClick={() => {
              if (onLogout) {
                onLogout();
                return;
              }

              localStorage.clear();
              navigate("/auth");
            }}
            className="w-full text-white font-bold py-2 uppercase  bg-blue hover:bg-black hover:text-white  rounded-md transition-all font-londrina cursor-pointer"
          >
            Logout
          </button>
        </div>
      </nav>
      <nav
        className={`flex justify-between items-center static  z-25 transition-all duration-500 ${
          isScrolled ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex-col w-fit items-center absolute top-12 left-12 justify-between transition-all  duration-500">
          <img
            src="/munchies-logo-02.svg"
            className="h-60 object-cover mb-4 invert"
          />
        </div>
      </nav>
    </div>
  );
}
