// The purpose of naming symbols this way is to discourage devs from casting
// the symbol descriptor to a string, and to easily catch it if it happens.
export default function symbolName(str) {
  return Symbol(`$$$ ${str} $$$`);
}
