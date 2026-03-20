const { YahooFinance } = require('yahoo-finance2');
const yahooFinance = new YahooFinance();
async function test() {
  try {
    const quote = await yahooFinance.quote('AAPL');
    console.log(quote.symbol);
  } catch (e) {
    console.error(e);
  }
}
test();
