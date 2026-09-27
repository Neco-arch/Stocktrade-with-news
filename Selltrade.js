// api/run.js
require("dotenv").config();
const { StockTrading } = require("./app"); 

async function Runtask() {
  try {
    const Stock = new StockTrading();
    const ismarketday = await Stock.alpaca.trading.clock.clock()
    if (ismarketday.clocks[7].phase === "closed") {
        await Stock.sellstock()
    } else {
      return
    }

    return console.log("Sell stock successfully")
  } catch (error) {
    return console.error("Error happen" + error)
  }
}

Runtask()