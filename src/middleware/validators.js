export function validateRecipeRequest(req, res, next) {
  const { dishType, llmConfig } = req.body
  
  // Validate dishType
  if (!dishType) {
    return res.status(400).json({ error: 'Dish type is required' })
  }
  
  // Validate llmConfig if provided
  if (llmConfig) {
    // Check if model is provided and is a supported type
    if (!llmConfig.model) {
      return res.status(400).json({ error: 'LLM model is required when providing llmConfig' })
    }
    
    const supportedModels = ['openai', 'anthropic', 'grok', 'perplexity']
    if (!supportedModels.includes(llmConfig.model.toLowerCase())) {
      return res.status(400).json({ 
        error: `Unsupported LLM model. Supported models are: ${supportedModels.join(', ')}`
      })
    }
    
    // Check if apiKey is provided for models other than openai
    if (llmConfig.model.toLowerCase() !== 'openai' && !llmConfig.apiKey) {
      return res.status(400).json({ 
        error: `API key is required for ${llmConfig.model} model`
      })
    }
  }
  
  next()
}