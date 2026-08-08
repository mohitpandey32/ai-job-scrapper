import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BriefcaseBusiness, Building2, CalendarClock, ChevronLeft, ChevronRight, ExternalLink, Filter, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../app/layout/AppLayout";
import { Button } from "../../shared/components/Button";
import { EmptyState } from "../../shared/components/EmptyState";
import { Field } from "../../shared/components/Field";
import { autocompleteJobs, getJobFacets, searchJobs, type JobListItem } from "../../shared/api/jobs.api";
import { cleanDescription, formatExperience, formatFreshness, formatSalary } from "../../shared/utils/job-formatters";

const experienceLevels = ["ENTRY", "JUNIOR", "MID", "SENIOR"];
const quickFilters = [
  { value: "all", label: "Best" },
  { value: "internships", label: "Internships" },
  { value: "fresher", label: "Fresher" },
  { value: "zero_one", label: "0-1 yr" },
  { value: "remote_internships", label: "Remote intern" },
] as const;
type EarlyCareerFilter = (typeof quickFilters)[number]["value"];
const sortOptions = ["early_career", "newest", "salary_high", "salary_low", "company"] as const;
type JobSort = (typeof sortOptions)[number];
const pageSize = 5;

export function JobsPage() {
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get("q") ?? "");
  const [location, setLocation] = useState(searchParams.get("location") ?? "");
  const [remote, setRemote] = useState(searchParams.get("remote") === "true");
  const [hybrid, setHybrid] = useState(searchParams.get("hybrid") === "true");
  const [careerStage, setCareerStage] = useState<"early" | "all">(readCareerStage(searchParams.get("careerStage")));
  const [earlyCareerFilter, setEarlyCareerFilter] = useState<EarlyCareerFilter>(readEarlyCareerFilter(searchParams.get("earlyCareerFilter")));
  const [experienceLevel, setExperienceLevel] = useState(searchParams.get("experienceLevel") ?? "");
  const [sortBy, setSortBy] = useState<JobSort>(readSort(searchParams.get("sortBy")));
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      q: keyword,
      location,
      remote,
      hybrid,
      careerStage,
      earlyCareerFilter,
      experienceLevel,
      sortBy,
      page,
      limit: pageSize,
    }),
    [careerStage, earlyCareerFilter, experienceLevel, hybrid, keyword, location, page, remote, sortBy],
  );
  const jobsQuery = useQuery({
    queryKey: ["jobs", params],
    queryFn: () => searchJobs(params),
  });
  const facetsQuery = useQuery({
    queryKey: ["job-facets"],
    queryFn: getJobFacets,
  });
  const autocompleteQuery = useQuery({
    queryKey: ["jobs-autocomplete", keyword],
    queryFn: () => autocompleteJobs(keyword),
    enabled: keyword.trim().length >= 2,
  });

  function resetToFirstPage(action: () => void) {
    action();
    setPage(1);
  }

  return (
    <>
      <PageHeader title="Jobs" body="Fresher and internship opportunities are prioritized by default." />
      <section className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-md border border-stone-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-950">
            <Filter size={17} />
            Filters
          </div>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-stone-800">
              Career stage
              <select className="focus-ring h-10 rounded-md border border-stone-300 bg-white px-3" value={careerStage} onChange={(event) => resetToFirstPage(() => setCareerStage(event.target.value as "early" | "all"))}>
                <option value="early">
                  Fresher & internships ({facetsQuery.data?.careerStages.earlyCareer ?? 0}, strong {facetsQuery.data?.careerStages.strongEarlyCareer ?? 0})
                </option>
                <option value="all">All jobs</option>
              </select>
            </label>
            <div className="grid gap-2">
              <span className="text-sm font-medium text-stone-800">Quick filters</span>
              <div className="grid grid-cols-2 gap-2">
                {quickFilters.map((filter) => (
                  <button
                    key={filter.value}
                    className={`focus-ring min-h-9 rounded-md border px-2 text-xs font-semibold transition ${
                      earlyCareerFilter === filter.value
                        ? "border-teal-700 bg-teal-700 text-white"
                        : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                    }`}
                    type="button"
                    onClick={() => resetToFirstPage(() => setEarlyCareerFilter(filter.value))}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="grid gap-2 text-sm font-medium text-stone-800">
              Location
              <select className="focus-ring h-10 rounded-md border border-stone-300 bg-white px-3" value={location} onChange={(event) => resetToFirstPage(() => setLocation(event.target.value))}>
                <option value="">All India</option>
                {facetsQuery.data?.locations.filter((item) => item.value).map((item) => (
                  <option key={item.value} value={item.value ?? ""}>
                    {item.value} ({item.count})
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-800">
              Experience
              <select className="focus-ring h-10 rounded-md border border-stone-300 bg-white px-3" value={experienceLevel} onChange={(event) => resetToFirstPage(() => setExperienceLevel(event.target.value))}>
                <option value="">Any level</option>
                {experienceLevels.map((item) => (
                  <option key={item} value={item}>
                    {formatExperience(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex h-9 items-center gap-2 text-sm text-stone-700">
              <input className="size-4 accent-teal-700" checked={remote} type="checkbox" onChange={(event) => resetToFirstPage(() => setRemote(event.target.checked))} />
              Remote ({facetsQuery.data?.workModes.remote ?? 0})
            </label>
            <label className="flex h-9 items-center gap-2 text-sm text-stone-700">
              <input className="size-4 accent-teal-700" checked={hybrid} type="checkbox" onChange={(event) => resetToFirstPage(() => setHybrid(event.target.checked))} />
              Hybrid ({facetsQuery.data?.workModes.hybrid ?? 0})
            </label>
          </div>
        </aside>
        <section>
          <div className="mb-4 grid gap-3 xl:grid-cols-[1fr_220px_auto]">
            <div className="relative">
              <Field className="h-11" label="Keyword" placeholder="Role, skill, or company" value={keyword} onChange={(event) => resetToFirstPage(() => setKeyword(event.target.value))} />
              {autocompleteQuery.data?.suggestions.length ? (
                <div className="absolute left-0 right-0 top-[74px] z-10 rounded-md border border-stone-200 bg-white p-2 shadow-lg">
                  {autocompleteQuery.data.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      className="focus-ring block w-full rounded px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-100"
                      type="button"
                      onClick={() => resetToFirstPage(() => setKeyword(suggestion))}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <label className="grid gap-2 text-sm font-medium text-stone-800">
              Sort
              <select className="focus-ring h-11 rounded-md border border-stone-300 bg-white px-3" value={sortBy} onChange={(event) => resetToFirstPage(() => setSortBy(event.target.value as JobSort))}>
                <option value="early_career">Fresher first</option>
                <option value="newest">Newest</option>
                <option value="salary_high">Salary high to low</option>
                <option value="salary_low">Salary low to high</option>
                <option value="company">Company A-Z</option>
              </select>
            </label>
            <Button className="mt-7" icon={<Search size={18} />} onClick={() => void jobsQuery.refetch()}>
              Search
            </Button>
          </div>
          {jobsQuery.isLoading ? (
            <div className="rounded-md border border-stone-200 bg-white p-6 text-sm text-stone-600">Loading jobs</div>
          ) : jobsQuery.data?.items.length ? (
            <div className="grid gap-3">
              <div className="flex flex-col gap-2 text-sm text-stone-600 sm:flex-row sm:items-center sm:justify-between">
                <span>{jobsQuery.data.pagination.total} jobs found</span>
                <span className="inline-flex items-center gap-2">
                  <SlidersHorizontal size={15} />
                  Page {jobsQuery.data.pagination.page} of {jobsQuery.data.pagination.totalPages || 1}
                </span>
              </div>
              {jobsQuery.data.items.map((job) => (
                <JobResult key={job.id} job={job} />
              ))}
              <Pagination
                page={page}
                totalPages={jobsQuery.data.pagination.totalPages}
                onPrevious={() => setPage((current) => Math.max(1, current - 1))}
                onNext={() => setPage((current) => Math.min(jobsQuery.data?.pagination.totalPages ?? current, current + 1))}
              />
            </div>
          ) : (
            <EmptyState title="No jobs found" body="Try a broader keyword or remove one of the filters." />
          )}
        </section>
      </section>
    </>
  );
}

function readCareerStage(value: string | null): "early" | "all" {
  return value === "all" ? "all" : "early";
}

function readEarlyCareerFilter(value: string | null): EarlyCareerFilter {
  return quickFilters.some((filter) => filter.value === value) ? (value as EarlyCareerFilter) : "all";
}

function readSort(value: string | null): JobSort {
  return sortOptions.some((option) => option === value) ? (value as JobSort) : "early_career";
}

function Pagination({
  page,
  totalPages,
  onPrevious,
  onNext,
}: {
  readonly page: number;
  readonly totalPages: number;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-2 flex items-center justify-end gap-2">
      <Button variant="secondary" icon={<ChevronLeft size={17} />} disabled={page <= 1} onClick={onPrevious}>
        Previous
      </Button>
      <Button variant="secondary" icon={<ChevronRight size={17} />} disabled={page >= totalPages} onClick={onNext}>
        Next
      </Button>
    </div>
  );
}

function JobResult({ job }: { readonly job: JobListItem }) {
  const location = [job.locationCity, job.locationState].filter(Boolean).join(", ") || job.country;
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const description = cleanDescription(job.description);
  const freshness = formatFreshness(job.lastSeenAt);
  const badges = getCareerBadges(job);

  return (
    <article className="rounded-md border border-stone-200 bg-white p-4 transition hover:border-stone-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link className="focus-ring inline-block rounded text-lg font-semibold text-stone-950 hover:text-teal-800" to={`/app/jobs/${job.id}`}>
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
            <span className="inline-flex items-center gap-1.5">
              <BriefcaseBusiness size={15} />
              {formatExperience(job.experienceLevel)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock size={15} />
              {freshness}
            </span>
          </div>
        </div>
        <Link className="focus-ring inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-800 hover:bg-stone-100" to={`/app/jobs/${job.id}`}>
          Details
          <ExternalLink size={15} />
        </Link>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-600">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
        {badges.map((badge) => (
          <span key={badge.label} className={`rounded-full px-2.5 py-1 ${badge.className}`}>{badge.label}</span>
        ))}
        {job.isRemote ? <span className="rounded-full bg-teal-50 px-2.5 py-1 text-teal-800">Remote</span> : null}
        {job.isHybrid ? <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-800">Hybrid</span> : null}
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-700">{job.employmentType.replaceAll("_", " ")}</span>
        {salary ? <span className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-700">{salary}</span> : null}
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
