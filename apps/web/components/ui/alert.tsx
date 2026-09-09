import * as React from "react"
import { cn } from "cn"

function Alert({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert"
      role="status"
      className={cn(
        "grid grid-cols-[auto_1fr] items-start gap-x-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-card-foreground [&>svg]:mt-0.5 [&>svg]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("font-medium", className)} {...props} />
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("col-start-2 mt-1 text-muted-foreground", className)} {...props} />
  )
}

export { Alert, AlertDescription, AlertTitle }
