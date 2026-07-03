interface Category {
  icon: string;
  label: string;
  testId: string;
}

const CATEGORIES: Category[] = [
  { icon: '🏷️', label: 'Angebote',         testId: 'cat-angebote' },
  { icon: '🥦', label: 'Obst & Gemüse',    testId: 'cat-obst-gemuese' },
  { icon: '🥩', label: 'Frische & Kühlung',testId: 'cat-frische-kuehlung' },
  { icon: '🍞', label: 'Brot & Backwaren', testId: 'cat-brot-backwaren' },
  { icon: '🥛', label: 'Milch & Käse',     testId: 'cat-milch-kaese' },
  { icon: '🍝', label: 'Nudeln & Reis',    testId: 'cat-nudeln-reis' },
  { icon: '🧴', label: 'Pflege & Gesundheit', testId: 'cat-pflege' },
  { icon: '🍷', label: 'Getränke',         testId: 'cat-getraenke' },
];

export function ReweCategoryGrid() {
  return (
    <div
      data-testid="rewe-category-grid"
      className="mb-6"
    >
      <h2
        data-testid="rewe-category-title"
        className="text-base font-bold text-gray-800 mb-3"
      >
        Kategorien
      </h2>
      <div
        data-testid="rewe-category-tiles"
        className="grid grid-cols-4 gap-3"
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            data-testid={cat.testId}
            className="flex flex-col items-center justify-center aspect-square
              bg-white rounded-xl border border-gray-200 shadow-sm
              hover:border-red-300 hover:shadow-md transition-all group p-3"
            onClick={(e) => e.preventDefault()}
          >
            <span
              className="text-3xl mb-2 group-hover:scale-110 transition-transform"
              role="img"
              aria-label={cat.label}
            >
              {cat.icon}
            </span>
            <span
              className="text-xs font-semibold text-gray-700 text-center leading-tight
                group-hover:text-red-700 transition-colors"
            >
              {cat.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
