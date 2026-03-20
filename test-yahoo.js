
const { YahooFinance } = require('yahoo-finance2');
const yahooFinance = new YahooFinance();

async function testYahooFinance() {
  try {
    const quote = await yahooFinance.quote('AAPL');
    console.log('AAPL Quote:', quote);
  } catch (error) {
    console.error('Error fetching AAPL quote:', error);
  }

  try {
    const quote = await yahooFinance.quote('INVALID_SYMBOL');
    console.log('INVALID_SYMBOL Quote:', quote);
  } catch (error) {
    console.error('Error fetching INVALID_SYMBOL quote (expected error):', error.message);
  }
}

testYahooFinance();
