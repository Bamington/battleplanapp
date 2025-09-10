// Vercel serverless function for painting inspiration search
import https from 'https';
import { URLSearchParams } from 'url';

// Reddit API configuration
const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;
const REDDIT_USERNAME = process.env.REDDIT_USERNAME;
const REDDIT_PASSWORD = process.env.REDDIT_PASSWORD;

// Google Custom Search configuration
const GOOGLE_API_KEY = process.env.VITE_GOOGLE_SEARCH_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.VITE_GOOGLE_SEARCH_ENGINE_ID;

// Cache for access tokens
let redditAccessToken = null;
let tokenExpiry = null;

// Target subreddits for miniature painting
const TARGET_SUBREDDITS = [
  'minipainting',
  'Warhammer40k',
  'ageofsigmar',
  'killteam',
  'bloodbowl',
  'necromunda',
  'warhammercompetitive'
];

async function getRedditAccessToken() {
  // Check if we have a valid token
  if (redditAccessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return redditAccessToken;
  }

  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      grant_type: 'password',
      username: REDDIT_USERNAME,
      password: REDDIT_PASSWORD
    }).toString();

    const auth = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64');

    const options = {
      hostname: 'www.reddit.com',
      port: 443,
      path: '/api/v1/access_token',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'BattlePlanApp/1.0 by /u/yourusername'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.access_token) {
            redditAccessToken = response.access_token;
            tokenExpiry = Date.now() + (response.expires_in - 60) * 1000; // 1 minute buffer
            resolve(redditAccessToken);
          } else {
            reject(new Error('Failed to get access token: ' + data));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function searchReddit(query, subreddit = null) {
  const accessToken = await getRedditAccessToken();
  
  return new Promise((resolve, reject) => {
    const searchPath = subreddit 
      ? `/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=true&sort=relevance&limit=10`
      : `/search.json?q=${encodeURIComponent(query)}&sort=relevance&limit=10`;

    const options = {
      hostname: 'oauth.reddit.com',
      port: 443,
      path: searchPath,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'BattlePlanApp/1.0 by /u/yourusername'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function searchGoogleCustomSearch(query) {
  if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
    return { items: [] };
  }

  return new Promise((resolve, reject) => {
    const searchQuery = encodeURIComponent(query);
    const path = `/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${searchQuery}&searchType=image&num=10`;

    const options = {
      hostname: 'www.googleapis.com',
      port: 443,
      path: path,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

function extractImagesFromRedditPosts(redditResponse) {
  const images = [];
  
  if (redditResponse.data && redditResponse.data.children) {
    for (const post of redditResponse.data.children) {
      const postData = post.data;
      
      // Skip if no image or is video
      if (!postData.url || postData.is_video) continue;
      
      // Check for direct image URLs
      if (postData.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        images.push({
          url: postData.url,
          title: postData.title,
          source: 'reddit',
          subreddit: postData.subreddit,
          author: postData.author,
          score: postData.score,
          thumbnail: postData.thumbnail !== 'self' ? postData.thumbnail : null
        });
      }
      
      // Check for Reddit gallery posts
      if (postData.is_gallery && postData.media_metadata) {
        for (const [mediaId, media] of Object.entries(postData.media_metadata)) {
          if (media.s && media.s.u) {
            images.push({
              url: media.s.u.replace(/&amp;/g, '&'),
              title: postData.title,
              source: 'reddit',
              subreddit: postData.subreddit,
              author: postData.author,
              score: postData.score,
              thumbnail: media.p ? media.p[0]?.u?.replace(/&amp;/g, '&') : null
            });
          }
        }
      }
      
      // Check for Imgur links
      if (postData.url.includes('imgur.com') && !postData.url.includes('/a/')) {
        const imgurUrl = postData.url.replace('imgur.com', 'i.imgur.com');
        if (!imgurUrl.match(/\.(jpg|jpeg|png|gif)$/i)) {
          images.push({
            url: imgurUrl + '.jpg',
            title: postData.title,
            source: 'reddit',
            subreddit: postData.subreddit,
            author: postData.author,
            score: postData.score,
            thumbnail: postData.thumbnail !== 'self' ? postData.thumbnail : null
          });
        }
      }
    }
  }
  
  return images;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { modelName, gameName } = req.query;
    
    if (!modelName || !gameName) {
      return res.status(400).json({ error: 'modelName and gameName are required' });
    }

    const searchQueries = [
      `${modelName} ${gameName} painted`,
      `${modelName} paint scheme`,
      `${modelName} miniature painting`
    ];

    const allImages = [];
    
    // Search Reddit first
    for (const query of searchQueries) {
      try {
        // Search across multiple subreddits
        for (const subreddit of TARGET_SUBREDDITS.slice(0, 3)) { // Limit to 3 subreddits to avoid rate limits
          const redditResults = await searchReddit(query, subreddit);
          const images = extractImagesFromRedditPosts(redditResults);
          allImages.push(...images);
          
          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Reddit search error for query "${query}":`, error.message);
      }
    }
    
    // If we don't have enough images from Reddit, try Google Custom Search
    if (allImages.length < 5) {
      try {
        const googleQuery = `${modelName} ${gameName} painted miniature site:coolminiornot.com OR site:dakkadakka.com`;
        const googleResults = await searchGoogleCustomSearch(googleQuery);
        
        if (googleResults.items) {
          for (const item of googleResults.items) {
            allImages.push({
              url: item.link,
              title: item.title,
              source: 'google',
              thumbnail: item.image?.thumbnailLink,
              snippet: item.snippet
            });
          }
        }
      } catch (error) {
        console.error('Google Custom Search error:', error.message);
      }
    }
    
    // Remove duplicates and limit results
    const uniqueImages = allImages.filter((img, index, self) => 
      index === self.findIndex(i => i.url === img.url)
    ).slice(0, 12);
    
    // Sort by score if available (Reddit posts)
    uniqueImages.sort((a, b) => (b.score || 0) - (a.score || 0));

    return res.status(200).json({
      success: true,
      images: uniqueImages,
      total: uniqueImages.length,
      searchQueries
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}