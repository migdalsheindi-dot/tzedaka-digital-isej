import "./style.css";

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

const coinStage = document.getElementById("coin-stage");
const pushke = document.getElementById("pushke");

// Coin fall/settle timing. The Mercado Pago redirect waits for this to
// finish — see the click handler below for why it navigates the current
// tab instead of opening a new one.
const FALL_DURATION = 2900;
const IMPACT_TIME = Math.round(FALL_DURATION * 0.8);
const BOUNCE_TICK_TIME = IMPACT_TIME + 160;
const REDIRECT_DELAY = FALL_DURATION + 250;

let coinsDropped = 0;

let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

/**
 * Soft filtered-noise "whoosh" that plays under the coin's fall, so the
 * ~3s drop doesn't sit in silence before the impact clink.
 */
function playFallSound(totalDurationSec) {
  const ctx = getAudioContext();
  const whooshDur = Math.min(1.6, totalDurationSec * 0.6);
  const bufferSize = Math.floor(ctx.sampleRate * whooshDur);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 900;
  filter.Q.value = 0.6;
  const gain = ctx.createGain();
  const start = ctx.currentTime + 0.05;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.045, start + whooshDur * 0.4);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + whooshDur);

  noise.connect(filter).connect(gain).connect(ctx.destination);
  noise.start(start);
  noise.stop(start + whooshDur + 0.05);
}

/**
 * Synthesizes a metallic coin "clink" using Web Audio API (no external audio
 * files), scheduled `delaySec` after now so it lands on the visual impact.
 */
function playImpactSound(delaySec, { intensity = 1, pitch = 1 } = {}) {
  const ctx = getAudioContext();
  const now = ctx.currentTime + Math.max(0, delaySec);
  const master = ctx.createGain();
  master.gain.value = 0.35 * intensity;
  master.connect(ctx.destination);

  const partials = [
    { freq: 2200 * pitch, delay: 0, decay: 0.18, gain: 0.6 },
    { freq: 3100 * pitch, delay: 0.015, decay: 0.16, gain: 0.4 },
    { freq: 4300 * pitch, delay: 0.03, decay: 0.12, gain: 0.25 },
  ];

  partials.forEach(({ freq, delay, decay, gain }) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = now + delay;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, start + decay);
    osc.connect(g).connect(master);
    osc.start(start);
    osc.stop(start + decay + 0.02);
  });

  // short noise burst for the metallic "tick" attack
  const bufferSize = ctx.sampleRate * 0.03;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "highpass";
  noiseFilter.frequency.value = 1800 * pitch;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.5;
  noise.connect(noiseFilter).connect(noiseGain).connect(master);
  noise.start(now);
}

/**
 * Drops a coin through the pushke's slot and lets it settle into the pile of
 * previously-donated coins at the bottom of the glass box, so the box visibly
 * fills up over the course of a session. Landing points are computed from the
 * actual rendered slot/interior positions (not hardcoded pixels) so it stays
 * aligned at any pushke size.
 */
function dropCoin() {
  const slotEl = document.getElementById("coin-slot");
  const boundsEl = document.getElementById("interior-bounds");
  const stageRect = coinStage.getBoundingClientRect();
  const slotRect = slotEl.getBoundingClientRect();
  const boundsRect = boundsEl.getBoundingClientRect();

  const coinSize = Math.max(18, Math.min(44, slotRect.width * 0.4));

  const startX = slotRect.left + slotRect.width / 2 - stageRect.left - coinSize / 2;
  const startY = -(stageRect.height * 0.45 + 60);

  const perCoinRise = Math.max(4, coinSize * 0.22);
  const maxRise = Math.max(0, boundsRect.height - coinSize * 0.6);
  const rise = Math.min(coinsDropped * perCoinRise, maxRise);
  const jitterRangeX = Math.max(0, boundsRect.width - coinSize);
  const restX = boundsRect.left - stageRect.left + Math.random() * jitterRangeX;
  const restY = boundsRect.top - stageRect.top + boundsRect.height - coinSize - rise;

  coinsDropped += 1;

  const coin = document.createElement("div");
  coin.className = "coin";
  coin.style.width = `${coinSize}px`;
  coin.style.height = `${coinSize}px`;
  coin.style.setProperty("--coin-size", `${coinSize}px`);
  coin.style.left = `${startX}px`;
  coin.style.top = `${startY}px`;
  coinStage.appendChild(coin);

  const dx = restX - startX;
  const dy = restY - startY;
  const rotation = 360 + Math.random() * 360;

  coin.animate(
    [
      { transform: "translate(0px, 0px) rotate(0deg)", opacity: 0, offset: 0 },
      { transform: `translate(${dx * 0.1}px, ${dy * 0.06}px) rotate(${rotation * 0.08}deg)`, opacity: 1, offset: 0.06 },
      { transform: `translate(${dx * 0.85}px, ${dy * 0.8}px) rotate(${rotation * 0.75}deg)`, opacity: 1, offset: 0.78 },
      { transform: `translate(${dx}px, ${dy * 1.06}px) rotate(${rotation}deg)`, opacity: 1, offset: 0.9 },
      { transform: `translate(${dx}px, ${dy * 0.98}px) rotate(${rotation}deg)`, opacity: 1, offset: 0.96 },
      { transform: `translate(${dx}px, ${dy}px) rotate(${rotation}deg)`, opacity: 1, offset: 1 },
    ],
    { duration: FALL_DURATION, easing: "cubic-bezier(.42,0,.58,1)", fill: "forwards" }
  );

  window.setTimeout(() => {
    pushke.classList.remove("animate-box-wobble");
    // force reflow so the animation can restart on repeated clicks
    void pushke.offsetWidth;
    pushke.classList.add("animate-box-wobble");
  }, IMPACT_TIME);
}

document.querySelectorAll(".donate-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const url = btn.dataset.url;
    if (!url) return;

    try {
      playFallSound(FALL_DURATION / 1000);
      playImpactSound(IMPACT_TIME / 1000, { intensity: 1 });
      playImpactSound(BOUNCE_TICK_TIME / 1000, { intensity: 0.35, pitch: 1.3 });
    } catch (err) {
      console.warn("No se pudo reproducir el sonido de la moneda:", err);
    }
    dropCoin();

    // Navigate this same tab once the coin lands — NOT window.open(), and NOT
    // a new tab. A new tab opened this long after the click loses the user
    // gesture and gets silently blocked by Safari/iOS (that's what broke the
    // links before). Top-level navigation of the current tab is never
    // blocked, so this is the only way to reliably wait for the animation.
    //
    // These mpago.la / link.mercadopago.com.ar URLs are Mercado Pago's own
    // universal/app links: iOS and Android already intercept navigation to
    // them at the OS level and hand off to the Mercado Pago app when it's
    // installed, falling back to the mobile web checkout otherwise — no
    // custom app-scheme or user-agent detection needed on our side.
    window.setTimeout(() => {
      window.location.href = url;
    }, REDIRECT_DELAY);
  });
});
