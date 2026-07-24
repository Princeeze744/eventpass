import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EventLanding({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) notFound();

  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea] flex flex-col items-center justify-center px-5 py-14">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[45vh] w-[80vw] rounded-full bg-[#1c4634]/25 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-[35vh] w-[50vw] rounded-full bg-[#c9a227]/[0.07] blur-[110px]" />
      </div>

      <div className="relative w-full max-w-[620px] text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#c9a227] font-[family-name:var(--font-sans)]">{event.tagline}</p>
        <h1 className="mt-4 font-[family-name:var(--font-serif)] text-6xl leading-[0.95] sm:text-7xl">{event.title}</h1>
        <div className="mx-auto mt-6 h-px w-24 bg-gradient-to-r from-transparent via-[#c9a227]/70 to-transparent" />

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-5">
            <CalendarDays className="mx-auto h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
            <p className="mt-3 text-[13px] text-[#f5f1ea] font-[family-name:var(--font-sans)]">{event.eventDate}</p>
            <p className="text-[12px] text-white/45 font-[family-name:var(--font-sans)]">{event.eventTime}</p>
          </div>
          <div className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-5">
            <MapPin className="mx-auto h-4 w-4 text-[#c9a227]" strokeWidth={1.6} />
            <p className="mt-3 text-[13px] text-[#f5f1ea] font-[family-name:var(--font-sans)]">{event.venue}</p>
            <p className="text-[12px] text-white/45 font-[family-name:var(--font-sans)]">{event.address}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href={`/e/${event.slug}/rsvp`} className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#f5f1ea] px-8 text-[11px] uppercase tracking-[0.2em] text-[#080807] font-[family-name:var(--font-sans)] sm:w-auto">
            Register Now <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link href={`/e/${event.slug}/mypass`} className="flex min-h-[52px] w-full items-center justify-center rounded-full border border-white/12 px-8 text-[11px] uppercase tracking-[0.2em] text-white/70 font-[family-name:var(--font-sans)] sm:w-auto">
            My Pass
          </Link>
        </div>

        <p className="mt-10 text-[9px] uppercase tracking-[0.35em] text-white/25 font-[family-name:var(--font-sans)]">Powered by Story Box</p>
      </div>
    </main>
  );
}