import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionOrganizerId } from "@/lib/auth";
import { ArrowLeft, Users, BadgeCheck, DoorOpen, KeyRound } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EventConsole({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const userId = await getSessionOrganizerId();
  if (!userId) redirect("/login");

  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
    include: { guests: true },
  });
  if (!event) notFound();
  if (event.ownerId !== userId) redirect("/dashboard");

  const total = event.guests.length;
  const approved = event.guests.filter((g) => g.status === "approved").length;
  const pending = event.guests.filter((g) => g.status === "pending").length;
  const checkedIn = event.guests.filter((g) => g.checkedIn).length;

  const card = "rounded-3xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-sm";

  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea] px-5 py-10 sm:px-8">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/4 h-[45vh] w-[55vw] rounded-full bg-[#1c4634]/25 blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-[1100px]">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/45 font-[family-name:var(--font-sans)]">
          <ArrowLeft className="h-3.5 w-3.5" /> All events
        </Link>

        <p className="mt-6 text-[10px] uppercase tracking-[0.4em] text-[#c9a227] font-[family-name:var(--font-sans)]">{event.tagline}</p>
        <h1 className="mt-2 font-[family-name:var(--font-serif)] text-5xl sm:text-6xl">{event.title}</h1>
        <p className="mt-3 text-[13px] text-white/45 font-[family-name:var(--font-sans)]">
          {event.eventDate} · {event.eventTime} · {event.venue}
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { k: total, v: "Registered", icon: Users },
            { k: pending, v: "Pending", icon: KeyRound },
            { k: approved, v: "Approved", icon: BadgeCheck },
            { k: checkedIn, v: "Checked in", icon: DoorOpen },
          ].map((s) => (
            <div key={s.v} className={`${card} p-5`}>
              <s.icon className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
              <p className="mt-5 font-[family-name:var(--font-serif)] text-4xl">{s.k}</p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]">{s.v}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className={`${card} p-6`}>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]">Share with guests</p>
            <p className="mt-3 break-all rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-[12px] text-[#c9a227]">/e/{event.slug}/rsvp</p>
            <p className="mt-4 text-[12px] leading-relaxed text-white/45 font-[family-name:var(--font-sans)]">
              Send this link on WhatsApp or print it on the invitation. Guests register themselves and receive a verified pass.
            </p>
          </div>

          <div className={`${card} p-6`}>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-[family-name:var(--font-sans)]">Access keys</p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-[family-name:var(--font-sans)]">Host / Admin</span>
                <span className="font-mono text-[13px] text-[#c9a227]">{event.adminKey}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-[family-name:var(--font-sans)]">Ushers / Gate</span>
                <span className="font-mono text-[13px] text-[#c9a227]">{event.usherKey}</span>
              </div>
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-white/45 font-[family-name:var(--font-sans)]">
              Give the admin key only to the host. Give the gate key only to ushers.
            </p>
          </div>
        </div>

        <p className="mt-8 text-[11px] text-white/30 font-[family-name:var(--font-sans)]">
          Registration mode: {event.approvalMode === "auto" ? "Automatic approval" : "Host approves each guest"}
          {event.capacity ? ` · Capacity ${event.capacity}` : ""}
        </p>
      </div>
    </main>
  );
}