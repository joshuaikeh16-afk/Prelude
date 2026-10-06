import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "press-on-tap inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "bg-[var(--accent)] text-black hover:brightness-110",
  secondary:
    "border border-[var(--line)] bg-white/[0.04] text-[var(--text-primary)] hover:bg-white/[0.07]",
  ghost: "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
};

const sizes = {
  md: "px-5 py-3 text-sm",
  sm: "px-3.5 py-2 text-xs",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: {
  children: ReactNode;
  variant?: Variant;
  size?: keyof typeof sizes;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
