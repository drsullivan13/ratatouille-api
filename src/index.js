import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import recipeRoutes from './routes/recipeRoutes.js'
import { errorHandler } from './middleware/errorHandler.js'
import { rateLimiter } from './middleware/rateLimiter.js'

if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not defined in environment variables');
    process.exit(1);
  }

const app = express()
const PORT = process.env.PORT || 3000

app.set('trust proxy', 1)

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(rateLimiter)

// Routes
app.get('/', (req, res) => {
  res.json({ status: 'API is running' })
})
app.use('/api/recipes', recipeRoutes)

// Error handling
app.use(errorHandler)

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  });