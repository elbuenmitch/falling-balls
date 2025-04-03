#!/bin/bash

# Setup script for Supabase CLI configuration
# This script helps install and configure the Supabase CLI

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI not found, installing..."
    
    # Install Supabase CLI based on platform
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install supabase/tap/supabase
    else
        # Linux and others
        curl -fsSL https://raw.githubusercontent.com/supabase/cli/main/scripts/install.sh | bash
    fi
else
    echo "Supabase CLI already installed"
fi

# Create an .env file from .env.example if it doesn't exist
if [ ! -f "../.env" ]; then
    echo "Creating .env file..."
    cp ../.env.example ../.env
    echo "Please edit the .env file and add your Supabase credentials"
else
    echo ".env file already exists"
fi

# Instructions for configuring Supabase
echo ""
echo "===================================================="
echo "Supabase Setup Instructions:"
echo "===================================================="
echo "1. Create a Supabase project at https://supabase.com"
echo "2. Get your project URL and API keys from the project settings"
echo "3. Add them to the .env file in your project root"
echo "4. To run migrations manually, use the following command:"
echo "   supabase db push --db-url postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
echo "5. Alternatively, you can apply migrations through the Supabase dashboard SQL editor"
echo "===================================================="
echo ""

echo "Setup complete!"
