import { useRef } from 'react';

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors';

type Props = {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
};

export default function ListEditor({ items, onChange, placeholder }: Props) {
  // Stable IDs keyed by position - external data model stays string[],
  // IDs live only here to give React stable reconciliation keys
  const idsRef = useRef<string[]>([]);
  while (idsRef.current.length < items.length) {
    idsRef.current.push(crypto.randomUUID());
  }

  function removeItem(i: number) {
    idsRef.current.splice(i, 1);
    onChange(items.filter((_, j) => j !== i));
  }

  function addItem() {
    idsRef.current.push(crypto.randomUUID());
    onChange([...items, '']);
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={idsRef.current[i]} className="flex gap-2">
          <input
            className={inputCls}
            value={item}
            placeholder={placeholder}
            onChange={(e) => {
              const updated = [...items];
              updated[i] = e.target.value;
              onChange(updated);
            }}
          />
          <button
            type="button"
            onClick={() => removeItem(i)}
            className="text-gray-300 hover:text-red-400 text-sm px-2 transition-colors"
            aria-label="Remove"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="text-blue-400 hover:text-blue-600 text-xs font-medium transition-colors"
      >
        + Add
      </button>
    </div>
  );
}
