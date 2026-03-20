import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');
  
  let symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'JPM', 'V', 'WMT'];
  
  if (symbolsParam) {
    symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());
  }

  try {
    const quotes = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const quote = await yahooFinance.quote(symbol);
          return quote;
        } catch (error) {
          console.error(`Error fetching ${symbol}:`, error);
          return null;
        }
      })
    );

    const validQuotes = quotes.filter(q => q !== null);
    
    return NextResponse.json({
      data: validQuotes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
  }
}
