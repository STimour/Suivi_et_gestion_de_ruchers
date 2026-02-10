"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      duration={3500}
      gap={8}
      icons={{
        success: <CircleCheckIcon className="size-5" />,
        info: <InfoIcon className="size-5" />,
        warning: <TriangleAlertIcon className="size-5" />,
        error: <OctagonXIcon className="size-5" />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex items-start gap-3 w-full rounded-xl px-4 py-3.5 shadow-lg border text-sm font-medium backdrop-blur-sm",
          title: "text-[13px] font-semibold leading-snug",
          description: "text-[12px] opacity-80 mt-0.5 leading-snug",
          success:
            "bg-emerald-50 border-emerald-200 text-emerald-900 [&_svg]:text-emerald-600",
          error:
            "bg-red-50 border-red-200 text-red-900 [&_svg]:text-red-500",
          warning:
            "bg-amber-50 border-amber-200 text-amber-900 [&_svg]:text-amber-500",
          info:
            "bg-blue-50 border-blue-200 text-blue-900 [&_svg]:text-blue-500",
          loading:
            "bg-gray-50 border-gray-200 text-gray-800 [&_svg]:text-gray-500",
          actionButton:
            "bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors",
          cancelButton:
            "bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
