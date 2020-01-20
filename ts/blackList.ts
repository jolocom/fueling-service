import { readFile, writeFileSync } from 'fs'
import { debug } from './utils'

export class BlackList {
  private blacklisted: string[] = []
  private path?: string

  constructor(blacklisted: string[] = [], path?: string) {
    this.blacklisted = blacklisted
    this.path = path
  }

  addToBlacklist(address: string) {
    if (!this.isBlackListed(address)) {
      this.blacklisted.push(address) // Hash the address again
    }
  }

  isBlackListed(address: string) {
    return this.blacklisted.includes(address) // Hash the address again
  }

  // Sync is used because this fires on process.on("exit"), at which point the event
  // loop accepts no further functions, so async and such do not work
  writeListToFile() {
    if (!this.path) {
      debug(
        `No path to blacklist file provided in constructor, not attempting write`,
      )
      return
    }

    debug(`Blacklist written to ${this.path}`)
    return writeFileSync(
      this.path,
      JSON.stringify({ blackList: this.blacklisted }),
    )
  }

  async initFromFile() {
    if (!this.path) {
      debug(
        `No path to blacklist file provided in constructor, not attempting read`,
      )
      return
    }

    return readFile(this.path, (err, buffer) =>
      new Promise((resolve, reject) => {
        if (err) return reject(err)

        const { blackList } = JSON.parse(buffer.toString())

        debug(`BlackList of length ${blackList.length} read from ${this.path}`)
        this.blacklisted = blackList
        return resolve()
      }).catch(err => {
        debug(`Failed to load blacklist from ${this.path}, defaulting to []`)
        debug(err)
      }),
    )
  }
}
