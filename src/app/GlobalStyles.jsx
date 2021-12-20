import { createGlobalStyles } from "goober/global";

export const style = /* css */ `
:root {
  --bg-primary: white;
  --bg-secondary: rgb(245, 245, 245);
  --primary: rgb(240, 180, 11);
  --primary-light: rgb(248, 209, 47);
  --primary-30: rgba(240, 180, 11, 0.3);
  --secondary: rgb(245, 245, 245);
  --secondary-light: rgb(248, 209, 47);
  --text-primary: rgb(30, 32, 38);
  --text-secondary: rgb(118, 128, 143);
  --text-primary-30: rgba(30, 32, 38, 0.3);
  --blue: rgb(2, 192, 118);

  --fs-small: 12px;
  --fs-medium: 14px;
  --fs-large: 40px;
  --br-small: 4px;
  --br-medium: 8px;
  --br-large: 12px;
}

.theme-dark {
  /* Color variables */
}

.theme-dark {
  
}

body {
  color: var(--text-primary);
  font-size: var(--fs-small);
  background: var(--bg-secondary);
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

div {
  box-sizing: border-box;
}

.typo-label {
  font-size: var(--fs-small);
  color: var(--text-primary);
  margin-bottom: 4px;
}

.typo-secondary {
  font-size: var(--fs-small);
  color: var(--text-secondary);
  line-height: 32px;
}

.typo-body {
  font-size: var(--fs-medium);
  color: var(--text-primary);
}

.typo-title {
  font-size: var(--fs-large);
  color: var(--text-primary);
}

button {
  &:disabled,
  &[disabled] {
    background-color: #cccccc;
    color: #666666;
  }
}
.button {
  &-small {
    border-radius: var(--br-small);
    font-size: var(--fs-small);
    font-weight: 600;
    height: 32px;
    padding: 0 10px;
  }
  &-medium {
    border-radius: var(--br-medium);
    font-size: var(--fs-medium);
    font-weight: 600;
    height: 40px;
    padding: 0 12px;
  }
  &-large {
    border-radius: var(--br-large);
    font-size: var(--fs-large);
    font-weight: 600;
  }
}
.button-primary {
  background: var(--primary);
  color: var(--text-primary);
  border: none;

  &:hover:not(:disabled) {
    background: var(--primary-light);
  }
}

.button-secondary {
  background: var(--secondary);
  color: var(--text-secondary);
  border: none;

  &:hover {
    background: var(--secondary-light);
  }
}

.flex-row {
  display: flex;
  flex-direction: row;
}

.flex-col {
  display: flex;
  flex-direction: col;
}

.ml-auto {
  margin-left: auto;
}

.mr-auto {
  margin-right: auto;
}

.mt-auto {
  margin-top: auto;
}

.mb-auto {
  margin-bottom: auto;
}

.mlr-auto {
  margin-left: auto;
  margin-right: auto;
}

.mbt-auto {
  margin-top: auto;
  margin-bottom: auto;
}

.mx-small {
  margin-left: 12px;
  margin-right: 12px;
}

.mx-medium {
  margin-left: 16px;
  margin-right: 16px;
}

.mt-small {
  margin-top: 12px;
}

.mt-medium {
  margin-top: 24px;
}

.container {
  position: relative;
}
`;

export default createGlobalStyles`${style}`;
