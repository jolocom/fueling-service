import { expect } from 'chai'
import { ethers } from 'ethers'
import { Express } from 'express'
import { zip } from 'ramda'
import { config } from '../ts/config'
import { FuelService } from '../ts/fuelAgent'
import { ganachePort, provisionTestNet, startingBalance } from './provision'
import { getConfiguredApp } from '../ts/app'
const request = require('supertest')

/**
 * 3 environmental variables can be set when running the tests:
 * REQUESTS - nr of fueling requests to make during stress test
 * BLOCK_TIME - how often, in seconds, a new block is mined during tests
 * STARTING_BALANCE - how much ETH will the fueling service start with during test
 */

const nrOfRequests = process.env.REQUESTS || config.nrOfAddresses * 10

describe('Fueling service integration tests', () => {
  let app: Express
  let testFuelingService: FuelService

  const requestEther = (destinationAddress: string) =>
    request(app)
      .post('/request')
      .send({ address: destinationAddress })
      .expect(200)
      .then(res => {
        expect(res.body).to.deep.eq({})
      })

  before(async () => {
    const testEthProvider = new ethers.providers.JsonRpcProvider(
      `http://localhost:${ganachePort}`,
    )

    testFuelingService = new FuelService(testEthProvider)
    app = getConfiguredApp(testFuelingService)
    await provisionTestNet(testFuelingService)
  })

  it('correctly returns balance', async () => {
    return request(app)
      .get('/balance')
      .expect(200)
      .then(res => {
        expect(res.body).to.eq(parseFloat(startingBalance))
      })
  })

  it('correctly returns balances', () => {
    return request(app)
      .get('/balances')
      .expect(200)
      .then(res => {
        const addresses = testFuelingService.keyManager.getAllAddresses()
        const balances = new Array(config.nrOfAddresses).fill(0)

        // changing the balance for the first address since funds are not distributed evenly
        balances[0] = parseFloat(startingBalance)

        const expectedResult = zip(balances, addresses)
        expect(expectedResult).to.deep.eq(res.body)
      })
  })

  // This test changes the balances on keys, and therefore
  // should run after tests that assert on the starting balance,
  // in order to simplify balance related assertions
  it('correctly distributes funds', async () => {
    // No HTTP Endpoint yet, needs authorization
    await testFuelingService.distributeFunds()

    // Largest allowed variation between balances (ETH)
    const threshold = 0.1
    const balances = await testFuelingService.getAllBalances()
    const smallest = Math.min(...balances)
    const largest = Math.max(...balances)

    expect(largest - smallest).to.be.lessThan(threshold)
  })

  it('can handle multiple fueling requests', async () => {
    const destinationAddress = '0x0000000000000000000000000000000000000000'

    const pings = new Array(nrOfRequests)
      .fill(0)
      .map(() => requestEther(destinationAddress))

    return Promise.all(pings).then(results =>
      results.every(r => r && r.status === 1)
    )
  })

  it('correctly handles conflicting nonces', async () => {
    const destinationAddress = '0x0000000000000000000000000000000000000000'
    const key = testFuelingService.keyManager.getKey()

    const pings = [
      testFuelingService.sendEther(destinationAddress, 0.1, key),
      testFuelingService.sendEther(destinationAddress, 0.1, key),
    ]

    return Promise.all(pings).then(results =>
      results.every(r => r && r.status === 1))
  })
})
