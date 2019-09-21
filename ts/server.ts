import * as express from "express";
import * as bodyParser from "body-parser";
import { FuelService } from "./fuelAgent";
import { config } from "./config";
import { zip } from "ramda";
import {ethers} from "ethers";

export const getConfiguredApp = (fuelingService: FuelService) => {
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
    fuelingService.getTotalBalance().then(sum => res.json(sum));
  });

  app.get("/balances", (req, res) => {
    fuelingService.getAllBalances().then(balances =>
        res.json(zip(balances, fuelingService.keyManager.getAllAddresses()))
    );
  });

  app.post("/request", (req, res) => {
    fuelingService.sendEther(req.body.address)
        .then(() => res.sendStatus(200))
        .catch(err => {
          console.log(err)
          return res.status(500).send(err.toString())
        });
  });

  return app
};

const NETWORK = "rinkeby";
const provider = ethers.getDefaultProvider(NETWORK);


// TODO Move to utils
export const debug = <T>(message: T) => {
  if (process.env.DEBUG) {
    console.log(message)
  }
}

// getConfiguredApp(new FuelService(provider)).listen(config.port, () => console.log(`Service running on ${config.port}`));
