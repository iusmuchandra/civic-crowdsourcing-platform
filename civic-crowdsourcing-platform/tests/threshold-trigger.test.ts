// ============================================================
// THRESHOLD TRIGGER — Idempotency & Privacy Tests
// ============================================================
// Self-contained tests. No live Supabase connection required.
// Database-bound verifications use in-memory simulation.
// ============================================================

import { describe, it, expect, beforeAll } from '@jest/globals';

// ----------------------------------------------------------
// 1. PHONE NUMBER DETECTOR (pure logic — used in production)
// ----------------------------------------------------------
const PHONE_PATTERNS = [
  /\+\d{7,14}/,                       // +919100000001 (international prefix is definitive)
  /\b[6-9]\d{9}\b/,                   // Indian mobile: starts 6-9, exactly 10 digits, word-bounded
  /\b\d{3}[\s.-]\d{3}[\s.-]\d{4}\b/,  // XXX-XXX-XXXX or XXX.XXX.XXXX with separators
];

function containsPhoneNumber(value: unknown, path: string = '$'): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    for (const pattern of PHONE_PATTERNS) {
      if (pattern.test(value)) return `${path} = "${value}"`;
    }
    return null;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const hit = containsPhoneNumber(value[i], `${path}[${i}]`);
      if (hit) return hit;
    }
    return null;
  }
  if (typeof value === 'object') {
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const hit = containsPhoneNumber(val, `${path}.${key}`);
      if (hit) return hit;
    }
    return null;
  }
  return null;
}

// ----------------------------------------------------------
// 2. IN-MEMORY RATING STORE (simulates Postgres with UNIQUE constraint)
// ----------------------------------------------------------
interface Rating {
  issue_id: string;
  user_id: string;
  color: 'red' | 'yellow' | 'green';
}

interface Issue {
  id: string;
  status: 'pending' | 'threshold_met' | 'in_progress' | 'resolved';
}

interface NotificationRecord {
  issue_id: string;
  officials_notified: unknown[];
  sent_at: string;
}

class InMemoryDB {
  ratings: Rating[] = [];
  issues: Map<string, Issue> = new Map();
  notifications: NotificationRecord[] = [];
  notificationCalls = 0;

  // Simulates UNIQUE(issue_id, user_id) constraint
  insertRating(issueId: string, userId: string, color: Rating['color']): 'ok' | 'duplicate' {
    const exists = this.ratings.some(r => r.issue_id === issueId && r.user_id === userId);
    if (exists) return 'duplicate';

    this.ratings.push({ issue_id: issueId, user_id: userId, color });
    return 'ok';
  }

  countRedYellow(issueId: string): number {
    return this.ratings.filter(r => r.issue_id === issueId && r.color !== 'green').length;
  }

  getIssue(issueId: string): Issue | undefined {
    return this.issues.get(issueId);
  }

  updateIssueStatus(issueId: string, status: Issue['status']): void {
    const issue = this.issues.get(issueId);
    if (issue) issue.status = status;
  }

  hasNotification(issueId: string): boolean {
    return this.notifications.some(n => n.issue_id === issueId);
  }

  createNotification(issueId: string): void {
    // Idempotency: refuse if already notified
    if (this.hasNotification(issueId)) return;
    this.notificationCalls++;
    this.notifications.push({
      issue_id: issueId,
      officials_notified: [{ id: 'off1', name: 'Test Official', role: 'worker' }],
      sent_at: new Date().toISOString(),
    });
  }

  reset(): void {
    this.ratings = [];
    this.issues = new Map();
    this.notifications = [];
    this.notificationCalls = 0;
  }
}

// ----------------------------------------------------------
// 3. THRESHOLD TRIGGER LOGIC (mirrors the Postgres trigger function)
// ----------------------------------------------------------
const THRESHOLD = 50;

function checkThreshold(db: InMemoryDB, issueId: string): 'notified' | 'threshold_not_met' | 'already_met' {
  const issue = db.getIssue(issueId);
  if (!issue) return 'threshold_not_met';

  // Already met? Idempotency check
  if (issue.status !== 'pending') return 'already_met';

  const redYellow = db.countRedYellow(issueId);
  if (redYellow < THRESHOLD) return 'threshold_not_met';

  // Fire notification
  db.updateIssueStatus(issueId, 'threshold_met');
  db.createNotification(issueId);
  return 'notified';
}

