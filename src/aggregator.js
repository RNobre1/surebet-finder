const axios = require('axios');

class MatchesAggregator {
  constructor(apiKey, config) {
    this.apiKey = apiKey;
    this.config = config;
    this.http = axios.create({
      baseURL: 'https://api.odds-api.io/v3/',
      params: {
        apiKey: this.apiKey
      }
    });
    this.surebets = [];
  }

  async run() {
    try {
      console.log('Fetching arbitrage opportunities...');
      console.log(`Using bookmakers: ${this.config.bookmakers}`);
      
      // Calculate timestamp for 96 hours (4 days) from now
      const now = new Date();
      const futureDate = new Date(now.getTime() + 96 * 60 * 60 * 1000);
      const commenceTimeTo = futureDate.toISOString();
      console.log(`Filtering events starting before: ${commenceTimeTo}`);

      // Sports to check
      // Common sports between Betano and Estrela Bet (excluding Handball and Baseball)
      const sports = [
          'football', 
          'basketball',
          'american-football',
          'ice-hockey',
          'rugby', // Note: API might use 'rugby-union' or 'rugby-league'. Using 'rugby' to see if it catches both or needs specific slugs.
          'volleyball',
          'tennis'
      ];
      let allArbs = [];

      for (const sport of sports) {
        try {
            console.log(`Checking ${sport}...`);
            const { data: arbs } = await this.http.get('arbitrage-bets', {
                params: {
                  bookmakers: this.config.bookmakers,
                  sport: sport,
                  commenceTimeTo: commenceTimeTo
                }
            });
            
            // Check if response is array (some APIs return error object on empty/fail)
            if (Array.isArray(arbs)) {
                console.log(`Found ${arbs.length} arbs for ${sport}.`);
                allArbs = allArbs.concat(arbs);
            } else {
                 console.log(`Unexpected response format for ${sport}.`);
            }

        } catch (err) {
             // Handle 404 (often means no arbs found for parameters) gracefully
             if (err.response && err.response.status === 404) {
                 console.log(`No arbs found for ${sport} (404).`);
             } else {
                 console.error(`Error fetching arbs for ${sport}:`, err.message);
                 if (err.response && err.response.data) console.error(JSON.stringify(err.response.data));
             }
        }
      }

      console.log(`Total arbitrage opportunities found: ${allArbs.length}`);
      
      if (allArbs.length > 0) {
        // Log first item structure for debugging purposes since documentation is scarce
        console.log('Sample arb structure:', JSON.stringify(allArbs[0], null, 2));
      }

      this.surebets = allArbs;

    } catch (e) {
      console.error('Error fetching arbitrage bets:');
      if (e.response) {
          console.error(`Status: ${e.response.status}`);
          console.error(`Data: ${JSON.stringify(e.response.data)}`);
      } else {
          console.error(e.message);
      }
      // Don't throw to allow program to finish gracefully
    }
  }

  getBets() {
    return this.surebets;
  }
}

module.exports = MatchesAggregator;
