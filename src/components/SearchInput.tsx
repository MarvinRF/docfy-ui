import { Search } from 'lucide-react';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

/** Client-side filter input — no debounce, no "Enter" required (filters on every keystroke). */
export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className="relative">
      <Search
        size={14}
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
        style={{ color: 'var(--color-muted-foreground)' }}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search endpoints..."
        aria-label="Search endpoints"
        className="w-full rounded-md border py-1.5 pl-8 pr-3 text-sm shadow-[var(--shadow-warm-sm)] outline-none transition-shadow duration-150 focus:ring-2 focus:ring-[var(--color-accent)]"
        style={{
          backgroundColor: 'var(--color-surface-sunken)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text)',
        }}
      />
    </div>
  );
}
