export function applyItemsAlign(wrap, instance){
  if(!wrap || !instance) return;
  try{
    const sel = instance.getProp('selectionStyle') || 'standard';
    // Only for non-likert and non-pills unless applies
    if(sel==='likert') return;
    // direction: horizontal or vertical
    const dir = instance.getProp('itemsDirection') || 'vertical';
    if(dir==='horizontal'){
      const _itemsAlign = instance.getProp('itemsAlign') || 'start';
      const map = {start:'flex-start', center:'center', end:'flex-end'};
      wrap.style.justifyContent = map[_itemsAlign] || 'flex-start';
      wrap.style.alignItems = 'center';
    }else{
      const _itemsAlign = instance.getProp('itemsAlign') || 'start';
      const map = {start:'flex-start', center:'center', end:'flex-end'};
      wrap.style.alignItems = map[_itemsAlign] || 'flex-start';
    }
  }catch(_e){}
}
