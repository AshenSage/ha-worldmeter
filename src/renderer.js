function mountRadar(root, config) {
  const geo = d3;
  const countries = WORLD;
  const map = root.querySelector('.kr-map');
  const svg = root.querySelector('.kr-geography');
  const qs = (s) => root.querySelector(s);
  const qsa = (s) => [...root.querySelectorAll(s)];
  const format = (n) => new Intl.NumberFormat('de-CH').format(n);
  const dose = (n) => n.toFixed(2).replace('.', ',');
  const rad = (id, name, region, iso, lon, lat, value, reference) => ({id,kind:'radiation',name,region,iso,lon,lat,value,reference});
  const outbreak = (id, name, region, iso, lon, lat, value, period) => ({id,kind:'outbreak',name,region,iso,lon,lat,value,period});
  // All health and radiation entries below are synthetic UI examples, not readings.
  const entries = [
    rad('r-belgrade','Belgrad','Serbien','SRB',20.4489,44.7866,.12,.11),
    rad('r-bern','Bern','Schweiz','CHE',7.4474,46.948,.10,.10),
    rad('r-zurich','Zürich','Schweiz','CHE',8.5417,47.3769,.09,.09),
    rad('r-frankfurt','Frankfurt','Deutschland','DEU',8.6821,50.1109,.11,.10),
    rad('r-paris','Paris','Frankreich','FRA',2.3522,48.8566,.08,.08),
    rad('r-kyiv','Kyjiw','Ukraine','UKR',30.5234,50.4501,.13,.12),
    rad('r-helsinki','Helsinki','Finnland','FIN',24.9384,60.1699,.14,.13),
    rad('r-tokyo','Tokio','Japan','JPN',139.6917,35.6895,.06,.06),
    rad('r-la','Los Angeles','USA','USA',-118.2437,34.0522,.08,.08),
    rad('r-vancouver','Vancouver','Kanada','CAN',-123.1207,49.2827,.09,.09),
    rad('r-rome','Rom','Italien','ITA',12.4964,41.9028,.12,.12),
    rad('r-bucharest','Bukarest','Rumänien','ROU',26.1025,44.4268,.11,.10),
    rad('r-sofia','Sofia','Bulgarien','BGR',23.3219,42.6977,.14,.13),
    rad('r-zagreb','Zagreb','Kroatien','HRV',15.9819,45.8150,.10,.10),
    rad('r-budapest','Budapest','Ungarn','HUN',19.0402,47.4979,.12,.11),
    rad('r-sarajevo','Sarajevo','Bosnien und Herzegowina','BIH',18.4131,43.8563,.13,.12),
    rad('r-tirana','Tirana','Albanien','ALB',19.8187,41.3275,.09,.09),
    rad('r-thessaloniki','Thessaloniki','Griechenland','GRC',22.9444,40.6401,.10,.10),
    rad('r-podgorica','Podgorica','Montenegro','MNE',19.2594,42.4304,.11,.10),
    rad('r-vienna','Wien','Österreich','AUT',16.3738,48.2082,.12,.11),
    outbreak('o-congo','Cholera','DR Kongo','COD',15.2663,-4.4419,250,'Gemeldete Fälle im Beispiel: 7 Tage'),
    outbreak('o-brazil','Dengue','Brasilien','BRA',-47.8825,-15.7942,1240,'Gemeldete Fälle im Beispiel: 7 Tage'),
    outbreak('o-kenya','Mpox','Kenia','KEN',36.8219,-1.2921,37,'Gemeldete Fälle im Beispiel: 30 Tage'),
    outbreak('o-germany','Masern','Deutschland','DEU',13.4050,52.5200,62,'Gemeldete Fälle im Beispiel: 30 Tage'),
    outbreak('o-serbia','West-Nil-Fieber','Serbien','SRB',20.56,44.306,18,'Gemeldete Fälle im Beispiel: 7 Tage'),
    outbreak('o-india','Dengue','Indien','IND',77.2090,28.6139,420,'Gemeldete Fälle im Beispiel: 7 Tage')
  ];
  const homes=[{name:'Aranđelovac',lon:20.56,lat:44.306},{name:'Oberbipp',lon:7.66,lat:47.26}];
  const regions={world:{name:'WELT'},europe:{name:'EUROPA',bounds:[-16,32,44,65]},balkan:{name:'BALKAN',bounds:[13,36,30,49]},swiss:{name:'SCHWEIZ',bounds:[5.8,45.6,10.7,48.1]}};
  let state={layer:config.layer,region:config.region,selected:'r-belgrade',expanded:false};
  let projection;
  function projectionFor(width,height){
    if(state.region==='world') return geo.geoNaturalEarth1().fitExtent([[14,26],[width-14,height-35]],{type:'Sphere'});
    const [west,south,east,north]=regions[state.region].bounds;
    const p=geo.geoMercator().scale(1).translate([0,0]);
    const a=p([west,north]),b=p([east,south]);
    const k=Math.min((width-24)/(b[0]-a[0]),(height-38)/(b[1]-a[1]));
    return p.scale(k).translate([width/2-k*(a[0]+b[0])/2,(height-8)/2-k*(a[1]+b[1])/2]).clipExtent([[0,0],[width,height]]);
  }
  function visible(entry){
    if(state.layer!=='all'&&entry.kind!==state.layer) return false;
    if(state.region==='world') return true;
    const [w,s,e,n]=regions[state.region].bounds;
    return entry.lon>=w&&entry.lon<=e&&entry.lat>=s&&entry.lat<=n;
  }
  function icon(name){const el=document.createElement('ha-icon');el.setAttribute('icon','mdi:'+(name==='radiation'?'radioactive':'biohazard'));el.setAttribute('aria-hidden','true');return el;}
  function refreshIcons(){}
  function choose(id){state.selected=id;render();}
  function cluster(points,distance){
    const groups=[];
    for(const item of points){
      const existing=groups.find(g=>Math.hypot(g.x-item.x,g.y-item.y)<distance);
      if(existing){existing.items.push(item);existing.x=existing.items.reduce((v,p)=>v+p.x,0)/existing.items.length;existing.y=existing.items.reduce((v,p)=>v+p.y,0)/existing.items.length;}
      else groups.push({x:item.x,y:item.y,items:[item]});
    }
    // Merge remaining overlapping cluster targets after centroid movement.
    let changed=true;
    while(changed){changed=false;outer:for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++)if(Math.hypot(groups[i].x-groups[j].x,groups[i].y-groups[j].y)<distance){const g=groups[i];g.items.push(...groups[j].items);g.x=g.items.reduce((v,p)=>v+p.x,0)/g.items.length;g.y=g.items.reduce((v,p)=>v+p.y,0)/g.items.length;groups.splice(j,1);changed=true;break outer;}}
    return groups;
  }
  function renderMap(data){
    const width=map.clientWidth,height=map.clientHeight;
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    projection=projectionFor(width,height);
    const path=geo.geoPath(projection).digits(2);
    const affected=new Set(state.layer==='radiation'?[]:data.filter(e=>e.kind==='outbreak').map(e=>e.iso));
    const selected=entries.find(e=>e.id===state.selected);
    geo.select(qs('.kr-graticule')).selectAll('path').data([geo.geoGraticule10()]).join('path').attr('d',path);
    geo.select(qs('.kr-countries')).selectAll('path').data(countries.filter(c=>c.properties.id!=='ATA'),d=>d.properties.id).join('path').attr('d',path).attr('class',d=>{const id=d.properties.id;return [affected.has(id)?'kr-country-outbreak':'', ['CHE','SRB'].includes(id)?'kr-country-home':'', selected&&id===selected.iso&&visible(selected)?'kr-country-selected':''].join(' ');});
    const points=data.map(e=>{const p=projection([e.lon,e.lat]);return {...e,x:p[0],y:p[1]};}).filter(p=>p.x>=16&&p.x<=width-16&&p.y>=16&&p.y<=height-30);
    const coarse=window.matchMedia('(pointer:coarse)').matches;
    const groups=cluster(points,coarse?45:35);
    const overlay=qs('.kr-points');overlay.replaceChildren();
    for(const group of groups){
      const multiple=group.items.length>1;
      const kinds=new Set(group.items.map(p=>p.kind));
      const kind=kinds.size>1?'mixed':group.items[0].kind;
      const button=document.createElement('button');button.type='button';button.className='kr-point cursor-interaction'+(multiple?' kr-cluster':'');button.dataset.kind=kind;button.style.left=group.x+'px';button.style.top=group.y+'px';
      const includesSelected=group.items.some(p=>p.id===state.selected);button.setAttribute('aria-pressed',String(includesSelected));
      const radCount=group.items.filter(p=>p.kind==='radiation').length;const outCount=group.items.length-radCount;
      button.setAttribute('aria-label',multiple?`Beispielgruppe: ${radCount} Strahlungsmesspunkte und ${outCount} Ausbrüche; zum Vergrössern öffnen`:`${group.items[0].name}, ${group.items[0].region}, ${group.items[0].kind==='radiation'?dose(group.items[0].value)+' Mikrosievert pro Stunde':format(group.items[0].value)+' gemeldete Fälle'}, Beispieldaten`);
      const mark=document.createElement('span');mark.className='kr-mark';if(multiple)mark.textContent=group.items.length;button.append(mark);
      button.addEventListener('click',()=>{
        if(!multiple){choose(group.items[0].id);return;}
        const inSwiss=group.items.every(p=>p.iso==='CHE');
        const inBalkan=group.items.every(p=>p.lon>=13&&p.lon<=30&&p.lat>=36&&p.lat<=49);
        const inEurope=group.items.every(p=>p.lon>=-16&&p.lon<=44&&p.lat>=32&&p.lat<=65);
        if(inSwiss)state.region='swiss';else if(inBalkan)state.region='balkan';else if(inEurope)state.region='europe';else{
          const lons=group.items.map(p=>p.lon),lats=group.items.map(p=>p.lat);
          regions.focus={name:'DETAILANSICHT',bounds:[Math.min(...lons)-8,Math.max(-75,Math.min(...lats)-6),Math.max(...lons)+8,Math.min(75,Math.max(...lats)+6)]};state.region='focus';
        }
        state.selected=group.items[0].id;state.expanded=false;render();
      });overlay.append(button);
    }
    const places=qs('.kr-places');places.replaceChildren();
    if(state.region!=='world')for(const home of homes){
      const [x,y]=projection([home.lon,home.lat]);if(x<16||x>width-16||y<16||y>height-45)continue;
      const mark=document.createElement('span');mark.className='kr-home';mark.style.left=x+'px';mark.style.top=y+'px';mark.setAttribute('aria-label',home.name);places.append(mark);
      const label=document.createElement('span');label.className='kr-home-label';label.textContent=home.name;
      const toLeft=home.name==='Oberbipp';label.style.left=(toLeft?Math.max(8,x-78):Math.min(width-106,x+10))+'px';label.style.top=(y+11)+'px';places.append(label);
    }
    qs('.kr-map-caption').textContent=regions[state.region].name+' / 2D';
    qs('.kr-rad-count').textContent=data.filter(e=>e.kind==='radiation').length;
    qs('.kr-out-count').textContent=data.filter(e=>e.kind==='outbreak').length;
  }
  function renderDetail(){
    const e=entries.find(item=>item.id===state.selected);
    if(!e)return;
    const isRad=e.kind==='radiation';
    qs('.kr-detail').classList.toggle('kr-detail-outbreak',!isRad);
    qs('.kr-detail-type').textContent=(isRad?'MESSPUNKT':'AUSBRUCHSMELDUNG')+' · BEISPIEL';
    qs('.kr-detail-name').textContent=e.name;
    qs('.kr-detail-region').textContent=e.region+(isRad?' · Beispielstation':' · Beispielbericht');
    qs('.kr-detail-value').textContent=isRad?dose(e.value):format(e.value);
    qs('.kr-detail-unit').textContent=isRad?'µSv/h':'gemeldete Fälle';
    qs('.kr-detail-reference').textContent=isRad?'Referenzwert: '+dose(e.reference)+' µSv/h':e.period;
    qs('.kr-detail-age').textContent=isRad?'Demowert · kein Live-Messwert':'Demobericht · kein aktueller Ausbruch';
    qs('.kr-detail-source-label').textContent='Datenquelle vorgesehen: '+(isRad?(e.iso==='CHE'?'NADAM / NAZ':e.iso==='USA'?'EPA RadNet':['JPN','CAN'].includes(e.iso)?'Safecast':'EURDEP'):'WHO / ECDC');
    qs('.kr-source-link').href=isRad?(e.iso==='CHE'?'https://www.naz.ch/themen/messnetze':e.iso==='USA'?'https://www.epa.gov/radnet':['JPN','CAN'].includes(e.iso)?'https://safecast.org/data/':'https://remap.jrc.ec.europa.eu/'):'https://www.who.int/emergencies/disease-outbreak-news';
  }
  function renderList(data){
    const rows=qs('.kr-report-list');rows.replaceChildren();
    const ordered=[...data].sort((a,b)=>{if(a.kind!==b.kind)return a.kind==='outbreak'?-1:1;if(a.kind==='outbreak')return b.value-a.value;return a.region.localeCompare(b.region,'de');});
    qs('.kr-list-count').textContent=data.length+' Beispiele';
    const shown=state.expanded?ordered:ordered.slice(0,config.max_items);
    if(!shown.length){const empty=document.createElement('p');empty.className='kr-empty';empty.textContent='Keine Beispiele in diesem Ausschnitt.';rows.append(empty);}
    for(const entry of shown){
      const button=document.createElement('button');button.type='button';button.className='kr-report-row cursor-interaction';button.dataset.kind=entry.kind;button.dataset.id=entry.id;button.setAttribute('aria-pressed',String(entry.id===state.selected));
      const symbol=document.createElement('span');symbol.className='kr-row-indicator';symbol.append(icon(entry.kind==='radiation'?'radiation':'biohazard'));
      const title=document.createElement('span');const name=document.createElement('strong');name.textContent=entry.name;const region=document.createElement('small');region.textContent=entry.region+' · Beispiel';title.append(name,region);
      const value=document.createElement('span');value.className='kr-row-value';value.append(document.createTextNode(entry.kind==='radiation'?dose(entry.value):format(entry.value)));const unit=document.createElement('small');unit.textContent=entry.kind==='radiation'?'µSv/h':(entry.period.includes('30')?'Fälle / 30 Tage':'Fälle / 7 Tage');value.append(unit);button.append(symbol,title,value);button.addEventListener('click',()=>choose(entry.id));rows.append(button);
    }
    const more=qs('.kr-more');more.hidden=ordered.length<=config.max_items;more.textContent=state.expanded?'Weniger anzeigen':`${ordered.length-config.max_items} weitere Beispiele anzeigen`;
  }
  function render(){
    let data=entries.filter(visible);
    if(!data.some(e=>e.id===state.selected)&&data.length)state.selected=data.find(e=>e.kind==='radiation')?.id||data[0].id;
    qsa('[data-layer]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.layer===state.layer)));
    qsa('[data-region]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.region===state.region)));
    qs('.kr-detail').hidden=data.length===0;
    renderMap(data);if(data.length)renderDetail();renderList(data);refreshIcons();
  }
  qsa('[data-layer]').forEach(b=>b.addEventListener('click',()=>{state.layer=b.dataset.layer;state.expanded=false;render();}));
  qsa('[data-region]').forEach(b=>b.addEventListener('click',()=>{state.region=b.dataset.region;state.expanded=false;render();}));
  qs('.kr-more').addEventListener('click',()=>{state.expanded=!state.expanded;renderList(entries.filter(visible));refreshIcons();});
  const observer=new ResizeObserver(()=>renderMap(entries.filter(visible)));observer.observe(map);
  qs('h2').textContent=config.title;
  qs('.kr-clock').hidden=!config.show_clock;
  render();
  return {destroy:()=>observer.disconnect()};
}
