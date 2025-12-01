// ====== REFERÊNCIAS DO DOM ======
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


// ====== ESTADO ======
let img = new Image();
let hasImage = false;
let useBlank = false;

let zoom = 1;
const zoomStep = 0.1, minZoom = 0.1, maxZoom = 5;

let text = "";
let x = 0, y = 0;
let rotation = 0;
let flipH = false, flipV = false;
let draggingText = false, offsetX = 0, offsetY = 0;

// margens da área útil dentro da moldura (proporção do canvas)
const FRAME_MARGIN_X_RATIO = 0.09;  // ~9% de cada lado
const FRAME_MARGIN_Y_RATIO = 0.13;  // ~13% em cima/baixo

// fonte segura
let fontSize = 15;
const fontSizeIni = parseInt(fontSizeInput?.value, 10);
if (!Number.isNaN(fontSizeIni)) fontSize = fontSizeIni;


// ====== FUNÇÕES UTIL ======
function clampInt(v, min, max) {
  if (!Number.isFinite(v)) return null;
  return Math.max(min, Math.min(max, v | 0));
}

function toCanvasXY(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

function setCanvasSize(w, h) {
  canvas.width = w;
  canvas.height = h;
}

// retângulo interno da moldura (onde o texto PODE existir)
function getInnerRect() {
  const marginX = canvas.width * FRAME_MARGIN_X_RATIO;
  const marginY = canvas.height * FRAME_MARGIN_Y_RATIO;
  return {
    ix: marginX,
    iy: marginY,
    iw: canvas.width - 2 * marginX,
    ih: canvas.height - 2 * marginY
  };
}


// ====== MODO: UPLOAD / BRANCO ======
modeSelect?.addEventListener('change', () => {
  const isUpload = modeSelect.value === 'upload';
  if (uploadSection) uploadSection.style.display = isUpload ? 'block' : 'none';
  if (blankSection) blankSection.style.display = isUpload ? 'none' : 'block';
});

createBlankBtn?.addEventListener('click', () => {
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

uploadImage?.addEventListener('change', e => {
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


// ====== "TRADUÇÃO" PARA A FONTE ======
function traduzirSimbolos(txt) {
  // aqui você troca pelo seu mapa de símbolos real
  return txt; // por enquanto, não altera o texto
}

portugueseText?.addEventListener('input', () => {
  text = traduzirSimbolos(portugueseText.value);
  drawCanvas();
});


// ====== QUEBRA DE LINHA ROBUSTA (COM E SEM ESPAÇOS) ======
function getWrappedLines(ctx, text, maxWidth, lineHeight) {
  const paragraphs = text.split('\n');
  const lines = [];

  paragraphs.forEach(p => {
    if (p === "") {
      lines.push("");
      return;
    }

    const words = p.split(' ');
    let line = "";

    words.forEach((word, idx) => {
      const sep = idx === 0 ? "" : " ";
      const testLine = (line + sep + word).trimStart();
      const testWidth = ctx.measureText(testLine).width;

      // caso normal: temos espaço e a linha cabe
      if (testWidth <= maxWidth) {
        line = testLine;
      } else {
        // se já tem algo na linha, empurra linha atual
        if (line.length > 0) {
          lines.push(line);
          line = "";
        }

        // agora vamos quebrar a "palavra" por letras, se ela for maior que maxWidth
        let chunk = "";
        for (let i = 0; i < word.length; i++) {
          const testChunk = chunk + word[i];
          if (ctx.measureText(testChunk).width > maxWidth && chunk.length > 0) {
            lines.push(chunk);
            chunk = word[i];
          } else {
            chunk = testChunk;
          }
        }
        if (chunk.length > 0) {
          line = chunk; // esse pedaço vira o começo da próxima linha
        }
      }
    });

    if (line.length > 0) {
      lines.push(line);
    }
  });

  return lines;
}


// ====== DESENHO ======
function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // fundo
  let imgX = 0, imgY = 0, drawW = 0, drawH = 0;
  if (hasImage && img.src) {
    drawW = img.width * zoom;
    drawH = img.height * zoom;
    imgX = (canvas.width - drawW) / 2;
    imgY = (canvas.height - drawH) / 2;
    ctx.drawImage(img, imgX, imgY, drawW, drawH);
  } else if (useBlank) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // transparente
  }

  if (text) {
    const padding = 12;
    const lineHeight = fontSize + 8;

    const { ix, iy, iw, ih } = getInnerRect();
    const usableW = Math.max(0, iw - padding * 2);

    ctx.save();

    // recorte limitado à área interna da moldura
    ctx.beginPath();
    ctx.rect(ix, iy, iw, ih);
    ctx.clip();

    ctx.translate(x, y);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.fillStyle = colorPicker.value;
    ctx.font = `${fontSize}px MinhaFonteUI, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const lines = getWrappedLines(ctx, text, usableW, lineHeight);
    const totalH = lines.length * lineHeight;
    let yy = -totalH / 2 + lineHeight / 2;
    lines.forEach(l => {
      ctx.fillText(l, 0, yy);
      yy += lineHeight;
    });

    ctx.restore();

    keepTextInsideBounds();
  }
}


// ====== MEDIR TAMANHO DO TEXTO (MESMA LÓGICA DE QUEBRA) ======
function measureTextBounds(ctx, text, maxWidth, lineHeight) {
  const prevFont = ctx.font;
  ctx.font = `${fontSize}px MinhaFonteUI, sans-serif`;

  const lines = getWrappedLines(ctx, text, maxWidth, lineHeight);
  let maxLineW = 0;
  lines.forEach(l => {
    const w = ctx.measureText(l).width;
    if (w > maxLineW) maxLineW = w;
  });

  const b = {
    width: maxLineW,
    height: lines.length * lineHeight
  };

  ctx.font = prevFont;
  return b;
}


// ====== MANTER TEXTO DENTRO DA MOLDURA ======
function keepTextInsideBounds() {
  if (!text) return;

  const padding = 12;
  const lineHeight = fontSize + 8;

  const { ix, iy, iw, ih } = getInnerRect();
  const usableW = Math.max(0, iw - padding * 2);

  const b = measureTextBounds(ctx, text, usableW, lineHeight);
  const halfW = b.width / 2;
  const halfH = b.height / 2;

  const left   = ix + padding;
  const right  = ix + iw - padding;
  const top    = iy + padding;
  const bottom = iy + ih - padding;

  x = Math.max(left + halfW, Math.min(x, right  - halfW));
  y = Math.max(top  + halfH, Math.min(y, bottom - halfH));
}


// ====== HIT-TEST DE TEXTO PARA ARRASTAR ======
function pointInText(mx, my) {
  if (!text) return false;

  const padding = 12;
  const lineHeight = fontSize + 8;

  const { ix, iw } = getInnerRect();
  const usableW = Math.max(0, iw - padding * 2);
  const b = measureTextBounds(ctx, text, usableW, lineHeight);

  const dx = mx - x;
  const dy = my - y;
  const rad = -rotation * Math.PI / 180;
  const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
  const ry = dx * Math.sin(rad) + dy * Math.cos(rad);

  return (
    rx >= -b.width / 2 && rx <= b.width / 2 &&
    ry >= -b.height / 2 && ry <= b.height / 2
  );
}


// ====== DRAG ======
function startDrag(clientX, clientY) {
  const { x: mx, y: my } = toCanvasXY(clientX, clientY);
  if (pointInText(mx, my)) {
    draggingText = true;
    offsetX = mx - x;
    offsetY = my - y;
  }
}

function moveDrag(clientX, clientY) {
  if (!draggingText) return;
  const { x: mx, y: my } = toCanvasXY(clientX, clientY);
  x = mx - offsetX;
  y = my - offsetY;
  keepTextInsideBounds();
  drawCanvas();
}

function endDrag() {
  draggingText = false;
}

// mouse
canvas.addEventListener('mousedown', e => startDrag(e.clientX, e.clientY));
canvas.addEventListener('mousemove', e => moveDrag(e.clientX, e.clientY));
canvas.addEventListener('mouseup', endDrag);
canvas.addEventListener('mouseleave', endDrag);

// touch
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


// ====== CONTROLES ======
flipHBtn?.addEventListener('click', () => { flipH = !flipH; drawCanvas(); });
flipVBtn?.addEventListener('click', () => { flipV = !flipV; drawCanvas(); });

clearTextBtn?.addEventListener('click', () => {
  text = "";
  if (portugueseText) portugueseText.value = "";
  drawCanvas();
});

rotationInput?.addEventListener('input', () => {
  const v = parseFloat(rotationInput.value);
  rotation = Number.isFinite(v) ? v : 0;
  drawCanvas();
});

fontSizeInput?.addEventListener('input', () => {
  const v = clampInt(parseInt(fontSizeInput.value, 10), 10, 300);
  if (v !== null) fontSize = v;
  drawCanvas();
});

colorPicker?.addEventListener('input', drawCanvas);

zoomInBtn?.addEventListener('click', () => {
  zoom = Math.min(maxZoom, zoom + zoomStep);
  drawCanvas();
});
zoomOutBtn?.addEventListener('click', () => {
  zoom = Math.max(minZoom, zoom - zoomStep);
  drawCanvas();
});


// ====== EXPORTAÇÃO ======
saveBtn?.addEventListener('click', () => {
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
    octx.fillStyle = '#000000';
    octx.fillRect(0, 0, outW, outH);
  }

  const sx = outW / canvas.width;
  const sy = outH / canvas.height;

  // imagem de fundo
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

  // texto
  if (text) {
    const padding = 12;
    const lineHeight = fontSize + 8;

    const { ix, iy, iw, ih } = getInnerRect();
    const usableW = Math.max(0, iw - padding * 2);

    octx.save();
    octx.scale(sx, sy);

    // recorte igual ao da tela
    octx.beginPath();
    octx.rect(ix, iy, iw, ih);
    octx.clip();

    octx.translate(x, y);
    octx.rotate(rotation * Math.PI / 180);
    octx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    octx.fillStyle = colorPicker.value;
    octx.font = `${fontSize}px MinhaFonteUI, sans-serif`;
    octx.textAlign = "center";
    octx.textBaseline = "middle";

    const lines = getWrappedLines(octx, text, usableW, lineHeight);
    const totalH = lines.length * lineHeight;
    let yy = -totalH / 2 + lineHeight / 2;
    lines.forEach(l => {
      octx.fillText(l, 0, yy);
      yy += lineHeight;
    });

    octx.restore();
  }

  const link = document.createElement('a');
  link.download = `export_${outW}x${outH}${transparent ? '_transparent' : ''}.png`;
  link.href = out.toDataURL('image/png');
  link.click();
});


// ====== INICIALIZAÇÃO ======
setCanvasSize(1280, 720);
x = canvas.width / 2;
y = canvas.height / 2;
drawCanvas();
