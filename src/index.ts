import * as express from 'express'
import * as bodyParser from 'body-parser'
import { fuelService } from './fuelAgent'
import { config } from '../config'

const app = express()
const fueler = new fuelService()

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
})

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.get('/balance', (req, res) => {
  fueler.getBalance().then(sum => res.send(sum))
})

app.post('/request', (req, res) => {
  fueler.sendEther(req.body.address)
    .then(() => res.sendStatus(200))
    .catch((err) => res.status(500).send(err.toString()))
})

app.listen(config.port, () => 
  console.log(`Service running on ${config.port}`)
)
