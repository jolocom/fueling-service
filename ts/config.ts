export const config = {
  // Infura credentials
  projectSecret: "",
  projectId: "",

  port: 8000,
  blackListFile: './blackList.json',
  endpoint: 'https://rinkeby.infura.io/v3/64fa85ca0b28483ea90919a83630d5d8',
  rateLimit: {
    windowMs: 24 * 60 * 60 * 1000,
    max: 10
  },
  seedPhrase: '',
  gasLimit: 21000,
  gasPrice: 3e9,
  amount: 0.01,
  nrOfAddresses: 32,
}
