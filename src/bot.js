const Bot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');

const donald_trump_api = 'https://api.tronalddump.io';
const TOKEN = process.env.TOKEN;

// import constants
const greetings = require('./assets/constants').greetings;

let bot;
if(process.env.NODE_ENV === 'production') {
  bot = new Bot(TOKEN);
  bot.setWebHook(process.env.HEROKU_URL + bot.TOKEN);
}
else {
  bot = new Bot(TOKEN, { polling: true });
}

console.log('Bot server started in the ' + process.env.NODE_ENV + ' mode');

bot.onText(/\/start/, (msg) => {
  // send Trump sticker
  bot.sendSticker(msg.chat.id, 'CAADAgADBgcAAnlc4glH5cgIGdkEZwI');
  bot.sendMessage(msg.chat.id, greetings);
});

let answerCallbacks = {};
bot.on('message', (msg) => {
  const callback = answerCallbacks[msg.chat.id];
  if (callback) {
    delete answerCallbacks[msg.chat.id];
    return callback(msg);
  }
});

let total;
let numberOfPages = 1;
const getPagination = (current, maxPage) => {
  const keys = [];
  if (current > 1) {
    keys.push({
      text: `«1`,
      callback_data: '1'
    });
  }
  if (current > 2) {
    keys.push({
      text: `‹${current-1}`,
      callback_data: (current-1).toString()
    });
  }
  keys.push({ 
    text: `-${current}-`,
    callback_data: current.toString()
  });
  if (current < maxPage - 1) {
    keys.push({
      text: `${current + 1}›`,
      callback_data: (current + 1).toString()
    });
  }
  if (current < maxPage) { 
    keys.push({
      text: `${maxPage}»`,
      callback_data: maxPage.toString()
    });
  }

  return {
    reply_markup: JSON.stringify({
      inline_keyboard: [ keys ]
    })
  };
}

let quotes = [];
bot.onText(/\/search/, (msg) => {
  bot.sendSticker(msg.chat.id, 'CAADAgAD8QYAAnlc4gkl_dcUtPY2AgI');
  bot.sendMessage(msg.chat.id, 'Amazing. Send me the word you want me to search for')
    .then(() => {
      answerCallbacks[msg.chat.id] = (answer) => {
        axios.get(donald_trump_api + '/search/quote', {
          params: {
            query: answer.text
          }
        })
          .then((response) => {
            quotes =  response.data._embedded.quotes;
            total = response.data.total;
            numberOfPages = total % 3 === 1 ? Math.round( (total / 3) + 1) : Math.round( (total / 3));
            
            if (total <= 0) {
              bot.sendMessage(msg.chat.id, 'No results. Try to search for something else');
            }
            else if (total >= 3) {
              bot.sendMessage(msg.chat.id, `Page: 1\n\n${quotes[0].value}\n\n${quotes[1].value}\n\n${quotes[2].value}`, getPagination(1, numberOfPages));
            }
            else {
              if (total % 3 === 1) {
                bot.sendMessage(msg.chat.id, `Page: 1\n\n${quotes[0].value}`, getPagination(1, numberOfPages));
              }
              else if (total % 3 === 2) {
                bot.sendMessage(msg.chat.id, `Page: 1\n\n${quotes[0].value}\n\n${quotes[1].value}`, getPagination(1, numberOfPages));
              }
            }
          })
          .catch((error) => {
            bot.sendMessage(msg.chat.id, 'Something went wrong. Try later');
            console.log('/search ', error);
          });
      }
    })
});

bot.onText(/\/random/, (msg) => {
  axios.get(donald_trump_api + '/random/quote')
    .then((response) => {
      bot.sendSticker(msg.chat.id, 'CAADAgAD7QYAAnlc4gnK88QdYpKR7AI')
        .then(() => {
          if (typeof response.data._embedded.source[0].url !== undefined) {
            bot.sendMessage(msg.chat.id, `${response.data.value}`, {
              reply_markup: {
                inline_keyboard: [
                  [{
                    text: 'open',
                    url: response.data._embedded.source[0].url
                  }],
                  [{
                    text: 'next random quote',
                    callback_data: 'next_random_quote'
                  }]
                ]
              }
            });
          }
          else {
            bot.sendMessage(msg.chat.id, `${response.data.value}`);
          }
        })
        .catch((error) => {
          bot.sendMessage(msg.chat.id, 'Something went wrong. Try later');
          console.log('/random, sendSticker: ', error);      
        })
    })
    .catch((error) => {
      bot.sendMessage(msg.chat.id, 'Something went wrong. Try later');
      console.log('/random: ', error);
    });
});

