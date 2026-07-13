/**
 * DIDAvatar.js — Real-time WebRTC talking-face engine
 *
 * Powered by D-ID Streams API (same technology as Citi Sky / Google DeepMind Live Avatar).
 * Takes a static photo + text → generates a real-time talking-face video via WebRTC.
 *
 * D-ID Free Tier: https://studio.d-id.com (sign up → API Keys)
 * Env var:        VITE_DID_API_KEY=your_key_here
 *
 * Flow:
 *  1. POST /talks/streams  → create WebRTC session, receive SDP offer from D-ID
 *  2. RTCPeerConnection setup (video+audio recv only)
 *  3. setRemoteDescription(D-ID offer) → createAnswer → setLocalDescription
 *  4. POST /talks/streams/:id/sdp  → send our SDP answer to D-ID
 *  5. ICE candidates exchanged via POST /talks/streams/:id/ice
 *  6. WebRTC track arrives → pipe to <video> element
 *  7. speak(text) → POST /talks/streams/:id to make ARIA say it in real-time
 */

const DID_BASE = 'https://api.d-id.com';

/* Female Indian voice IDs (Microsoft Neural, used by D-ID) */
export const VOICE_MAP = {
  'en-IN': 'en-IN-NeerjaNeural',
  'hi-IN': 'hi-IN-SwaraNeural',
  'ta-IN': 'ta-IN-PallaviNeural',
  'te-IN': 'te-IN-ShrutiNeural',
  'bn-IN': 'bn-IN-TanishaaNeural',
  'mr-IN': 'mr-IN-AarohiNeural',
  'gu-IN': 'gu-IN-DhwaniNeural',
  'kn-IN': 'kn-IN-SapnaNeural',
  'ml-IN': 'ml-IN-SobhanaNeural',
};

export class DIDAvatar {
  /**
   * @param {Object} opts
   * @param {string}   opts.apiKey       - D-ID API key
   * @param {string}   opts.sourceUrl    - Publicly accessible URL of ARIA portrait
   * @param {Function} opts.onState      - (state: 'connecting'|'idle'|'speaking'|'error') => void
   */
  constructor({ apiKey, sourceUrl, onState }) {
    // D-ID auth: Basic base64(apiKey + ':')
    // Verified format matches their API — 200 authenticated
    this._auth      = `Basic ${btoa(apiKey + ':')}`;
    this._sourceUrl = sourceUrl;
    this._onState   = onState || (() => {});

    this._pc        = null;
    this._streamId  = null;
    this._sessionId = null;
    this._videoEl   = null;
    this._connected = false;
    this._destroyed = false;
  }

  /* ── Connect ─────────────────────────────────────────────── */
  async connect(videoElement) {
    if (this._destroyed) return;
    this._videoEl = videoElement;
    this._onState('connecting');

    /* 1. Create D-ID stream session */
    const createRes = await fetch(`${DID_BASE}/talks/streams`, {
      method:  'POST',
      headers: { Authorization: this._auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_url: this._sourceUrl }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(`D-ID stream creation failed: ${err.description || createRes.status}`);
    }

    const { id, session_id, offer, ice_servers } = await createRes.json();
    this._streamId  = id;
    this._sessionId = session_id;

    /* 2. WebRTC peer connection */
    this._pc = new RTCPeerConnection({ iceServers: ice_servers });

    // Receive video + audio tracks (ARIA talking face + voice)
    this._pc.addTransceiver('video', { direction: 'recvonly' });
    this._pc.addTransceiver('audio', { direction: 'recvonly' });

    /* 3. When video/audio arrive, pipe to <video> element */
    this._pc.ontrack = (event) => {
      if (!this._videoEl) return;
      if (this._videoEl.srcObject !== event.streams[0]) {
        this._videoEl.srcObject = event.streams[0];
      }
      if (!this._connected) {
        this._connected = true;
        this._videoEl.play().catch(() => {});
        this._onState('idle');
      }
    };

    /* 4. Exchange ICE candidates with D-ID */
    this._pc.onicecandidate = async ({ candidate }) => {
      if (!candidate || this._destroyed) return;
      await fetch(`${DID_BASE}/talks/streams/${this._streamId}/ice`, {
        method:  'POST',
        headers: { Authorization: this._auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate:     candidate.candidate,
          sdpMid:        candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
          session_id:    this._sessionId,
        }),
      }).catch(() => {});
    };

    /* 5. Set D-ID's offer, create our answer */
    await this._pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this._pc.createAnswer();
    await this._pc.setLocalDescription(answer);

    /* 6. Send our SDP answer back to D-ID */
    await fetch(`${DID_BASE}/talks/streams/${this._streamId}/sdp`, {
      method:  'POST',
      headers: { Authorization: this._auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer: answer.toJSON(), session_id: this._sessionId }),
    });

    /* 7. Wait for connection (timeout 15s) */
    await this._waitForConnection(15000);
  }

  _waitForConnection(timeout) {
    return new Promise((resolve, reject) => {
      if (this._connected) return resolve();
      const t = setTimeout(() => reject(new Error('D-ID WebRTC connection timeout')), timeout);
      const check = setInterval(() => {
        if (this._connected) { clearTimeout(t); clearInterval(check); resolve(); }
      }, 200);
    });
  }

  /* ── Make ARIA speak ─────────────────────────────────────── */
  async speak(text, langCode = 'en-IN') {
    if (!this._streamId || !this._connected || this._destroyed) return;

    const voiceId = VOICE_MAP[langCode] || VOICE_MAP['en-IN'];
    this._onState('speaking');

    await fetch(`${DID_BASE}/talks/streams/${this._streamId}`, {
      method:  'POST',
      headers: { Authorization: this._auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        script: {
          type:     'text',
          input:    text,
          provider: { type: 'microsoft', voice_id: voiceId },
        },
        config:     { stitch: true },
        session_id: this._sessionId,
      }),
    });
  }

  /* ── Destroy / cleanup ───────────────────────────────────── */
  async destroy() {
    this._destroyed = true;
    this._connected = false;

    if (this._pc) { this._pc.close(); this._pc = null; }

    if (this._streamId) {
      await fetch(`${DID_BASE}/talks/streams/${this._streamId}`, {
        method:  'DELETE',
        headers: { Authorization: this._auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: this._sessionId }),
      }).catch(() => {});
      this._streamId  = null;
      this._sessionId = null;
    }
  }

  get isConnected() { return this._connected; }
}
