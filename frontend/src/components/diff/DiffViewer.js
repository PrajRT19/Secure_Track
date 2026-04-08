import React, { useState } from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';

/* ─── Custom styles for the diff viewer (dark theme) ────────────────────── */
const DIFF_STYLES = {
  variables: {
    dark: {
      diffViewerBackground: '#0d1117',
      diffViewerColor: '#c9d1d9',
      addedBackground: 'rgba(34,197,94,0.1)',
      addedColor: '#c9d1d9',
      removedBackground: 'rgba(239,68,68,0.1)',
      removedColor: '#c9d1d9',
      wordAddedBackground: 'rgba(34,197,94,0.25)',
      wordRemovedBackground: 'rgba(239,68,68,0.25)',
      addedGutterBackground: 'rgba(34,197,94,0.15)',
      removedGutterBackground: 'rgba(239,68,68,0.15)',
      gutterBackground: '#0f1318',
      gutterBackgroundDark: '#0a0d12',
      highlightBackground: 'rgba(59,130,246,0.08)',
      highlightGutterBackground: 'rgba(59,130,246,0.12)',
      codeFoldBackground: '#131820',
      emptyLineBackground: '#0d1117',
      gutterColor: '#475569',
      addedGutterColor: '#4ade80',
      removedGutterColor: '#f87171',
      codeFoldContentColor: '#64748b',
      diffViewerTitleBackground: '#0f1318',
      diffViewerTitleColor: '#94a3b8',
      diffViewerTitleBorderColor: 'rgba(255,255,255,0.07)',
    },
  },
};

/**
 * DiffViewer — renders a before/after code diff using react-diff-viewer-continued.
 *
 * Props:
 *   originalCode   {string}   - The original (vulnerable) code
 *   fixedCode      {string}   - The fixed code from Claude
 *   language       {string}   - Programming language label
 *   hunks          {Array}    - Parsed diff hunks from backend
 *   linesChanged   {number}   - Total changed lines count
 *   onApplyFix     {Function} - Called when user clicks "Apply Fix"
 *   onDiscard      {Function} - Called when user clicks "Discard"
 */
const DiffViewer = ({
  originalCode,
  fixedCode,
  language,
  linesChanged = 0,
  onApplyFix,
  onDiscard,
}) => {
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'unified'
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    setApplied(true);
    onApplyFix(fixedCode);
  };

  const addedLines = (fixedCode.split('\n').length);
  const removedLines = (originalCode.split('\n').length);

  return (
    <div className="st-diff-wrapper">
      {/* ─── Diff Header ─────────────────────────────────────────────────── */}
      <div className="st-diff-header">
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <div className="d-flex align-items-center gap-2">
            <span className="st-diff-lang-badge">{language}</span>
            <span className="st-diff-stat added">+{addedLines} lines</span>
            <span className="st-diff-stat removed">−{removedLines} lines</span>
            {linesChanged > 0 && (
              <span className="st-diff-stat changed">~{linesChanged} changed</span>
            )}
          </div>
        </div>

        {/* View mode toggle + action buttons */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div className="st-view-toggle">
            <button
              className={`st-toggle-btn ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
            >
              <i className="bi bi-layout-split me-1" />
              Split
            </button>
            <button
              className={`st-toggle-btn ${viewMode === 'unified' ? 'active' : ''}`}
              onClick={() => setViewMode('unified')}
            >
              <i className="bi bi-list-ul me-1" />
              Unified
            </button>
          </div>

          {!applied ? (
            <>
              <button className="btn btn-sm btn-outline-secondary st-diff-discard-btn" onClick={onDiscard}>
                <i className="bi bi-x-circle me-1" />
                Discard
              </button>
              <button className="btn btn-sm btn-success st-diff-apply-btn" onClick={handleApply}>
                <i className="bi bi-check-circle-fill me-1" />
                Apply Fix
              </button>
            </>
          ) : (
            <span className="st-diff-applied-badge">
              <i className="bi bi-check2-all me-1" />
              Fix Applied
            </span>
          )}
        </div>
      </div>

      {/* ─── Column Labels (split mode only) ─────────────────────────────── */}
      {viewMode === 'split' && (
        <div className="st-diff-cols">
          <div className="st-diff-col-label removed-label">
            <i className="bi bi-bug-fill me-2" />
            Original (Vulnerable)
          </div>
          <div className="st-diff-col-label added-label">
            <i className="bi bi-shield-check me-2" />
            Fixed (Secure)
          </div>
        </div>
      )}

      {/* ─── Diff Output ─────────────────────────────────────────────────── */}
      <div className="st-diff-body">
        <ReactDiffViewer
          oldValue={originalCode}
          newValue={fixedCode}
          splitView={viewMode === 'split'}
          compareMethod={DiffMethod.WORDS}
          useDarkTheme={true}
          styles={DIFF_STYLES}
          leftTitle={viewMode === 'split' ? '' : undefined}
          rightTitle={viewMode === 'split' ? '' : undefined}
          hideLineNumbers={false}
          showDiffOnly={true}
          extraLinesSurroundingDiff={3}
          codeFoldMessageRenderer={(total) => (
            <span style={{ color: '#64748b', fontSize: 11 }}>
              ··· {total} unchanged lines ···
            </span>
          )}
        />
      </div>

      {/* ─── Apply Fix Confirmation (when applied) ────────────────────────── */}
      {applied && (
        <div className="st-diff-applied-banner">
          <i className="bi bi-shield-check-fill me-2 text-success" />
          <span>
            Fix applied. The code in the editor has been updated with the secured version.
          </span>
        </div>
      )}
    </div>
  );
};

export default DiffViewer;
