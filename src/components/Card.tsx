interface CardProps {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function Card({ title, actions, children }: CardProps) {
  return (
    <div className="card">
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="text-sm font-semibold text-slate-800">{title}</div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
