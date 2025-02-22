import express from 'express'
import { generateRecipe, getCacheStats } from '../controllers/recipeController.js'
import { validateRecipeRequest } from '../middleware/validators.js'

const router = express.Router()

router.post('/generate', validateRecipeRequest, generateRecipe)
router.get('/cache-stats', getCacheStats)

export default router