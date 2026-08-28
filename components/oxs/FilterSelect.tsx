type FilterOption = {
  label: string;
  value: string;
};

type FilterSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  className?: string;
};

export function FilterSelect({
  value,
  onChange,
  options,
  className = "",
}: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none ${className}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
