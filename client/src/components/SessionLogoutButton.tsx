import { useNavigate } from "react-router-dom";

interface SessionLogoutButtonProps {
  className?: string;
}

export default function SessionLogoutButton({
  className = "",
}: SessionLogoutButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => {
        localStorage.clear();
        navigate("/auth", { replace: true });
      }}
      className={`rounded-md border-2 border-black bg-white px-4 py-2 text-sm font-bold uppercase tracking-wide text-black transition-colors hover:bg-black hover:text-white ${className}`.trim()}
    >
      Logout
    </button>
  );
}
