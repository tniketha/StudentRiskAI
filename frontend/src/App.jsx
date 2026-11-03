
import { useMemo, useState } from 'react';
import './App.css';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const API_URL = 'http://localhost:8000';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [createAdminMessage, setCreateAdminMessage] = useState('');
  const [createAdminLoading, setCreateAdminLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordResetMessage, setPasswordResetMessage] = useState('');
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [activePage, setActivePage] = useState('overview');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [attendance, setAttendance] = useState('');
  const [averageMarks, setAverageMarks] = useState('');
  const [g1, setG1] = useState('');
  const [g2, setG2] = useState('');
  const [studytime, setStudytime] = useState('');
  const [failures, setFailures] = useState('');
  const [selectedRiskCategory, setSelectedRiskCategory] = useState('');

  const totalStudents = students.length;
  const highRiskStudents = students.filter(
  (student) => student.risk_level === 'High Risk'
  );

  const mediumRiskStudents = students.filter(
    (student) => student.risk_level === 'Medium Risk'
  );

  const averageAttendance = useMemo(() => {
    const values = students.map((s) => s.attendance_percentage)
      .filter((v) => v !== null && v !== undefined && Number.isFinite(Number(v)));
    return values.length ? (values.reduce((sum, v) => sum + Number(v), 0) / values.length).toFixed(1) : '—';
  }, [students]);

  const averageMarksValue = useMemo(() => {
    const values = students.map((s) => s.gpa)
      .filter((v) => v !== null && v !== undefined && Number.isFinite(Number(v)));
    return values.length ? (values.reduce((sum, v) => sum + Number(v), 0) / values.length).toFixed(1) : '—';
  }, [students]);

  const performanceData = useMemo(() => students.map((student) => ({
  id: `ID ${student.id}`,
  attendance: student.attendance_percentage == null
    ? 0
    : Number(student.attendance_percentage),
  marks: student.gpa == null
    ? 0
    : Number(student.gpa),
})), [students]);

  const dataCoverage = useMemo(() => {
    const complete = students.filter((s) => s.attendance_percentage != null && s.gpa != null).length;
    return [
      { name: 'Complete records', value: complete, color: '#2563eb' },
      { name: 'Incomplete records', value: totalStudents - complete, color: '#dbeafe' },
    ].filter((item) => item.value > 0);
  }, [students, totalStudents]);

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return students;
    return students.filter((s) =>
      String(s.student_name || '').toLowerCase().includes(query) || String(s.id).includes(query)
    );
  }, [students, searchTerm]);

  async function fetchStudents(token) {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setStudents(Array.isArray(data) ? data : []);
      } else {
        setError(data.detail || 'Unable to load student records.');
        if (response.status === 401) handleLogout();
      }
    } catch {
      setError('Cannot connect to the backend. Make sure FastAPI is running.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoginMessage('');
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setLoginMessage(data.detail || 'Login failed. Check your username and password.');
        return;
      }
      setAccessToken(data.access_token);
      setPassword('');
      setLoginMessage('');
      await fetchStudents(data.access_token);
    } catch {
      setLoginMessage('Cannot connect to the backend. Make sure FastAPI is running.');
    }
  }

async function handleForgotPassword(event) {
  event.preventDefault();
  setResetMessage('');
  setResetLoading(true);

  try {
    const response = await fetch(`${API_URL}/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: resetEmail }),
    });

    const data = await response.json();

    if (!response.ok) {
      setResetMessage(data.detail || 'Unable to process your request.');
      return;
    }

    setResetMessage(data.message);
  } catch {
    setResetMessage('Cannot connect to the backend.');
  } finally {
    setResetLoading(false);
  }
}

async function handleCreateAdmin(event) {
  event.preventDefault();

  setCreateAdminMessage('');
  setCreateAdminLoading(true);

  try {
    const response = await fetch(`${API_URL}/admins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        username: newAdminUsername,
        email: newAdminEmail,
        password: newAdminPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setCreateAdminMessage(
        data.detail || 'Unable to create admin account.'
      );
      return;
    }

    setCreateAdminMessage(data.message);
    setNewAdminUsername('');
    setNewAdminEmail('');
    setNewAdminPassword('');
  } catch {
    setCreateAdminMessage('Cannot connect to the backend.');
  } finally {
    setCreateAdminLoading(false);
  }
}

