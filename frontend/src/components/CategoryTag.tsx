const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug',
  feature: 'Feature',
  question: 'Frage',
  access: 'Zugang',
  infrastructure: 'Infrastruktur',
  uncategorized: 'Unkategorisiert',
};

interface Props {
  category: string;
}

export function CategoryTag({ category }: Props) {
  const label = CATEGORY_LABELS[category] ?? category;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
      {label}
    </span>
  );
}
