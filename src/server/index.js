require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const path = require("path");
const Immutable = require("immutable");

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/", express.static(path.join(__dirname, "../public")));

const API_KEY = process.env.API_KEY;

app.get("/apod", async (req, res) => {
  try {
    let image = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}`
    ).then(res => res.json());
    res.send({ image });
  } catch (err) {
    console.log("error:", err);
  }
});

app.get("/rovers", async (req, res) => {
  try {
    const metas = await Promise.all(
      ["curiosity", "spirit", "opportunity"].map(
        async rover =>
          await fetch(
            `https://api.nasa.gov/mars-photos/api/v1/manifests/${rover}?api_key=${API_KEY}`
          ).then(res => res.json())
      )
    );
    const formattedMetas = metas.map(data => {
      const photoManifest = data.photo_manifest;
      return {
        name: photoManifest.name,
        landing_date: photoManifest.landing_date,
        launch_date: photoManifest.launch_date,
        status: photoManifest.status,
        max_sol: photoManifest.max_sol,
        max_date: photoManifest.max_date,
        total_photos: photoManifest.total_photos
      };
    });
    const curiosity = formattedMetas[0];
    const spirit = formattedMetas[1];
    const opportunity = formattedMetas[2];
    res.send(Immutable.List([curiosity, spirit, opportunity]));
  } catch (err) {
    console.log("error", err);
  }
});

app.get("/rover/:rover", async (req, res) => {
  const { rover } = req.params;
  const { maxSol } = req.query;
  const photoReqs = [];
  const cameras = {
    curiosity: "MAST",
    opportunity: "PANCAM",
    spirit: "PANCAM"
  };
  try {
    for (let i = 0; i < 4; i++) {
      photoReqs.push(
        await fetch(
          `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos?sol=${maxSol -
            20 * i}&camera=${cameras[rover.toLowerCase()]}&api_key=${API_KEY}`
        )
          .then(res => res.json())
          .then(({ photos }) => photos.slice(0, 2))
      );
    }
    const photos = await Promise.all(photoReqs);
    console.log(photos);
    res.send(Immutable.List(photos));
  } catch (err) {
    console.log("error", err);
  }
});

app.listen(port, () =>
  console.log(`Example app listening on port http://localhost:${port}!`)
);
