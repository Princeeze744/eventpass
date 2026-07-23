import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionOrganizerId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = await getSessionOrganizerId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { events: { orderBy: { createdAt: "desc" } } },
  });
  if (!user) redirect("/login");

  const roleLabel =
    user.role === "planner" ? "Planner Console"
    : user.role === "host" ? "Host Console"
    : user.role === "vendor" ? "Vendor Console"
    : "My Events";

  return (
    <main className="min-h-[100svh] bg-[#070707] text-white px-5 py-10 sm:px-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-[11px] tracking-[0.35em] uppercase text-white/40 font-[family-name:var(--font-sans)]">{roleLabel}</p>
        <h1 className="mt-1 text-3xl font-[family-name:var(--font-serif)] text-[#e9d69a]">Welcome, {user.name}</h1>

        {(user.role === "planner" || user.role === "host") && (
          <Link href="/dashboard/new" className="mt-6 inline-block rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8912e] px-6 py-3 text-sm font-semibold text-black font-[family-name:var(--font-sans)]">+ Create New Event</Link>
        )}

        <div className="mt-8 space-y-3">
          {user.events.length === 0 && (
            <p className="rounded-3xl border border-white/8 bg-white/[0.03] p-8 text-center text-sm text-white/40 font-[family-name:var(--font-sans)]">
              {user.role === "guest" || user.role === "vendor"
                ? "No events yet. Your invitations will appear here."
                : "No events yet. Create your first one above."}
            </p>
          )}
          {user.events.map((ev) => (
            <Link key={ev.id} href={`/dashboard/${ev.slug}`} className="block rounded-3xl border border-white/8 bg-white/[0.03] p-6 hover:border-[#d4af37]/40">
              <p className="text-2xl font-[family-name:var(--font-serif)] text-[#e9d69a]">{ev.title}</p>
              <p className="mt-1 text-sm text-white/50 font-[family-name:var(--font-sans)]">{ev.eventDate} • {ev.venue}</p>
              <p className="mt-2 text-xs text-white/30 font-mono">/e/{ev.slug}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
