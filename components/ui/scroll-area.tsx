import * as React from "react"

type ScrollAreaProps = React.HTMLAttributes<HTMLDivElement> & {
  viewportRef?: React.RefObject<HTMLDivElement | null>
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, viewportRef, ...props }, ref) => (
    <div
      ref={viewportRef || ref}
      className={`overflow-y-auto scrollbar-thin ${className}`}
      {...props}
    >
      {children}
    </div>
  )
)
ScrollArea.displayName = "ScrollArea"

export { ScrollArea }
