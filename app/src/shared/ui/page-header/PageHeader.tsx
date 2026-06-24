import type { ReactNode } from 'react';

type PageHeaderProps = {
  actions?: ReactNode;
  description?: string;
  title: string;
};

export function PageHeader({ actions, description, title }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold text-text">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">{actions}</div>
      ) : null}
    </div>
  );
}
