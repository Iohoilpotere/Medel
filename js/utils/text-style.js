export function applyTextStyle(node, instance){
  if(!node || !instance) return;
  try{
    const fontFamily = instance.getProp && instance.getProp('fontFamily');
    if(fontFamily) node.style.fontFamily = fontFamily;
    const fw = Number(instance.getProp && instance.getProp('fontWeight'));
    if(Number.isFinite(fw)) node.style.fontWeight = String(fw);
    const italic = !!(instance.getProp && instance.getProp('italic'));
    node.style.fontStyle = italic ? 'italic' : 'normal';

    const fs = Number(instance.getProp && instance.getProp('fontSize'));
    const unit = instance.getProp && instance.getProp('fontSizeUnit') || 'px';
    const zoom = (instance.stage && instance.stage.zoom) ? instance.stage.zoom : 1;
    if(Number.isFinite(fs)){
      node.style.fontSize = (unit==='px' ? String(fs*zoom)+'px' : String(fs)+unit);
    }
    node.style.textDecorationColor = 'currentColor';
    const color = (instance.getProp && instance.getProp('color')) || node.style.color || '#ffffff';
    node.style.color = color;

    const ls = Number(instance.getProp && instance.getProp('letterSpacing'));
    if(Number.isFinite(ls)) node.style.letterSpacing = String(ls)+'px';
    const lh = Number(instance.getProp && instance.getProp('lineHeight'));
    node.style.lineHeight = Number.isFinite(lh)? String(lh) : (node.style.lineHeight||'1.2');

    // Stroke
    const sw = Number(instance.getProp && instance.getProp('strokeWidth') || 0);
    const sc = instance.getProp && instance.getProp('strokeColor');
    if(sw>0 && sc){
      try{ node.style.webkitTextStroke = `${sw}px ${sc}`; }catch(e){}
      try{ node.style.textStroke = `${sw}px ${sc}`; }catch(e){}
    }else{
      try{ node.style.webkitTextStroke = ''; }catch(e){}
      try{ node.style.textStroke = ''; }catch(e){}
    }

    // Shadow
    const col = (instance.getProp && instance.getProp('shadowColor')) || 'rgba(0,0,0,0.5)';
    const dx = Number(instance.getProp && instance.getProp('shadowDx') || 0);
    const dy = Number(instance.getProp && instance.getProp('shadowDy') || 0);
    const blur = Number(instance.getProp && instance.getProp('shadowBlur') || 6);
    node.style.textShadow = `${dx}px ${dy}px ${blur}px ${col}`;
  }catch(_e){}
}

export function applyTextStyleToAll(container, instance){
  if(!container) return;
  const nodes = container.querySelectorAll('span, label');
  nodes.forEach(n=>applyTextStyle(n, instance));
}
