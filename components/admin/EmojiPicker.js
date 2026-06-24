'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

// Curated emoji set grouped by theme relevant to this site's categories
// (coloring pages, calendars, printables for kids). Not exhaustive by
// design — covers what's actually needed without pulling in a full
// emoji-picker dependency.
const EMOJI_GROUPS = {
  'Animals & Nature': ['🐶','🐱','🐰','🦁','🐯','🐼','🦊','🐻','🐨','🐸','🐬','🐠','🦖','🦕','🐝','🦋','🌸','🌳','🌺','🍄'],
  'Holidays & Seasons': ['🎃','🎄','🎅','🎁','🐰','🥚','💝','🎆','🍂','❄️','☀️','🌈'],
  'Fantasy & Characters': ['🦄','🐉','🧜','🧚','🧙','👑','🦸','🕷️','👻','🤖','🦹'],
  'Education & Shapes': ['🔤','🔢','📐','📏','✏️','📚','🎓','🧮','🗽','🪐','🌍','⭐'],
  'Sports & Activities': ['⚽','🏀','🎨','🎮','📺','🚗','✈️','🚀','🎵','🎭'],
  'Food & Fun': ['🍦','🍕','🍰','🎂','🍓','🎈','🎉'],
};

export default function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-3xl w-16 h-16 flex items-center justify-center rounded-lg border-2 border-yellow-300 bg-white hover:border-yellow-500 transition-colors"
          title="Click to choose an emoji"
        >
          {value || '🎨'}
        </button>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="🎨"
          maxLength={4}
          className="text-xl text-center w-20"
        />
        <span className="text-xs text-muted-foreground">Pick below, or paste your own</span>
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-80 max-h-72 overflow-y-auto bg-white border-2 border-yellow-300 rounded-lg shadow-xl p-3">
          {Object.entries(EMOJI_GROUPS).map(([group, emojis]) => (
            <div key={group} className="mb-3">
              <p className="text-xs font-bold text-gray-500 mb-1">{group}</p>
              <div className="flex flex-wrap gap-1">
                {emojis.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => { onChange(e); setOpen(false); }}
                    className="text-2xl w-9 h-9 flex items-center justify-center rounded hover:bg-yellow-100 transition-colors"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
