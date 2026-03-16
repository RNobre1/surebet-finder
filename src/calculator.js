const chalk = require('chalk');

class SurebetCalculator {
  constructor(bets, config) {
    if (bets) this.bets = bets;
    this.surebets = [];
    this.config = config;
  }

  extract(bets) {
    if (bets) this.bets = bets;
    // If bets is empty or null, handle gracefully
    if (!this.bets || this.bets.length === 0) {
        console.log(chalk.yellow('No arbitrage opportunities received from API.'));
        return [];
    }

    // Since we are using the /arbitrage-bets endpoint, 'bets' ARE the surebets.
    // We just need to normalize them for display/investment calculation.
    this.surebets = this.bets; 
    
    // Attempt to calculate investment if structure allows, otherwise just pass through
    this.calculateInvestment();

    return this.surebets;
  }

  calculateInvestment() {
    console.log(chalk.cyan(`Processing ${this.surebets.length} arbitrage opportunities...`));

    for (let bet of this.surebets) {
      try {
        // Try to map API structure to our internal structure for printing
        // This is a BEST GUESS since we don't have the exact API response schema for /arbitrage-bets
        
        // If the bet has 'legs' (common in arb APIs), calculate stake for each leg
        if (bet.legs || bet.outcomes) {
            const legs = bet.legs || bet.outcomes;
            let investment = {};
            
            // Calculate implied probability sum (should be < 1 for arb)
            let sum = 0;
            legs.forEach(leg => {
                const price = leg.price || leg.odds;
                if (price) sum += 1 / price;
            });

            // Calculate stakes
            legs.forEach(leg => {
                const price = leg.price || leg.odds;
                const name = leg.name || leg.selection || 'Unknown';
                if (price) {
                    // Standard arb stake formula: (Total Investment * (1/Odds)) / ImpliedProbSum
                    // Or simpler: Investment / Odds (if we want equal return) -> but for arb we usually want equal profit
                    // Formula: Stake = (Total_Investment / Implied_Sum) / Odds
                    const stake = (this.config.earnings / sum) / price;
                    investment[name] = stake;
                }
            });
            
            bet.investment = investment;
            this.printVerbose(bet, legs);
        } else {
            // Fallback: just print the raw object nicely
            console.log(chalk.bold('Arbitrage Opportunity found (Raw Data):'));
            console.log(JSON.stringify(bet, null, 2));
            console.log('');
        }

      } catch (err) {
        console.error('Error processing bet for investment:', err.message);
        console.log('Raw bet data:', bet);
      }
    }
  }

  printVerbose(bet, legs) {
    // Try to extract info
    const sport = bet.sport_title || bet.sport_key || 'Unknown Sport';
    const event = bet.event ? `${bet.event.home} vs ${bet.event.away}` : 
                  (bet.home_team && bet.away_team ? `${bet.home_team} vs ${bet.away_team}` : 'Unknown Event');
    
    // Profit calculation if not provided
    let profit = bet.profit;
    if (profit === undefined && legs) {
         let sum = 0;
         legs.forEach(l => sum += 1/(l.price || l.odds));
         profit = (1 - sum) * 100; // approx %
    }

    console.log(
      chalk.bold(
        `${event} ${chalk.green(
          '±' + (profit ? Number(profit).toFixed(2) : '?') + '%'
        )}`
      )
    );
    console.log(`${sport}`);
    
    if (legs) {
        legs.forEach(leg => {
            const name = leg.name || leg.selection || 'Outcome';
            const price = leg.price || leg.odds || 0;
            const bookie = leg.bookmaker_title || leg.bookmaker || 'Unknown Bookie';
            const stake = bet.investment && bet.investment[name] ? `(Stake: ${bet.investment[name].toFixed(2)})` : '';
            
            console.log(`  ${name} @${price.toFixed(2)} [${bookie}] ${stake}`);
        });
    }
    console.log('');
  }
}

module.exports = SurebetCalculator;
