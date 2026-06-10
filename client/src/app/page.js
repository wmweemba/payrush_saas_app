import Link from 'next/link'
import {
  IconFilePlus,
  IconBrandWhatsapp,
  IconCircleCheck,
  IconCheck,
} from '@tabler/icons-react'

const primaryBtn =
  'inline-flex items-center justify-center bg-[#185FA5] text-white text-[14px] font-medium rounded-[10px] px-5 h-11 md:h-10 hover:bg-[#0C447C] active:scale-[0.98] transition-all'

const secondaryBtn =
  'inline-flex items-center justify-center bg-transparent border-[0.5px] border-[rgba(0,0,0,0.15)] text-[#111827] text-[14px] font-medium rounded-[10px] px-5 h-11 md:h-10 hover:bg-[#F0F2F5] active:scale-[0.98] transition-all'

const steps = [
  {
    number: '01',
    Icon: IconFilePlus,
    heading: 'Create your invoice',
    body: 'Add your client, line items, and due date. Done in under 2 minutes, on any device.',
  },
  {
    number: '02',
    Icon: IconBrandWhatsapp,
    heading: 'Share it instantly',
    body: 'Send via WhatsApp, Telegram, or email. Your client gets a clean, professional link — no login required.',
  },
  {
    number: '03',
    Icon: IconCircleCheck,
    heading: 'Get paid',
    body: 'Mark it paid when the money arrives. Know exactly where every invoice stands, at a glance.',
  },
]

const freeFeatures = [
  '10 invoices per month',
  'WhatsApp, email & Telegram sharing',
  'Client management',
  'PDF download',
  'Shareable invoice links',
]

const proFeatures = [
  'Everything in Free',
  'Unlimited invoices',
  'Priority support',
  'Custom branding controls',
  'Early access to new features',
]

