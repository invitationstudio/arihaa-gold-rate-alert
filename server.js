
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;

const WEBSITE = "https://allindiabullion.com/display/maharashtra/mumbai?show=gl999%2Cgl995%2Cgr999%2Cgr999g%2Cgr995%2Cgr995g%2Csl999%2Csr999%2Csr999g&name=ARIHAA+GOLD+LLP";

const products = [
  {id:"GL999.ex", name:"Gold 999 Retail", metal:"Gold"},
  {id:"GL995.ex", name:"Gold 995 Retail", metal:"Gold"},
  {id:"GR999.ex", name:"Gold 999 RTGS", metal:"Gold"},
  {id:"GR999.inc", name:"Gold 999 RTGS With GST", metal:"Gold"},
  {id:"GR995.ex", name:"Gold 995 RTGS", metal:"Gold"},
  {id:"GR995.inc", name:"Gold 995 RTGS With GST", metal:"Gold"},
  {id:"SL999.ex", name:"Silver 999 Retail", metal:"Silver"},
  {id:"SR999.ex", name:"Silver 999 RTGS", metal:"Silver"},
  {id:"SR999.inc", name:"Silver 999 RTGS With GST", metal:"Silver"}
];

async function getRates() {
  const response = await fetch(WEBSITE, {
    headers: {"User-Agent": "Mozilla/5.0"}
  });

  if (!response.ok) {
    throw new Error("Website HTTP Status: " + response.status);
  }

  const html = await response.text();
  const values = {};

  const regex = /data-aib-live="quote\.([^"]+)"[^>]*>([^<]*)</g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    values[match[1]] = match[2].trim();
  }

  const result = products.map(product => {
    const raw = values[product.id];

    if (!raw) {
      throw new Error("Missing Rate: " + product.id);
    }

    const amount = Number(raw.replace(/[^\d.]/g, ""));

    if (!Number.isFinite(amount)) {
      throw new Error("Invalid Rate: " + product.id);
    }

    return {
      id: product.id,
      name: product.name,
      metal: product.metal,
      rate: amount,
      display: raw,
      unit: product.metal === "Gold" ? "per 10g" : "per kg"
    };
  });

  return {
    success: true,
    updatedAt: new Date().toLocaleString("en-IN"),
    rates: result
  };
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Cache-Control", "no-store");

  if (req.url.startsWith("/api/rates")) {
    try {
      const data = await getRates();
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8"
      });
      res.end(JSON.stringify(data));
    } catch (error) {
      res.writeHead(500, {
        "Content-Type": "application/json"
      });
      res.end(JSON.stringify({
        success: false,
        error: error.message
      }));
    }
    return;
  }

  if (req.url === "/" || req.url === "/index.html") {
    fs.readFile(path.join(__dirname, "index.html"), (error, data) => {
      if (error) {
        res.writeHead(500);
        res.end("index.html not found");
        return;
      }

      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8"
      });
      res.end(data);
    });
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("--------------------------------");
  console.log("ARIHAA GOLD RATE SERVER STARTED");
  console.log("http://localhost:" + PORT);
  console.log("--------------------------------");
});
