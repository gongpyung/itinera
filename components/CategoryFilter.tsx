"use client";

type Props = {
  categories: string[];
  active: Set<string>;
  onToggle: (category: string) => void;
  hidden?: boolean;
};

export function CategoryFilter({ categories, active, onToggle, hidden }: Props) {
  if (categories.length === 0) return null;
  return (
    <div className={`category-filter${hidden ? " is-hidden-by-day" : ""}`} aria-label="분류 필터">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          className={`category-filter__chip${active.has(category) ? " is-active" : ""}`}
          onClick={() => onToggle(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
