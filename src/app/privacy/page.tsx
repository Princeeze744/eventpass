import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy · Story Box",
  description:
    "How Story Box collects, uses and protects personal information for event invitations and guest check-in.",
};

const UPDATED = "15 October 2026";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-[family-name:var(--font-serif)] text-2xl text-[#c9a227] sm:text-3xl">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-white/60 font-[family-name:var(--font-sans)]">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="relative min-h-[100svh] bg-[#080807] text-[#f5f1ea] px-5 py-14 sm:px-8">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[45vh] w-[80vw] sb-glow-warm" />
      </div>

      <article className="relative mx-auto max-w-[760px]">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[#c9a227] font-[family-name:var(--font-sans)]">
          Story Box
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-serif)] text-5xl leading-[1.05] sb-display sm:text-6xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-[12px] uppercase tracking-[0.2em] text-white/35 font-[family-name:var(--font-sans)]">
          Last updated {UPDATED}
        </p>

        <div className="mt-8 rounded-2xl border border-white/[0.06] bg-black/25 p-6">
          <p className="text-[14px] leading-relaxed text-white/70 font-[family-name:var(--font-sans)]">
            Story Box is an event invitation and guest check-in platform operated
            from Nigeria at{" "}
            <span className="text-[#c9a227]">storyboxnigeria.com</span>. This
            policy explains what personal information passes through the
            platform, why, and what you can do about it.
          </p>
        </div>

        <Section title="Who is responsible for your information">
          <p>
            Most of the personal information on Story Box is given to us by an
            event organiser — the person or company hosting the event you have
            been invited to. They decide who is invited and what details are
            used. In data protection terms they are the <em>controller</em>, and
            Story Box acts as a <em>processor</em> on their instructions.
          </p>
          <p>
            If you want your details corrected or removed from a particular
            guest list, the fastest route is to contact the organiser of that
            event. You can also contact us and we will pass the request on.
          </p>
          <p>
            Where we handle information for our own purposes — running accounts
            for planners and keeping the service secure — Story Box is the
            controller.
          </p>
        </Section>

        <Section title="What we collect">
          <p>
            <strong className="text-white/80">Guests.</strong> Name, phone
            number, email address where provided, your answer to an invitation,
            any table or seating assignment, and the time you were checked in at
            the entrance. Each guest is issued a unique pass reference used to
            verify entry.
          </p>
          <p>
            <strong className="text-white/80">Planners and hosts.</strong> Name,
            email address, a securely hashed password, and the events you
            create or manage.
          </p>
          <p>
            <strong className="text-white/80">Technical.</strong> Standard
            server logs and a session cookie that keeps you signed in. We do not
            use advertising or tracking cookies, and we do not sell personal
            information to anyone.
          </p>
        </Section>

        <Section title="Why we use it">
          <p>
            To create and deliver your invitation and entry pass; to confirm who
            is attending; to verify passes at the entrance so that each one
            admits one guest once; to produce attendance and seating reports for
            the organiser; and to keep the service running and secure.
          </p>
          <p>
            We process this information because the organiser has a legitimate
            interest in running their event and knowing who attends, and because
            it is necessary to provide the service you are using.
          </p>
        </Section>

        <Section title="Messages we send you">
          <p>
            Invitations and event updates may reach you by email or on WhatsApp,
            using the contact details the organiser supplied. Messages sent on
            WhatsApp are delivered through the WhatsApp Business Platform, which
            is operated by Meta.
          </p>
          <p>
            When a message is sent, WhatsApp tells us whether it was delivered
            and whether it was opened, and records which button you tapped if you
            respond to an invitation. We use this only to show the organiser how
            many guests have received and answered their invitation.
          </p>
          <p>
            You can stop receiving WhatsApp messages at any time by replying to
            ask us to stop, or by blocking the number in WhatsApp.
          </p>
        </Section>

        <Section title="Who else sees it">
          <p>
            Your details are visible to the organiser of your event and to the
            staff they authorise at the entrance. Beyond that, we rely on a small
            number of service providers who process information on our behalf:
          </p>
          <p className="text-white/50">
            Meta Platforms — delivery of WhatsApp messages.
            <br />
            Resend — delivery of email.
            <br />
            Vercel — hosting of the platform.
            <br />
            Neon — database hosting.
          </p>
          <p>
            Some of these providers operate servers outside Nigeria, which means
            your information may be processed abroad. We only use providers who
            commit to appropriate safeguards for the data they handle.
          </p>
          <p>
            We do not sell your information, and we do not share it for
            advertising.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            A guest list and its attendance record form part of the
            organiser&apos;s own business records. Organisers rely on them to
            reconcile attendance, account to sponsors, committees and auditors,
            and answer questions about an event long after it has ended. We
            therefore do not delete event records on a timetable of our own.
          </p>
          <p>
            The organiser decides how long their event information is kept. We
            hold it on their instruction, and we remove it when they instruct us
            to, or where we are required to by law. Removing an event from the
            platform does not by itself erase the organiser&apos;s record of it,
            so that their audit trail stays intact.
          </p>
          <p>
            Separately, Story Box keeps its own summary records of activity on
            the platform — how many events have been run, how many guests were
            invited, how many attended. These are counts and totals kept for our
            own business records and reporting. They do not identify any
            individual guest, and we keep them indefinitely.
          </p>
          <p>
            Account information for planners is kept while the account is open.
            Server logs are kept for a short period for security and
            troubleshooting.
          </p>
        </Section>

        <Section title="Keeping it safe">
          <p>
            Information is transmitted over encrypted connections and stored in
            managed, access-controlled databases. Passwords are hashed and never
            stored in readable form. Access to event data requires either an
            event access key or a signed-in account with permission for that
            event.
          </p>
          <p>
            No system is perfect. If a breach occurs that puts your rights at
            risk, we will inform the affected organisers without undue delay.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            Under the Nigeria Data Protection Act you may ask for a copy of the
            personal information held about you, ask for it to be corrected or
            deleted, object to how it is being used, or withdraw consent where
            consent is what we relied on.
          </p>
          <p>
            For information tied to a specific event, contact that event&apos;s
            organiser first, as they decide what happens to their guest list. We
            will always help where we can.
          </p>
          <p>
            Where we are asked to erase personal details, we may still keep the
            summary counts described above, and any record we are required to
            keep by law. Those contain no information that identifies you.
          </p>
          <p>
            You also have the right to complain to the Nigeria Data Protection
            Commission.
          </p>
        </Section>

        <Section title="Children">
          <p>
            Story Box is intended for use by adults organising and attending
            events. We do not knowingly collect information directly from
            children. Where a child attends an event, their details are provided
            by the adult organising it.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            We may update this policy as the platform changes. The date at the
            top shows when it was last revised.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about this policy, or about information held on the
            platform, can be sent to{" "}
            <a
              href="mailto:hello@storyboxnigeria.com"
              className="text-[#c9a227] underline underline-offset-4"
            >
              hello@storyboxnigeria.com
            </a>
            .
          </p>
        </Section>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] pt-6">
          <Link
            href="/"
            className="sb-ghost px-6 py-3 text-[10px] uppercase tracking-[0.15em] text-white/70 font-[family-name:var(--font-sans)]"
          >
            Back to Story Box
          </Link>
          <p className="text-[9px] uppercase tracking-[0.35em] text-white/20 font-[family-name:var(--font-sans)]">
            Powered by Story Box
          </p>
        </div>
      </article>
    </main>
  );
}
