import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { DATA_SOURCE } from "./lib/data";
import { puzzleNumber } from "./lib/daily";
import { HASH, MODES, MODE_CONFIG, modeFromHash, type Mode, type Scene } from "./lib/modes";
import { KEYS, load, save } from "./lib/storage";
import { isDone } from "./useGame";
import { Game, type GameModal } from "./Game";
import { Pennants, Toast } from "./components/Scenes";
import { HowToPlay } from "./components/HowToPlay";
import { Menu } from "./components/Menu";

/** Browser chrome color per scene, light then dark. */
const THEME_COLOR: Record<Scene, [string, string]> = {
  classic: ["#6e4626", "#2a1a10"],
  gridiron: ["#5aa9f0", "#050816"],
  cards: ["#efe9fb", "#0b0716"],
};

export default function App() {
  // Classic is the home game: everyone lands there unless a link points at another mode (#hard, #football, #players).
  const [mode, setMode] = useState<Mode>(() => modeFromHash(window.location.hash) ?? "classic");
  const [menu, setMenu] = useState(false);
  const scene = MODE_CONFIG[mode].scene;
  const [puzzle, setPuzzle] = useState(() => puzzleNumber());
  const [help, setHelp] = useState(() => !load(KEYS.seenHelp, false));
  const [modal, setModal] = useState<GameModal>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; id: number } | null>(null);
  const [, setDoneTick] = useState(0);
  const toastTimer = useRef<number>(0);

  // The scene (lecture hall or stadium) is driven by <html data-mode>, set before paint to avoid a flash.
  useLayoutEffect(() => {
    document.documentElement.dataset.mode = scene;
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => {
      m.content = THEME_COLOR[scene][m.media.includes("dark") ? 1 : 0];
    });
  }, [scene]);

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
      const m = modeFromHash(window.location.hash);
      if (m) setMode(m);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const switchMode = useCallback((m: Mode) => {
    setMode(m);
    setModal(null);
    setMenu(false);
    window.history.replaceState(null, "", HASH[m] ? `#${HASH[m]}` : window.location.pathname);
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

  const done = Object.fromEntries(MODES.map((m) => [m, isDone(m, puzzle)])) as Record<Mode, boolean>;
  // "Play next" on the result card: the next mode you haven't finished today.
  const order = [...MODES.slice(MODES.indexOf(mode) + 1), ...MODES.slice(0, MODES.indexOf(mode))];
  const other: Mode = order.find((m) => !done[m]) ?? order[0];
  const offline = DATA_SOURCE.startsWith("Offline");

  return (
    <div className="relative min-h-dvh">
      {scene === "classic" && <Pennants />}
      <div
        className={`mx-auto flex min-h-dvh w-full max-w-[480px] flex-col pb-8 ${
          scene === "classic" ? "px-4 pt-[64px]" : "px-2.5 pt-[max(0.75rem,env(safe-area-inset-top))]"
        }`}
      >
        <main className="flex-1">
          <Game
            key={`${mode}-${puzzle}`}
            mode={mode}
            puzzle={puzzle}
            done={done}
            onMenu={() => setMenu(true)}
            modal={modal}
            setModal={setModal}
            otherMode={{ mode: other, done: done[other] }}
            onSwitchMode={switchMode}
            onFinished={() => setDoneTick((n) => n + 1)}
            toast={toast}
          />
        </main>

        <footer className="site-footer mt-7 text-center text-[12px] leading-relaxed font-semibold text-muted [text-shadow:0_1px_2px_rgb(0_0_0/0.5)]">
          New puzzles every day at midnight. Free, no account.
          <br />
          {offline ? "Preview data: school stats are approximate." : "School data: U.S. Dept. of Education College Scorecard and Wikidata."}{" "}
          {scene === "gridiron" && "Football data is hand-curated."}
          {scene === "cards" && "Player data is hand-curated."}
          <br />
          <a href="/how-to-play.html" className="underline underline-offset-2">
            How to play
          </a>
          {" · "}
          <a href="/archive/" className="underline underline-offset-2">
            Archive
          </a>
          {" · "}
          <a href="/about.html" className="underline underline-offset-2">
            About
          </a>
          {" · "}
          <a href="/privacy.html" className="underline underline-offset-2">
            Privacy
          </a>
        </footer>
      </div>

      {menu && (
        <Menu
          mode={mode}
          done={done}
          onPick={switchMode}
          onHelp={() => {
            setMenu(false);
            setHelp(true);
          }}
          onStats={() => {
            setMenu(false);
            setModal("stats");
          }}
          onClose={() => setMenu(false)}
        />
      )}
      {help && <HowToPlay mode={mode} onClose={closeHelp} />}
      {toastMsg && <Toast key={toastMsg.id} message={toastMsg.text} />}
    </div>
  );
}
