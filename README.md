# Ratatouille API

An Express.js API for generating detailed recipes using OpenAI's GPT-4.

## Setup

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Set up environment variables:
- Copy .env.example to .env
- Add your OpenAI API key

3. Development:
\`\`\`bash
npm run dev
\`\`\`

4. Deploy to Vercel:
\`\`\`bash
vercel
\`\`\`

## API Endpoints

### Generate Recipes
\`POST /api/recipes/generate\`

Request body:
\`\`\`json
{
  "dishType": "pasta carbonara",
  "preferences": {
    "dietary": ["vegetarian"],
    "servings": 4,
    "difficulty": "easy"
  }
}
\`\`\`

### Cache Statistics
\`GET /api/recipes/cache-stats\`

## Features
- Recipe generation with GPT-4
- Express.js MVC architecture
- In-memory caching
- Rate limiting
- Input validation
- Error handling
- Security middleware