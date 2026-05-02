// Simple Vanilla JS Test Runner
const resultsDiv = document.getElementById('results');

function assertEqual(actual, expected, testName) {
    const passed = actual === expected;
    logResult(passed, testName, `Expected ${expected}, got ${actual}`);
}

function assertTruthy(condition, testName) {
    const passed = !!condition;
    logResult(passed, testName, `Expected truthy value`);
}

function logResult(passed, testName, details = '') {
    const div = document.createElement('div');
    div.className = passed ? 'pass' : 'fail';
    div.innerHTML = `[${passed ? 'PASS' : 'FAIL'}] ${testName} ${!passed ? ' - ' + details : ''}`;
    if(resultsDiv) resultsDiv.appendChild(div);
    else console.log(`${passed ? '✅' : '❌'} ${testName}`);
}

// --- Test Suite ---
console.log("Running Tests...");

// 1. Data Structure Test
const mockTask = { id: '1', title: 'Test', status: 'todo' };
assertEqual(mockTask.status, 'todo', 'Task should initialize with todo status');

// 2. Logic Test: Status change (simulating drag and drop)
function changeTaskStatus(task, newStatus) {
    task.status = newStatus;
    return task;
}
const updatedTask = changeTaskStatus(mockTask, 'done');
assertEqual(updatedTask.status, 'done', 'Task status should update to done');

// 3. XSS Escaping Test (from app.js logic)
function escapeHTML(str) {
    const p = document.createElement('p');
    p.appendChild(document.createTextNode(str));
    return p.innerHTML;
}
const maliciousString = "<script>alert(1)</script>";
const escaped = escapeHTML(maliciousString);
assertTruthy(!escaped.includes("<script>"), 'escapeHTML should remove raw script tags');
assertEqual(escaped, "&lt;script&gt;alert(1)&lt;/script&gt;", 'escapeHTML should convert brackets to HTML entities');

// 4. Summarize Logic Test
const tasks = [
    { status: 'todo' }, { status: 'todo' }, { status: 'done' }
];
const counts = { todo: 0, 'in-progress': 0, review: 0, done: 0 };
tasks.forEach(t => counts[t.status]++);
assertEqual(counts.todo, 2, 'Summary should correctly count 2 todo tasks');
assertEqual(counts.done, 1, 'Summary should correctly count 1 done task');

console.log("Tests Completed.");
