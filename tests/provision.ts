import { ethers } from "ethers";
const { server } = require("ganache-core");

const PORT = 8945;

const testEthServer = server({
  accounts: [{ secretKey: "0x" + "a".repeat(64), balance: 100 }]
});

testEthServer.listen(PORT, async (ganacheErr: Error) => {
  if (ganacheErr) throw ganacheErr;
  const provider = new ethers.providers.JsonRpcProvider(
    `http://localhost:${PORT}`
  );

  provider
    .listAccounts()
    .then(console.log);
});
