import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, callerIp, tooMany, LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------
   The handful of things a guest-facing page needs in order to look
   like the host's invitation rather than ours.

   Deliberately narrow and deliberately public: only fields already on
   show at /e/[slug]. No guest records, no keys, no counts. The RSVP
   page is a client component with no session, so it needs somewhere
   to read a picture from, and this is that - and nothing more.

   Public still means limited. Nothing here is worth stealing, but an
   unlimited endpoint is a free way to make the database work on
   somebody else's behalf, and that is reason enough.
------------------------------------------------------------------ */
export async function GET(req: NextRequest) {
  const gate = await rateLimit(`brand:${callerIp(req)}`, LIMITS.read.limit, LIMITS.read.window);
  if (!gate.ok) return tooMany(gate.retryAfter);

  const slug = String(req.nextUrl.searchParams.get("slug") || "").trim();
  if (!slug) return NextResponse.json({ error: "Missing slug." }, { status: 400 });

  const e = await prisma.event.findUnique({
    where: { slug },
    select: {
      title: true,
      tagline: true,
      accentColor: true,
      inviteImage: true,
      coverImage: true,
      logoUrl: true,
      deletedAt: true,
    },
  });

  if (!e || e.deletedAt) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  return NextResponse.json({
    title: e.title,
    tagline: e.tagline,
    accentColor: e.accentColor || "#c9a227",
    /* same order of preference as the link preview, so the page a
       guest opens matches the picture that brought them there */
    image: e.inviteImage || e.coverImage || "",
    logoUrl: e.logoUrl || "",
  });
}
