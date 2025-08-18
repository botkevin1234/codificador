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
const moveModeSelect = document.getElementById('moveMode');
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');

let img = new Image();
let imgX=0, imgY=0, zoom=1;
const zoomStep=0.1, minZoom=0.1, maxZoom=5;

let text="", x=0, y=0, rotation=0, flipH=false, flipV=false;
let draggingText=false, draggingImage=false;
let offsetX=0, offsetY=0;
let mouseX=0, mouseY=0;

// Fonte personalizada
let fonteCarregada=false;
const minhaFonte=new FontFace('MinhaFonte','url(minhaFonte.ttf)');
minhaFonte.load().then(f=>{document.fonts.add(f); fonteCarregada=true;});

// Tradução
function traduzirSimbolos(txt){
    const mapa={"A":"A","B":"B","C":"C","D":"D","E":"E","F":"F","G":"G","H":"H","I":"I","J":"J",
                "K":"K","L":"L","M":"M","N":"N","O":"O","P":"P","Q":"Q","R":"R","S":"S","T":"T",
                "U":"U","V":"V","W":"W","X":"X","Y":"Y","Z":"Z"};
    return txt.split("").map(l=>mapa[l]||l).join("");
}

portugueseText.addEventListener('input',()=>{
    const lines=portugueseText.value.split('\n');
    text=lines.map(l=>traduzirSimbolos(l)).join('\n');
    drawCanvas();
});

// Upload imagem
uploadImage.addEventListener('change', e=>{
    const reader=new FileReader();
    reader.onload=ev=>{
        img.onload=()=>{
            canvas.width=img.width;
            canvas.height=img.height;
            x=canvas.width/2; y=canvas.height/2;
            imgX=0; imgY=0; zoom=1;
            drawCanvas();
        }
        img.src=ev.target.result;
    }
    reader.readAsDataURL(e.target.files[0]);
});

// Desenhar
function drawCanvas(){
    if(!fonteCarregada) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';

    // imagem
    if(img.src) ctx.drawImage(img, imgX, imgY, img.width*zoom, img.height*zoom);

    // texto
    if(text){
        ctx.save();
        ctx.translate(x,y);
        ctx.rotate(rotation*Math.PI/180);
        ctx.scale(flipH?-1:1, flipV?-1:1);
        ctx.fillStyle=colorPicker.value;
        ctx.font=`${fontSizeInput.value}px MinhaFonte`;
        ctx.textAlign="center";
        ctx.textBaseline="middle";
        const bounds=getTextBounds();
        drawMultilineText(ctx,text,bounds.width,bounds.height,parseInt(fontSizeInput.value)+6);
        ctx.restore();
    }
}

// Multiline
function drawMultilineText(ctx,text,maxWidth,maxHeight,lineHeight){
    const lines=[];
    text.split('\n').forEach(paragraph=>{
        let words=paragraph.split(' ');
        let line='';
        words.forEach(word=>{
            const testLine=line+word+' ';
            const metrics=ctx.measureText(testLine);
            if(metrics.width>maxWidth && line.length>0){ lines.push(line.trim()); line=word+' '; }
            else line=testLine;
        });
        lines.push(line.trim());
    });
    const totalHeight=lines.length*lineHeight;
    let startY=-totalHeight/2+lineHeight/2;
    lines.forEach(line=>{
        ctx.fillText(line,0,startY);
        startY+=lineHeight;
    });
}

// Bounds
function getTextBounds(){
    ctx.save();
    ctx.font=`${fontSizeInput.value}px MinhaFonte`;
    const lines=text.split('\n');
    const lineHeight=parseInt(fontSizeInput.value)+6;
    let totalHeight=lines.length*lineHeight;
    let maxWidth=0;
    lines.forEach(l=>{
        const words=l.split(' ');
        let lineBuffer='';
        words.forEach(word=>{
            const testLine=lineBuffer+word+' ';
            const metrics=ctx.measureText(testLine);
            if(metrics.width>maxWidth) maxWidth=metrics.width;
        });
    });
    ctx.restore();
    return {width:Math.min(maxWidth,img.width*zoom-10), height:totalHeight};
}

// Botões
flipHBtn.addEventListener('click',()=>{flipH=!flipH; drawCanvas();});
flipVBtn.addEventListener('click',()=>{flipV=!flipV; drawCanvas();});
clearTextBtn.addEventListener('click',()=>{text=""; portugueseText.value=""; drawCanvas();});
rotationInput.addEventListener('input',()=>{rotation=parseFloat(rotationInput.value); drawCanvas();});
fontSizeInput.addEventListener('input', drawCanvas);
colorPicker.addEventListener('input', drawCanvas);

