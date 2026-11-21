import settings from './site-settings.js';
import { language } from './i18n.js';

const key = 'co-na-talerz:analytics-consent';
const publisher = 'ca-pub-7004900333291295';
const id = settings.analyticsId;
const defaults = {analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'};
const accepted = {...defaults,analytics_storage:'granted'};
const isPrivatePage = () => /^#share\//i.test(location.hash) ||
  new URL(location.href).searchParams.has('code') || location.hash.includes('access_token=');
let loaded=false, choice, lastPage;
const messages = {
  pl:['Ustawienia analityki','Czy zgadzasz się na Google Analytics? Pomaga mierzyć, z których części aplikacji korzystają użytkownicy.','Zezwól','Odrzuć','Możesz zmienić decyzję w stopce.'],
  en:['Analytics settings','Allow Google Analytics to measure which parts of the app people use?','Allow','Decline','You can change your choice in the footer.'],
  de:['Analyse-Einstellungen','Darf Google Analytics die Nutzung der App messen?','Zulassen','Ablehnen','Du kannst deine Auswahl in der Fußzeile ändern.'],
  uk:['Налаштування аналітики','Дозволити Google Analytics вимірювати використання застосунку?','Дозволити','Відхилити','Ви можете змінити вибір унизу сторінки.'],
  fr:['Paramètres d’analyse','Autoriser Google Analytics à mesurer l’utilisation de l’application ?','Autoriser','Refuser','Vous pouvez modifier votre choix dans le pied de page.'],
  da:['Analyseindstillinger','Tillad Google Analytics at måle brugen af appen?','Tillad','Afvis','Du kan ændre valget nederst på siden.'],
  es:['Preferencias de analítica','¿Permites que Google Analytics mida el uso de la aplicación?','Permitir','Rechazar','Puedes cambiar tu elección al pie de página.'],
  it:['Impostazioni di analisi','Consenti a Google Analytics di misurare l’uso dell’app?','Consenti','Rifiuta','Puoi cambiare scelta a piè di pagina.'],
};
const production = () => globalThis.location?.hostname === 'conatalerz.pl';
const enabled = () => !!id && production() && !isPrivatePage();
function script(src) {
  const node=document.createElement('script');
  node.src=src;
  node.async=true;
  node.crossOrigin='anonymous';
  document.head.append(node);
}
function enableAnalytics() {
  if(!enabled() || loaded || choice!=='granted') return;
  loaded=true;
  window['ga-disable-'+id]=false;
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
  window.gtag('consent','default',defaults);
  window.gtag('consent','update',accepted);
  window.gtag('js',new Date());
  window.gtag('config',id,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,
    page_location:location.origin+location.pathname,page_referrer:''});
  script('https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id));
}
export function measurePage(tab) {
  if(!enabled()||choice!=='granted'||!loaded||tab===lastPage)return;
  lastPage=tab;
  window.gtag('event','page_view',{
    page_title:document.title,
    page_location:location.origin+location.pathname+(tab==='recipes'?'':'#'+tab),
    page_referrer:'',
  });
}
export function measureAction(name) {
  if(!enabled()||choice!=='granted'||!loaded)return;
  if(['recipe_open','surprise_click','shopping_add','offers_view','install_open'].includes(name))window.gtag('event',name);
}
export function measurementLabels() {
  if(!enabled())return;
  const [label,question,allow,decline,note]=messages[language];
  document.querySelector('#analytics-settings').textContent=label;
  document.querySelector('#analytics-question').textContent=question;
  document.querySelector('#analytics-allow').textContent=allow;
  document.querySelector('#analytics-decline').textContent=decline;
  document.querySelector('#analytics-note').textContent=note;
}
export function initMeasurement(currentTab) {
  if(!production()||isPrivatePage())return;
  if(settings.adsReady)script('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+publisher);
  if(!id)return;
  try{choice=localStorage.getItem(key);}catch{}
  const button=document.querySelector('#analytics-settings');
  const panel=document.querySelector('#analytics-panel');
  button.hidden=false;
  panel.hidden=choice==='granted'||choice==='denied';
  measurementLabels();
  button.addEventListener('click',()=>{panel.hidden=!panel.hidden;if(!panel.hidden)panel.querySelector('button').focus();});
  panel.addEventListener('click',event=>{
    const action=event.target.id;
    if(!['analytics-allow','analytics-decline'].includes(action))return;
    choice=action==='analytics-allow'?'granted':'denied';
    try{localStorage.setItem(key,choice);}catch{}
    window['ga-disable-'+id]=choice!=='granted';
    if(loaded)window.gtag('consent','update',choice==='granted'?accepted:defaults);
    if(choice==='granted'){lastPage=undefined;enableAnalytics();measurePage(currentTab());}
    else {
      for(const cookie of document.cookie.split(';').map(entry=>entry.split('=')[0].trim()).filter(name=>/^_ga(?:_|$)/.test(name))){
        document.cookie=cookie+'=; Max-Age=0; Path=/; Secure; SameSite=Lax';
        document.cookie=cookie+'=; Max-Age=0; Path=/; Domain='+location.hostname+'; Secure; SameSite=Lax';
      }
    }
    panel.hidden=true;
    button.focus();
  });
  enableAnalytics();measurePage(currentTab());
}
