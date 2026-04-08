const Issue = require('../models/Issue');
const Analysis = require('../models/Analysis');
const Notification = require('../models/Notification');

/**
 * GET /api/analytics
 * Returns all analytics data needed by the dashboard in one request:
 * - Issues by status (donut chart)
 * - Issues by priority/severity (bar chart)
 * - Issues created per day for the last 30 days (line chart)
 * - Analysis scans per day (line chart overlay)
 * - Summary stats
 */
const getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Run all aggregations in parallel for best performance
    const [
      statusAgg,
      priorityAgg,
      issuesOverTime,
      analysisOverTime,
      totalIssues,
      totalAnalyses,
      recentActivity,
    ] = await Promise.all([
      // Issues grouped by status
      Issue.aggregate([
        { $match: { createdBy: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // Issues grouped by priority
      Issue.aggregate([
        { $match: { createdBy: userId } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // Issues created per day — last 30 days
      Issue.aggregate([
        {
          $match: {
            createdBy: userId,
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Analyses (scans) per day — last 30 days
      Analysis.aggregate([
        {
          $match: {
            userId,
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
            avgScore: { $avg: '$result.score' },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Issue.countDocuments({ createdBy: userId }),
      Analysis.countDocuments({ userId }),

      // Last 7 days issues (for trend)
      Issue.countDocuments({
        createdBy: userId,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    // ─── Build date-filled series for last 30 days ─────────────────────────
    const dateRange = generateDateRange(thirtyDaysAgo, new Date());

    const issuesMap = Object.fromEntries(issuesOverTime.map((d) => [d._id, d.count]));
    const analysisMap = Object.fromEntries(analysisOverTime.map((d) => [d._id, d.count]));
    const avgScoreMap = Object.fromEntries(
      analysisOverTime.filter((d) => d.avgScore != null).map((d) => [d._id, +d.avgScore.toFixed(1)])
    );

    const timeSeriesData = dateRange.map((date) => ({
      date,
      issues: issuesMap[date] || 0,
      analyses: analysisMap[date] || 0,
      avgScore: avgScoreMap[date] || null,
    }));

    // ─── Format status data ────────────────────────────────────────────────
    const statusOrder = ['Open', 'In Progress', 'Closed'];
    const statusData = statusOrder.map((s) => ({
      label: s,
      count: statusAgg.find((a) => a._id === s)?.count || 0,
    }));

    // ─── Format priority data ──────────────────────────────────────────────
    const priorityOrder = ['Critical', 'High', 'Medium', 'Low'];
    const priorityData = priorityOrder.map((p) => ({
      label: p,
      count: priorityAgg.find((a) => a._id === p)?.count || 0,
    }));

    // ─── Compute avg security score from recent analyses ───────────────────
    const recentScores = analysisOverTime.map((a) => a.avgScore).filter(Boolean);
    const avgSecurityScore =
      recentScores.length > 0
        ? +(recentScores.reduce((a, b) => a + b, 0) / recentScores.length).toFixed(1)
        : null;

    res.json({
      summary: {
        totalIssues,
        totalAnalyses,
        recentActivity,
        avgSecurityScore,
        openIssues: statusData.find((s) => s.label === 'Open')?.count || 0,
        closedIssues: statusData.find((s) => s.label === 'Closed')?.count || 0,
      },
      statusData,
      priorityData,
      timeSeriesData,
    });
  } catch (err) {
    console.error('getDashboardAnalytics error:', err);
    res.status(500).json({ message: 'Failed to fetch analytics.' });
  }
};

/**
 * Generate an array of YYYY-MM-DD date strings between start and end (inclusive)
 */
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

module.exports = { getDashboardAnalytics };
