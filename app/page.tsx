"use client";

import { useState, useEffect, FormEvent } from "react";

interface QuickWin {
  title: string;
  description: string;
  impact: string;
}

interface WarRoomEntry {
  competitor: string;
  narrative_owner: string;
  positioning_wedge: string;
  dangerous_overlap: string;
  likely_objection: string;
  exploitable_gap: string;
}

interface VoiceGap {
  dimension: string;
  they_say: string;
  buyer_thinks: string;
  reframe: string;
}

interface Brief {
  company: string;
  tagline: string;
  positioning_read: {
    summary: string;
    category: string;
    icp: string;
    value_prop: string;
    differentiation: string;
  };
  voice_gap_analysis: {
    tone: string;
    personality_score: string;
    strengths: string[];
    gaps: VoiceGap[];
  };
  war_room: WarRoomEntry[];
  quick_wins: QuickWin[];
}

const MAX_COMPETITORS = 3;

const LOADING_STEPS = [
  "Reading homepage",
  "Analysing messaging strategy",
  "Mapping competitive landscape",
  "Identifying voice gaps",
  "Writing your brief",
];

const SAMPLE_BRIEF: Brief = {
  company: "Arclight Analytics",
  tagline: "Turn your data into decisions, faster.",
  positioning_read: {
    summary:
      "Arclight positions itself as a speed-first analytics platform for mid-market teams drowning in dashboards. The messaging leans heavily on 'faster insights' without specifying what makes their speed claim defensible against established players like Looker or Tableau.",
    category: "Business Intelligence & Analytics",
    icp: "Mid-market data teams (50–500 employees) with 2–5 analysts who need self-serve reporting",
    value_prop:
      "Reduce time-to-insight from days to minutes with AI-assisted analytics",
    differentiation:
      "AI-native query engine that translates natural language into SQL without requiring technical expertise",
  },
  voice_gap_analysis: {
    tone: "Approachable-technical with startup energy",
    personality_score: "Warmth: 7/10 | Authority: 5/10 | Clarity: 6/10",
    strengths: [
      "Conversational tone that makes complex analytics feel accessible",
      "Consistent use of concrete time-savings metrics in hero copy",
      "Strong product-led narrative that centres the user, not the platform",
    ],
    gaps: [
      {
        dimension: "Feature vs Outcome",
        they_say:
          "Our AI-native query engine processes millions of rows in seconds",
        buyer_thinks:
          "So does every other modern analytics tool. What does this actually mean for my Monday morning standup?",
        reframe:
          "Get answers to ad-hoc questions during the meeting — not three Jira tickets later",
      },
      {
        dimension: "Jargon vs Buyer Language",
        they_say:
          "Semantic layer abstraction enables cross-functional data democratisation",
        buyer_thinks:
          "I have no idea what this means and I’m the person writing the cheque",
        reframe:
          "Your marketing team queries the same data as engineering — without filing a ticket",
      },
      {
        dimension: "Claims vs Proof",
        they_say: "Trusted by hundreds of data teams worldwide",
        buyer_thinks:
          "Hundreds? That’s deliberately vague. Show me logos or say nothing.",
        reframe:
          "Used by 340 data teams including [Name], [Name], and [Name]",
      },
      {
        dimension: "Aspiration vs Urgency",
        they_say:
          "Build a data-driven culture across your organisation",
        buyer_thinks:
          "That’s a 3-year cultural transformation project. I need to fix reporting this quarter.",
        reframe:
          "Ship your first self-serve dashboard this week — no SQL required",
      },
    ],
  },
  war_room: [
    {
      competitor: "Looker (Google Cloud)",
      narrative_owner:
        "Looker owns the ‘single source of truth’ narrative through its modelling layer and Google Cloud distribution. Arclight hasn’t yet claimed a counter-narrative.",
      positioning_wedge:
        "Speed-to-value: Looker requires weeks of LookML setup; Arclight promises minutes-to-first-insight with AI-generated models.",
      dangerous_overlap:
        "Both claim ‘self-serve analytics for non-technical users’ — buyers will struggle to differentiate without a head-to-head demo.",
      likely_objection:
        "‘Arclight is fast to set up but you’ll outgrow it. We’re the enterprise-grade choice that scales with your data infrastructure.’",
      exploitable_gap:
        "Looker’s dependency on LookML creates a bottleneck that contradicts their self-serve positioning — Arclight should hammer this relentlessly.",
    },
  ],
  quick_wins: [
    {
      title: "Replace vanity social proof with specific numbers",
      description:
        "Swap ‘trusted by hundreds of data teams’ with exact customer count and 2–3 recognisable logos. Vague claims actively erode trust with analytical buyers.",
      impact: "High",
    },
    {
      title: "Add a ‘time-to-first-dashboard’ metric to the hero",
      description:
        "Arclight’s speed advantage is real but abstract. Quantify it: ‘First dashboard live in 8 minutes’ gives buyers a concrete reason to trial.",
      impact: "High",
    },
    {
      title: "Rewrite the features page in buyer language",
      description:
        "Replace ‘semantic layer abstraction’ and ‘AI-native query engine’ with outcome-first copy. Lead with what the buyer gets, not how the technology works.",
      impact: "Medium",
    },
  ],
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [competitorUrls, setCompetitorUrls] = useState<string[]>([""]);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSample, setShowSample] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStep((prev) =>
        prev < LOADING_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  function addCompetitor() {
    if (competitorUrls.length < MAX_COMPETITORS) {
      setCompetitorUrls([...competitorUrls, ""]);
    }
  }

  function removeCompetitor(index: number) {
    setCompetitorUrls(competitorUrls.filter((_, i) => i !== index));
  }

  function updateCompetitor(index: number, value: string) {
    const updated = [...competitorUrls];
    updated[index] = value;
    setCompetitorUrls(updated);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setBrief(null);
    setShowSample(false);

    try {
      const validCompetitors = competitorUrls.filter((u) => u.trim() !== "");

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          competitorUrls:
            validCompetitors.length > 0 ? validCompetitors : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Analysis could not be completed.");
        return;
      }

      setBrief(data);
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-white/[0.08] px-4 sm:px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="accent-dot w-2 h-2 rounded-full bg-indigo-400" />
            <h1 className="text-sm font-medium tracking-[0.2em] uppercase text-[#E2E8F0]">
              Prism
            </h1>
          </div>
          <span className="text-xs text-[#8B949E] tracking-wide">
            Messaging Intelligence
          </span>
        </div>
      </header>

      {!brief && (
        <section className="no-print max-w-2xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-light text-[#E2E8F0] tracking-tight leading-tight">
            Decode any company&rsquo;s
            <br />
            <span className="text-[#A5B4FC]">messaging strategy</span>
          </h2>
          <p className="mt-4 text-[#A0ADB8] text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Enter a URL. Get a sharp market intelligence
            brief&thinsp;&mdash;&thinsp;messaging gaps, competitive exposure,
            and quick wins.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-3 text-left">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://company.com"
                aria-label="Company URL"
                className="flex-1 bg-white/[0.05] border border-white/[0.10] rounded-lg px-4 py-3 min-h-[48px] text-sm text-[#E2E8F0] placeholder:text-[#8B949E] focus:outline-none focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-500/50 text-white text-sm font-medium px-6 py-3 min-h-[48px] rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? "Analysing…" : "Analyse"}
              </button>
            </div>

            {competitorUrls.map((compUrl, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  value={compUrl}
                  onChange={(e) => updateCompetitor(i, e.target.value)}
                  placeholder={`Competitor URL ${i + 1} (optional)`}
                  aria-label={`Competitor URL ${i + 1}`}
                  className="flex-1 bg-white/[0.03] border border-white/[0.07] rounded-lg px-4 py-3 min-h-[48px] text-sm text-[#E2E8F0] placeholder:text-[#8B949E]/60 focus:outline-none focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 transition-all"
                />
                {competitorUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCompetitor(i)}
                    className="text-[#8B949E] hover:text-[#E2E8F0] text-sm px-3 min-h-[44px] transition-colors cursor-pointer"
                    aria-label={`Remove competitor ${i + 1}`}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}

            {competitorUrls.length < MAX_COMPETITORS && (
              <button
                type="button"
                onClick={addCompetitor}
                className="text-xs text-[#A0ADB8] hover:text-[#E2E8F0] transition-colors cursor-pointer"
              >
                + Add competitor
              </button>
            )}
          </form>

          <p className="mt-4 text-xs text-[#8B949E]">
            No sign-up required. Free to use.
          </p>

          {!loading && !error && (
            <button
              type="button"
              onClick={() => setShowSample(!showSample)}
              className="mt-6 text-xs text-[#A5B4FC]/80 hover:text-[#A5B4FC] transition-colors cursor-pointer"
            >
              {showSample
                ? "– Hide sample brief"
                : "See a sample brief →"}
            </button>
          )}

          {loading && (
            <div className="mt-12 flex flex-col items-start max-w-xs mx-auto space-y-3">
              {LOADING_STEPS.map((step, i) => {
                if (i > loadingStep) return null;
                const isCompleted = i < loadingStep;
                const isActive = i === loadingStep;

                return (
                  <div
                    key={step}
                    className="animate-fade-in-up flex items-center gap-3"
                  >
                    {isCompleted && (
                      <span className="text-emerald-400 text-sm w-4 text-center">
                        &#10003;
                      </span>
                    )}
                    {isActive && (
                      <span className="flex w-4 justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse-slow" />
                      </span>
                    )}
                    <span
                      className={`text-sm ${
                        isCompleted ? "text-[#8B949E]" : "text-[#E2E8F0]"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </section>
      )}

      {!brief && showSample && !loading && (
        <div className="no-print">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-4">
            <div className="flex items-center gap-2 rounded-lg bg-indigo-500/10 border border-indigo-400/20 px-4 py-2.5">
              <span className="text-xs font-medium uppercase tracking-wider text-[#A5B4FC]">
                Sample Brief
              </span>
              <span className="text-xs text-[#8B949E]">
                &mdash; This is a pre-written example for a fictional company.
                Your brief will look just like this.
              </span>
            </div>
          </div>
          <BriefDisplay brief={SAMPLE_BRIEF} onNewBrief={() => setShowSample(false)} onPrint={handlePrint} isSample />
        </div>
      )}

      {brief && (
        <BriefDisplay
          brief={brief}
          onNewBrief={() => {
            setBrief(null);
            setUrl("");
            setCompetitorUrls([""]);
          }}
          onPrint={handlePrint}
        />
      )}
    </main>
  );
}

function BriefDisplay({
  brief,
  onNewBrief,
  onPrint,
  isSample,
}: {
  brief: Brief;
  onNewBrief: () => void;
  onPrint: () => void;
  isSample?: boolean;
}) {
  return (
    <article className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="brief-header border-b border-white/[0.08] pb-8 mb-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="brief-label text-xs uppercase tracking-[0.2em] text-[#A5B4FC] mb-2">
              {isSample ? "Sample Positioning Brief" : "Positioning Brief"}
            </p>
            <h2 className="text-2xl sm:text-3xl font-light text-[#E2E8F0] tracking-tight">
              {brief.company}
            </h2>
            <p className="brief-tagline mt-2 text-[#A0ADB8] text-sm italic">
              &ldquo;{brief.tagline}&rdquo;
            </p>
          </div>
          <div className="no-print flex gap-2 shrink-0">
            {!isSample && (
              <button
                onClick={onPrint}
                className="text-xs text-[#A0ADB8] hover:text-[#E2E8F0] border border-white/[0.10] rounded px-3 py-1.5 min-h-[36px] transition-colors cursor-pointer"
              >
                Download Brief
              </button>
            )}
            <button
              onClick={onNewBrief}
              className="text-xs text-[#A0ADB8] hover:text-[#E2E8F0] border border-white/[0.10] rounded px-3 py-1.5 min-h-[36px] transition-colors cursor-pointer"
            >
              {isSample ? "Close sample" : "New brief"}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <Section number="01" title="Positioning Read">
          <p className="text-[#E2E8F0] text-sm leading-relaxed mb-6">
            {brief.positioning_read.summary}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <DataPoint
              label="Category"
              value={brief.positioning_read.category}
            />
            <DataPoint label="ICP" value={brief.positioning_read.icp} />
            <DataPoint
              label="Value Prop"
              value={brief.positioning_read.value_prop}
            />
            <DataPoint
              label="Differentiation"
              value={brief.positioning_read.differentiation}
            />
          </div>
        </Section>

        <Section number="02" title="Voice Gap Analysis">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mb-6">
            <div>
              <p className="label-text text-xs text-[#8B949E] uppercase tracking-wider mb-1.5">
                Tone
              </p>
              <p className="text-[#E2E8F0] text-sm">
                {brief.voice_gap_analysis.tone}
              </p>
            </div>
            <div>
              <p className="label-text text-xs text-[#8B949E] uppercase tracking-wider mb-1.5">
                Personality
              </p>
              <p className="accent-value text-sm text-[#A5B4FC] font-mono">
                {brief.voice_gap_analysis.personality_score}
              </p>
            </div>
          </div>
          <div className="mb-6">
            <p className="label-strength text-xs text-emerald-400 uppercase tracking-wider mb-2">
              Strengths
            </p>
            <ul className="space-y-1.5">
              {brief.voice_gap_analysis.strengths.map((s, i) => (
                <li key={i} className="text-sm text-[#A0ADB8] flex gap-2">
                  <span className="text-emerald-400 shrink-0">+</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label-gap text-xs text-amber-400 uppercase tracking-wider mb-3">
              Gaps
            </p>
            <div className="space-y-4">
              {brief.voice_gap_analysis.gaps.map((gap, i) => (
                <div
                  key={i}
                  className="quick-win-card bg-white/[0.03] border border-white/[0.06] rounded-lg p-4 space-y-3"
                >
                  <p className="text-[10px] font-medium uppercase tracking-wider text-amber-400">
                    {gap.dimension}
                  </p>
                  <div>
                    <p className="label-threat text-[11px] uppercase tracking-wider text-red-400 mb-1">
                      They say
                    </p>
                    <p className="text-sm text-[#E2E8F0] leading-relaxed italic">
                      &ldquo;{gap.they_say}&rdquo;
                    </p>
                  </div>
                  <div>
                    <p className="label-text text-[11px] uppercase tracking-wider text-[#8B949E] mb-1">
                      Buyer thinks
                    </p>
                    <p className="text-sm text-[#A0ADB8] leading-relaxed">
                      {gap.buyer_thinks}
                    </p>
                  </div>
                  <div>
                    <p className="label-strength text-[11px] uppercase tracking-wider text-emerald-400 mb-1">
                      Reframe
                    </p>
                    <p className="text-sm text-[#E2E8F0] leading-relaxed">
                      {gap.reframe}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>

      <div className="mt-8 space-y-6">
        {brief.war_room.map((entry, i) => (
          <section
            key={i}
            data-section
            className="war-room-card bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 sm:p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="section-number text-[10px] font-mono text-[#818CF8]">
                {String(i + 3).padStart(2, "0")}
              </span>
              <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-[#A0ADB8]">
                War Room: vs {entry.competitor}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <WarRoomField
                label="Narrative Owner"
                labelClass="label-text"
                value={entry.narrative_owner}
              />
              <WarRoomField
                label="Your Positioning Wedge"
                labelClass="label-strength"
                value={entry.positioning_wedge}
              />
              <WarRoomField
                label="Dangerous Overlap"
                labelClass="label-threat"
                value={entry.dangerous_overlap}
              />
              <WarRoomField
                label="Likely Sales Objection"
                labelClass="label-gap"
                value={entry.likely_objection}
              />
              <WarRoomField
                label="Exploitable Gap"
                labelClass="label-strength"
                value={entry.exploitable_gap}
              />
            </div>
          </section>
        ))}
      </div>

      <div className="mt-8">
        <Section
          number={String(brief.war_room.length + 3).padStart(2, "0")}
          title="Quick Wins"
        >
          <div className="space-y-5">
            {brief.quick_wins.map((win, i) => (
              <div
                key={i}
                className="quick-win-card bg-white/[0.03] border border-white/[0.06] rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-[#E2E8F0]">
                    {win.title}
                  </h4>
                  <span
                    className={`impact-badge text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      win.impact === "High"
                        ? "bg-indigo-500/20 text-[#A5B4FC]"
                        : win.impact === "Medium"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-white/[0.08] text-[#8B949E]"
                    }`}
                  >
                    {win.impact}
                  </span>
                </div>
                <p className="text-sm text-[#A0ADB8] leading-relaxed">
                  {win.description}
                </p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <footer className="mt-16 pt-6 border-t border-white/[0.06] text-center">
        <p className="text-xs text-[#8B949E]">
          PRISM &middot; Messaging intelligence, powered by Claude
        </p>
      </footer>
    </article>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      data-section
      className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 sm:p-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <span className="section-number text-[10px] font-mono text-[#818CF8]">
          {number}
        </span>
        <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-[#A0ADB8]">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

function DataPoint({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label-text text-xs text-[#8B949E] uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-sm text-[#A0ADB8] leading-relaxed">{value}</p>
    </div>
  );
}

function WarRoomField({
  label,
  labelClass,
  value,
}: {
  label: string;
  labelClass: string;
  value: string;
}) {
  return (
    <div>
      <p className={`${labelClass} text-xs uppercase tracking-wider mb-1.5`}>
        {label}
      </p>
      <p className="text-sm text-[#A0ADB8] leading-relaxed">{value}</p>
    </div>
  );
}
