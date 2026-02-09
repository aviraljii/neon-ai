# Neon AI - Setup and Configuration Guide

## Overview

Neon AI is a smart shopping assistant that analyzes and compares clothing products from e-commerce websites (Amazon, Flipkart, Myntra, Meesho) using AI-powered recommendations.

## Prerequisites

- Node.js 18+
- MongoDB connection (local or cloud)
- Groq API key (free tier available)

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

The project includes:
- Next.js 16 (App Router)
- React 19
- MongoDB with Mongoose
- Groq API integration
- shadcn/ui components
- Tailwind CSS

### 2. Setup Environment Variables

Create a `.env.local` file in the root directory and add:

```
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# Groq API (Required)
GROQ_API_KEY=your_groq_api_key

# Optional: Model configuration
GROQ_MODEL=mixtral-8x7b-32768
```

#### Getting a Groq API Key

1. Go to https://console.groq.com
2. Sign up for a free account
3. Create an API key
4. Copy the key and paste it into your `.env.local` file

### 3. Database Setup

#### Option A: Local MongoDB
```bash
# Install MongoDB locally and start the service
mongod
```

Then set `MONGODB_URI=mongodb://localhost:27017/neon-ai`

#### Option B: MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a cluster
4. Get your connection string
5. Replace the password and database name
6. Add the connection string to `.env.local`

### 4. Run the Application

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Project Structure

```
/app
  /api
    /chat          - AI chat API endpoint
    /analyze       - Product analysis endpoint
    /history       - Query history endpoint
    /wishlist      - Wishlist management endpoint
  /chat            - Chat interface page
  /dashboard       - User dashboard
  /wishlist        - Wishlist page
  page.tsx         - Landing page

/components
  /chat            - Chat UI components
  /product         - Product-related components
  /ui              - shadcn/ui components

/lib
  /ai              - AI service and prompts
  db.ts            - Database connection

/models
  - User.ts        - User schema
  - Product.ts     - Product schema
  - Query.ts       - Query history schema
  - Wishlist.ts    - Wishlist schema
```

## Key Features

### 1. Product Analysis
Users can paste a product link and get:
- Price analysis
- Fabric quality assessment
- Comfort level evaluation
- Value for money score
- Pros and cons
- Honest verdict

### 2. Product Comparison
Compare 2-3 products side by side:
- Best budget option
- Best quality option
- Best overall choice
- Detailed comparisons

### 3. Budget Recommendations
Get suggestions based on:
- Available budget in ₹
- Product category
- Occasion
- Platform recommendations

### 4. AI Behavior

Neon AI follows these rules:
- Always replies in clear, simple English
- Friendly and helpful tone
- Honest recommendations (never makes up fake ratings)
- Explains why products are good or not
- Keeps answers structured and easy to read
- Admits when information is limited

## API Endpoints

### POST /api/chat
Send a message and get an AI response

**Request:**
```json
{
  "message": "What's a good budget option for casual wear?",
  "chatHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response:**
```json
{
  "response": "AI response here...",
  "success": true
}
```

### POST /api/analyze
Analyze a specific product

**Request:**
```json
{
  "productLink": "https://example.com/product",
  "budget": 1500,
  "fabric": "cotton",
  "occasion": "casual"
}
```

### GET /api/history
Get user's search history

### POST /api/wishlist
Manage wishlist items

## Troubleshooting

### "GROQ_API_KEY is not configured"
- Check that `.env.local` file exists in the root directory
- Verify the `GROQ_API_KEY` variable is set
- Make sure there are no extra spaces or quotes around the key
- Restart the development server after adding env variables

### MongoDB Connection Error
- Verify MongoDB is running (if using local)
- Check the connection string is correct
- Ensure firewall allows the connection
- For MongoDB Atlas, add your IP to the whitelist

### AI Responses are Slow
- Groq API free tier has rate limits
- Try again after a short delay
- Consider upgrading to a paid plan if needed

## Customization

### Change AI Model
Edit `/app/api/chat/route.ts`:
```typescript
model: process.env.GROQ_MODEL || 'mixtral-8x7b-32768'
```

Available models:
- `mixtral-8x7b-32768` (default, fast and powerful)
- `llama2-70b-4096` (larger, slower)
- `gemma-7b-it` (smaller, faster)

### Customize Colors
Edit `app/globals.css` and `tailwind.config.ts` to change the dark theme colors.

### Add Features
The modular structure allows easy addition of:
- New API endpoints in `/app/api/`
- New pages in `/app/`
- New components in `/components/`

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Go to https://vercel.com
3. Connect your GitHub repository
4. Add environment variables in Vercel dashboard
5. Deploy

### Environment Variables on Vercel
Add these in the Vercel project settings:
- `MONGODB_URI`
- `GROQ_API_KEY`
- `GROQ_MODEL` (optional)

## Support

For issues:
1. Check the troubleshooting section above
2. Review console logs in browser DevTools
3. Check server logs in terminal
4. Verify all environment variables are set correctly

## License

This project is open source and available for educational and commercial use.
