import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { PageHeader } from "../../app/layout/AppLayout";
import { getLatestResume, uploadResume, type ResumeRecord } from "../../shared/api/resume.api";
import { Button } from "../../shared/components/Button";
import { EmptyState } from "../../shared/components/EmptyState";

const maxResumeSizeBytes = 5 * 1024 * 1024;
const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

export function ResumePage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  const resumeQuery = useQuery({
    queryKey: ["resume", "latest"],
    queryFn: getLatestResume,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadResume,
    onSuccess: async () => {
      setSelectedFile(null);
      setClientError(null);
      if (inputRef.current) inputRef.current.value = "";
      await queryClient.invalidateQueries({ queryKey: ["resume", "latest"] });
    },
  });

  const latestResume = resumeQuery.data?.resume ?? null;
  const uploadError = clientError ?? uploadMutation.error?.message ?? null;

  function handleFileChange(file: File | undefined) {
    setClientError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const hasAllowedExtension = /\.(pdf|docx|txt)$/i.test(file.name);
    if (!allowedMimeTypes.has(file.type) && !hasAllowedExtension) {
      setSelectedFile(null);
      setClientError("Upload a PDF, DOCX, or TXT resume.");
      return;
    }

    if (file.size > maxResumeSizeBytes) {
      setSelectedFile(null);
      setClientError("Resume must be 5 MB or smaller.");
      return;
    }

    setSelectedFile(file);
  }

  function submitResume() {
    if (!selectedFile) {
      setClientError("Choose a resume file first.");
      return;
    }

    uploadMutation.mutate(selectedFile);
  }

  return (
    <>
      <PageHeader title="Resume" body="Upload your resume so the assistant can extract skills and prepare matching signals." />
      <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <div className="rounded-md border border-stone-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-950">
            <Upload size={17} />
            Resume upload
          </div>
          <div className="mt-4 rounded-md border border-dashed border-stone-300 bg-stone-50 p-5">
            <input
              ref={inputRef}
              className="sr-only"
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={(event) => handleFileChange(event.target.files?.[0])}
            />
            <button
              className="focus-ring flex min-h-36 w-full flex-col items-center justify-center gap-3 rounded-md text-center text-sm text-stone-700 hover:bg-white"
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              <FileText size={32} className="text-teal-700" />
              <span className="font-medium text-stone-950">{selectedFile ? selectedFile.name : "Choose resume file"}</span>
              <span className="max-w-xs text-stone-600">PDF, DOCX, or TXT. Maximum file size is 5 MB.</span>
            </button>
          </div>

          {selectedFile ? (
            <div className="mt-4 rounded-md border border-stone-200 bg-white p-3 text-sm text-stone-700">
              <div className="font-medium text-stone-950">{selectedFile.name}</div>
              <div className="mt-1">{formatBytes(selectedFile.size)}</div>
            </div>
          ) : null}

          {uploadError ? (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertTriangle size={17} className="mt-0.5 shrink-0" />
              {uploadError}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" icon={uploadMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />} disabled={uploadMutation.isPending} onClick={submitResume}>
              {uploadMutation.isPending ? "Analyzing" : "Upload and analyze"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSelectedFile(null);
                setClientError(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              Clear
            </Button>
          </div>
        </div>

        <ResumeAnalysisPanel resume={latestResume} isLoading={resumeQuery.isLoading} parseError={uploadMutation.data?.parseError} />
      </section>
    </>
  );
}

function ResumeAnalysisPanel({ resume, isLoading, parseError }: { readonly resume: ResumeRecord | null; readonly isLoading: boolean; readonly parseError?: string }) {
  if (isLoading) {
    return <div className="rounded-md border border-stone-200 bg-white p-6 text-sm text-stone-600">Loading resume analysis</div>;
  }

  if (!resume) {
    return (
      <EmptyState
        title="No resume uploaded yet"
        body="Upload your current resume to create the first skill profile for recommendations, resume improvement, and future job matching."
        action={<Sparkles size={20} className="text-teal-700" />}
      />
    );
  }

  const analysis = resume.analysis;

  return (
    <section className="rounded-md border border-stone-200 bg-white p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-950">
            {resume.parseStatus === "COMPLETED" ? <CheckCircle2 size={17} className="text-teal-700" /> : <AlertTriangle size={17} className="text-amber-700" />}
            Latest resume
          </div>
          <h2 className="mt-3 text-lg font-semibold text-stone-950">{resume.fileName}</h2>
          <p className="mt-1 text-sm text-stone-600">
            {formatBytes(resume.fileSize)} uploaded on {formatDate(resume.uploadedAt)}
          </p>
        </div>
        <StatusBadge status={resume.parseStatus} />
      </div>

      {parseError ? (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" />
          {parseError}
        </div>
      ) : null}

      {analysis ? (
        <div className="mt-5 grid gap-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="ATS score" value={analysis.atsScore === null ? "Pending" : `${Math.round(analysis.atsScore)}/100`} />
            <Metric label="Experience" value={formatExperienceLevel(analysis.experienceLevel)} />
            <Metric label="Analyzer" value={analysis.fallbackUsed ? "Fallback" : "Gemini"} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-950">AI summary</h3>
            <p className="mt-2 text-sm leading-6 text-stone-600">{analysis.summary}</p>
          </div>
          <ChipGroup title="Target roles" items={analysis.targetRoles} tone="blue" emptyText="No target roles detected yet." />
          <SkillChips skills={analysis.skills ?? []} />
          <InsightList title="Strengths" items={analysis.strengths ?? []} tone="positive" />
          <InsightList title="Improvement gaps" items={analysis.gaps ?? []} tone="warning" />
          <InsightList title="Resume improvements" items={analysis.improvementSuggestions} tone="warning" />
          <ChipGroup title="Recommended keywords" items={analysis.recommendedKeywords} tone="stone" emptyText="No extra keywords recommended yet." />
        </div>
      ) : (
        <div className="mt-5 rounded-md border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">Analysis will appear after parsing completes.</div>
      )}
    </section>
  );
}

function Metric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
      <div className="text-xs font-medium text-stone-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-stone-950">{value}</div>
    </div>
  );
}

function ChipGroup({ title, items, tone, emptyText }: { readonly title: string; readonly items: readonly string[]; readonly tone: "blue" | "stone"; readonly emptyText: string }) {
  if (!items.length) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-stone-950">{title}</h3>
        <p className="mt-2 text-sm text-stone-600">{emptyText}</p>
      </div>
    );
  }

  const className = tone === "blue" ? "bg-blue-50 text-blue-800" : "bg-stone-100 text-stone-700";

  return (
    <div>
      <h3 className="text-sm font-semibold text-stone-950">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className={`rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function SkillChips({ skills }: { readonly skills: readonly string[] }) {
  if (!skills.length) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-stone-950">Detected skills</h3>
        <p className="mt-2 text-sm text-stone-600">No explicit skills detected yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-stone-950">Detected skills</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span key={skill} className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

function InsightList({ title, items, tone }: { readonly title: string; readonly items: readonly string[]; readonly tone: "positive" | "warning" }) {
  if (!items.length) return null;

  const markerClassName = tone === "positive" ? "bg-teal-600" : "bg-amber-500";

  return (
    <div>
      <h3 className="text-sm font-semibold text-stone-950">{title}</h3>
      <ul className="mt-2 grid gap-2 text-sm leading-6 text-stone-600">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className={`mt-2 size-1.5 shrink-0 rounded-full ${markerClassName}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusBadge({ status }: { readonly status: ResumeRecord["parseStatus"] }) {
  const className = status === "COMPLETED" ? "bg-teal-50 text-teal-800" : status === "FAILED" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-800";

  return <span className={`inline-flex h-7 items-center rounded-full px-2.5 text-xs font-medium ${className}`}>{status.toLowerCase()}</span>;
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatExperienceLevel(value: string) {
  const labels: Record<string, string> = {
    ENTRY: "Entry",
    JUNIOR: "Junior",
    MID: "Mid-level",
    SENIOR: "Senior",
    LEAD: "Lead",
    EXECUTIVE: "Executive",
    UNKNOWN: "Unknown",
  };

  return labels[value] ?? value;
}
