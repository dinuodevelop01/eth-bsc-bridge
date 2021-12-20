import React, { useMemo } from "react";

const contentRegExp = /<svg(.*?)>(.*?)<\/svg>/s;
const attrRegExp = /(.*?)="(.*?)"/;
const splitAttrExp = /[\w-]+="[^"]*"/g;

// TODO: figure out how to memoize the entire svg element.

const attributeMap = {
  viewbox: "viewBox",
};

function Icon({ svg, className, width, height }) {
  const obj = useMemo(() => {
    const [, attrs, content] = svg.match(contentRegExp);
    const svgAttributes = {};
    for (const stringAttr of attrs.trim().match(splitAttrExp)) {
      let [, key, value] = stringAttr.match(attrRegExp);
      if (key in attributeMap) key = attributeMap[key];
      svgAttributes[key] = value;
    }
    return { svgAttributes, __html: content };
  }, [svg]);
  return (
    <svg
      {...obj.svgAttributes}
      dangerouslySetInnerHTML={obj}
      className={className}
      width={width}
      height={height}
    />
  );
}

export default Icon;
