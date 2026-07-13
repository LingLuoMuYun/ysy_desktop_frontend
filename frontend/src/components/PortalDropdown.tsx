import { cloneElement, useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties, Ref, ReactElement, ReactNode } from "react";

interface PortalDropdownProps {
  /** 触发器元素（必须是单个 ReactElement，如 button） */
  trigger: ReactElement;
  /** 下拉菜单内容 */
  children: ReactNode;
  /** 是否展开 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 下拉菜单内层 className */
  menuClassName?: string;
  /** 对齐方式 */
  align?: "left" | "right";
}

function getFixedStyle(
  el: HTMLElement | null,
  align: "left" | "right",
): CSSProperties {
  if (!el) return { visibility: "hidden" } as CSSProperties;

  const rect = el.getBoundingClientRect();
  const gap = 6;

  const style: CSSProperties = {
    position: "fixed",
    zIndex: 1000,
    top: rect.top,
    transform: `translateY(calc(-100% - ${gap}px))`,
  };

  if (align === "right") {
    style.right = window.innerWidth - rect.right;
    style.left = "auto";
  } else {
    style.left = rect.left;
  }

  return style;
}

export function PortalDropdown({
  trigger,
  children,
  open,
  onClose,
  menuClassName,
  align = "left",
}: PortalDropdownProps) {
  const triggerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({ visibility: "hidden" } as CSSProperties);

  const updatePosition = useCallback(() => {
    setStyle(getFixedStyle(triggerRef.current, align));
  }, [align]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(updatePosition);
  }, [open, updatePosition]);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      onClose();
    };
    // 延迟绑定，避免打开时的同次点击触发关闭
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open, onClose]);

  // resize / scroll 时更新位置
  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  const clonedTrigger = cloneElement(trigger as ReactElement<{ ref?: Ref<HTMLElement> }>, {
    ref: triggerRef,
  });

  return (
    <>
      {clonedTrigger}
      {open &&
        createPortal(
          <div ref={menuRef} style={style}>
            <div className={menuClassName}>{children}</div>
          </div>,
          document.body,
        )}
    </>
  );
}
