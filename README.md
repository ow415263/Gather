# Recipe Vault 📖

A personal digital cookbook for storing, organizing, and accessing your favorite recipes with ingredient lists and cooking instructions.

## ✨ Features

- **Recipe Management**: Create, edit, view, and delete recipes with ease
- **Smart Organization**: Categorize recipes by meal type (Breakfast, Lunch, Dinner, Dessert, Snacks, Drinks)
- **Powerful Search**: Real-time search by recipe name or ingredients
- **Photo Upload & AI Extraction**: Take a photo of a recipe page (printed or handwritten) and automatically extract ingredients, instructions, and details using AI
- **Persistent Storage**: All recipes are saved locally in your browser
- **Responsive Design**: Beautiful, warm interface optimized for all devices

## 🤖 AI-Powered Recipe Extraction

The Recipe Vault includes a powerful AI feature that can extract recipe information from photos:

1. **Upload a photo** of a recipe page from a cookbook or handwritten recipe card
2. **AI analyzes the image** using OpenAI's GPT-4 Vision to recognize text (including handwriting)
3. **Automatically populates** the recipe form with:
   - Recipe name
   - Description
   - Ingredients list
   - Step-by-step instructions
   - Prep time, cook time, and servings
   - Recipe category

Simply upload an image, review the extracted data, make any adjustments, and save!

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- OpenAI API key (for photo extraction feature)

### Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

4. Add your OpenAI API key to `.env`:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   # Optional: point local dev at your deployed API
   # VITE_API_BASE_URL=https://your-project.vercel.app
   ```
   
   Get your API key from: https://platform.openai.com/api-keys

   If you deploy the API, set `CORS_ALLOW_ORIGIN` to a comma-separated list of allowed origins
   (supports `*` wildcards), for example:
   ```
   CORS_ALLOW_ORIGIN=https://your-project.vercel.app,https://your-project-*.vercel.app
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open your browser to the URL shown in the terminal (typically http://localhost:5173)

### Without AI Features

If you don't want to use the photo extraction feature, you can still use the app! Simply:
- Skip the API key setup
- Add recipes manually using the form
- The photo upload section will show an error if you try to use it without an API key

## 💡 Usage

### Adding a Recipe Manually
1. Click the "Add Recipe" button
2. Fill in the recipe details (name, description, category, times, servings)
3. Add ingredients one by one
4. Add cooking instructions step by step
5. Click "Add Recipe" to save

### Adding a Recipe from a Photo
1. Click the "Add Recipe" button
2. Upload a photo of a recipe page
3. Wait for AI to extract the recipe data (usually 5-10 seconds)
4. Review and edit the auto-populated fields as needed
5. Click "Add Recipe" to save

### Organizing Recipes
- Use the category filter buttons to view recipes by meal type
- Search for recipes using the search bar
- Click on any recipe card to view full details

### Editing & Deleting
- Click on a recipe to view its details
- Use the edit button (pencil icon) to modify
- Use the delete button (trash icon) to remove

## 🎨 Design

The app features a warm, inviting design inspired by the comfort of home cooking:
- **Warm terracotta** primary color
- **Soft sage** accents
- **Honey gold** highlights
- **Playfair Display** font for elegant recipe titles
- **Inter** font for clean, readable body text

## 📄 License

MIT License - See LICENSE file for details

---

Built with ❤️ using React, TypeScript, Vite, and OpenAI
