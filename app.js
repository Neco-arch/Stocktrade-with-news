require("dotenv").config();
const axios = require("axios");
const { GoogleGenAI, Type } = require("@google/genai");
const { prisma } = require("./lib/prisma.js");
const { Alpaca } = require("@alpacahq/alpaca-trade-api");

class StockTrading {
  constructor(newsdata = []) {
    this.newsdata = newsdata;
    this.stockinconsider = null;
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    this.alpaca = new Alpaca({
      keyId: process.env.APCA_API_KEY_ID,
      secret: process.env.APCA_API_SECRET_KEY,
      paper: true,
    });
  }

  async DeleteUntil() {
    const nowtime = new Date();
    const data = await prisma.stockHistory.findMany({
      select: {
        stockticker: true,
        date: true,
      },
    });

    for (let i = 0; i < data.length; i++) {
      const timeindatabase = new Date(data[i].date);

      const endTime = new Date(
        timeindatabase.getTime() + 3 * 24 * 60 * 60 * 1000,
      );

      if (nowtime > endTime) {
        console.log("Deleted");
        await prisma.stockHistory.delete({
          where: {
            stockticker: data[i].stockticker,
          },
        });
      }
    }
  }


  async Aianyalzenews() {

    // Get news
    try {
      const result = await axios.get(
        "https://api.massive.com/v2/reference/news",
        {
          params: {
            limit: 70,
            apiKey: process.env.MASSIVE_API,
            order: "desc",
          },
        },
      );
      for (let i = 0; i < result.data.results.length; i++) {
        const putdata = result.data.results[i];
        this.newsdata.push({
          title: putdata.title,
          author: putdata.author,
          context: putdata.description,
        });
      }
    } catch (error) {
      console.log(error);
    }


    // Anaylze setiment
    const response = await this.ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: [
        `Analyze the following list of stock news and provide the sentiment for each stock ticker: ${JSON.stringify(this.newsdata)}`,
      ],
      config: {
        systemInstruction:
          "You are a Wall Street investor. Analyze stock news and keep rationale brief and punchy.",
        maxOutputTokens: 2000,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              ticker: {
                type: Type.STRING,
                description: "The stock ticker symbol (e.g. AAPL, NVDA)",
              },
              testament: {
                type: Type.STRING,
                enum: ["Positive", "Negative"],
                description: "Sentiment verdict: strictly Positive or Negative",
              },
            },
            required: ["ticker", "testament"],
          },
        },
      },
    });

    this.stockinconsider = JSON.parse(response.text);

    // Analyze Fundemental and Save to db
    const result = await this.ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: [
        `Analyze the following list of stocks with sentiment. Analyze these companies fundamentally, drop companies with weak foundations, set a 12-18 month price target, and keep the list diversified: ${JSON.stringify(this.stockinconsider)}`,
      ],
      config: {
        systemInstruction:
          "You are a Wall Street investor. Analyze stocks with a fundamental style and keep rationale brief and punchy.",
        maxOutputTokens: 10000,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              stockticker: {
                type: Type.STRING,
                description: "The stock ticker symbol (e.g. AAPL, NVDA)",
              },
              pricetarget: {
                type: Type.NUMBER,
                description:
                  "Prediction of what a stock's price will be in 12 to 18 months Also reference from top analysis too and don't care about stock spliter",
              },
              reason: {
                type: Type.STRING,
                description: "Reason why this stock has strong fundamentals",
              },
            },
            required: ["stockticker", "pricetarget", "reason"],
          },
        },
      },
    });
    const data = JSON.parse(result.text);
    for (let i = 0; i < data.length; i++) {}
    try {
      await prisma.stockHistory.createMany({
        data: data,
        skipDuplicates: false,
      });
    } catch (error) {
      throw error;
    }
  }

  async Buystock() {
    const stocktobuy = await prisma.stockHistory.findMany({
      select: {
        stockticker: true,
      },
    });

    for (const item of stocktobuy) {
      try {
        const account = await this.alpaca.trading.account.getAccount();
        const order = await this.alpaca.trading.orders.market({
          symbol: item.stockticker,
          side: "buy",
          notional: Number(account.buyingPower * 0.2).toFixed(2),
          timeInForce: "day",
        });
        console.log("Buy :" + order);
      } catch (error) {
        console.log(error);
      }
    }
  }

  async sellstock() {
    const stocks = [];
    try {
      const data = await this.alpaca.trading.positions.getAllOpenPositions();
      const data2 = await this.alpaca.trading.orders.getAllOrders();
      for (let item of data) {
        stocks.push(item.symbol);
      }

      for (let stock of data2) {
        stocks.push(stock.symbol);
      }

      const removedupe = Array.from(new Set(stocks));

      const target = await prisma.stockHistory.findMany({
        where: {
          stockticker: {
            notIn: removedupe,
          },
        },
      });
      for (let item of target) {
      await this.alpaca.trading.positions.deleteOpenPosition(item.stockticker)
      }
      return

    } catch (error) {
      throw error;
    }
  }
}



module.exports = { StockTrading }