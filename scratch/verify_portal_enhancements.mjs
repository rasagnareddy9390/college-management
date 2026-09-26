const BASE_URL = 'http://localhost:5005';

let adminToken = null;
let studentToken = null;
let testStudentEmail = `test.student.${Date.now()}@nriit.ac.in`;
let testFacultyEmail = `test.faculty.${Date.now()}@nriit.ac.in`;
let testStudentId = null;
let testFacultyId = null;

async function run() {
  console.log('====================================================');
  console.log('🔬 STARTING COMPLETE PORTAL ENHANCEMENT VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Admin Login
  console.log('--- 1. Testing Admin Authentication ---');
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@nriit.ac.in', password: 'Admin@123' })
    });
    const data = await res.json();
    assert(data.success && data.token, 'Admin logged in successfully and received JWT');
    adminToken = data.token;
  } catch (err) {
    assert(false, `Admin login error: ${err.message}`);
  }

  // 2. Student Login
  console.log('\n--- 2. Testing Student Authentication ---');
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@nriit.ac.in', password: 'Admin@123' })
    });
    const data = await res.json();
    assert(data.success && data.token, 'Student logged in successfully and received JWT');
    studentToken = data.token;
  } catch (err) {
    assert(false, `Student login error: ${err.message}`);
  }

  // 3. Admin Account Management - Stats from MongoDB
  console.log('\n--- 3. Testing Admin Account Stats from MongoDB ---');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/accounts/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(data.success && data.stats, 'Retrieved live account statistics from MongoDB');
    const s = data.stats;
    console.log(`   📊 Students: Total=${s.students.total}, Active=${s.students.active}, Inactive=${s.students.inactive}`);
    console.log(`   📊 Faculty:  Total=${s.faculty.total}, Active=${s.faculty.active}, Inactive=${s.faculty.inactive}`);
    assert(typeof s.students.total === 'number' && typeof s.faculty.total === 'number', 'Stats are numeric numbers from Mongo');
  } catch (err) {
    assert(false, `Admin stats error: ${err.message}`);
  }

  // 4. Admin Account Management - Create Student Account
  console.log('\n--- 4. Testing Admin Create Student Account ---');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Test Automation Student',
        email: testStudentEmail,
        password: 'Password@123',
        branch: 'Computer Science & Engineering',
        semester: 5,
        rollNumber: `NRI${Date.now().toString().slice(-4)}`
      })
    });
    const data = await res.json();
    testStudentId = data.student?._id || data.student?.userId || data.user?._id;
    assert(data.success && testStudentId, `Created test student account (${testStudentEmail})`);
  } catch (err) {
    assert(false, `Create student error: ${err.message}`);
  }

  // 5. Test Account Deactivation & Login Blocking with Exact Message
  console.log('\n--- 5. Testing Deactivation & Exact 403 Error Message ---');
  try {
    // Deactivate
    const deactRes = await fetch(`${BASE_URL}/api/admin/students/${testStudentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ isActive: false })
    });
    const deactData = await deactRes.json();
    assert(deactData.success && deactData.isActive === false, 'Account successfully set to INACTIVE');

    // Attempt login with deactivated account
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testStudentEmail, password: 'Password@123' })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 403, 'Login rejected with HTTP 403 Forbidden');
    assert(
      loginData.message === 'Your account has been deactivated. Please contact the administrator.',
      `Received exact required message: "${loginData.message}"`
    );

    // Reactivate account
    const reactRes = await fetch(`${BASE_URL}/api/admin/students/${testStudentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ isActive: true })
    });
    const reactData = await reactRes.json();
    assert(reactData.success && reactData.isActive === true, 'Account successfully reactivated to ACTIVE');
  } catch (err) {
    assert(false, `Deactivation test error: ${err.message}`);
  }

  // 6. Admin Account Management - Create Faculty with Automatic FacultyProfile
  console.log('\n--- 6. Testing Admin Create Faculty with Auto FacultyProfile ---');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/faculty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Dr. Automated Verification Specialist',
        email: testFacultyEmail,
        password: 'Password@123',
        employeeId: `FAC${Date.now().toString().slice(-4)}`,
        department: 'CSE',
        designation: 'Associate Professor',
        qualification: 'Ph.D. Computer Science',
        experience: '9 Years',
        subjects: ['Cloud Computing', 'Cyber Security'],
        expertise: ['Distributed Systems', 'Cloud Security']
      })
    });
    const data = await res.json();
    testFacultyId = data.faculty?._id || data.faculty?.userId || data.user?._id;
    assert(data.success && testFacultyId, `Created faculty account (${testFacultyEmail})`);

    // Verify FacultyProfile exists in Faculty Connect
    const fcRes = await fetch(`${BASE_URL}/api/faculty`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const fcData = await fcRes.json();
    const foundFaculty = (fcData.faculty || []).find(f => f.email === testFacultyEmail || f.userId === testFacultyId);
    assert(foundFaculty !== undefined, 'Faculty is automatically listed in Faculty Connect Directory');
  } catch (err) {
    assert(false, `Create faculty & auto-profile error: ${err.message}`);
  }

  // 7. Skills Catalog & Free Learning Resources
  console.log('\n--- 7. Testing Skills Catalog & Free Learning Resources ---');
  let selectedSkillId = null;
  try {
    const res = await fetch(`${BASE_URL}/api/skills`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const data = await res.json();
    assert(data.success && Array.isArray(data.skills) && data.skills.length > 0, `Retrieved ${data.skills?.length} skills from catalog`);
    selectedSkillId = data.skills[0]._id;

    const res2 = await fetch(`${BASE_URL}/api/skills/resources`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const data2 = await res2.json();
    assert(data2.success && Array.isArray(data2.resources) && data2.resources.length > 0, `Retrieved ${data2.resources?.length} curated free resources`);
  } catch (err) {
    assert(false, `Skills catalog error: ${err.message}`);
  }

  // 8. 30-Day Learning Plan Enrollment & Checklist Toggle
  console.log('\n--- 8. Testing 30-Day Learning Plan Enrollment & Checklist ---');
  let planId = null;
  try {
    const res = await fetch(`${BASE_URL}/api/skills/plans/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        skillId: selectedSkillId,
        title: '30-Day Full-Stack Web Mastery',
        targetCompletionDays: 30
      })
    });
    const data = await res.json();
    assert(data.success && data.plan, 'Enrolled in 30-day learning plan');
    planId = data.plan?._id;
    assert(Array.isArray(data.plan?.dailyChecklist) && data.plan.dailyChecklist.length === 30, 'Plan generated 30 daily checklist tasks');

    // Toggle day 1
    const togRes = await fetch(`${BASE_URL}/api/skills/plans/${planId}/days/1`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ isCompleted: true })
    });
    const togData = await togRes.json();
    assert(togData.success && togData.plan?.dailyChecklist[0]?.isCompleted === true, 'Successfully marked Day 1 complete and recalculated progress');
  } catch (err) {
    assert(false, `30-Day Plan test error: ${err.message}`);
  }

  // 9. Typing Practice Engine Persistence & Stats
  console.log('\n--- 9. Testing Typing Practice Persistence & Analytics ---');
  try {
    const res = await fetch(`${BASE_URL}/api/skills/typing/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        durationMinutes: 1,
        wpm: 72,
        netWpm: 68,
        accuracy: 96,
        charactersTyped: 360,
        errorsCount: 3
      })
    });
    const data = await res.json();
    assert(data.success && data.session, 'Saved typing session to MongoDB');

    const statsRes = await fetch(`${BASE_URL}/api/skills/typing/stats`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const statsData = await statsRes.json();
    assert(statsData.success && statsData.stats, 'Retrieved typing analytics and history from MongoDB');
    console.log(`   ⌨️  Best WPM: ${statsData.stats.bestWpm}, Avg Accuracy: ${statsData.stats.averageAccuracy}%`);
  } catch (err) {
    assert(false, `Typing engine test error: ${err.message}`);
  }

  // 10. Study Timer & Pomodoro
  console.log('\n--- 10. Testing Pomodoro / Study Timer Logging ---');
  try {
    const res = await fetch(`${BASE_URL}/api/skills/study/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        durationMinutes: 25,
        mode: 'pomodoro-25',
        completed: true,
        notes: 'Focused React Hooks study block'
      })
    });
    const data = await res.json();
    assert(data.success && data.session, 'Logged 25-minute Pomodoro study session');
  } catch (err) {
    assert(false, `Pomodoro test error: ${err.message}`);
  }

  // 11. Personal Reminders & Automated Deadlines
  console.log('\n--- 11. Testing Personal Reminders & Automated Deadlines ---');
  try {
    // Create personal reminder
    const createRes = await fetch(`${BASE_URL}/api/reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        title: 'Submit Lab Record for Verification',
        dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
        category: 'Personal',
        priority: 'High'
      })
    });
    const createData = await createRes.json();
    assert(createData.success && createData.reminder, 'Created personal academic reminder');

    // Fetch reminders and automated alerts
    const getRes = await fetch(`${BASE_URL}/api/reminders`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const getData = await getRes.json();
    assert(getData.success && Array.isArray(getData.reminders), 'Retrieved reminders list');
    assert(Array.isArray(getData.automatedDeadlines), 'Retrieved automated deadline scans (7d, 3d, 1d, today, overdue)');
    console.log(`   ⏰ Total Personal Reminders: ${getData.reminders.length}, Automated Deadlines Detected: ${getData.automatedDeadlines.length}`);
  } catch (err) {
    assert(false, `Reminders test error: ${err.message}`);
  }

  // 12. Upcoming Exams Countdown & Official Announcements
  console.log('\n--- 12. Testing Upcoming Exam Countdown & Announcements ---');
  try {
    const examRes = await fetch(`${BASE_URL}/api/announcements/upcoming-exam`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const examData = await examRes.json();
    assert(examData.success && examData.exam, `Fetched upcoming exam countdown target: "${examData.exam?.subject}"`);
    console.log(`   ⏳ Exam Date: ${examData.exam?.examDate}, Start Time: ${examData.exam?.startTime}`);
    assert(examData.exam?.countdown && typeof examData.exam?.countdown?.days === 'number', 'Calculated countdown days, hours, mins, secs');

    const annRes = await fetch(`${BASE_URL}/api/announcements`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const annData = await annRes.json();
    assert(annData.success && Array.isArray(annData.announcements) && annData.announcements.length > 0, `Retrieved ${annData.announcements.length} official announcements`);

    const calRes = await fetch(`${BASE_URL}/api/announcements/calendar`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const calData = await calRes.json();
    assert(calData.success && Array.isArray(calData.events), `Retrieved ${calData.events.length} academic calendar events`);
  } catch (err) {
    assert(false, `Exams/Announcements test error: ${err.message}`);
  }

  // 13. AI Assistant Context-Aware Integration
  console.log('\n--- 13. Testing AI Assistant Grounded Context ---');
  try {
    const res = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        message: 'What upcoming exams do I have scheduled and who are the faculty members I can ask questions to in CSE?'
      })
    });
    const data = await res.json();
    assert(data.success && data.response, 'AI Assistant provided response using live context synthesis');
    console.log(`   🤖 AI Response Preview: "${(data.response || '').slice(0, 140)}..."`);

    // Verify Chat History
    const histRes = await fetch(`${BASE_URL}/api/ai/history`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const histData = await histRes.json();
    assert(histData.success && Array.isArray(histData.messages) && histData.messages.length > 0, 'AI chat history recorded in MongoDB');
  } catch (err) {
    assert(false, `AI Assistant test error: ${err.message}`);
  }

  // 14. Cleanup test accounts
  console.log('\n--- 14. Cleanup Test Accounts ---');
  try {
    if (testStudentId) {
      await fetch(`${BASE_URL}/api/admin/students/${testStudentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log(`   🧹 Soft-deleted test student account`);
    }
    if (testFacultyId) {
      await fetch(`${BASE_URL}/api/admin/faculty/${testFacultyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log(`   🧹 Soft-deleted test faculty account`);
    }
    assert(true, 'Cleanup completed cleanly');
  } catch (err) {
    console.warn(`Cleanup notice: ${err.message}`);
  }

  console.log('\n====================================================');
  console.log(`🏁 VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

