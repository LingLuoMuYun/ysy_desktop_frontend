import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import "./ScrollArea.css";

type ScrollAreaDirection = "vertical" | "horizontal" | "both";

interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  /** 滚动方向，默认纵向滚动。 */
  direction?: ScrollAreaDirection;
  /** 是否为滚动条预留稳定空间，避免内容宽度跳动。 */
  stableGutter?: boolean;
}

const directionClass: Record<ScrollAreaDirection, string> = {
  vertical: "scroll-area--y",
  horizontal: "scroll-area--x",
  both: "scroll-area--both",
};

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  {
    children,
    className,
    direction = "vertical",
    stableGutter = true,
    ...props
  },
  ref,
) {
  const classes = [
    "scroll-area",
    directionClass[direction],
    stableGutter ? "scroll-area--stable" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={ref} className={classes} {...props}>
      {children}
    </div>
  );
});
