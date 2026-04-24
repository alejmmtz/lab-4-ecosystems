import { BadgeAlert } from "lucide-react";

interface EmptyStateProps {
  message: string;
}

export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="animate-pulse text-left flex items-center gap-4">
      <BadgeAlert className="text-blue" />

      <p className="text-blue text-2xl font-bold uppercase font-londrina">
        {message}
      </p>
      <BadgeAlert className="text-blue" />
    </div>
  );
}
