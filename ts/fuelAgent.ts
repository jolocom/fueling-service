import { Wallet } from 'ethers'
import { BaseProvider, TransactionReceipt } from 'ethers/providers'
import { formatEther, parseEther } from 'ethers/utils'
import { contains, flatten, splitAt, sum, zip } from 'ramda'
import { config } from './config'
import { KeyManager } from './keyManager'
import { INSUFFICIENT_FUNDS } from 'ethers/errors'
import { debug } from './utils'

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
    const wallet = new Wallet(sourceKey, this.provider)
    return wallet
      .sendTransaction({
        to,
        value: parseEther(value.toString()),
        gasLimit: config.gasLimit,
        gasPrice: config.gasPrice,
      })
      .then(txHash => {
        debug(txHash)
        return txHash
          .wait()
          .then(() => {
            debug(`Sent ${value} WEI to ${to}, using ${wallet.address}`)
          })
          .catch(err => debug(err))
      })
      .catch(async err => {
        if (err.code === INSUFFICIENT_FUNDS) {
          debug(
            `Not enough funds on ${wallet.address}, removing from pool. ${
              this.keyManager.getAllKeys().length
            } keys left.`,
          )
          this.keyManager.removeKeyFromPool(wallet.privateKey)
        }

        // TODO Check if we can use NONCE_EXPIRED
        // @see https://github.com/ethers-io/ethers.js/blob/master/src.ts/errors.ts#L51

        if (contains("tx doesn't have the correct nonce", err.responseText)) {
          // If nonce is too low we can try again using the same key. Eventually wallet.getTransactionCount
          // returns a valid nonce
          return this.sendEther(to, value, wallet.privateKey)
        }

        // In case of unhandled error, try again with a new key, without removing the current one from pool
        return this.sendEther(to, value)
      })
  }

  public getBalance = async (address: string): Promise<number> =>
    this.provider
      .getBalance(address)
      .then(formatEther)
      .then(Number)

  public getAllBalances = async () =>
    Promise.all(this.keyManager.getAllAddresses().map(this.getBalance))

  public getTotalBalance = async () => this.getAllBalances().then(sum)

  public async distributeFunds() {
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
    ),
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