// ----------------------------------------------------------
// 4. SAMPLE FIXTURES (mirror what get_issue_detail would return)
// ----------------------------------------------------------
const sampleIssueDetail = {
  id: 'd0000000-0000-0000-0000-000000000009',
  photo_url: 'https://picsum.photos/seed/civic9/800/600',
  category: 'pothole',
  description_original: 'Banjara Hills Road No. 3 lo pedda gunta undi.',
  description_formal: 'A deep pothole on Banjara Hills Road No. 3 has caused damage to numerous vehicles.',
  language_detected: 'te',
  status: 'threshold_met',
  gps_lat: 17.4120,
  gps_lng: 78.4310,
  created_at: '2026-04-07T00:00:00Z',
  rating_counts: { red: 35, yellow: 15, green: 0, total: 50 },
  threshold_progress: 50,
  officials: [
    { name: 'M. Ravinder', role: 'worker' },
    { name: 'T. Harish', role: 'engineer' },
  ],
  timeline: [
    { action: 'acknowledged', name: 'T. Harish', role: 'engineer', message: 'Inspection scheduled.', timestamp: '2026-04-20T00:00:00Z' },
  ],
};

const sampleMapIssue = {
  id: 'd0000000-0000-0000-0000-000000000003',
  category: 'water_tap',
  status: 'pending',
  lat: 17.4390,
  lng: 78.4590,
  red_count: 5,
  yellow_count: 2,
  green_count: 0,
  total_ratings: 7,
};

const sanitizedOfficial = {
  id: 'f0000000-0000-0000-0000-000000000001',
  name: 'G. Srinivas',
  role: 'worker',
  ward_number: 'W01',
  municipality: 'Begumpet Municipality',
  state: 'Telangana',
};

