import { useEffect, useMemo, useRef, useState } from "react";
import { MODE_CONFIG, confettiColors, type Entity, type Mode } from "./lib/modes";
import { Search } from "./lib/search";
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
import { CardsFrame, ClassicFrame, GridironFrame } from "./components/Scenes";

export type GameModal = "stats" | "result" | null;

const searches = new Map<Mode, Search<Entity>>();
function searchFor(mode: Mode): Search<Entity> {
  let s = searches.get(mode);
  if (!s) {
    const cfg = MODE_CONFIG[mode];
    s = new Search(cfg.pool, cfg.searchBoost);
    searches.set(mode, s);
  }
  return s;
}

/** Time for the last row's tiles to finish flipping before the reveal. */
const REVEAL_DELAY = 6 * 280 + 650;

interface Props {
  mode: Mode;
  puzzle: number;
  done: Record<Mode, boolean>;
  onHelp: () => void;
  modal: GameModal;
  setModal: (m: GameModal) => void;
  otherMode: { mode: Mode; done: boolean };
  onSwitchMode: (m: Mode) => void;
  onFinished: () => void;
  toast: (msg: string) => void;
}

export function Game({ mode, puzzle, done, onHelp, modal, setModal, otherMode, onSwitchMode, onFinished, toast }: Props) {
  const { cfg, answer, guesses, rows, status, stats, submit } = useGame(mode, puzzle);
  const search = useMemo(() => searchFor(mode), [mode]);
  const [animateRow, setAnimateRow] = useState(-1);
  const [confetti, setConfetti] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const guessed = useMemo(() => new Set(guesses), [guesses]);
  const guessItems = useMemo(() => guesses.map((id) => cfg.byId.get(id)!), [guesses, cfg]);
  const wonRow = status === "won" ? guesses.length - 1 : -1;

  const onGuess = (c: Entity) => {
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

  const Frame = cfg.scene === "gridiron" ? GridironFrame : cfg.scene === "cards" ? CardsFrame : ClassicFrame;

  return (
    <>
      <Frame
        mode={mode}
        done={done}
        onChangeMode={onSwitchMode}
        onHelp={onHelp}
        onStats={() => setModal("stats")}
        puzzle={puzzle}
        guessCount={guesses.length}
        finished={status !== "playing"}
      >
        {status === "playing" ? (
          <GuessInput search={search} cfg={cfg} guessed={guessed} guessNumber={guesses.length + 1} onGuess={onGuess} />
        ) : (
          <ResultBar status={status} answer={answer} guessCount={guesses.length} onOpen={() => setModal("result")} onShare={share} />
        )}
        <Board columns={cfg.columns} guesses={guessItems} rowMeta={cfg.rowMeta} rows={rows} animateRow={animateRow} wonRow={wonRow} />
      </Frame>

      {modal === "result" && status !== "playing" && (
        <Modal title="Result" bareTitle onClose={() => setModal(null)}>
          <RevealCard
            mode={mode}
            puzzle={puzzle}
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
      {confetti && <Confetti colors={confettiColors(cfg, answer)} />}
    </>
  );
}

function ResultBar(props: { status: "won" | "lost"; answer: Entity; guessCount: number; onOpen: () => void; onShare: () => void }) {
  const { status, answer, guessCount, onOpen, onShare } = props;
  return (
    <div className="paper card flex items-center gap-3 rounded-2xl p-2.5 pl-4">
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <div className="text-[11px] font-black uppercase tracking-wider text-muted">
          {status === "won" ? `✅ Solved in ${guessCount}/6` : "❌ It was"} · next in <Countdown />
        </div>
        <div className="truncate text-[18px] font-black">{answer.short}</div>
      </button>
      <button onClick={onShare} className="btn btn-primary flex items-center gap-1.5 px-4 py-2.5 text-[16px]">
        Share <ShareIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
