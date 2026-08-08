import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../shared/components/Button";
import { Field } from "../../shared/components/Field";
import { ApiError } from "../../shared/api/client";
import { AuthShell } from "./AuthShell";
import { loginFormSchema, type LoginFormInput } from "./auth-form.schema";
import { useAuth } from "./AuthProvider";

export function LoginPage() {
  const { signin } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<LoginFormInput>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(input: LoginFormInput) {
    setFormError(null);
    try {
      await signin(input);
      navigate("/app", { replace: true });
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Unable to sign in.");
    }
  }

  return (
    <AuthShell title="Sign in" subtitle="Open your career workspace.">
      <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Email" type="email" autoComplete="email" error={form.formState.errors.email?.message} {...form.register("email")} />
        <Field label="Password" type="password" autoComplete="current-password" error={form.formState.errors.password?.message} {...form.register("password")} />
        {formError ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p> : null}
        <Button type="submit" icon={<LogIn size={18} />} disabled={form.formState.isSubmitting}>
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-sm text-stone-600">
        New here?{" "}
        <Link className="font-medium text-teal-800 hover:text-teal-950" to="/signup">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

