export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

/** Client-side filter input — no debounce, no "Enter" required (filters on every keystroke). */
export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search endpoints..."
      aria-label="Search endpoints"
      className="w-full rounded-md border px-3 py-1.5 text-sm shadow-sm outline-none transition-shadow duration-150 focus:ring-2 focus:ring-[var(--color-accent)]"
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text)',
      }}
    />
  );
}
