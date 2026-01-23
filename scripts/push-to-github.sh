#!/bin/bash

# ================================================
# 🐱 Thai-Meow - Push to GitHub Script
# ================================================

set -e

REPO_URL="https://github.com/pixsphet/Thai-Meow-Demo-App-.git"
BRANCH_NAME="Dev"

echo "🚀 Starting GitHub push process..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git remote add origin $REPO_URL || git remote set-url origin $REPO_URL
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")

# Add all files
echo "📝 Adding files..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "Add Docker & DevOps setup for Dev branch" || echo "No changes to commit"

# Checkout or create Dev branch
if [ "$CURRENT_BRANCH" != "$BRANCH_NAME" ]; then
    echo "🌿 Switching to $BRANCH_NAME branch..."
    git checkout -b $BRANCH_NAME 2>/dev/null || git checkout $BRANCH_NAME
fi

# Push to GitHub
echo "⬆️  Pushing to GitHub..."
git push -u origin $BRANCH_NAME || {
    echo "❌ Push failed. Trying to set upstream..."
    git push --set-upstream origin $BRANCH_NAME
}

echo "✅ Successfully pushed to GitHub!"
echo "🔗 Repository: $REPO_URL"
echo "🌿 Branch: $BRANCH_NAME"
