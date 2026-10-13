class KrisenradarCard extends HTMLElement {
  constructor(){
    super();
    this.attachShadow({mode:'open'});
    this._controller=null;
  }
  static getStubConfig(){return {title:'Krisenradar',region:'world',layer:'all',max_items:3,show_clock:true,demo:true};}
  static getConfigForm(){
    return {schema:[
      {name:'title',selector:{text:{}}},
      {name:'region',selector:{select:{options:[{value:'world',label:'Welt'},{value:'europe',label:'Europa'},{value:'balkan',label:'Balkan'},{value:'swiss',label:'Schweiz'}]}}},
      {name:'layer',selector:{select:{options:[{value:'all',label:'Beide Ebenen'},{value:'radiation',label:'Strahlung'},{value:'outbreak',label:'Ausbrüche'}]}}},
      {name:'max_items',selector:{number:{min:1,max:10,step:1,mode:'box'}}},
      {name:'show_clock',selector:{boolean:{}}}
    ],computeLabel:(schema)=>({title:'Titel',region:'Startansicht',layer:'Startebene',max_items:'Sichtbare Beispiele',show_clock:'Doomsday Clock anzeigen'}[schema.name]||schema.name)};
  }
  setConfig(config){
    if(!config||typeof config!=='object')throw new Error('Krisenradar: Konfiguration fehlt.');
    const next={...KrisenradarCard.getStubConfig(),...config};
    if(typeof next.title!=='string')throw new Error('Krisenradar: title muss ein Text sein.');
    if(!['world','europe','balkan','swiss'].includes(next.region))throw new Error('Krisenradar: region muss world, europe, balkan oder swiss sein.');
    if(!['all','radiation','outbreak'].includes(next.layer))throw new Error('Krisenradar: layer muss all, radiation oder outbreak sein.');
    if(!Number.isInteger(next.max_items)||next.max_items<1||next.max_items>10)throw new Error('Krisenradar: max_items muss zwischen 1 und 10 liegen.');
    if(typeof next.show_clock!=='boolean')throw new Error('Krisenradar: show_clock muss true oder false sein.');
    if(next.demo!==true)throw new Error('Krisenradar 1.0.0 zeigt ausschliesslich Beispieldaten. demo: false wird erst mit einer Live-Datenanbindung unterstützt.');
    this._config=next;
    if(this.isConnected)this._mount();
  }
  set hass(value){this._hass=value;}
  get hass(){return this._hass;}
  connectedCallback(){if(!this._config)this._config=KrisenradarCard.getStubConfig();this._mount();}
  disconnectedCallback(){this._controller?.destroy();this._controller=null;}
  _mount(){
    this._controller?.destroy();
    this.shadowRoot.innerHTML=`<style>${CSS}</style>${HTML}`;
    const root=this.shadowRoot.querySelector('#ha-krisenradar-preview');
    this._controller=mountRadar(root,this._config);
  }
  getCardSize(){return Math.max(1,Math.ceil((this.offsetHeight||1050)/50));}
  getGridOptions(){return {columns:12,min_columns:6};}
}
if(!customElements.get('krisenradar-card'))customElements.define('krisenradar-card',KrisenradarCard);
window.customCards=window.customCards||[];
if(!window.customCards.some(card=>card.type==='krisenradar-card'))window.customCards.push({type:'krisenradar-card',name:'Krisenradar',description:'2D-Karte für Strahlung und Krankheitsausbrüche. Version 1.0.0: klar gekennzeichnete Beispieldaten.',preview:true,documentationURL:'https://github.com/AshenSage/ha-worldmeter'});
