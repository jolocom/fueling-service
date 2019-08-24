import * as express from "express";
import * as bodyParser from "body-parser";
import { FuelService } from "./fuelAgent";
import { config } from "./config";
import { zip } from "ramda";

const FuellingService = new FuelService();
const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/balance", (req, res) => {
  FuellingService.getTotalBalance().then(sum => res.json(sum));
});

app.get("/balances", (req, res) => {
  FuellingService.getAllBalances().then(balances =>
    res.json(zip(balances, FuellingService.keyManager.getAllAddresses()))
  );
});

app.post("/request", (req, res) => {
  FuellingService.sendEther(req.body.address)
    .then(() => res.sendStatus(200))
    .catch(err => res.status(500).send(err.toString()));
});

app.listen(config.port, () => console.log(`Service running on ${config.port}`));
