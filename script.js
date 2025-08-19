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

// imagem centralizada
let zoom = 1;
const zoomStep = 0.1, minZoom = 0.1, maxZoom = 5;

// texto e transformações
let text = "", x = 0, y = 0, rotation = 0, flipH = false, flipV = false;
let draggingText = false, offsetX = 0, offsetY = 0;

// fonte personalizada
let fonteCarregada = false;
const minhaFonte = new FontFace('MinhaFonte', 'url(minhaFonte.ttf)');
minhaFonte.load().then(f => {
  document.fonts.add(f);
  fonteCarregada = true;
  drawCanvas();
});

// alternar modo
modeSelect.addEventListener('change', () => {
  const isUpload = modeSelect.value === 'upload';
  uploadSection.style.display = isUpload ? 'block' : 'none';
  blankSection.style.display = isUpload ? 'none' : 'block';
});

// criar canvas transparente
createBlankBtn.addEventListener('click', () => {
  const w = Math.max(200, parseInt(blankWidthInput.value) || 1920);
  const h = Math.max(200, parseInt(blankHeightInput.value) || 1080);
  useBlank = true;
  hasImage = false;
  img = new Image();
  zoom = 1;

  setCanvasSize(w, h);
  x = canvas.width / 2;
  y = canvas.height / 2;
  drawCanvas();
});

// upload de imagem
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
      setCanvasSize(img.width, img.height);
      x = canvas.width / 2;
      y = canvas.height / 2;
      drawCanvas();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

// util: ajustar tamanho interno do canvas
function setCanvasSize(w, h) {
  canvas.width = w;
  canvas.height = h;
}

// tradução de símbolos (exemplo simples)
function traduzirSimbolos(txt) {
  const mapa = {
    "A":"A","B":"B","C":"C","D":"D","E":"E","F":"F","G":"G","H":"H","I":"I","J":"J",
    "K":"K","L":"L","M":"M","N":"N","O":"O","P":"P","Q":"Q","R":"R","S":"S","T":"T",
    "U":"U","V":"V","W":"W","X":"X","Y":"Y","Z":"Z"
  };
  return txt.split("").map(l => mapa[l] || l).join("");
}

portugueseText.addEventListener('input', () => {
  text = portuguesTextToTranslated();
  drawCanvas();
});

function portuguesTextToTranslated() {
  const lines = portugueseText.value.split('\n');
  return lines.map(l => traduzirSimbolos(l)).join('\n');
}

// desenhar
function drawCanvas() {
  if (!fonteCarregada) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // imagem
  let imgX = 0, imgY = 0, drawW = 0, drawH = 0;
  if (hasImage && img.src) {
    drawW = img.width * zoom;
    drawH = img.height * zoom;
    imgX = (canvas.width - drawW) / 2;
    imgY = (canvas.height - drawH) / 2;
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
    const usableW = hasImage ? Math.max(0, drawW - padding * 2) : Math.max(0, canvas.width - padding * 2);
    drawMultilineWrapped(ctx, text, usableW, parseInt(fontSizeInput.value) + 8);
    ctx.restore();

    // mantém texto dentro de limites sem mudar o centro
    keepTextWithinBounds(imgX, imgY, drawW, drawH);
  }
}

