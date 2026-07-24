import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { prisma } from "@/lib/db";
import { getSessionOrganizerId } from "@/lib/auth";
import { ArrowLeft, Users, BadgeCheck, DoorOpen, KeyRound } from "lucide-react";
import SharePanel from "@/components/SharePanel";

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

  const card = "sb-surface sb-lift";

  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea] px-5 py-10 sm:px-8">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/4 h-[45vh] w-[55vw] sb-glow-green" />
      </div>

      <div className="relative mx-auto max-w-[1100px]">
        <TopBar back={"/dashboard"} backLabel="All events" />
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/45 font-[family-name:var(--font-sans)]">
          <ArrowLeft className="h-3.5 w-3.5" /> All events
        </Link>

        <p className="mt-6 text-[10px] sb-eyebrow text-[#c9a227] font-[family-name:var(--font-sans)]">{event.tagline}</p>
        <h1 className="mt-2 font-[family-name:var(--font-serif)] text-5xl sb-display sm:text-6xl">{event.title}</h1>
        <p className="mt-3 text-[13px] text-white/45 font-[family-name:var(--font-sans)]">
          {event.eventDate} · {event.eventTime} · {event.venue}
        </p>

        {event.approval !== "approved" && (
          <div className={`mt-6 rounded-3xl border p-6 ${event.approval === "rejected" ? "border-red-500/30 bg-red-500/[0.05]" : "border-[#c9a227]/30 bg-[#c9a227]/[0.06]"}`}>
            <p className="text-[10px] uppercase tracking-[0.3em] font-[family-name:var(--font-sans)]" style={{ color: event.approval === "rejected" ? "#f87171" : "#c9a227" }}>
              {event.approval === "rejected" ? "Not approved" : event.approval === "suspended" ? "Suspended" : "Awaiting activation"}
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-white/60 font-[family-name:var(--font-sans)]">
              {event.reviewNote
                ? event.reviewNote
                : event.approval === "rejected"
                ? "This event was not approved. Please contact Story Box."
                : event.approval === "suspended"
                ? "This event has been suspended. Please contact Story Box."
                : "Your event is set up and waiting to be activated by Story Box. You can keep building the website and guest list in the meantime — registration and scanning open once it is live."}
            </p>
          </div>
        )}

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { k: total, v: "Registered", icon: Users },
            { k: pending, v: "Pending", icon: KeyRound },
            { k: approved, v: "Approved", icon: BadgeCheck },
            { k: checkedIn, v: "Checked in", icon: DoorOpen },
          ].map((s) => (
            <div key={s.v} className={`${card} p-5`}>
              <s.icon className="h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
              <p className="mt-5 font-[family-name:var(--font-serif)] text-4xl sb-display">{s.k}</p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.25em] text-white/40 font-[family-name:var(--font-sans)]">{s.v}</p>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <SharePanel
            slug={event.slug}
            title={event.title}
            eventDate={event.eventDate}
            venue={event.venue}
            adminKey={event.adminKey}
            usherKey={event.usherKey}
          />
        </div>
        <p className="mt-8 text-[11px] text-white/30 font-[family-name:var(--font-sans)]">
          Registration mode: {event.approvalMode === "auto" ? "Automatic approval" : "Host approves each guest"}
          {event.capacity ? ` · Capacity ${event.capacity}` : ""}
        </p>
      </div>
    </main>
  );
}