import { expect } from "chai";
import { ethers } from "ethers";
import { Express } from "express";
import { zip } from 'ramda';
import { config } from "../ts/config";
import { FuelService } from "../ts/fuelAgent";
import { getConfiguredApp } from "../ts/server";
import { ganachePort, provisionTestNet, startingBalance } from "./provision";
const request = require("supertest");

describe("Fueling service integration tests", () => {
  let app: Express;
  let testFuelingService: FuelService;
  before(async () => {
    const testEthProvider = new ethers.providers.JsonRpcProvider(
      `http://localhost:${ganachePort}`
    );

    testFuelingService = new FuelService(testEthProvider);
    app = getConfiguredApp(testFuelingService);
    await provisionTestNet(testFuelingService);
  });

  it("correctly returns balance", async () => {
    return request(app)
      .get("/balance")
      .expect(200)
      .then(res => {
        expect(res.body).to.eq(parseFloat(startingBalance))
      });
  });

  it("correctly returns balances", () => {
    return request(app)
      .get("/balances")
      .expect(200)
      .then(res => {
        const addresses = testFuelingService.keyManager.getAllAddresses();
        const balances = new Array(config.nrOfAddresses).fill(0);

        // changing the balance for the first address since funds are not distributed evenly
        balances[0] = parseFloat(startingBalance);

        const expectedResult = zip(balances, addresses);
        expect(expectedResult).to.deep.eq(res.body);
      });
  });

  // This test changes the balances on keys, and therefore
  // should run after tests that assert on the starting balance,
  // in order to simplify balance related assertions
  it("correctly distributes funds", async () => {
    // No HTTP Endpoint yet, needs authorization
    await testFuelingService.distributeFunds()

    // Largest allowed variation between balances (ETH)
    const threshold = 0.1
    const balances = await testFuelingService.getAllBalances()
    const smallest = Math.min(...balances)
    const largest = Math.max(...balances)

    expect(largest - smallest).to.be.lessThan(threshold)
  });


  it("can handle multiple fueling requests", async () => {
    const address = "0x0000000000000000000000000000000000000000"
    const ping = () => request(app)
        .post("/request")
        .send({ address })
        .expect(200)
        .then(res => {
          expect(res.body).to.deep.eq({});
        });

    const pings = new Array(320).fill(0).map(ping)
    return Promise.all(pings).then(testFuelingService.getAllBalances).then(console.log)
  })
})


