import { Wallet } from 'ethers'
import { without } from 'ramda'
import { debug } from './utils'

export class KeyManager {
  private keys: string[] = []

  constructor(seedPhrase: string, nrOfAddresses: number) {
    this.keys = deriveKeys(seedPhrase, nrOfAddresses)
  }

  /**
   * Returns the first key from the array.
   * @note Also mutates the array so that the returned key
   * is at last index, to prevent it from being used next time.
   */

  getKey(): string {
    const first = this.keys.shift()
    this.keys.push(first)
    return first
  }

  getAllKeys(): string[] {
    return this.keys
  }

  getAllAddresses(): string[] {
    return this.getAllKeys().map(k => new Wallet(k).address)
  }

  removeKeyFromPool = (emptyKey: string) => {
    debug(`Removed ${emptyKey} from pool`)
    this.keys = without([emptyKey])(this.keys)
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
