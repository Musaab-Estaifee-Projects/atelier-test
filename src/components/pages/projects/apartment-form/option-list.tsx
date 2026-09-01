type Props = {
  options: { id: string; label: string }[];
  value?: string;
  labelledBy?: string;
  onSelect: (id: string) => void;
};

const OptionList = ({ options, value, labelledBy, onSelect }: Props) => (
  <ul
    role="listbox"
    aria-labelledby={labelledBy}
    className="absolute top-full left-0 z-30 mt-1 flex w-full flex-col gap-[5px] bg-[#00272d] p-[5px] shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
  >
    {options.map((option) => (
      <li key={option.id}>
        <button
          type="button"
          role="option"
          aria-selected={option.id === value}
          className={`w-full px-2.5 py-2.5 text-left text-[12px] leading-[1.2] text-white/70 transition-colors hover:bg-white/5 ${
            option.id === value ? "bg-white/5 text-white" : ""
          }`}
          onClick={() => onSelect(option.id)}
        >
          {option.label}
        </button>
      </li>
    ))}
  </ul>
);

export default OptionList;
