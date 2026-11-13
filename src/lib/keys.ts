import crypto from "crypto";

/* ------------------------------------------------------------------
   Event keys: ADM-XXXXXXXX and GATE-XXXXXXXX.

   These are the main credential on an event. The admin key opens the
   whole guest list; the gate key opens the door. They were generated
   with Math.random, which is not a random number generator in any
   sense that matters here - it is a fast, predictable sequence, and
   somebody who sees a few of its outputs can work out the rest. Every
   key issued by one running instance came from the same sequence.

   crypto.randomBytes has no such relationship between one value and
   the next.

   Eight characters rather than six takes the space from about a
   billion to about a trillion. With a limit in front of the routes
   that accept them, guessing is finished either way - but a credential
   is the wrong place to be stingy.

   The alphabet omits 0/O, 1/I/L and U, because these get read aloud
   down a phone line to an usher who is standing at a door.

   Keys already issued keep working. This governs new ones.
------------------------------------------------------------------ */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LENGTH = 8;

export function makeEventKey(prefix: string): string {
  const bytes = crypto.randomBytes(LENGTH);
  let out = "";
  for (let i = 0; i < LENGTH; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return `${prefix}-${out}`;
}
