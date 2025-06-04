import axios from 'axios'
import * as cheerio from 'cheerio'
import fs from 'fs'
import path from 'path'

export const scrapeRecipes = async (maxRecipes = null, maxPages = 16)  => {
    const recipes = [];
    
    // Loop through all pages (1 to 16)
    for (let page = 1; page <= maxPages; page++) {
      const url = page === 1 
        ? 'https://drhyman.com/blogs/content/tagged/recipes'
        : `https://drhyman.com/blogs/content/tagged/recipes?page=${page}`;
      
      console.log(`Scraping page ${page}/${maxPages}: ${url}`);
      
      try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        
        const recipesBeforePage = recipes.length;
        // Count all potential recipe links on the page
        const totalCards = $('.card__heading a, .article-card h3 a, .card h3 a, .article-card-wrapper a[href*="/blogs/content/"]').length;
        
        // Extract recipe cards from this page, excluding Shop Supplements section
        // Try multiple selectors for recipe links
        const recipeSelectors = [
          '.card__heading a',
          '.article-card h3 a',
          '.card h3 a',
          '.article-card-wrapper a[href*="/blogs/content/"]'
        ];
        
        for (const selector of recipeSelectors) {
          $(selector).each((_, elem) => {
            const title = $(elem).text().trim();
            const link = $(elem).attr('href');
            
            // Check if this card is in the main content area, not in Shop Supplements
            const card = $(elem).closest('.card, .article-card-wrapper, .article-card');
            const cardText = card.text().toLowerCase();
            const isShopItem = cardText.includes('add to cart') || 
                             cardText.includes('shop') || 
                             cardText.includes('supplement') ||
                             cardText.includes('$') ||
                             card.find('.price, [class*="price"]').length > 0;
            
            // Only include links that go to /blogs/content/ (actual recipes) and aren't shop items
            if (title && link && link.includes('/blogs/content/') && !isShopItem) {
              // Check if we already have this recipe to avoid duplicates
              const isDuplicate = recipes.some(recipe => recipe.url === `https://drhyman.com${link}`);
              if (!isDuplicate) {
                recipes.push({ 
                  title, 
                  url: `https://drhyman.com${link}`,
                  ingredients: [],
                  instructions: [],
                  scrapedAt: new Date().toISOString()
                });
              }
            }
          });
        }
        
        const validRecipeCards = recipes.length - recipesBeforePage;
        console.log(`Page ${page}: Found ${validRecipeCards} valid recipe cards out of ${totalCards} total cards`);
        
        // Add delay between page requests to be respectful
        if (page < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`Error scraping page ${page}:`, error.message);
        continue; // Continue with next page if one fails
      }
      
      // Stop early if we've reached the max recipes limit
      if (maxRecipes && recipes.length >= maxRecipes) {
        console.log(`Reached maximum recipe limit of ${maxRecipes}`);
        break;
      }
    }
    
    // Limit recipes if maxRecipes is specified
    const recipesToScrape = maxRecipes ? recipes.slice(0, maxRecipes) : recipes;
    console.log(`Found ${recipesToScrape.length} recipes across ${maxPages} pages to scrape`);
  
    // Scrape individual recipe pages
    for (let i = 0; i < recipesToScrape.length; i++) {
      const recipe = recipesToScrape[i];
      console.log(`Scraping recipe ${i + 1}/${recipesToScrape.length}: ${recipe.title}`);
      
      try {
        const { data: pageData } = await axios.get(recipe.url);
        const $page = cheerio.load(pageData);
        
        // Extract ingredients using the specific selector from the recipe page
        const ingredients = [];
        
        // Try multiple specific selectors for ingredients
        const ingredientSelectors = [
          '#ingredients ul li',          // section#ingredients with nested ul
          '#ingredients + ul li',        // ul immediately after #ingredients h2
          '#ingredients ~ ul li',        // ul anywhere after #ingredients h2  
          'h2#ingredients + ul li',      // more specific version
          'h2[id="ingredients"] + ul li', // even more specific
          'section#ingredients ul li',   // section tag with ingredients id
          '.ingredients ul li',          // class-based selector
          '.ingredients li'              // simpler class-based
        ];
        
        // Try each selector until we find ingredients
        for (const selector of ingredientSelectors) {
          if (ingredients.length === 0) {
            $page(selector).each((_, elem) => {
              const text = $page(elem).text().trim();
              if (text) {
                ingredients.push(text);
              }
            });
            if (ingredients.length > 0) {
              console.log(`Found ${ingredients.length} ingredients using selector: ${selector}`);
            }
          }
        }
        
        // Check for multiple ingredient sections using pure HTML structure detection
        // Look for h3/h4 headings within ingredients sections that are followed by ul elements
        let foundMultipleSections = false;
        const multiSectionIngredients = [];
        
        // Method 1: Look for h3/h4 within ingredients container (like herbed mackerel)
        $page('#ingredients h3, #ingredients h4, section[id="ingredients"] h3, section[id="ingredients"] h4').each((_, headingElem) => {
          const headingText = $page(headingElem).text().trim();
          
          // Must have reasonable heading text and be followed by a ul
          if (headingText.length > 0 && headingText.length < 100) {
            let currentElem = $page(headingElem);
            
            // Look for ul immediately following this heading
            while (currentElem.next().length > 0) {
              currentElem = currentElem.next();
              const tagName = currentElem.prop('tagName');
              
              if (tagName === 'UL') {
                foundMultipleSections = true;
                multiSectionIngredients.push(`--- ${headingText} ---`);
                
                // Extract all li items from this ul
                currentElem.find('li').each((_, li) => {
                  const text = $page(li).text().trim();
                  if (text) {
                    multiSectionIngredients.push(text);
                  }
                });
                break;
              } else if (tagName === 'H2' || tagName === 'H3' || tagName === 'H4') {
                break; // Hit next heading, no ul found
              }
            }
          }
        });
        
        // Method 2: Look for h3/h4 after ingredients h2 that have ul following (like herbed mackerel)
        if (!foundMultipleSections) {
          let afterIngredientsH2 = false;
          
          $page('h2, h3, h4').each((_, elem) => {
            const tagName = $page(elem).prop('tagName');
            const text = $page(elem).text().trim();
            
            // Mark when we're past the Ingredients h2
            if (tagName === 'H2' && text.toLowerCase() === 'ingredients') {
              afterIngredientsH2 = true;
              return true; // Continue
            }
            
            // Stop if we hit Method or another major section (but keep looking)
            if (tagName === 'H2' && text.toLowerCase() !== 'ingredients') {
              if (afterIngredientsH2) {
                // We've processed the ingredients section, stop here
                return false;
              }
              return true; // Continue looking for ingredients h2
            }
            
            // If we're in the ingredients section and find h3/h4 with ul following
            if (afterIngredientsH2 && (tagName === 'H3' || tagName === 'H4') && text.length > 0 && text.length < 100) {
              let currentElem = $page(elem);
              
              while (currentElem.next().length > 0) {
                currentElem = currentElem.next();
                const nextTagName = currentElem.prop('tagName');
                
                if (nextTagName === 'UL') {
                  foundMultipleSections = true;
                  multiSectionIngredients.push(`--- ${text} ---`);
                  
                  currentElem.find('li').each((_, li) => {
                    const liText = $page(li).text().trim();
                    if (liText) {
                      multiSectionIngredients.push(liText);
                    }
                  });
                  break;
                } else if (nextTagName === 'H2' || nextTagName === 'H3' || nextTagName === 'H4') {
                  break;
                }
              }
            }
          });
        }
        
        // Replace ingredients if we found valid multi-sections
        if (foundMultipleSections && multiSectionIngredients.length > 0) {
          ingredients.length = 0;
          ingredients.push(...multiSectionIngredients);
          console.log(`Found ${ingredients.length} ingredients across multiple sections`);
        }
        
        // Additional fallback for h2-based structure (older recipe pages)
        if (ingredients.length === 0) {
          console.log('Trying h2-based ingredient detection...');
          $page('h2').each((_, h2Elem) => {
            const h2Text = $page(h2Elem).text().trim();
            if (h2Text.toLowerCase().includes('ingredients')) {
              // Look for content after the Ingredients h2
              let currentElem = $page(h2Elem);
              let foundContent = false;
              
              // Check next siblings until we find another h2 or run out of elements
              while (currentElem.next().length > 0 && !foundContent) {
                currentElem = currentElem.next();
                const tagName = currentElem.prop('tagName');
                
                // Stop if we hit another h2 (next section)
                if (tagName === 'H2') {
                  break;
                }
                
                // Extract from ul/li or p elements
                if (tagName === 'UL') {
                  currentElem.find('li').each((_, li) => {
                    const text = $page(li).text().trim();
                    if (text) {
                      ingredients.push(text);
                      foundContent = true;
                    }
                  });
                } else if (tagName === 'P') {
                  const text = currentElem.text().trim();
                  if (text && text.length > 5) {
                    ingredients.push(text);
                    foundContent = true;
                  }
                } else if (tagName === 'DIV') {
                  // Check for ul inside div
                  currentElem.find('ul li').each((_, li) => {
                    const text = $page(li).text().trim();
                    if (text) {
                      ingredients.push(text);
                      foundContent = true;
                    }
                  });
                }
              }
              
              if (foundContent) {
                console.log(`Found ${ingredients.length} ingredients using h2-based detection`);
                return false; // Stop the h2 loop
              }
            }
          });
        }
        
        // Fallback: if no ingredients found with specific selectors, try broader patterns
        if (ingredients.length === 0) {
          console.log('Using fallback ingredient detection...');
          $page('li').each((_, elem) => {
            const text = $page(elem).text().trim();
            // Look for ingredient-like patterns (contains measurements, common cooking terms)
            if (text && (
              /\d+.*(?:cup|cups|tablespoon|tablespoons|teaspoon|teaspoons|pound|pounds|ounce|ounces|clove|cloves|slice|slices)/.test(text) ||
              /\d+\s*(?:\/\d+)?\s*(?:cup|tbsp|tsp|lb|oz|g|kg|ml|l)\b/.test(text) ||
              text.includes('Salt') || text.includes('Pepper') || text.includes('Oil') ||
              /^\d+/.test(text) || // starts with a number
              // Add specific food items that might not have measurements
              /(?:chicken|beef|pork|fish|onion|garlic|bell pepper|tomato|olive oil|salt|pepper|cumin|chili|powder)/.test(text.toLowerCase())
            )) {
              ingredients.push(text);
            }
          });
          
          if (ingredients.length > 0) {
            console.log(`Found ${ingredients.length} ingredients using enhanced pattern matching`);
          }
        }
        
        // Extract instructions using the step-based structure
        const instructions = [];
        
        // Try multiple specific selectors for instructions
        const instructionSelectors = [
          '.method-step p',                    // method-step paragraphs (for chicken fajita style)
          '#method .steps .step p',            // section#method with steps structure
          '#method .step p',                   // method section with step divs
          'section#method .steps .step p',     // explicit section tag
          '.method-steps .method-step p',      // most specific method-steps
          '#method + .method-steps .method-step p', // method section structure
          'div[class*="method-step"] p',       // any div with "method-step" in class name
          '#method ~ div p',                   // any paragraph in divs following method heading
          '.step p',                           // generic step paragraphs
          '.instructions .step p',             // instructions container
          'div[class*="step"] p',              // any div with "step" in class name
          'ol li',                             // ordered list items
          '.instructions li',                  // instruction list items
          '.directions li',                    // directions list items
          '.steps li'                          // steps list items
        ];
        
        // Special case: Step h2 headers (like blueberry lemon crumble)
        // This handles recipes where each step has an h2 header
        if (instructions.length === 0) {
          console.log('Trying Step h2 header detection...');
          $page('h2').each((i, elem) => {
            const h2Text = $page(elem).text().trim();
            
            // Check if this is a step heading (Step 1, Step 2, etc.)
            if (h2Text.toLowerCase().startsWith('step ')) {
              // Look for the next div after this step h2
              let currentElem = $page(elem);
              let foundContent = false;
              
              while (currentElem.next().length > 0 && !foundContent) {
                currentElem = currentElem.next();
                const tagName = currentElem.prop('tagName');
                
                if (tagName === 'DIV') {
                  // Look for p elements inside this div, but filter out unwanted content
                  const paragraphs = currentElem.find('p');
                  if (paragraphs.length > 0) {
                    paragraphs.each((j, p) => {
                      const text = $page(p).text().trim();
                      const lowerText = text.toLowerCase();
                      
                      // Only include paragraphs that look like cooking instructions
                      if (text && text.length > 20 && text.length < 500 &&
                          !lowerText.includes('calories:') &&
                          !lowerText.includes('total fat:') &&
                          !lowerText.includes('nutritional') &&
                          !lowerText.includes('probiotic') &&
                          !lowerText.includes('code ') &&
                          !lowerText.includes('discount') &&
                          !lowerText.includes('membership') &&
                          !lowerText.includes('weather') &&
                          !lowerText.includes('temperature') &&
                          !lowerText.includes('cravings') &&
                          !lowerText.includes('studies') &&
                          // Look for positive indicators of recipe steps
                          (lowerText.includes('preheat') || lowerText.includes('mix') || 
                           lowerText.includes('combine') || lowerText.includes('add') ||
                           lowerText.includes('bake') || lowerText.includes('prepare') ||
                           lowerText.includes('continue') || lowerText.includes('top') ||
                           lowerText.includes('place') || lowerText.includes('remove') ||
                           lowerText.includes('heat') || lowerText.includes('cook') ||
                           lowerText.includes('stir') || lowerText.includes('serve'))) {
                        
                        instructions.push(text);
                      }
                    });
                    foundContent = true; // Mark as found even if we filtered out content
                    break; // Only process the first div after each step h2
                  }
                } else if (tagName === 'H2') {
                  // Hit the next step, stop looking for this step
                  break;
                }
              }
            }
          });
          
          if (instructions.length > 0) {
            console.log(`Found ${instructions.length} instructions using Step h2 header detection`);
          }
        }
        
        // Try each selector until we find instructions, with simple boundary detection
        for (const selector of instructionSelectors) {
          if (instructions.length === 0) {
            const tempInstructions = [];
            
            $page(selector).each((_, elem) => {
              const text = $page(elem).text().trim();
              
              // Simple check: stop if we encounter typical boundary content
              if (text.toLowerCase().includes('calories:') ||
                  text.toLowerCase().includes('total fat:') ||
                  text.toLowerCase().includes('nutritional analysis')) {
                return false; // Stop iterating
              }
              
              if (text && text.length > 10 && text.length < 500) {
                tempInstructions.push(text);
              }
            });
            
            if (tempInstructions.length > 0) {
              instructions.push(...tempInstructions);
              console.log(`Found ${instructions.length} instructions using selector: ${selector}`);
              break; // Stop after finding instructions with the first working selector
            }
          }
        }
        
        // Additional fallback for h2-based structure (older recipe pages)
        if (instructions.length === 0) {
          console.log('Trying h2-based instruction detection...');
          $page('h2').each((_, h2Elem) => {
            const h2Text = $page(h2Elem).text().trim();
            if (h2Text.toLowerCase().includes('method') || h2Text.toLowerCase().includes('instructions') || h2Text.toLowerCase().includes('directions')) {
              // Look for content after the Method/Instructions h2
              let currentElem = $page(h2Elem);
              let foundContent = false;
              
              // Check next siblings until we find another h2 or run out of elements
              while (currentElem.next().length > 0 && !foundContent) {
                currentElem = currentElem.next();
                const tagName = currentElem.prop('tagName');
                
                // Stop if we hit another h2 (next section)
                if (tagName === 'H2') {
                  break;
                }
                
                // Extract from ol/ul/li or p elements
                if (tagName === 'OL' || tagName === 'UL') {
                  currentElem.find('li').each((_, li) => {
                    const text = $page(li).text().trim();
                    if (text && text.length > 10) {
                      instructions.push(text);
                      foundContent = true;
                    }
                  });
                } else if (tagName === 'P') {
                  const text = currentElem.text().trim();
                  if (text && text.length > 10 && !text.toLowerCase().includes('nutritional') && !text.toLowerCase().includes('calories')) {
                    instructions.push(text);
                    foundContent = true;
                  }
                } else if (tagName === 'DIV') {
                  // Check for steps or lists inside div
                  currentElem.find('p, li').each((_, elem) => {
                    const text = $page(elem).text().trim();
                    if (text && text.length > 10 && !text.toLowerCase().includes('nutritional') && !text.toLowerCase().includes('calories')) {
                      instructions.push(text);
                      foundContent = true;
                    }
                  });
                } else if (tagName === 'H3' || tagName === 'H4') {
                  // Check for step headings (like "Step 1", "Step 2")
                  const stepText = currentElem.text().trim();
                  if (stepText.toLowerCase().includes('step')) {
                    // Look for the next paragraph or content after the step heading
                    let stepElem = currentElem;
                    while (stepElem.next().length > 0) {
                      stepElem = stepElem.next();
                      const stepTagName = stepElem.prop('tagName');
                      if (stepTagName === 'P') {
                        const text = stepElem.text().trim();
                        if (text && text.length > 10) {
                          instructions.push(text);
                          foundContent = true;
                        }
                        break;
                      } else if (stepTagName === 'H2' || stepTagName === 'H3' || stepTagName === 'H4') {
                        break; // Hit another heading
                      }
                    }
                  }
                }
              }
              
              if (foundContent) {
                console.log(`Found ${instructions.length} instructions using h2-based detection`);
                return false; // Stop the h2 loop
              }
            }
          });
        }
        
        // Enhanced fallback for h2-based step structure (like "Step 1", "Step 2")
        if (instructions.length === 0) {
          console.log('Trying h2 step-based instruction detection...');
          $page('h2').each((_, h2Elem) => {
            const h2Text = $page(h2Elem).text().trim();
            if (h2Text.toLowerCase().includes('step')) {
              // Look for the next paragraph after this step heading
              let currentElem = $page(h2Elem);
              while (currentElem.next().length > 0) {
                currentElem = currentElem.next();
                const tagName = currentElem.prop('tagName');
                
                if (tagName === 'P') {
                  const text = currentElem.text().trim();
                  if (text && text.length > 10 && 
                      !text.toLowerCase().includes('nutritional') && 
                      !text.toLowerCase().includes('newsletter') &&
                      !text.toLowerCase().includes('level up your health')) {
                    instructions.push(text);
                  }
                  break;
                } else if (tagName === 'DIV') {
                  // Look for p inside the div (common structure)
                  const divP = currentElem.find('p').first();
                  if (divP.length > 0) {
                    const text = divP.text().trim();
                    if (text && text.length > 10 && 
                        !text.toLowerCase().includes('nutritional') && 
                        !text.toLowerCase().includes('newsletter') &&
                        !text.toLowerCase().includes('level up your health')) {
                      instructions.push(text);
                    }
                    break;
                  }
                } else if (tagName === 'H2') {
                  break; // Hit next section
                }
              }
            }
          });
          
          if (instructions.length > 0) {
            console.log(`Found ${instructions.length} instructions using h2 step detection`);
          }
        }
        
        // Fallback: if no instructions found, try paragraphs that look like cooking steps
        if (instructions.length === 0) {
          console.log('Using fallback instruction detection...');
          $page('p').each((_, elem) => {
            const text = $page(elem).text().trim();
            if (text && text.length > 30 && (
              text.match(/^(\d+\.|\d+\))/i) || // Starts with number
              text.toLowerCase().includes('heat') ||
              text.toLowerCase().includes('cook') ||
              text.toLowerCase().includes('add') ||
              text.toLowerCase().includes('mix') ||
              text.toLowerCase().includes('stir') ||
              text.toLowerCase().includes('combine') ||
              text.toLowerCase().includes('whisk') ||
              text.toLowerCase().includes('serve') ||
              text.toLowerCase().includes('preheat') ||
              text.toLowerCase().includes('bake') ||
              text.toLowerCase().includes('prepare')
            )) {
              // Filter out promotional content
              if (!text.toLowerCase().includes('newsletter') &&
                  !text.toLowerCase().includes('level up your health') &&
                  !text.toLowerCase().includes('join my weekly') &&
                  !text.toLowerCase().includes('comprehensive approach')) {
                instructions.push(text);
              }
            }
          });
        }
        
        // Simple filter to remove any obviously promotional content that might slip through
        const filteredInstructions = instructions.filter(instruction => {
          const lowerText = instruction.toLowerCase();
          return instruction.length < 500 && // Filter out very long promotional paragraphs
                 !lowerText.includes('click here') &&
                 !lowerText.includes('shop now') &&
                 !lowerText.includes('code '); // Promotional codes
        });
        
        recipe.ingredients = ingredients;
        recipe.instructions = filteredInstructions;
        
        // Add a small delay to be respectful to the server
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error scraping recipe ${recipe.title}:`, error.message);
      }
    }
    
    // console.log(JSON.stringify(recipesToScrape, null, 2));
    
    // Save recipes to a JSON file
    const outputPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'scraped-recipes.json');
    fs.writeFileSync(outputPath, JSON.stringify(recipesToScrape, null, 2));
    console.log(`\nRecipes saved to: ${outputPath}`);
    console.log(`Total recipes scraped: ${recipesToScrape.length}`);
    
    return recipesToScrape;
}

// Run the scraper - you can adjust the number of recipes and pages to scrape
// scrapeRecipes(maxRecipes, maxPages)
// Examples:
// await scrapeRecipes(20, 2)  // Scrape first 20 recipes from first 2 pages
await scrapeRecipes(null, 2) // Scrape ALL recipes from all 16 pages
