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
            bot.sendMessage(TELEGRAM_CHAT_ID, `🚨 Streikalarm! Ruhrbahn erwähnt „Streik“. Überprüfen Sie Updates: ${RUHRBAHN_URL}`);
        } else {
            bot.sendMessage(TELEGRAM_CHAT_ID, '🚌 Kein Streik gemeldet.');
        }
    } else {
        // If the URL is not healthy, notify about the issue
        bot.sendMessage(process.env.TELEGRAM_CHAT_ID, `❗ Die Website ist nicht erreichbar oder hat ein Problem. Status: ${healthResponse.status} ❗`);
    }
  } catch (error) {
    console.error("Error scraping the website:", error);
    bot.sendMessage(process.env.TELEGRAM_CHAT_ID, '❗ Beim Verbinden mit der Website ist ein Fehler aufgetreten. ❗');
  }
}

// Run the scraper
checkForStrikes();
