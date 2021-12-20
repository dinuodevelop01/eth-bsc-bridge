import run from "tapdance";
import { server } from "../../server/worker.mjs";
import fetch from "node-fetch";

let res, text;

run(async (assert, comment) => {
  comment("server-side render");
  await new Promise((resolve) => {
    server.listen(() => {
      resolve();
    });
  });
  const { port } = server.address();
  res = await fetch(`http://localhost:${port}/`);
  text = await res.text();
  assert(text.match(/<style>/m), "style tag found");
  assert(text.match(/<div id="app">(.*?)<\/div>/s)[1], "content found");
});
