import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

type StockData = {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume?: number;
  marketCap?: number;
};

type YahooQuote = {
  symbol?: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number | null;
  regularMarketChange?: number | null;
  regularMarketChangePercent?: number | null;
  regularMarketVolume?: number | null;
  marketCap?: number | null;
};

// Create a long-lived client instance so it can reuse cookies/crumbs.
const yahooFinance = new YahooFinance();

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { expiresAt: number; data: StockData[]; timestamp: string }>();
const negativeCache = new Map<string, { expiresAt: number; error: string }>();
let rateLimitedUntil = 0;
let rateLimitStrikeCount = 0;
const rateLimitedMessage =
  'Yahoo Finance rate-limited you (Too Many Requests). Please wait a moment and try again.';
const RATE_LIMIT_BASE_MS = 20_000;
const RATE_LIMIT_MAX_MS = 3_600_000; // 1 hour cap
const STALE_WHILE_RATE_LIMITED_MS = 15 * 60_000; // show last good data for 15 minutes

function normalizeSymbols(input: string[], maxSymbols = 25) {
  // Normalize + de-dupe, while preventing extremely large symbol lists.
  const cleaned = input
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  return Array.from(new Set(cleaned)).slice(0, maxSymbols);
}

function isTooManyRequests(error: unknown) {
  const msg = typeof error === 'string' ? error : (error as any)?.message ?? String(error);
  return msg.includes('Too Many Requests') || msg.includes('429');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');
  
  const defaultSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'JPM', 'V', 'WMT'];
  let symbols = defaultSymbols;
  
  if (symbolsParam) {
    // Accept both comma- and whitespace-separated inputs: "AAPL, MSFT" or "AAPL MSFT".
    symbols = symbolsParam
      .split(/[,\s]+/g)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
  }

  const normalizedSymbols = normalizeSymbols(symbols);
  if (normalizedSymbols.length === 0) {
    return NextResponse.json({ error: 'No symbols provided' }, { status: 400 });
  }

  const cacheKey = normalizedSymbols.join(',');

  // Yahoo throttling is effectively global from our IP/session.
  // Short-circuit any requests during the cooldown to avoid repeated Yahoo calls.
  if (Date.now() < rateLimitedUntil) {
    const cached = cache.get(cacheKey);
    if (cached) {
      const ageMs = Date.now() - new Date(cached.timestamp).getTime();
      if (ageMs < STALE_WHILE_RATE_LIMITED_MS) {
        return NextResponse.json({ data: cached.data, timestamp: cached.timestamp });
      }
    }
    return NextResponse.json({ error: rateLimitedMessage }, { status: 429 });
  }

  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ data: cached.data, timestamp: cached.timestamp });
  }

  const negativeCached = negativeCache.get(cacheKey);
  if (negativeCached && negativeCached.expiresAt > Date.now()) {
    return NextResponse.json({ error: negativeCached.error }, { status: 429 });
  }

  try {
    // Avoid hammering Yahoo: quote() supports multiple symbols at once.
    const quotes = (await yahooFinance.quote(normalizedSymbols)) as YahooQuote[];

    const data: StockData[] = (Array.isArray(quotes) ? quotes : [quotes])
      .filter((q) => q && q.symbol)
      .map((quote) => ({
        symbol: quote.symbol as string,
        shortName: quote.shortName,
        longName: quote.longName,
        regularMarketPrice: quote.regularMarketPrice ?? 0,
        regularMarketChange: quote.regularMarketChange ?? 0,
        regularMarketChangePercent: quote.regularMarketChangePercent ?? 0,
        regularMarketVolume: quote.regularMarketVolume ?? undefined,
        marketCap: quote.marketCap ?? undefined,
      }));

    const timestamp = new Date().toISOString();
    cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, data, timestamp });
    rateLimitStrikeCount = 0;

    return NextResponse.json({
      data,
      timestamp,
    });
  } catch (error) {
    console.error('Error fetching stock data:', error);
    if (isTooManyRequests(error)) {
      rateLimitStrikeCount += 1;
      const backoffMs = Math.min(
        RATE_LIMIT_MAX_MS,
        RATE_LIMIT_BASE_MS * Math.pow(2, rateLimitStrikeCount - 1)
      );
      rateLimitedUntil = Date.now() + backoffMs;
      negativeCache.set(cacheKey, {
        expiresAt: Date.now() + backoffMs,
        error: rateLimitedMessage,
      });
      return NextResponse.json(
        { error: rateLimitedMessage },
        { status: 429 }
      );
    }
    const message =
      error instanceof Error ? error.message : (error as any)?.message ?? String(error);
    return NextResponse.json({ error: message || 'Failed to fetch stock data' }, { status: 500 });
  }
}
