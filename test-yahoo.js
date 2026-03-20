const yahooFinance = require('yahoo-finance2').default;
yahooFinance.quote('AAPL').then(console.log).catch(console.error);
