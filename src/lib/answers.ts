/** Parses src/data/answers.txt: one id per line, # starts a comment, duplicates dropped. */
export function parseAnswerList(text: string): string[] {
  const ids = text
    .split("\n")
    .map((l) => l.replace(/#.*/, "").trim())
    .filter(Boolean);
  return [...new Set(ids)];
}
