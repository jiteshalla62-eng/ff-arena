
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function PaymentInfoPage() {
  const router = useRouter();

  const [seconds, setSeconds] = useState(300);
  const [confirmed, setConfirmed] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState('');
  const [registrationId, setRegistrationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [deadline, setDeadline] = useState(0);

  useEffect(() => {
    async function loadRegistration() {
      try {
        const params = new URLSearchParams(
          window.location.search
        );

        const id = params.get('registrationId');

        if (!id) {
          setError(
            'Registration not found. Please register for a tournament first.'
          );
          return;
        }

        const s = supabase();

        const {
          data: { user },
        } = await s.auth.getUser();

        if (!user) {
          setError('Please log in first.');
          return;
        }

        const { data, error } = await s
          .from('registrations')
          .select(
            'id,status,upi_id,upi_name,created_at'
          )
          .eq('id', id)
          .eq('player_id', user.id)
          .single();

        if (error || !data) {
          setError('Registration could not be found.');
          return;
        }

        setRegistrationId(data.id);
        setUpiId(data.upi_id || '');
        setUpiName(data.upi_name || '');

        if (data.status === 'payment_review') {
          setConfirmed(true);
          return;
        }

        if (data.status === 'approved') {
          setError(
            'Your registration has already been approved.'
          );
          return;
        }

        if (data.status === 'rejected') {
          setError(
            'Your registration was rejected. Contact the host.'
          );
          return;
        }

        const expiresAt =
          new Date(data.created_at).getTime() +
          5 * 60 * 1000;

        setDeadline(expiresAt);

        setSeconds(
          Math.max(
            0,
            Math.ceil(
              (expiresAt - Date.now()) / 1000
            )
          )
        );
      } catch {
        setError('Unable to load registration.');
      } finally {
        setChecking(false);
      }
    }

    loadRegistration();
  }, []);

  useEffect(() => {
    if (!deadline || confirmed) return;

    const timer = setInterval(() => {
      setSeconds(
        Math.max(
          0,
          Math.ceil(
            (deadline - Date.now()) / 1000
          )
        )
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, confirmed]);

  async function handleSubmit() {
    setError('');

    if (!registrationId) {
      setError('Registration not found.');
      return;
    }

    if (!upiId.trim() || !upiName.trim()) {
      setError('Please enter UPI ID and Name.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+$/.test(upiId.trim())) {
      setError('Please enter a valid UPI ID.');
      return;
    }

    if (!deadline || Date.now() >= deadline) {
      setError('Registration time has expired.');
      return;
    }

    setLoading(true);

    try {
      const s = supabase();

      const {
        data: { user },
      } = await s.auth.getUser();

      if (!user) {
        throw new Error('Please log in first.');
      }

      const { data, error } = await s
        .from('registrations')
        .update({
          upi_id: upiId.trim(),
          upi_name: upiName.trim(),
          payment_submitted_at:
            new Date().toISOString(),
          status: 'payment_review',
        })
        .eq('id', registrationId)
        .eq('player_id', user.id)
        .eq('status', 'pending_payment')
        .select('id')
        .single();

      if (error || !data) {
        throw new Error(
          error?.message ||
          'Unable to submit registration details.'
        );
      }

      setConfirmed(true);
    } catch (e: any) {
      setError(
        e.message ||
        'Submission failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return (
    <main className="admin-wrap">
      <section className="section">
        <p className="eyebrow">
          FF ARENA • PLAYER PORTAL
        </p>

        <h1 className="admin-title">
          TOURNAMENT <em>CONFIRMATION</em>
        </h1>

        <div
          className="panel"
          style={{
            maxWidth: 520,
            margin: 'auto'
          }}
        >
          <h3>REGISTRATION DETAILS</h3>

          <div
            style={{
              background: '#171717',
              borderRadius: 12,
              padding: 25,
              textAlign: 'center',
              margin: '20px 0',
            }}
          >
            <p
              className="eyebrow"
              style={{
                marginBottom: 18,
              }}
            >
              UPI QR PREVIEW
            </p>

            <div
              style={{
                background: '#fff',
                borderRadius: 12,
                padding: 12,
                maxWidth: 280,
                margin: '0 auto',
              }}
            >
              <img
                src="/upi-qr.jpeg"
                alt="UPI QR preview"
                style={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                  borderRadius: 6,
                }}
              />
            </div>

            <p
              className="hint"
              style={{
                marginTop: 15,
                lineHeight: 1.6,
              }}
            >
              QR preview for testing only.
              Do not send money.
              Payment verification is not yet enabled.
            </p>
          </div>

          {checking ? (
            <p className="hint">
              Loading registration...
            </p>
          ) : (
            <>
              {!confirmed && (
                <>
                  <h3
                    style={{
                      textAlign: 'center',
                    }}
                  >
                    TIME REMAINING
                  </h3>

                  <h1
                    style={{
                      textAlign: 'center',
                      fontSize: 42,
                      color:
                        seconds === 0
                          ? '#ff5555'
                          : '#ff8a32',
                    }}
                  >
                    {String(minutes).padStart(2, '0')}:
                    {String(remaining).padStart(2, '0')}
                  </h1>
                </>
              )}

              <div style={{ marginTop: 25 }}>
                <label>
                  UPI ID

                  <input
                    placeholder="Enter UPI ID"
                    value={upiId}
                    onChange={e =>
                      setUpiId(e.target.value)
                    }
                    disabled={
                      confirmed ||
                      loading ||
                      !registrationId ||
                      !deadline ||
                      seconds <= 0
                    }
                  />
                </label>

                <label>
                  UPI ID Name

                  <input
                    placeholder="Enter UPI ID Name"
                    value={upiName}
                    onChange={e =>
                      setUpiName(e.target.value)
                    }
                    disabled={
                      confirmed ||
                      loading ||
                      !registrationId ||
                      !deadline ||
                      seconds <= 0
                    }
                  />
                </label>
              </div>

              {error && (
                <p
                  style={{
                    color: '#ff5555',
                    marginTop: 12,
                  }}
                >
                  {error}
                </p>
              )}

              {confirmed ? (
                <div
                  className="notice"
                  style={{
                    marginTop: 20,
                  }}
                >
                  Details submitted successfully.
                  Host needs to process your
                  registration. You'll get into
                  the ARENA soon.
                </div>
              ) : (
                <button
                  className="cta full"
                  style={{
                    marginTop: 20,
                  }}
                  onClick={handleSubmit}
                  disabled={
                    loading ||
                    seconds <= 0 ||
                    !registrationId ||
                    !deadline
                  }
                >
                  {loading
                    ? 'SUBMITTING...'
                    : 'SUBMIT FOR HOST REVIEW'}
                </button>
              )}

              {seconds === 0 &&
                !confirmed &&
                deadline > 0 && (
                  <p
                    style={{
                      color: '#ff5555',
                      textAlign: 'center',
                      marginTop: 12,
                    }}
                  >
                    Registration time expired.
                    Please contact the host.
                  </p>
                )}
            </>
          )}

          <button
            className="outline full"
            style={{
              marginTop: 12,
            }}
            onClick={() => router.push('/')}
          >
            BACK TO ARENA
          </button>
        </div>
      </section>
    </main>
  );
}
