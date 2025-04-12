import { sendOpenAiPrompt } from "./openAi.js"
import { sendAnthropicPrompt } from "./anthropic.js"
import { sendGrokPrompt } from "./grok.js"
// import { sendPerplexityPrompt } from "./perplexity.js"

export const sendPrompt = async (prompt, model, apiKey) => {
  const selectedModel = model.toLowerCase();
  
  if (!modelTypeToFunctionMap[selectedModel]) {
    throw new Error(`Unsupported model: ${model}. Supported models are: ${Object.keys(modelTypeToFunctionMap).join(', ')}`);
  }
  
  if (!apiKey && selectedModel !== 'openai') {
    throw new Error(`API key is required for ${model}`);
  }
  
  return modelTypeToFunctionMap[selectedModel](prompt, apiKey);
}

const modelTypeToFunctionMap = {
  openai: sendOpenAiPrompt,
  anthropic: sendAnthropicPrompt,
  grok: sendGrokPrompt,
//   perplexity: sendPerplexityPrompt
}