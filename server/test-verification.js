import { Storage } from './src/storage.js';
import { GitHubService } from './src/github.js';
import assert from 'assert';

console.log('🧪 Starting GitPulse Verification Tests...\n');

// Test 1: Storage engine initialization and settings
console.log('1️⃣ Testing Storage Settings...');
Storage.updateSettings({ githubUsername: 'test-dev', lastSync: new Date().toISOString() });
const settings = Storage.getSettings();
assert.strictEqual(settings.githubUsername, 'test-dev');
console.log('   ✓ Settings saved and retrieved successfully.');

// Test 2: Project status updates and v1 completion marking
console.log('2️⃣ Testing Project Status & v1 Completion Tracking...');
const repoName = 'test-dev/awesome-app';
const updated = Storage.updateRepoData(repoName, {
  status: 'v1_complete',
  priority: 'high',
  notes: 'Shipped production version with full auth and payment flows'
});
assert.strictEqual(updated.status, 'v1_complete');
assert.strictEqual(updated.priority, 'high');
assert.ok(updated.completedAt, 'completedAt should be timestamped');
console.log('   ✓ Status successfully updated to v1_complete with completedAt timestamp.');

// Test 3: Custom tasks management
console.log('3️⃣ Testing Custom Tasks Checklist...');
const task = Storage.addCustomTask(repoName, 'Write integration tests');
assert.ok(task.id, 'Task must have an ID');
assert.strictEqual(task.completed, false);

const toggled = Storage.toggleCustomTask(repoName, task.id);
assert.strictEqual(toggled.completed, true);
console.log('   ✓ Custom task created and toggled to completed.');

// Test 4: README task parsing logic
console.log('4️⃣ Testing README Task Checklist Parsing Logic...');
const sampleReadme = `
# Awesome App
A project to track progress.

## Roadmap
- [x] Set up database
- [X] Implement authentication
- [ ] Add Stripe billing
* [ ] Deploy to production
`;

const lines = sampleReadme.split('\n');
const taskRegex = /^\s*[-*+]\s+\[([ xX])\]\s+(.*)$/;
const parsedTasks = [];

lines.forEach((line, index) => {
  const match = line.match(taskRegex);
  if (match) {
    parsedTasks.push({
      text: match[2].trim(),
      completed: match[1].toLowerCase() === 'x'
    });
  }
});

assert.strictEqual(parsedTasks.length, 4);
assert.strictEqual(parsedTasks.filter(t => t.completed).length, 2);
console.log('   ✓ Correctly parsed 4 tasks (2 completed, 2 pending) from Markdown.');

// Test 5: Health Score Calculation
console.log('5️⃣ Testing Automated Health Score Calculation...');
const gh = new GitHubService();
const mockRepo = {
  description: 'An awesome enterprise SaaS platform',
  license: { spdx_id: 'MIT' },
  pushed_at: new Date().toISOString(),
  open_issues_count: 0
};
const mockReadme = {
  hasReadme: true,
  tasks: parsedTasks,
  totalCount: 4,
  completedCount: 2
};
const mockReleases = {
  hasV1Release: true,
  latestReleaseTag: 'v1.0.0',
  releasesCount: 1
};

const mockCi = {
  latestStatus: 'success',
  hasActions: true
};

const healthScore = gh.calculateHealthScore(mockRepo, mockReadme, mockReleases, null, null, mockCi);
console.log(`   ✓ Health score computed: ${healthScore} / 100`);
assert.ok(healthScore >= 80, 'Score should be high for an active, documented, v1-released project with passing CI');

console.log('\n🎉 All 5 Core Verification Tests Passed Successfully!\n');
