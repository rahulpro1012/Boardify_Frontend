import { getInitials, stringToColor } from "../utils/colorUtils";

interface Props {
  email: string | undefined | null;
  username?: string; // Optional: if you have it, useful for tooltips
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export default function UserAvatar({
  email,
  username,
  size = "md",
  className = "",
}: Props) {
  const displayEmail = email || "?";
  const initials = getInitials(displayEmail);
  const backgroundColor = stringToColor(displayEmail);

  // Size mappings
  const sizeClasses = {
    sm: "w-6 h-6 text-[10px]", // For task cards
    md: "w-8 h-8 text-xs", // For comments/lists
    lg: "w-10 h-10 text-sm", // For headers
    xl: "w-24 h-24 text-4xl", // For profile modal
  };

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-white shadow-sm border border-white select-none shrink-0 ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor }}
      title={username || displayEmail} // Tooltip on hover
    >
      {initials}
    </div>
  );
}
