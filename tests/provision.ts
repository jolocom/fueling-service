import { parseEther } from "ethers/utils";
import { FuelService } from "../ts/fuelAgent";
const { server } = require("ganache-core");

const blockTime = process.env.BLOCK_TIME || 1;
export const startingBalance = process.env.STARTING_BALANCE || "30";
export const ganachePort = 8945;

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

