import { cn, initialsFromName } from "@/lib/utils";

interface AvatarProps {
  name?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClass = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
};

// Deterministic gradient based on name hash so each user gets a stable color.
function gradientFor(name?: string | null) {
  const palette = [
    "from-brand-500 to-indigo-500",
    "from-fuchsia-500 to-rose-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-sky-500 to-cyan-500",
    "from-violet-500 to-purple-600",
    "from-rose-500 to-red-500",
    "from-teal-500 to-emerald-600",
  ];
  if (!name) return palette[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return palette[Math.abs(hash) % palette.length];
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex select-none items-center justify-center rounded-full bg-gradient-to-br font-semibold uppercase text-white shadow-sm ring-2 ring-white dark:ring-ink-900",
        gradientFor(name),
        sizeClass[size],
        className,
      )}
      aria-hidden="true"
    >
      {initialsFromName(name)}
    </span>
  );
}
