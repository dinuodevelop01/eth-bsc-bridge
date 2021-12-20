import fs from "node:fs/promises";
import { rewritePath } from "./resolve-plugin.mjs";

// https://esbuild.github.io/plugins/
const svgPlugin = {
  name: "svg",
  setup(build) {
    build.onResolve({ filter: /\.svg$/ }, (args) => {
      return {
        path: rewritePath(args.path),
        namespace: "svg",
      };
    });

    build.onLoad({ filter: /.*/, namespace: "svg" }, async (args) => ({
      contents: await fs.readFile(args.path),
      loader: "text",
    }));
  },
};

export default svgPlugin;
