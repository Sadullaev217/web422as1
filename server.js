/*********************************************************************************
*  WEB422 – Assignment 3
*
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
*
*  https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
*
*  Name: Sadullaev Shokhjakhon Student ID: 122850241 Date: 08/04/2026
*
*  Vercel API (Deployed) Link: https://web422as1-46r3.vercel.app
*
********************************************************************************/

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const passportJWT = require('passport-jwt');
const dataService = require("./data-service.js");

const app = express();
const HTTP_PORT = process.env.PORT || 3000;

// JWT Strategy setup
let ExtractJwt = passportJWT.ExtractJwt;
let JwtStrategy = passportJWT.Strategy;

let jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('jwt'),
  secretOrKey: process.env.JWT_SECRET
};

let strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
  if (jwt_payload) {
    next(null, {
      _id: jwt_payload._id,
      userName: jwt_payload.userName
    });
  } else {
    next(null, false);
  }
});

passport.use(strategy);

app.use(cors());
app.use(express.json());
app.use(passport.initialize());


// GET / - Root route
app.get('/', (req, res) => {
  res.json({
    message: "A3 – Secured API Listening",
    term: "Winter 2026",
    student: "Sadulloev Shokhjakhon",
    learnID: "sbsadullloev"
  });
});

// User routes
app.post("/api/user/register", (req, res) => {
  dataService.registerUser(req.body)
    .then((msg) => {
      res.json({ "message": msg });
    }).catch((msg) => {
      res.status(422).json({ "message": msg });
    });
});

app.post("/api/user/login", (req, res) => {
  dataService.checkUser(req.body)
    .then((user) => {
      let payload = {
        _id: user._id,
        userName: user.userName
      };
      let token = jwt.sign(payload, process.env.JWT_SECRET);
      res.json({ "message": "login successful", "token": token });
    }).catch(msg => {
      res.status(422).json({ "message": msg });
    });
});

// Protected user/favourites routes
app.get("/api/user/favourites", passport.authenticate('jwt', { session: false }), (req, res) => {
  dataService.getFavourites(req.user._id)
    .then(data => {
      res.json(data);
    }).catch(msg => {
      res.status(422).json({ error: msg });
    });
});

app.put("/api/user/favourites/:id", passport.authenticate('jwt', { session: false }), (req, res) => {
  dataService.addFavourite(req.user._id, req.params.id)
    .then(data => {
      res.json(data);
    }).catch(msg => {
      res.status(422).json({ error: msg });
    });
});

app.delete("/api/user/favourites/:id", passport.authenticate('jwt', { session: false }), (req, res) => {
  dataService.removeFavourite(req.user._id, req.params.id)
    .then(data => {
      res.json(data);
    }).catch(msg => {
      res.status(422).json({ error: msg });
    });
});

// Protected site routes
app.post('/api/sites', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const newSite = await dataService.addNewSite(req.body);
    res.status(201).json(newSite);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/sites', async (req, res) => {
  try {
    const { page, perPage, name, description, year, town, provinceOrTerritoryCode } = req.query;
    const sites = await dataService.getAllSites(page, perPage, name, description, year, town, provinceOrTerritoryCode);
    res.json(sites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/sites/:id', async (req, res) => {
  try {
    const site = await dataService.getSiteById(req.params.id);
    if (site) {
      res.json(site);
    } else {
      res.status(404).json({ message: "Site not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/sites/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const result = await dataService.updateSiteById(req.body, req.params.id);
    if (result.matchedCount === 0) {
      res.status(404).json({ message: "Site not found" });
    } else {
      res.json({ message: `Site ${req.params.id} successfully updated` });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/sites/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const result = await dataService.deleteSiteById(req.params.id);
    if (result.deletedCount === 0) {
      res.status(404).json({ message: "Site not found" });
    } else {
      res.status(204).end();
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 404 middleware - catch all unmatched routes
app.use((req, res) => {
  res.status(404).json({ message: "Resource not found" });
});

// Initialize the data service, then start the server
dataService.initialize().then(() => {
  app.listen(HTTP_PORT, () => {
    console.log(`server listening on: ${HTTP_PORT}`);
  });
}).catch((err) => {
  console.log(err);
});

module.exports = app;
