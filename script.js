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

// imagem desenhada centralizada
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
  resetTextPosition();
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
  resetTextPosition();
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
      resetTextPosition();
      drawCanvas();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

// util: ajustar tamanho interno do canvas (mantém nitidez)
function setCanvasSize(w, h) {
  canvas.width = w;
  canvas.height = h;
}

// reseta posição do texto para o centro do canvas ou da imagem
function resetTextPosition() {
  x = canvas.width / 2;
  y = canvas.height / 2;
}

// tradução de símbolos
function traduzirSimbolos(txt) {
  const mapa = {
    "A":"A","B":"B","C":"C","D":"D","E":"E","F":"F","G":"G","H":"H","I":"I","J":"J",
    "K":"K","L":"L","M":"M","N":"N","O":"O","P":"P","Q":"Q","R":"R","S":"S","T":"T",
    "U":"U","V":"V","W":"W","X":"X","Y":"Y","Z":"Z"
  };
  return txt.split("").map(l => mapa[l] || l).join("");
}

portugueseText.addEventListener('input', () => {
  const lines = portugueseText.value.split('\n');
  text = lines.map(l => traduzirSimbolos(l)).join('\n');
  drawCanvas();
});

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
    const usableW = hasImage ? Math.max(0, (img.width * zoom) - padding * 2) : Math.max(0, canvas.width - padding * 2);
    drawMultilineWrapped(ctx, text, usableW, parseInt(fontSizeInput.value) + 8);
    ctx.restore();

    keepTextInsideBounds(imgX, imgY, drawW, drawH);
  }
}

// ... (restante do código de drawMultilineWrapped, measureTextBounds, keepTextInsideBounds, drag, touch, zoom, flip, export) ...
