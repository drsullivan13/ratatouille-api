# Ratatouille API

An Express.js API for generating detailed recipes using multiple Large Language Models (LLMs).

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
- Copy .env.example to .env
- Add your OpenAI API key (for fallback)

3. Development:
```bash
npm run dev
```

4. Deploy to Vercel:
```bash
vercel
```

## API Endpoints

### Generate Recipes
`POST /api/recipes/generate`

Request body:
```json
{
  "dishType": "pasta carbonara",
  "preferences": {
    "dietary": ["vegetarian"],
    "servings": 4,
    "difficulty": "easy",
    "recipeCount": 2,
    "pantryIngredients": ["eggs", "cheese", "pasta"]
  },
  "llmConfig": {
    "model": "openai",
    "apiKey": "your-api-key-here"
  }
}
```

#### Request Parameters

**Required**:
- `dishType`: The type of dish you want to generate recipes for

**Optional**:
- `preferences`: Object containing preference options
  - `dietary`: Array of dietary restrictions (e.g., "vegetarian", "vegan", "gluten-free")
  - `servings`: Number of servings (default: 4)
  - `difficulty`: Difficulty level ("easy", "medium", or "hard")
  - `recipeCount`: Number of recipes to generate
  - `pantryIngredients`: Array of ingredients to include in the recipes

- `llmConfig`: Object containing LLM configuration
  - `model`: LLM model to use (one of: "openai", "anthropic", "grok", "perplexity")
  - `apiKey`: Your API key for the selected model (required for all models except openai when using the system's OpenAI key)

#### Supported LLM Models

The API supports the following LLM models:

1. **OpenAI** (`"model": "openai"`)
   - Uses GPT-4o-mini model
   - Falls back to system API key if none provided

2. **Anthropic** (`"model": "anthropic"`)
   - Uses Claude 3.5 Sonnet model
   - Requires `apiKey` to be provided

3. **Grok** (`"model": "grok"`)
   - Uses grok-3 model
   - Requires `apiKey` to be provided

4. **Perplexity** (`"model": "perplexity"`)
   - Uses llama-3-70b-instruct model
   - Requires `apiKey` to be provided

### Cache Statistics
`GET /api/recipes/cache-stats`

## Features
- Recipe generation with multiple LLM options
- User-provided API keys for flexibility
- Express.js MVC architecture
- In-memory caching (except for user-provided API keys)
- Rate limiting
- Input validation
- Error handling
- Security middleware