import { MagnifyingGlassIcon, PlusIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: "search" | "add";
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export function EmptyState({
  icon = "search",
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const Icon = icon === "search" ? MagnifyingGlassIcon : PlusIcon;

  return (
    <div className="flex flex-col items-center justify-center h-[400px] bg-muted/50 rounded-lg p-8 text-center">
      <div className="bg-primary/10 rounded-full p-3 mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-2xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
      <Button onClick={onAction}>{actionLabel}</Button>
    </div>
  );
}
