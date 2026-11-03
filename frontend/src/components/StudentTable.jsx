import React from 'react';

function EmptyState({ title, description }) {
  return <div className="empty-state"><div className="empty-state-icon">▤</div><strong>{title}</strong><span>{description}</span></div>;
}

export default function StudentTable({ students, onEdit, onDelete, onView, compact = false }) {
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

