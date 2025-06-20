import { Recipe } from "../models/Recipe.js"
import { sendPrompt } from "./llms/index.js"

export const generateRecipes = async (dishType, preferences = {}, llmConfig = {}) => {
  const dietaryRestrictions = preferences.dietary || []
  const servingSize = preferences.servings || 4
  const difficulty = preferences.difficulty || "any"
  const recipeCount = preferences.recipeCount
  const pantryIngredients = preferences.pantryIngredients

  const prompt = `Generate ${recipeCount} unique recipes for ${dishType || "any dish"}.
- Dietary restrictions: ${dietaryRestrictions.length > 0 ? dietaryRestrictions.join(", ") : "none"}
- Serving size: ${servingSize} people
- Difficulty level: ${difficulty} (easy, medium, or hard)
- Pantry/fridge ingredients to use (optional): ${pantryIngredients.length > 0 ? pantryIngredients.join(", ") : "none provided"}

For each recipe, include the following fields in a JSON object:
- "title": A concise, appealing recipe name
- "description": 2-3 sentences describing the dish's origin, flavor profile, and why it's enjoyable (mention any pantry ingredients used, if applicable)
- "ingredients": An array of objects, each with { "item": string, "amount": number or fraction (e.g., 0.5, 1.25), "unit": string (e.g., "cup", "tsp", "oz") }; if pantry ingredients are provided, include as many as possible with appropriate quantities, supplemented by additional ingredients as needed
- "steps": An array of detailed, step-by-step instructions (each step as a string, numbered implicitly by order); if pantry ingredients are used, highlight their use in the steps
- "servings": Number of servings (must match ${servingSize})
- "prepTime": Preparation time in minutes (e.g., 15)
- "cookTime": Cooking time in minutes (e.g., 30)
- "difficulty": Difficulty level (must match ${difficulty})
- "dietaryInfo": Array of applicable labels (e.g., ["vegetarian", "gluten-free"]) or ["none"] if no restrictions apply
- "nutritionalInfo": Object with approximate per-serving values: { "calories": number, "protein": number (g), "fat": number (g), "carbs": number (g) }

Format the response as a JSON object with a "recipes" array containing ${recipeCount} recipe objects. If ${recipeCount} > 1, ensure each recipe varies significantly in flavor, taste, and culinary cuisine (e.g., Italian, Mexican, Indian), while still incorporating the pantry ingredients (if provided) across the recipes. Validate that all recipes comply with the specified dietary restrictions, serving size, and difficulty level. If pantry ingredients are provided, prioritize their use in the recipes; if none are provided, create recipes freely based on the other inputs.`

const healthyPrompt = `Generate ${recipeCount} unique recipes for ${dishType || "any dish"}.
- Dietary restrictions: ${dietaryRestrictions.length > 0 ? dietaryRestrictions.join(", ") : "none"}
- Health guidelines: Recipes must adhere to principles inspired by Dr. Mark Hyman's dietary recommendations, including:
  - Prioritizing organic ingredients where possible.
  - Using healthy fats such as olive oil, avocado oil, coconut oil, grass-fed butter, or ghee; avoiding seed oils like canola, soybean, etc.
  - Including a variety of colorful vegetables and low-glycemic fruits, especially berries.
  - If including animal products, opting for grass-fed, pasture-raised, or wild-caught options.
  - Avoiding refined sugars and processed foods.
  - Minimizing gluten-containing ingredients, unless specified otherwise in dietary restrictions.
  - Ensuring the recipes are balanced with adequate protein, healthy fats, and complex carbohydrates.
  - Using cooking methods that preserve nutrients, such as steaming, baking, grilling, or sautéing with healthy oils, and avoiding deep-frying.
- Serving size: ${servingSize} people
- Difficulty level: ${difficulty} (easy, medium, or hard)
- Pantry/fridge ingredients to use (optional): ${pantryIngredients.length > 0 ? pantryIngredients.join(", ") : "none provided"}

For each recipe, include the following fields in a JSON object:
- "title": A concise, appealing recipe name
- "description": 2-3 sentences describing the dish's origin, flavor profile, and why it's enjoyable (mention any pantry ingredients used, if applicable)
- "ingredients": An array of objects, each with { "item": string, "amount": number or fraction (e.g., 0.5, 1.25), "unit": string (e.g., "cup", "tsp", "oz") }; if pantry ingredients are provided, include as many as possible with appropriate quantities, supplemented by additional ingredients as needed; specify high-quality sources where applicable, such as organic, grass-fed, pasture-raised, or wild-caught
- "steps": An array of detailed, step-by-step instructions (each step as a string, numbered implicitly by order); if pantry ingredients are used, highlight their use in the steps
- "servings": Number of servings (must match ${servingSize})
- "prepTime": Preparation time in minutes (e.g., 15)
- "cookTime": Cooking time in minutes (e.g., 30)
- "difficulty": Difficulty level (must match ${difficulty})
- "dietaryInfo": Array of applicable labels (e.g., ["vegetarian", "gluten-free"]) or ["none"] if no restrictions apply
- "nutritionalInfo": Object with approximate per-serving values: { "calories": number, "protein": number (g), "fat": number (g), "carbs": number (g) }

Format the response as a JSON object with a "recipes" array containing ${recipeCount} recipe objects. If ${recipeCount} > 1, ensure each recipe varies significantly in flavor, taste, and culinary cuisine (e.g., Italian, Mexican, Indian), while still incorporating the pantry ingredients (if provided) across the recipes. Validate that all recipes comply with the specified dietary restrictions, serving size, and difficulty level. If pantry ingredients are provided, prioritize their use in the recipes; if none are provided, create recipes freely based on the other inputs. Do not reference Dr. Mark Hyman in your result.`

  try {
    console.log(`Starting recipe generation using ${llmConfig.model || 'openai'} model`)

    // Use the model and API key from llmConfig, with fallbacks
    const model = llmConfig.model || 'openai'
    const apiKey = llmConfig.apiKey

    const generatedRecipes = await sendPrompt(healthyPrompt, model, apiKey)

    console.log(`Finished recipe generation with ${model} model`)

    return generatedRecipes.recipes.map((recipeData) => {
      const recipe = new Recipe(recipeData)
      recipe.validate()
      return recipe
    })
  } catch (error) {
    console.error("Error generating recipes:", error)
    throw new Error(`Failed to generate recipes: ${error.message}`)
  }
}