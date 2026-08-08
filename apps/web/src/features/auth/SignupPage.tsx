import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../../shared/api/client";
import { Button } from "../../shared/components/Button";
import { Field } from "../../shared/components/Field";
import { AuthShell } from "./AuthShell";
import { signupFormSchema, type SignupFormInput } from "./auth-form.schema";
import { useAuth } from "./AuthProvider";

export function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<SignupFormInput>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { email: "", password: "", fullName: "" },
  });

  async function onSubmit(input: SignupFormInput) {
    setFormError(null);
    try {
      await register(input);
      navigate("/app", { replace: true });
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Unable to create account.");
    }
  }

  return (
    <AuthShell title="Create account" subtitle="Start with a profile you can improve over time.">
      <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Full name" autoComplete="name" error={form.formState.errors.fullName?.message} {...form.register("fullName")} />
        <Field label="Email" type="email" autoComplete="email" error={form.formState.errors.email?.message} {...form.register("email")} />
        <Field label="Password" type="password" autoComplete="new-password" error={form.formState.errors.password?.message} {...form.register("password")} />
        {formError ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p> : null}
        <Button type="submit" icon={<UserPlus size={18} />} disabled={form.formState.isSubmitting}>
          Create account
        </Button>
      </form>
      <p className="mt-6 text-sm text-stone-600">
        Already registered?{" "}
        <Link className="font-medium text-teal-800 hover:text-teal-950" to="/login">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

