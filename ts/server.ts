import { ethers } from 'ethers'
import { config } from './config'
import { debug } from './utils'
import { FuelService } from './fuelAgent'
import { getConfiguredApp } from './app'
import { BlackList } from './blackList'
import rateLimit from 'express-rate-limit'

const NETWORK = 'rinkeby'
const provider = ethers.getDefaultProvider(NETWORK)

const blackList = new BlackList([], config.blackListFile)

blackList.initFromFile().then(() => {
  const app = getConfiguredApp(new FuelService(provider), blackList)
  if (config.rateLimit) {
    app.use(rateLimit(config.rateLimit))
  }
  const server = app.listen(
    config.port,
    () => debug(`Service running on ${config.port}`),
  )

  // Attempt to write the in-memory blacklist to disk.
  ;['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException'].forEach(el =>
    //@ts-ignore string =! Signals, Signals doesn't seem to be exported though
    process.on(el, () => {
      server.close()
      blackList.writeListToFile()
    }),
  )
}).catch(err => {
  debug(`Failed to load blacklist from ${this.path}, defaulting to []`)
  debug(err)
})
