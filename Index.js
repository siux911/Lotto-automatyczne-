const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cron = require("node-cron");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.static("public"));

const RESULTS_FILE = path.join(__dirname, "data", "results.json");

// Funkcja pobierająca wyniki Lotto z oficjalnej strony
async function fetchResults() {
  try {
    const url = "https://www.lotto.pl/lotto/wyniki-i-wygrane";
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    let results = [];

    $(".numbersBox .gameName:contains('Lotto')").each((i, el) => {
      const draw = $(el).parent().find(".numbersContainer .number");
      const numbers = [];
      draw.each((j, num) => numbers.push(parseInt($(num).text())));
      if (numbers.length === 6) results.push(numbers);
    });

    if (results.length > 0) {
      fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
      console.log("✅ Wyniki zapisane:", results[0]);
    }
  } catch (err) {
    console.error("❌ Błąd pobierania wyników:", err.message);
  }
}

// Automatyczne odświeżanie wyników codziennie o 22:00
cron.schedule("0 22 * * *", fetchResults);

// Endpoint API
app.get("/api/results", (req, res) => {
  if (fs.existsSync(RESULTS_FILE)) {
    const results = JSON.parse(fs.readFileSync(RESULTS_FILE));
    res.json(results);
  } else {
    res.json([]);
  }
});

// Start serwera
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  fetchResults(); // pierwsze pobranie od razu
});
