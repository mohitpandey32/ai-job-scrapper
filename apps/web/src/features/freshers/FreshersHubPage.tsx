import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  FileText,
  MapPin,
  RadioTower,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../app/layout/AppLayout";
import { searchJobs, getJobFacets, type JobListItem, type JobsSearchParams } from "../../shared/api/jobs.api";
import { Button } from "../../shared/components/Button";
import { EmptyState } from "../../shared/components/EmptyState";
import { cleanDescription, formatExperience, formatFreshness } from "../../shared/utils/job-formatters";

const baseEarlyCareerParams = {
  careerStage: "early",
  sortBy: "early_career",
  page: 1,
} satisfies JobsSearchParams;

export function FreshersHubPage() {
  const facetsQuery = useQuery({
    queryKey: ["freshers-hub", "facets"],
    queryFn: getJobFacets,
  });
  const bestQuery = useQuery({
    queryKey: ["freshers-hub", "best"],
    queryFn: () => searchJobs({ ...baseEarlyCareerParams, earlyCareerFilter: "all", limit: 8 }),
  });
  const internshipsQuery = useQuery({
    queryKey: ["freshers-hub", "internships"],
    queryFn: () => searchJobs({ ...baseEarlyCareerParams, earlyCareerFilter: "internships", limit: 4 }),
  });
  const fresherQuery = useQuery({
    queryKey: ["freshers-hub", "fresher"],
    queryFn: () => searchJobs({ ...baseEarlyCareerParams, earlyCareerFilter: "fresher", limit: 4 }),
  });
  const remoteInternshipsQuery = useQuery({
    queryKey: ["freshers-hub", "remote-internships"],
    queryFn: () => searchJobs({ ...baseEarlyCareerParams, earlyCareerFilter: "remote_internships", limit: 4 }),
  });

  const stats = facetsQuery.data?.careerStages;

  return (
    <>
      <PageHeader
        title="Freshers Hub"
        body="A focused workspace for internships, fresher roles, and 0-1 year openings."
        action={
          <Link to="/app/jobs?careerStage=early&sortBy=early_career">
            <Button icon={<ArrowRight size={18} />}>Browse all</Button>
          </Link>
        }
      />

      <section className="rounded-md border border-stone-200 bg-white px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-normal text-teal-800">Priority pool</p>
            <h2 className="mt-1 text-lg font-semibold text-stone-950">Early-career jobs available now</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:min-w-[520px]">
            <Metric label="All early jobs" value={stats?.earlyCareer ?? 0} loading={facetsQuery.isLoading} />
            <Metric label="Strong matches" value={stats?.strongEarlyCareer ?? 0} loading={facetsQuery.isLoading} />
            <Metric label="Internships" value={stats?.internships ?? 0} loading={facetsQuery.isLoading} />
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <JobLane
          title="Best fresher matches"
          body="Sorted using fresher, internship, entry-level, and 0-1 year signals."
          jobs={bestQuery.data?.items ?? []}
          loading={bestQuery.isLoading}
          empty="No fresher jobs are available right now."
          to="/app/jobs?careerStage=early&earlyCareerFilter=all&sortBy=early_career"
        />

        <aside className="grid content-start gap-4">
          <section className="rounded-md border border-stone-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-stone-950">Next actions</h2>
            <div className="mt-3 grid gap-1">
              <ActionLink icon={<FileText size={17} />} title="Upload resume" to="/app/resume" />
              <ActionLink icon={<Sparkles size={17} />} title="View recommendations" to="/app/recommended" />
              <ActionLink
                icon={<RadioTower size={17} />}
                title="Remote internships"
                to="/app/jobs?careerStage=early&earlyCareerFilter=remote_internships&sortBy=early_career"
              />
            </div>
          </section>

          <section className="rounded-md border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-stone-950">Quick categories</h2>
              <BadgeCheck className="text-teal-700" size={18} />
            </div>
            <div className="mt-4 grid gap-5">
              <CompactLane
                title="Internships"
                jobs={internshipsQuery.data?.items ?? []}
                loading={internshipsQuery.isLoading}
                empty="No internships right now."
                to="/app/jobs?careerStage=early&earlyCareerFilter=internships&sortBy=early_career"
              />
              <CompactLane
                title="Fresher roles"
                jobs={fresherQuery.data?.items ?? []}
                loading={fresherQuery.isLoading}
                empty="No fresher roles right now."
                to="/app/jobs?careerStage=early&earlyCareerFilter=fresher&sortBy=early_career"
              />
              <CompactLane
                title="Remote internships"
                jobs={remoteInternshipsQuery.data?.items ?? []}
                loading={remoteInternshipsQuery.isLoading}
                empty="No remote internships right now."
                to="/app/jobs?careerStage=early&earlyCareerFilter=remote_internships&sortBy=early_career"
              />
            </div>
          </section>
        </aside>
      </section>
    </>
  );
}

function Metric({
  label,
  value,
  loading,
}: {
  readonly label: string;
  readonly value: number;
  readonly loading: boolean;
}) {
  return (
    <div className="border-stone-200 sm:border-l sm:pl-4">
      <p className="text-2xl font-semibold text-stone-950">{loading ? "--" : value}</p>
      <p className="mt-1 text-sm text-stone-600">{label}</p>
    </div>
  );
}

