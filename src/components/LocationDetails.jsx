import { useState } from 'react';
import { ExternalLink, MapPin, Navigation, Pencil, Route, LocateFixed } from 'lucide-react';
import { Modal } from './UI';
import { dateText } from '../utils/format';

const DEFAULT_ORIGIN = 'Maseru, Lesotho';
const GOOGLE_EMBED_KEY = import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY || '';

function Detail({ label, value }) {
  return <div className="location-detail-field"><span>{label}</span><strong>{value || 'Not provided'}</strong></div>;
}
function hasPin(record) {
  return record.latitude !== null && record.latitude !== undefined && record.latitude !== '' &&
    record.longitude !== null && record.longitude !== undefined && record.longitude !== '' &&
    Number.isFinite(Number(record.latitude)) && Number.isFinite(Number(record.longitude)) &&
    Math.abs(Number(record.latitude)) <= 90 && Math.abs(Number(record.longitude)) <= 180;
}
function coordinates(record) {
  return `${Number(record.latitude)},${Number(record.longitude)}`;
}
function routeUrl(destination, origin, travelmode, currentLocation = false) {
  const params = new URLSearchParams({ api: '1', destination, travelmode });
  if (!currentLocation) params.set('origin', origin);
  if (currentLocation) params.set('dir_action', 'navigate');
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export default function LocationDetails({ kind, record, onClose, onEdit }) {
  const [tab, setTab] = useState('route');
  const [origin, setOrigin] = useState(DEFAULT_ORIGIN);
  const [travelmode, setTravelmode] = useState('driving');
  const supplier = kind === 'supplier';
  const name = supplier ? record.business_name : record.vendor_name;
  const address = supplier
    ? [record.address, record.province, 'South Africa'].filter(Boolean).join(', ')
    : [record.location, 'Lesotho'].filter(Boolean).join(', ');
  const selected = hasPin(record);
  // Never use the viewer's location as a substitute for a missing saved destination pin.
  const destination = selected ? coordinates(record) : address;
  const query = encodeURIComponent(destination);
  const locationLink = `https://www.google.com/maps/search/?api=1&query=${query}`;
  const directionsLink = routeUrl(destination, origin.trim() || DEFAULT_ORIGIN, travelmode);
  const currentLocationLink = routeUrl(destination, '', travelmode, true);
  const mapEmbed = `https://maps.google.com/maps?q=${query}&z=17&output=embed`;

  // The official Google Maps Embed API has documented support for routing,
  // but it requires a valid Maps Embed API key. The older keyless directions
  // embed is a best-effort fallback; it may be blocked or show only a map.
  const routeEmbed = GOOGLE_EMBED_KEY
    ? `https://www.google.com/maps/embed/v1/directions?${new URLSearchParams({
        key: GOOGLE_EMBED_KEY,
        origin: origin.trim() || DEFAULT_ORIGIN,
        destination,
        mode: travelmode
      }).toString()}`
    : `https://maps.google.com/maps?${new URLSearchParams({
        saddr: origin.trim() || DEFAULT_ORIGIN,
        daddr: destination,
        dirflg: travelmode === 'walking' ? 'w' : 'd',
        output: 'embed'
      }).toString()}`;

  return <Modal title={`${supplier ? 'Supplier' : 'Vendor'} details — ${name}`} wide onClose={onClose}>
    <div className="location-modal-body">
      <div className="location-detail-grid">
        {supplier ? <>
          <Detail label="Business name" value={record.business_name}/>
          <Detail label="Contact person" value={record.contact_person}/>
          <Detail label="Phone number" value={record.phone}/>
          <Detail label="Province" value={record.province}/>
          <div className="location-detail-wide"><Detail label="Business address" value={record.address}/></div>
        </> : <>
          <Detail label="Vendor name" value={record.vendor_name}/>
          <Detail label="Phone number" value={record.phone_number}/>
          <Detail label="Registration date" value={dateText(record.registration_date)}/>
          <div className="location-detail-wide"><Detail label="Vendor location" value={record.location}/></div>
        </>}
        <div className="location-detail-wide"><Detail label="GPS coordinates" value={selected ? `${Number(record.latitude).toFixed(7)}, ${Number(record.longitude).toFixed(7)}` : 'No exact pin saved'}/></div>
      </div>

      <div className="location-route-tabs" role="tablist" aria-label="Map display">
        <button type="button" role="tab" aria-selected={tab === 'route'} className={tab === 'route' ? 'selected' : ''} onClick={() => setTab('route')}><Route size={17}/> Route from us</button>
        <button type="button" role="tab" aria-selected={tab === 'location'} className={tab === 'location' ? 'selected' : ''} onClick={() => setTab('location')}><MapPin size={17}/> {supplier ? 'Supplier' : 'Vendor'} location</button>
      </div>

      {tab === 'route' ? <>
        <div className="location-route-summary">
          <div><strong>From:</strong> {origin.trim() || DEFAULT_ORIGIN}</div>
          <div><strong>To:</strong> {selected ? `${name} (saved pin: ${destination})` : `${address} (approximate address)`}</div>
        </div>
        <div className="location-route-controls">
          <label className="location-route-origin">Starting point
            <input type="text" value={origin} onChange={e => setOrigin(e.target.value)} placeholder="Maseru, Lesotho" aria-label="Route starting point"/>
          </label>
          <label className="location-route-travel">Travel mode
            <select value={travelmode} onChange={e => setTravelmode(e.target.value)} aria-label="Travel mode">
              <option value="driving">Driving</option>
              <option value="walking">Walking</option>
            </select>
          </label>
        </div>
        <div className="location-map-frame" key={`${tab}-${origin}-${travelmode}-${destination}`}>
          <iframe title={`Route to ${name}`} src={routeEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/>
        </div>
        <div className="location-route-actions">
          <a className="location-maps-external" href={directionsLink} target="_blank" rel="noopener noreferrer"><Navigation size={16}/> Open route in Google Maps <ExternalLink size={15}/></a>
          <a className="secondary-btn" href={currentLocationLink} target="_blank" rel="noopener noreferrer"><LocateFixed size={16}/> Directions from my location</a>
        </div>
        <p className="location-route-disclaimer">Google Maps calculates available roads, alternative routes and travel times. If the embedded directions do not appear, use “Open route in Google Maps”. Current-location routing requires location permission in Google Maps.</p>
      </> : <>
        <div className="location-map-head">
          <div><h3><MapPin size={19}/> Location on Google Maps</h3><p>{selected ? 'Showing the exact saved business pin' : 'Approximate address search — choose a pin using Edit'}</p></div>
          <a className="location-maps-external" href={locationLink} target="_blank" rel="noopener noreferrer">Open in Google Maps <ExternalLink size={16}/></a>
        </div>
        <div className="location-map-frame"><iframe title={`Google Map for ${name}`} src={mapEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/></div>
      </>}

      <div className="location-detail-footer">
        <p className="location-map-note"><Navigation size={14}/>{selected ? 'Route destination is the exact pin saved for this business.' : 'No exact pin saved yet. Route uses the written address and may be inaccurate.'}</p>
        {onEdit && <button type="button" className="secondary-btn" onClick={onEdit}><Pencil size={16}/> Edit location</button>}
      </div>
    </div>
  </Modal>;
}
