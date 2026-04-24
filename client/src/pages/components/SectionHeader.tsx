interface SectionHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export default function SectionHeader({ title, children }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between  pt-4 mb-8">
      <h1 className="text-4xl uppercase text-blue font-londrina">{title}</h1>
      {children}
    </div>
  );
}
