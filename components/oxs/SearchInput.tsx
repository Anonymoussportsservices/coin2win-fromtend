type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  className = "",
}: SearchInputProps) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none placeholder:text-slate-500 ${className}`}
    />
  );
}
