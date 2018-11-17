import { EventEmitter } from 'events'

enum EventNames {
  released = 'KEY_RELEASED'
}

export class KeyManager extends EventEmitter {
  private keys: string[] = []
  private busyKeys: string[] = []

  constructor(keys: string[]) {
    super()
    this.keys = keys
  }

  markKeyAsEmpty(key: string) {
    this.releaseKey(key)
    this.keys = this.keys.filter(k => k !== key)
  }

  getFreeKey(): string {
    const free = this.shuffleArray(this.keys).find(k => !this.busyKeys.includes(k))
    free && this.busyKeys.push(free)
    return free
  }

  releaseKey(key: string) {
    this.busyKeys = this.busyKeys.filter(k => k !== key)
    this.emit(EventNames.released, key)
  }

  getAllKeys(): string[] {
    return this.keys
  }

  getNumberOfFreeKeys() {
    return this.keys.length - this.busyKeys.length
  }

  private shuffleArray(keys: string[]) {
    const shuffled = [...keys]

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    return shuffled
  }
}
