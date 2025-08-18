const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const modeSelect = document.getElementById('modeSelect');
const uploadSection = document.getElementById('uploadSection');
const blankSection = document.getElementById('blankSection');
const uploadImage = document.getElementById('uploadImage');
const blankWidthInput = document.getElementById('blankWidth');
const blankHeightInput = document.getElementById('blankHeight');
const createBlankBtn = document.getElementById('createBlank');

const portugueseText = document.getElementById('portugueseText');
const colorPicker = document.getElementById('colorPicker');
const fontSizeInput = document.getElementById('fontSize');
const rotationInput = document.getElementById('rotationInput');
const flipHBtn = document.getElementById('flipH');
const flipVBtn = document.getElementById('flipV');
const clearTextBtn = document.getElementById('clearText');

const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');

const exportWidth = document.getElementById('exportWidth');
const exportHeight = document.getElementById('exportHeight');
const exportTransparent = document.getElementById('exportTransparent');
const saveBtn = document.getElementById('saveImage');

let img = new Image();
let hasImage = false;
let useBlank = false;

let zoom = 1;
const zoomStep = 0.1, minZoom = 0.1, maxZoom = 5;

let text = "", x = 0, y = 0, rotation = 0, flipH = false, flipV = false;
let draggingText = false, offsetX = 0, offsetY = 0;

let canvasBaseWidth = 1280;
let canvasBaseHeight = 720;

// Fonte personalizada
let fonteCarregada = false;
const minhaFonte = new FontFace('MinhaFonte', 'url(minhaFonte.ttf)');
minhaFonte.load().then(f => {
  document.fonts.add(f);
  fonteCarregada = true;
  drawCanvas();
});

// Alternar modo
modeSelect.addEventListener('change', () => {
  const isUpload = modeSelect.value === 'upload';
  uploadSection.style.display = isUpload ? 'block' : 'none';
  blankSection.style.display = isUpload ? 'none' : 'block';
});

// Criar canvas transparente
createBlankBtn.addEventListener('click', () => {
  canvasBaseWidth = Math.max(200, parseInt(blankWidthInput.value) || 1920);
  canvasBaseHeight = Math.max(200, parseInt(blankHeightInput.value) || 1080);
  useBlank = true;
  hasImage = false;
  img = new Image();
  zoom = 1;
  x = canvasBaseWidth / 2;
  y = canvasBaseHeight / 2;
  resizeCanvas();
});

