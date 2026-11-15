'use client';

import { useState } from 'react';

export default function PaymentPage() {
  const [upiName, setUpiName] = useState('');
  const [transactionId, setTransactionId] = useState('');

  return (
    <main className="admin-wrap">
      <section className="section">
        <p className="eyebrow">FF ARENA • PLAYER PORTAL</p>

        <h1 className="admin-title">
          TOURNAMENT <em>PAYMENT</em>
        </h1>

        <div className="panel">
          <h3>PAYMENT DETAILS</h3>

          <label>
            UPI Account Name
            <input
              value={upiName}
              onChange={e => setUpiName(e.target.value)}
              placeholder="Enter UPI account name"
            />
          </label>

          <label>
            Transaction ID
            <input
              value={transactionId}
              onChange={e => setTransactionId(e.target.value)}
              placeholder="Enter transaction ID"
            />
          </label>

          <p className="hint">
            Demonstration only. No payment is processed or submitted.
          </p>
        </div>
      </section>
    </main>
  );
}