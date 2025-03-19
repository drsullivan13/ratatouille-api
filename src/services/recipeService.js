import { Recipe } from "../models/Recipe.js"
import { openai } from "./llms/openAi.js"

export const generateRecipes = async (dishType, preferences = {}) => {
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
- "description": 2-3 sentences describing the dish’s origin, flavor profile, and why it’s enjoyable (mention any pantry ingredients used, if applicable)
- "ingredients": An array of objects, each with { "item": string, "amount": number or fraction (e.g., 0.5, 1.25), "unit": string (e.g., "cup", "tsp", "oz") }; if pantry ingredients are provided, include as many as possible with appropriate quantities, supplemented by additional ingredients as needed
- "steps": An array of detailed, step-by-step instructions (each step as a string, numbered implicitly by order); if pantry ingredients are used, highlight their use in the steps
- "servings": Number of servings (must match ${servingSize})
- "prepTime": Preparation time in minutes (e.g., 15)
- "cookTime": Cooking time in minutes (e.g., 30)
- "difficulty": Difficulty level (must match ${difficulty})
- "dietaryInfo": Array of applicable labels (e.g., ["vegetarian", "gluten-free"]) or ["none"] if no restrictions apply
- "nutritionalInfo": Object with approximate per-serving values: { "calories": number, "protein": number (g), "fat": number (g), "carbs": number (g) }

Format the response as a JSON object with a "recipes" array containing ${recipeCount} recipe objects. If ${recipeCount} > 1, ensure each recipe varies significantly in flavor, taste, and culinary cuisine (e.g., Italian, Mexican, Indian), while still incorporating the pantry ingredients (if provided) across the recipes. Validate that all recipes comply with the specified dietary restrictions, serving size, and difficulty level. If pantry ingredients are provided, prioritize their use in the recipes; if none are provided, create recipes freely based on the other inputs.`

  try {
    console.log(`Starting recipe generation`)

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:"You are a world-class professional chef with expertise in a wide range of global cuisines, adept at crafting detailed, accurate, and creative recipes tailored to specific requirements. Your goal is to generate recipes that are flavorful, practical, and appealing, while strictly adhering to the user’s dietary restrictions, serving size, difficulty preferences, and any specified pantry or fridge ingredients. If the user provides a list of ingredients they want to use, incorporate as many of those ingredients as possible into each recipe, ensuring they are central to the dish while supplementing with additional ingredients as needed. If no ingredients are provided, create recipes from scratch based on the other inputs. When generating multiple recipes, ensure each recipe is distinct in flavor profile, culinary style, and cultural inspiration to provide variety. Provide all measurements in imperial units (e.g., cups, teaspoons, ounces) with precise, realistic quantities suitable for cooking. Return all responses in valid JSON format with a 'recipes' array, designed for seamless integration into an API. Include error-free, consistent data for all requested fields, and avoid vague or impractical instructions.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    })

    const generatedRecipes = JSON.parse(response.choices[0].message.content)

    console.log(`Finished recipe generation: ${JSON.stringify(generatedRecipes)}`)

    return generatedRecipes.recipes.map((recipeData) => {
      const recipe = new Recipe(recipeData)
      recipe.validate()
      return recipe
    })
  } catch (error) {
    console.error("Error generating recipes:", error)
    throw new Error("Failed to generate recipes")
  }
}

const openAIGenerateRecipes = async (prompt) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    })
    
    // Parse the response and convert to Recipe objects
    const content = response.choices[0].message.content
    return parseRecipesFromResponse(content)
  } catch (error) {
    console.error("Error generating recipes with OpenAI:", error)
    throw error
  }
}

const parseRecipesFromResponse = () => {
  
}
