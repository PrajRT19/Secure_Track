import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { issuesAPI, analyticsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusChart from '../components/charts/StatusChart';
import TimelineChart from '../components/charts/TimelineChart';
import PriorityChart from '../components/charts/PriorityChart';
import { ChartSkeleton } from '../components/charts/StatusChart';

const STATUS_COLORS = { Open: 'danger', 'In Progress': 'warning', Closed: 'success' };
const PRIORITY_COLORS = { Critical: 'danger', High: 'warning', Medium: 'primary', Low: 'secondary' };

const TableSkeleton = () => (
  <>
    {[1,2,3,4,5].map(i => (
      <tr key={i}>
        {[240,80,80,100,80,60].map((w,j) => (
          <td key={j}><div className="st-skeleton" style={{width:w,height:14,borderRadius:4}} /></td>
        ))}
      </tr>
    ))}
  </>
);

const StatCard = ({ label, value, icon, color, loading }) => (
  <div className="card st-card h-100">
    <div className="card-body d-flex align-items-center gap-3 p-3">
      <div className="st-stat-icon" style={{background:`var(--bs-${color}-bg,rgba(59,130,246,.12))`,borderRadius:10,width:44,height:44,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <i className={`bi ${icon} text-${color} fs-5`} />
      </div>
      <div>
        {loading ? (
          <>
            <div className="st-skeleton" style={{width:40,height:26,borderRadius:4,marginBottom:4}} />
            <div className="st-skeleton" style={{width:70,height:11,borderRadius:4}} />
          </>
        ) : (
          <>
            <div className="fw-bold" style={{fontSize:24,lineHeight:1}}>{value}</div>
            <div className="text-muted" style={{fontSize:11}}>{label}</div>
          </>
        )}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [filters, setFilters] = useState({ status:'All', priority:'All', search:'', sortBy:'createdAt', order:'desc' });

  const fetchIssues = useCallback(async () => {
    setIssuesLoading(true);
    try {
      const params = {};
      if (filters.status !== 'All') params.status = filters.status;
      if (filters.priority !== 'All') params.priority = filters.priority;
      if (filters.search) params.search = filters.search;
      params.sortBy = filters.sortBy;
      params.order = filters.order;
      const res = await issuesAPI.getAll(params);
      setIssues(res.data.issues);
    } catch { setError('Failed to load issues.'); }
    finally { setIssuesLoading(false); }
  }, [filters]);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await analyticsAPI.getDashboard();
      setAnalytics(res.data);
    } catch { console.error('Analytics fetch failed'); }
    finally { setAnalyticsLoading(false); }
  }, []);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);
  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const handleDelete = async (id) => {
    try { await issuesAPI.delete(id); setDeleteId(null); fetchIssues(); fetchAnalytics(); }
    catch { setError('Failed to delete issue.'); }
  };

  const summary = analytics?.summary || {};

  return (
    <div className="container-fluid px-4 py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h3 className="fw-bold mb-1">Welcome back, <span className="text-primary">{user?.name?.split(' ')[0]}</span> 👋</h3>
          <p className="text-muted small mb-0">Your project security overview.</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Link to="/ai-fix" className="btn btn-sm btn-outline-primary"><i className="bi bi-magic me-1" />AI Auto-Fix</Link>
          <Link to="/issues/new" className="btn btn-primary btn-sm"><i className="bi bi-plus-lg me-1" />New Issue</Link>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3"><StatCard label="Total Issues" value={summary.totalIssues??0} icon="bi-list-task" color="primary" loading={analyticsLoading} /></div>
        <div className="col-6 col-lg-3"><StatCard label="Open Issues" value={summary.openIssues??0} icon="bi-exclamation-circle" color="danger" loading={analyticsLoading} /></div>
        <div className="col-6 col-lg-3"><StatCard label="Code Scans" value={summary.totalAnalyses??0} icon="bi-cpu" color="success" loading={analyticsLoading} /></div>
        <div className="col-6 col-lg-3"><StatCard label="Avg Security Score" value={summary.avgSecurityScore!=null?`${summary.avgSecurityScore}/10`:'N/A'} icon="bi-shield-check" color="info" loading={analyticsLoading} /></div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-4">
          {analyticsLoading ? <ChartSkeleton /> : <StatusChart data={analytics?.statusData||[]} loading={false} />}
        </div>
        <div className="col-12 col-lg-4">
          {analyticsLoading ? <ChartSkeleton /> : <PriorityChart data={analytics?.priorityData||[]} loading={false} />}
        </div>
        <div className="col-12 col-lg-4">
          <div className="card st-card h-100">
            <div className="card-header" style={{padding:'12px 16px',fontSize:13,fontWeight:600}}>
              <i className="bi bi-activity text-success me-2" />Quick Stats
            </div>
            <div className="card-body p-3">
              {analyticsLoading ? <div className="d-flex flex-column gap-2">{[1,2,3,4].map(i=><div key={i} className="st-skeleton" style={{height:40,borderRadius:8}} />)}</div> : (
                <div className="d-flex flex-column gap-2">
                  {[
                    {label:'Issues this week',value:summary.recentActivity??0,icon:'bi-plus-circle',color:'#3b82f6'},
                    {label:'Open issues',value:summary.openIssues??0,icon:'bi-exclamation-circle',color:'#ef4444'},
                    {label:'Closed issues',value:summary.closedIssues??0,icon:'bi-check-circle',color:'#22c55e'},
                    {label:'Total scans',value:summary.totalAnalyses??0,icon:'bi-cpu',color:'#a78bfa'},
                  ].map(item=>(
                    <div key={item.label} className="d-flex align-items-center gap-3" style={{padding:'10px 12px',background:'rgba(255,255,255,.03)',borderRadius:8,border:'1px solid rgba(255,255,255,.06)'}}>
                      <i className={`bi ${item.icon}`} style={{color:item.color,fontSize:16,flexShrink:0}} />
                      <span className="text-muted small flex-grow-1">{item.label}</span>
                      <span className="fw-bold" style={{color:item.color}}>{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        {analyticsLoading ? <ChartSkeleton /> : <TimelineChart data={analytics?.timeSeriesData||[]} loading={false} />}
      </div>

      <div className="card st-card mb-3">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text st-input-icon"><i className="bi bi-search" /></span>
                <input type="text" className="form-control st-input" placeholder="Search issues…" value={filters.search} onChange={e=>setFilters(p=>({...p,search:e.target.value}))} />
              </div>
            </div>
            {[{key:'status',opts:['All','Open','In Progress','Closed']},{key:'priority',opts:['All','Critical','High','Medium','Low']}].map(({key,opts})=>(
              <div className="col-6 col-md-2" key={key}>
                <select className="form-select form-select-sm st-input" value={filters[key]} onChange={e=>setFilters(p=>({...p,[key]:e.target.value}))}>
                  {opts.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div className="col-6 col-md-2">
              <select className="form-select form-select-sm st-input" value={filters.sortBy} onChange={e=>setFilters(p=>({...p,sortBy:e.target.value}))}>
                <option value="createdAt">Date Created</option><option value="title">Title</option>
                <option value="status">Status</option><option value="priority">Priority</option>
              </select>
            </div>
            <div className="col-6 col-md-2">
              <select className="form-select form-select-sm st-input" value={filters.order} onChange={e=>setFilters(p=>({...p,order:e.target.value}))}>
                <option value="desc">Newest First</option><option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger d-flex gap-2 py-2 mb-3"><i className="bi bi-exclamation-circle-fill" />{error}</div>}

      <div className="card st-card">
        <div className="card-header d-flex justify-content-between align-items-center py-3">
          <span className="fw-semibold"><i className="bi bi-kanban me-2 text-primary" />Issues <span className="badge bg-primary ms-1">{issues.length}</span></span>
          <Link to="/issues/new" className="btn btn-primary btn-sm"><i className="bi bi-plus-lg me-1" />Add</Link>
        </div>
        <div className="card-body p-0">
          {issuesLoading ? (
            <div className="table-responsive"><table className="table st-table mb-0"><thead><tr><th>Title</th><th>Status</th><th>Priority</th><th>Assigned To</th><th>Created</th><th>Actions</th></tr></thead><tbody><TableSkeleton /></tbody></table></div>
          ) : issues.length === 0 ? (
            <div className="text-center py-5 text-muted"><i className="bi bi-inbox fs-1 d-block mb-2" /><p className="mb-2">No issues found.</p><Link to="/issues/new" className="btn btn-sm btn-primary">Create your first issue</Link></div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover st-table mb-0">
                <thead><tr><th>Title</th><th>Status</th><th>Priority</th><th>Assigned To</th><th>Created</th><th>Actions</th></tr></thead>
                <tbody>
                  {issues.map(issue=>(
                    <tr key={issue._id}>
                      <td>
                        <div className="fw-medium" style={{fontSize:13}}>{issue.title}</div>
                        <div className="text-muted small text-truncate" style={{maxWidth:300}}>{issue.description}</div>
                        {issue.tags?.length>0&&<div className="mt-1">{issue.tags.slice(0,3).map(t=><span key={t} className="badge bg-primary bg-opacity-10 text-primary me-1" style={{fontSize:10}}>{t}</span>)}</div>}
                      </td>
                      <td><span className={`badge bg-${STATUS_COLORS[issue.status]}-subtle text-${STATUS_COLORS[issue.status]} border border-${STATUS_COLORS[issue.status]}-subtle`}>{issue.status}</span></td>
                      <td><span className={`badge bg-${PRIORITY_COLORS[issue.priority]}-subtle text-${PRIORITY_COLORS[issue.priority]} border border-${PRIORITY_COLORS[issue.priority]}-subtle`}>{issue.priority}</span></td>
                      <td className="text-muted small">{issue.assignedTo||'—'}</td>
                      <td className="text-muted small">{new Date(issue.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-outline-primary" onClick={()=>navigate(`/issues/${issue._id}/edit`)}><i className="bi bi-pencil" /></button>
                          <button className="btn btn-sm btn-outline-danger" onClick={()=>setDeleteId(issue._id)}><i className="bi bi-trash" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {deleteId&&(
        <div className="modal d-block st-modal-backdrop">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content st-modal-content">
              <div className="modal-header border-0"><h5 className="modal-title"><i className="bi bi-exclamation-triangle text-danger me-2" />Confirm Delete</h5><button className="btn-close btn-close-white" onClick={()=>setDeleteId(null)} /></div>
              <div className="modal-body text-muted">Are you sure you want to delete this issue? This cannot be undone.</div>
              <div className="modal-footer border-0"><button className="btn btn-secondary" onClick={()=>setDeleteId(null)}>Cancel</button><button className="btn btn-danger" onClick={()=>handleDelete(deleteId)}><i className="bi bi-trash me-1" />Delete</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
