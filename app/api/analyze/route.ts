import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SCRAPE_PATHS = ["/", "/product", "/products", "/pricing", "/about", "/blog"];

async function fetchPageText(pageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(pageUrl, {
      headers: { "User-Agent": "PrismBot/1.0 (messaging-analysis)" },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);
    $("script, style, nav, footer, header, noscript, iframe, svg").remove();
    const text = $("body").text().replace(/\s+/g, " ").trim();
    return text.length > 50 ? text : null;
  } catch {
    return null;
  }
}

function normalizeBaseUrl(raw: string): string {
  let u = raw.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  const parsed = new URL(u);
  return `${parsed.protocol}//${parsed.host}`;
}

interface ScrapeResult {
  scrapedPages: string[];
  context: string;
}

async function scrapesite(url: string): Promise<ScrapeResult> {
  const base = normalizeBaseUrl(url);
  const fetches = SCRAPE_PATHS.map(async (path) => {
    const fullUrl = base + path;
    const text = await fetchPageText(fullUrl);
    return { path, text };
  });

  const results = await Promise.all(fetches);
  const scrapedPages: string[] = [];
  const blocks: string[] = [];

  for (const { path, text } of results) {
    if (text) {
      scrapedPages.push(path);
      const label = path === "/" ? "Homepage" : path;
      blocks.push(`--- ${label} ---\n${text.slice(0, 6000)}`);
    }
  }

  return { scrapedPages, context: blocks.join("\n\n") };
}

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
    ? `You are given a primary company URL and ${competitorUrls.length} competitor URL${competitorUrls.length > 1 ? "s" : ""}. These competitors were specified by the user and take absolute precedence — do not substitute, supplement, or second-guess them. Anchor your entire competitive analysis around these specific companies. Produce a Positioning Brief for the primary company. The war_room array must contain one entry per competitor — each a direct head-to-head war room brief, not a general market read.`
    : `Given a company URL, produce a Positioning Brief. For the war_room, identify 1-2 competitors by reasoning about which companies a buyer would genuinely shortlist in an actual procurement or switching decision for this specific company. Apply these filters in order: (1) companies of similar size and stage — a 20-person Series A startup does not compete with Salesforce in a real deal; (2) companies targeting the same ICP with overlapping use cases; (3) companies that appear in the same analyst reports, G2 categories, or competitive shortlists. Do NOT name obvious large-scale incumbents (e.g. Google, Microsoft, Salesforce, AWS) unless they are genuinely relevant to this company's specific market segment and deal cycles. The goal is accuracy about who actually shows up in the same buying conversations, not breadth of category coverage.`;

  return `${PERSONA}\n\n${contextLine} Use this exact JSON schema:\n\n{\n  ${POSITIONING_AND_VOICE_SCHEMA},\n  ${competitiveBlock},\n  ${QUICK_WINS_SCHEMA}\n}\n\n${CLOSING}`;
}

function buildUserMessage(
  url: string,
  competitorUrls: string[],
  primaryScrape: ScrapeResult,
  competitorScrapes: { url: string; scrape: ScrapeResult }[]
): string {
  let msg = "";

  if (primaryScrape.context) {
    // Pages successfully scraped: listed here for transparency
    msg += `I have scraped the following pages from ${url}: ${primaryScrape.scrapedPages.join(", ")}\n\n`;
    msg += `Here is the extracted website content for the primary company:\n\n${primaryScrape.context}\n\n`;
  }

  for (const { url: compUrl, scrape } of competitorScrapes) {
    if (scrape.context) {
      msg += `Scraped pages from competitor ${compUrl}: ${scrape.scrapedPages.join(", ")}\n\n`;
      msg += `Extracted content for ${compUrl}:\n\n${scrape.context}\n\n`;
    }
  }

  if (competitorUrls.length > 0) {
    const competitors = competitorUrls.map((u, i) => `Competitor ${i + 1}: ${u}`).join("\n");
    msg += `Analyse this company's messaging and produce the Positioning Brief.\n\nPrimary company: ${url}\n${competitors}`;
  } else {
    msg += `Analyse this company's messaging and produce the Positioning Brief: ${url}`;
  }

  return msg;
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

    const [primaryScrape, ...competitorScrapeResults] = await Promise.all([
      scrapesite(url),
      ...validCompetitors.map((compUrl) =>
        scrapesite(compUrl).then((scrape) => ({ url: compUrl, scrape }))
      ),
    ]);

    const competitorScrapes = competitorScrapeResults as { url: string; scrape: ScrapeResult }[];

    const response = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 8192,
      system: buildSystemPrompt(validCompetitors),
      messages: [
        {
          role: "user",
          content: buildUserMessage(url, validCompetitors, primaryScrape, competitorScrapes),
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
