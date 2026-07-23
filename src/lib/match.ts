export function normPhone(p: string | null | undefined): string {
  if (!p) return "";
  const digits = p.replace(/\D/g, "");
  return digits.slice(-10); // last 10 digits — handles +234, 0-prefix, spaces
}

export function normName(n: string): string {
  return n.trim().toLowerCase().replace(/\s+/g, " ");
}

export function generatePassId(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `EP-2026-${num}`;
}
