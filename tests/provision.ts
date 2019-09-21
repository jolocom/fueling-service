import { parseEther } from "ethers/utils";
import { FuelService } from "../ts/fuelAgent";
const { server } = require("ganache-core");

// TODO decide on sane defaults
const blockTime = process.env.BLOCK_TIME || 15;
export const startingBalance = process.env.STARTING_BALANCE || "30";
export const ganachePort = process.env.GANACHE_PORT || 8945;

export const provisionTestNet = async (fuelingService: FuelService) => {
  const testEthServer = server({
    accounts: [
      {
        secretKey: fuelingService.keyManager.getAllKeys()[0],
        balance: parseEther(startingBalance).toString()
      },
    ],
    blockTime
  });

  testEthServer.listen(ganachePort, async (ganacheErr: Error) => {
    if (ganacheErr) {
      throw ganacheErr;
    }

    return;
  });
};

