import symbolName from "@/util/symbol-name.mjs";

const stringsToSymbols = (arr) => {
  return arr.reduce((hash, string) => {
    hash[string] = symbolName(string);
    return hash;
  }, {});
};

export default stringsToSymbols;