function PhoneIllustration() {
  return (
    <div className="relative mx-auto" style={{ width: '300px', height: '520px' }}>
      {/* Phone frame */}
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2 rounded-[32px]"
        style={{ width: '260px', height: '480px', background: '#1A1F2E' }}
      >
        {/* Camera pill / notch */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{ top: '14px', width: '52px', height: '6px', background: 'rgba(255,255,255,0.18)' }}
        />

        {/* Screen */}
        <div
          className="absolute rounded-[24px] overflow-hidden bg-white"
          style={{ top: '12px', left: '12px', right: '12px', bottom: '12px' }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center rounded-full text-white font-medium"
                  style={{ width: '28px', height: '28px', fontSize: '12px', background: '#185FA5' }}
                >
                  AC
                </div>
                <span className="text-[13px] font-medium text-[#111827]">Acme Corp</span>
              </div>
              <span
                className="rounded-full font-medium"
                style={{ fontSize: '10px', padding: '3px 8px', background: '#EAF3DE', color: '#3B6D11' }}
              >
                PAID
              </span>
            </div>

            <div className="text-[24px] font-medium text-[#111827]" style={{ marginTop: '12px' }}>
              ZMW 4,500.00
            </div>

            <div style={{ marginTop: '12px' }}>
              <div
                className="flex items-center justify-between text-[11px] text-[#6B7280]"
                style={{ padding: '8px 0', borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}
              >
                <span>Website design</span>
                <span>ZMW 3,500.00</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#6B7280]" style={{ padding: '8px 0' }}>
                <span>Domain setup</span>
                <span>ZMW 1,000.00</span>
              </div>
            </div>

            <div className="flex justify-center" style={{ marginTop: '16px' }}>
              <span
                className="rounded-full text-white"
                style={{ fontSize: '10px', padding: '7px 20px', background: '#185FA5' }}
              >
                View invoice
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notification chip — bottom-left */}
      <div
        className="absolute flex items-center gap-2 bg-white rounded-xl"
        style={{
          left: '0px',
          bottom: '64px',
          padding: '10px 14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          transform: 'rotate(-3deg)',
        }}
      >
        <span className="rounded-full" style={{ width: '8px', height: '8px', background: '#3B6D11' }} />
        <span className="text-[11px] text-[#111827]">Payment received · ZMW 4,500</span>
      </div>

      {/* Notification chip — bottom-right */}
      <div
        className="absolute flex items-center gap-2 bg-white rounded-xl"
        style={{
          right: '0px',
          bottom: '12px',
          padding: '10px 14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          transform: 'rotate(3deg)',
        }}
      >
        <span className="rounded-full" style={{ width: '8px', height: '8px', background: '#185FA5' }} />
        <span className="text-[11px] text-[#111827]">Invoice opened · just now</span>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* NAV */}
      <nav className="sticky top-0 z-10 bg-white" style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', height: '56px' }}>
        <div className="max-w-[1100px] mx-auto h-full flex items-center justify-between px-6">
          <span className="text-[20px] font-medium text-[#185FA5]">BazaBooks</span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[14px] text-[#185FA5] hover:underline">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center bg-[#185FA5] text-white text-[14px] font-medium rounded-[10px] px-4 hover:bg-[#0C447C] active:scale-[0.98] transition-all"
              style={{ height: '36px' }}
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* SECTION 1 — Hero */}
      <section className="bg-white px-6 py-20 md:px-10 md:py-[100px]">
        <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p
              className="text-[11px] font-medium uppercase text-[#185FA5]"
              style={{ letterSpacing: '0.05em', marginBottom: '16px' }}
            >
              For freelancers &amp; small businesses
            </p>
            <h1 className="text-[30px] md:text-[40px] font-medium text-[#111827]" style={{ lineHeight: '1.2' }}>
              You just finished the job.
              <br />
              Now get paid.
            </h1>
            <p
              className="text-[16px] text-[#6B7280]"
              style={{ lineHeight: '1.6', marginTop: '20px', maxWidth: '480px' }}
            >
              BazaBooks lets you create a professional invoice in under 2 minutes and share it on
              WhatsApp before you leave the client.
            </p>
            <div className="flex flex-wrap items-center gap-3" style={{ marginTop: '32px' }}>
              <Link href="/signup" className={primaryBtn}>
                Create free account
              </Link>
              <Link href="/login" className={secondaryBtn}>
                Sign in
              </Link>
            </div>
            <p className="text-[12px] text-[#9CA3AF]" style={{ marginTop: '16px' }}>
              Free forever — 10 invoices/month. No credit card required.
            </p>
          </div>

          <PhoneIllustration />
        </div>
      </section>

      {/* SECTION 2 — Problem statement */}
      <section className="bg-[#F0F2F5] px-6 py-16">
        <div className="max-w-[640px] mx-auto text-center">
          <p className="text-[16px] md:text-[18px] text-[#111827]" style={{ lineHeight: '1.7' }}>
            Most invoicing tools are built for accountants.
          </p>
          <p className="text-[16px] md:text-[18px] text-[#6B7280]" style={{ lineHeight: '1.7', marginTop: '12px' }}>
            You&apos;re not an accountant. You&apos;re trying to run a business and get paid without
            the friction. BazaBooks is built for the moment right after the work is done.
          </p>
        </div>
      </section>

      {/* SECTION 3 — How it works */}
      <section className="bg-white px-6 py-20">
        <div className="max-w-[1100px] mx-auto">
          <p
            className="text-[11px] font-medium uppercase text-[#185FA5] text-center"
            style={{ letterSpacing: '0.05em', marginBottom: '40px' }}
          >
            How it works
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {steps.map(({ number, Icon, heading, body }) => (
              <div
                key={number}
                className="bg-white rounded-2xl"
                style={{ border: '0.5px solid rgba(0,0,0,0.08)', padding: '28px 24px' }}
              >
                <p
                  className="text-[11px] font-medium text-[#9CA3AF]"
                  style={{ letterSpacing: '0.05em', marginBottom: '12px' }}
                >
                  {number}
                </p>
                <Icon size={24} color="#185FA5" style={{ marginBottom: '12px' }} />
                <h3 className="text-[16px] font-medium text-[#111827]">{heading}</h3>
                <p className="text-[14px] text-[#6B7280]" style={{ lineHeight: '1.6', marginTop: '8px' }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — Positioning line */}
      <section className="bg-[#F0F2F5] px-6 py-12">
        <div className="max-w-[700px] mx-auto text-center">
          <p className="text-[16px] text-[#6B7280] italic" style={{ lineHeight: '1.6' }}>
            Built for businesses in Zambia and beyond — wherever WhatsApp is how business gets done.
          </p>
        </div>
      </section>

      {/* SECTION 5 — Pricing */}
      <section className="bg-white px-6 py-20">
        <div className="max-w-[1100px] mx-auto">
          <p
            className="text-[11px] font-medium uppercase text-[#185FA5] text-center"
            style={{ letterSpacing: '0.05em', marginBottom: '40px' }}
          >
            Simple pricing
          </p>

          <div className="max-w-[640px] mx-auto grid md:grid-cols-2 gap-4">
            {/* Free card */}
            <div className="rounded-2xl" style={{ border: '0.5px solid rgba(0,0,0,0.08)', padding: '28px 24px' }}>
              <p
                className="text-[13px] font-medium uppercase text-[#185FA5]"
                style={{ letterSpacing: '0.05em' }}
              >
                Free
              </p>
              <div className="flex items-baseline gap-1" style={{ marginTop: '8px' }}>
                <span className="text-[16px] text-[#6B7280]">ZMW</span>
                <span className="text-[40px] font-medium text-[#111827]" style={{ lineHeight: '1' }}>
                  0
                </span>
                <span className="text-[16px] text-[#6B7280]">/month</span>
              </div>
              <p className="text-[13px] text-[#6B7280]" style={{ marginTop: '4px' }}>
                Forever free. Not a trial.
              </p>

              <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.08)', margin: '20px 0' }} />

              <ul className="flex flex-col gap-3">
                {freeFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-[14px] text-[#111827]">
                    <IconCheck size={14} color="#185FA5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`${primaryBtn} w-full`}
                style={{ marginTop: '24px' }}
              >
                Get started free
              </Link>
            </div>

            {/* Pro card */}
            <div className="rounded-2xl text-white" style={{ background: '#185FA5', padding: '28px 24px' }}>
              <p
                className="text-[13px] uppercase"
                style={{ letterSpacing: '0.05em', color: 'rgba(255,255,255,0.7)' }}
              >
                Pro
              </p>
              <p className="text-[24px] font-medium text-white" style={{ marginTop: '8px' }}>
                Coming soon
              </p>
              <p className="text-[14px]" style={{ marginTop: '4px', color: 'rgba(255,255,255,0.75)' }}>
                Unlimited invoices + priority support.
              </p>

              <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.15)', margin: '20px 0' }} />

              <ul className="flex flex-col gap-3">
                {proFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-[14px] text-white">
                    <IconCheck size={14} style={{ color: 'rgba(255,255,255,0.9)' }} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="flex items-center justify-center w-full font-medium rounded-[10px] active:scale-[0.98] transition-all"
                style={{ marginTop: '24px', height: '44px', background: '#FFFFFF', color: '#185FA5', fontSize: '14px' }}
              >
                Join the waitlist
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — Final CTA */}
      <section className="px-6 py-20 text-center" style={{ background: '#0C447C' }}>
        <h2 className="text-[24px] md:text-[28px] font-medium text-white" style={{ lineHeight: '1.3' }}>
          Your next client is waiting.
          <br />
          Send them an invoice they&apos;ll actually open.
        </h2>
        <p className="text-[16px]" style={{ marginTop: '12px', color: 'rgba(255,255,255,0.7)' }}>
          Free forever. No credit card. Set up in minutes.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center font-medium rounded-[10px] active:scale-[0.98] transition-all"
          style={{
            marginTop: '32px',
            height: '48px',
            padding: '0 32px',
            background: '#FFFFFF',
            color: '#0C447C',
            fontSize: '15px',
          }}
        >
          Create your free account →
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="bg-white px-6 py-6" style={{ borderTop: '0.5px solid rgba(0,0,0,0.08)' }}>
        <div className="max-w-[1100px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] text-[#9CA3AF]">© 2026 BazaBooks. All rights reserved.</span>
          <Link href="/privacy" className="text-[13px] text-[#6B7280] hover:underline">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  )
}
