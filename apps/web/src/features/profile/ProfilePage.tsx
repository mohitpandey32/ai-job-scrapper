import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { PageHeader } from "../../app/layout/AppLayout";
import { getProfile, updateProfile } from "../../shared/api/profile.api";
import { Button } from "../../shared/components/Button";
import { Field } from "../../shared/components/Field";

const profileSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  phone: z.string().trim().optional(),
  locationCity: z.string().trim().optional(),
  locationState: z.string().trim().optional(),
  targetRolesText: z.string().trim().optional(),
  experienceYears: z.string().trim().optional(),
  remotePreference: z.enum(["REMOTE", "HYBRID", "ONSITE", "ANY"]),
});

type ProfileFormInput = z.infer<typeof profileSchema>;

export function ProfilePage() {
  const queryClient = useQueryClient();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const form = useForm<ProfileFormInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      locationCity: "",
      locationState: "",
      targetRolesText: "",
      remotePreference: "ANY",
    },
  });

  useEffect(() => {
    const profile = profileQuery.data?.profile;
    if (!profile) return;

    form.reset({
      fullName: profile.fullName ?? "",
      phone: profile.phone ?? "",
      locationCity: profile.locationCity ?? "",
      locationState: profile.locationState ?? "",
      targetRolesText: Array.isArray(profile.targetRoles) ? profile.targetRoles.join(", ") : "",
      experienceYears: profile.experienceYears ? String(profile.experienceYears) : "",
      remotePreference: profile.remotePreference ?? "ANY",
    });
  }, [form, profileQuery.data]);

  const mutation = useMutation({
    mutationFn: (input: ProfileFormInput) =>
      updateProfile({
        fullName: input.fullName,
        phone: input.phone || undefined,
        locationCity: input.locationCity || undefined,
        locationState: input.locationState || undefined,
        targetRoles: input.targetRolesText
          ? input.targetRolesText.split(",").map((role) => role.trim()).filter(Boolean)
          : undefined,
        experienceYears: input.experienceYears ? Number(input.experienceYears) : undefined,
        remotePreference: input.remotePreference,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      setSavedMessage("Profile saved.");
    },
  });

  return (
    <>
      <PageHeader title="Profile" body="Keep your targeting data clear so recommendations can improve." />
      <form className="grid max-w-3xl gap-5 rounded-md border border-stone-200 bg-white p-5" onSubmit={form.handleSubmit((input) => mutation.mutate(input))}>
        <Field label="Full name" error={form.formState.errors.fullName?.message} {...form.register("fullName")} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Phone" error={form.formState.errors.phone?.message} {...form.register("phone")} />
          <Field label="Experience years" type="number" step="0.5" error={form.formState.errors.experienceYears?.message} {...form.register("experienceYears")} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="City" error={form.formState.errors.locationCity?.message} {...form.register("locationCity")} />
          <Field label="State" error={form.formState.errors.locationState?.message} {...form.register("locationState")} />
        </div>
        <Field label="Target roles" placeholder="Product Manager, Data Analyst, Sales Executive" {...form.register("targetRolesText")} />
        <label className="grid gap-2 text-sm font-medium text-stone-800">
          Work mode
          <select className="focus-ring h-11 rounded-md border border-stone-300 bg-white px-3" {...form.register("remotePreference")}>
            <option value="ANY">Any</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">On-site</option>
          </select>
        </label>
        <div className="flex items-center gap-3">
          <Button type="submit" icon={<Save size={18} />} disabled={mutation.isPending}>
            Save profile
          </Button>
          {savedMessage ? <p className="text-sm text-teal-800">{savedMessage}</p> : null}
        </div>
      </form>
    </>
  );
}
