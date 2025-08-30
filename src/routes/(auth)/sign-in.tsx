import { zodResolver } from "@hookform/resolvers/zod";
import { $signIn } from "@server/auth";
import { $mergeCartOnSignIn } from "@server/customers/carts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@/components/ui/link";
import { Loader } from "@/components/ui/loader";
import { Note } from "@/components/ui/note";
import { TextField } from "@/components/ui/text-field";
import { getGuestCart } from "@/lib/carts";
import { type SignInSchema, signInSchema } from "@/lib/schema";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/(auth)/sign-in")({
	component: RouteComponent,
});

function RouteComponent() {
	const queryClient = useQueryClient();
	const navigate = Route.useNavigate();
	const {
		handleSubmit,
		control,
		setError,
		formState: { errors },
		setValue,
	} = useForm({
		resolver: zodResolver(signInSchema),
		defaultValues: {
			email: "",
			password: "",
			rememberMe: false,
		},
	});

	const { mutateAsync: mergeCartOnSignIn } = useMutation({
		mutationKey: ["auth", "sign-in"],
		mutationFn: async () => {
			await $mergeCartOnSignIn({
				data: getGuestCart(),
			});
		},
	});

	const { mutate: signIn, isPending } = useMutation({
		mutationKey: ["auth", "sign-in"],
		mutationFn: async (data: SignInSchema) => {
			return await $signIn({ data });
		},
		onSuccess: async (data) => {
			// @ts-ignore
			const name = (data?.user?.name as string)?.split(" ")[0];
			await Promise.all([
				mergeCartOnSignIn(),
				queryClient.invalidateQueries({
					refetchType: "all",
				}),
			]);
			toast.success(`Signed in successfully! Welcome back, ${name}`);
			navigate({ to: "/" });
		},

		onError: (error) => setError("root", { message: error.message }),
	});

	const onSubmit = (data: SignInSchema) => {
		signIn(data);
	};

	// Test sign-in helpers (use the email as the password per request)
	const handleTestSignIn = (email: string) => {
		const data = {
			email,
			password: email,
			rememberMe: false,
		} satisfies SignInSchema;
		setValue("email", data.email);
		setValue("password", data.password);
		setValue("rememberMe", data.rememberMe);
		signIn(data);
	};

	return (
		<div className="w-full">
			<Link to="/">
				<Logo className="size-7" />
			</Link>
			<h1 className="mt-2 font-semibold  text-xl/10">Sign in</h1>
			<p className="text-muted-fg text-sm/6">
				Welcome back! Sign in to continue shopping, track orders, and manage
				your account.
			</p>
			{errors.root?.message ? (
				<Note intent="danger" className="mt-5">
					{errors.root.message}
				</Note>
			) : null}
			<form
				className={cn(
					"mt-6 grid w-full grid-cols-1 gap-6",
					errors.root?.message && "mt-5",
				)}
				onSubmit={handleSubmit(onSubmit)}
			>
				<Controller
					control={control}
					name="email"
					render={({ field, fieldState }) => (
						<TextField
							autoComplete="email"
							className="w-full"
							label="Email"
							type="email"
							{...field}
							isInvalid={fieldState.invalid}
							errorMessage={fieldState.error?.message}
						/>
					)}
				/>
				<Controller
					control={control}
					name="password"
					render={({ field, fieldState }) => (
						<TextField
							className="w-full"
							label="Password"
							autoComplete="current-password"
							{...field}
							type="password"
							isRevealable
							isInvalid={fieldState.invalid}
							errorMessage={fieldState.error?.message}
						/>
					)}
				/>
				<div className="flex items-center justify-between">
					<Controller
						control={control}
						name="rememberMe"
						render={({ field: { value, ...field }, fieldState }) => (
							<Checkbox
								isSelected={value}
								isInvalid={fieldState.invalid}
								{...field}
							>
								Remember Me
							</Checkbox>
						)}
					/>
					<Link
						to="/forgot-password"
						className="text-sm/6 font-medium text-primary-subtle-fg hover:underline"
					>
						Forgot Password?
					</Link>
				</div>
				<Button type="submit" isPending={isPending}>
					{isPending && <Loader />}
					Sign in
				</Button>
				<div className="flex flex-col sm:flex-row gap-3 mt-2">
					<Button
						type="button"
						intent="plain"
						className="flex-1"
						onPress={() => handleTestSignIn("onabiyiolamide13@gmail.com")}
					>
						Test login as admin
					</Button>
					<Button
						type="button"
						intent="plain"
						className="flex-1"
						onPress={() => handleTestSignIn("lionelmessi@gmail.com")}
					>
						Test login as user
					</Button>
				</div>
			</form>
			<hr className="mt-8 mb-6 w-full border-border/50" />
			<p className="text-muted-fg text-sm/6">
				Don't have an account?{" "}
				<Link
					to="/sign-up"
					className="font-medium cursor-pointer text-primary-subtle-fg hover:underline"
				>
					Sign up
				</Link>
			</p>
		</div>
	);
}
