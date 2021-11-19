import * as express from 'express'
import * as bodyParser from 'body-parser'
import { FuelService } from './fuelAgent'
import { zip } from 'ramda'
import { BlackList } from './blackList'
import { debug, info } from './utils'
import * as templates from './templates'
import { config } from './config'

export const getConfiguredApp = (
  fuelingService: FuelService,
  blackList: BlackList,
) => {
  const app = express()

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept',
    )
    next()
  })

  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())

  app.get('/', (req, res) => {
    res.redirect('/balance')
  })

  const numKeys = fuelingService.keyManager.getAllKeys().length
  // If all the keys have less than the minimum amount
  // then none of the can be used to send the required ether
  // so if we have less than the 'amount' for 1 transaction * numKeys
  // then the faucet is considered empty
  const minBalance = config.amount * numKeys

  app.get('/balance', async (req, res) => {
    let sum = await fuelingService.getTotalBalance()
    if (sum <= minBalance) {
      return templates.TheFaucetIsEmpty(res)
    } else {
      return res.json(sum)
    }
  })

  app.get('/balances', (req, res) => {
    fuelingService
      .getAllBalances()
      .then(balances =>
        res.json(zip(balances, fuelingService.keyManager.getAllAddresses())),
      )
  })

  app.post('/request', (req, res) => {
    if (blackList.isBlackListed(req.body.address)) {
      debug('Refusing to fund blacklisted key: ' + req.body.address)
      return res.status(401).send('Key already fueled')
    }

    return fuelingService
      .sendEther(req.body.address)
      .then(() => res.sendStatus(200))
      .catch(err => {
        return res.status(500).send(err.toString())
      })
  })

  let promisedRedistribution
  app.get('/redistribute', async (req, res) => {
    if (!promisedRedistribution)
      promisedRedistribution = fuelingService.distributeFunds()

    await promisedRedistribution
    promisedRedistribution = null

    res.redirect('/balances')
  })

  return app
}
