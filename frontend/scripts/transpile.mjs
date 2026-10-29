// Transpile StagePickApp.jsx to CommonJS so node can --check and jsdom can run it.
import { transformFileSync } from "@babel/core";
import presetReact from "@babel/preset-react";
import commonjs from "@babel/plugin-transform-modules-commonjs";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync(".verify", { recursive: true });

const result = transformFileSync("src/StagePickApp.jsx", {
  filename: "StagePickApp.jsx",
  babelrc: false,
  configFile: false,
  presets: [[presetReact, { runtime: "automatic", development: false }]],
  plugins: [commonjs],
});

writeFileSync(".verify/StagePickApp.cjs", result.code, "utf8");
console.log("transpiled", result.code.length, "chars");
