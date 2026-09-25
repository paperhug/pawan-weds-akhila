const invitation = document.querySelector('.invitation');
const stage = document.querySelector('.invitation-stage');
const mandap = document.querySelector('.mandap');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }
function ease(value) { return value * value * (3 - 2 * value); }
function updateInvitation() {
  const rect = invitation.getBoundingClientRect();
  const artboard = document.querySelector('.invitation-artboard');
  const artboardRect = artboard.getBoundingClientRect();
  const welcome = document.querySelector('.welcome');
  const initialOverlap = Math.max(0, window.innerHeight - welcome.getBoundingClientRect().height);
  const visiblePageHeight = Math.max(0, window.innerHeight - rect.top - initialOverlap);
  const imageRatio = mandap.naturalWidth && mandap.naturalHeight ? mandap.naturalHeight / mandap.naturalWidth : 1387 / 1028;
  const imageHeight = artboardRect.width * 1.15 * imageRatio * 0.84;
  const movementDistance = Math.max(1, invitation.offsetHeight - imageHeight);
  const progress = clamp((visiblePageHeight - imageHeight) / movementDistance, 0, 1);
  const p = reducedMotion ? 1 : ease(progress);

  const startTop = artboardRect.height * .05;
  const maxTop = Math.max(startTop, artboardRect.height - imageHeight - artboardRect.height * .05);
  const targetTop = Math.min(window.innerHeight * .55, maxTop);
  mandap.style.setProperty('--mandap-top', `${startTop + (targetTop - startTop) * p}px`);

  const leaves = clamp((progress - .14) / .2, 0, 1);
  stage.style.setProperty('--leaves-opacity', leaves.toFixed(3));
  const copy = clamp((progress - .48) / .36, 0, 1);
  stage.style.setProperty('--copy-opacity', copy.toFixed(3));
  stage.style.setProperty('--copy-y', `${22 * (1 - ease(copy))}px`);
}
addEventListener('scroll', updateInvitation, { passive:true });
addEventListener('resize', updateInvitation); updateInvitation();

const music = document.querySelector('#music');
const musicButton = document.querySelector('.music-toggle');
const welcome = document.querySelector('.welcome');
const enterButton = document.querySelector('.enter-button');
let musicStartPending = false;
function startMusicFromEntryGesture() {
  if (!music.paused || musicStartPending) return;
  musicStartPending = true;
  music.play().then(() => {
    musicButton.setAttribute('aria-pressed', 'true');
    musicButton.querySelector('.music-label').textContent = 'Pause';
  }).catch(() => {
    musicButton.querySelector('.music-label').textContent = 'Add music.mp3';
  }).finally(() => { musicStartPending = false; });
}
enterButton.addEventListener('pointerdown', startMusicFromEntryGesture);
enterButton.addEventListener('click', async () => {
  startMusicFromEntryGesture();
  document.body.classList.add('entered');
  welcome.classList.add('is-entered');
  requestAnimationFrame(paintScratchCoating);
  enterButton.disabled = true;
  enterButton.setAttribute('aria-hidden', 'true');
});
musicButton.addEventListener('click', async () => {
  if (music.paused) { try { await music.play(); musicButton.setAttribute('aria-pressed','true'); musicButton.querySelector('.music-label').textContent = 'Pause'; } catch { musicButton.querySelector('.music-label').textContent = 'Add music.mp3'; } }
  else { music.pause(); musicButton.setAttribute('aria-pressed','false'); musicButton.querySelector('.music-label').textContent = 'Music'; }
});

const track = document.querySelector('.carousel-track');
const slides = [...document.querySelectorAll('.event-slide')];
const dots = [...document.querySelectorAll('.dots button')];
let active = 0;
function showSlide(index) { active = clamp(index, 0, slides.length - 1); track.style.transform = `translateX(-${active * 100}%)`; dots.forEach((dot, i) => dot.classList.toggle('active', i === active)); document.querySelector('.previous').classList.toggle('is-hidden', active === 0); document.querySelector('.next').classList.toggle('is-hidden', active === slides.length - 1); }
document.querySelector('.previous').addEventListener('click', () => showSlide(active - 1));
document.querySelector('.next').addEventListener('click', () => showSlide(active + 1));
dots.forEach((dot, index) => dot.addEventListener('click', () => showSlide(index)));
showSlide(0);
let startX = 0;
track.addEventListener('touchstart', event => { startX = event.changedTouches[0].clientX; }, {passive:true});
track.addEventListener('touchend', event => { const delta = event.changedTouches[0].clientX - startX; if (Math.abs(delta) > 35) showSlide(active + (delta < 0 ? 1 : -1)); }, {passive:true});

const scratchCanvas = document.querySelector('.scratch-layer');
const scratchContext = scratchCanvas.getContext('2d');
const scratchTexture = new Image();
scratchTexture.src = 'watercolor-banana-leaf-optimized.png?v=1';
let scratchDpr = 1;
let scratching = false;
let lastScratchPoint = null;
let scratchInitialAlpha = null;

