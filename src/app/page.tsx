'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Search, TrendingUp, TrendingDown, Clock } from 'lucide-react';

interface StockData {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume?: number;
  marketCap?: number;
}

export default function Home() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'gainers' | 'losers'>('all');
  const [customSymbols, setCustomSymbols] = useState<string[]>(['AAPL', 'NVDA', 'GOOGL', 'AMZN']);
  const [newSymbolInput, setNewSymbolInput] = useState('');

  const fetchStocks = useCallback(async (symbolsToFetch?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const symbolsString = symbolsToFetch && symbolsToFetch.length > 0
        ? symbolsToFetch.join(',')
        : customSymbols.join(',');

      const url = `/api/stocks?symbols=${encodeURIComponent(symbolsString)}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch stock data');
      }
      const result = await response.json();
      setStocks(result.data);
      setLastRefresh(result.timestamp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [customSymbols]);

  useEffect(() => {
    fetchStocks(customSymbols);
  }, [fetchStocks, customSymbols]);

  const handleRefresh = () => {
    fetchStocks(customSymbols);
  };

  const handleAddSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSymbolInput.trim() && !customSymbols.includes(newSymbolInput.trim().toUpperCase())) {
      const updatedSymbols = [...customSymbols, newSymbolInput.trim().toUpperCase()];
      setCustomSymbols(updatedSymbols);
      setNewSymbolInput('');
      fetchStocks(updatedSymbols);
    }
  };

  const handleDeleteSymbol = (symbolToDelete: string) => {
    const updatedSymbols = customSymbols.filter(symbol => symbol !== symbolToDelete);
    setCustomSymbols(updatedSymbols);
    fetchStocks(updatedSymbols);
  };

  const filteredStocks = stocks.filter(stock => {
    // Apply search filter
    const matchesSearch =
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (stock.shortName && stock.shortName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (stock.longName && stock.longName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Apply gainers/losers filter
    if (filter === 'gainers') return stock.regularMarketChange > 0;
    if (filter === 'losers') return stock.regularMarketChange < 0;

    return true;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value / 100);
  };

  const formatMarketCap = (value?: number) => {
    if (!value) return 'N/A';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return formatCurrency(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Market Dashboard</h1>
            <p className="text-gray-500 mt-1">Real-time stock data from Yahoo Finance</p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>

            {lastRefresh && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>Last updated: {new Date(lastRefresh).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </header>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Search in current list */}
          <div className="md:col-span-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Filter by symbol or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
            />
          </div>

          {/* Filter Gainers/Losers */}
          <div className="md:col-span-3 flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
            {(['all', 'gainers', 'losers'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                  filter === f
                    ? 'bg-gray-100 text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Custom Symbols Search */}
          <form onSubmit={handleAddSymbol} className="md:col-span-5 flex gap-2">
            <input
              type="text"
              placeholder="Enter symbols (e.g. AAPL, MSFT)"
              value={newSymbolInput}
              onChange={(e) => setNewSymbolInput(e.target.value)}
              className="block w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              Add Symbol
            </button>
          </form>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Data Grid */}
        {loading && stocks.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm animate-pulse h-32">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : filteredStocks.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-gray-100 shadow-sm text-center">
            <p className="text-gray-500 text-lg">No stocks found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStocks.map((stock) => {
              const isPositive = stock.regularMarketChange >= 0;
              return (
                <div key={stock.symbol} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{stock.symbol}</h3>
                      <p className="text-xs text-gray-500 truncate max-w-[150px]" title={stock.shortName || stock.longName}>
                        {stock.shortName || stock.longName || 'Unknown'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                        isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {formatPercent(stock.regularMarketChangePercent)}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteSymbol(stock.symbol); }}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="Delete symbol"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x text-gray-400 hover:text-gray-600">
                          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(stock.regularMarketPrice)}
                    </div>
                    <div className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : ''}{formatCurrency(stock.regularMarketChange)}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between text-xs text-gray-500">
                    <div>
                      <span className="block text-gray-400">Vol</span>
                      {stock.regularMarketVolume ? (stock.regularMarketVolume / 1e6).toFixed(2) + 'M' : 'N/A'}
                    </div>
                    <div className="text-right">
                      <span className="block text-gray-400">Mkt Cap</span>
                      {formatMarketCap(stock.marketCap)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
