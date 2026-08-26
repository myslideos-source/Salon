import Image from "next/image";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { icon: 18, text: "text-sm" },
  lg: { icon: 22, text: "text-lg" },
  xl: { icon: 26, text: "text-xl" },
  "2xl": { icon: 30, text: "text-2xl" },
} as const;

// Icon crop is 637x508px - keep that aspect ratio at any size.
const ICON_ASPECT = 508 / 637;

export function Logo({
  size = "lg",
  className,
  textClassName = "text-ink",
}: {
  size?: keyof typeof SIZES;
  className?: string;
  textClassName?: string;
}) {
  const { icon, text } = SIZES[size];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/brand/logo-icon.png"
        alt=""
        width={icon}
        height={Math.round(icon * ICON_ASPECT)}
        priority
      />
      <span className={cn("font-display", text, textClassName)}>
        Hallo<span className="text-bronze">Mia</span>
      </span>
    </span>
  );
}
