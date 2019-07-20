const express = require('express');
const app = express();
const TelegramBot = require('node-telegram-bot-api');
const bodyParser = require('body-parser');
require('dotenv').config();

const port = 3000;
const url = 'https://api.telegram.org/bot';
const TOKEN = process.env.API_KEY;

// import constants
const greetings = require('./assets/constants').greetings;
const commands = require('./assets/constants').commands;

const bot = new TelegramBot(TOKEN, { polling: true });

// parse the updates to JSON
app.use(bodyParser.json());

// We are receiving updates at the route below!
app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Start Express Server
app.listen(port, () => {
  console.log(`Express server is listening on ${port}`);
});

bot.onText(/\/start/, (msg) => {
  // send Trump sticker
  bot.sendSticker(msg.chat.id, 'CAADAgADBgcAAnlc4glH5cgIGdkEZwI');
  bot.sendMessage(msg.chat.id, greetings);
});

