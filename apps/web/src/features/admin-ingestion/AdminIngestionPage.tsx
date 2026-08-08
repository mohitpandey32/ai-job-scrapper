import { type FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, Plus, ShieldCheck } from "lucide-react";
import { PageHeader } from "../../app/layout/AppLayout";
import {
  createIngestionSource,
  getIngestionStats,
  listIngestionErrors,
  listIngestionRuns,
  listIngestionSources,
  triggerIngestionRun,
  type CreateIngestionSourceInput,
  type TriggerIngestionRunResponse,
} from "../../shared/api/admin-ingestion.api";
import { Button } from "../../shared/components/Button";
import { Field } from "../../shared/components/Field";

const initialForm: CreateIngestionSourceInput = {
  companyName: "",
  companyWebsite: "",
  industry: "",
  headquarters: "",
  sourceType: "LEVER",
  sourceUrl: "",
  crawlFrequencyMinutes: 720,
  maxRequestsPerHour: 12,
  notes: "",
};

export function AdminIngestionPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateIngestionSourceInput>(initialForm);
  const sourcesQuery = useQuery({ queryKey: ["admin", "sources"], queryFn: listIngestionSources });
  const runsQuery = useQuery({ queryKey: ["admin", "runs"], queryFn: listIngestionRuns });
  const errorsQuery = useQuery({ queryKey: ["admin", "errors"], queryFn: listIngestionErrors });
  const statsQuery = useQuery({ queryKey: ["admin", "stats"], queryFn: getIngestionStats });
  const createSourceMutation = useMutation({
    mutationFn: createIngestionSource,
    onSuccess: async () => {
      setForm(initialForm);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
  const triggerRunMutation = useMutation({
    mutationFn: triggerIngestionRun,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      await queryClient.invalidateQueries({ queryKey: ["jobs"] });
      await queryClient.invalidateQueries({ queryKey: ["job-facets"] });
    },
  });

  const submitSource = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createSourceMutation.mutate(cleanSourceInput(form));
  };

  return (
    <>
      <PageHeader title="Ingestion" body="Review source health, recent runs, and crawler errors." />
      <section className="grid gap-4 lg:grid-cols-3">
        <Metric title="Sources" value={sourcesQuery.data?.sources.length ?? 0} loading={sourcesQuery.isLoading} />
        <Metric title="Recent runs" value={runsQuery.data?.runs.length ?? 0} loading={runsQuery.isLoading} />
        <Metric title="Recent errors" value={errorsQuery.data?.errors.length ?? 0} loading={errorsQuery.isLoading} />
      </section>
      <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Active jobs" value={statsQuery.data?.activeJobs ?? 0} loading={statsQuery.isLoading} />
        <Metric title="Fresher/Intern" value={statsQuery.data?.earlyCareerJobs ?? 0} loading={statsQuery.isLoading} />
        <Metric title="Internships" value={statsQuery.data?.internshipJobs ?? 0} loading={statsQuery.isLoading} />
        <Metric title="Strong matches" value={statsQuery.data?.strongEarlyCareerJobs ?? 0} loading={statsQuery.isLoading} />
        <Metric title="Weak matches" value={statsQuery.data?.weakEarlyCareerJobs ?? 0} loading={statsQuery.isLoading} />
        <Metric title="Expired jobs" value={statsQuery.data?.expiredJobs ?? 0} loading={statsQuery.isLoading} />
        <Metric title="Seen today" value={statsQuery.data?.activeJobsSeenToday ?? 0} loading={statsQuery.isLoading} />
        <Metric title="Stale risk" value={statsQuery.data?.activeJobsStaleRisk ?? 0} loading={statsQuery.isLoading} />
      </section>
      <section className="mt-5 rounded-md border border-stone-200 bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-stone-950">Manual ingestion</h2>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Fetch approved sources, validate official URLs, and refresh visible jobs.
            </p>
          </div>
          <Button
            icon={<Play size={17} />}
            onClick={() => triggerRunMutation.mutate()}
            disabled={triggerRunMutation.isPending}
          >
            {triggerRunMutation.isPending ? "Running..." : "Run now"}
          </Button>
        </div>
        {triggerRunMutation.isError ? (
          <p className="mt-3 text-sm font-medium text-red-700">
            Could not start ingestion. Another run may already be active.
          </p>
        ) : null}
        {triggerRunMutation.data ? <RunSummary result={triggerRunMutation.data} /> : null}
      </section>
      <section className="mt-5 rounded-md border border-stone-200 bg-white">
        <div className="flex items-center gap-2 border-b border-stone-200 px-4 py-3 text-sm font-semibold text-stone-950">
          <Plus size={17} />
          Add approved ATS source
        </div>
        <form className="grid gap-4 p-4 lg:grid-cols-2" onSubmit={submitSource}>
          <Field
            label="Company"
            value={form.companyName}
            onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))}
            required
            placeholder="Razorpay"
          />
          <Field
            label="Website"
            type="url"
            value={form.companyWebsite}
            onChange={(event) => setForm((current) => ({ ...current, companyWebsite: event.target.value }))}
            placeholder="https://razorpay.com"
          />
          <label className="grid gap-2 text-sm font-medium text-stone-700">
            Source type
            <select
              className="h-11 rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none focus:border-stone-950"
              value={form.sourceType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  sourceType: event.target.value as CreateIngestionSourceInput["sourceType"],
                }))
              }
            >
              <option value="LEVER">Lever</option>
              <option value="GREENHOUSE">Greenhouse</option>
              <option value="ASHBY">Ashby</option>
            </select>
          </label>
          <Field
            label="Source URL"
            type="url"
            value={form.sourceUrl}
            onChange={(event) => setForm((current) => ({ ...current, sourceUrl: event.target.value }))}
            required
            placeholder="https://api.lever.co/v0/postings/company?mode=json"
          />
          <Field
            label="Industry"
            value={form.industry}
            onChange={(event) => setForm((current) => ({ ...current, industry: event.target.value }))}
            placeholder="Fintech"
          />
          <Field
            label="Headquarters"
            value={form.headquarters}
            onChange={(event) => setForm((current) => ({ ...current, headquarters: event.target.value }))}
            placeholder="Bengaluru, Karnataka"
          />
          <Field
            label="Refresh minutes"
            type="number"
            min={60}
            max={10080}
            value={form.crawlFrequencyMinutes}
            onChange={(event) =>
              setForm((current) => ({ ...current, crawlFrequencyMinutes: Number(event.target.value) }))
            }
            required
          />
          <Field
            label="Requests per hour"
            type="number"
            min={1}
            max={120}
            value={form.maxRequestsPerHour}
            onChange={(event) => setForm((current) => ({ ...current, maxRequestsPerHour: Number(event.target.value) }))}
            required
          />
          <label className="grid gap-2 text-sm font-medium text-stone-700 lg:col-span-2">
            Notes
            <textarea
              className="min-h-20 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-950 outline-none focus:border-stone-950"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Terms reviewed, public ATS API, no login required."
            />
          </label>
          <div className="flex items-center gap-3 lg:col-span-2">
            <Button type="submit" disabled={createSourceMutation.isPending}>
              {createSourceMutation.isPending ? "Adding..." : "Add source"}
            </Button>
            {createSourceMutation.isError ? (
              <p className="text-sm font-medium text-red-700">Could not add source. Check the URL and try again.</p>
            ) : null}
            {createSourceMutation.isSuccess ? (
              <p className="text-sm font-medium text-emerald-700">Source added for the next ingestion run.</p>
            ) : null}
          </div>
        </form>
      </section>
      <section className="mt-5 rounded-md border border-stone-200 bg-white">
        <div className="flex items-center gap-2 border-b border-stone-200 px-4 py-3 text-sm font-semibold text-stone-950">
          <ShieldCheck size={17} />
          Source policy view
        </div>
        <pre className="max-h-[480px] overflow-auto p-4 text-xs leading-5 text-stone-700">
          {JSON.stringify(
            {
              sources: sourcesQuery.data?.sources ?? [],
              runs: runsQuery.data?.runs ?? [],
              errors: errorsQuery.data?.errors ?? [],
            },
            null,
            2,
          )}
        </pre>
      </section>
    </>
  );
}

