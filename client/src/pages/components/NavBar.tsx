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

  return (
    <div>
      <nav className="bg-white/15 backdrop-blur-lg w-fit px-8 py-8 flex justify-between items-center z-50 fixed bottom-8 right-8 rounded-md shadow-md">
        <div className="flex-col items-center justify-between">
          <img
            src="/munchies-logo-03.svg"
            className="w-auto object-cover mb-4"
            alt="Munchies Logo"
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
            className="w-full text-white font-bold py-2 uppercase bg-blue hover:bg-black hover:text-white rounded-md transition-all font-londrina cursor-pointer"
          >
            Logout
          </button>
        </div>
      </nav>
    </div>
  );
}
