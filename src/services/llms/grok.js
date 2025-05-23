import OpenAI from "openai"

export const sendGrokPrompt = async (prompt, apiKey) => {
  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.x.ai/v1'
  })

  const response = await openai.chat.completions.create({
    model: "grok-3-latest",
    messages: [
      {
        role: "system",
        content:"You are a world-class professional chef with expertise in a wide range of global cuisines, adept at crafting detailed, accurate, and creative recipes tailored to specific requirements. Your goal is to generate recipes that are flavorful, practical, and appealing, while strictly adhering to the user's dietary restrictions, serving size, difficulty preferences, and any specified pantry or fridge ingredients. If the user provides a list of ingredients they want to use, incorporate as many of those ingredients as possible into each recipe, ensuring they are central to the dish while supplementing with additional ingredients as needed. If no ingredients are provided, create recipes from scratch based on the other inputs. When generating multiple recipes, ensure each recipe is distinct in flavor profile, culinary style, and cultural inspiration to provide variety. Provide all measurements in imperial units (e.g., cups, teaspoons, ounces) with precise, realistic quantities suitable for cooking. Return all responses in valid JSON format with a 'recipes' array, designed for seamless integration into an API. Include error-free, consistent data for all requested fields, and avoid vague or impractical instructions.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
  })

  return JSON.parse(response.choices[0].message.content)
}