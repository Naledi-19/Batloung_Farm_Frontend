import { useState } from 'react';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import LocationDetails from '../components/LocationDetails';
import LocationPicker from '../components/LocationPicker';
import { api, errorMessage } from '../services/api';
import { useRemote, Modal, Field, Notice, Table, SearchBox, PageHeader } from '../components/UI';
import { provinces } from '../utils/format';

const blank = {
  business_name: '', contact_person: '', phone: '', province: 'Gauteng',
  address: '', latitude: null, longitude: null
};

export default function Suppliers() {
  const { data, loading, error, refresh } = useRemote('/suppliers');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [failure, setFailure] = useState('');

  function open(row) {
    setForm(row ? Object.fromEntries(Object.keys(blank).map(k => [k, row[k] ?? blank[k]])) : { ...blank });
    setEditing(row || 'new');
    setFailure('');
  }
  function change(event) {
    setForm(prev => ({ ...prev, [event.target.name]: event.target.value }));
  }
  function changeCoordinates(latitude, longitude) {
    setForm(prev => ({ ...prev, latitude, longitude }));
  }
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setFailure('');
    try {
      if (editing === 'new') await api.post('/suppliers', form);
      else await api.put(`/suppliers/${editing.supplier_id}`, form);
      setEditing(null);
      refresh();
      setMsg('Supplier and map location saved successfully.');
    } catch (err) {
      setFailure(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  async function remove(row) {
    if (!window.confirm(`Delete ${row.business_name}? Suppliers with purchase history cannot be deleted.`)) return;
    try {
      await api.delete(`/suppliers/${row.supplier_id}`);
      refresh();
      setMsg('Supplier deleted.');
    } catch (err) {
      setMsg(errorMessage(err));
    }
  }

  const rows = (Array.isArray(data) ? data : []).filter(row =>
    [row.business_name, row.contact_person, row.phone, row.province, row.address]
      .some(v => String(v || '').toLowerCase().includes(search.toLowerCase()))
  );

  return <>
    <PageHeader
      eyebrow="PARTNERS / SUPPLIERS"
      title="Supplier management"
      description="Manage suppliers and save precise business locations."
      action={<button className="primary-btn" onClick={() => open(null)}><Plus size={17}/> Add supplier</button>}
    />
    <Notice type="success" onClose={() => setMsg('')}>{msg}</Notice>
    <section className="panel">
      <div className="panel-head">
        <div><h2>Registered suppliers</h2><p>{rows.length} supplier records</p></div>
        <SearchBox value={search} onChange={setSearch} placeholder="Search suppliers..." />
      </div>
      <Table loading={loading} error={error} onRetry={refresh} rows={rows} columns={[
        {key:'business_name',label:'Business name'},
        {key:'contact_person',label:'Contact person'},
        {key:'phone',label:'Phone'},
        {key:'province',label:'Province'},
        {key:'address',label:'Address'},
        {key:'actions',label:'Actions',render: row => <div className="actions">
          <button className="secondary-btn location-view-btn" title="View supplier details and Google Map" onClick={() => setViewing(row)}><Eye size={16}/> View</button>
          <button className="icon-btn" title="Edit supplier and map pin" onClick={() => open(row)}><Pencil size={17}/></button>
          <button className="icon-btn danger-text" title="Delete" onClick={() => remove(row)}><Trash2 size={17}/></button>
        </div>}
      ]}/>
    </section>

    {viewing && <LocationDetails
      kind="supplier"
      record={viewing}
      onClose={() => setViewing(null)}
      onEdit={() => { const selected = viewing; setViewing(null); open(selected); }}
    />}

    {editing && <Modal wide title={editing === 'new' ? 'Register supplier & select location' : 'Edit supplier & relocate pin'} onClose={() => setEditing(null)}>
      <form onSubmit={save} className="form">
        <Notice>{failure}</Notice>
        <Field label="Business name" required><input name="business_name" required maxLength={120} value={form.business_name} onChange={change}/></Field>
        <Field label="Contact person" required><input name="contact_person" required maxLength={100} value={form.contact_person} onChange={change}/></Field>
        <div className="form-grid">
          <Field label="Phone" required><input name="phone" required maxLength={25} value={form.phone} onChange={change}/></Field>
          <Field label="Province" required><select name="province" value={form.province} onChange={change}>{provinces.map(x => <option key={x}>{x}</option>)}</select></Field>
        </div>
        <Field label="Address" required><textarea name="address" rows={2} maxLength={255} required value={form.address} onChange={change}/></Field>
        <LocationPicker
          kind="supplier"
          latitude={form.latitude}
          longitude={form.longitude}
          onChange={changeCoordinates}
        />
        <div className="modal-actions">
          <button type="button" className="secondary-btn" onClick={() => setEditing(null)}>Cancel</button>
          <button type="submit" className="primary-btn" disabled={busy}>{busy ? 'Saving...' : 'Save supplier & pin'}</button>
        </div>
      </form>
    </Modal>}
  </>;
}
