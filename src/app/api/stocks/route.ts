import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');
  
  let symbols = ['AAPL', 'NVDA', 'GOOGL', 'AMZN']; // Default symbols
  
  if (symbolsParam) {
    symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
  }

  try {
    const mockQuotes = symbols.map(symbol => {
      // Generate deterministic mock data based on symbol name so it doesn't jump too wildly
      const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const basePrice = (seed % 500) + 50;
      
      // Add some random fluctuation
      const fluctuation = (Math.random() - 0.5) * 10;
      const currentPrice = basePrice + fluctuation;
      
      const change = (Math.random() - 0.5) * 5;
      const changePercent = (change / basePrice) * 100;

      return {
        symbol,
        shortName: `${symbol} Inc.`,
        regularMarketPrice: parseFloat(currentPrice.toFixed(2)),
        regularMarketChange: parseFloat(change.toFixed(2)),
        regularMarketChangePercent: parseFloat(changePercent.toFixed(2)),
        regularMarketVolume: Math.floor(Math.random() * 50000000) + 1000000,
        marketCap: Math.floor(Math.random() * 2000000000000) + 10000000000,
      };
    });

    return NextResponse.json({
      data: mockQuotes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
  }
}
