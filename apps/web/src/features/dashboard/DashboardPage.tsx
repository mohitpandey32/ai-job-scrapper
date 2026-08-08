import { ArrowRight, BriefcaseBusiness, ClipboardList, FileText, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../shared/components/Button";
import { PageHeader } from "../../app/layout/AppLayout";

const metrics = [
  { label: "Active searches", value: "0", icon: Search },
  { label: "Saved jobs", value: "0", icon: BriefcaseBusiness },
  { label: "Applications", value: "0", icon: ClipboardList },
  { label: "Resume analyses", value: "0", icon: FileText },
  { label: "Recommendations", value: "0", icon: Sparkles },
];

export function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Overview"
        body="Track the parts of your job search that need attention first."
        action={
          <Button icon={<ArrowRight size={18} />} onClick={() => undefined}>
            Today
          </Button>
        }
      />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-md border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-stone-600">{metric.label}</p>
              <metric.icon className="text-teal-700" size={19} />
            </div>
            <p className="mt-4 text-3xl font-semibold text-stone-950">{metric.value}</p>
          </div>
        ))}
      </section>
      <section className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-md border border-stone-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-stone-950">Next actions</h2>
          <div className="mt-5 grid gap-3">
            <Link className="focus-ring flex items-center justify-between rounded-md border border-stone-200 px-4 py-3 hover:bg-stone-50" to="/app/profile">
              <span>
                <span className="block text-sm font-medium text-stone-950">Complete profile</span>
                <span className="mt-1 block text-sm text-stone-500">Roles, locations, salary, and work mode.</span>
              </span>
              <ArrowRight size={18} />
            </Link>
            <Link className="focus-ring flex items-center justify-between rounded-md border border-stone-200 px-4 py-3 hover:bg-stone-50" to="/app/freshers">
              <span>
                <span className="block text-sm font-medium text-stone-950">Open Freshers Hub</span>
                <span className="mt-1 block text-sm text-stone-500">Internships, fresher jobs, and 0-1 year roles.</span>
              </span>
              <ArrowRight size={18} />
            </Link>
            <Link className="focus-ring flex items-center justify-between rounded-md border border-stone-200 px-4 py-3 hover:bg-stone-50" to="/app/resume">
              <span>
                <span className="block text-sm font-medium text-stone-950">Upload resume</span>
                <span className="mt-1 block text-sm text-stone-500">Prepare analysis for matching.</span>
              </span>
              <ArrowRight size={18} />
            </Link>
            <Link className="focus-ring flex items-center justify-between rounded-md border border-stone-200 px-4 py-3 hover:bg-stone-50" to="/app/jobs">
              <span>
                <span className="block text-sm font-medium text-stone-950">Search jobs</span>
                <span className="mt-1 block text-sm text-stone-500">Start with role and location filters.</span>
              </span>
              <ArrowRight size={18} />
            </Link>
            <Link className="focus-ring flex items-center justify-between rounded-md border border-stone-200 px-4 py-3 hover:bg-stone-50" to="/app/recommended">
              <span>
                <span className="block text-sm font-medium text-stone-950">View recommendations</span>
                <span className="mt-1 block text-sm text-stone-500">Rank jobs against your latest resume.</span>
              </span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
        <div className="rounded-md border border-stone-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-stone-950">Pipeline</h2>
          <dl className="mt-5 grid gap-4 text-sm">
            {["Saved", "Applied", "Interview", "Assessment", "Offer"].map((status) => (
              <div key={status} className="flex items-center justify-between border-b border-stone-100 pb-3 last:border-0 last:pb-0">
                <dt className="text-stone-600">{status}</dt>
                <dd className="font-semibold text-stone-950">0</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
