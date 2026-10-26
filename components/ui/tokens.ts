export const accentColors = {
  red: "#ff3b64",
  purple: "#8b5cf6",
  blue: "#3b82f6",
  green: "#22c55e",
  orange: "#f59e0b",
} as const;

export type AccentColor = keyof typeof accentColors;

export const accentList: Array<{ id: AccentColor; name: string; hex: string }> = [
  { id: "red", name: "Red", hex: accentColors.red },
  { id: "purple", name: "Purple", hex: accentColors.purple },
  { id: "blue", name: "Blue", hex: accentColors.blue },
  { id: "green", name: "Green", hex: accentColors.green },
  { id: "orange", name: "Orange", hex: accentColors.orange },
];

export function accentHex(color: string | null | undefined): string {
  return accentColors[(color ?? "purple") as AccentColor] ?? accentColors.purple;
}
