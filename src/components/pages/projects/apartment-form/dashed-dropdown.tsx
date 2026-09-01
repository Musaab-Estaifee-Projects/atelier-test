"use client";

import { useId } from "react";
import CustomChevron from "@/components/icons/custom-chevron";
import OptionList from "./option-list";

type Props = {
  label: string;
  value: string;
  placeholder: string;
  options: { id: string; label: string }[];
  open: boolean;
  onToggle: () => void;
  onChange: (id: string) => void;
};

const DashedDropdown = ({
  label,
  value,
  placeholder,
  options,
  open,
  onToggle,
  onChange,
}: Props) => {
  const labelId = useId();
  const selected = options.find((option) => option.id === value);

  return (
    <div className="relative min-w-0 flex-1">
      <button
        type="button"
        id={labelId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={onToggle}
        className="flex w-full items-center gap-2 border-b border-dashed border-white/35 py-3.5 text-left"
      >
        <span
          className={`min-w-0 flex-1 truncate text-[12px] leading-[1.2] ${
            selected ? "text-white/80" : "text-white/28"
          }`}
        >
          {selected?.label ?? placeholder}
        </span>
        <span className="relative block h-[6.25px] w-2.5 shrink-0 overflow-clip">
          <CustomChevron
            className={`h-full w-full transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>
      {open ? (
        <OptionList
          options={options}
          value={value}
          labelledBy={labelId}
          onSelect={onChange}
        />
      ) : null}
    </div>
  );
};

export default DashedDropdown;
