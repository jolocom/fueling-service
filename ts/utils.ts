export const debug = <T>(message: T) => {
  if (process.env.DEBUG) info(message)
}

export const info = <T>(message: T) => {
  console.log(`${new Date().toLocaleString()}: ${message}`)
}
