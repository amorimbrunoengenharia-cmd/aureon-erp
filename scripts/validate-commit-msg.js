#!/usr/bin/env node
/**
 * Validate commit message format
 * Enforces Conventional Commits specification
 * https://www.conventionalcommits.org/
 */

const fs = require('fs');
const path = require('path');

// Get commit message from git
const commitMsgFile = process.argv[2] || '.git/COMMIT_EDITMSG';
const commitMsg = fs.readFileSync(path.resolve(commitMsgFile), 'utf-8').trim();

// Conventional Commits regex
const conventionalCommitRegex = /^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert)(\(.+\))?!?: .{1,100}/;

// Allow merge commits
const mergeCommitRegex = /^Merge /;

// Check if commit message is valid
if (!conventionalCommitRegex.test(commitMsg) && !mergeCommitRegex.test(commitMsg)) {
  console.error('\n❌ Invalid commit message format!\n');
  console.error('Commit message must follow Conventional Commits specification:\n');
  console.error('  <type>[optional scope]: <description>\n');
  console.error('Examples:');
  console.error('  feat: add new dashboard widget');
  console.error('  fix(auth): resolve login timeout issue');
  console.error('  docs: update README with setup instructions');
  console.error('  chore(deps): update dependencies\n');
  console.error('Valid types:');
  console.error('  feat     - New feature');
  console.error('  fix      - Bug fix');
  console.error('  docs     - Documentation changes');
  console.error('  style    - Code style changes (formatting, etc)');
  console.error('  refactor - Code refactoring');
  console.error('  perf     - Performance improvements');
  console.error('  test     - Adding or updating tests');
  console.error('  chore    - Maintenance tasks');
  console.error('  build    - Build system changes');
  console.error('  ci       - CI/CD changes');
  console.error('  revert   - Revert previous commit\n');
  console.error('Your commit message:');
  console.error(`  "${commitMsg}"\n`);
  process.exit(1);
}

console.log('✅ Commit message format is valid!');
process.exit(0);
