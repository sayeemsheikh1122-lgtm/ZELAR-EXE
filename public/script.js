document.addEventListener('DOMContentLoaded', () => {
  const loginBtn  = document.getElementById('loginBtn');
  const passInput = document.getElementById('passInput');

  if (loginBtn)  loginBtn.addEventListener('click', verifyLicenseLogin);
  if (passInput) passInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') verifyLicenseLogin();
  });
});

async function verifyLicenseLogin() {
  const input = document.getElementById('passInput');
  const msg   = document.getElementById('loginMsg');
  if (!input || !msg) return;

  const code = (input.value || '').trim().toUpperCase();
  msg.style.color = '#fecaca';

  if (!code) {
    msg.textContent = 'Please enter a license code.';
    return;
  }

  msg.textContent = 'Checking...';

  try {
    const res  = await fetch('/verify-license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    const data = await res.json();

    if (!res.ok) {
      msg.textContent = data.message || 'Invalid license.';
      return;
    }

    msg.style.color = '#bbf7d0';
    msg.textContent = 'License accepted — redirecting...';
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 700);
  } catch (err) {
    msg.textContent = 'Server error — try again.';
  }
}
