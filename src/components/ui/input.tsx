import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-[#3F3F46] bg-[#18181B] px-3 py-1 text-sm text-[#FAFAFA] transition-colors outline-none placeholder:text-[#71717A] focus-visible:border-[#84CC16] focus-visible:ring-1 focus-visible:ring-[#84CC16]/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
