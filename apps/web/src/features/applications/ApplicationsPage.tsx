import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, ExternalLink, FileText, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../app/layout/AppLayout";
import { listApplications, updateApplication, type ApplicationRecord, type ApplicationStatus } from "../../shared/api/job-actions.api";
import { EmptyState } from "../../shared/components/EmptyState";
import { cleanDescription, formatDateTime } from "../../shared/utils/job-formatters";

const columns: Array<{ readonly label: string; readonly value: ApplicationStatus }> = [
  { label: "Saved", value: "SAVED" },
  { label: "Applied", value: "APPLIED" },
  { label: "Interview", value: "INTERVIEW" },
  { label: "Assessment", value: "ASSESSMENT" },
  { label: "Offer", value: "OFFER" },
  { label: "Rejected", value: "REJECTED" },
];

export function ApplicationsPage() {
  const queryClient = useQueryClient();
  const applicationsQuery = useQuery({
    queryKey: ["applications"],
    queryFn: () => listApplications(),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { readonly id: string; readonly status: ApplicationStatus }) => updateApplication(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  const grouped = columns.map((column) => ({
    ...column,
    items: applicationsQuery.data?.items.filter((application) => application.status === column.value) ?? [],
  }));

  return (
    <>
      <PageHeader title="Applications" body="Move jobs through your application pipeline." />
      {applicationsQuery.isLoading ? (
        <div className="rounded-md border border-stone-200 bg-white p-6 text-sm text-stone-600">Loading applications</div>
      ) : applicationsQuery.data?.items.length ? (
      <section className="grid gap-3 overflow-x-auto lg:grid-cols-6">
        {columns.map((column) => (
          <div key={column.value} className="min-h-60 min-w-48 rounded-md border border-stone-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-stone-950">{column.label}</h2>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">{grouped.find((group) => group.value === column.value)?.items.length ?? 0}</span>
            </div>
            <div className="mt-3 grid gap-3">
              {(grouped.find((group) => group.value === column.value)?.items ?? []).map((application) => (
                <ApplicationCard key={application.id} application={application} disabled={updateMutation.isPending} onMove={(status) => updateMutation.mutate({ id: application.id, status })} />
              ))}
            </div>
          </div>
        ))}
      </section>
      ) : (
        <EmptyState title="No applications yet" body="Open a job detail page and track an application after applying." action={<FileText size={20} className="text-teal-700" />} />
      )}
    </>
  );
}

function ApplicationCard({ application, disabled, onMove }: { readonly application: ApplicationRecord; readonly disabled: boolean; readonly onMove: (status: ApplicationStatus) => void }) {
  const location = [application.job.locationCity, application.job.locationState].filter(Boolean).join(", ") || application.job.country;

  return (
    <article className="rounded-md border border-stone-200 bg-stone-50 p-3">
      <Link className="focus-ring line-clamp-2 rounded text-sm font-semibold text-stone-950 hover:text-teal-800" to={`/app/jobs/${application.job.id}`}>
        {application.job.title}
      </Link>
      <div className="mt-2 grid gap-1 text-xs text-stone-600">
        <span className="inline-flex items-center gap-1.5"><Building2 size={13} />{application.job.company.name}</span>
        <span className="inline-flex items-center gap-1.5"><MapPin size={13} />{location}</span>
        <span>Updated {formatDateTime(application.updatedAt)}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-stone-600">{cleanDescription(application.job.description)}</p>
      <div className="mt-3 flex items-center gap-2">
        <select className="focus-ring h-8 min-w-0 flex-1 rounded-md border border-stone-300 bg-white px-2 text-xs" disabled={disabled} value={application.status} onChange={(event) => onMove(event.target.value as ApplicationStatus)}>
          {columns.map((column) => (
            <option key={column.value} value={column.value}>{column.label}</option>
          ))}
        </select>
        <Link className="focus-ring inline-flex size-8 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-100" to={`/app/jobs/${application.job.id}`} aria-label="Open job">
          <ExternalLink size={14} />
        </Link>
      </div>
    </article>
  );
}
