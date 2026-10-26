/** Parses src/data/answers.txt: one id per line, # starts a comment, duplicates dropped. */
export function parseAnswerList(text: string): string[] {
  const ids = text
    .split("\n")
    .map((l) => l.replace(/#.*/, "").trim())
    .filter(Boolean);
  return [...new Set(ids)];
}

/** The first puzzle that uses the current answers.txt / answers-hard.txt. Earlier puzzles used the frozen *-v1.txt lists. */
export const CURRENT_LIST_FROM = 17;
