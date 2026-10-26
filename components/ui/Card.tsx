import { ReactNode } from "react";

export function Card({
  children,
  className = "",
  padded = true,
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  glow?: boolean;
}) {
  return (
    <div
      className={`surface-card rounded-3xl ${glow ? "glass-glow" : ""} ${
        padded ? "p-5" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
