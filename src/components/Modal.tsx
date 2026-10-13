import { useEffect, useRef, type ReactNode } from "react";
import { CloseIcon } from "./icons";

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Hide the visible heading (the content draws its own). */
  bareTitle?: boolean;
}

/** Bottom sheet on phones, centered card on larger screens. Escape or a backdrop tap closes it. */
export function Modal({ title, onClose, children, bareTitle }: Props) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fade-in fixed inset-0 z-50 flex items-end justify-center bg-[#0a0d1c]/55 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={onClose}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="paper sheet sheet-in relative max-h-[92dvh] w-full max-w-[460px] overflow-y-auto rounded-t-[22px] px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] outline-none sm:rounded-[22px]"
      >
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 grid h-9 w-9 place-items-center rounded-full bg-sunken text-ink"
          aria-label="Close"
        >
          <CloseIcon className="h-4.5 w-4.5" />
        </button>
        {!bareTitle && <h2 className="title mb-4 pr-10 text-[28px] leading-tight">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
