import Anthropic from '@anthropic-ai/sdk';

export const sendAnthropicPrompt = async (prompt, apiKey) => {
  const anthropic = new Anthropic({
    apiKey: apiKey
  });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: "You are a world-class professional chef with expertise in a wide range of global cuisines, adept at crafting detailed, accurate, and creative recipes tailored to specific requirements. Your goal is to generate recipes that are flavorful, practical, and appealing, while strictly adhering to the user's dietary restrictions, serving size, difficulty preferences, and any specified pantry or fridge ingredients. If the user provides a list of ingredients they want to use, incorporate as many of those ingredients as possible into each recipe, ensuring they are central to the dish while supplementing with additional ingredients as needed. If no ingredients are provided, create recipes from scratch based on the other inputs. When generating multiple recipes, ensure each recipe is distinct in flavor profile, culinary style, and cultural inspiration to provide variety. Provide all measurements in imperial units (e.g., cups, teaspoons, ounces) with precise, realistic quantities suitable for cooking. Return all responses in valid JSON format with a 'recipes' array, designed for seamless integration into an API. Do not return in markdown, I would like an actual JSON that could be retrieved from your response using JSON.parse(). Include error-free, consistent data for all requested fields, and avoid vague or impractical instructions. Do not return any additional information in your response.",
    messages: [
      { role: 'user', content: prompt }
    ],
    temperature: 0.7 // Adding temperature instead of response_format
  });

  // console.log(`Response: ${JSON.stringify(response.content[0].text)}`)
  return JSON.parse(response.content[0].text);
};