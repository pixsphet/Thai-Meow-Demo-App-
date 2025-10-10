#!/usr/bin/env node

/**
 * Seed script for Thai consonants
 * Run with: node seed-consonants.js
 */

const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, 'backend/config.env') });

// Import the seed function
const seedConsonants = require('./backend/seed/seedConsonants');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thai-meow';
    console.log('🔌 Connecting to MongoDB...');
    console.log('📍 URI:', mongoURI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    console.log('🚀 Starting consonants seeding process...');
    
    await connectDB();
    await seedConsonants();
    
    console.log('🎉 All done! Consonants have been seeded successfully.');
    console.log('📝 You can now test the consonants API at: GET /api/vocab/consonants');
    
  } catch (error) {
    console.error('💥 Seeding process failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the main function
main();
