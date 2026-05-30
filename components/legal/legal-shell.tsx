import type { ReactNode } from "react";

export function LegalShell({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-mahalo-navy-900">
        {title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last Updated: {lastUpdated}
      </p>
      <div className="mt-8 flex flex-col gap-8">{children}</div>
    </article>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-mahalo-navy-900">{heading}</h2>
      {children}
    </section>
  );
}

export function LegalText({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
  );
}

export function LegalList({ children }: { children: ReactNode }) {
  return (
    <ul className="ml-5 flex list-disc flex-col gap-1.5 text-sm leading-relaxed text-muted-foreground marker:text-mahalo-blue-600">
      {children}
    </ul>
  );
}
