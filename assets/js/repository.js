'use strict';
(() => {
  const $ = s => document.querySelector(s);
  const legacy={'#one':'investigacion.html','#two':'recursos.html','#three':'contacto.html','#resultados':'investigacion.html','#dispositivo':'dispositivo.html'};
  if(document.body.dataset.titleEs==='Inicio' && legacy[location.hash])location.replace(legacy[location.hash]);
  let language = 'es', mode = 'exterior', viewer = null, state = 'idle', loader = null, loadTimer;
  const status = {
    idle: {es:'El modelo se carga solo al activarlo.',en:'The model loads only when activated.'},
    loading: {es:'Cargando modelo 3D…',en:'Loading 3D model…'},
    ready: {es:'Modelo listo. Consulta los números y la lista de componentes.',en:'Model ready. Explore the markers and component list.'},
    error: {es:'No se pudo cargar el visor. Puedes consultar la lista o descargar los modelos. Pulsa Activar para reintentar.',en:'The viewer could not load. Use the component list or download the models. Press Load to retry.'}
  };
  function message(s) { state=s; if($('#viewer-status')) $('#viewer-status').textContent=status[s][language]; }
  function updateText() {
    document.documentElement.lang=language;
    document.title=document.body.dataset[language==='es'?'titleEs':'titleEn']+' | '+(language==='es'?'Entrenador Braille':'Braille Trainer');
    document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.lang===language)));
    document.querySelectorAll('[data-es-alt]').forEach(e=>e.alt=e.dataset[language+'Alt']);
    document.querySelectorAll('[data-es-label]').forEach(e=>e.setAttribute('aria-label',e.dataset[language+'Label']));
    message(state); renderPoints();
  }
  function renderPoints() {
    if(!$('#part-list'))return;
    const data=window.BRAILLE_MODELS[mode];
    $('#part-list').replaceChildren();
    data.points.forEach(p=>{ const li=document.createElement('li');li.textContent=p[language];$('#part-list').append(li); });
    $('#poster').alt=language==='es'?`Vista previa del modelo ${mode}`:`${mode} model preview`;
    if(!viewer)return;
    viewer.setAttribute('alt',language==='es'?`Modelo ${mode} del Entrenador Braille. Gira con las flechas del teclado. La lista de componentes aparece junto al visor.`:`${mode} model of the Braille Trainer. Rotate with arrow keys. Components are listed beside the viewer.`);
    viewer.querySelectorAll('.hotspot').forEach(e=>e.remove());
    data.points.forEach((p,i)=>{
      const b=document.createElement('button'); b.type='button';b.className='hotspot';b.slot='hotspot-'+i;
      b.dataset.position=p.position;b.dataset.normal=p.normal;b.setAttribute('data-visibility-attribute','data-visible');
      b.textContent=String(i+1);b.title=p[language];b.setAttribute('aria-label',`${i+1}. ${p[language]}`);
      b.addEventListener('click',()=>{$('#viewer-status').textContent=`${i+1}. ${p[language]}`;});viewer.append(b);
    });
  }
  function resetCamera(){if(viewer)viewer.setAttribute('camera-orbit',window.BRAILLE_MODELS[mode].orbit);}
  function setMode(next){
    mode=next;
    document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
    $('#poster').src=`assets/models/${mode}.webp`;
    if(viewer){viewer.poster=`assets/models/${mode}.webp`;viewer.src=`assets/models/${mode}.glb`;resetCamera();message('loading');watchLoading();}
    renderPoints();
  }
  function fail(){ clearTimeout(loadTimer);message('error');$('#load-model').hidden=false;$('#load-model').disabled=false; }
  function watchLoading(){clearTimeout(loadTimer);loadTimer=setTimeout(()=>{if(state==='loading')fail();},60000);}
  function loadLibrary(){
    if(customElements.get('model-viewer'))return Promise.resolve();
    if(loader)return loader;
    loader=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.type='module';script.src='https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js';
      const timeout=setTimeout(()=>{script.remove();loader=null;reject(new Error('timeout'));},25000);
      script.onerror=()=>{clearTimeout(timeout);script.remove();loader=null;reject(new Error('network'));};
      customElements.whenDefined('model-viewer').then(()=>{clearTimeout(timeout);resolve();});
      document.head.append(script);
    });return loader;
  }
  async function activate(){
    $('#load-model').disabled=true;message('loading');
    try{
      await loadLibrary();
      if(viewer){viewer.remove();viewer=null;}
      viewer=document.createElement('model-viewer');viewer.setAttribute('tabindex','0');
      viewer.setAttribute('camera-controls','');viewer.setAttribute('touch-action','pan-y');viewer.setAttribute('tone-mapping','agx');
      viewer.setAttribute('environment-image','legacy');viewer.setAttribute('shadow-intensity','1');viewer.setAttribute('exposure','1');viewer.setAttribute('field-of-view','30deg');
      viewer.setAttribute('interaction-prompt','none');viewer.setAttribute('loading','eager');
      viewer.poster=`assets/models/${mode}.webp`;resetCamera();renderPoints();
      viewer.addEventListener('load',()=>{clearTimeout(loadTimer);message('ready');$('#load-model').hidden=true;$('#load-model').disabled=false;$('#reset').disabled=false;});
      viewer.addEventListener('error',fail);
      viewer.src=`assets/models/${mode}.glb`;$('#model-slot').append(viewer);$('#poster').hidden=true;
      $('#load-model').hidden=true;$('#load-model').disabled=false;watchLoading();
    }catch(e){fail();}
  }
  try{const stored=localStorage.getItem('braille-language');language=['es','en'].includes(stored)?stored:(navigator.language.toLowerCase().startsWith('es')?'es':'en');}catch(e){language=navigator.language.toLowerCase().startsWith('es')?'es':'en';}
  document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>{language=b.dataset.lang;try{localStorage.setItem('braille-language',language);}catch(e){}updateText();}));
  if(!$('#load-model')){updateText();return;}
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
  $('#reset').addEventListener('click',resetCamera);$('#load-model').addEventListener('click',activate);updateText();
})();
