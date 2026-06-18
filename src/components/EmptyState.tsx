export function EmptyState() {
  return (
    <div className="animate-fade-in-up flex h-full min-h-[50vh] items-center justify-center text-center">
      <p className="max-w-sm text-[15px] leading-relaxed text-muted-foreground">
        Select an endpoint from the sidebar to see its details.
      </p>
    </div>
  );
}
