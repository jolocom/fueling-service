import { Wallet } from 'ethers'
import { debug } from './utils'

export class KeyManager {
  private keys: string[] = []
  private emptyKeys: string[] = []

  constructor(seedPhrase: string, nrOfAddresses: number) {
    this.keys = deriveKeys(seedPhrase, nrOfAddresses)
    this.emptyKeys = []
  }

  /**
   * Returns the first key from the array.
   * @note Also mutates the array so that the returned key
   * is at last index, to prevent it from being used next time.
   */

  getKey(): string {
    const first = this.keys.shift()
    if (first) {
      this.keys.push(first)
    }
    return first
  }

  getKeys(): string[] {
    return this.keys
  }
  getAllKeys(): string[] {
    return this.keys.concat(this.emptyKeys)
  }

  getAllAddresses(): string[] {
    return this.getAllKeys().map(k => new Wallet(k).address)
  }

  removeKeyFromPool = (emptyKey: string) => {
    debug(`Removed ${emptyKey} from pool`)
    this.keys = this.keys.filter(k => k !== emptyKey)
    this.emptyKeys.push(emptyKey)
  }

  readdKeyToPool = (refueledKey: string) => {
    debug(`Readded ${refueledKey} to pool`)
    this.emptyKeys = this.emptyKeys.filter(k => k !== refueledKey)
    this.keys.push(refueledKey)
  }

}

/**
 * Given a 12 word mnemonic and the desired number of keys,
 * will generate N private keys
 * @param mnemonic - 12 word mnemonic
 * @param nrOfKeysToDerive - number of keys. Ideally 2^n.
 */

const deriveKeys = (mnemonic: string, nrOfKeysToDerive: number): string[] => {
  const basePath = "m/44'/60'/0'/0"
  return [...new Array(nrOfKeysToDerive)].map(
    (_, i) => Wallet.fromMnemonic(mnemonic, `${basePath}/${i}`).privateKey,
  )
}
