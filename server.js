const express = require("express");
const path = require("path");
const compression = require("compression");

const app = express();
app.use(compression());

// Serve only the static files form the dist directory
app.use(express.static(__dirname + "/client"));

app.get("/*", function (req, res) {
  res.set("Cache-Control", "public, max-age=31557600");
  res.sendFile(path.join(__dirname + "/client/index.html"));
  console.log("Serving");
});

// Start the app by listening on the default Heroku port
app.listen(process.env.PORT || 8080, () => {
  console.log("STARTED SERVER");
});