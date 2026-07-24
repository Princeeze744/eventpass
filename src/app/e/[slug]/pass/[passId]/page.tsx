import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import EventPass from "@/components/EventPass";

export const dynamic = "force-dynamic";

export default async function PassPage({
  params,
}: {
  params: Promise<{ slug: string; passId: string }>;
}) {
  const { slug, passId } = await params;
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) notFound();

  const guest = await prisma.guest.findFirst({
    where: { eventId: event.id, passId: decodeURIComponent(passId).trim() },
  });

  if (!guest || guest.status === "declined") {
    return (
      <main className="min-h-[100svh] bg-[#080807] text-[#f5f1ea] flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-[family-name:var(--font-serif)] text-4xl text-[#c9a227]">
          {guest ? "Pass Revoked" : "Pass Not Found"}
        </h1>
        <p className="mt-3 max-w-sm text-[13px] text-white/45 font-[family-name:var(--font-sans)]">
          {guest ? "This pass is no longer valid. Please contact the host." : "This pass is not on the guest list."}
        </p>
        <div className="mt-7 flex gap-3">
          <a href={`/e/${slug}/rsvp`} className="rounded-full bg-[#f5f1ea] px-7 py-3 text-[11px] uppercase tracking-[0.2em] text-[#080807] font-[family-name:var(--font-sans)]">Register</a>
          <a href={`/e/${slug}/mypass`} className="rounded-full border border-white/12 px-7 py-3 text-[11px] uppercase tracking-[0.2em] text-white/70 font-[family-name:var(--font-sans)]">Find My Pass</a>
        </div>
      </main>
    );
  }

  return (
    <EventPass
      slug={slug}
      passId={guest.passId}
      name={guest.name}
      tier={guest.tier}
      table={guest.table}
      section={guest.section}
      seat={guest.seat}
      partySize={guest.partySize}
      status={guest.status}
      rsvpAnswer={guest.rsvpAnswer}
      checkedInOnline={guest.checkedInOnline}
      event={{
        title: event.title,
        tagline: event.tagline,
        eventDate: event.eventDate,
        eventTime: event.eventTime,
        venue: event.venue,
      }}
    />
  );
}