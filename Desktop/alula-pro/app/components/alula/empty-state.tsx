interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-[#E0F2B2]/30 p-3 mb-4">
        <Icon className="h-10 w-10 text-[#10292E]" />
      </div>
      <h3 className="text-lg font-semibold text-[#10292E] mb-2">{title}</h3>
      <p className="text-[#737373] max-w-md mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}