import { createFileRoute } from '@tanstack/react-router'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import type { ResetPasswordSchema } from '@/lib/schema'
import { Logo } from '@/components/logo'
import { resetPasswordSchema } from '@/lib/schema'
import { Note } from '@/components/ui/note'
import { TextField } from '@/components/ui/text-field'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { cn } from '@/lib/utils'
import { authClient } from '@/lib/auth-client'
import { Link } from '@/components/ui/link'

export const Route = createFileRoute('/(auth)/reset-password')({
  component: RouteComponent,
})

function RouteComponent() {
  const {
    handleSubmit,
    formState: { isSubmitting, errors },
    control,
    setError,
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })
  const navigate = Route.useNavigate()

  const onSubmit = async (data: ResetPasswordSchema) => {
    const token = new URLSearchParams(window.location.search).get('token')

    if (!token) {
      // Handle the error
      return
    }

    await authClient.resetPassword(
      {
        newPassword: data.password,
        token,
      },
      {
        onSuccess: () => {
          toast.success('Password reset successful!', {
            description: 'You can now log in with your new password.',
          })
          navigate({ to: '/sign-in' })
        },

        onError: ({ error }) => {
          setError('root', {
            message: error.message,
          })
        },
      },
    )
  }

  return (
    <div className="w-full">
      <Link to="/">
        <Logo className="size-7" />
      </Link>
      <h1 className="mt-2 font-semibold text-xl/10">Reset Password</h1>
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
          name="password"
          render={({ field, fieldState }) => (
            <TextField
              label="New Password"
              type="password"
              isRevealable
              {...field}
              isInvalid={fieldState.invalid}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <TextField
              label="Confirm New Password"
              type="password"
              isRevealable
              {...field}
              isInvalid={fieldState.invalid}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
        <Button type="submit" isPending={isSubmitting}>
          {isSubmitting && <Loader />}
          Reset Password
        </Button>
      </form>
    </div>
  )
}