function paintScratchCoating() {
  const rect = scratchCanvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  scratchDpr = Math.min(window.devicePixelRatio || 1, 2);
  scratchCanvas.width = Math.round(rect.width * scratchDpr);
  scratchCanvas.height = Math.round(rect.height * scratchDpr);
  scratchContext.setTransform(scratchDpr, 0, 0, scratchDpr, 0, 0);
  scratchContext.globalCompositeOperation = 'source-over';
  scratchContext.fillStyle = '#fffbf7';
  scratchContext.fillRect(0, 0, rect.width, rect.height);
  if (scratchTexture.complete && scratchTexture.naturalWidth) {
    const scale = Math.min(rect.width / scratchTexture.naturalWidth, rect.height / scratchTexture.naturalHeight);
    const width = scratchTexture.naturalWidth * scale;
    const height = scratchTexture.naturalHeight * scale;
    scratchContext.drawImage(scratchTexture, (rect.width - width) / 2, (rect.height - height) / 2, width, height);
  }
  const promptSize = Math.min(56, Math.max(36, rect.width * .092));
  scratchContext.font = `400 ${promptSize}px Sacramento, Allura, cursive`;
  scratchContext.textAlign = 'center';
  scratchContext.textBaseline = 'middle';
  scratchContext.fillStyle = 'rgba(255, 255, 255, .8)';
  scratchContext.shadowColor = 'rgba(15, 62, 13, .75)';
  scratchContext.shadowBlur = 4;
  scratchContext.shadowOffsetY = 1;
  scratchContext.fillText('Scratch to reveal', rect.width / 2, rect.height / 2 - promptSize * .48, rect.width * .9);
  scratchContext.fillText('the wedding date', rect.width / 2, rect.height / 2 + promptSize * .48, rect.width * .9);
  scratchContext.shadowColor = 'transparent';
  scratchContext.shadowBlur = 0;
  scratchContext.shadowOffsetY = 0;
  const paintedAlpha = scratchContext.getImageData(0, 0, scratchCanvas.width, scratchCanvas.height).data;
  scratchInitialAlpha = new Uint8Array(scratchCanvas.width * scratchCanvas.height);
  for (let i = 0; i < scratchInitialAlpha.length; i++) scratchInitialAlpha[i] = paintedAlpha[i * 4 + 3];
}

function scratchPoint(event) {
  const rect = scratchCanvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function scratchAt(point) {
  scratchContext.globalCompositeOperation = 'destination-out';
  scratchContext.lineWidth = 34;
  scratchContext.lineCap = 'round';
  scratchContext.lineJoin = 'round';
  scratchContext.beginPath();
  if (lastScratchPoint) {
    scratchContext.moveTo(lastScratchPoint.x, lastScratchPoint.y);
    scratchContext.lineTo(point.x, point.y);
  } else {
    scratchContext.moveTo(point.x, point.y);
    scratchContext.lineTo(point.x + .1, point.y + .1);
  }
  scratchContext.stroke();
  lastScratchPoint = point;
}

function checkScratchReveal() {
  const pixels = scratchContext.getImageData(0, 0, scratchCanvas.width, scratchCanvas.height).data;
  const step = Math.max(4, Math.round(12 * scratchDpr));
  let checked = 0;
  let cleared = 0;
  for (let y = 3; y < scratchCanvas.height; y += step) {
    for (let x = 3; x < scratchCanvas.width; x += step) {
      const pixel = y * scratchCanvas.width + x;
      if (scratchInitialAlpha && scratchInitialAlpha[pixel] >= 80) {
        checked++;
        if (pixels[pixel * 4 + 3] < 80) cleared++;
      }
    }
  }
  if (checked && cleared / checked > .9) scratchCanvas.classList.add('is-revealed');
}

scratchCanvas.addEventListener('pointerdown', event => {
  if (scratchCanvas.classList.contains('is-revealed')) return;
  scratching = true;
  lastScratchPoint = null;
  scratchCanvas.setPointerCapture(event.pointerId);
  scratchAt(scratchPoint(event));
  event.preventDefault();
});
scratchCanvas.addEventListener('pointermove', event => {
  if (!scratching) return;
  scratchAt(scratchPoint(event));
  event.preventDefault();
});
scratchCanvas.addEventListener('pointerup', () => {
  if (!scratching) return;
  scratching = false;
  lastScratchPoint = null;
  checkScratchReveal();
});
scratchCanvas.addEventListener('pointercancel', () => { scratching = false; lastScratchPoint = null; });
paintScratchCoating();
scratchTexture.addEventListener('load', paintScratchCoating);
document.fonts.load('400 24px Sacramento').then(() => {
  if (!scratchCanvas.classList.contains('is-revealed')) paintScratchCoating();
});
addEventListener('resize', paintScratchCoating);

const countdownDeadline = new Date('2026-12-14T03:44:00+05:30').getTime();
const countdownFields = {
  days: document.querySelector('#countdown-days'),
  hours: document.querySelector('#countdown-hours'),
  minutes: document.querySelector('#countdown-minutes'),
  seconds: document.querySelector('#countdown-seconds')
};
function updateCountdown() {
  let remaining = Math.max(0, Math.floor((countdownDeadline - Date.now()) / 1000));
  const days = Math.floor(remaining / 86400);
  remaining %= 86400;
  const hours = Math.floor(remaining / 3600);
  remaining %= 3600;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  countdownFields.days.textContent = String(days).padStart(2, '0');
  countdownFields.hours.textContent = String(hours).padStart(2, '0');
  countdownFields.minutes.textContent = String(minutes).padStart(2, '0');
  countdownFields.seconds.textContent = String(seconds).padStart(2, '0');
  if (countdownDeadline <= Date.now()) clearInterval(countdownInterval);
}
updateCountdown();
const countdownInterval = setInterval(updateCountdown, 1000);
