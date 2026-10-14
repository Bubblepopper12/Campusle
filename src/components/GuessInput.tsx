import { useId, useMemo, useRef, useState } from "react";
import type { Entity, ModeConfig } from "../lib/modes";
import type { Search } from "../lib/search";
import { SearchIcon } from "./icons";

interface Props {
  search: Search<Entity>;
  cfg: ModeConfig;
  guessed: Set<string>;
  guessNumber: number;
  onGuess: (item: Entity) => void;
}

export function GuessInput({ search, cfg, guessed, guessNumber, onGuess }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [shake, setShake] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const results = useMemo(() => search.search(query, 8), [search, query]);
  const showList = open && query.trim().length > 0;

  const pick = (c: Entity | undefined) => {
    if (!c || guessed.has(c.id)) {
      setShake((n) => n + 1);
      return;
    }
    onGuess(c);
    setQuery("");
    setActive(0);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <div key={shake} className={`paper card flex items-center gap-2 rounded-2xl px-3.5 ${shake ? "shake" : ""}`}>
        <SearchIcon className="h-5 w-5 shrink-0 text-muted" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          placeholder={`Guess ${guessNumber}/6: type a ${cfg.noun === "player" ? "player" : "school"}…`}
          className="guess-input h-[54px] w-full min-w-0 bg-transparent text-[17px] font-semibold outline-none"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="go"
        />
        {query && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="rounded-full px-2 py-1 text-[13px] font-bold text-muted"
            aria-label="Clear"
          >
            Clear
          </button>
        )}
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="paper card fade-in absolute inset-x-0 top-[calc(100%+8px)] z-30 max-h-[min(55vh,420px)] overflow-y-auto rounded-2xl p-1.5"
        >
          {results.length === 0 && (
            <li className="px-3 py-3 text-[15px] font-semibold text-muted">
              No {cfg.noun === "player" ? "player" : "school"} matches “{query.trim()}”
            </li>
          )}
          {results.map((c, i) => {
            const done = guessed.has(c.id);
            return (
              <li
                key={c.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                aria-disabled={done}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(c)}
                className={[
                  "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5",
                  i === active ? "option-active" : "",
                  done ? "cursor-not-allowed opacity-45" : "",
                ].join(" ")}
              >
                <div className="min-w-0 flex-1">
                  <div className="option-name truncate text-[16px] font-extrabold">{c.short}</div>
                  {cfg.optionSub(c) && <div className="truncate text-[12px] font-medium text-muted">{cfg.optionSub(c)}</div>}
                </div>
                <div className="shrink-0 text-right text-[12px] font-bold text-muted">
                  {done ? "guessed" : cfg.optionMeta(c)}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
