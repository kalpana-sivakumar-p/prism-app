import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PERSONA = `You are a product marketing strategist with 20+ years of experience advising category-defining B2B companies. You think in frameworks, speak in verdicts, and never waste words. Your analysis is direct, opinionated, and immediately actionable.`;

const POSITIONING_AND_VOICE_SCHEMA = `"company": "string — company name",
  "tagline": "string — their primary tagline or hero headline",
  "positioning_read": {
    "summary": "string — 2-3 sentence verdict on their current positioning. Be specific.",
    "category": "string — the market category they are claiming",
    "icp": "string — implied ideal customer profile",
    "value_prop": "string — core value proposition as stated",
    "differentiation": "string — what they claim separates them from alternatives"
  },
  "voice_gap_analysis": {
    "tone": "string — description of their brand voice (e.g. 'Technical-authoritative with enterprise polish')",
    "personality_score": "string — rate warmth/authority/clarity each out of 10, formatted as 'Warmth: X/10 | Authority: X/10 | Clarity: X/10'",
    "strengths": ["string — exactly 3 voice strengths"],
    "gaps": [
      {
        "dimension": "string — one of: 'Feature vs Outcome' | 'Jargon vs Buyer Language' | 'Claims vs Proof' | 'Aspiration vs Urgency'",
        "they_say": "string — a specific phrase, sentence, or claim from the company's actual messaging",
        "buyer_thinks": "string — what the buyer is actually thinking when they read this",
        "reframe": "string — a concrete rewrite in the buyer's own language"
      }
    ]
  }`;

const GENERAL_COMPETITIVE_SCHEMA = `"war_room": [{
    "competitor": "string — competitor name (inferred from the market context)",
    "narrative_owner": "string — who currently owns the category narrative and how",
    "positioning_wedge": "string — the primary company's single most defensible positioning wedge against this competitor",
    "dangerous_overlap": "string — the most dangerous messaging overlap where buyers might confuse the two companies",
    "likely_objection": "string — the objection this competitor's sales rep uses when the primary company comes up in a deal",
    "exploitable_gap": "string — the biggest exploitable gap in this competitor's positioning"
  }]`;

const COMPETITOR_SCHEMA = `"war_room": [{
    "competitor": "string — competitor company name",
    "narrative_owner": "string — who currently owns the category narrative between these two and how",
    "positioning_wedge": "string — the primary company's single most defensible positioning wedge against this competitor",
    "dangerous_overlap": "string — the most dangerous messaging overlap where buyers might confuse the two companies",
    "likely_objection": "string — the objection this competitor's sales rep uses when the primary company comes up in a deal",
    "exploitable_gap": "string — the biggest exploitable gap in this competitor's positioning"
  }]`;

const QUICK_WINS_SCHEMA = `"quick_wins": [
    {
      "title": "string — short action title",
      "description": "string — what to do and why, 2-3 sentences max",
      "impact": "string — High / Medium / Low"
    }
  ]`;

const CLOSING = `Write every section as if briefing a CEO before a board meeting. No hedging, no generic observations, no filler. Each verdict should be specific enough that the reader can act on it without asking a follow-up question.

For voice_gap_analysis.gaps: produce exactly 4 entries, one per dimension. Each must reference specific language from the company's actual messaging — not generic observations. "they_say" must quote or closely paraphrase real copy. "buyer_thinks" should be the honest internal reaction of a sceptical buyer. "reframe" should be a concrete alternative a PMM could use tomorrow. A senior PMM reading these gaps should feel slightly uncomfortable because of how accurate they are.

The quick_wins array must contain exactly 3 items. Use British English spelling throughout (e.g. "analyse", "optimise", "colour", "behaviour"). Return only valid JSON, no markdown fences.`;

function buildSystemPrompt(competitorUrls: string[]): string {
  const hasCompetitors = competitorUrls.length > 0;

  const competitiveBlock = hasCompetitors ? COMPETITOR_SCHEMA : GENERAL_COMPETITIVE_SCHEMA;

  const contextLine = hasCompetitors
    ? `You are given a primary company URL and ${competitorUrls.length} competitor URL${competitorUrls.length > 1 ? "s" : ""}. Produce a Positioning Brief for the primary company. The war_room array must contain one entry per competitor — each a direct head-to-head war room brief, not a general market read.`
    : `Given a company URL, use your knowledge of that company to produce a Positioning Brief. The war_room array should contain 1-2 entries for the most relevant competitors you identify in their market.`;

  return `${PERSONA}\n\n${contextLine} Use this exact JSON schema:\n\n{\n  ${POSITIONING_AND_VOICE_SCHEMA},\n  ${competitiveBlock},\n  ${QUICK_WINS_SCHEMA}\n}\n\n${CLOSING}`;
}

function buildUserMessage(url: string, competitorUrls: string[]): string {
  if (competitorUrls.length > 0) {
    const competitors = competitorUrls.map((u, i) => `Competitor ${i + 1}: ${u}`).join("\n");
    return `Analyse this company's messaging and produce the Positioning Brief.\n\nPrimary company: ${url}\n${competitors}`;
  }
  return `Analyse this company's messaging and produce the Positioning Brief: ${url}`;
}

export async function POST(request: NextRequest) {
  try {
    const { url, competitorUrls } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "A valid URL is required." }, { status: 400 });
    }

    const validCompetitors: string[] = Array.isArray(competitorUrls)
      ? competitorUrls.filter((u: unknown) => typeof u === "string" && u.trim() !== "")
      : [];

    const response = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 8192,
      system: buildSystemPrompt(validCompetitors),
      messages: [
        {
          role: "user",
          content: buildUserMessage(url, validCompetitors),
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No response generated." },
        { status: 500 }
      );
    }

    const brief = JSON.parse(textBlock.text);
    return NextResponse.json(brief);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Analysis failed.";
    console.error("PRISM analyse error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