// quebra de linha
function drawMultilineWrapped(ctx, text, maxWidth, lineHeight) {
  const paragraphs = text.split('\n');
  let lines = [];
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

// manter texto dentro de limites sem alterar centro
function keepTextWithinBounds(imgX, imgY, drawW, drawH) {
  const padding = 12;
  const lineHeight = parseInt(fontSizeInput.value) + 8;
  const usableW = hasImage ? Math.max(0, drawW - padding * 2) : Math.max(0, canvas.width - padding * 2);
  const b = measureTextBounds(ctx, text, usableW, lineHeight);

  x = Math.min(Math.max(x, b.width / 2), canvas.width - b.width / 2);
  y = Math.min(Math.max(y, b.height / 2), canvas.height - b.height / 2);
}

// medir bounds do texto
function measureTextBounds(ctx, text, maxWidth, lineHeight) {
  const prevFont = ctx.font;
  ctx.font = `${parseInt(fontSizeInput.value)}px MinhaFonte`;
  const paragraphs = text.split('\n');
  let maxLineW = 0, numLines = 0;
  paragraphs.forEach(p => {
    const words = p.split(' ');
    let line = '';
    words.forEach(word => {
      const test = (line + word + ' ').trimEnd();
      if (ctx.measureText(test).width > maxWidth && line.length > 0) {
        maxLineW = Math.max(maxLineW, ctx.measureText(line).width);
        numLines++;
        line = word + ' ';
      } else line = test + ' ';
    });
    maxLineW = Math.max(maxLineW, ctx.measureText(line).width);
    numLines++;
  });
  ctx.font = prevFont;
  return { width: maxLineW, height: numLines * lineHeight };
}

// interação com texto
function pointInText(mx, my) {
  const lineHeight = parseInt(fontSizeInput.value) + 8;
  const usableW = hasImage ? Math.max(0, (img.width * zoom) - 24) : Math.max(0, canvas.width - 24);
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
  const mx = clientX - rect.left;
  const my = clientY - rect.top;
  if (pointInText(mx, my)) {
    draggingText = true;
    offsetX = mx - x;
    offsetY = my - y;
  }
}

function moveDrag(clientX, clientY) {
  if (!draggingText) return;
  const rect = canvas.getBoundingClientRect();
  const mx = clientX - rect.left;
  const my = clientY - rect.top;
  x = mx - offsetX;
  y = my - offsetY;
  drawCanvas();
}

function endDrag() { draggingText = false; }

// eventos mouse
canvas.addEventListener('mousedown', e => startDrag(e.clientX, e.clientY));
canvas.addEventListener('mousemove', e => moveDrag(e.clientX, e.clientY));
canvas.addEventListener('mouseup', endDrag);
canvas.addEventListener('mouseleave', endDrag);

// eventos touch
canvas.addEventListener('touchstart', e => { 
  const t = e.touches[0];
  startDrag(t.clientX, t.clientY);
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchmove', e => { 
  const t = e.touches[0];
  moveDrag(t.clientX, t.clientY);
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', endDrag);

// botões
flipHBtn.addEventListener('click', () => { flipH = !flipH; drawCanvas(); });
flipVBtn.addEventListener('click', () => { flipV = !flipV; drawCanvas(); });
clearTextBtn.addEventListener('click', () => { text = ""; portugueseText.value = ""; drawCanvas(); });
rotationInput.addEventListener('input', () => { rotation = parseFloat(rotationInput.value) || 0; drawCanvas(); });

// **CORREÇÃO CRUCIAL: manter posição do texto ao alterar fonte**
fontSizeInput.addEventListener('input', () => {
  const newFontSize = parseInt(fontSizeInput.value) || 36;
  drawCanvas(); // desenha com nova fonte, mantendo centro
});

colorPicker.addEventListener('input', drawCanvas);
zoomInBtn.addEventListener('click', () => { zoom = Math.min(maxZoom, zoom + zoomStep); drawCanvas(); });
zoomOutBtn.addEventListener('click', () => { zoom = Math.max(minZoom, zoom - zoomStep); drawCanvas(); });

// exportação
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

  const sx = outW / canvas.width;
  const sy = outH / canvas.height;

  if (hasImage && img.src) {
    const drawW = img.width * zoom;
    const drawH = img.height * zoom;
    const imgX = (canvas.width - drawW) / 2;
    const imgY = (canvas.height - drawH) / 2;
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
    const usableW = hasImage ? Math.max(0, (img.width * zoom) - padding * 2) : Math.max(0, canvas.width - padding * 2);
    drawMultilineWrapped(octx, text, usableW, parseInt(fontSizeInput.value) + 8);
    octx.restore();
  }

  const link = document.createElement('a');
  link.download = `export_${outW}x${outH}${transparent ? '_transparent' : ''}.png`;
  link.href = out.toDataURL('image/png');
  link.click();
});

// primeira renderização
setCanvasSize(1280, 720);
x = canvas.width / 2;
y = canvas.height / 2;
drawCanvas();
