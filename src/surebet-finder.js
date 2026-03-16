const MatchesAggregator = require('./aggregator');
const SurebetCalculator = require('./calculator');

class SurebetFinder {
  constructor(apiKey, config) {
    this.config = config;
    this.aggregator = new MatchesAggregator(apiKey, config);
    this.calculator = new SurebetCalculator(null, config);

    this.surebets = [];
    this.bets = [];
  }
  async run(mode = 'all') {
    if (mode === 'surebets') {
      await this.aggregator.fetchArbitrageBets();
    } else if (mode === 'valuebets') {
      await this.aggregator.fetchValueBets();
    } else {
      await this.aggregator.run();
    }

    const bets = this.aggregator.getBets();
    const results = this.calculator.extract(bets);

    this.surebets = results.surebets;
    this.valueBets = results.valueBets;

    return results;
  }

  getSurebets() {
    return this.surebets;
  }

  getValueBets() {
    return this.valueBets;
  }
}

module.exports = SurebetFinder;
