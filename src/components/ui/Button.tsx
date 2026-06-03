import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-healix-teal/40 focus-visible:ring-offset-2 focus-visible:ring-offset-healix-surface'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-healix-teal text-healix-navy hover:bg-[#00b6a0] shadow-sm hover:shadow',
  secondary: 'bg-white text-slate-900 border border-gray-200 hover:bg-gray-50',
  outline:
    'bg-transparent text-healix-teal border border-healix-teal/40 hover:border-healix-teal hover:bg-healix-teal/10',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 shadow-sm hover:shadow',
  success:
    'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={[
        base,
        variants[variant],
        sizes[size],
        fullWidth ? 'w-full' : '',
        className ?? '',
      ].join(' ')}
    />
  )
}

