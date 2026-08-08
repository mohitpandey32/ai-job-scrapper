import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bookmark, BookmarkCheck, BriefcaseBusiness, Building2, CalendarClock, Check, Clipboard, ExternalLink, FileText, MapPin, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../../app/layout/AppLayout";
import { ApiError } from "../../shared/api/client";
import { downloadCoverLetterPdf, generateCoverLetter, getJobDetail, saveJob, unsaveJob, upsertApplication } from "../../shared/api/job-actions.api";
import { Button } from "../../shared/components/Button";
import { EmptyState } from "../../shared/components/EmptyState";
import { cleanDescription, formatExperience, formatFreshness, formatSalary } from "../../shared/utils/job-formatters";

export function JobDetailsPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const jobQuery = useQuery({
    queryKey: ["job-detail", id],
    queryFn: () => getJobDetail(id ?? ""),
    enabled: Boolean(id),
  });

  const saveMutation = useMutation({
    mutationFn: () => saveJob(id ?? ""),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["job-detail", id] });
      await queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: () => unsaveJob(id ?? ""),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["job-detail", id] });
      await queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
    },
  });

  const trackMutation = useMutation({
    mutationFn: () => upsertApplication({ jobId: id ?? "", status: "APPLIED", appliedAt: new Date().toISOString() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["job-detail", id] });
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  const coverLetterMutation = useMutation({
    mutationFn: () => generateCoverLetter(id ?? ""),
  });
  const pdfMutation = useMutation({
    mutationFn: async () => {
      const coverLetter = coverLetterMutation.data?.coverLetter;
      if (!coverLetter) throw new Error("Generate a cover letter first.");
      const result = await downloadCoverLetterPdf(id ?? "", {
        subjectLine: coverLetter.subjectLine,
        coverLetter: coverLetter.coverLetter,
      });
      triggerDownload(result.blob, result.fileName);
    },
  });

  if (jobQuery.isLoading) {
    return <div className="rounded-md border border-stone-200 bg-white p-6 text-sm text-stone-600">Loading job details</div>;
  }

  if (!jobQuery.data?.job) {
    return <EmptyState title="Job not found" body="This job may have expired or been removed." action={<Link to="/app/jobs"><Button icon={<ArrowLeft size={18} />}>Back to jobs</Button></Link>} />;
  }

  const job = jobQuery.data.job;
  const location = [job.locationCity, job.locationState].filter(Boolean).join(", ") || job.country;
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const description = cleanDescription(job.description);

  return (
    <>
      <PageHeader
        title={job.title}
        body={`${job.company.name} · ${location}`}
        action={
          <Link to="/app/jobs">
            <Button variant="secondary" icon={<ArrowLeft size={18} />}>Back</Button>
          </Link>
        }
      />
      <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <article className="rounded-md border border-stone-200 bg-white p-5">
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            {job.isRemote ? <span className="rounded-full bg-teal-50 px-2.5 py-1 text-teal-800">Remote</span> : null}
            {job.isHybrid ? <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-800">Hybrid</span> : null}
            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-700">{job.employmentType.replaceAll("_", " ")}</span>
            {salary ? <span className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-700">{salary}</span> : null}
          </div>
          <div className="mt-5 grid gap-3 text-sm text-stone-600 sm:grid-cols-2">
            <Meta icon={<Building2 size={16} />} label="Company" value={job.company.name} />
            <Meta icon={<MapPin size={16} />} label="Location" value={location} />
            <Meta icon={<BriefcaseBusiness size={16} />} label="Experience" value={formatExperience(job.experienceLevel)} />
            <Meta icon={<CalendarClock size={16} />} label="Freshness" value={formatFreshness(job.lastSeenAt)} />
          </div>
          <div className="mt-6">
            <h2 className="text-base font-semibold text-stone-950">Description</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-stone-600">{description}</p>
          </div>
        </article>

        <aside className="grid content-start gap-4">
          <div className="rounded-md border border-stone-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-stone-950">Actions</h2>
            <div className="mt-4 grid gap-3">
              <a className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-medium text-white hover:bg-teal-800" href={job.applyUrl} target="_blank" rel="noreferrer">
                Apply on company site
                <ExternalLink size={16} />
              </a>
              <Button
                variant="secondary"
                icon={job.userState.saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
                disabled={saveMutation.isPending || unsaveMutation.isPending}
                onClick={() => (job.userState.saved ? unsaveMutation.mutate() : saveMutation.mutate())}
              >
                {job.userState.saved ? "Unsave job" : "Save job"}
              </Button>
              <Button icon={<FileText size={17} />} disabled={trackMutation.isPending} onClick={() => trackMutation.mutate()}>
                {job.userState.application ? "Mark applied today" : "Track application"}
              </Button>
              <Button variant="secondary" icon={<Sparkles size={17} />} disabled={coverLetterMutation.isPending} onClick={() => coverLetterMutation.mutate()}>
                {coverLetterMutation.isPending ? "Generating" : "Generate cover letter"}
              </Button>
            </div>
            {job.userState.application ? (
              <div className="mt-4 rounded-md bg-stone-50 p-3 text-sm text-stone-600">
                Current status: <span className="font-semibold text-stone-950">{formatStatus(job.userState.application.status)}</span>
              </div>
            ) : null}
          </div>

          <div className="rounded-md border border-stone-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-stone-950">Skills</h2>
            {job.skills.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span key={skill.id} className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">{skill.name}</span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-stone-600">No structured skills detected yet.</p>
            )}
          </div>

          {coverLetterMutation.error ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {formatCoverLetterError(coverLetterMutation.error)}
              {coverLetterMutation.error instanceof ApiError && coverLetterMutation.error.code === "RESUME_ANALYSIS_REQUIRED" ? (
                <div className="mt-3">
                  <Link to="/app/resume">
                    <Button variant="secondary" icon={<FileText size={16} />}>Open resume</Button>
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}

          {coverLetterMutation.data?.coverLetter ? (
            <div className="rounded-md border border-stone-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-stone-950">Cover letter</h2>
                  <p className="mt-1 text-xs text-stone-500">{coverLetterMutation.data.coverLetter.fallbackUsed ? "Template fallback" : coverLetterMutation.data.coverLetter.modelName}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    icon={copied ? <Check size={16} /> : <Clipboard size={16} />}
                    onClick={async () => {
                      await navigator.clipboard.writeText(`${coverLetterMutation.data.coverLetter.subjectLine}\n\n${coverLetterMutation.data.coverLetter.coverLetter}`);
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 1600);
                    }}
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button variant="secondary" icon={<FileText size={16} />} disabled={pdfMutation.isPending} onClick={() => pdfMutation.mutate()}>
                    {pdfMutation.isPending ? "Preparing" : "Download PDF"}
                  </Button>
                </div>
              </div>
              {pdfMutation.error ? <p className="mt-3 text-sm text-red-700">Could not download PDF right now.</p> : null}
              <div className="mt-4 rounded-md bg-stone-50 p-3">
                <div className="text-xs font-medium text-stone-500">Subject</div>
                <div className="mt-1 text-sm font-semibold text-stone-950">{coverLetterMutation.data.coverLetter.subjectLine}</div>
              </div>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-stone-700">{coverLetterMutation.data.coverLetter.coverLetter}</p>
            </div>
          ) : null}
        </aside>
      </section>
    </>
  );
}

function Meta({ icon, label, value }: { readonly icon: React.ReactNode; readonly label: string; readonly value: string }) {
  return (
    <div className="flex gap-2 rounded-md border border-stone-200 bg-stone-50 p-3">
      <span className="mt-0.5 text-teal-700">{icon}</span>
      <span>
        <span className="block text-xs font-medium text-stone-500">{label}</span>
        <span className="mt-1 block font-medium text-stone-950">{value}</span>
      </span>
    </div>
  );
}

function formatStatus(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}

function formatCoverLetterError(error: unknown) {
  if (error instanceof ApiError && error.code === "RESUME_ANALYSIS_REQUIRED") {
    return "Upload and analyze your resume before generating a cover letter.";
  }

  return "Could not generate a cover letter right now.";
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
