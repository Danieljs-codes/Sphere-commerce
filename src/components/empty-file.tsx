import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const EmptyFile = ({ className, ...props }: ComponentProps<'svg'>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      className={cn(className)}
      viewBox="0 0 40 40"
      {...props}
    >
      <path
        stroke="var(--color-border)"
        strokeWidth="1.5"
        d="M4.75 4A3.25 3.25 0 0 1 8 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 32 39.25H8A3.25 3.25 0 0 1 4.75 36z"
      />
      <path
        stroke="var(--color-border)"
        strokeWidth="1.5"
        d="M24 .5V8a4 4 0 0 0 4 4h7.5"
      />
    </svg>
  )
}
