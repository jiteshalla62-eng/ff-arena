'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type T = {
  id: string;
  title: string;
  mode: string;
  map_name: string;
  entry_fee: number;
  prize_pool: number;
  starts_at: string;
  slots_total: number;
  description: string | null;
  is_published: boolean;
};

type R = {
  id: string;
  player_name: string;
  game_uid: string;
  team_name: string | null;
  mode: string;
  status: string;
  payment_reference: string | null;
  upi_id: string | null;
  upi_name: string | null;
  payment_submitted_at: string | null;
  tournament_id: string;
  tournaments?: { title: string } | null;
};

export default function Admin() {
  const [allowed, setAllowed] = useState(false);
  const [ready, setReady] = useState(false);
  const [tournaments, setTournaments] = useState<T[]>([]);
  const [regs, setRegs] = useState<R[]>([]);
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState('Squad');
  const [map, setMap] = useState('Bermuda');
  const [fee, setFee] = useState('50');
  const [prize, setPrize] = useState('1000');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState('48');
  const [description, setDescription] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [reviewing, setReviewing] = useState('');

  const db = supabase;

  async function load() {
    const s = db();

    const {
      data: { user },
    } = await s.auth.getUser();

    if (!user) {
      setAllowed(false);
      setRegs([]);
      setReady(true);
      return;
    }

    const { data: p, error: profileError } = await s
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || p?.role !== 'admin') {
      setAllowed(false);
      setRegs([]);
      setReady(true);
      return;
    }

    setAllowed(true);

    const [ts, rs] = await Promise.all([
      s
        .from('tournaments')
        .select('*')
        .order('starts_at', {
          ascending: false,
        }),

      s
        .from('registrations')
        .select('*,tournaments(title)')
        .order('created_at', {
          ascending: false,
        }),
    ]);

    if (ts.error) throw ts.error;
    if (rs.error) throw rs.error;

    setTournaments((ts.data || []) as T[]);
    setRegs((rs.data || []) as R[]);
    setReady(true);
  }

  useEffect(() => {
    load().catch(e => {
      setNotice(e.message);
      setReady(true);
    });
  }, []);

  async function refreshDashboard() {
    setRefreshing(true);

    try {
      await load();
      setNotice('Dashboard refreshed.');
    } catch (e: any) {
      setNotice(
        e.message || 'Could not refresh dashboard.'
      );
    } finally {
      setRefreshing(false);
    }
  }

  async function create() {
    try {
      const { error } = await db()
        .from('tournaments')
        .insert({
          title,
          mode,
          map_name: map,
          entry_fee: Number(fee),
          prize_pool: Number(prize),
          starts_at: new Date(date).toISOString(),
          slots_total: Number(slots),
          description,
          is_published: true,
        });

      if (error) throw error;

      setNotice('Tournament published.');
      setTitle('');

      await load();
    } catch (e: any) {
      setNotice(e.message);
    }
  }

  async function review(
    id: string,
    status: 'approved' | 'rejected'
  ) {
    const registration = regs.find(r => r.id === id);

    if (!registration) return;

    if (status === 'approved') {
      if (registration.status !== 'payment_review') {
        setNotice(
          'The player must submit payment details first.'
        );
        return;
      }

      const confirmed = window.confirm(
        'Approve this registration? Make sure you have independently verified any required payment.'
      );

      if (!confirmed) return;
    }

    setReviewing(id);

    try {
      const { data, error } = await db()
        .from('registrations')
        .update({ status })
        .eq('id', id)
        .eq('status', registration.status)
        .select('id')
        .single();

      if (error || !data) {
        throw new Error(
          error?.message ||
          'Registration could not be updated.'
        );
      }

      setNotice(
        status === 'approved'
          ? 'Registration approved successfully.'
          : 'Registration rejected.'
      );

      await load();
    } catch (e: any) {
      setNotice(e.message);
    } finally {
      setReviewing('');
    }
  }

  async function saveRoom(id: string) {
    const room =
      (
        document.getElementById(
          'room-' + id
        ) as HTMLInputElement
      )?.value || '';

    const pass =
      (
        document.getElementById(
          'pass-' + id
        ) as HTMLInputElement
      )?.value || '';

    if (!room || !pass) {
      setNotice(
        'Enter both room ID and password.'
      );
      return;
    }

    const { error } = await db()
      .from('tournament_rooms')
      .upsert({
        tournament_id: id,
        room_id: room,
        room_password: pass,
        updated_at: new Date().toISOString(),
      });

    setNotice(
      error?.message ||
      'Room details saved. Only approved players and admins can read them.'
    );
  }

  if (!ready) {
    return (
      <main className="admin-wrap">
        Loading admin panel…
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="admin-wrap">
        <a className="brand" href="/">
          ◆ BATTLE_<b>VERSE</b>
        </a>

        <h1>ADMIN ACCESS REQUIRED</h1>

        <p>
          Sign in with the host account and make
          sure its profile role is set to admin
          in Supabase.
        </p>

        <a className="outline" href="/">
          BACK TO WEBSITE
        </a>
      </main>
    );
  }

  return (
    <main className="admin-wrap">
      <nav className="nav">
        <a className="brand" href="/">
          ◆ BATTLE_<b>VERSE</b>
        </a>

        <span className="live">
          HOST CONTROL PANEL
        </span>

        <a href="/">VIEW WEBSITE ↗</a>
      </nav>

      <section className="section">
        <p className="eyebrow">
          TOURNAMENT CONTROL
        </p>

        <h1 className="admin-title">
          BATTLE_VERSE <em>ADMIN</em>
        </h1>

        <div className="panel admin-form">
          <h3>PUBLISH A TOURNAMENT</h3>

          <div className="admin-grid">
            <label>
              Tournament title

              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Friday Night Squad Cup"
              />
            </label>

            <label>
              Mode

              <select
                value={mode}
                onChange={e => setMode(e.target.value)}
              >
                <option>Solo</option>
                <option>Duo</option>
                <option>Squad</option>
              </select>
            </label>

            <label>
              Map

              <input
                value={map}
                onChange={e => setMap(e.target.value)}
              />
            </label>

            <label>
              Entry fee (₹)

              <input
                type="number"
                min="0"
                value={fee}
                onChange={e => setFee(e.target.value)}
              />
            </label>

            <label>
              Prize pool (₹)

              <input
                type="number"
                min="0"
                value={prize}
                onChange={e => setPrize(e.target.value)}
              />
            </label>

            <label>
              Start date & time

              <input
                type="datetime-local"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </label>

            <label>
              Total slots

              <input
                type="number"
                min="1"
                value={slots}
                onChange={e => setSlots(e.target.value)}
              />
            </label>

            <label>
              Description

              <input
                value={description}
                onChange={e =>
                  setDescription(e.target.value)
                }
                placeholder="Rules or match notes"
              />
            </label>
          </div>

          <button
            className="cta"
            disabled={!title || !date}
            onClick={create}
          >
            PUBLISH TOURNAMENT ↗
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginTop: 30,
          }}
        >
          <h2 className="admin-sub">
            REGISTRATIONS & PAYMENT REVIEW
          </h2>

          <button
            className="outline"
            disabled={refreshing}
            onClick={refreshDashboard}
          >
            {refreshing
              ? 'REFRESHING...'
              : 'REFRESH REGISTRATIONS'}
          </button>
        </div>

        <p className="muted">
          Total registrations: {regs.length}
          {' · '}
          Waiting for review:{' '}
          {
            regs.filter(
              r => r.status === 'payment_review'
            ).length
          }
        </p>

        {regs.length ? (
          regs.map(r => (
            <div
              className="panel review"
              key={r.id}
            >
              <div style={{ flex: 1 }}>
                <b>{r.player_name}</b>

                <p className="muted">
                  UID: {r.game_uid}
                  {' · '}
                  {r.team_name || 'No team'}
                  {' · '}
                  {r.mode}
                </p>

                <p className="muted">
                  Tournament:{' '}
                  {r.tournaments?.title ||
                    'Tournament'}
                </p>

                <span
                  className={'status ' + r.status}
                >
                  {r.status.replace(/_/g, ' ')}
                </span>

                <div
                  style={{
                    background: '#081225',
                    padding: 18,
                    borderRadius: 10,
                    marginTop: 15,
                    border: '1px solid #1e3a5f',
                  }}
                >
                  <p
                    className="eyebrow"
                    style={{ marginBottom: 12 }}
                  >
                    PLAYER PAYMENT DETAILS
                  </p>

                  <p>
                    <strong>UPI ID:</strong>{' '}

                    <span
                      style={{
                        color: r.upi_id
                          ? '#38bdf8'
                          : '#94a9c5',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {r.upi_id || 'Not submitted'}
                    </span>
                  </p>

                  <p style={{ marginTop: 8 }}>
                    <strong>UPI Account Name:</strong>{' '}

                    <span
                      style={{
                        color: r.upi_name
                          ? '#38bdf8'
                          : '#94a9c5',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {r.upi_name || 'Not submitted'}
                    </span>
                  </p>

                  <p style={{ marginTop: 8 }}>
                    <strong>Payment Reference:</strong>{' '}

                    {r.payment_reference ||
                      'Not submitted'}
                  </p>

                  <p
                    className="muted"
                    style={{ marginTop: 8 }}
                  >
                    Submitted:{' '}

                    {r.payment_submitted_at
                      ? new Date(
                          r.payment_submitted_at
                        ).toLocaleString()
                      : 'Not submitted'}
                  </p>

                  {r.status === 'payment_review' && (
                    <p
                      style={{
                        color: '#38bdf8',
                        marginTop: 12,
                      }}
                    >
                      ● Waiting for host verification
                    </p>
                  )}
                </div>
              </div>

              <div className="button-row">
                {r.status !== 'rejected' && (
                  <button
                    className="outline"
                    disabled={reviewing === r.id}
                    onClick={() =>
                      review(r.id, 'rejected')
                    }
                  >
                    REJECT
                  </button>
                )}

                {r.status === 'payment_review' && (
                  <button
                    className="cta"
                    disabled={reviewing === r.id}
                    onClick={() =>
                      review(r.id, 'approved')
                    }
                  >
                    APPROVE
                  </button>
                )}

                {r.status === 'approved' && (
                  <span
                    style={{
                      color: '#4ade80',
                      fontWeight: 700,
                    }}
                  >
                    ✓ APPROVED
                  </span>
                )}

                {r.status === 'rejected' && (
                  <span
                    style={{
                      color: '#ff5555',
                      fontWeight: 700,
                    }}
                  >
                    ✕ REJECTED
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="muted">
            No registrations yet.
          </p>
        )}

        <h2 className="admin-sub">
          ROOM DETAILS
        </h2>

        <p className="muted">
          Save room credentials only when ready.
          Access is restricted by database policy
          to approved participants and admins.
        </p>

        {tournaments.map(t => (
          <div
            className="panel room-row"
            key={t.id}
          >
            <b>{t.title}</b>

            <input
              id={'room-' + t.id}
              placeholder="Room ID"
            />

            <input
              id={'pass-' + t.id}
              placeholder="Room password"
            />

            <button
              className="outline"
              onClick={() => saveRoom(t.id)}
            >
              SAVE ROOM
            </button>
          </div>
        ))}

        {notice && (
          <div className="notice">
            {notice}
          </div>
        )}
      </section>
    </main>
  );
}
