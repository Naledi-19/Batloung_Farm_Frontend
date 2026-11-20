export const money = (value) => 'M ' + Number(value || 0).toLocaleString('en-LS', {minimumFractionDigits:2, maximumFractionDigits:2});
export const qty = (value) => Number(value || 0).toLocaleString('en-LS');
export function dateText(value) { if(!value)return '—'; const d=new Date(value); return Number.isNaN(d.getTime())?String(value).slice(0,10):d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); }
export const today = () => new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
export const firstOfMonth = () => today().slice(0,8)+'01';
export const provinces = ['Gauteng','Free State','KwaZulu-Natal','Western Cape','Eastern Cape','Limpopo','Mpumalanga','North West'];
export const packs = ['SMALL','MEDIUM','LARGE'];
