# Reddit API Setup for Painting Inspiration

This guide will help you set up Reddit API access for the painting inspiration feature.

## Prerequisites

1. Reddit account
2. Basic understanding of API keys and environment variables

## Setup Steps

### 1. Create Reddit Application

1. Go to https://www.reddit.com/prefs/apps
2. Click "Create App" or "Create Another App"
3. Fill in the form:
   - **Name**: BattlePlan Painting Inspiration
   - **App type**: Select "script" (for personal use)
   - **Description**: AI-assisted painting inspiration search
   - **About URL**: Leave blank or add your website
   - **Redirect URI**: Leave blank for script apps

### 2. Get Your Credentials

After creating the app, you'll see:
- **Client ID**: The string under your app name (looks like: `AbCdEf12345678`)
- **Client Secret**: The "secret" field (longer string)

### 3. Update Environment Variables

In your `.env` file, update these values:

```env
# Reddit API Configuration
REDDIT_CLIENT_ID=your_actual_client_id_here
REDDIT_CLIENT_SECRET=your_actual_client_secret_here
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
```

**Important Security Notes:**
- Never commit your actual credentials to version control
- Use environment variables in production
- Consider using OAuth2 for production apps instead of password flow

### 4. Target Subreddits

The system searches these subreddits for painting inspiration:
- r/minipainting
- r/Warhammer40k
- r/ageofsigmar
- r/killteam
- r/bloodbowl
- r/necromunda
- r/warhammercompetitive

### 5. Rate Limits

- Reddit API: 100 requests per minute (free tier)
- Google Custom Search: Already configured in your environment

## How It Works

1. When a model is added to the painting table, the system automatically searches Reddit
2. Search queries combine model name and game name for better results
3. Images are extracted from Reddit posts, including galleries and Imgur links
4. Results are cached to avoid repeated API calls
5. Fallback to Google Custom Search if Reddit doesn't return enough results

## Troubleshooting

### Common Issues

1. **"Failed to get access token"**
   - Check your credentials are correct
   - Ensure app type is set to "script"
   - Verify username/password are correct

2. **"Rate limit exceeded"**
   - Reddit limits to 100 requests/minute
   - System includes delays to respect limits
   - Wait a few minutes and try again

3. **"No images found"**
   - Model/game combination might be too specific
   - System will try multiple search variations
   - Consider adding more subreddits to the target list

### Testing the API

You can test your setup by:
1. Adding a model to your painting table
2. The inspiration modal should appear automatically
3. Check browser console for any error messages

## API Endpoints

The system uses these endpoints:
- `/api/painting-inspiration?modelName=ModelName&gameName=GameName`

## Support

If you encounter issues:
1. Check browser developer console for errors
2. Verify all environment variables are set
3. Ensure Reddit credentials are valid
4. Check Vercel function logs for detailed errors