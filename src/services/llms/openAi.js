import OpenAI from "openai"
import { config } from '../../config.js'

// Create OpenAI client using config
export const openai = new OpenAI({
  apiKey: config.openAiApiKey
})

