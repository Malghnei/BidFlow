(function initBidFlowConfig() {
  const DEFAULT_PASSCODE = '123456';
  const PASSCODE_KEY = 'bidflowPasscode';

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function getPasscode() {
    return (
      getQueryParam('passcode') ||
      localStorage.getItem(PASSCODE_KEY) ||
      DEFAULT_PASSCODE
    );
  }

  function setPasscode(passcode) {
    if (!passcode) return;
    localStorage.setItem(PASSCODE_KEY, passcode);
  }

  async function joinEvent(passcode) {
    const response = await fetch('/api/auth/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode }),
    });

    let payload = {};
    try {
      payload = await response.json();
    } catch (_e) {
      payload = {};
    }

    if (!response.ok) {
      const err = new Error(payload.error || payload.message || 'Failed to join event');
      err.status = response.status;
      err.payload = payload;
      throw err;
    }

    return payload;
  }

  async function resolveEvent({ passcode } = {}) {
    const effectivePasscode = passcode || getPasscode();
    const data = await joinEvent(effectivePasscode);
    setPasscode(effectivePasscode);
    return data;
  }

  window.BidFlowConfig = {
    DEFAULT_PASSCODE,
    getPasscode,
    setPasscode,
    joinEvent,
    resolveEvent,
  };
})();
