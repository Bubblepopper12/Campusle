// Prints the data report for the current src/data files without rebuilding anything.
// Run: npm run data:report
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { CollegesFile, FootballFile, PlayersFile } from "../src/lib/types.ts";
import { DATA_DIR, buildReport } from "./lib/pipeline.ts";

const colleges = JSON.parse(readFileSync(join(DATA_DIR, "colleges.json"), "utf8")) as CollegesFile;
const football = JSON.parse(readFileSync(join(DATA_DIR, "football.json"), "utf8")) as FootballFile;
console.log(`Source: ${colleges.source} (generated ${colleges.generatedAt})`);
const players = JSON.parse(readFileSync(join(DATA_DIR, "players.json"), "utf8")) as PlayersFile;
console.log(buildReport(colleges.colleges, football.teams, players.players).join("\n"));
