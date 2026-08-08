import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Building2, ExternalLink, MapPin, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../app/layout/AppLayout";
import { listSavedJobs, unsaveJob } from "../../shared/api/job-actions.api";
import { Button } from "../../shared/components/Button";
import { EmptyState } from "../../shared/components/EmptyState";
import { cleanDescription, formatDateTime } from "../../shared/utils/job-formatters";

export function SavedJobsPage() {
  const queryClient = useQueryClient();
  const savedJobsQuery = useQuery({
    queryKey: ["saved-jobs"],
    queryFn: listSavedJobs,
  });
  const unsaveMutation = useMutation({
    mutationFn: unsaveJob,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
    },
  });

  return (
    <>
      <PageHeader title="Saved jobs" body="Keep promising opportunities separate from the search stream." />
      {savedJobsQuery.isLoading ? (
        <div className="rounded-md border border-stone-200 bg-white p-6 text-sm text-stone-600">Loading saved jobs</div>
      ) : savedJobsQuery.data?.items.length ? (
        <section className="grid gap-3">
          {savedJobsQuery.data.items.map((savedJob) => {
            const location = [savedJob.job.locationCity, savedJob.job.locationState].filter(Boolean).join(", ") || savedJob.job.country;

            return (
              <article key={savedJob.id} className="rounded-md border border-stone-200 bg-white p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Link className="focus-ring inline-block rounded text-lg font-semibold text-stone-950 hover:text-teal-800" to={`/app/jobs/${savedJob.job.id}`}>
                      {savedJob.job.title}
                    </Link>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-stone-600">
                      <span className="inline-flex items-center gap-1.5"><Building2 size={15} />{savedJob.job.company.name}</span>
                      <span className="inline-flex items-center gap-1.5"><MapPin size={15} />{location}</span>
                      <span>Saved {formatDateTime(savedJob.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link className="focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-800 hover:bg-stone-100" to={`/app/jobs/${savedJob.job.id}`}>
                      Details
                      <ExternalLink size={15} />
                    </Link>
                    <Button variant="secondary" icon={<Trash2 size={16} />} disabled={unsaveMutation.isPending} onClick={() => unsaveMutation.mutate(savedJob.job.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-600">{cleanDescription(savedJob.job.description)}</p>
              </article>
            );
          })}
        </section>
      ) : (
        <EmptyState title="No saved jobs yet" body="Open a job detail page and save promising opportunities for later." action={<Bookmark size={20} className="text-teal-700" />} />
      )}
    </>
  );
}
