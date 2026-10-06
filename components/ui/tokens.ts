export const accentColors = {
  red: "#ff3b64",
  purple: "#8b5cf6",
  blue: "#3b82f6",
  green: "#22c55e",
  orange: "#f59e0b",
} as const;

export type AccentColor = keyof typeof accentColors;

export function accentHex(color: string | null | undefined): string {
  return accentColors[(color ?? "red") as AccentColor] ?? accentColors.red;
}
