import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionOrganizerId } from "@/lib/auth";
import MyEvents from "@/components/MyEvents";
import AccountMenu from "@/components/AccountMenu";
import { getStaff } from "@/lib/staff";

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

  if (user.role === "host" && user.events.length === 1 && !staff) {
    redirect(`/e/${user.events[0].slug}/host?k=${user.events[0].adminKey}`);
  }

  const isOrganiser = user.role === "planner" || user.role === "host";

  const roleLabel =
    user.role === "planner" ? "Planner Console"
    : user.role === "host" ? "Host Console"
    : user.role === "vendor" ? "Vendor Hub"
    : "My Events";

  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea] px-5 py-10 sm:px-8">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/4 h-[45vh] w-[55vw] sb-glow-green" />
      </div>

      <div className="relative mx-auto max-w-[900px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.35em] uppercase text-white/40 font-[family-name:var(--font-sans)]">{roleLabel}</p>
            <h1 className="mt-1 font-[family-name:var(--font-serif)] text-4xl sb-display text-[#c9a227]">Welcome, {user.name}</h1>
          </div>
          <AccountMenu name={user.name} role={user.role} level={staff?.level} />
        </div>

        {isOrganiser ? (
          <>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard/new" className="sb-btn sb-sheen px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#080807] font-[family-name:var(--font-sans)]">+ Create New Event</Link>
              <Link href="/dashboard/trash" className="sb-ghost px-6 py-3 text-[10px] uppercase tracking-[0.15em] text-white/60 font-[family-name:var(--font-sans)]">Trash</Link>
            </div>

            <div className="mt-8 space-y-3">
              {user.events.length === 0 && (
                <p className="sb-surface p-8 text-center text-sm text-white/40 font-[family-name:var(--font-sans)]">
                  No events yet. Create your first one above.
                </p>
              )}
              {user.events.map((ev) => (
                <Link key={ev.id} href={`/dashboard/${ev.slug}`} className="block sb-surface p-6 hover:border-[#c9a227]/40">
                  <p className="font-[family-name:var(--font-serif)] text-2xl text-[#e9d69a]">{ev.title}</p>
                  <p className="mt-1 text-sm text-white/45 font-[family-name:var(--font-sans)]">{ev.eventDate} • {ev.venue}</p>
                  <p className="mt-2 font-mono text-xs text-white/30">/e/{ev.slug}</p>
                </Link>
              ))}
            </div>

            <div className="mt-10 border-t border-white/[0.07] pt-8">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/35 font-[family-name:var(--font-sans)]">Events you are attending</p>
              <MyEvents role={user.role} />
            </div>
          </>
        ) : (
          <MyEvents role={user.role} />
        )}
      </div>
    </main>
  );
}
