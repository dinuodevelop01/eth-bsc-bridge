// This should mainly be used for default values.
import symbolName from "@/util/symbol-name.mjs";

// So what is this symbol for? This is mainly used if we expect a part of the
// initial state to be hydrated from local DB only. If it's the initial object,
// using `readData` on it will trigger a DB read.
export const isInitial = symbolName("initial");

const initialState = {
  volatile: {},
  bridge: {
    from: "eth",
    to: "bsc"
  }
};

export function initializeState({ isVolatile }) {
  initialState.volatile[isVolatile] = true;
}

export default initialState;
