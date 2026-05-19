// src/pages/admin/Users.js
import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Loading, Modal, Field, PageHeader, Icons } from '../../components/UI';

// FIX: role must be sent to the backend as an integer (0/1/2), not a string.
// The backend UserRole enum is: Admin=0, Attendant=1, Viewer=2.
// Sending the string "Attendant" causes a 400: "could not be converted to UserRole".
const ROLE_OPTS = [
  { label: 'Admin',     value: 0 },
  { label: 'Attendant', value: 1 },
  { label: 'Viewer',    value: 2 },
];

// For display: map the integer the API returns back to a label.
// The backend BasicUserDTO returns Role as an integer too.
const ROLE_LABEL = { 0: 'Admin', 1: 'Attendant', 2: 'Viewer' };
const ROLE_BADGE = { 0: 'badge-dark', 1: 'badge-gray', 2: 'badge-gray' };

function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  return { toast, show };
}

export default function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const { toast, show } = useToast();
  // Default role to 1 (Attendant) as an integer
  const [form, setForm] = useState({ username: '', password: '', role: 1 });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setUsers(await api.getUsers()); }
    catch { setUsers([]); }
    finally { setLoading(false); }
  }

  async function createUser() {
    if (!form.username || !form.password) { show('Username and password are required', 'error'); return; }
    try {
      // role is already an integer — send it as-is
      await api.createUser({ ...form, role: +form.role });
      show('User created');
      setModal(false);
      load();
    } catch (e) { show(e.message, 'error'); }
  }

  async function toggleActive(user) {
    try {
      if (user.isActive) {
        await api.deactivateUser(user.id ?? user.userId);
        show(`${user.username} deactivated`);
      } else {
        await api.reactivateUser(user.id ?? user.userId);
        show(`${user.username} reactivated`);
      }
      load();
    } catch (e) { show(e.message, 'error'); }
  }

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        title="User Management"
        action={
          <button className="btn btn-primary btn-sm" onClick={() => { setForm({ username: '', password: '', role: 1 }); setModal(true); }}>
            <Icons.Plus /> Add User
          </button>
        }
      />

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Username</th><th>Role</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {users.length === 0
              ? <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 32 }}>No users found</td></tr>
              : users.map(u => (
                  <tr key={u.userId ?? u.id ?? u.username}>
                    <td style={{ fontWeight: 500 }}>{u.username}</td>
                    <td>
                      <span className={`badge ${ROLE_BADGE[u.role] ?? 'badge-gray'}`}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: u.isActive ? 'var(--gray-500)' : 'var(--gray-700)' }}
                        onClick={() => toggleActive(u)}
                      >
                        {u.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal
          title="Create User"
          onClose={() => setModal(false)}
          actions={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={createUser}>Create</button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Username">
              <input className="input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="john.doe" autoFocus />
            </Field>
            <Field label="Password">
              <input className="input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
            </Field>
            <Field label="Role">
              <select className="select" value={form.role} onChange={e => setForm(f => ({ ...f, role: +e.target.value }))}>
                {ROLE_OPTS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </Field>
          </div>
        </Modal>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}