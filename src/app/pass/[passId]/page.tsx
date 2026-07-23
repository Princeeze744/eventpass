import { prisma } from "@/lib/db";
import { eventInfo } from "@/lib/guests";
import PassCard from "@/components/PassCard";

export const dynamic = "force-dynamic";

export default async function PassPage({
  params,
}: {
  params: Promise<{ passId: string }>;
}) {
  const { passId } = await params;
  const guest = await prisma.guest.findFirst({
    where: { passId: { equals: decodeURIComponent(passId).trim() } },
  });

  if (!guest || guest.status === "declined") {
    return (
      <main className="min-h-[100svh] bg-[#070707] text-white flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-3xl font-[family-name:var(--font-serif)] text-[#e9d69a]">
          {guest ? "Pass Revoked" : "Pass Not Found"}
        </h1>
        <p className="mt-3 text-white/50 font-[family-name:var(--font-sans)] text-sm max-w-sm">
          {guest
            ? "This pass is no longer valid. Please contact the couple or their planner."
            : "This pass ID is not on the guest list."}
        </p>
      </main>
    );
  }

  return (
    <PassCard
      guest={{
        passId: guest.passId,
        name: guest.name,
        tier: guest.tier,
        table: guest.table,
        status: guest.status,
        checkedInOnline: guest.checkedInOnline,
      }}
      eventInfo={eventInfo}
    />
  );
}