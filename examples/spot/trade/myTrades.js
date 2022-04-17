const Spot = require('../../../src/spot')
const { writeFileSync } = require('fs')
const { resolve } = require('path')

const apiKey = 'XJeP7SmCnqEyEXLQHNmPh7Gqge5AgVQHT0C7riZColA0y18vlv20VsZJ8XBYdoRL'
const apiSecret = 'Oz5Y5XxAK3HEv0nvfqW77ghwAxaeHxVyyGID2fpLQOTfPfSTX93lKb6yK5Rjz5n'
const client = new Spot(apiKey, apiSecret)

const primaryTokens = ['btc']
const secondaryTokens = ['eur', 'usdt']

ensureUpperCase(primaryTokens, { output: primaryTokens })
ensureUpperCase(secondaryTokens, { output: secondaryTokens })

const twoMinInMs = 2 * 60 * 1000
const promises = []

for (const primary of primaryTokens) {
  for (const secondary of secondaryTokens) {
    if (primary === secondary) continue
    promises.push([primary, secondary])
    promises.push(
      client.myTrades(`${primary}${secondary}`).then(response => response.data)
        .catch(error => client.logger.error(`${error} there is not data for ${primary}${secondary}`))
    )
  }
}

Promise.all(promises).then(async (results) => {
  const tableOfCoins = {}
  for (let i = 0; i < results.length; i += 2) {
    const pair = results[i]
    const result = results[i + 1]
    for (const trade of result) {
      const equivalentPrice = []
      for (const secondary of secondaryTokens) {
        if (pair[1] === secondary) continue
        const aggTrades = await client.aggTrades(`${pair[0]}${secondary}`, {
          startTime: trade.time - twoMinInMs,
          endTime: trade.time + twoMinInMs
        }).then(result => result.data).catch(error => client.logger.error(`${error}${pair[1]}${secondary} doesn't exist`))
        const index = getClosestIndex(aggTrades, trade.time)
        equivalentPrice.push({
          token: secondary,
          quoteQty: Number(aggTrades[index].p) * trade.qty
        })
      }
      trade.equivalences = equivalentPrice
    }
    if (!tableOfCoins[pair[0]]) tableOfCoins[pair[0]] = []
    tableOfCoins[pair[0]].push(...result)
  }
  for (const token in tableOfCoins) {
    tableOfCoins[token].sort((a, b) => a.time - b.time)
  }

  writeFileSync(resolve('./dataBTC.json'), JSON.stringify(tableOfCoins))
  console.log(tableOfCoins.btc)
})

function getClosestIndex (aggTrades, time) {
  let low = 0
  let high = aggTrades.length - 1
  let middle = 0
  while (high - low > 1) {
    middle = low + ((high - low) >> 1)
    if (aggTrades[middle].T < time) {
      low = middle
    } else if (aggTrades[middle].T > time) {
      high = middle
    } else {
      return middle
    }
  }

  if (low < aggTrades.length - 1) {
    if (Math.abs(time - aggTrades[low]) < Math.abs(aggTrades[low + 1] - time)) {
      return low
    } else {
      return low + 1
    }
  } else {
    return low
  }
}

function ensureUpperCase (array, options = {}) {
  const { output = new Array(array.length) } = options
  for (let i = 0; i < array.length; i++) {
    output[i] = array[i].toUpperCase()
  }
  return output
}
