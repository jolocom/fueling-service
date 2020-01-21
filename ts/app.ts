import * as express from 'express'
import * as bodyParser from 'body-parser'
import { FuelService } from './fuelAgent'
import { zip } from 'ramda'
import { BlackList } from './blackList'

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

  app.get('/balance', (req, res) => {
    fuelingService.getTotalBalance().then(sum => res.json(sum))
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
      return res.status(401).send('Key already fueled')
    }

    return fuelingService
      .sendEther(req.body.address)
      .then(() => res.sendStatus(200))
      .catch(err => {
        return res.status(500).send(err.toString())
      })
  })

  return app
}