function ActionLink({
  icon,
  title,
  to,
}: {
  readonly icon: ReactNode;
  readonly title: string;
  readonly to: string;
}) {
  return (
    <Link className="focus-ring group flex min-h-11 items-center justify-between gap-3 rounded-md px-2 py-2 text-sm transition hover:bg-stone-100" to={to}>
      <span className="inline-flex items-center gap-3 font-medium text-stone-800">
        <span className="grid size-8 place-items-center rounded-md bg-stone-100 text-teal-800 group-hover:bg-white">{icon}</span>
        {title}
      </span>
      <ArrowRight className="shrink-0 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-teal-800" size={15} />
    </Link>
  );
}

function JobLane({
  title,
  body,
  jobs,
  loading,
  empty,
  to,
}: {
  readonly title: string;
  readonly body: string;
  readonly jobs: JobListItem[];
  readonly loading: boolean;
  readonly empty: string;
  readonly to: string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-950">{title}</h2>
          <p className="mt-1 text-sm text-stone-600">{body}</p>
        </div>
        <Link className="focus-ring shrink-0 rounded text-sm font-semibold text-teal-800 hover:text-teal-950" to={to}>
          View all
        </Link>
      </div>
      {loading ? (
        <div className="rounded-md border border-stone-200 bg-white p-5 text-sm text-stone-600">Loading jobs</div>
      ) : jobs.length ? (
        <div className="overflow-hidden rounded-md border border-stone-200 bg-white">
          {jobs.map((job) => (
            <FreshersJobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <EmptyState title={empty} body="Run ingestion again or try the all jobs view." />
      )}
    </section>
  );
}

function CompactLane({
  title,
  jobs,
  loading,
  empty,
  to,
}: {
  readonly title: string;
  readonly jobs: JobListItem[];
  readonly loading: boolean;
  readonly empty: string;
  readonly to: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
        <Link className="focus-ring rounded text-xs font-semibold text-teal-800 hover:text-teal-950" to={to}>
          View
        </Link>
      </div>
      {loading ? (
        <p className="text-sm text-stone-500">Loading</p>
      ) : jobs.length ? (
        <div className="grid gap-2">
          {jobs.slice(0, 3).map((job) => (
            <Link key={job.id} className="focus-ring rounded-md border border-stone-200 px-3 py-2 transition hover:border-teal-200 hover:bg-teal-50/40" to={`/app/jobs/${job.id}`}>
              <span className="line-clamp-1 text-sm font-medium text-stone-950">{job.title}</span>
              <span className="mt-1 block line-clamp-1 text-xs text-stone-500">{job.company.name}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-stone-500">{empty}</p>
      )}
    </div>
  );
}

function FreshersJobCard({ job }: { readonly job: JobListItem }) {
  const location = [job.locationCity, job.locationState].filter(Boolean).join(", ") || job.country;
  const description = cleanDescription(job.description);
  const badges = getCareerBadges(job);

  return (
    <article className="border-b border-stone-200 p-4 transition last:border-b-0 hover:bg-stone-50/70">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link className="focus-ring rounded text-base font-semibold text-stone-950 hover:text-teal-800" to={`/app/jobs/${job.id}`}>
            {job.title}
          </Link>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-stone-600">
            <span className="inline-flex items-center gap-1.5">
              <Building2 size={15} />
              {job.company.name}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} />
              {location}
            </span>
          </div>
        </div>
        <Link className="focus-ring inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-800 hover:bg-white" to={`/app/jobs/${job.id}`}>
          Details
          <ArrowRight size={15} />
        </Link>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-600">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
        {badges.map((badge) => (
          <span key={badge.label} className={`rounded-full px-2.5 py-1 ${badge.className}`}>
            {badge.label}
          </span>
        ))}
        {job.isRemote ? <span className="rounded-full bg-teal-50 px-2.5 py-1 text-teal-800">Remote</span> : null}
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-700">{formatExperience(job.experienceLevel)}</span>
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-700">{formatFreshness(job.lastSeenAt)}</span>
      </div>
    </article>
  );
}

function getCareerBadges(job: JobListItem) {
  const title = job.title.toLowerCase();
  const badges: Array<{ label: string; className: string }> = [];

  if (job.employmentType === "INTERNSHIP" || /\b(intern|apprentice|industrial trainee)\b/.test(title)) {
    badges.push({ label: "Internship", className: "bg-emerald-50 text-emerald-800" });
  } else if (/\b(fresher|trainee|new grad|graduate engineer|entry level|associate software engineer|software engineer i|sde i)\b/.test(title)) {
    badges.push({ label: "Fresher", className: "bg-teal-50 text-teal-800" });
  } else if (job.experienceLevel === "ENTRY") {
    badges.push({ label: "Entry level", className: "bg-cyan-50 text-cyan-800" });
  } else if (job.experienceLevel === "JUNIOR") {
    badges.push({ label: "Junior", className: "bg-indigo-50 text-indigo-800" });
  }

  if (Number(job.minExperience ?? 99) <= 1 || Number(job.maxExperience ?? 99) <= 1) {
    badges.push({ label: "0-1 yr", className: "bg-lime-50 text-lime-800" });
  }

  if (job.earlyCareerQuality?.label === "STRONG") {
    badges.push({ label: "Strong match", className: "bg-amber-50 text-amber-800" });
  }

  return badges.slice(0, 3);
}
