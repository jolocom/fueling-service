import { ethers, Wallet } from "ethers";
import { config } from "./config";
import { KeyManager } from "./keyManager";
import { BaseProvider, TransactionReceipt } from "ethers/providers";
import { formatEther, parseEther } from "ethers/utils";
import { sum, zip, flatten } from "ramda";
import { INSUFFICIENT_FUNDS } from "ethers/errors";

const NETWORK = "rinkeby";

export class FuelService {
  private readonly provider: BaseProvider;
  public keyManager: KeyManager;

  public constructor() {
    const { seedPhrase, nrOfAddresses } = config;
    this.provider = ethers.getDefaultProvider(NETWORK);
    this.keyManager = new KeyManager(seedPhrase, nrOfAddresses);
  }

  public async sendEther(
    to: string,
    value = config.amount,
    sourceKey = this.keyManager.getKey()
  ): Promise<void | TransactionReceipt> {
    const wallet = new Wallet(sourceKey, this.provider);
    return wallet
      .sendTransaction({
        to,
        value: parseEther(value.toString()),
        gasLimit: config.gasLimit,
        gasPrice: config.gasPrice
      })
      .then(txHash =>
        txHash
          .wait()
          .then(() =>
            console.log(`Sent ${value} WEI to ${to}, using ${wallet.address}`)
          )
      )
      .catch(err => {
        if (err.code === INSUFFICIENT_FUNDS) {
          console.log(
            `Not enough funds on ${wallet.address}, removing from pool. ${
              this.keyManager.getAllKeys().length
            } keys left.`
          );
          this.keyManager.removeKeyFromPool(wallet.privateKey);
          return this.sendEther(to, value);
        }
      });
  }

  public getBalance = async (address: string): Promise<number> =>
    this.provider
      .getBalance(address)
      .then(formatEther)
      .then(Number);

  public getAllBalances = async () =>
    Promise.all(this.keyManager.getAllAddresses().map(this.getBalance));

  public getTotalBalance = async () => this.getAllBalances().then(sum);

  public async distributeFunds() {
    const [fueler, ...rest] = this.keyManager.getAllKeys();
    const amountToDistribute = await this.getBalance(
      getAddressFromPrivateKey(fueler)
    );
    return distributeFundsLog(amountToDistribute / 2, [fueler], rest, this);
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
 * @ TODO can underflow when dividing
 */

const distributeFundsLog = (
  amount: number,
  fueling: string[],
  toBeFueled: string[] = [],
  fuelingService: FuelService
) => {
  if (toBeFueled.length === 0) {
    return;
  }

  console.log(
    `Distributing ${amount}, from ${fueling.length} keys. ${toBeFueled.length} keys left`
  );

  const toFuel = fueling.map(() => toBeFueled.shift());
  const pairs = zip(fueling, toFuel);

  const transactions = pairs.map(([fuelingKey, toFuel]) =>
    fuelingService.sendEther(
      getAddressFromPrivateKey(toFuel),
      amount,
      fuelingKey
    )
  );

  return Promise.all(transactions)
    .then(() => {
      const newFuelers = flatten(pairs);
      return distributeFundsLog(
        amount / newFuelers.length,
        newFuelers,
        toBeFueled,
        fuelingService
      );
    })
    .catch(err => {
      console.log(`Distributing failed, ${err.message}`);
    });
};

const getAddressFromPrivateKey = (key: string) => new Wallet(key).address;
