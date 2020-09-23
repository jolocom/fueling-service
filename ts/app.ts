import * as express from 'express'
import { Request, Response } from 'express'
import * as bodyParser from 'body-parser'
import { FuelService } from './fuelAgent'
import { zip } from 'ramda'
import { BlackList } from './blackList'
import { debug } from './utils'

const checkIfTooManyRequests = (req: Request, res: Response) => (e) => {
  if (e.statusCode === 429) {
    try {
      const { error }= JSON.parse(e.responseText)
      return res.status(429).send(error.data)
    } catch {
      return res.status(500).send(e)
    }
  }
  return res.status(500).send(e)
}

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
    const balanceRequest = fuelingService.getTotalBalance()
    balanceRequest.then(sum => res.json(sum))
    balanceRequest.catch(checkIfTooManyRequests(req, res))

    return balanceRequest
  })

  app.get('/balances', (req, res) => {
    const balancesRequest = fuelingService.getAllBalances()

    balancesRequest.catch(checkIfTooManyRequests(req, res))
    balancesRequest.then(
      balances => res.json(
        zip(balances, fuelingService.keyManager.getAllAddresses())
      )
    )

    return balancesRequest
  })

  app.post('/request', (req, res) => {
    if (blackList.isBlackListed(req.body.address)) {
      debug('Refusing to fund blacklisted key: ' + req.body.address)
      return res.status(401).send('Key already fueled')
    }

    const fuelingRequest = fuelingService.sendEther(req.body.address)
    fuelingRequest.then(() => res.sendStatus(200))
    fuelingRequest.catch(checkIfTooManyRequests(req, res))
    return fuelingRequest
  })

  return app
}
