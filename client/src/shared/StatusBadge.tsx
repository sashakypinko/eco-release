import { Badge } from "@/components/ui/badge";
import { statusVariant, environmentVariant } from "@/shared/constants";

export function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <Badge variant="secondary">Unknown</Badge>;
  const variant = statusVariant[status] || "bg-muted text-muted-foreground";
  return (
    <Badge className={`${variant} no-default-hover-elevate no-default-active-elevate font-medium`} data-testid={`badge-status-${status.replace(/\s+/g, "-").toLowerCase()}`}>
      {status}
    </Badge>
  );
}

export function EnvironmentBadge({ env }: { env: string | null | undefined }) {
  if (!env) return <Badge variant="secondary">Unknown</Badge>;
  const variant = environmentVariant[env] || "bg-muted text-muted-foreground";
  return (
    <Badge className={`${variant} no-default-hover-elevate no-default-active-elevate font-medium`} data-testid={`badge-env-${env}`}>
      {env}
    </Badge>
  );
}
