// api/run.js
require("dotenv").config();
const { StockTrading } = require("./app.js"); // Import your StockTrading class

async function Runtask() {
  try {
    const Stock = new StockTrading();
    const ismarketday = await Stock.alpaca.trading.clock.clock()
    if (ismarketday.clocks[7].isMarketDay) {
          await Stock.DeleteUntil();
          await Stock.Aianyalzenews();
          await Stock.Buystock()
    } else {
      return
    }
    return console.log("Trade successfully")
  } catch (error) {
    return console.error("Cron execution error:", error);
  }
}

Runtask()