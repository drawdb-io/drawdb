#!/usr/bin/env node
/* eslint-env node */
/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }] */

/**
 * DrawDB Test Suite Runner
 * 
 * This script runs all test cases for the DrawDB project.
 * Currently focuses on testing the PostgreSQL quoted custom types fix (Issue #196).
 * 
 * Usage:
 *   npm run test                    # Run from project root
 *   node tests/run-all-tests.js     # Run directly
 * 
 * Exit codes:
 *   0 - All tests passed
 *   1 - Some tests failed
 */

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test configuration
const testSuites = [
  {
    name: 'PostgreSQL Quoted Types Fix (Issue #196)',
    file: 'importSQL/postgresqlPreprocessor.test.js',
    description: 'Tests the fix for PostgreSQL import failure with quoted custom types'
  }
];

/**
 * Display a formatted header
 */
function displayHeader() {
  console.log(`${colors.cyan}${colors.bright}DrawDB Test Suite${colors.reset}`);
  console.log(`${colors.cyan}${'─'.repeat(40)}${colors.reset}`);
}

/**
 * Display test suite information
 */
function displayTestInfo() {
  console.log(`${colors.blue}Running ${testSuites.length} test suite(s)...${colors.reset}`);
  console.log();
}

/**
 * Run a single test suite
 */
async function runTestSuite(suite) {
  const testPath = join(__dirname, suite.file);
  
  process.stdout.write(`${colors.yellow}${suite.name}${colors.reset} ... `);
  
  if (!existsSync(testPath)) {
    console.log(`${colors.red}FAILED${colors.reset} (file not found)`);
    return false;
  }
  
  try {
    // Capture console output during test execution
    const originalLog = console.log;
    const originalError = console.error;
    const logs = [];
    let testResult = false;
    
    console.log = (...args) => logs.push(args.join(' '));
    console.error = (...args) => logs.push(args.join(' '));
    
    // Import and run the test module
    const testModule = await import(`file://${testPath}?t=${Date.now()}`);
    
    // If the module has a runTests function, call it and get the result
    if (typeof testModule.runTests === 'function') {
      testResult = testModule.runTests();
    } else {
      // Check logs for success indicators
      testResult = !logs.some(log => log.includes('FAILED') || log.includes('ERROR'));
    }
    
    // Restore console functions
    console.log = originalLog;
    console.error = originalError;
    
    if (testResult) {
      console.log(`${colors.green}PASSED${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}FAILED${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}ERROR${colors.reset} (${error.message})`);
    return false;
  }
}

/**
 * Display final results
 */
function displayResults(results) {
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  
  console.log();
  console.log(`${colors.cyan}${'─'.repeat(40)}${colors.reset}`);
  
  if (failed === 0) {
    console.log(`${colors.green}${colors.bright}✓ All tests passed (${passed}/${results.length})${colors.reset}`);
    console.log(`${colors.green}Issue #196 has been resolved${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bright}✗ ${failed} test(s) failed (${passed}/${results.length} passed)${colors.reset}`);
    results.forEach(result => {
      if (!result.passed) {
        console.log(`${colors.red}  • ${result.name}${colors.reset}`);
      }
    });
  }
}

/**
 * Main test runner
 */
async function main() {
  displayHeader();
  displayTestInfo();
  
  const results = [];
  
  for (const suite of testSuites) {
    try {
      const passed = await runTestSuite(suite);
      results.push({ name: suite.name, passed });
    } catch (error) {
      console.log(`${colors.red}ERROR${colors.reset} (${error.message})`);
      results.push({ name: suite.name, passed: false });
    }
  }
  
  displayResults(results);
  
  // Exit with appropriate code
  const allPassed = results.every(r => r.passed);
  process.exit(allPassed ? 0 : 1);
}

// Handle uncaught errors gracefully
process.on('uncaughtException', (error) => {
  console.log(`${colors.red}${colors.bright}💥 UNCAUGHT EXCEPTION: ${error.message}${colors.reset}`);
  console.log(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (_reason, _promise) => {
  console.log(`${colors.red}${colors.bright}💥 UNHANDLED REJECTION: ${_reason}${colors.reset}`);
  process.exit(1);
});

// Run the tests
main();