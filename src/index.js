const express = require('express');
const app = express();
const TelegramBot = require('node-telegram-bot-api');
const bodyParser = require('body-parser');
const axios = require('axios');
const request = require("request");
const fs = require('fs');
require('dotenv').config();

const port = 3000;
const url = 'https://api.telegram.org/bot';
const donald_trump_api = 'https://api.tronalddump.io';
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

bot.onText(/\/search/, (msg) => {
  bot.sendSticker(msg.chat.id, 'CAADAgAD8QYAAnlc4gkl_dcUtPY2AgI');
  bot.sendMessage(msg.chat.id, 'Amazing. Send me the word you want me to search for');

  bot.on('message', (req) => {
    axios.get(donald_trump_api + '/search/quote', {
      params: {
        query: req.text
      }
    })
    .then((response) => {
      //bot.sendMessage(msg.chat.id, `${response.data.count}`);
    })
    .catch((error) => {
      bot.sendMessage(msg.chat.id, 'Something went wrong. Try later');
      console.log('/search', error);
    });
  });
});

bot.onText(/\/random/, (msg) => {
  axios.get(donald_trump_api + '/random/quote')
  .then((response) => {
    bot.sendSticker(msg.chat.id, 'CAADAgAD7QYAAnlc4gnK88QdYpKR7AI');
    bot.sendMessage(msg.chat.id, `${response.data.value}`);
  })
  .catch((error) => {
    bot.sendMessage(msg.chat.id, 'Something went wrong. Try later');
    console.log('/random', error);
  });
});

bot.onText(/\/meme/, (msg) => {
  // axios.get(donald_trump_api + '/random/meme')
  // .then((response) => {
  //   bot.sendSticker(msg.chat.id, 'CAADAgAD7AYAAnlc4gmyzyRQT6BJSwI');
  //   bot.sendPhoto(msg.chat.id, response.data.toString());
  // })
  // .catch((error) => {
  //   bot.sendMessage(msg.chat.id, 'Something went wrong. Try later');
  //   console.log('/meme ', error);
  // });
  // const filename = "tmp_pic/"+microtime.now()+".png"; 
  // const test_link = 'https://api.tronalddump.io/random/meme';
  // // bot.sendPhoto(msg.chat.id, `https://api.tronalddump.io/random/meme`);
  // request(test_link).pipe(fs.createWriteStream(filename).on('close', function() {
  //   // done download file
  //   bot.sendPhoto(msg.chat.id, filename).then(function(){
  //   // photo sent, deleted temp file
  //     fs.unlinkSync(filename);
  //   });
  // }));

  axios.get(donald_trump_api + '/random/meme', {
    responseType: 'stream'
  })
  .then((response) => {
    response.data.pipe(fs.createWriteStream('image.jpg'));
  })
  .catch((error) => {
    console.log(error);
  });

  bot.sendPhoto(msg.chat.id, 'image.jpg');
});