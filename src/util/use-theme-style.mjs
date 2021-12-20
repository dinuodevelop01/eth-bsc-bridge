import { useEffect } from "react";
import { useSnapshot } from "valtio";
import { readState } from "@/__main__/app-state.mjs";
import themes from "@/util/themes.mjs";

function useThemeStyle() {
  const state = useSnapshot(readState);
  const themeKey = state.settings?.theme || "LIGHT";
  const theme = themes[themeKey];
  useEffect(() => {
    const { cssClass } = theme;
    if (cssClass) window.document.body.classList.add(cssClass);
    return () => {
      if (cssClass) window.document.body.classList.remove(cssClass);
    };
  }, [theme]);
}

export default useThemeStyle;
