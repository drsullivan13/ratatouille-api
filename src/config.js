import dotenv from 'dotenv'

dotenv.config()

export const validateEnv = () => {
  const requiredEnvVars = ['OPENAI_API_KEY']
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`Required environment variable ${envVar} is missing`)
      return false
    }
  }
  
  return true
}

export const config = {
  openAiApiKey: process.env.OPENAI_API_KEY,
  port: process.env.PORT || 3000
}