async function handlePasswordReset(event) {
  event.preventDefault();

  setPasswordResetMessage('');

  if (newPassword !== confirmPassword) {
    setPasswordResetMessage('Passwords do not match.');
    return;
  }

  if (newPassword.length < 8) {
    setPasswordResetMessage('Password must contain at least 8 characters.');
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (!token) {
    setPasswordResetMessage('Invalid or missing reset link.');
    return;
  }

  setPasswordResetLoading(true);

  try {
    const response = await fetch(`${API_URL}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        new_password: newPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setPasswordResetMessage(
        data.detail || 'Password reset failed. Please request a new link.'
      );
      return;
    }

    setPasswordResetMessage('Password reset successful! You can now log in.');
    setNewPassword('');
    setConfirmPassword('');
  } catch {
    setPasswordResetMessage('Cannot connect to the backend.');
  } finally {
    setPasswordResetLoading(false);
  }
}

function handleLogout() {
    setAccessToken('');
    setStudents([]);
    setUsername('');
    setPassword('');
    setActivePage('overview');
    setSelectedStudent(null);
    setError('');
  }

  function openAddStudent() {
  setEditingStudent(null);
  setStudentName('');
  setAttendance('');
  setAverageMarks('');
  setG1('');
  setG2('');
  setStudytime('');
  setFailures('');
  setFormMessage('');
  setShowStudentForm(true);
}

  function openEditStudent(student) {
  setEditingStudent(student);
  setStudentName(student.student_name || '');
  setAttendance(student.attendance_percentage ?? '');
  setAverageMarks(student.gpa ?? '');
  setG1(student.g1 ?? '');
  setG2(student.g2 ?? '');
  setStudytime(student.studytime ?? '');
  setFailures(student.failures ?? '');
  setFormMessage('');
  setShowStudentForm(true);
}

  async function handleSaveStudent(event) {
    event.preventDefault();
    setSaving(true);
    setFormMessage('');
    const payload = {
      student_name: studentName.trim(),
      attendance_percentage: attendance === '' ? null : Number(attendance),
      gpa: averageMarks === '' ? null : Number(averageMarks),
      g1: Number(g1),
      g2: Number(g2),
      studytime: Number(studytime),
      failures: Number(failures),
    };
    const editing = Boolean(editingStudent);
    const url = editing ? `${API_URL}/students/${editingStudent.id}` : `${API_URL}/students`;
    try {
      const response = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setFormMessage(data.detail || 'Could not save this student.');
        return;
      }
      setShowStudentForm(false);
      setEditingStudent(null);
      await fetchStudents(accessToken);
    } catch {
      setFormMessage('Cannot connect to the backend.');
    } finally {
      setSaving(false);
    }
  }
   async function handleDeleteStudent(student) {
    const confirmed = window.confirm(`Delete ${student.student_name}? This cannot be undone.`);
    if (!confirmed) return;
    try {
      const response = await fetch(`${API_URL}/students/${student.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.detail || 'Could not delete student.');
        return;
      }
      if (selectedStudent?.id === student.id) setSelectedStudent(null);
      await fetchStudents(accessToken);
    } catch {
      setError('Cannot connect to the backend.');
    }
  }
  
if (!accessToken) {
  const resetToken = new URLSearchParams(window.location.search).get('token');

  if (resetToken && !showForgotPassword) {
    return (
      <div className="login-page">
        <div className="login-form-side">
          <div className="login-card">
            <div className="login-icon">SR</div>

            <span className="eyebrow">ACCOUNT RECOVERY</span>
            <h2>Reset your password</h2>
            <p>Enter and confirm your new password.</p>

            <form onSubmit={handlePasswordReset}>
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                minLength={8}
                required
              />

              <label htmlFor="confirm-password">Confirm password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                minLength={8}
                required
              />

              {passwordResetMessage && (
                <p className="form-feedback">{passwordResetMessage}</p>
              )}

              <button
                className="primary-button"
                type="submit"
                disabled={passwordResetLoading}
              >
                {passwordResetLoading ? 'Updating...' : 'Reset password'}
              </button>
            </form>

            {passwordResetMessage.includes('successful') && (
              <button
                className="text-button"
                onClick={() => {
                  window.history.replaceState({}, '', '/');
                  setPasswordResetMessage('');
                  setShowForgotPassword(false);
                }}
              >
                Back to login
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
  if (showForgotPassword) {
    return (
      <div className="login-page">
        <div className="login-form-side">
          <div className="login-card">
            <div className="login-icon">SR</div>

            <span className="eyebrow">ACCOUNT RECOVERY</span>
            <h2>Forgot your password?</h2>

            <p>
              Enter your registered admin email address.
              We'll send you a password reset link.
            </p>

            <form onSubmit={handleForgotPassword}>
              <label htmlFor="reset-email">Email address</label>

              <input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />

              {resetMessage && (
                <p className="form-feedback">{resetMessage}</p>
              )}

              <button
                className="primary-button"
                type="submit"
                disabled={resetLoading}
              >
                {resetLoading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>

            <button
              className="text-button"
              onClick={() => {
                setShowForgotPassword(false);
                setResetMessage('');
              }}
            >
              ← Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="login-page">
      <div className="login-layout">

        {/* LEFT INTRODUCTION SECTION */}
        <div className="login-intro">
          <div className="login-brand">
            <div className="brand-mark">SR</div>
            <div>
              <strong>StudentRiskAI</strong>
              <small>ACADEMIC INTELLIGENCE</small>
            </div>
          </div>

          <div className="intro-content">
            <span className="eyebrow">SMARTER EDUCATION WITH AI</span>

            <h1>
              Understand risk.
              <br />
              <span>Support success.</span>
            </h1>

            <p>
              An intelligent academic monitoring platform that helps
              educators identify students at risk and make better
              academic decisions.
            </p>

            <div className="ai-visual">
              <div className="visual-glow"></div>
              <div className="visual-circle circle-one"></div>
              <div className="visual-circle circle-two"></div>

              <div className="visual-card">
                <div className="visual-card-header">
                  <span>AI ACADEMIC INSIGHTS</span>
                  <span className="live-dot">● LIVE</span>
                </div>

                <div className="visual-chart">
                  <div style={{ height: '42%' }}></div>
                  <div style={{ height: '68%' }}></div>
                  <div style={{ height: '52%' }}></div>
                  <div style={{ height: '85%' }}></div>
                  <div style={{ height: '72%' }}></div>
                  <div style={{ height: '95%' }}></div>
                </div>

                <div className="visual-stats">
                  <div>
                    <strong>AI</strong>
                    <span>Prediction</span>
                  </div>
                  <div>
                    <strong>SHAP</strong>
                    <span>Explanation</span>
                  </div>
                  <div>
                    <strong>3</strong>
                    <span>Risk levels</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="intro-features">
              <div>
                <span className="feature-icon">◎</span>
                <span>
                  <strong>Risk identification</strong>
                  <small>Identify students who need support.</small>
                </span>
              </div>

              <div>
                <span className="feature-icon">✧</span>
                <span>
                  <strong>Explainable AI</strong>
                  <small>Understand the factors behind predictions.</small>
                </span>
              </div>

              <div>
                <span className="feature-icon">↗</span>
                <span>
                  <strong>Academic insights</strong>
                  <small>Monitor student performance.</small>
                </span>
              </div>
            </div>
          </div>

          <div className="intro-footer">
            Intelligent insights for better student outcomes.
          </div>
        </div>

        {/* RIGHT LOGIN SECTION */}
        <div className="login-form-side">
          <div className="login-card">
            <div className="login-icon">SR</div>

            <span className="eyebrow">WELCOME BACK</span>
            <h2>Sign in to your account</h2>
            <p>Access your academic intelligence dashboard.</p>

            <form onSubmit={handleLogin}>
              <label htmlFor="username">Username</label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="Enter your username"
                required
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Enter your password"
                required
              />

              {loginMessage && (
                <p className="form-feedback">{loginMessage}</p>
              )}

              <button
                type="button"
                className="text-button"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot password?
              </button>
              
              <button className="primary-button" type="submit">
                Sign in <span>→</span>
              </button>
            </form>

            <div className="login-security">
              <span>♙</span>
              Secure access for teachers and administrators only
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}


  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">SR</div><div><strong>StudentRiskAI</strong><small>ACADEMIC INTELLIGENCE</small></div></div>
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="side-nav">
          <button className={activePage === 'overview' ? 'active' : ''} onClick={() => setActivePage('overview')}>▦ <span>Overview</span></button>
          <button className={activePage === 'students' ? 'active' : ''} onClick={() => setActivePage('students')}>♙ <span>Students</span></button>
          <button className={activePage === 'risk' ? 'active' : ''} onClick={() => setActivePage('risk')}>◎ <span>AI Risk Analysis</span></button>
          <button className={activePage === 'reports' ? 'active' : ''} onClick={() => setActivePage('reports')}>▤ <span>Reports</span></button>
          <button
            className={activePage === 'create-admin' ? 'active' : ''}
            onClick={() => {
              setActivePage('create-admin');
              setCreateAdminMessage('');
            }}
          >
            ♙ <span>Create Admin</span>
          </button>
        </nav>
        <div className="sidebar-bottom"><div className="admin-mini"><span className="admin-avatar">A</span><span><strong>{username || 'Administrator'}</strong><small>Administrator</small></span></div><button className="logout-button" onClick={handleLogout}>Log out</button></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><div><span className="topbar-label">STUDENTRISKAI / {activePage.toUpperCase()}</span>
        <strong>
          {activePage === 'overview'
            ? 'Overview'
            : activePage === 'students'
            ? 'Student management'
            : activePage === 'risk'
            ? 'AI Risk Analysis'
            : activePage === 'create-admin'
            ? 'Create Admin'
            : 'Reports'}
        </strong></div><div className="topbar-right"><span className="status-pill neutral"><i /> Admin session</span><button className="icon-button" onClick={handleLogout} title="Log out">↗</button></div></header>
        <div className="page-content">
          {error && <div className="notice-card error-notice"><div><strong>Something needs attention</strong><p>{error}</p></div><button className="icon-button" onClick={() => setError('')}>✕</button></div>}
          {activePage === 'create-admin' && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">ADMINISTRATION</span>
                  <h2>Create Admin Account</h2>
                  <p>Register another teacher or administrator.</p>
                </div>
              </div>

              <form className="create-admin-form" onSubmit={handleCreateAdmin}>
                <label htmlFor="new-admin-username">Username</label>
                <input
                  id="new-admin-username"
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                />

                <label htmlFor="new-admin-email">Email address</label>
                <input
                  id="new-admin-email"
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="Enter email"
                  required
                />

                <label htmlFor="new-admin-password">Password</label>
                <input
                  id="new-admin-password"
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                />

                {createAdminMessage && (
                  <p className="form-feedback">{createAdminMessage}</p>
                )}

                <button
                  className="primary-button"
                  type="submit"
                  disabled={createAdminLoading}
                >
                  {createAdminLoading ? 'Creating...' : 'Create account'}
                </button>
              </form>
            </section>
          )}
          
          {activePage === 'overview' && (
            <>
              <div className="page-heading"><div><span className="eyebrow">YOUR ACADEMIC OVERVIEW</span><h1>Dashboard</h1><p>Monitor student records and academic performance in one place.</p></div><button className="primary-button" onClick={openAddStudent}>＋ Add student</button></div>
              <section className="stat-grid">
                <StatCard
                  label="Student records"
                  value={totalStudents}
                  note="Current database records"
                  icon="♙"
                  tone="blue"
                />

                <StatCard
                  label="Average attendance"
                  value={averageAttendance === '—' ? '—' : `${averageAttendance}%`}
                  note="Available attendance entries"
                  icon="◷"
                  tone="violet"
                />

                <StatCard
                  label="GPA"
                  value={averageMarksValue}
                  note="Available marks entries"
                  icon="▤"
                  tone="green"
                />

                <StatCard
                  label="High Risk students"
                  value={highRiskStudents.length}
                  note="Click to view student details"
                  icon="↑"
                  tone="amber"
                  onClick={() => setSelectedRiskCategory('High Risk')}
                />

                <StatCard
                  label="Medium Risk students"
                  value={mediumRiskStudents.length}
                  note="Click to view student details"
                  icon="≈"
                  tone="violet"
                  onClick={() => setSelectedRiskCategory('Medium Risk')}
                />

              </section>
              <section className="dashboard-grid">
                <div className="panel chart-panel"><div className="panel-heading"><div><h2>Academic performance</h2><p>Attendance and GPA by student</p></div></div>
                  {performanceData.length ? <div className="chart-area"><ResponsiveContainer width="100%" height={280}><BarChart data={performanceData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="id" /><YAxis domain={[0, 100]} /><Tooltip /><Legend /><Bar dataKey="attendance" name="Attendance %" fill="#2563eb" radius={[5, 5, 0, 0]} /><Bar dataKey="marks" name="GPA" fill="#8b5cf6" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div> : <EmptyState title="No performance data yet" description="Add student records to see the chart." />}
                </div>
                <div className="panel chart-panel"><div className="panel-heading"><div><h2>Data completeness</h2><p>Student records with both academic fields</p></div></div>
                  {dataCoverage.length ? <div className="chart-area"><ResponsiveContainer width="100%" height={230}><PieChart><Pie data={dataCoverage} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={4}>{dataCoverage.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div> : <EmptyState title="No student records" description="Data completeness will appear when records are added." />}
                </div>
              </section>
              <section className="panel table-panel"><div className="panel-heading"><div><h2>Recent students</h2><p>Recently available student records</p></div><button className="text-button" onClick={() => setActivePage('students')}>View all students →</button></div><StudentTable students={students.slice(-5).reverse()} onEdit={openEditStudent} onDelete={handleDeleteStudent} onView={(student) => { setSelectedStudent(student); setActivePage('students'); }} compact /></section>
            </>
          )}

          {activePage === 'students' && (
            <>
              <div className="page-heading"><div><span className="eyebrow">STUDENT RECORDS</span><h1>Students</h1><p>Add, update, search and manage academic records.</p></div><button className="primary-button" onClick={openAddStudent}>＋ Add student</button></div>
              <section className="panel table-panel">
                <div className="table-toolbar"><div><h2>All students</h2><p>{totalStudents} records</p></div><input className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name or ID..." /></div>
                {loading ? <EmptyState title="Loading students…" description="Please wait while records are retrieved." /> : <StudentTable students={filteredStudents} onEdit={openEditStudent} onDelete={handleDeleteStudent} onView={setSelectedStudent} />}
              </section>
              {selectedStudent && (
                <section className="panel detail-panel">
                  <div className="panel-heading"><div><h2>Student details</h2><p>Record ID #{selectedStudent.id}</p></div><button className="icon-button" onClick={() => setSelectedStudent(null)}>✕</button></div>
                  <div className="detail-grid">
                    {selectedStudent.risk_explanation?.length > 0 && (
                      <div className="panel">
                        <div className="panel-heading">
                          <div>
                            <h2>Why did the AI make this prediction?</h2>
                            <p>Important factors influencing the model's prediction</p>
                          </div>
                        </div>

                        {selectedStudent.risk_explanation.map((reason, index) => (
                          <div key={index} className="detail-item">
                            <span>
                              {{
                                G1: "First period grade",
                                G2: "Second period grade",
                                failures: "Previous failures",
                                studytime: "Study time"
                              }[reason.factor] || reason.factor}
                            </span>
                            <strong>
                              +{Number(reason.influence).toFixed(3)}
                              {" "}
                              {Number(reason.influence) >= 0.4
                                ? "(High influence)"
                                : Number(reason.influence) >= 0.1
                                ? "(Medium influence)"
                                : "(Low influence)"}
                            </strong>
                          </div>
                        ))}
                      </div>
                    )}
                    <Detail label="Student name" value={selectedStudent.student_name} />
                    <Detail label="Attendance" value={selectedStudent.attendance_percentage == null ? 'Not entered' : `${selectedStudent.attendance_percentage}%`} />
                    <Detail label="GPA" value={selectedStudent.gpa == null ? 'Not entered' : selectedStudent.gpa} />
                    <Detail
                      label="First period grade (G1)"
                      value={selectedStudent.g1 ?? '—'}
                    />

                    <Detail
                      label="Second period grade (G2)"
                      value={selectedStudent.g2 ?? '—'}
                    />

                    <Detail
                      label="Study time"
                      value={selectedStudent.studytime ?? '—'}
                    />

                    <Detail
                      label="Previous failures"
                      value={selectedStudent.failures ?? '—'}
                    />

                    <Detail
                      label="AI prediction"
                      value={selectedStudent.risk_level || 'Not assessed'}
                    />
                    <Detail
                      label="Recommended action"
                      value={
                        selectedStudent.risk_level === 'High Risk'
                          ? 'Provide immediate academic support and monitor progress closely.'
                          : selectedStudent.risk_level === 'Medium Risk'
                          ? 'Monitor academic progress and provide additional guidance.'
                          : selectedStudent.risk_level === 'Low Risk'
                          ? 'Continue regular academic monitoring and encourage progress.'
                          : 'No recommendation available.'
                      }
                    />
                  </div>
                </section>
              )}
            </>
          )}

          
          {activePage === 'risk' && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">EXPLAINABLE MACHINE LEARNING</span>
                  <h1>AI Risk Analysis</h1>
                  <p>Review AI-generated student risk predictions and explanations.</p>
                </div>
                <span className="status-pill low-risk">
                  <i /> Model connected
                </span>
              </div>

              <section className="stat-grid risk-stat-grid">
                <StatCard
                  label="High risk"
                  value={students.filter(s => s.risk_level === 'High Risk').length}
                  note="Students requiring attention"
                  icon="↑"
                  tone="red"
                />
                <StatCard
                  label="Medium risk"
                  value={students.filter(s => s.risk_level === 'Medium Risk').length}
                  note="Students needing monitoring"
                  icon="≈"
                  tone="amber"
                />
                <StatCard
                  label="Low risk"
                  value={students.filter(s => s.risk_level === 'Low Risk').length}
                  note="Students currently at lower risk"
                  icon="↓"
                  tone="green"
                />
                <StatCard
                  label="Model status"
                  value="Active"
                  note={`${students.filter(s => s.risk_level).length} students assessed`}
                  icon="◎"
                  tone="blue"
                />
              </section>

              <section className="dashboard-grid">
                <div className="panel chart-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Prediction summary</h2>
                      <p>Distribution of AI-generated risk categories</p>
                    </div>
                  </div>

                  {students.some(s => s.risk_level) ? (
                    <div className="chart-area">
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: 'High Risk',
                                value: students.filter(s => s.risk_level === 'High Risk').length
                              },
                              {
                                name: 'Medium Risk',
                                value: students.filter(s => s.risk_level === 'Medium Risk').length
                              },
                              {
                                name: 'Low Risk',
                                value: students.filter(s => s.risk_level === 'Low Risk').length
                              }
                            ].filter(item => item.value > 0)}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            outerRadius={95}
                            paddingAngle={4}
                          >
                            <Cell fill="#ef4444" />
                            <Cell fill="#f59e0b" />
                            <Cell fill="#22c55e" />
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EmptyState
                      title="No predictions available"
                      description="Add student academic information to generate predictions."
                    />
                  )}
                </div>

                <div className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>How to understand the predictions</h2>
                      <p>AI risk category descriptions</p>
                    </div>
                  </div>
                  <ol className="workflow-list">
                    <li>
                      <span>1</span>
                      <div>
                        <strong>High Risk</strong>
                        <p>Students who may need early academic support.</p>
                      </div>
                    </li>
                    <li>
                      <span>2</span>
                      <div>
                        <strong>Medium Risk</strong>
                        <p>Students who may benefit from regular monitoring.</p>
                      </div>
                    </li>
                    <li>
                      <span>3</span>
                      <div>
                        <strong>Low Risk</strong>
                        <p>Students currently predicted to have lower academic risk.</p>
                      </div>
                    </li>
                  </ol>
                </div>
              </section>

              <section className="panel table-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Student risk assessments</h2>
                    <p>{students.filter(s => s.risk_level).length} students assessed by the AI model</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setActivePage('students')}
                  >
                    Review records →
                  </button>
                </div>

                <StudentTable
                  students={students.filter(s => s.risk_level)}
                  onEdit={openEditStudent}
                  onDelete={handleDeleteStudent}
                  onView={(student) => {
                    setSelectedStudent(student);
                    setActivePage('students');
                  }}
                  compact
                />
              </section>
            </>
          )}


          {activePage === 'reports' && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">ACADEMIC REPORTING</span>
                  <h1>Reports</h1>
                  <p>Generate a detailed student academic risk report.</p>
                </div>
              </div>

              {/*  shown in print preview */}
              <div className="print-report">
                <div className="report-header">
                  <h1>Student Academic Risk Report</h1>
                  <p>Generated on: {new Date().toLocaleDateString()}</p>
                </div>
                <div className="report-details">
                  <h2 className="hide-on-print">Individual Student Details</h2>

                  {students.map((student) => (
                    <div className="print-student" key={student.id}>
                      <h3>{student.student_name}</h3>

                      <table>
                        <tbody>
                          <tr><th>Student ID</th><td>{student.id}</td></tr>
                          <tr>
                            <th>Attendance</th>
                            <td>
                              {student.attendance_percentage ?? 'Not available'}
                              {student.attendance_percentage != null ? '%' : ''}
                            </td>
                          </tr>
                          <tr><th>GPA</th><td>{student.gpa ?? 'Not available'}</td></tr>
                          <tr><th>G1 Marks</th><td>{student.g1 ?? '—'}</td></tr>
                          <tr><th>G2 Marks</th><td>{student.g2 ?? '—'}</td></tr>
                          <tr><th>Study Time</th><td>{student.studytime ?? '—'}</td></tr>
                          <tr><th>Previous Failures</th><td>{student.failures ?? '—'}</td></tr>
                          <tr><th>Predicted Risk</th><td>{student.risk_level ?? 'Not assessed'}</td></tr>
                        </tbody>
                      </table>

                      <p><strong>AI Risk Explanation:</strong></p>

                      {Array.isArray(student.risk_explanation) &&
                      student.risk_explanation.length > 0 ? (
                        <div>
                          {student.risk_explanation.map((reason, index) => (
                            <p key={index}>
                              {reason.factor}
                              {reason.influence != null
                                ? ` (Influence: ${reason.influence})`
                                : ''}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p>No AI explanation available.</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="secondary-button"
                onClick={() => window.print()}
                style={{ marginTop: '20px' }}
              >
                Print this report
              </button>
            </>
          )}
        </div>
      </main>

      {showStudentForm && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowStudentForm(false); }}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="student-modal-title">
            <div className="modal-heading"><div><span className="eyebrow">STUDENT INFORMATION</span><h2 id="student-modal-title">{editingStudent ? 'Edit student' : 'Add new student'}</h2><p>Enter the academic information below.</p></div><button className="icon-button" onClick={() => setShowStudentForm(false)} aria-label="Close">✕</button></div>
            <form onSubmit={handleSaveStudent}>
              <label htmlFor="student-name">Student name</label><input id="student-name" value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="Enter full name" required />
              <div className="form-row">
              <div>
                <label htmlFor="student-attendance">Attendance (%)</label>
                <input
                  id="student-attendance"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={attendance}
                  onChange={(e) => setAttendance(e.target.value)}
                  placeholder="0–100"
                />
              </div>

              <div>
                <label htmlFor="student-marks">GPA</label>
                <input
                  id="student-marks"
                  type="number"
                  min="0"
                  max="4"
                  step="0.01"
                  value={averageMarks}
                  onChange={(e) => setAverageMarks(e.target.value)}
                  placeholder="0–4"
                />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label htmlFor="student-g1">First period grade (G1)</label>
                <input
                  id="student-g1"
                  type="number"
                  min="0"
                  max="20"
                  value={g1}
                  onChange={(e) => setG1(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="student-g2">Second period grade (G2)</label>
                <input
                  id="student-g2"
                  type="number"
                  min="0"
                  max="20"
                  value={g2}
                  onChange={(e) => setG2(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label htmlFor="student-studytime">Study time</label>
                <select
                  id="student-studytime"
                  value={studytime}
                  onChange={(e) => setStudytime(e.target.value)}
                  required
                >
                  <option value="">Select study time</option>
                  <option value="1">1 - Less than 2 hours</option>
                  <option value="2">2 - 2 to 5 hours</option>
                  <option value="3">3 - 5 to 10 hours</option>
                  <option value="4">4 - More than 10 hours</option>
                </select>
              </div>

              <div>
                <label htmlFor="student-failures">Previous failures</label>
                <input
                  id="student-failures"
                  type="number"
                  min="0"
                  max="4"
                  value={failures}
                  onChange={(e) => setFailures(e.target.value)}
                  required
                />
              </div>
            </div>
              {formMessage && <p className="form-feedback">{formMessage}</p>}
              <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowStudentForm(false)}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving…' : editingStudent ? 'Save changes' : 'Add student'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, note, icon, tone, onClick }) {
  return (
    <div
      className="stat-card"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick();
        }
      }}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-note">{note}</div>
    </div>
  );
}

function EmptyState({ title, description }) {
  return <div className="empty-state"><div className="empty-state-icon">▤</div><strong>{title}</strong><span>{description}</span></div>;
}

function Detail({ label, value }) {
  return <div className="detail-item"><span>{label}</span><strong>{value}</strong></div>;
}

function StudentTable({ students, onEdit, onDelete, onView, compact = false }) {
  if (!students.length) return <EmptyState title="No students found" description="Add a student record or adjust your search." />;
  return (
    <div className="table-scroll">
      <table className="student-table">
        <thead><tr><th>Student</th><th>Attendance</th><th>GPA</th><th>AI status</th><th className="actions-heading">Actions</th></tr></thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td><button className="student-name-button" onClick={() => onView(student)}><span className="student-avatar">{(student.student_name || 'S').slice(0, 1).toUpperCase()}</span><span><strong>{student.student_name}</strong><small>Student ID #{student.id}</small></span></button></td>
              <td>{student.attendance_percentage == null ? '—' : `${student.attendance_percentage}%`}</td>
              <td>{student.gpa == null ? '—' : student.gpa}</td>
              <td>
                <span className={`status-pill ${
                  student.risk_level === 'High Risk'
                    ? 'high-risk'
                    : student.risk_level === 'Medium Risk'
                    ? 'medium-risk'
                    : student.risk_level === 'Low Risk'
                    ? 'low-risk'
                    : 'neutral'
                }`}>
                  {student.risk_level || 'Not assessed'}
                </span>
              </td>
              <td><div className="table-actions"><button onClick={() => onEdit(student)} aria-label={`Edit ${student.student_name}`}>Edit</button>{!compact && <button className="delete-action" onClick={() => onDelete(student)} aria-label={`Delete ${student.student_name}`}>Delete</button>}</div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;