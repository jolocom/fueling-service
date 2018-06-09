import * as ethers from 'ethers'
import * as Transaction from 'ethereumjs-tx'
import { config } from '../config'

const Web3 = require("web3")


export class fuelService {
  private web3: any
  private wallet: ethers.Wallet

  constructor() {
    this.web3 = new Web3(config.endpoint)
    this.wallet = ethers.Wallet.fromMnemonic(config.seedPhrase)
  }

  public async getBalance() : Promise<number> {
    const balance = await this.web3.eth.getBalance(this.wallet.address)
    return this.web3.utils.fromWei(balance, 'ether')
  }

  public async sendEther(address: string) : Promise<void> {
    const currentNonce = await this.web3.eth.getTransactionCount(this.wallet.address)

    const { toHex } = this.web3.utils
    const tx = new Transaction({
      nonce: toHex(currentNonce),
      value: toHex(config.amount),
      gasLimit: toHex(config.gasLimit),
      gasPrice: toHex(config.gasPrice),
      to: address
    })

    tx.sign(Buffer.from(this.wallet.privateKey.substr(2), 'hex'))

    await this.web3.eth.sendSignedTransaction(`0x${tx.serialize().toString('hex')}`)
  }
}