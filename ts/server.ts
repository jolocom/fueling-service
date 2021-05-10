import { ethers } from 'ethers'
import { config } from './config'
import { debug, info } from './utils'
import { FuelService } from './fuelAgent'
import { getConfiguredApp } from './app'
import { BlackList } from './blackList'
const rateLimit = require('express-rate-limit')

const NETWORK = 'rinkeby'
const provider = ethers.getDefaultProvider(NETWORK)

const blackList = new BlackList([], config.blackListFile)

const start = async () => {
  try {
    await blackList.initFromFile();
  } catch(err) {
    info(err)
    info("no blacklist file, running free")
  }

  const app = getConfiguredApp(new FuelService(provider), blackList)
  if (config.rateLimit) {
    app.use(rateLimit(config.rateLimit))
  }
  const server = app.listen(
    config.port,
    () => info(`Service running on ${config.port}`),
  )

  // Attempt to write the in-memory blacklist to disk.
  ;['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException'].forEach(el =>
    //@ts-ignore string =! Signals, Signals doesn't seem to be exported though
    process.on(el, () => {
      server.close()
      blackList.writeListToFile()
    }),
  )
}

start()
