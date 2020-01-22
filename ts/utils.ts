export const debug = <T>(message: T) => {
  if (process.env.DEBUG) {
    console.log(`${new Date().toLocaleString()}: ${message}`)
  }
}
