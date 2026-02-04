"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch inline-flex shrink-0 items-center rounded-full border-2 shadow-sm transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-green-500 data-[state=checked]:border-green-600",
        "data-[state=unchecked]:bg-gray-200 data-[state=unchecked]:border-gray-300",
        "data-[size=default]:h-6 data-[size=default]:w-11 data-[size=sm]:h-4 data-[size=sm]:w-8",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full shadow-md ring-0 transition-transform",
          "data-[state=checked]:bg-white data-[state=unchecked]:bg-white",
          "group-data-[size=default]/switch:size-5 group-data-[size=sm]/switch:size-3",
          "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
