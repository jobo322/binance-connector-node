const Spot = require('../../../src/spot')

// historicalTrades require API KEY
const apiKey = 'XJeP7SmCnqEyEXLQHNmPh7Gqge5AgVQHT0C7riZColA0y18vlv20VsZJ8XBYdoRL'
const apiSecret = 'Oz5Y5XxAK3HEv0nvfqW77ghwAxaeHxVyyGID2fpLQOTfPfSTX93lKb6yK5Rjz5nD'
const client = new Spot(apiKey, apiSecret)

client.historicalTrades('BTCUSDT', { limit: 100 }).then(response => client.logger.log(response.data))
  .catch(error => client.logger.error(error.message))
