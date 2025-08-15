const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const uploadImage = document.getElementById('uploadImage');
const portugueseText = document.getElementById('portugueseText');
const colorPicker = document.getElementById('colorPicker');
const fontSizeInput = document.getElementById('fontSize');
const rotationInput = document.getElementById('rotationInput');
const flipHBtn = document.getElementById('flipH');
const flipVBtn = document.getElementById('flipV');
const clearTextBtn = document.getElementById('clearText');
const saveBtn = document.getElementById('saveImage');

let img = new Image();
let text = "";
let x = 400;
let y = 250;
let dragging = false;
let offsetX, offsetY;
let rotation = 0;
let flipH = false;
let flipV = false;
let scale = 1;
const maxWidth = 500;

// Carregar a fonte personalizada
let fonteCarregada = false;
const minhaFonte = new FontFace('MinhaFonte', 'url(minhaFonte.ttf)');
minhaFonte.load().then(f => {
    document.fonts.add(f);
    fonteCarregada = true;
});

// Função de tradução
function traduzirSimbolos(texto){
    const mapa = {
        "A":"A","B":"B","C":"C","D":"D","E":"E","F":"F","G":"G","H":"H","I":"I","J":"J",
        "K":"K","L":"Λ","M":"M","N":"N","O":"O","P":"P","Q":"Q","R":"R","S":"S","T":"T",
        "U":"Y","V":"V","W":"W","X":"X","Y":"Y","Z":"Z",
        "a":"a","b":"b","c":"c","d":"d","e":"e","f":"f","g":"g","h":"h","i":"i","j":"j",
        "k":"k","l":"l","m":"m","n":"n","o":"o","p":"p","q":"q","r":"r","s":"s","t":"t",
        "u":"u","v":"v","w":"w","x":"x","y":"y","z":"z",
        "á":"á","à":"à","ã":"ã","â":"â","é":"é","ê":"ê","í":"í","ó":"ó","ô":"ô","õ":"õ",
        "ú":"ú","ü":"ü","ç":"ç"
    };
    return texto.split("").map(l => mapa[l] || l).join("");
}

// Atualizar texto automaticamente
portugueseText.addEventListener('input', function(){
    const lines = this.value.split('\n');
    const translatedLines = lines.map(line => traduzirSimbolos(line));
    text = translatedLines.join('\n');
    drawCanvas();
});

// Desenhar canvas
function drawCanvas() {
    if(!fonteCarregada) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(img.src) ctx.drawImage(img,0,0,canvas.width,canvas.height);

    if(text){
        ctx.save();
        ctx.translate(x,y);
        ctx.rotate(rotation*Math.PI/180);
        ctx.scale(flipH?-1:1, flipV?-1:1);
        ctx.fillStyle = colorPicker.value;
        ctx.font = `${fontSizeInput.value}px MinhaFonte`;
        drawMultilineText(ctx, text, 0, 0, maxWidth, parseInt(fontSizeInput.value)+6);
        ctx.restore();
    }
}

// Quebra de linhas
function drawMultilineText(ctx, text, x, y, maxWidth, lineHeight){
    const lines = text.split('\n');
    let startY = y;
    lines.forEach(line => {
        let words = line.split(' ');
        let lineBuffer = '';
        for(let i=0;i<words.length;i++){
            const testLine = lineBuffer + words[i] + ' ';
            const metrics = ctx.measureText(testLine);
            if(metrics.width > maxWidth && i>0){
                ctx.fillText(lineBuffer, x, startY);
                lineBuffer = words[i] + ' ';
                startY += lineHeight;
            } else {
                lineBuffer = testLine;
            }
        }
        ctx.fillText(lineBuffer, x, startY);
        startY += lineHeight;
    });
}

// Carregar imagem do usuário
uploadImage.addEventListener('change',function(e){
    const reader=new FileReader();
    reader.onload=function(event){
        img.onload=drawCanvas;
        img.src=event.target.result;
    }
    reader.readAsDataURL(e.target.files[0]);
});

// Inputs
colorPicker.addEventListener('input', drawCanvas);
fontSizeInput.addEventListener('input', drawCanvas);
rotationInput.addEventListener('input',function(){rotation=parseFloat(this.value); drawCanvas();});
flipHBtn.addEventListener('click',function(){flipH=!flipH; drawCanvas();});
flipVBtn.addEventListener('click',function(){flipV=!flipV; drawCanvas();});
clearTextBtn.addEventListener('click', function(){ text=""; portugueseText.value=""; drawCanvas(); });
saveBtn.addEventListener('click',function(){
    const link=document.createElement('a');
    link.download='imagem_com_texto.png';
    link.href=canvas.toDataURL();
    link.click();
});

// Arrastar texto
function getTextBounds(){
    ctx.save();
    ctx.font=`${fontSizeInput.value}px MinhaFonte`;
    const lines = text.split('\n');
    let maxWidthLine = 0;
    const lineHeight = parseInt(fontSizeInput.value)+6;
    let totalHeight = 0;
    lines.forEach(line => {
        let words = line.split(' ');
        let lineBuffer = '';
        let lineWidth = 0;
        for(let i=0; i<words.length; i++){
            const testLine = lineBuffer + words[i] + ' ';
            const metrics = ctx.measureText(testLine);
            if(metrics.width>maxWidth && i>0){
                lineWidth = Math.max(lineWidth, ctx.measureText(lineBuffer).width);
                lineBuffer = words[i] + ' ';
                totalHeight += lineHeight;
            } else {
                lineBuffer = testLine;
            }
        }
        lineWidth = Math.max(lineWidth, ctx.measureText(lineBuffer).width);
        maxWidthLine = Math.max(maxWidthLine, lineWidth);
        totalHeight += lineHeight;
    });
    ctx.restore();
    return {width:maxWidthLine*scale, height:totalHeight*scale};
}

function isInsideText(mouseX,mouseY){
    const bounds = getTextBounds();
    const dx = mouseX - x;
    const dy = mouseY - y;
    const rad = -rotation*Math.PI/180;
    const rotatedX = dx*Math.cos(rad)-dy*Math.sin(rad);
    const rotatedY = dx*Math.sin(rad)+dy*Math.cos(rad);
    return rotatedX>=0 && rotatedX<=bounds.width && rotatedY>=0 && rotatedY<=bounds.height;
}

canvas.addEventListener('mousedown',function(e){
    if(isInsideText(e.offsetX,e.offsetY)){
        dragging=true;
        offsetX=e.offsetX-x;
        offsetY=e.offsetY-y;
    }
});
canvas.addEventListener('mousemove',function(e){
    if(dragging){
        x=e.offsetX-offsetX;
        y=e.offsetY-offsetY;
        drawCanvas();
    }
});
canvas.addEventListener('mouseup',function(){dragging=false;});
canvas.addEventListener('mouseleave',function(){dragging=false;});

// Primeira renderização
drawCanvas();
