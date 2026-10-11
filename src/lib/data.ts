import collegesFile from "../data/colleges.json";
import footballFile from "../data/football.json";
import answersText from "../data/answers.txt?raw";
import type { College, CollegesFile, FootballFile, FootballTeam } from "./types";
import { parseAnswerList } from "./answers";

export const DATA_SOURCE = (collegesFile as CollegesFile).source;
export const COLLEGES: College[] = (collegesFile as CollegesFile).colleges;
export const COLLEGE_BY_ID = new Map(COLLEGES.map((c) => [c.id, c]));

export const TEAMS: FootballTeam[] = (footballFile as FootballFile).teams.filter((t) => COLLEGE_BY_ID.has(t.id));
export const TEAM_BY_ID = new Map(TEAMS.map((t) => [t.id, t]));

/** Classic answers: ids from answers.txt that exist in the dataset. */
export const CLASSIC_ANSWERS = parseAnswerList(answersText).filter((id) => COLLEGE_BY_ID.has(id));
