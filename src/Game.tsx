import { useEffect, useMemo, useRef, useState } from "react";
import type { College } from "./lib/types";
import { COLLEGE_BY_ID } from "./lib/data";
import { MODE_CONFIG, type Mode } from "./lib/modes";
import { SchoolSearch } from "./lib/search";
import { shareResult, shareText } from "./lib/share";
import { MAX_GUESSES } from "./lib/stats";
import { useGame } from "./useGame";
import { Board } from "./components/Board";
import { Confetti } from "./components/Confetti";
import { Countdown } from "./components/Countdown";
import { GuessInput } from "./components/GuessInput";
import { Modal } from "./components/Modal";
import { RevealCard } from "./components/RevealCard";
import { StatsModal } from "./components/StatsModal";
import { ShareIcon } from "./components/icons";

export type GameModal = "stats" | "result" | null;

const searches = new Map<Mode, SchoolSearch>();
function searchFor(mode: Mode): SchoolSearch {
  let s = searches.get(mode);
  if (!s) {
    const cfg = MODE_CONFIG[mode];
    s = new SchoolSearch(cfg.pool, new Set(cfg.answers));
    searches.set(mode, s);
  }
  return s;
}

/** Time for the last row's tiles to finish flipping before the reveal. */
const REVEAL_DELAY = 6 * 280 + 650;

interface Props {
  mode: Mode;
  puzzle: number;
  modal: GameModal;
  setModal: (m: GameModal) => void;
  otherMode: { mode: Mode; done: boolean };
  onSwitchMode: (m: Mode) => void;
  onFinished: () => void;
  toast: (msg: string) => void;
}

export function Game({ mode, puzzle, modal, setModal, otherMode, onSwitchMode, onFinished, toast }: Props) {
  const { cfg, answer, guesses, rows, status, stats, submit } = useGame(mode, puzzle);
  const search = useMemo(() => searchFor(mode), [mode]);
  const [animateRow, setAnimateRow] = useState(-1);
  const [confetti, setConfetti] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const guessed = useMemo(() => new Set(guesses), [guesses]);
  const guessColleges = useMemo(() => guesses.map((id) => COLLEGE_BY_ID.get(id)!), [guesses]);
  const wonRow = status === "won" ? guesses.length - 1 : -1;

  const onGuess = (c: College) => {
    const next = submit(c.id);
    if (!next) return;
    setAnimateRow(guesses.length);
    if (next !== "playing") {
      onFinished();
      timers.current.push(
        window.setTimeout(() => {
          if (next === "won") setConfetti(true);
          setModal("result");
        }, REVEAL_DELAY),
        window.setTimeout(() => setConfetti(false), REVEAL_DELAY + 4500),
      );
    }
  };

  const share = async () => {
    const text = shareText({ title: cfg.shareTitle, badge: cfg.emoji, puzzle, rows, won: status === "won", maxGuesses: MAX_GUESSES });
    const outcome = await shareResult(text);
    if (outcome === "copied") toast("Copied! Paste it in the group chat 📋");
    else if (outcome === "failed") toast("Couldn't copy. Try again?");
  };

  const date = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  return (
    <>
      <div className="mt-4 mb-2.5 flex items-center justify-between gap-2 px-0.5 text-[13px] font-extrabold whitespace-nowrap">
        <span>
          <span className="font-display text-accent">#{puzzle}</span> <span className="text-muted">· {date}</span>
        </span>
        <span className="truncate text-muted">
          {cfg.emoji} {cfg.tagline}
        </span>
      </div>

      {status === "playing" ? (
        <GuessInput search={search} guessed={guessed} guessNumber={guesses.length + 1} onGuess={onGuess} />
      ) : (
        <ResultBar status={status} answer={answer} guessCount={guesses.length} onOpen={() => setModal("result")} onShare={share} />
      )}

      <Board columns={cfg.columns} guesses={guessColleges} rows={rows} animateRow={animateRow} wonRow={wonRow} />

      {modal === "result" && status !== "playing" && (
        <Modal title="Result" bareTitle onClose={() => setModal(null)}>
          <RevealCard
            mode={mode}
            answer={answer}
            status={status}
            guessCount={guesses.length}
            otherMode={otherMode}
            onShare={share}
            onStats={() => setModal("stats")}
            onSwitchMode={onSwitchMode}
          />
        </Modal>
      )}
      {modal === "stats" && (
        <StatsModal mode={mode} stats={stats} puzzle={puzzle} status={status} guessCount={guesses.length} onShare={share} onClose={() => setModal(null)} />
      )}
      {confetti && <Confetti colors={cfg.confetti(answer)} />}
    </>
  );
}

function ResultBar(props: { status: "won" | "lost"; answer: College; guessCount: number; onOpen: () => void; onShare: () => void }) {
  const { status, answer, guessCount, onOpen, onShare } = props;
  return (
    <div className="chunky flex items-center gap-3 rounded-2xl bg-surface p-2.5 pl-4">
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <div className="text-[11px] font-black uppercase tracking-wider text-muted">
          {status === "won" ? `✅ Solved in ${guessCount}/6` : "❌ It was"} · next in <Countdown />
        </div>
        <div className="truncate text-[18px] font-black">{answer.short}</div>
      </button>
      <button onClick={onShare} className="press chunky-sm flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-[16px] font-black text-accent-ink">
        Share <ShareIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
