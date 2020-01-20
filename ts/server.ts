import { ethers } from 'ethers'
import { config } from './config'
import { FuelService } from './fuelAgent'
import { getConfiguredApp } from './app'
import { BlackList } from './blackList'

const NETWORK = 'rinkeby'
const provider = ethers.getDefaultProvider(NETWORK)

const blackList = new BlackList([], config.blackListFile)

blackList.initFromFile().then(() => {
  const server = getConfiguredApp(new FuelService(provider), blackList).listen(
      config.port,
      () => console.log(`Service running on ${config.port}`),
    )

    // Attempt to write the in-memory blacklist to disk.
    //@ts-ignore string =! Signals, Signals doesn't seem to be exported though
  ;['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException'].forEach(el =>
    process.on(el, () => {
      server.close()
      blackList.writeListToFile()
    }),
  )
})
