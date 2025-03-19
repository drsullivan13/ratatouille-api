import { generateRecipes } from '../services/recipeService.js'
import { cacheService } from '../services/cacheService.js'

export async function generateRecipe(req, res) {
  try {
    const { dishType, preferences, llmConfig } = req.body

    // Check if llmConfig is provided and has required properties
    if (llmConfig && (!llmConfig.model || (llmConfig.model !== 'openai' && !llmConfig.apiKey))) {
      return res.status(400).json({ 
        error: 'Invalid LLM configuration. When providing llmConfig, model is required and apiKey is required for all models except openai.'
      })
    }

    // Only use cache if not using user-provided API key
    let cachedRecipes = null
    const cacheKey = `recipes:${dishType}:${JSON.stringify(preferences)}:${llmConfig?.model || 'openai'}`
    
    if (!llmConfig || !llmConfig.apiKey) {
      cachedRecipes = await cacheService.get(cacheKey)
    }
    
    if (cachedRecipes) {
      return res.json(cachedRecipes)
    }

    // Generate new recipes
    const recipes = await generateRecipes(dishType, preferences, llmConfig)
    
    // Cache the results only if not using user-provided API key
    if (!llmConfig || !llmConfig.apiKey) {
      await cacheService.set(cacheKey, recipes)
    }

    res.json(recipes)
  } catch (error) {
    console.error('Error in recipe generation:', error)
    res.status(500).json({ error: error.message || 'Failed to generate recipes' })
  }
}

export function getCacheStats(req, res) {
  try {
    const stats = cacheService.getStats()
    res.json(stats)
  } catch (error) {
    console.error('Error getting cache stats:', error)
    res.status(500).json({ error: 'Failed to get cache statistics' })
  }
}