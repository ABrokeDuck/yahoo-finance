async function fetchYahooFinance() {
  try {
    const { default: YahooFinance } = await import('yahoo-finance2');
    const yf = new YahooFinance();
    const result = await yf.quote('AAPL');
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

fetchYahooFinance();
