import {QueryAnswer} from "../features/document/documentAPI";

export const sortQueryAnswersByProbability = (a: QueryAnswer, b: QueryAnswer) => (b.probability - a.probability)