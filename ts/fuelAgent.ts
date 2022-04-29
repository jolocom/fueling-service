import { Wallet } from 'ethers'
import { BaseProvider, TransactionReceipt } from "@ethersproject/providers"
import { utils, errors } from 'ethers'
import { contains, flatten, splitAt, sum, zip } from 'ramda'
import { config } from './config'
import { KeyManager } from './keyManager'
import { debug, info } from './utils'

export class FuelService {
  private readonly provider: BaseProvider
  public keyManager: KeyManager

  public constructor(provider: BaseProvider) {
    const { seedPhrase, nrOfAddresses } = config
    this.provider = provider
    this.keyManager = new KeyManager(seedPhrase, nrOfAddresses)
  }

  public async sendEther(
    to: string,
    value = config.amount,
    sourceKey = this.keyManager.getKey(),
  ): Promise<void | TransactionReceipt> {
    if (!sourceKey) {
      debug(`Ran out of keys, can't send funds`)
      throw new Error('Faucet currently empty')
    }

    debug(`Request for fueling address - ${to}, with ${value} ETH`)
    const wallet = new Wallet(sourceKey, this.provider)
    return wallet
      .sendTransaction({
        to,
        value: utils.parseEther(value.toString()),
        type: 2,
        gasLimit: config.gasLimit,
      })
      .then(async txHash => {
        debug(`Transaction hash: ${txHash.hash}`)
        try {
          const receipt = await txHash.wait()
          debug(`Sent ${value} WEI to ${to}, using ${wallet.address}`)
          return receipt
        } catch (err) {
          debug(err)
        }
      })
      .catch(err => {
        if (err.code === errors.INSUFFICIENT_FUNDS) {
          this.keyManager.removeKeyFromPool(wallet.privateKey)
          debug(
            `Not enough funds on ${wallet.address}, removing from pool. ${
              this.keyManager.getKeys().length
            } keys left.`,
          )
          return this.sendEther(to, value)
        } else if (contains("tx doesn't have the correct nonce", err.message)) {
          debug(
            `Conflicting nonces from fueling address ${wallet.address}, trying different key`,
          )
          return this.sendEther(to, value)
        } else {
          debug(`Failed to transfer funds ${err.message}`)
        }
        // In case of unhandled error, we don't do not recurse for now
      })
  }

  public getBalance = async (address: string): Promise<number> =>
    this.provider
      .getBalance(address)
      .then(utils.formatEther)
      .then(Number)

  public getAllBalances = async () =>
    Promise.all(this.keyManager.getAllAddresses().map(this.getBalance))

  public getTotalBalance = async () => this.getAllBalances().then(sum)

  public async distributeFunds() {
    info('Redistributing funds')
    const [fueler, ...rest] = this.keyManager.getAllKeys()
    const amountToDistribute = await this.getBalance(
      getAddressFromPrivateKey(fueler),
    )
    return distributeFundsLog(amountToDistribute / 2, [fueler], rest, this)
  }
}

/**
 * Attempts to distribute the funds from the fueled keys to the rest.
 * Divide and conquer (O(log n)) implementation. Faster than the linear one used
 * before, but the keys should not assumed to be usable during fueling
 * @param amount - the balance to be distributed. Should be spread evenly over the fueling keys
 * @param fueling - the keys that should be used to fuel. For each key, one will be picked form the 'toBeFueled' array
 * @param toBeFueled - the keys that should be fueled.
 * @note This is a recursive function.
 * @example fuelAgent.distributeFunds(5e18, ['0xabc...'], ['0x...', '0x...', ...])
 */

const distributeFundsLog = (
  amount: number,
  fuelingKeys: string[],
  toBeFueled: string[] = [],
  fuelingService: FuelService,
) => {
  if (toBeFueled.length === 0) {
    return
  }

  debug(
    `Distributing ${amount}, from ${fuelingKeys.length} keys. ${toBeFueled.length} keys left`,
  )

  const [toFuelInThisBatch, toBeFueledInNextBatches] = splitAt(
    fuelingKeys.length,
    toBeFueled,
  )
  const pairs = zip(fuelingKeys, toFuelInThisBatch)

  const transactions = pairs.map(([fuelingKey, toFuel]) =>
    fuelingService.sendEther(
      getAddressFromPrivateKey(toFuel),
      amount,
      fuelingKey,
    ).then(() => fuelingService.keyManager.readdKeyToPool(toFuel))
  )

  return Promise.all(transactions)
    .then(() => {
      const newFuelers = flatten(pairs)
      return distributeFundsLog(
        amount / 2,
        newFuelers,
        toBeFueledInNextBatches,
        fuelingService,
      )
    })
    .catch(err => {
      debug(`Distributing failed, ${err.message}`)
    })
}

const getAddressFromPrivateKey = (key: string) => new Wallet(key).address
