import { Wallet } from 'ethers'
import * as Transaction from 'ethereumjs-tx'
import { config } from '../config'
import { KeyManager } from './keyManager'
const Web3 = require("web3")

export class fuelService {
  private web3: any
  private keyManager: KeyManager

  constructor() {
    const { seedPhrase, nrOfAddresses } = config
    const keys = deriveKeys(seedPhrase, nrOfAddresses)

    this.web3 = new Web3(config.endpoint)
    this.keyManager = new KeyManager(keys)
  }

  public async getBalance(address? : string) : Promise<number> {
    const addresses = []

    if (!address){
      const keys = this.keyManager.getAllKeys()
      addresses.push(...keys.map(k => new Wallet(k).address))
    } else {
      addresses.push(address)
    }

    const results = await Promise.all(addresses.map((addr => this.web3.eth.getBalance(addr))))
    const total = results.reduce((acc, curr) => Number(acc) + Number(curr))
    return this.web3.utils.fromWei(total.toString(), 'ether')
  }

  public async sendEther(address: string, amount = config.amount) : Promise<void> {
    const freeKey = this.keyManager.getFreeKey()

    if (!freeKey) {
      throw new Error('All keys busy')
    }

    const w = new Wallet(freeKey)
    const currentNonce = await this.web3.eth.getTransactionCount(w.address)

    const { toHex } = this.web3.utils
    const tx = new Transaction({
      nonce: toHex(currentNonce),
      value: toHex(amount),
      gasLimit: toHex(config.gasLimit),
      gasPrice: toHex(config.gasPrice),
      to: address
    })

    tx.sign(Buffer.from(w.privateKey.substr(2), 'hex'))

    try {
      await this.web3.eth.sendSignedTransaction(`0x${tx.serialize().toString('hex')}`)
      console.log(`SUCCESS: ${w.address} sent ${amount / 1e9} ETH to ${address}`)
      this.keyManager.releaseKey(freeKey)
    } catch (err) {
      console.log(`ERROR: ${w.address} failed to send ${amount / 1e9} ETH - ${err.message}`)
      await this.sendEther(address)
      this.keyManager.releaseKey(freeKey)
    }
  }

  public async distribute() {
    const keys = this.keyManager.getAllKeys()
    const addresses = keys.map(k => new Wallet(k).address)

    const txFeeInWei = 21e3 * 4e9
    const txFeeInEth = Number(this.web3.utils.fromWei(txFeeInWei.toString()))

    const toBeDistributed = Number(await this.getBalance(addresses[0]))
    const availableToSend = toBeDistributed - (txFeeInEth * (addresses.length - 1))
    const toSend = (availableToSend / (addresses.length - 1))
    const toSendInWei = this.web3.utils.toWei(toSend.toString())
    for (let i = 1; i < addresses.length; i++) {
      await this.sendEther(addresses[i], Math.floor(toSendInWei))

    }
  }
}

const deriveKeys = (mnemonic: string, nrOfKeysToDerive: number) : string[] => {
  const results = []
  for (let i = 0; i < nrOfKeysToDerive; i++) {
    results.push(Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${i}`).privateKey)
  }

  return results
}