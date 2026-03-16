const SurebetFinder = require('./src/surebet-finder.js');
const apiKey = require('dotenv').config().parsed.API_KEY;
const fs = require('fs');
const config = require('./config.js');

(async function() {
  let bot = new SurebetFinder(apiKey, config);
  let surebets;
  let valueBets;

  const args = process.argv.slice(2);
  let mode = 'all';
  if (args.includes('surebets')) mode = 'surebets';
  else if (args.includes('valuebets')) mode = 'valuebets';

  await bot.run(mode);
  surebets = bot.getSurebets();
  valueBets = bot.getValueBets();

  let content = {
    time: new Date(),
    surebets: surebets,
    valueBets: valueBets
  };

  fs.writeFileSync('./output.json', JSON.stringify(content, null, 2), 'utf-8');

})();
