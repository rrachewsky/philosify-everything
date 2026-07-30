// V2Gallery - dev-only WP2 acceptance surface (/dev/v2).
// Replicates the mockup anatomies with the v2 component library so each
// component can be compared side-by-side with the approved mockups.
// Not routed in production builds.
import { useState } from 'react';
import {
  PageShell,
  Cell,
  Button,
  Pill,
  Ticker,
  ModuleHeader,
  Telemetry,
  ModalV2,
  Verdict,
  AudioBar,
  ExpandableSection,
  ActionsRow,
  AdSlot,
  TrackCard,
  Field,
  ThemeBar,
} from '../components/v2';

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 70 }}>
      <div
        style={{
          font: '500 10.5px/1 var(--fu)',
          letterSpacing: '.22em',
          textTransform: 'uppercase',
          color: 'var(--low)',
          margin: '0 0 14px',
        }}
      >
        {title}
      </div>
      {children}
    </section>
  );
}

export default function V2Gallery() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <PageShell
      status="Analysis Engine // Active"
      nav={
        <>
          <a>EN · 18</a>
          <a>Balance: 11</a>
          <a>Roberto R. ▾</a>
        </>
      }
    >
      <Section title="Module header — title / marker line / ticker (news standard)">
        <ModuleHeader title="NEWS">
          <Ticker>
            Breaking &gt;&gt;&gt; Central bank raises rates 0.5% · Markets steady · Election court
            ruling expected
          </Ticker>
        </ModuleHeader>
      </Section>

      <Section title="Input (news search)">
        <Field placeholder="Search an issue — results from newest to oldest" />
      </Section>

      <Section title="Cells — compact result rows + mode chooser with credit pills">
        <Cell href="#" title="CENTRAL BANK RAISES RATES BY 0.5%" style={{ marginBottom: 8, borderColor: 'var(--strong)' }}>
          Reuters · <span className="hl">28 Jul 2026</span> · selected
        </Cell>
        <Cell href="#" title="MARKETS BRACE FOR RATE DECISION" style={{ marginBottom: 8 }}>
          FT · 27 Jul 2026
        </Cell>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16 }}>
          <Cell href="#" title="SCAN NEWS" credit="1 CREDIT">
            Source and its bias, where it errs and where it is right, and Philosify's opinion.
          </Cell>
          <Cell href="#" title="PHILOSOPHER PANEL" credit="3 CREDITS">
            After the scan: call three philosophers to analyze the same story in character.
          </Cell>
        </div>
      </Section>

      <Section title="Cells — landing variant + inverted (master)">
        <div className="modules">
          <Cell variant="landing" href="#" title="MUSIC">
            Search <span className="hl">1.7M songs</span> via Spotify and Genius and receive a
            philosophical analysis of the lyrics, with audio playback.
          </Cell>
          <Cell variant="landing" href="#" title="QUIZ">
            A questionnaire that identifies which <span className="hl">premises you actually hold</span>.
          </Cell>
          <Cell variant="landing" inverted href="#" title="UNSAFE ZONE">
            No dogmas. No fallacies. No fantasy. No evasions. Bring your real questions. And answers.
          </Cell>
        </div>
      </Section>

      <Section title="Buttons / pills">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button>Continue to payment</Button>
          <Button variant="secondary">Cancel</Button>
          <Pill>Complete</Pill>
          <Pill silver>Complete</Pill>
          <Pill>Archived</Pill>
        </div>
      </Section>

      <Section title="Telemetry state line (music)">
        <Telemetry label="Analyzing" time="00:04.81" progress={34} onCancel={() => {}} />
      </Section>

      <Section title="Analysis card stack (music)">
        <TrackCard title="IMAGINE" meta="John Lennon · United Kingdom · 1971 · Soft Rock · Spotify preview" />
        <Verdict note="1" classification="DOCTRINALLY CONFORMIST" />
        <AudioBar />
        <div style={{ marginTop: 12 }}>
          <ExpandableSection title="HISTORICAL CONTEXT" defaultOpen>
            Released in 1971 on John Lennon's solo album Imagine, the song emerged amid the Vietnam
            War's peak, with U.S. involvement fueling global anti-war protests.
          </ExpandableSection>
          <ExpandableSection title="METAPHYSICS">Section content…</ExpandableSection>
          <ExpandableSection title="ETHICS">Section content…</ExpandableSection>
        </div>
        <ActionsRow>
          <a>Share</a>
          <a>Share via DM</a>
          <a>Join John Lennon</a>
          <a>Analyze another</a>
        </ActionsRow>
        <AdSlot>Post-analysis slot — the only ad below the verdict. Neutral tokens, never silver.</AdSlot>
      </Section>

      <Section title="Modal — static (modals mockup) + overlay demo">
        <ModalV2
          overlay={false}
          title="CONFIRM"
          onClose={() => {}}
          footer={
            <>
              <Button variant="secondary">Cancel</Button>
              <Button>Spend 1 credit</Button>
            </>
          }
        >
          <p style={{ font: '400 13px/1.8 var(--fd)', letterSpacing: '.05em', color: 'var(--mid)' }}>
            SCAN MUSIC — <span className="hl">1 CREDIT</span>
            <br />
            Balance after: <span className="hl">10 CREDITS</span>
          </p>
        </ModalV2>
        <Button variant="secondary" onClick={() => setModalOpen(true)}>
          Open overlay modal
        </Button>
        <ModalV2
          open={modalOpen}
          title="BUY CREDITS"
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button>Continue to payment</Button>
            </>
          }
        >
          <div className="packs">
            <a className="cell pack" href="#">
              <span className="n">10</span>
              <span className="u">Credits</span>
              <span className="pr">$ —</span>
            </a>
            <a className="cell pack" href="#" style={{ position: 'relative' }}>
              <span className="best">Best value</span>
              <span className="n">50</span>
              <span className="u">Credits</span>
              <span className="pr">$ —</span>
            </a>
            <a className="cell pack" href="#">
              <span className="n">150</span>
              <span className="u">Credits</span>
              <span className="pr">$ —</span>
            </a>
          </div>
          <div className="mnote">
            Prices bind to live Stripe products. Any action that spends credits shows its cost
            before the click.
          </div>
        </ModalV2>
      </Section>

      <ThemeBar />
    </PageShell>
  );
}