function RunSummary({ result }: { readonly result: TriggerIngestionRunResponse }) {
  const items = [
    ["Sources", `${result.summary.sourcesIngested}/${result.summary.sourcesChecked}`],
    ["Fetched", result.summary.jobsFetched],
    ["Created", result.summary.jobsCreated],
    ["Updated", result.summary.jobsUpdated],
    ["Expired", result.summary.jobsExpired],
    ["Skipped", result.summary.jobsSkipped],
    ["Invalid URLs", result.summary.invalidUrlsSkipped],
    ["Failures", result.summary.failures],
  ];

  return (
    <div className="mt-4 border-t border-stone-200 pt-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-md bg-stone-50 px-3 py-2">
            <p className="text-xs font-medium uppercase text-stone-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-stone-950">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-stone-500">
        Finished {new Date(result.finishedAt).toLocaleString()}
      </p>
    </div>
  );
}

function cleanSourceInput(input: CreateIngestionSourceInput): CreateIngestionSourceInput {
  return {
    ...input,
    companyWebsite: input.companyWebsite?.trim() || undefined,
    industry: input.industry?.trim() || undefined,
    headquarters: input.headquarters?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
  };
}

function Metric({ title, value, loading }: { readonly title: string; readonly value: number; readonly loading: boolean }) {
  return (
    <div className="rounded-md border border-stone-200 bg-white p-4">
      <p className="text-sm font-medium text-stone-600">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-stone-950">{loading ? "..." : value}</p>
    </div>
  );
}
