import { sendOpenAiPrompt } from "./openAi.js"

export const sendPrompt = async (prompt, model) => modeTypeToFunctionMap[model](prompt)

const modeTypeToFunctionMap = {
    openai: sendOpenAiPrompt
}