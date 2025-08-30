import type { authClient } from "@/lib/auth-client";

export type Session = typeof authClient.$Infer.Session;

export type User = Session["user"];

export type StrictOmit<T, K extends keyof T> = Omit<T, K>;
