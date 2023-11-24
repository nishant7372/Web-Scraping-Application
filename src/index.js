const express = require("express");
const scrapeRouter = require("./routers/scrape");

const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: [
    "http://localhost", // add more origins
  ],
  methods: "*",
};

app.use(cors());

app.use(express.json());
app.use(scrapeRouter);

app.listen(port, () => {
  console.log("Server is up on the port " + port);
});
