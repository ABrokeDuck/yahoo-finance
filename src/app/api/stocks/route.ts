import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');
  
  let symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'JPM', 'V', 'WMT'];
  
  if (symbolsParam) {
    symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());
  }

  try {
    const mockQuotes = symbols.map(symbol => ({
      symbol,
      shortName: `${symbol} Company`,
      regularMarketPrice: parseFloat((Math.random() * 1000).toFixed(2)),
      regularMarketChange: parseFloat(((Math.random() - 0.5) * 20).toFixed(2)),
      regularMarketChangePercent: parseFloat(((Math.random() - 0.5) * 2).toFixed(2)),
      regularMarketVolume: Math.floor(Math.random() * 100000000),
      marketCap: Math.floor(Math.random() * 1000000000000),
    }));

    return NextResponse.json({
      data: mockQuotes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
  }
}
