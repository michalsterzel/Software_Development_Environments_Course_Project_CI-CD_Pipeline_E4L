#!/usr/bin/env node
// __tests__/run-tests.js

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Polyfill for async/await support
require('babel-polyfill');

// Transpile test files on-the-fly so ES module syntax works under CommonJS
require('babel-core/register')({
  presets: [
    ['env', { modules: 'commonjs' }],  // Must convert ES modules to CommonJS for Node
    'react',
    'stage-3'
  ],
  plugins: [
    'transform-decorators-legacy',
    'transform-class-properties',
    'transform-object-rest-spread'
  ],
  // Ignore node_modules except our own src
  ignore: /node_modules\/(?!@)/
});

// Ignore non-JS assets if imported (defensive)
require.extensions['.scss'] = () => {};
require.extensions['.css'] = () => {};
require.extensions['.svg'] = () => {};
require.extensions['.png'] = () => {};
require.extensions['.jpg'] = () => {};
require.extensions['.jpeg'] = () => {};
require.extensions['.gif'] = () => {};

console.log('\n========================================');
console.log('  E4L Frontend Test Suite');
console.log('  Testing with REAL source imports');
console.log('========================================\n');

const testFiles = [
  // Unit Tests - Reducers
  '__tests__/unit/navReducer.test.js',
  '__tests__/unit/contactReducer.test.js', 
  '__tests__/unit/answerReducer.test.js',
  
  // Unit Tests - Actions
  '__tests__/unit/navAction.test.js',
  
  // Integration Tests
  '__tests__/integration/store.integration.test.js',
  '__tests__/integration/actions.integration.test.js',
  '__tests__/integration/calculator-backend.integration.test.js',
  '__tests__/integration/questionnaire-backend.integration.test.js',
  
  // Acceptance Tests
  '__tests__/acceptance/questionnaire.acceptance.test.js',
  '__tests__/acceptance/full-journey-backend.acceptance.test.js'
];

let passedTests = 0;
let failedTests = 0;
const failedTestsList = [];

testFiles.forEach((testFile) => {
  const fullPath = path.join(process.cwd(), testFile);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`!!!  Skipping ${testFile} (file not found)`);
    return;
  }

  console.log(`\n... Running: ${testFile}`);
  console.log('─'.repeat(50));
  
  try {
    // Run test file in-process so Babel register handles ES syntax
    require(fullPath);
    passedTests++;
    console.log('─'.repeat(50));
    console.log(`✓ ${testFile} - PASSED\n`);
  } catch (error) {
    failedTests++;
    failedTestsList.push(testFile);
    console.log('─'.repeat(50));
    console.log(`✗ ${testFile} - FAILED\n`);
    if (error && error.stack) {
      console.error(error.stack);
    }
  }
});

console.log('\n========================================');
console.log('  Test Summary');
console.log('========================================');
console.log(`Total Test Suites: ${testFiles.length}`);
console.log(`✓ Passed: ${passedTests}`);
console.log(`✗ Failed: ${failedTests}`);

if (failedTests > 0) {
  console.log('\n✗ Failed tests:');
  failedTestsList.forEach(test => {
    console.log(`   - ${test}`);
  });
}

console.log('========================================\n');

if (failedTests > 0) {
  process.exit(1);
}
