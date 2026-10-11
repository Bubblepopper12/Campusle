import { useCallback, useEffect, useRef, useState } from "react";
import { DATA_SOURCE } from "./lib/data";
import { puzzleNumber } from "./lib/daily";
import { isMode, type Mode } from "./lib/modes";
import { KEYS, load, save } from "./lib/storage";
import { isDone } from "./useGame";
import { Game, type GameModal } from "./Game";
import { Header, ModeTabs, Toast } from "./components/Chrome";
import { HowToPlay } from "./components/HowToPlay";

function modeFromHash(): Mode | null {
  const h = window.location.hash.replace("#", "").toLowerCase();
  return isMode(h) ? h : h === "football" || h === "cfb" ? "gridiron" : null;
}

export default function App() {
  const [mode, setMode] = useState<Mode>(() => modeFromHash() ?? (isMode(load(KEYS.mode, "classic")) ? load<Mode>(KEYS.mode, "classic") : "classic"));
  const [puzzle, setPuzzle] = useState(() => puzzleNumber());
  const [help, setHelp] = useState(() => !load(KEYS.seenHelp, false));
  const [modal, setModal] = useState<GameModal>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; id: number } | null>(null);
  const [, setDoneTick] = useState(0);
  const toastTimer = useRef<number>(0);

  // Roll over to the new puzzle at local midnight, including when the tab was in the background.
  useEffect(() => {
    const check = () => setPuzzle(puzzleNumber());
    const t = window.setInterval(check, 15_000);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  useEffect(() => {
    const onHash = () => {
      const m = modeFromHash();
      if (m) setMode(m);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const switchMode = useCallback((m: Mode) => {
    setMode(m);
    setModal(null);
    save(KEYS.mode, m);
    window.history.replaceState(null, "", m === "classic" ? window.location.pathname : `#${m}`);
    window.scrollTo({ top: 0 });
  }, []);

  const toast = useCallback((text: string) => {
    setToastMsg({ text, id: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2200);
  }, []);

  const closeHelp = () => {
    setHelp(false);
    save(KEYS.seenHelp, true);
  };

  const done = { classic: isDone("classic", puzzle), gridiron: isDone("gridiron", puzzle) };
  const other: Mode = mode === "classic" ? "gridiron" : "classic";
  const offline = DATA_SOURCE.startsWith("Offline");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-4 pb-8">
      <Header onHelp={() => setHelp(true)} onStats={() => setModal("stats")} />
      <ModeTabs mode={mode} done={done} onChange={switchMode} />

      <main className="flex-1">
        <Game
          key={`${mode}-${puzzle}`}
          mode={mode}
          puzzle={puzzle}
          modal={modal}
          setModal={setModal}
          otherMode={{ mode: other, done: done[other] }}
          onSwitchMode={switchMode}
          onFinished={() => setDoneTick((n) => n + 1)}
          toast={toast}
        />
      </main>

      <footer className="mt-8 text-center text-[12px] leading-relaxed font-medium text-muted">
        A new school every day at midnight. Free, no account.
        <br />
        {offline
          ? "Preview data: school stats are approximate."
          : "School data: U.S. Dept. of Education College Scorecard and Wikidata."}{" "}
        {mode === "gridiron" && "Football data is hand-curated."}
      </footer>

      {help && <HowToPlay mode={mode} onClose={closeHelp} />}
      {toastMsg && <Toast key={toastMsg.id} message={toastMsg.text} />}
    </div>
  );
}
