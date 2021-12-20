import React, { useState, useCallback, useEffect, useRef } from "react";
import { styled } from "goober";
import Check from "@/../www/assets/check.svg";
import Icon from "@/shared/Icon.jsx";

const DropdownContent = styled("div")`
  position: absolute;
  background: var(--bg-primary);
  box-shadow: rgb(11 14 17 / 16%) 0px 2px 6px;
  border-radius: var(--br-medium);
  width: 220px;

  & > div {
    display: flex;
    padding: 12px 24px;
    font-size: var(--fs-medium);
    border-bottom: 1px solid rgb(230, 232, 234);
    cursor: default;
    color: var(--text-primary);
    
    &.item-inactive {
      color: var(--text-primary-30);
    }

    &:hover:not(.item-inactive) {
      background: var(--primary-30);
    }
  }

  &.hidden {
    visibility: hidden;
  }
`;

const CheckIcon = styled(Icon)`
  width: 12px;
  height: 12p;
  fill: var(--primary);
  margin-left: auto;
`

function Dropdown(props) {
  const {
    defaultValue,
    items,
    renderButton,
    renderItem,
    onChange
  } = props;

  const ref = useRef();
  const [value, setValue] = useState(defaultValue);
  const [isOpened, setIsOpened] = useState(false);

  useEffect(() => {
    const checkIfClickedOutside = e => {
      // If the menu is open and the clicked target is not within the menu,
      // then close the menu
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpened(false);
      }
    }

    document.addEventListener("mousedown", checkIfClickedOutside);

    return () => {
      // Cleanup the event listener
      document.removeEventListener("mousedown", checkIfClickedOutside);
    }
  }, [ref]);
  useEffect(() => {
    if (value != defaultValue) {
      setValue(defaultValue);
    }
  }, [defaultValue, value]);

  const handleClick = useCallback(() => {
    setIsOpened(b => !b);
  }, []);

  const handleChange = useCallback((selectedItem) => {
    setValue(selectedItem?.value);
    setIsOpened(false);
    onChange && onChange(selectedItem);
  }, [onChange]);

  return (
    <div className="container" ref={ref}>
      {renderButton && renderButton({onClick: handleClick})}

      <DropdownContent className={!isOpened && "hidden"}>
        {items && renderItem && items.map((item, idx) => {
          const status = item.active ? "active" : "inactive";
          const isSelected = value == item.value;
          return (
            <div key={idx} className={`item-${status}`} onClick={() => handleChange(item)}>
              {renderItem(item, isSelected, idx)}

              {isSelected && <CheckIcon svg={Check}/>}
            </div>
          )
        })}
      </DropdownContent>
    </div>
  );
}

export default Dropdown;
