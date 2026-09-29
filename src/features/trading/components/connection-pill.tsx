import { Wifi, WifiOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ConnectionStatus } from "@/types";

type ConnectionPillProps = {
  status: ConnectionStatus;
};

export function ConnectionPill({ status }: ConnectionPillProps) {
  const isConnected = status === "connected";
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Badge tone={isConnected ? "success" : status === "disconnected" ? "danger" : "warning"}>
      {isConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
      {label}
    </Badge>
  );
}
