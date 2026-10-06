import { ReactNode } from "react";

export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`surface-card rounded-3xl ${padded ? "p-5" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
