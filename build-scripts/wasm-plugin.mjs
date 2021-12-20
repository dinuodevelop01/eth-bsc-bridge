import fs from "node:fs/promises";
import { rewritePath } from "./resolve-plugin.mjs";

// copypasta:
// https://esbuild.github.io/plugins/#webassembly-plugin
const wasmPlugin = {
  name: "wasm",
  setup(build) {
    // Resolve ".wasm" files to a path with a namespace
    build.onResolve({ filter: /\.wasm$/ }, (args) => {
      if (args.resolveDir === "") {
        return; // Ignore unresolvable paths
      }
      return {
        path: rewritePath(args.path),
        namespace: "wasm-binary",
      };
    });

    // Virtual modules in the "wasm-binary" namespace contain the
    // actual bytes of the WebAssembly file. This uses esbuild's
    // built-in "binary" loader instead of manually embedding the
    // binary data inside JavaScript code ourselves.
    build.onLoad({ filter: /.*/, namespace: "wasm-binary" }, async (args) => ({
      contents: await fs.readFile(args.path),
      loader: "binary",
    }));
  },
};

export default wasmPlugin;
