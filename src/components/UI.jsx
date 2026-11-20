import {useEffect,useState} from 'react';
import {api,errorMessage} from '../services/api';
import {AlertCircle, CheckCircle2, X, Search, LoaderCircle, Inbox} from 'lucide-react';
export function useRemote(path, deps=[]) {
 const [data,setData]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [version,setVersion]=useState(0);
 useEffect(()=>{let active=true;setLoading(true);setError('');api.get(path).then(({data})=>{if(active)setData(data)}).catch(e=>{if(active)setError(errorMessage(e))}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[path,version,...deps]);
 return {data,loading,error,refresh:()=>setVersion(v=>v+1)};
}
export function Notice({type='error',children,onClose}) {return children?<div className={'notice '+type}>{type==='success'?<CheckCircle2 size={17}/>:<AlertCircle size={17}/>}<span>{children}</span>{onClose&&<button className="icon-btn" onClick={onClose} aria-label="Dismiss"><X size={16}/></button>}</div>:null}
export function Loading(){return <div className="loading"><LoaderCircle className="spin" size={24}/> Loading records...</div>}
export function Empty({message='No records found'}){return <div className="empty"><Inbox size={28}/><p>{message}</p></div>}
export function Modal({title,children,onClose,wide=false}){useEffect(()=>{const f=e=>{if(e.key==='Escape')onClose()};window.addEventListener('keydown',f);return()=>window.removeEventListener('keydown',f)},[onClose]);return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className={'modal '+(wide?'modal-wide':'')} role="dialog" aria-modal="true" aria-label={title}><div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={20}/></button></div>{children}</div></div>}
export function Field({label,required=false,children,help}) {return <label className="field"><span>{label}{required&&<b className="required"> *</b>}</span>{children}{help&&<small>{help}</small>}</label>}
export function Status({value}) {let v=String(value||'').toUpperCase();return <span className={'pill '+(v==='AVAILABLE'||v==='ACTIVE'||v==='PAID'?'good':v==='OUT_OF_STOCK'||v==='UNPAID'||v==='INACTIVE'?'bad':'warn')}>{v.replaceAll('_',' ')||'—'}</span>}
export function Table({columns,rows,loading,error,empty='No records found',onRetry}) {if(loading)return <Loading/>;if(error)return <Notice>{error} {onRetry&&<button className="text-btn" onClick={onRetry}>Retry</button>}</Notice>;if(!Array.isArray(rows)||!rows.length)return <Empty message={empty}/>;return <div className="table-wrap"><table><thead><tr>{columns.map(c=><th key={c.key}>{c.label}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={row.id||row.supplier_id||row.vendor_id||row.fruit_id||row.purchase_id||row.sale_id||row.stock_id||i}>{columns.map(c=><td key={c.key}>{c.render?c.render(row):row[c.key]??'—'}</td>)}</tr>)}</tbody></table></div>}
export function SearchBox({value,onChange,placeholder='Search records...'}){return <div className="search-box"><Search size={18}/><input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></div>}
export function PageHeader({eyebrow,title,description,action}){return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>}
export function submitError(e,setError){setError(errorMessage(e))}
