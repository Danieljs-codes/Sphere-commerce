import { createFileRoute } from '@tanstack/react-router'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import type { ForgotPasswordSchema } from '@/lib/schema'
import { Logo } from '@/components/logo'
import { forgotPasswordSchema } from '@/lib/schema'
import { TextField } from '@/components/ui/text-field'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Loader } from '@/components/ui/loader'
import { authClient } from '@/lib/auth-client'
import { env } from '@/env'
import { cn } from '@/lib/utils'
import { Note } from '@/components/ui/note'

export const Route = createFileRoute('/(auth)/forgot-password')({
  component: RouteComponent,
})

function RouteComponent() {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
    control,
    setError,
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordSchema) => {
    await authClient.requestPasswordReset(
      {
        email: data.email,
        redirectTo: `${env.VITE_APP_URL}/reset-password`,
      },
      {
        onSuccess: () => {
          toast.success('Password reset link sent!')
        },
        onError: () => {
          toast.error('Failed to send password reset link.')
        },
      },
    )
  }

  return (
    <div className="w-full">
      <Link to="/">
        <Logo className="size-7" />
      </Link>
      <h1 className="mt-2 font-semibold text-xl/10">Forgot Password</h1>
      <p className="text-muted-fg text-sm/6">
        Enter your email address and we'll send you a link to reset your
        password.
      </p>
      {errors.root?.message ? (
        <Note intent="danger" className="mt-5">
          {errors.root.message}
        </Note>
      ) : null}
      <form
        className={cn(
          'mt-6 grid w-full grid-cols-1 gap-6',
          errors.root?.message && 'mt-5',
        )}
        onSubmit={handleSubmit(onSubmit)}
      >
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <TextField
              label="Email"
              {...field}
              isInvalid={fieldState.invalid}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
        <Button type="submit" isPending={isSubmitting}>
          {isSubmitting && <Loader />}
          Send Reset Link
        </Button>
      </form>
      <hr className="mt-8 mb-6 w-full border-border/50" />
      <p className="text-muted-fg text-sm/6">
        Remembered your password?{' '}
        <Link
          to="/sign-in"
          className="font-medium cursor-pointer text-primary-subtle-fg hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
