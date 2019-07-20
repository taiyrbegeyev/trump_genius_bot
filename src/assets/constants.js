const greetings = "I am a Trump Bot. I can search for the dumbest things Donald Trump has ever said by keyword, tag, and send you memes on a daily basis.\n\n\
Available commands:\n\
/start - show available commands \n\
/search - search quotes\n\
/tag - get a quote by a given tag\n\
/random - get a random quote\n\
/meme - get a random meme";

const commands = ['start', 'search', 'tag', 'random', 'meme'];

module.exports = {
  greetings: greetings,
  commands: commands
};