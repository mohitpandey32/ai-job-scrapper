import type { ReactNode } from "react";

interface EmptyStateProps {
  readonly title: string;
  readonly body: string;
  readonly action?: ReactNode;
}

export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <section className="rounded-md border border-dashed border-stone-300 bg-white/70 p-8">
      <h2 className="text-lg font-semibold text-stone-950">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}

