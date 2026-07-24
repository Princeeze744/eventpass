import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionOrganizerId } from "@/lib/auth";
import RestoreButton from "@/components/RestoreButton";
import { ArrowLeft, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TrashPage() {
  const userId = await getSessionOrganizerId();
  if (!userId) redirect("/login");

  const events = await prisma.event.findMany({
    where: { ownerId: userId, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    include: { _count: { select: { guests: true } } },
  });

  const card = "rounded-3xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-sm";

  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea] px-5 py-10 sm:px-8">
      <div className="relative mx-auto max-w-[860px]">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-white/45 font-[family-name:var(--font-sans)]">
          <ArrowLeft className="h-3.5 w-3.5" /> Console
        </Link>

        <h1 className="mt-6 font-[family-name:var(--font-serif)] text-5xl">
          <span className="italic text-[#c9a227]">Trash.</span>
        </h1>
        <p className="mt-3 text-[13px] text-white/45 font-[family-name:var(--font-sans)]">
          Deleted events stay here with all their guest data until you restore or permanently delete them.
        </p>

        <div className="mt-8 space-y-3">
          {events.length === 0 && (
            <div className={`${card} p-10 text-center`}>
              <Trash2 className="mx-auto h-5 w-5 text-white/25" strokeWidth={1.6} />
              <p className="mt-4 text-[13px] text-white/35 font-[family-name:var(--font-sans)]">Trash is empty.</p>
            </div>
          )}

          {events.map((ev) => (
            <div key={ev.id} className={`${card} flex flex-wrap items-center justify-between gap-4 p-6`}>
              <div>
                <p className="font-[family-name:var(--font-serif)] text-2xl text-[#e9d69a]">{ev.title}</p>
                <p className="mt-1 text-[12px] text-white/40 font-[family-name:var(--font-sans)]">
                  {ev.eventDate} · {ev._count.guests} guests · deleted {ev.deletedAt ? new Date(ev.deletedAt).toLocaleDateString() : ""}
                </p>
              </div>
              <RestoreButton slug={ev.slug} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