bot.onText(/\/meme/, (msg) => {
  axios.get(donald_trump_api + '/random/meme', {
    responseType: 'stream'
  })
    .then((response) => {
      response.data.pipe(fs.createWriteStream('src/assets/image.jpg'));
    })
    .catch((error) => {
      bot.sendMessage(msg.chat.id, 'Something went wrong. Try later');
      console.log('/meme: ', error);
    });

  bot.sendPhoto(msg.chat.id, 'src/assets/image.jpg', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'next random meme',
            callback_data: 'next_random_meme'
          }
        ]
      ]
    }
  });
});

bot.on("callback_query", (callbackQuery) => {
  const msg = callbackQuery.message;
  const data = callbackQuery.data;
  bot.answerCallbackQuery(callbackQuery.id)
    .then(() => {
      if (data === 'next_random_meme') {
        axios.get(donald_trump_api + '/random/meme', {
          responseType: 'stream'
        })
          .then((response) => {
            response.data.pipe(fs.createWriteStream('src/assets/image.jpg'));
          })
          .catch((error) => {
            bot.sendMessage(msg.chat.id, 'Something went wrong. Try later');
            console.log('/meme: ', error);
          });
      
        bot.sendPhoto(msg.chat.id, 'src/assets/image.jpg', {
          reply_markup: {
            inline_keyboard: [
              [{
                  text: 'next random meme',
                  callback_data: 'next_random_meme'
              }]
            ]
          }
        });
      }
      else if (data === 'next_random_quote') {
        axios.get(donald_trump_api + '/random/quote')
        .then((response) => {
          bot.sendSticker(msg.chat.id, 'CAADAgAD7QYAAnlc4gnK88QdYpKR7AI')
            .then(() => {
              if (typeof response.data._embedded.source[0].url !== undefined) {
                bot.sendMessage(msg.chat.id, `${response.data.value}`, {
                  reply_markup: {
                    inline_keyboard: [
                      [{
                        text: 'open',
                        url: response.data._embedded.source[0].url
                      }],
                      [{
                        text: 'next random quote',
                        callback_data: 'next_random_quote'
                      }]
                    ]
                  }
                });
              }
              else {
                bot.sendMessage(msg.chat.id, `${response.data.value}`);
              }
            })
            .catch((error) => {
              bot.sendMessage(msg.chat.id, 'Something went wrong. Try later');
              console.log('/random, sendSticker: ', error);      
            })
        })
        .catch((error) => {
          bot.sendMessage(msg.chat.id, 'Something went wrong. Try later');
          console.log('/random: ', error);
        });
      }
      else if (typeof parseInt(data) === "number") {
        let current = parseInt(data);
        const editOptions = Object.assign(
          {},
          getPagination(parseInt(data), numberOfPages),
          { 
            chat_id: msg.chat.id,
            message_id: msg.message_id
          }
        );
        // bot.editMessageText('Page: ' + data, editOptions);
        if (numberOfPages - current !== 0) {
          bot.editMessageText(`Page: ${current}\n\n${quotes[current * 3 - 3].value}\n\n${quotes[current * 3 - 2].value}\n\n${quotes[current * 3 - 1].value}`, editOptions);
        }
        else {
          if (total % 3 === 0) {
            bot.editMessageText(`Page: ${current}\n\n${quotes[current * 3 - 3].value}\n\n${quotes[current * 3 - 2].value}\n\n${quotes[current * 3 - 1].value}`, editOptions);
          }
          else if (total % 3 === 1) {
            bot.editMessageText(`Page: ${current}\n\n${quotes[current * 3 - 3].value}`, editOptions);
          }
          else if (total % 3 === 2) {
            bot.editMessageText(`Page: ${current}\n\n${quotes[current * 3 - 3].value}\n\n${quotes[current * 3 - 2].value}`, editOptions);
          }
        }
      }
    });
});

module.exports = bot;
