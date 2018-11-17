import { EventEmitter } from 'events'

enum EventNames {
  released = 'KEY_RELEASED'
}

export class KeyManager extends EventEmitter {
  private keys: string[] = []
  private busyKeys: string[] = []

  constructor (keys: string[]) {
    super()
    this.keys = keys
  }

  markKeyAsEmpty(key: string) {
    this.releaseKey(key)
    this.keys = this.keys.filter((k) => k !== key)
  }

  getFreeKey(): string {
    const free = this.keys.find(k => this.busyKeys.indexOf(k) <= 0)
    this.busyKeys.push(free)
    return free
  }

  releaseKey(key: string) {
    this.busyKeys = this.busyKeys.filter(k => k!== key)
    this.emit(EventNames.released, key)
  }

  getAllKeys() : string[] {
    return this.keys
  }

  getNumberOfFreeKeys() {
    return this.keys.length - this.busyKeys.length
  }
}
