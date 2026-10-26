import collegesFile from "../data/colleges.json";
import footballFile from "../data/football.json";
import playersFile from "../data/players.json";
import answersText from "../data/answers.txt?raw";
import hardAnswersText from "../data/answers-hard.txt?raw";
import answersV1Text from "../data/answers-v1.txt?raw";
import hardAnswersV1Text from "../data/answers-hard-v1.txt?raw";
import type { College, CollegesFile, FootballFile, FootballTeam, Player, PlayersFile } from "./types";
import { CURRENT_LIST_FROM, parseAnswerList } from "./answers";
import type { AnswerEra } from "./daily";

export const DATA_SOURCE = (collegesFile as CollegesFile).source;
export const COLLEGES: College[] = (collegesFile as CollegesFile).colleges;
export const COLLEGE_BY_ID = new Map(COLLEGES.map((c) => [c.id, c]));

export const TEAMS: FootballTeam[] = (footballFile as FootballFile).teams.filter((t) => COLLEGE_BY_ID.has(t.id));
export const TEAM_BY_ID = new Map(TEAMS.map((t) => [t.id, t]));

/** Players whose schools are all in the dataset. */
export const PLAYERS: Player[] = (playersFile as PlayersFile).players.filter((p) => p.schools.length && p.schools.every((s) => COLLEGE_BY_ID.has(s)));
export const PLAYER_BY_ID = new Map(PLAYERS.map((p) => [p.id, p]));

const listOf = (text: string) => parseAnswerList(text).filter((id) => COLLEGE_BY_ID.has(id));

/** Classic answers: well-known schools from answers.txt that exist in the dataset. */
export const CLASSIC_ANSWERS = listOf(answersText);
/** Hard answers: niche schools from answers-hard.txt. */
export const HARD_ANSWERS = listOf(hardAnswersText);

/** Which list each puzzle draws from: the frozen launch lists first, then the current ones. */
export const CLASSIC_ERAS: AnswerEra[] = [
  { from: 1, ids: listOf(answersV1Text) },
  { from: CURRENT_LIST_FROM, ids: CLASSIC_ANSWERS },
];
export const HARD_ERAS: AnswerEra[] = [
  { from: 1, ids: listOf(hardAnswersV1Text) },
  { from: CURRENT_LIST_FROM, ids: HARD_ANSWERS },
];

/** A school's conference today: its football conference if it plays FBS, else its main athletic conference. */
export const conferenceOf = (collegeId: string): string | null =>
  TEAM_BY_ID.get(collegeId)?.conference ?? COLLEGE_BY_ID.get(collegeId)?.conference ?? null;
