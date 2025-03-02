import OpenAI from "openai"
import { Recipe } from "../models/Recipe.js"

export const generateRecipes = async (dishType, preferences = {}) => {
  const dietaryRestrictions = preferences.dietary || []
  const servingSize = preferences.servings || 4
  const difficulty = preferences.difficulty || "any"
  const recipeCount = preferences.recipeCount

  const prompt = `Generate ${recipeCount} unique recipes for ${dishType}.
      Dietary restrictions: ${dietaryRestrictions.join(", ") || "none"}
      Serving size: ${servingSize} people
      Difficulty level: ${difficulty}
      
      Include for each recipe (fieldName):
      - Title (title)
      - Description (2-3 sentences about the dish's origin, flavors, and appeal) (description)
      - List of ingredients with precise measurements (ingredients)
      - Detailed step-by-step instructions (steps)
      - Number of servings (servings)
      - Preparation time (prepTime)
      - Cooking time (cookTime)
      - Difficulty level (easy, medium, hard) (difficulty)
      - Dietary information (vegetarian, vegan, gluten-free, etc.) (dietaryInfo)
      - Basic nutritional information per serving (nutritionalInfo)
      
      Format as JSON with a 'recipes' array.
      The ingredients array will be returned with objects for each ingredient in the following format: { item, amount, unit }
      `;

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    console.log(`Starting recipe generation`)

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional chef specialized in creating detailed, accurate recipes. Provide measurements in imperial units. You are providing this recipe in JSON format that is to be used by an API.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    console.log(`Finished recipe generation`)

    const generatedRecipes = JSON.parse(response.choices[0].message.content);

    return generatedRecipes.recipes.map((recipeData) => {
      const recipe = new Recipe(recipeData);
      recipe.validate();
      return recipe;
    });
  } catch (error) {
    console.error("Error generating recipes:", error);
    throw new Error("Failed to generate recipes");
  }
};
