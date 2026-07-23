export type Guest = {
  passId: string;
  name: string;
  tier: "VIP Guest" | "Family" | "Guest";
  table: string;
  checkedIn: boolean;
  checkedInAt?: string;
};

export const eventInfo = {
  event: "Chioma & Obinna",
  tagline: "A Celebration of Love",
  date: "Sat, Dec 19, 2026",
  time: "12:00 PM",
  venue: "Aztech Arcum Event Center",
  address: "77 Ken Saro Wiwa Road, Rumuola, Port Harcourt",
};
