import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-ink text-cream hover:bg-ink/90 shadow-sm shadow-ink/10",
  bronze:
    "bg-bronze text-white hover:bg-bronze-dark shadow-sm shadow-bronze/20",
  outline:
    "border border-border-strong bg-white/5 text-ink hover:bg-sand",
  ghost: "text-ink-soft hover:bg-sand hover:text-ink",
  danger: "bg-danger text-white hover:bg-danger/90",
};

const sizes = {
  sm: "h-8 px-3 text-sm rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-base rounded-xl gap-2",
};

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";

export function LinkButton({
  href,
  className,
  variant = "primary",
  size = "md",
  children,
}: {
  href: string;
  className?: string;
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors duration-150",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </Link>
  );
}
