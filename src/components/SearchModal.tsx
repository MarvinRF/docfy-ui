import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { filterTagGroups } from '../document-model/filter';
import type { TagGroup } from '../document-model/types';
import { MethodBadge } from './MethodBadge';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from './ui/command';

export interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tagGroups: TagGroup[];
}

function endpointId(endpoint: { method: string; path: string; operationId?: string }): string {
  return endpoint.operationId ?? `${endpoint.method}-${endpoint.path}`;
}

/**
 * Cmd/Ctrl+K command palette — filters the same tag groups as the sidebar
 * tree (reusing `filterTagGroups`, the same function the inline sidebar
 * filter used before this moved into a modal) and navigates on select.
 */
export function SearchModal({ open, onOpenChange, tagGroups }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const filtered = filterTagGroups(tagGroups, query);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) setQuery('');
  }

  function select(groupName: string, id: string) {
    handleOpenChange(false);
    navigate(`/${encodeURIComponent(groupName)}/${encodeURIComponent(id)}`);
  }

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <CommandInput placeholder="Search endpoints…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {filtered.map((group) => (
          <CommandGroup key={group.name} heading={group.name}>
            {group.endpoints.map((endpoint) => {
              const id = endpointId(endpoint);
              return (
                <CommandItem key={`${group.name}-${id}`} onSelect={() => select(group.name, id)}>
                  <span className="truncate">{endpoint.summary ?? endpoint.path}</span>
                  <MethodBadge method={endpoint.method} />
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