// Upload de imagem
uploadImage.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    img = new Image();
    img.onload = () => {
      useBlank = false;
      hasImage = true;
      zoom = 1;
      canvasBaseWidth = img.width;
      canvasBaseHeight = img.height;
      x = canvasBaseWidth / 2;
      y = canvasBaseHeight / 2;
      resizeCanvas();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

// --- RESPONSIVIDADE ---
function resizeCanvas() {
  const container = canvas.parentElement;
  const maxWidth = container.clientWidth - 20;
  const maxHeight = window.innerHeight - container.offsetTop - 40;

  let scale = Math.min(maxWidth / canvasBaseWidth, maxHeight / canvasBaseHeight, 1);

  canvas.style.width = canvasBaseWidth * scale + "px";
  canvas.style.height = canvasBaseHeight * scale + "px";

  drawCanvas();
}

window.addEventListener('resize', resizeCanvas);

// --- TEXTO ---
function traduzirSimbolos(txt) {
  const mapa = {};
  for (let i = 65; i <= 90; i++) mapa[String.fromCharCode(i)] = String.fromCharCode(i);
  return txt.split("").map(l => mapa[l] || l).join("");
}

portugueseText.addEventListener('input', () => {
  const lines = portugueseText.value.split('\n');
  text = lines.map(l => traduzirSimbolos(l)).join('\n');
  drawCanvas();
});

// --- DESENHO ---
function drawCanvas() {
  if (!fonteCarregada) return;

  ctx.clearRect(0, 0, canvasBaseWidth, canvasBaseHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // imagem
  let imgX = 0, imgY = 0, drawW = 0, drawH = 0;
  if (hasImage && img.src) {
    drawW = img.width * zoom;
    drawH = img.height * zoom;
    imgX = (canvasBaseWidth - drawW) / 2;
    imgY = (canvasBaseHeight - drawH) / 2;
    ctx.drawImage(img, imgX, imgY, drawW, drawH);
  }

  // texto
  if (text) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.fillStyle = colorPicker.value;
    ctx.font = `${parseInt(fontSizeInput.value)}px MinhaFonte`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const padding = 12;
    const usableW = hasImage ? Math.max(0, (img.width * zoom) - padding * 2) : Math.max(0, canvasBaseWidth - padding * 2);
    drawMultilineWrapped(ctx, text, usableW, parseInt(fontSizeInput.value) + 8);
    ctx.restore();

    keepTextInsideBounds(imgX, imgY, drawW, drawH);
  }
}

// --- MULTILINHA ---
function drawMultilineWrapped(ctx, text, maxWidth, lineHeight) {
  const paragraphs = text.split('\n');
  const lines = [];
  paragraphs.forEach(p => {
    const words = p.split(' ');
    let line = '';
    words.forEach(word => {
      const test = (line + word + ' ').trimEnd();
      if (ctx.measureText(test).width > maxWidth && line.length > 0) {
        lines.push(line);
        line = word + ' ';
      } else {
        line = test + ' ';
      }
    });
    lines.push(line.trimEnd());
  });

  const totalH = lines.length * lineHeight;
  let yy = -totalH / 2 + lineHeight / 2;
  lines.forEach(l => {
    ctx.fillText(l, 0, yy);
    yy += lineHeight;
  });
}

// --- INTERAÇÃO ---
function pointInText(mx, my) {
  const padding = 12;
  const lineHeight = parseInt(fontSizeInput.value) + 8;
  const usableW = hasImage ? Math.max(0, (img.width * zoom) - padding * 2) : Math.max(0, canvasBaseWidth - padding * 2);
  const b = measureTextBounds(ctx, text, usableW, lineHeight);

  const dx = mx - x;
  const dy = my - y;
  const rad = -rotation * Math.PI / 180;
  const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
  const ry = dx * Math.sin(rad) + dy * Math.cos(rad);

  return (rx >= -b.width/2 && rx <= b.width/2 && ry >= -b.height/2 && ry <= b.height/2);
}

function startDrag(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const mx = (clientX - rect.left) * (canvasBaseWidth / rect.width);
  const my = (clientY - rect.top) * (canvasBaseHeight / rect.height);
  if (pointInText(mx, my)) {
    draggingText = true;
    offsetX = mx - x;
    offsetY = my - y;
  }
}

function moveDrag(clientX, clientY) {
  if (!draggingText) return;
  const rect = canvas.getBoundingClientRect();
  const mx = (clientX - rect.left) * (canvasBaseWidth / rect.width);
  const my = (clientY - rect.top) * (canvasBaseHeight / rect.height);
  x = mx - offsetX;
  y = my - offsetY;
  drawCanvas();
}

function endDrag() { draggingText = false; }

canvas.addEventListener('mousedown', e => startDrag(e.clientX, e.clientY));
canvas.addEventListener('mousemove', e => moveDrag(e.clientX, e.clientY));
canvas.addEventListener('mouseup', endDrag);
canvas.addEventListener('mouseleave', endDrag);

canvas.addEventListener('touchstart', e => { const t = e.touches[0]; startDrag(t.clientX, t.clientY); e.preventDefault(); }, { passive: false });
canvas.addEventListener('touchmove', e => { const t = e.touches[0]; moveDrag(t.clientX, t.clientY); e.preventDefault(); }, { passive: false });
canvas.addEventListener('touchend', endDrag);

// --- CONTROLES ---
flipHBtn.addEventListener('click', () => { flipH = !flipH; drawCanvas(); });
flipVBtn.addEventListener('click', () => { flipV = !flipV; drawCanvas(); });
clearTextBtn.addEventListener('click', () => { text = ""; portugueseText.value = ""; drawCanvas(); });
rotationInput.addEventListener('input', () => { rotation = parseFloat(rotationInput.value) || 0; drawCanvas(); });
fontSizeInput.addEventListener('input', drawCanvas);
colorPicker.addEventListener('input', drawCanvas);

zoomInBtn.addEventListener('click', () => { zoom = Math.min(maxZoom, zoom + zoomStep); drawCanvas(); });
zoomOutBtn.addEventListener('click', () => { zoom = Math.max(minZoom, zoom - zoomStep); drawCanvas(); });

// --- EXPORTAÇÃO ---
saveBtn.addEventListener('click', () => {
  const outW = Math.max(256, parseInt(exportWidth.value) || 3840);
  const outH = Math.max(256, parseInt(exportHeight.value) || 2160);
  const transparent = !!exportTransparent.checked;

  const out = document.createElement('canvas');
  out.width = outW;
  out.height = outH;
  const octx = out.getContext('2d');
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = 'high';

  if (!transparent) {
    octx.fillStyle = '#ffffff';
    octx.fillRect(0, 0, outW, outH);
  }

  const sx = outW / canvasBaseWidth;
  const sy = outH / canvasBaseHeight;

  if (hasImage && img.src) {
    const drawW = img.width * zoom;
    const drawH = img.height * zoom;
    const imgX = (canvasBaseWidth - drawW) / 2;
    const imgY = (canvasBaseHeight - drawH) / 2;
    octx.save();
    octx.scale(sx, sy);
    octx.drawImage(img, imgX, imgY, drawW, drawH);
    octx.restore();
  }

  if (text) {
    octx.save();
    octx.scale(sx, sy);
    octx.translate(x, y);
    octx.rotate(rotation * Math.PI / 180);
    octx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    octx.fillStyle = colorPicker.value;
    octx.font = `${parseInt(fontSizeInput.value)}px MinhaFonte`;
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    const padding = 12;
    const usableW = hasImage ? Math.max(0, (img.width * zoom) - padding * 2) : Math.max(0, canvasBaseWidth - padding * 2);
    drawMultilineWrapped(octx, text, usableW, parseInt(fontSizeInput.value) + 8);
    octx.restore();
  }

  const link = document.createElement('a');
  link.download = `export_${outW}x${outH}${transparent ? '_transparent' : ''}.png`;
  link.href = out.toDataURL('image/png');
  link.click();
});

// --- INICIAL ---
x = canvasBaseWidth / 2;
y = canvasBaseHeight / 2;
resizeCanvas();
