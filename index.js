require('dotenv/config');
const axios = require('axios');
const cheerio = require('cheerio');
const TelegramBot = require('node-telegram-bot-api');

// Load environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const RUHRBAHN_URL = process.env.RUHRBAHN_URL;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

async function checkForStrikes() {
  try {
    const healthResponse = await axios.head(RUHRBAHN_URL);

    if (healthResponse.status === 200) {
        console.log("Checking for strike updates...");
        const { data } = await axios.get(RUHRBAHN_URL);
        const $ = cheerio.load(data);
    
        let found = false;
        $("body").each((_, element) => {
          const text = $(element).text();
          if (text.includes("streik")) {
            found = true;
          }
        });
    
        if (found) {
            bot.sendMessage(TELEGRAM_CHAT_ID, `🚨 Strike Alert! Ruhrbahn mentions "Streik". Check updates: ${RUHRBAHN_URL}`);
        } else {
            bot.sendMessage(TELEGRAM_CHAT_ID, '🚌 No Strike has been reported.');
        }
    } else {
        // If the URL is not healthy, notify about the issue
        bot.sendMessage(process.env.TELEGRAM_CHAT_ID, `❗ The website is unreachable or has an issue. status : ${healthResponse.status} ❗`);
    }
  } catch (error) {
    console.error("Error scraping the website:", error);
    bot.sendMessage(process.env.TELEGRAM_CHAT_ID, '❗ There was an error connecting to the website. ❗');
  }
}

// Run the scraper
checkForStrikes();
