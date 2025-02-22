import { generateRecipes } from '../services/recipeService.js'
import { cacheService } from '../services/cacheService.js'

export async function generateRecipe(req, res) {
  try {
    const { dishType, preferences } = req.body

    // Check cache first
    const cacheKey = `recipes:${dishType}:${JSON.stringify(preferences)}`
    const cachedRecipes = await cacheService.get(cacheKey)
    
    if (cachedRecipes) {
      return res.json(cachedRecipes)
    }

    // Generate new recipes
    const recipes = await generateRecipes(dishType, preferences)
    
    // Cache the results
    await cacheService.set(cacheKey, recipes)

    res.json(recipes)
  } catch (error) {
    console.error('Error in recipe generation:', error)
    res.status(500).json({ error: 'Failed to generate recipes' })
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