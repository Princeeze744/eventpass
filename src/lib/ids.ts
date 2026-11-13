export function normPhone(p: string | null | undefined): string {
  if (!p) return "";
  return p.replace(/\D/g, "").slice(-10);
}

/* ------------------------------------------------------------------
   A pass ID is a bearer token: whoever holds one can open that
   guest's pass. So its length is a security decision, not a
   cosmetic one.

   Six characters over this 32-character alphabet is about 1.07
   billion combinations. That is ample against a person typing, and
   nothing against a script - with a few thousand live passes, a few
   hundred guesses a second finds a real one inside an hour.

   Ten characters is about 1.1 QUADRILLION - a million times harder,
   which with rate limiting in front of it puts it out of reach for
   good. The cost is four more characters in a URL nobody types by
   hand.

   The alphabet leaves out 0/O, 1/I/L and U on purpose, so a code read
   aloud down a phone line or typed off a screen cannot be mistaken.

   Passes already issued keep working. This only governs new ones.
------------------------------------------------------------------ */
const PASS_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PASS_LENGTH = 10;

export function generatePassId(): string {
  /* crypto rather than Math.random: Math.random is predictable from
     prior outputs, which for a token is the whole ball game */
  const bytes = new Uint8Array(PASS_LENGTH);
  crypto.getRandomValues(bytes);

  let out = "";
  for (let i = 0; i < PASS_LENGTH; i++) {
    out += PASS_ALPHABET[bytes[i] % PASS_ALPHABET.length];
  }
  return `SB-${out}`;
}
