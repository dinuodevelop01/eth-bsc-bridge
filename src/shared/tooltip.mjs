import { css } from "goober";
import throttle from "@/util/throttle.mjs";
import { IS_NODE } from "@/util/dev.mjs";

const document = IS_NODE ? {} : window.document;

class Tooltip {
  constructor() {
    this.rootNode = document.body;
    this.tooltipElem = null;
  }

  init() {
    window.addEventListener(
      "scroll",
      throttle(() => {
        if (this.tooltipElem) {
          this.tooltipElem.remove();
          this.tooltipElem = null;
        }
      }, 250),
      { passive: true }
    );

    this.rootNode.onmouseover = (e) => {
      const target = e.target;

      const tooltipContent = target.dataset.tooltip;
      if (!tooltipContent) return;

      this.show(target);
    };

    this.rootNode.onmouseout = () => {
      this.hide();
    };
  }

  cleanup() {
    this.rootNode.onmouseover = null;
    this.rootNode.onmouseout = null;

    window.removeEventListener("scroll", () => {
      if (this.tooltipElem) {
        this.tooltipElem = null;
      }
    });
  }

  hide() {
    if (this.tooltipElem) {
      this.tooltipElem.remove();
      this.tooltipElem = null;
    }
  }

  isShowing() {
    return this.tooltipElem;
  }

  show(node) {
    const tooltipContent = node.dataset.tooltip;
    let tooltipPlacement = "top";

    if (tooltipContent && tooltipContent !== "true") {
      this.tooltipElem = document.createElement("div");
      this.tooltipElem.classList.add(TooltipContainer);
      this.tooltipElem.classList.add(tooltipPlacement);
      this.tooltipElem.innerHTML = tooltipContent;
      this.rootNode.append(this.tooltipElem);

      let coords = node.getBoundingClientRect();

      let left =
        coords.left + (node.offsetWidth - this.tooltipElem.offsetWidth) / 2;
      if (left < 0) left = 0;

      let top = coords.top - this.tooltipElem.offsetHeight - 5;
      if (top < 0) {
        top = coords.top + node.offsetHeight + 5;
        this.tooltipElem.classList.add(
          tooltipPlacement === "top" ? "bottom" : "top"
        );
        this.tooltipElem.classList.remove(tooltipPlacement);
      }

      this.tooltipElem.style.left = left + "px";
      this.tooltipElem.style.top = top + "px";
    }
  }
}

export default new Tooltip();

const TooltipContainer = css`
  --bg: var(--shade10, black);

  position: fixed;
  background: var(--bg);
  color: var(--shade0);
  border-radius: var(--br);
  pointer-events: none;

  &::after {
    --size: 0.75rem;

    content: "";
    position: absolute;
    background: var(--bg);
    width: var(--size);
    height: var(--size);
  }
  &.top::after,
  &.bottom::after {
    left: calc(50% - calc(var(--size) / 2));
  }
  &.top::after {
    bottom: 0;
    clip-path: polygon(100% 0, 100% 100%, 0 100%);
    transform: translateY(50%) rotate(45deg);
  }
  &.bottom::after {
    top: 0;
    clip-path: polygon(100% 0, 0 0, 0 100%);
    transform: translateY(-50%) rotate(45deg);
  }
`;
