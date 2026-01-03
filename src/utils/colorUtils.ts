// 1. A nice palette of colors (Google/Trello style)
const COLORS = [
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#eab308", // yellow-500
  "#22c55e", // green-500
  "#06b6d4", // cyan-500
  "#3b82f6", // blue-500
  "#6366f1", // indigo-500
  "#a855f7", // purple-500
  "#ec4899", // pink-500
  "#64748b", // slate-500
];

export function getInitials(name: string): string {
  if (!name) return "?";
  return name.slice(0, 1).toUpperCase();
}

/**
 * Returns a consistent color for a given string (e.g. username/email).
 * "test@gmail.com" will ALWAYS return the same color from the palette.
 */
export function stringToColor(str: string): string {
  if (!str) return COLORS[0];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use modulo to pick a color from the array
  // Math.abs handles negative hash codes
  const index = Math.abs(hash % COLORS.length);
  return COLORS[index];
}
