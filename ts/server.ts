import { ethers } from 'ethers'
import { config } from './config'
import { debug } from './utils'
import { FuelService } from './fuelAgent'
import { getConfiguredApp } from './app'
import { BlackList } from './blackList'

const NETWORK = 'rinkeby'
const provider = ethers.getDefaultProvider(NETWORK)

const blackList = new BlackList([], config.blackListFile)

blackList.initFromFile().then(() => {
  const server = getConfiguredApp(new FuelService(provider), blackList).listen(
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
})
