import type { authClient } from "@/lib/auth-client";

export type Session = typeof authClient.$Infer.Session;

export type User = Session["user"];
