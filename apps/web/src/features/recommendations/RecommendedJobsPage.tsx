import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BriefcaseBusiness, Building2, CalendarClock, ExternalLink, FileText, MapPin, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../app/layout/AppLayout";
import { getJobRecommendations, type JobRecommendation } from "../../shared/api/recommendations.api";
import { Button } from "../../shared/components/Button";
import { EmptyState } from "../../shared/components/EmptyState";
import { cleanDescription, formatExperience, formatFreshness, formatDateTime } from "../../shared/utils/job-formatters";

export function RecommendedJobsPage() {
  const recommendationsQuery = useQuery({
    queryKey: ["recommendations", "jobs"],
    queryFn: () => getJobRecommendations(20),
    retry: false,
  });

  const isResumeMissing = recommendationsQuery.error && "status" in recommendationsQuery.error && recommendationsQuery.error.status === 409;

  return (
    <>
      <PageHeader title="Recommended jobs" body="Jobs ranked against your latest resume analysis, with clear match reasons and skill gaps." />

      {recommendationsQuery.isLoading ? (
        <div className="rounded-md border border-stone-200 bg-white p-6 text-sm text-stone-600">Ranking jobs against your resume</div>
      ) : isResumeMissing ? (
        <EmptyState
          title="Upload your resume first"
          body="Recommendations need a completed resume analysis so we can compare your skills with job requirements."
          action={
            <Link to="/app/resume">
              <Button icon={<FileText size={18} />}>Go to resume</Button>
            </Link>
          }
        />
      ) : recommendationsQuery.error ? (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          Could not load recommendations.
        </div>
      ) : recommendationsQuery.data?.recommendations.length ? (
        <section className="grid gap-4">
          <div className="flex flex-col gap-2 rounded-md border border-stone-200 bg-white p-4 text-sm text-stone-600 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Ranked from <span className="font-medium text-stone-950">{recommendationsQuery.data.resume.fileName}</span>
            </span>
            <span>Analyzed {formatDateTime(recommendationsQuery.data.resume.analyzedAt)}</span>
          </div>
          {recommendationsQuery.data.recommendations.map((recommendation) => (
            <RecommendedJobCard key={recommendation.job.id} recommendation={recommendation} />
          ))}
        </section>
      ) : (
        <EmptyState title="No recommendations yet" body="Try running job ingestion or uploading a resume with clearer target skills." action={<Sparkles size={20} className="text-teal-700" />} />
      )}
    </>
  );
}

function RecommendedJobCard({ recommendation }: { readonly recommendation: JobRecommendation }) {
  const { job } = recommendation;
  const location = [job.locationCity, job.locationState].filter(Boolean).join(", ") || job.country;
  const description = cleanDescription(job.description);

  return (
    <article className="rounded-md border border-stone-200 bg-white p-4 transition hover:border-stone-300">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-800">
            <Sparkles size={15} />
            {recommendation.matchScore}% match
          </div>
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
              {formatFreshness(job.lastSeenAt)}
            </span>
          </div>
        </div>
        <Link className="focus-ring inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-800 hover:bg-stone-100" to={`/app/jobs/${job.id}`}>
          Details
          <ExternalLink size={15} />
        </Link>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-600">{description}</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SkillGroup title="Matched skills" items={recommendation.matchedSkills} tone="positive" emptyText="No direct skill overlap detected." />
        <SkillGroup title="Missing skills" items={recommendation.missingSkills} tone="warning" emptyText="No clear missing skills detected." />
      </div>

      <ul className="mt-4 grid gap-2 border-t border-stone-100 pt-4 text-sm text-stone-600">
        {recommendation.reasons.map((reason) => (
          <li key={reason} className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-teal-600" />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function SkillGroup({ title, items, tone, emptyText }: { readonly title: string; readonly items: readonly string[]; readonly tone: "positive" | "warning"; readonly emptyText: string }) {
  const className = tone === "positive" ? "bg-teal-50 text-teal-800" : "bg-amber-50 text-amber-900";

  return (
    <div>
      <h3 className="text-sm font-semibold text-stone-950">{title}</h3>
      {items.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {items.map((item) => (
            <span key={item} className={`rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-stone-600">{emptyText}</p>
      )}
    </div>
  );
}
