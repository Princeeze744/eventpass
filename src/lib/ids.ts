export function normPhone(p: string | null | undefined): string {
  if (!p) return "";
  return p.replace(/\D/g, "").slice(-10);
}

export function generatePassId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `SB-${out}`;
}
