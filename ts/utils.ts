export const debug = <T>(message: T) => {
  if (process.env.DEBUG) {
    console.log(message)
  }
}

