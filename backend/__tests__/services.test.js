/**
 * Unit tests for notification service and analytics helpers
 */

// ─── Notification Service Tests ────────────────────────────────────────────
describe('notificationService', () => {
  let mockIo;
  let mockNotification;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    mockIo = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
    mockNotification = {
      _id: 'notif123',
      type: 'ISSUE_ASSIGNED',
      title: 'Issue Assigned',
      message: 'Test message',
      read: false,
      createdAt: new Date(),
      populate: jest.fn().mockResolvedValue({
        _id: 'notif123',
        type: 'ISSUE_ASSIGNED',
        title: 'Issue Assigned',
        message: 'Test message',
        actor: { name: 'Alice', email: 'alice@test.com' },
        read: false,
        createdAt: new Date(),
      }),
    };

    jest.doMock('../models/Notification', () => {
      const MockNotif = jest.fn(() => mockNotification);
      MockNotif.create = jest.fn().mockResolvedValue(mockNotification);
      MockNotif.NOTIFICATION_TYPES = {
        ISSUE_ASSIGNED: 'ISSUE_ASSIGNED',
        ISSUE_CREATED: 'ISSUE_CREATED',
        ISSUE_UPDATED: 'ISSUE_UPDATED',
        ISSUE_STATUS_CHANGED: 'ISSUE_STATUS_CHANGED',
        VULNERABILITY_FOUND: 'VULNERABILITY_FOUND',
      };
      return MockNotif;
    });

    jest.doMock('../sockets/socketServer', () => ({
      emitToUser: jest.fn(),
    }));
  });

  it('does not notify a user about their own action', async () => {
    const { createNotification } = require('../services/notificationService');
    const Notification = require('../models/Notification');

    const result = await createNotification(mockIo, {
      recipientId: 'user123',
      actorId: 'user123',   // same user — should be skipped
      type: 'ISSUE_CREATED',
      title: 'Test',
      message: 'Self-notification should be skipped',
    });

    expect(result).toBeNull();
    expect(Notification.create).not.toHaveBeenCalled();
  });

  it('creates and emits notification when actor != recipient', async () => {
    const { createNotification } = require('../services/notificationService');
    const { emitToUser } = require('../sockets/socketServer');
    const Notification = require('../models/Notification');

    await createNotification(mockIo, {
      recipientId: 'recipient456',
      actorId: 'actor123',
      type: 'ISSUE_ASSIGNED',
      title: 'Issue Assigned to You',
      message: 'You have been assigned to "Fix the bug".',
    });

    expect(Notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: 'recipient456',
        actor: 'actor123',
        type: 'ISSUE_ASSIGNED',
      })
    );
    expect(emitToUser).toHaveBeenCalled();
  });
});

// ─── Analytics Date Range Helper ─────────────────────────────────────────
describe('generateDateRange', () => {
  // Re-implement the helper for isolated testing
  const generateDateRange = (start, end) => {
    const dates = [];
    const cur = new Date(start);
    cur.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);
    while (cur <= endDate) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  };

  it('generates correct number of days', () => {
    const start = new Date('2025-01-01');
    const end = new Date('2025-01-07');
    const range = generateDateRange(start, end);
    expect(range).toHaveLength(7);
    expect(range[0]).toBe('2025-01-01');
    expect(range[6]).toBe('2025-01-07');
  });

  it('handles single day range', () => {
    const day = new Date('2025-06-15');
    const range = generateDateRange(day, day);
    expect(range).toHaveLength(1);
    expect(range[0]).toBe('2025-06-15');
  });

  it('generates 30 days for last-month window', () => {
    const end = new Date('2025-06-30');
    const start = new Date('2025-06-01');
    const range = generateDateRange(start, end);
    expect(range).toHaveLength(30);
  });
});

// ─── Diff Parsing ─────────────────────────────────────────────────────────
describe('getExtension helper', () => {
  const getExtension = (language) => {
    const map = {
      javascript: 'js', typescript: 'ts', python: 'py', java: 'java',
      'c#': 'cs', php: 'php', ruby: 'rb', go: 'go', sql: 'sql',
    };
    return map[language?.toLowerCase()] || 'txt';
  };

  it('maps JavaScript to js', () => expect(getExtension('JavaScript')).toBe('js'));
  it('maps Python to py', () => expect(getExtension('Python')).toBe('py'));
  it('maps unknown language to txt', () => expect(getExtension('COBOL')).toBe('txt'));
  it('handles null gracefully', () => expect(getExtension(null)).toBe('txt'));
});
