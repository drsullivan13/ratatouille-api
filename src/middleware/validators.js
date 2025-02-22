export function validateRecipeRequest(req, res, next) {
    const { dishType } = req.body
  
    if (!dishType) {
      return res.status(400).json({ error: 'Dish type is required' })
    }
  
    next()
  }