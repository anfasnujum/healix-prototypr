import type { InputHTMLAttributes } from 'react'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string
}

export function Input({ label, hint, error, className, ...props }: InputProps) {
  return (
    <label className="block">
      {label ? (
        <div className="mb-1 text-sm font-medium text-slate-800">{label}</div>
      ) : null}
      <input
        {...props}
        className={[
          'h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all duration-200',
          'placeholder:text-slate-400 focus:border-healix-teal/60 focus:ring-2 focus:ring-healix-teal/20',
          error ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200' : '',
          className ?? '',
        ].join(' ')}
      />
      {error ? (
        <div className="mt-1 text-xs text-rose-700">{error}</div>
      ) : hint ? (
        <div className="mt-1 text-xs text-slate-500">{hint}</div>
      ) : null}
    </label>
  )
}