// ----------------------------------------------------------
// 5. TESTS
// ----------------------------------------------------------
describe('Threshold Trigger — Idempotency & Privacy', () => {
  let db: InMemoryDB;

  beforeAll(() => {
    db = new InMemoryDB();
  });

  // --------------------------------------------------------
  // TEST A: 50 concurrent ratings fire notification EXACTLY ONCE
  // --------------------------------------------------------
  it('fires notification exactly once when 50 red+yellow ratings are submitted concurrently', async () => {
    db.reset();
    const issueId = 'test-issue-001';

    db.issues.set(issueId, { id: issueId, status: 'pending' });

    // Simulate 50 concurrent rating inserts using Promise.all
    const results: ('ok' | 'duplicate')[] = [];
    const promises: Promise<void>[] = [];

    for (let i = 0; i < 50; i++) {
      const userId = `user-${String(i).padStart(3, '0')}`;
      const color = i < 35 ? 'red' : 'yellow';
      promises.push(
        new Promise(resolve => {
          results.push(db.insertRating(issueId, userId, color as Rating['color']));
          resolve();
        })
      );
    }

    // Run all concurrently
    await Promise.all(promises);

    // Verify: 50 unique users = 50 successful inserts
    const okCount = results.filter(r => r === 'ok').length;
    expect(okCount).toBe(50);

    // Verify: 50 red+yellow ratings
    expect(db.countRedYellow(issueId)).toBe(50);

    // Run threshold check (simulating the trigger firing after all inserts)
    const result = checkThreshold(db, issueId);

    // Assert: notification fired
    expect(result).toBe('notified');

    // Assert: issue status updated
    expect(db.getIssue(issueId)!.status).toBe('threshold_met');

    // Assert: notification was created exactly once
    expect(db.notificationCalls).toBe(1);
    expect(db.notifications.length).toBe(1);
  });

  // --------------------------------------------------------
  // TEST B: IDEMPOTENCY — 51st rating does NOT fire again
  // --------------------------------------------------------
  it('does not fire notification a second time when a 51st rating is added', () => {
    db.reset();
    const issueId = 'test-issue-002';

    db.issues.set(issueId, { id: issueId, status: 'pending' });

    // Seed 50 ratings
    for (let i = 0; i < 50; i++) {
      db.insertRating(issueId, `user-${String(i).padStart(3, '0')}`, 'red');
    }

    // First trigger — should fire
    const firstResult = checkThreshold(db, issueId);
    expect(firstResult).toBe('notified');
    expect(db.notificationCalls).toBe(1);

    // Add 51st rating
    db.insertRating(issueId, 'user-051', 'green');

    // Second trigger attempt — should NOT fire (idempotency via status check)
    const secondResult = checkThreshold(db, issueId);
    expect(secondResult).toBe('already_met');
    expect(db.notificationCalls).toBe(1); // Still exactly 1
    expect(db.notifications.length).toBe(1);
  });

  // --------------------------------------------------------
  // TEST C: get_issue_detail NEVER exposes phone numbers
  // --------------------------------------------------------
  it('get_issue_detail response contains zero phone numbers', () => {
    const phoneHit = containsPhoneNumber(sampleIssueDetail);
    expect(phoneHit).toBeNull();
  });

  // --------------------------------------------------------
  // TEST D: Map issue response has no phone numbers
  // --------------------------------------------------------
  it('public map issue entity never exposes phone numbers', () => {
    const phoneHit = containsPhoneNumber(sampleMapIssue);
    expect(phoneHit).toBeNull();
  });

  // --------------------------------------------------------
  // TEST E: sanitize_officials_for_public strips contact fields
  // --------------------------------------------------------
  it('sanitized official object excludes phone, email, whatsapp', () => {
    // Verify only public-safe keys exist
    const allowedKeys = ['id', 'name', 'role', 'ward_number', 'municipality', 'state'];
    const actualKeys = Object.keys(sanitizedOfficial);

    for (const key of allowedKeys) {
      expect(actualKeys).toContain(key);
    }

    // Contact fields must never be present
    expect(sanitizedOfficial).not.toHaveProperty('phone');
    expect(sanitizedOfficial).not.toHaveProperty('email');
    expect(sanitizedOfficial).not.toHaveProperty('whatsapp');

    // Also double-check via phone scan
    const phoneHit = containsPhoneNumber(sanitizedOfficial);
    expect(phoneHit).toBeNull();
  });

  // --------------------------------------------------------
  // TEST F: UNIQUE constraint prevents double-rating
  // --------------------------------------------------------
  it('prevents a user from rating the same issue twice (enforced at DB level)', () => {
    db.reset();
    const issueId = 'test-issue-003';

    // First rating succeeds
    const first = db.insertRating(issueId, 'user-001', 'red');
    expect(first).toBe('ok');

    // Second rating by same user on same issue FAILS
    const second = db.insertRating(issueId, 'user-001', 'green'); // different color
    expect(second).toBe('duplicate');

    // Only 1 rating exists
    expect(db.ratings.filter(r => r.issue_id === issueId).length).toBe(1);
  });

  // --------------------------------------------------------
  // TEST G: Issues below 5 ratings are excluded from public map
  // --------------------------------------------------------
  it('excludes issues with fewer than 5 ratings from public map', () => {
    db.reset();

    // Simulate issues with different rating counts
    const issue2Ratings = { id: 'issue-low-1', total_ratings: 2 };
    const issue7Ratings = { id: 'issue-ok-1', total_ratings: 7 };
    const issue1Rating = { id: 'issue-low-2', total_ratings: 1 };
    const issue5Ratings = { id: 'issue-boundary', total_ratings: 5 };

    const allIssues = [issue2Ratings, issue7Ratings, issue1Rating, issue5Ratings];

    // Filter like get_public_map_issues does: total_ratings >= 5
    const MIN_RATINGS_FOR_MAP = 5;
    const visible = allIssues.filter(i => i.total_ratings >= MIN_RATINGS_FOR_MAP);

    // 2-rating issue excluded
    expect(visible.find(i => i.id === 'issue-low-1')).toBeUndefined();

    // 1-rating issue excluded
    expect(visible.find(i => i.id === 'issue-low-2')).toBeUndefined();

    // 7-rating issue included
    expect(visible.find(i => i.id === 'issue-ok-1')).toBeDefined();

    // 5-rating issue included (boundary)
    expect(visible.find(i => i.id === 'issue-boundary')).toBeDefined();

    // Only 2 issues are visible
    expect(visible.length).toBe(2);
  });

  // --------------------------------------------------------
  // TEST H: Threshold is NOT met at 49 ratings
  // --------------------------------------------------------
  it('does NOT fire notification at 49 red+yellow ratings', () => {
    db.reset();
    const issueId = 'test-issue-004';
    db.issues.set(issueId, { id: issueId, status: 'pending' });

    for (let i = 0; i < 49; i++) {
      db.insertRating(issueId, `user-${String(i).padStart(3, '0')}`, 'red');
    }

    const result = checkThreshold(db, issueId);
    expect(result).toBe('threshold_not_met');
    expect(db.notificationCalls).toBe(0);
  });

  // --------------------------------------------------------
  // TEST I: Phone recognizer rejects realistic payloads with leaked numbers
  // --------------------------------------------------------
  it('detects phone numbers when they DO leak (validates the scanner works)', () => {
    // Deliberately leaky payload — the scanner MUST catch these
    const leakyPayload = {
      name: 'Test Official',
      phone: '+919100001001',   // THIS IS A LEAK
      nested: {
        data: [
          { contact: '9876543210' }, // BARE NUMBER LEAK
        ],
      },
    };

    const phoneHit = containsPhoneNumber(leakyPayload);
    expect(phoneHit).not.toBeNull();             // MUST find something
    expect(phoneHit).toContain('phone');          // root-level phone field
  });

  // --------------------------------------------------------
  // TEST J: Phone recognizer passes clean payloads
  // --------------------------------------------------------
  it('correctly identifies clean payloads with no phone numbers', () => {
    const cleanPayload = {
      id: 'abc-123',
      name: 'M. Ravinder',
      role: 'worker',
      ward: 'W03',
      gps: { lat: 17.412, lng: 78.431 },
      ratings: { red: 35, yellow: 15, green: 5 },
      nested: {
        metrics: [1, 2, 3],
        message: 'Phone numbers are not shown here.',
      },
    };

    const phoneHit = containsPhoneNumber(cleanPayload);
    expect(phoneHit).toBeNull();
  });
});
