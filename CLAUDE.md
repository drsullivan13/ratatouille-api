# Ratatouille API Development Guidelines

## Commands
- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm run lint` - Run ESLint on all files

## Project Structure
- Node.js API using Express framework
- ES Modules only (`type: "module"` in package.json)
- MVC architecture: controllers, models, services, routes

## Code Style Guidelines

### Imports/Exports
- Use ES Module syntax (`import`/`export`)
- Named exports preferred for utility functions
- Default exports for router files

### Formatting
- 2-space indentation
- Single quotes for JS strings
- Double quotes within JSON
- No trailing commas

### Naming Conventions
- camelCase for variables, functions, methods
- PascalCase for classes (Recipe, CacheService)
- Files named after their primary export

### Error Handling
- Try/catch blocks in controllers and services
- Centralized error handler middleware
- Consistent error response format
- Console.error for logging errors

### API Design
- RESTful principles
- Resource-based routing
- Request validation in middleware
- Centralized rate limiting
- Cache responses when appropriate