import { useState } from 'react';
import { FaThumbsUp, FaThumbsDown, FaPaperPlane, FaTimes } from 'react-icons/fa';

// Configure your ntfy topic here — subscribe at https://ntfy.sh/YOUR_TOPIC
const NTFY_TOPIC = 'zpowell-resume-alerts';
const ANALYTICS_SERVER = 'http://localhost:3377';

export default function InterestButton() {
  const [showModal, setShowModal] = useState(false);
  const [choice, setChoice] = useState(null); // 'interested' | 'not-interested'
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', company: '', email: '', note: '' });

  const handleChoice = (type) => {
    setChoice(type);
    setShowModal(true);
  };

  const handleSend = async () => {
    const title = choice === 'interested'
      ? `🟢 Someone is INTERESTED in your resume!`
      : `🔴 Someone passed on your resume`;

    const body = [
      form.name && `Name: ${form.name}`,
      form.company && `Company: ${form.company}`,
      form.email && `Email: ${form.email}`,
      form.note && `Note: ${form.note}`,
      `Time: ${new Date().toLocaleString()}`,
      `Referrer: ${document.referrer || 'Direct'}`,
    ].filter(Boolean).join('\n');

    // Send to ntfy for push notification
    try {
      await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
        method: 'POST',
        headers: {
          'Title': title,
          'Priority': choice === 'interested' ? '5' : '3',
          'Tags': choice === 'interested' ? 'white_check_mark,briefcase' : 'x',
        },
        body: body || 'No details provided',
      });
    } catch { /* silent */ }

    // Send to local analytics DB
    try {
      const params = new URLSearchParams(window.location.search);
      await fetch(`${ANALYTICS_SERVER}/api/interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choice,
          name: form.name,
          company: form.company,
          email: form.email,
          note: form.note,
          jobId: params.get('job'),
          refSource: params.get('ref'),
        }),
      });
    } catch { /* silent */ }

    setSent(true);
    setShowModal(false);
  };

  const handleClose = () => {
    setShowModal(false);
    setChoice(null);
    setForm({ name: '', company: '', email: '', note: '' });
  };

  if (sent) {
    return (
      <div className="interest-section">
        <div className="interest-thanks">
          <p>Thank you for your feedback!</p>
          <span>Zachary has been notified and will follow up shortly.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="interest-section">
      <h3 className="interest-heading">What do you think?</h3>
      <p className="interest-sub">Your response is sent directly to Zachary in real time.</p>

      <div className="interest-buttons">
        <button className="interest-btn interested" onClick={() => handleChoice('interested')}>
          <FaThumbsUp /> I'm Interested
        </button>
        <button className="interest-btn not-interested" onClick={() => handleChoice('not-interested')}>
          <FaThumbsDown /> Not Right Now
        </button>
      </div>

      {showModal && (
        <div className="interest-modal-backdrop" onClick={handleClose}>
          <div className="interest-modal" onClick={(e) => e.stopPropagation()}>
            <button className="interest-modal-close" onClick={handleClose}><FaTimes /></button>
            <h4>{choice === 'interested' ? "Great! Let's connect." : "Thanks for the feedback."}</h4>
            <p className="interest-modal-sub">
              {choice === 'interested'
                ? "Leave your info and Zachary will reach out."
                : "Optionally share why — it helps Zachary improve."}
            </p>

            <div className="interest-form">
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Company"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
              {choice === 'interested' && (
                <input
                  type="email"
                  placeholder="Email (so Zachary can respond)"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              )}
              <textarea
                placeholder={choice === 'interested' ? "Any message for Zachary..." : "Any feedback (optional)..."}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                rows={3}
              />
              <button className="btn btn-primary interest-send" onClick={handleSend}>
                <FaPaperPlane /> Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
