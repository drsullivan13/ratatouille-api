export class Recipe {
    constructor(data) {
      this.title = data.title
      this.description = data.description
      this.ingredients = data.ingredients
      this.steps = data.steps
      this.servings = data.servings
      this.prepTime = data.prepTime
      this.cookTime = data.cookTime
      this.difficulty = data.difficulty
      this.dietaryInfo = data.dietaryInfo
      this.nutritionalInfo = data.nutritionalInfo
      this.totalTime = this.calculateTotalTime()
    }
  
    calculateTotalTime() {
      return this.prepTime + this.cookTime
    }
  
    parseTime(timeString) {
      if (!timeString) return 0
      const match = timeString.match(/(\d+)\s*(min|minutes|hrs?|hours?)/)
      if (!match) return 0
      
      const [_, value, unit] = match
      return unit.startsWith('h') ? parseInt(value) * 60 : parseInt(value)
    }
  
    validate() {
      const requiredFields = ['title', 'description', 'ingredients', 'steps', 'servings']
      for (const field of requiredFields) {
        if (!this[field]) {
          throw new Error(`Missing required field: ${field}`)
        }
      }
      
      if (!Array.isArray(this.ingredients) || !Array.isArray(this.steps)) {
        throw new Error('Ingredients and steps must be arrays')
      }
    }
  }