zoomInBtn.addEventListener('click', ()=>{
    zoom=Math.min(maxZoom,zoom+zoomStep);
    keepImageInside();
    drawCanvas();
});
zoomOutBtn.addEventListener('click', ()=>{
    zoom=Math.max(minZoom,zoom-zoomStep);
    keepImageInside();
    drawCanvas();
});

// Salvar 4K
saveBtn.addEventListener('click', ()=>{
    const tmpCanvas=document.createElement('canvas');
    tmpCanvas.width=3840;
    tmpCanvas.height=2160;
    const tmpCtx=tmpCanvas.getContext('2d');
    tmpCtx.imageSmoothingEnabled=true;
    tmpCtx.imageSmoothingQuality='high';
    tmpCtx.fillStyle="#fff";
    tmpCtx.fillRect(0,0,tmpCanvas.width,tmpCanvas.height);

    const scaleX=tmpCanvas.width/canvas.width;
    const scaleY=tmpCanvas.height/canvas.height;
    tmpCtx.save();
    tmpCtx.scale(scaleX,scaleY);
    tmpCtx.drawImage(img,imgX,imgY,img.width*zoom,img.height*zoom);
    tmpCtx.save();
    tmpCtx.translate(x,y);
    tmpCtx.rotate(rotation*Math.PI/180);
    tmpCtx.scale(flipH?-1:1, flipV?-1:1);
    tmpCtx.fillStyle=colorPicker.value;
    tmpCtx.font=`${parseInt(fontSizeInput.value)}px MinhaFonte`;
    tmpCtx.textAlign="center";
    tmpCtx.textBaseline="middle";
    const bounds=getTextBounds();
    drawMultilineText(tmpCtx,text,bounds.width,bounds.height,parseInt(fontSizeInput.value)+6);
    tmpCtx.restore();
    tmpCtx.restore();

    const link=document.createElement('a');
    link.download='imagem_4K.png';
    link.href=tmpCanvas.toDataURL('image/png');
    link.click();
});

// Movimentação
canvas.addEventListener('mousedown',e=>{
    const rect=canvas.getBoundingClientRect();
    mouseX=e.clientX-rect.left;
    mouseY=e.clientY-rect.top;
    if(moveModeSelect.value==='text' && isInsideText(mouseX,mouseY)){
        draggingText=true; offsetX=mouseX-x; offsetY=mouseY-y;
    } else if(moveModeSelect.value==='image' && isInsideImage(mouseX,mouseY)){
        draggingImage=true; offsetX=mouseX-imgX; offsetY=mouseY-imgY;
    }
});

canvas.addEventListener('mousemove', e=>{
    const rect=canvas.getBoundingClientRect();
    mouseX=e.clientX-rect.left;
    mouseY=e.clientY-rect.top;

    if(draggingText){
        x=mouseX-offsetX; y=mouseY-offsetY;
        keepTextInsideImage(); drawCanvas();
    } else if(draggingImage){
        imgX=mouseX-offsetX; imgY=mouseY-offsetY;
        keepImageInside(); drawCanvas();
    }
});

canvas.addEventListener('mouseup', ()=>{draggingText=false; draggingImage=false;});
canvas.addEventListener('mouseleave', ()=>{draggingText=false; draggingImage=false;});

// Helpers
function isInsideText(mx,my){
    const b=getTextBounds();
    const dx=mx-x;
    const dy=my-y;
    const rad=-rotation*Math.PI/180;
    const rx=dx*Math.cos(rad)-dy*Math.sin(rad);
    const ry=dx*Math.sin(rad)+dy*Math.cos(rad);
    return rx>=-b.width/2 && rx<=b.width/2 && ry>=-b.height/2 && ry<=b.height/2;
}

function isInsideImage(mx,my){
    return mx>=imgX && mx<=imgX+img.width*zoom && my>=imgY && my<=imgY+img.height*zoom;
}

// Limites
function keepTextInsideImage(){
    const b=getTextBounds();
    const halfW=b.width/2, halfH=b.height/2;
    x=Math.max(imgX+halfW, Math.min(x,imgX+img.width*zoom-halfW));
    y=Math.max(imgY+halfH, Math.min(y,imgY+img.height*zoom-halfH));
}

function keepImageInside(){
    if(img.width*zoom<=canvas.width) imgX=(canvas.width-img.width*zoom)/2;
    else imgX=Math.min(0, Math.max(imgX, canvas.width-img.width*zoom));
    if(img.height*zoom<=canvas.height) imgY=(canvas.height-img.height*zoom)/2;
    else imgY=Math.min(0, Math.max(imgY, canvas.height-img.height*zoom));
}

// Primeira renderização
drawCanvas();
