# Podcast Interview Optimizer

AI-powered journalism insights to elevate your interview questions using OpenAI's GPT-4.

## Features

- **Question Analysis**: Get professional feedback on your interview questions
- **Question Generation**: Let AI generate thoughtful questions based on your audience and guest
- **Journalism Best Practices**: Learn from journalism principles applied to your questions
- **Beautiful UI**: Modern, gradient-styled interface matching MoonDesk Media branding

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure OpenAI API Key

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Get your OpenAI API key from [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

3. Edit `.env` and add your API key:
   ```
   VITE_OPENAI_API_KEY=sk-proj-...your-actual-key...
   ```

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Building for Production

### Build the App

```bash
npm run build
```

This creates a `dist` folder with all the static files ready for deployment.

### Deploy to WordPress

1. **Build the app** (see above)

2. **Upload files to WordPress**:
   - Using FTP/SFTP, upload the contents of the `dist` folder to:
     ```
     /wp-content/uploads/tools/podcast-questions-helper/
     ```
   - Or use your WordPress hosting file manager

3. **Create a WordPress page**:
   - Go to WordPress Admin → Pages → Add New
   - Set the permalink to `/tool/podcast-questions-helper`
   - Use a full-width page template (no sidebar)
   - Add this HTML to the page (in HTML/Code editor mode):

   ```html
   <div id="root"></div>
   <script type="module" crossorigin src="/wp-content/uploads/tools/podcast-questions-helper/assets/index-[hash].js"></script>
   <link rel="stylesheet" crossorigin href="/wp-content/uploads/tools/podcast-questions-helper/assets/index-[hash].css">
   ```

   **Note**: Replace `[hash]` with the actual hash from your built files in the `dist/assets` folder.

4. **Alternative - Easier Method**:
   - Install a plugin like "Insert Headers and Footers" or "Custom CSS & JS"
   - Add the script and link tags to load on that specific page
   - Or use a page builder like Elementor and embed via Custom HTML widget

### Important Notes for WordPress Deployment

- **API Key Security**: Never expose your OpenAI API key in the frontend code. For production:
  - Option 1: Create a WordPress REST API endpoint that makes OpenAI calls server-side
  - Option 2: Use Cloudflare Workers or similar serverless function as a proxy
  - The current setup is for development/demo purposes only

- **CORS Issues**: If you encounter CORS errors, you may need to:
  - Use a backend proxy (recommended for production)
  - Or configure your WordPress site to allow the API calls

## Technology Stack

- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and dev server
- **OpenAI GPT-4o**: AI-powered question analysis and generation
- **Lucide React**: Beautiful icons
- **Inline Styles**: No external CSS frameworks, fully self-contained

## Project Structure

```
podcast-question-generator/
├── src/
│   ├── main.jsx                      # App entry point
│   ├── PodcastQuestionOptimizer.jsx  # Main component
│   └── index.css                      # Global styles
├── index.html                         # HTML template
├── vite.config.js                     # Vite configuration
├── package.json                       # Dependencies
├── .env.example                       # Environment variables template
└── README.md                          # This file
```

## Environment Variables

- `VITE_OPENAI_API_KEY`: Your OpenAI API key (required)

## Support

Created by Hugo Sanchez - [MoonDesk Media](https://moondeskmedia.com/)

For issues or questions, please contact through the MoonDesk Media website.

