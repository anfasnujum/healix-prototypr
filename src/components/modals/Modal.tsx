import { useEffect, useId } from 'react'

export type ModalProps = {
  open: boolean
  title?: string
  description?: string
  widthClassName?: string
  children: React.ReactNode
  footer?: React.ReactNode
  onClose: () => void
}

export function Modal({
  open,
  title,
  description,
  widthClassName = 'max-w-xl',
  children,
  footer,
  onClose,
}: ModalProps) {
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-healix-navy/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
    >
      <div
        className={[
          'w-full healix-card overflow-hidden',
          widthClassName,
          'shadow-soft',
        ].join(' ')}
      >
        {title ? (
          <div className="border-b border-gray-100 bg-white/80 px-6 py-4 backdrop-blur">
            <div id={titleId} className="text-base font-semibold text-slate-900">
              {title}
            </div>
            {description ? (
              <div id={descId} className="mt-1 text-sm text-slate-500">
                {description}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="px-6 py-5">{children}</div>

        {footer ? (
          <div className="border-t border-gray-100 bg-white px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}

