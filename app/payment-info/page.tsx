
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentInfoPage() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(300);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;

    const timer = setInterval(() => {
      setSeconds(s => Math.max(0, s - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);

  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return (
    <main className="admin-wrap">
      <section className="section">
        <p className="eyebrow">FF ARENA • PLAYER PORTAL</p>

        <h1 className="admin-title">
          TOURNAMENT <em>CONFIRMATION</em>
        </h1>

        <div className="panel" style={{ maxWidth: 520, margin: 'auto' }}>
          <h3>REGISTRATION DETAILS</h3>

          <div style={{
            background: '#171717',
            borderRadius: 12,
            padding: 25,
            textAlign: 'center',
            margin: '20px 0'
          }}>
            <p className="eyebrow">DEMO QR PREVIEW</p>
            <div style={{
              background: '#fff',
              color: '#111',
              padding: 35,
              borderRadius: 10,
              fontSize: 18,
              fontWeight: 800
            }}>
              QR PREVIEW
            </div>
            <p className="hint">Demonstration only — no payment QR is displayed.</p>
          </div>

          <h3 style={{ textAlign: 'center' }}>TIME REMAINING</h3>

          <h1 style={{
            textAlign: 'center',
            fontSize: 42,
            color: seconds === 0 ? '#ff5555' : '#ff8a32'
          }}>
            {String(minutes).padStart(2, '0')}:
            {String(remaining).padStart(2, '0')}
          </h1>

          <div style={{ marginTop: 25 }}>
            <label>Demo account name</label>
            <input disabled placeholder="Demo only — no real UPI details" />

            <label>Demo reference</label>
            <input disabled placeholder="Demo only — no transaction ID" />
          </div>

          {confirmed ? (
            <div className="notice">
              Host needs to process your registration. You'll get into the ARENA soon.
            </div>
          ) : (
            <button
              className="cta full"
              onClick={() => setConfirmed(true)}
            >
              VIEW HOST REVIEW MESSAGE
            </button>
          )}

          <button
            className="outline full"
            style={{ marginTop: 12 }}
            onClick={() => router.push('/')}
          >
            BACK TO ARENA
          </button>
        </div>
      </section>
    </main>
  );
}
