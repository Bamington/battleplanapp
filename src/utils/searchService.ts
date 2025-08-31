import { getUserLocation, getGoogleLocationParams } from './locationService'

interface SearchResult {
  title: string
  link: string
  snippet?: string
  displayLink: string
  price?: string
  availability?: 'in_stock' | 'out_of_stock' | 'limited' | 'unknown'
  storeName?: string
  condition?: 'new' | 'used' | 'refurbished'
  currency?: string
  shipping?: string
}

function extractPrice(text: string): string | undefined {
  // Enhanced price patterns optimized for general search results
  const pricePatterns = [
    // Direct currency formats: $99.95, $1,299.00
    /\$\d{1,4}(?:,\d{3})*(?:\.\d{2})?/g,
    // Price with AUD: 99.95 AUD, AUD 99.95, $99 AUD
    /(?:AUD\s*)?[\$]?\d{1,4}(?:,\d{3})*(?:\.\d{2})?\s*AUD/gi,
    // Price keywords: "Price $99", "From $99", "Only $99", "Buy for $99"
    /(?:price|from|starting|was|now|only|buy\s+for|costs?)[:\s]+[\$]?\d{1,4}(?:,\d{3})*(?:\.\d{2})?/gi,
    // Sale formats: "$299 (was $399)", "$99 - down from $149"
    /\$\d{1,4}(?:,\d{3})*(?:\.\d{2})?\s*(?:\(was|\-\s*down\s+from|was\s+\$|\(save)/gi,
    // Price ranges: "$99-$149", "$99 to $149" 
    /\$\d{1,4}(?:,\d{3})*(?:\.\d{2})?\s*(?:-|to)\s*\$\d{1,4}(?:,\d{3})*(?:\.\d{2})?/gi,
    // Standalone numbers with context (be more restrictive)
    /(?:cost|price|buy|purchase|sale)\D*(\$?\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/gi,
    // Other currencies for completeness
    /[£€¥₹]\d{1,4}(?:,\d{3})*(?:\.\d{2})?/g
  ]

  for (const pattern of pricePatterns) {
    const matches = text.match(pattern)
    if (matches && matches.length > 0) {
      // Get the first match and clean it up
      let price = matches[0].trim()
      
      // Extract the actual price part
      const cleanPrice = price.match(/[\$£€¥₹]?\d{1,4}(?:,\d{3})*(?:\.\d{2})?/)
      if (cleanPrice) {
        let finalPrice = cleanPrice[0]
        
        // Add $ if no currency symbol and it looks like a reasonable price
        if (!/^[\$£€¥₹]/.test(finalPrice)) {
          const numPrice = parseFloat(finalPrice.replace(/,/g, ''))
          // Only add $ if it's a reasonable product price (between $1 and $10000)
          if (numPrice >= 1 && numPrice <= 10000) {
            finalPrice = '$' + finalPrice
          } else {
            continue // Skip unreasonable prices
          }
        }
        
        // Validate the price is reasonable
        const numValue = parseFloat(finalPrice.replace(/[^\d.]/g, ''))
        if (numValue >= 1 && numValue <= 10000) {
          return finalPrice
        }
      }
    }
  }
  return undefined
}

function extractAvailability(text: string): 'in_stock' | 'out_of_stock' | 'limited' | 'unknown' {
  const lowerText = text.toLowerCase()
  
  // Out of stock indicators
  const outOfStockTerms = [
    'out of stock', 'sold out', 'unavailable', 'not available', 
    'temporarily unavailable', 'back order', 'discontinued',
    'not in stock', 'currently unavailable'
  ]
  
  // In stock indicators
  const inStockTerms = [
    'in stock', 'available', 'ships', 'delivery available',
    'add to cart', 'buy now', 'order now', 'get it by',
    'click & collect', 'ready for pickup', 'same day delivery'
  ]
  
  // Limited stock indicators
  const limitedTerms = [
    'limited', 'few left', 'hurry', 'only', 'last chance',
    'while supplies last', 'limited quantity', 'almost gone',
    'low stock', 'selling fast'
  ]
  
  if (outOfStockTerms.some(term => lowerText.includes(term))) {
    return 'out_of_stock'
  }
  if (inStockTerms.some(term => lowerText.includes(term))) {
    return 'in_stock'
  }
  if (limitedTerms.some(term => lowerText.includes(term))) {
    return 'limited'
  }
  return 'unknown'
}

function extractStoreName(displayLink: string): string {
  // Convert domain to readable store name
  const storeNames: { [key: string]: string } = {
    'amazon.com': 'Amazon',
    'amazon.com.au': 'Amazon Australia',
    'amazon.ca': 'Amazon Canada',
    'amazon.co.uk': 'Amazon UK',
    'ebay.com': 'eBay',
    'ebay.com.au': 'eBay Australia',
    'walmart.com': 'Walmart',
    'target.com': 'Target',
    'target.com.au': 'Target Australia',
    'bestbuy.com': 'Best Buy',
    'jbhifi.com.au': 'JB Hi-Fi',
    'bunnings.com.au': 'Bunnings',
    'bigw.com.au': 'Big W',
    'kmart.com.au': 'Kmart',
    'woolworths.com.au': 'Woolworths',
    'coles.com.au': 'Coles',
    'officeworks.com.au': 'Officeworks',
    'costco.com': 'Costco',
    'homedepot.com': 'Home Depot',
    'lowes.com': "Lowe's",
    'newegg.com': 'Newegg',
    'shopping.google.com': 'Google Shopping',
    'etsy.com': 'Etsy',
    'overstock.com': 'Overstock'
  }

  const domain = displayLink.toLowerCase()
  return storeNames[domain] || displayLink.replace('www.', '').split('.')[0]
}

function enhanceSearchResult(result: SearchResult): SearchResult {
  const fullText = `${result.title} ${result.snippet || ''}`
  
  return {
    ...result,
    price: extractPrice(fullText),
    availability: extractAvailability(fullText),
    storeName: extractStoreName(result.displayLink),
    // Prioritize results that appear to be product pages
    ...detectProductPage(result.link, result.title)
  }
}

function detectProductPage(url: string, title: string): Partial<SearchResult> {
  const lowerUrl = url.toLowerCase()
  const lowerTitle = title.toLowerCase()
  
  // Product page indicators by retailer
  const productPageIndicators = {
    'amazon.com.au': ['/dp/', '/gp/product/', '/product/'],
    'ebay.com.au': ['/itm/', '/p/', '/product/'],
    'target.com.au': ['/p/', '/product/'],
    'jbhifi.com.au': ['/product/', '/p/'],
    'bunnings.com.au': ['/p/', '/product/'],
    'officeworks.com.au': ['/p/', '/product/'],
    'bigw.com.au': ['/product/', '/p/'],
    'kmart.com.au': ['/product/', '/p/']
  }
  
  // Check if this is a product page vs search page
  const isProductPage = Object.entries(productPageIndicators).some(([domain, indicators]) => {
    if (lowerUrl.includes(domain)) {
      return indicators.some(indicator => lowerUrl.includes(indicator))
    }
    return false
  })
  
  // Search page indicators (lower priority)
  const isSearchPage = [
    '/search', '/s?', '?q=', '?search=', '/results'
  ].some(indicator => lowerUrl.includes(indicator))
  
  const enhancements: Partial<SearchResult> = {}
  
  // If it's a search page, modify the title to indicate this
  if (isSearchPage && !isProductPage) {
    enhancements.title = `${title} (Search Results)`
  }
  
  // If it looks like a product page, try to extract more specific info
  if (isProductPage) {
    // Product pages often have price in title
    const titlePrice = extractPrice(title)
    if (titlePrice) {
      enhancements.price = titlePrice
    }
  }
  
  return enhancements
}

function isRelevantToQuery(result: SearchResult, originalQuery: string): boolean {
  const queryWords = originalQuery.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2) // Ignore short words like "a", "an", "the"
    .filter(word => !['and', 'or', 'for', 'with', 'buy', 'shop', 'store', 'price'].includes(word)) // Filter common shopping words
  
  if (queryWords.length === 0) {
    return true // If no meaningful words, don't filter
  }
  
  const searchableText = `${result.title} ${result.snippet || ''}`.toLowerCase()
  
  // Check if at least one significant word from the original query appears in the result
  const hasRelevantWord = queryWords.some(word => {
    // Exact word match
    if (searchableText.includes(word)) {
      return true
    }
    
    // Partial match for longer words (6+ characters)
    if (word.length >= 6) {
      const partialWord = word.substring(0, Math.max(4, word.length - 2))
      return searchableText.includes(partialWord)
    }
    
    return false
  })
  
  // Also check for brand names or model numbers that might be in the query
  const hasProductIdentifiers = queryWords.some(word => {
    // Look for numbers (model numbers, years)
    if (/\d/.test(word) && searchableText.includes(word)) {
      return true
    }
    
    // Look for capitalized words (brand names) - case insensitive
    if (word.match(/^[A-Z]/i) && searchableText.includes(word)) {
      return true
    }
    
    return false
  })
  
  return hasRelevantWord || hasProductIdentifiers
}

export async function searchGoogle(query: string): Promise<SearchResult[]> {
  const API_KEY = import.meta.env.VITE_GOOGLE_SEARCH_API_KEY

  if (!API_KEY) {
    console.warn('Google API key not found, using mock results')
    return await getMockResults(query)
  }

  try {
    // Get user location for localized results
    const locationData = await getUserLocation()
    const locationParams = getGoogleLocationParams(locationData)
    
    // Use Custom Search API with shopping-focused parameters
    const SEARCH_ENGINE_ID = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID
    if (!SEARCH_ENGINE_ID) {
      console.warn('Search Engine ID not found, using mock results')
      return await getMockResults(query)
    }
    
    // Try multiple search strategies with fallbacks - prioritize Strategy 3 since it works
    const searchStrategies = [
      // Strategy 1: Enhanced version of working Strategy 3 with more price-focused terms
      () => `${query} price "$" buy shop store australia "in stock"`,
      // Strategy 2: Original working Strategy 3
      () => `${query} price buy shop store australia`,
      // Strategy 3: Broader terms 
      () => `${query} buy australia shop`,
      // Strategy 4: Simple query
      () => `${query} buy`
    ]

    let searchQuery = searchStrategies[0]()
    let url = ''
    let response: Response
    let data: any

    // Try each strategy until we get results
    for (let i = 0; i < searchStrategies.length; i++) {
      searchQuery = searchStrategies[i]()
      const baseUrl = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(searchQuery)}&num=10`
      url = locationParams ? `${baseUrl}&${locationParams}` : baseUrl
      
      console.log(`Trying search strategy ${i + 1}:`, searchQuery)
      console.log('Search URL:', url)
    
      try {
        response = await fetch(url)
        
        console.log(`Strategy ${i + 1} Response Status:`, response.status)
        
        if (!response.ok) {
          console.log(`Strategy ${i + 1} failed with status ${response.status}`)
          continue // Try next strategy
        }

        data = await response.json()
        console.log(`Strategy ${i + 1} Response:`, data)
        
        if (data.items && data.items.length > 0) {
          console.log(`Strategy ${i + 1} succeeded! Found ${data.items.length} results`)
          console.log('First item:', data.items[0])
          
          // Filter results to ensure relevance to the original query
          const relevantResults = data.items
            .map((item: any) => enhanceSearchResult({
              title: item.title,
              link: item.link,
              snippet: item.snippet,
              displayLink: item.displayLink
            }))
            .filter((result: SearchResult) => isRelevantToQuery(result, query))
          
          console.log(`Filtered to ${relevantResults.length} relevant results`)
          
          if (relevantResults.length > 0) {
            return relevantResults
          } else {
            console.log(`No relevant results found, trying next strategy...`)
          }
        } else {
          console.log(`Strategy ${i + 1} returned no items, trying next strategy...`)
        }
      } catch (error) {
        console.error(`Strategy ${i + 1} error:`, error)
        continue // Try next strategy
      }
    }

    // If all strategies failed
    console.log('All search strategies failed, using mock results')
    return await getMockResults(query)
  } catch (error) {
    console.error('Google Shopping API error:', error)
    console.log('Using mock results due to API error')
    // Fallback to mock results on error
    return await getMockResults(query)
  }
}

function extractDomainFromUrl(url: string): string {
  try {
    const domain = new URL(url).hostname
    return domain.replace('www.', '')
  } catch {
    return 'unknown'
  }
}

function extractStoreNameFromLink(url: string): string {
  const domain = extractDomainFromUrl(url)
  return extractStoreName(domain)
}

function formatPrice(priceObj: any): string | undefined {
  if (!priceObj || !priceObj.value) return undefined
  const currency = priceObj.currency || 'AUD'
  const symbol = getCurrencySymbol(currency)
  return `${symbol}${priceObj.value}`
}

function getCurrencySymbol(currency: string): string {
  const symbols: { [key: string]: string } = {
    'AUD': '$',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'CAD': '$',
    'NZD': '$'
  }
  return symbols[currency] || currency + ' '
}

function mapAvailability(availability: string): 'in_stock' | 'out_of_stock' | 'limited' | 'unknown' {
  if (!availability) return 'unknown'
  const lower = availability.toLowerCase()
  
  if (lower.includes('in stock') || lower === 'available') return 'in_stock'
  if (lower.includes('out of stock') || lower === 'out_of_stock') return 'out_of_stock'
  if (lower.includes('limited') || lower === 'limited_availability') return 'limited'
  
  return 'unknown'
}

function formatShipping(shippingObj: any): string | undefined {
  if (!shippingObj) return undefined
  if (shippingObj.price === '0' || shippingObj.price === 0) return 'Free shipping'
  if (shippingObj.price && shippingObj.currency) {
    const symbol = getCurrencySymbol(shippingObj.currency)
    return `${symbol}${shippingObj.price} shipping`
  }
  return undefined
}

async function getMockResults(query: string): Promise<SearchResult[]> {
  const mockResults: SearchResult[] = [
      {
        title: `${query} - $69.95 - Amazon.com.au`,
        link: `https://amazon.com.au/s?k=${encodeURIComponent(query)}`,
        snippet: `Shop for ${query} with fast, free delivery on Prime orders. In stock and ready to ship. $69.95 AUD`,
        displayLink: 'amazon.com.au',
        price: '$69.95',
        availability: 'in_stock',
        storeName: 'Amazon Australia'
      },
      {
        title: `${query} for sale | eBay Australia`,
        link: `https://ebay.com.au/sch/i.html?_nkw=${encodeURIComponent(query)}`,
        snippet: `Find great deals on ${query}. New and used items, auction style and Buy It Now listings. Starting at $49.95`,
        displayLink: 'ebay.com.au',
        price: '$49.95',
        availability: 'in_stock',
        storeName: 'eBay Australia'
      },
      {
        title: `${query} - Bunnings Warehouse`,
        link: `https://bunnings.com.au/search/products?q=${encodeURIComponent(query)}`,
        snippet: `Find ${query} at Bunnings Warehouse. Lowest prices are just the beginning. Available for click & collect. $59.90`,
        displayLink: 'bunnings.com.au',
        price: '$59.90',
        availability: 'in_stock',
        storeName: 'Bunnings'
      },
      {
        title: `${query} - Target Australia`,
        link: `https://target.com.au/s?searchTerm=${encodeURIComponent(query)}`,
        snippet: `Shop Target Australia for ${query}. Free shipping on orders over $45 or free click & collect. Available for pickup. $64.00`,
        displayLink: 'target.com.au',
        price: '$64.00',
        availability: 'in_stock',
        storeName: 'Target Australia'
      },
      {
        title: `${query} - JB Hi-Fi`,
        link: `https://jbhifi.com.au/search?q=${encodeURIComponent(query)}`,
        snippet: `Shop JB Hi-Fi for ${query}. Australia's largest home entertainment retailer. Limited stock available. $79.95`,
        displayLink: 'jbhifi.com.au',
        price: '$79.95',
        availability: 'limited',
        storeName: 'JB Hi-Fi'
      },
      {
        title: `${query} Price Comparison - Google Shopping`,
        link: `https://shopping.google.com/search?q=${encodeURIComponent(query)}`,
        snippet: `Compare prices for ${query} across multiple online retailers. Find the best deals and reviews.`,
        displayLink: 'shopping.google.com'
      },
      {
        title: `${query} - Newegg.com`,
        link: `https://newegg.com/p/pl?d=${encodeURIComponent(query)}`,
        snippet: `Tech deals on ${query}. Computer hardware, electronics, and gaming gear at competitive prices.`,
        displayLink: 'newegg.com'
      },
      {
        title: `${query} deals and discounts - RetailMeNot`,
        link: `https://retailmenot.com/s/${encodeURIComponent(query)}`,
        snippet: `Find coupons and deals for ${query}. Save money with promo codes and cashback offers.`,
        displayLink: 'retailmenot.com'
      },
      {
        title: `${query} - Costco Wholesale`,
        link: `https://costco.com/CatalogSearch?dept=All&keyword=${encodeURIComponent(query)}`,
        snippet: `Quality ${query} at wholesale prices. Shop Costco for bulk savings and member benefits.`,
        displayLink: 'costco.com'
      },
      {
        title: `${query} reviews and buying guide - Consumer Reports`,
        link: `https://consumerreports.org/search/?q=${encodeURIComponent(query)}`,
        snippet: `Expert reviews and ratings for ${query}. Independent testing and buying recommendations.`,
        displayLink: 'consumerreports.org'
      }
    ]

    // Simulate API delay for mock results
    await new Promise(resolve => setTimeout(resolve, 800))
    
    return mockResults.slice(0, 10)
}