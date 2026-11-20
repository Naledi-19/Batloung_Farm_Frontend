import { useState } from 'react';
import { Plus, Pencil, Eye, Trash2 } from 'lucide-react';
import LocationDetails from '../components/LocationDetails';
import LocationPicker from '../components/LocationPicker';
import { api, errorMessage } from '../services/api';
import { useRemote, Modal, Field, Notice, Table, SearchBox, PageHeader } from '../components/UI';
import { dateText } from '../utils/format';

const blank = { vendor_name:'', phone_number:'', location:'', latitude:null, longitude:null };

export default function Vendors() {
  const { data, loading, error, refresh } = useRemote('/vendors');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  function open(row) {
    setForm(row ? Object.fromEntries(Object.keys(blank).map(k => [k, row[k] ?? blank[k]])) : { ...blank });
    setEditing(row || 'new');
    setFailure('');
  }
  function changeCoordinates(latitude, longitude) {
    setForm(prev => ({ ...prev, latitude, longitude }));
  }
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setFailure('');
    try {
      if (editing === 'new') await api.post('/vendors', form);
      else await api.put(`/vendors/${editing.vendor_id}`, form);
      refresh();
      setEditing(null);
      setSuccess('Vendor and map location saved successfully.');
    } catch (err) {
      setFailure(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  async function remove(row) {
    if (!window.confirm(`Delete vendor "${row.vendor_name}"? This cannot be undone. Vendors with sales history cannot be deleted.`)) return;
    setDeleteError('');
    setSuccess('');
    setDeletingId(row.vendor_id);
    try {
      await api.delete(`/vendors/${row.vendor_id}`);
      if (viewing?.vendor_id === row.vendor_id) setViewing(null);
      refresh();
      setSuccess(`Vendor "${row.vendor_name}" deleted.`);
    } catch (err) {
      setDeleteError(errorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }
  const rows = (Array.isArray(data) ? data : []).filter(row =>
    [row.vendor_name, row.phone_number, row.location]
      .some(v => String(v || '').toLowerCase().includes(search.toLowerCase()))
  );

  return <>
    <PageHeader eyebrow="CUSTOMERS / VENDORS" title="Vendor management" description="Manage vendors and update their exact location when they move." action={<button className="primary-btn" onClick={() => open(null)}><Plus size={17}/> Add vendor</button>}/>
    <Notice type="success" onClose={() => setSuccess('')}>{success}</Notice>
    <Notice onClose={() => setDeleteError('')}>{deleteError}</Notice>
    <section className="panel">
      <div className="panel-head"><div><h2>Registered vendors</h2><p>{rows.length} vendor records</p></div><SearchBox value={search} onChange={setSearch} placeholder="Search vendors or phone..."/></div>
      <Table rows={rows} loading={loading} error={error} onRetry={refresh} columns={[
        {key:'vendor_name',label:'Vendor name'},
        {key:'phone_number',label:'Phone number'},
        {key:'location',label:'Location'},
        {key:'registration_date',label:'Registered',render:r=>dateText(r.registration_date)},
        {key:'action',label:'Action',render:r=><div className="actions">
          <button className="secondary-btn location-view-btn" title="View vendor and map pin" onClick={()=>setViewing(r)}><Eye size={16}/> View</button>
          <button className="icon-btn" title="Edit vendor and relocate pin" onClick={()=>open(r)}><Pencil size={17}/></button>
          <button className="icon-btn danger-text" type="button" title="Delete vendor" aria-label={`Delete ${r.vendor_name}`} disabled={deletingId !== null} onClick={()=>remove(r)}><Trash2 size={17}/></button>
        </div>}
      ]}/>
    </section>
    {viewing && <LocationDetails
      kind="vendor"
      record={viewing}
      onClose={()=>setViewing(null)}
      onEdit={()=>{const selected=viewing;setViewing(null);open(selected);}}
    />}
    {editing && <Modal wide title={editing==='new'?'Register vendor & select location':'Edit vendor & relocate pin'} onClose={()=>setEditing(null)}>
      <form className="form" onSubmit={save}>
        <Notice>{failure}</Notice>
        <Field label="Vendor name" required><input value={form.vendor_name} required maxLength={120} onChange={e=>setForm({...form,vendor_name:e.target.value})}/></Field>
        <Field label="Phone number" required><input value={form.phone_number} required maxLength={25} onChange={e=>setForm({...form,phone_number:e.target.value})}/></Field>
        <Field label="Location description" required><input value={form.location} required maxLength={150} onChange={e=>setForm({...form,location:e.target.value})}/></Field>
        <LocationPicker kind="vendor" latitude={form.latitude} longitude={form.longitude} onChange={changeCoordinates}/>
        <div className="modal-actions"><button type="button" className="secondary-btn" onClick={()=>setEditing(null)}>Cancel</button><button type="submit" className="primary-btn" disabled={busy}>{busy?'Saving...':'Save vendor & pin'}</button></div>
      </form>
    </Modal>}
  </>;
}
