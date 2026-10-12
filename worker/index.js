import { games, music } from "./catalog.js";

const DIRECTORIES = {
  "/music": { title: "Music", files: music },
  "/games": { title: "Games", files: games }
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function (ch) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[ch];
  });
}

function listing(title, files) {
  const items = files.map(function (name) {
    const href = encodeURIComponent(name);
    return '<li><a href="' + href + '">' + escapeHtml(name) + "</a></li>";
  }).join("\n");
  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    "<title>" + escapeHtml(title) + "</title>",
    "</head>",
    "<body>",
    "<h1>" + escapeHtml(title) + "</h1>",
    "<ul>",
    items,
    "</ul>",
    "</body>",
    "</html>"
  ].join("\n");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const directory = DIRECTORIES[path];
    if (directory && (request.method === "GET" || request.method === "HEAD")) {
      const body = listing(directory.title, directory.files);
      return new Response(request.method === "HEAD" ? null : body, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store"
        }
      });
    }
    return env.ASSETS.fetch(request);
  }
};
