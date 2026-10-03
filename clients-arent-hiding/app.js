const progressBar = document.querySelector('#progressBar');
const themeToggle = document.querySelector('#themeToggle');
const downloadBtn = document.querySelector('#downloadBtn');
const toast = document.querySelector('#toast');

function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
}

window.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('night');
  const night = document.body.classList.contains('night');
  themeToggle.textContent = night ? '☾' : '☼';
  themeToggle.setAttribute('aria-label', night ? 'Use light reading theme' : 'Use dark reading theme');
  localStorage.setItem('cah-theme', night ? 'night' : 'light');
});

if (localStorage.getItem('cah-theme') === 'night') {
  document.body.classList.add('night');
  themeToggle.textContent = '☾';
}

downloadBtn.addEventListener('click', () => {
  toast.textContent = 'Your PDF download has started.';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2400);
});

document.querySelector('#year').textContent = new Date().getFullYear();

// Preserve focus visibility while keeping pointer interactions clean.
document.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') document.body.classList.add('keyboard-nav');
});
