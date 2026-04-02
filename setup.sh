#!/bin/bash

# Recipe Vault - Quick Setup Script
echo "🍳 Setting up Recipe Vault with AI Photo Extraction..."
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "✅ .env file already exists"
else
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your OpenAI API key"
    echo "   Get your key from: https://platform.openai.com/api-keys"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your OPENAI_API_KEY (and optional VITE_API_BASE_URL for remote API calls)"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open the URL shown in your browser"
echo "4. Click 'Add Recipe' and try uploading a recipe photo!"
echo ""
