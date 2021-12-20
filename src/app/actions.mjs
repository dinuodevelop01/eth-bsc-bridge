import {
  // This is fine because this file is for actions.
  __DO_NOT_IMPORT_DIRECTLY_USE_ACTIONS_INSTEAD as writeState,
  readState,
} from "@/__main__/app-state.mjs";
import { isPersistent } from "@/__main__/app-state.mjs";

// This file is for actions to update state, which are based on
// user input and not data fetching.
export function initBridge() {
  writeState.bridge = {
    ...readState.bridge,
    [isPersistent]: true
  };
}

export function setFrom(from) {
  writeState.bridge = {
    ...readState.bridge,
    from: from
  };
}

export function setTo(to) {
  writeState.bridge = {
    ...readState.bridge,
    to: to
  };
}
