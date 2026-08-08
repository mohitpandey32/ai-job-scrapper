import type { ReactNode } from "react";
import { BriefcaseBusiness } from "lucide-react";

export function AuthShell({ title, subtitle, children }: { readonly title: string; readonly subtitle: string; readonly children: ReactNode }) {
  return (
    <main className="grid min-h-screen bg-stone-100 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="hidden bg-stone-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3 text-lg font-semibold">
          <span className="grid size-10 place-items-center rounded-md bg-teal-500 text-stone-950">
            <BriefcaseBusiness size={22} />
          </span>
          CareerOS India
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-teal-300">AI career workspace</p>
          <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-tight">
            One place to find, judge, and track every serious opportunity.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-stone-300">
            Built for Indian job seekers who need clean listings, resume intelligence, and a tighter application workflow.
          </p>
        </div>
        <p className="text-sm text-stone-400">India-first MVP</p>
      </section>
      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3 text-lg font-semibold text-stone-950">
              <span className="grid size-10 place-items-center rounded-md bg-teal-700 text-white">
                <BriefcaseBusiness size={22} />
              </span>
              CareerOS India
            </div>
          </div>
          <h2 className="text-3xl font-semibold text-stone-950">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}

