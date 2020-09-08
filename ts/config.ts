export const config = {
  port: 8000,
  blackListFile: './blackList.json',
  endpoint: 'https://rinkeby.infura.io',
  rateLimit: {
    windowMs: 24 * 60 * 60 * 1000,
    max: 10
  },
  seedPhrase:
    'man area total crystal walk gate rug always eyebrow flash uncover isolate',
  gasLimit: 21000,
  gasPrice: 3e9,
  amount: 0.01,
  nrOfAddresses: 32,
}
