const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', 'config.env') });

const seedMongoDB = require('./seedMongoDB');
const seedConsonants = require('./seedConsonants');
const seedVowels = require('./seedVowels');
const seedGameVocab = require('./seedGameVocab');
const seedGreetings = require('./seedGreetings');
const seedBodyParts = require('./seedBodyParts');
const seedIdioms = require('./seedIdioms');
const seedIntermediateFoodDrinks = require('./seedIntermediateFoodDrinks');

const runAllSeeds = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined. Please update backend/config.env');
  }

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('🔗 Connected to MongoDB Atlas');

  const results = {};

  try {
    results.core = await seedMongoDB({ skipConnect: true });
    await seedConsonants({ skipConnect: true });
    await seedVowels({ skipConnect: true });
    await seedGameVocab({ skipConnect: true });
    await seedGreetings({ skipConnect: true });
    await seedBodyParts({ skipConnect: true });
    await seedIdioms({ skipConnect: true });
    await seedIntermediateFoodDrinks({ skipConnect: true });

    console.log('🎉 All seeders completed successfully!');
    console.log('📦 Core seeding summary:', results.core);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB Atlas');
  }
};

if (require.main === module) {
  runAllSeeds()
    .then(() => process.exit(0))
    .catch(async (error) => {
      console.error('❌ Error running seeders:', error);
      try {
        await mongoose.disconnect();
      } catch (disconnectError) {
        console.error('⚠️ Failed to disconnect cleanly:', disconnectError);
      }
      process.exit(1);
    });
}

module.exports = runAllSeeds;
