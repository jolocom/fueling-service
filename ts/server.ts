import { ethers } from 'ethers'
import { config } from './config'
import { FuelService } from './fuelAgent'
import { getConfiguredApp } from './app'

const NETWORK = 'rinkeby'
const provider = ethers.getDefaultProvider(NETWORK)

getConfiguredApp(new FuelService(provider)).listen(config.port, () =>
  console.log(`Service running on ${config.port}`),
)
