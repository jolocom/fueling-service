import * as express from 'express'
import * as bodyParser from 'body-parser'

const app = express()
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
})

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.post('/add', (req, res) => {
  console.log(req)
  res.send('OK')
})

app.listen(2000, () => 
  console.log(`Service running on 2000`)
)
