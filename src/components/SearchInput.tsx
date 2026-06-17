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
      className="w-full rounded-md border px-3 py-1.5 text-sm outline-none focus:ring-1"
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text)',
      }}
    />
  );
}
