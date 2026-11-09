const http = require("http");
const fs = require("fs");
const path = require("path");

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm"
};

http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || "/").split("?")[0]);
  if (u === "/") u = "/index.html";
  const p = path.join(process.cwd(), u);
  fs.readFile(p, (e, d) => {
    if (e) {
      res.writeHead(404);
      res.end("no");
      return;
    }
    res.writeHead(200, { "Content-Type": types[path.extname(p)] || "text/plain" });
    res.end(d);
  });
}).listen(8766, "127.0.0.1", () => console.log("ok"));
