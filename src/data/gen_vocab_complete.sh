#!/bin/bash
node << 'NODEEOF'
const fs = require('fs');
const vocab = {
  "Animals": require('./vocab_full.json').Animals || [],
  "Food": require('./vocab_full.json').Food || []
};
console.log(`Current: ${vocab.Animals.length + vocab.Food.length} words`);
NODEEOF
