import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { getSessionOrganizerId } from "@/lib/auth";
import { getStaff } from "@/lib/staff";
import MyEvents from "@/components/MyEvents";
import AccountMenu from "@/components/AccountMenu";
import { Plus, Trash2, ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = await getSessionOrganizerId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { events: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } } },
  });
  if (!user) redirect("/login");

  const staff = await getStaff();
  const isOrganiser = user.role === "planner" || user.role === "host";

  const roleLabel =
    user.role === "planner" ? "Planner Console"
    : user.role === "host" ? "Host Console"
    : user.role === "vendor" ? "Vendor Hub"
    : "My Events";

  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea] px-5 py-6 sm:px-8">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/4 h-[45vh] w-[55vw] sb-glow-green" />
        <div className="absolute bottom-0 right-0 h-[35vh] w-[45vw] sb-glow-warm" />
      </div>

      <div className="relative mx-auto max-w-[1000px]">
        <div className="sb-sticky -mx-5 mb-8 px-5 py-3.5 sm:-mx-8 sm:px-8">
          <div className="mx-auto flex max-w-[1000px] items-center justify-between">
            <Link href="/" className="group flex items-center gap-3">
              <Image src="/brand/logo-mark.jpg" alt="Story Box" width={30} height={30} className="rounded-lg transition-transform duration-500 group-hover:scale-105" />
              <span className="text-[10px] uppercase tracking-[0.4em] text-white/45 transition-colors group-hover:text-[#c9a227] font-[family-name:var(--font-sans)]">Story&nbsp;Box</span>
            </Link>
            <AccountMenu name={user.name} role={user.role} level={staff?.level} />
          </div>
        </div>

        <p className="text-[10px] sb-eyebrow text-white/40 font-[family-name:var(--font-sans)]">{roleLabel}</p>
        <h1 className="mt-2 font-[family-name:var(--font-serif)] text-4xl text-[#c9a227] sb-display sm:text-5xl">Welcome, {user.name}</h1>

        {isOrganiser && (
          <>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/dashboard/new" className="sb-btn sb-sheen flex items-center gap-2 px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-semibold font-[family-name:var(--font-sans)]">
                <Plus className="h-3.5 w-3.5" /> Create New Event
              </Link>
              <Link href="/dashboard/trash" className="sb-ghost flex items-center gap-2 px-6 py-3 text-[10px] uppercase tracking-[0.15em] text-white/60 font-[family-name:var(--font-sans)]">
                <Trash2 className="h-3.5 w-3.5" /> Trash
              </Link>
            </div>

            <div className="mt-8 space-y-3">
              {user.events.length === 0 && (
                <p className="sb-surface p-10 text-center text-[13px] text-white/40 font-[family-name:var(--font-sans)]">
                  No events yet. Create your first one above.
                </p>
              )}
              {user.events.map((ev) => (
                <Link key={ev.id} href={`/dashboard/${ev.slug}`} className="sb-surface sb-lift group block p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-[family-name:var(--font-serif)] text-2xl text-[#e9d69a]">{ev.title}</p>
                      <p className="mt-1 text-[13px] text-white/45 font-[family-name:var(--font-sans)]">{ev.eventType} · {ev.eventDate} · {ev.venue}</p>
                      <p className="mt-2 font-mono text-[11px] text-white/25">/e/{ev.slug}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-white/20 transition-all duration-500 group-hover:text-[#c9a227] group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-12 sb-hairline" />
            <div className="mt-8">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/35 font-[family-name:var(--font-sans)]">Your own passes</p>
              <p className="mt-1 text-[11px] text-white/25 font-[family-name:var(--font-sans)]">Events where your phone number is registered as a guest or vendor.</p>
              <MyEvents role={user.role} />
            </div>
          </>
        )}

        {!isOrganiser && <MyEvents role={user.role} />}
      </div>
    </main>
  );
}
