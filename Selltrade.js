// api/run.js
require("dotenv").config();
const { StockTrading } = require("./app"); 

export default async function handler(request, response) {
  // 1. Security Check: Ensure only Vercel Cron can call this
  const authHeader = request.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  try {
    const Stock = new StockTrading();
    const ismarketday = await Stock.alpaca.trading.clock.clock()
    if (ismarketday.clocks[7].phase === "closed") {
        await Stock.sellstock()
    }

    return response.status(200).json({ success: true, message: "Script completed successfully" });
  } catch (error) {
    console.error("Cron execution error:", error);
    return response.status(500).json({ error: error.message });
  }
}