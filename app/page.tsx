"use client";

import { useState, FormEvent } from "react";

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

export default function Home() {
  const [url, setUrl] = useState("");
  const [competitorUrls, setCompetitorUrls] = useState<string[]>([""]);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

    try {
      const validCompetitors = competitorUrls.filter((u) => u.trim() !== "");

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          competitorUrls: validCompetitors.length > 0 ? validCompetitors : undefined,
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
      <header className="border-b border-white/[0.08] px-6 py-5">
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
        <section className="no-print max-w-2xl mx-auto px-6 pt-24 pb-16 text-center">
          <h2 className="text-4xl font-light text-[#E2E8F0] tracking-tight leading-tight">
            Decode any company&rsquo;s
            <br />
            <span className="text-[#A5B4FC]">messaging strategy</span>
          </h2>
          <p className="mt-4 text-[#A0ADB8] text-base max-w-lg mx-auto leading-relaxed">
            Enter a URL. Get a sharp market intelligence brief&thinsp;&mdash;&thinsp;messaging
            gaps, competitive exposure, and quick wins.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-3 text-left">
            <div className="flex gap-3">
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://company.com"
                aria-label="Company URL"
                className="flex-1 bg-white/[0.05] border border-white/[0.10] rounded-lg px-4 py-3 text-sm text-[#E2E8F0] placeholder:text-[#8B949E] focus:outline-none focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-500/50 text-white text-sm font-medium px-6 py-3 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? "Analysing..." : "Analyse"}
              </button>
            </div>

            {competitorUrls.map((compUrl, i) => (
              <div key={i} className="flex gap-3">
                <input
                  type="url"
                  value={compUrl}
                  onChange={(e) => updateCompetitor(i, e.target.value)}
                  placeholder={`Competitor URL ${i + 1} (optional)`}
                  aria-label={`Competitor URL ${i + 1}`}
                  className="flex-1 bg-white/[0.03] border border-white/[0.07] rounded-lg px-4 py-3 text-sm text-[#E2E8F0] placeholder:text-[#8B949E]/60 focus:outline-none focus:border-indigo-400/60 focus:ring-1 focus:ring-indigo-400/25 transition-all"
                />
                {competitorUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCompetitor(i)}
                    className="text-[#8B949E] hover:text-[#E2E8F0] text-sm px-3 transition-colors cursor-pointer"
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

          {loading && (
            <div className="mt-12 flex flex-col items-center gap-4">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse-slow" />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse-slow"
                  style={{ animationDelay: "0.4s" }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse-slow"
                  style={{ animationDelay: "0.8s" }}
                />
              </div>
              <p className="text-xs text-[#8B949E]">
                Building your brief — typically 20&ndash;40 seconds
              </p>
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </section>
      )}

      {brief && (
        <article className="max-w-5xl mx-auto px-6 py-12">
          <div className="brief-header border-b border-white/[0.08] pb-8 mb-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="brief-label text-xs uppercase tracking-[0.2em] text-[#A5B4FC] mb-2">
                  Positioning Brief
                </p>
                <h2 className="text-3xl font-light text-[#E2E8F0] tracking-tight">
                  {brief.company}
                </h2>
                <p className="brief-tagline mt-2 text-[#A0ADB8] text-sm italic">
                  &ldquo;{brief.tagline}&rdquo;
                </p>
              </div>
              <div className="no-print flex gap-2 shrink-0">
                <button
                  onClick={handlePrint}
                  className="text-xs text-[#A0ADB8] hover:text-[#E2E8F0] border border-white/[0.10] rounded px-3 py-1.5 transition-colors cursor-pointer"
                >
                  Download Brief
                </button>
                <button
                  onClick={() => {
                    setBrief(null);
                    setUrl("");
                    setCompetitorUrls([""]);
                  }}
                  className="text-xs text-[#A0ADB8] hover:text-[#E2E8F0] border border-white/[0.10] rounded px-3 py-1.5 transition-colors cursor-pointer"
                >
                  New brief
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
                <DataPoint label="Category" value={brief.positioning_read.category} />
                <DataPoint label="ICP" value={brief.positioning_read.icp} />
                <DataPoint label="Value Prop" value={brief.positioning_read.value_prop} />
                <DataPoint label="Differentiation" value={brief.positioning_read.differentiation} />
              </div>
            </Section>

            <Section number="02" title="Voice Gap Analysis">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
                <div>
                  <p className="label-text text-xs text-[#8B949E] uppercase tracking-wider mb-1.5">Tone</p>
                  <p className="text-[#E2E8F0] text-sm">{brief.voice_gap_analysis.tone}</p>
                </div>
                <div>
                  <p className="label-text text-xs text-[#8B949E] uppercase tracking-wider mb-1.5">Personality</p>
                  <p className="accent-value text-sm text-[#A5B4FC] font-mono">
                    {brief.voice_gap_analysis.personality_score}
                  </p>
                </div>
              </div>
              <div className="mb-6">
                <p className="label-strength text-xs text-emerald-400 uppercase tracking-wider mb-2">Strengths</p>
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
                <p className="label-gap text-xs text-amber-400 uppercase tracking-wider mb-3">Gaps</p>
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
                        <p className="label-threat text-[11px] uppercase tracking-wider text-red-400 mb-1">They say</p>
                        <p className="text-sm text-[#E2E8F0] leading-relaxed italic">&ldquo;{gap.they_say}&rdquo;</p>
                      </div>
                      <div>
                        <p className="label-text text-[11px] uppercase tracking-wider text-[#8B949E] mb-1">Buyer thinks</p>
                        <p className="text-sm text-[#A0ADB8] leading-relaxed">{gap.buyer_thinks}</p>
                      </div>
                      <div>
                        <p className="label-strength text-[11px] uppercase tracking-wider text-emerald-400 mb-1">Reframe</p>
                        <p className="text-sm text-[#E2E8F0] leading-relaxed">{gap.reframe}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          </div>

          {/* War Room — full width, one card per competitor */}
          <div className="mt-8 space-y-6">
            {brief.war_room.map((entry, i) => (
              <section
                key={i}
                data-section
                className="war-room-card bg-white/[0.03] border border-white/[0.08] rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <span className="section-number text-[10px] font-mono text-[#818CF8]">
                    {String(i + 3).padStart(2, "0")}
                  </span>
                  <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-[#A0ADB8]">
                    War Room: vs {entry.competitor}
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          {/* Quick Wins */}
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
                      <h4 className="text-sm font-medium text-[#E2E8F0]">{win.title}</h4>
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
                    <p className="text-sm text-[#A0ADB8] leading-relaxed">{win.description}</p>
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
      )}
    </main>
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
    <section data-section className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <span className="section-number text-[10px] font-mono text-[#818CF8]">{number}</span>
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
      <p className="label-text text-xs text-[#8B949E] uppercase tracking-wider mb-1">{label}</p>
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
      <p className={`${labelClass} text-xs uppercase tracking-wider mb-1.5`}>{label}</p>
      <p className="text-sm text-[#A0ADB8] leading-relaxed">{value}</p>
    </div>
  );
}
