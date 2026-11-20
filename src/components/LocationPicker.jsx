import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, RotateCcw, ExternalLink } from 'lucide-react';

const DEFAULT_CENTERS = {
  supplier: [-29.0, 25.0],
  vendor: [-29.61, 28.23]
};

const bounds = (lat, lng) => Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) &&
  lat !== null && lat !== '' && lng !== null && lng !== '';

/** Selects an exact geographic pin via map click or dragging. Coordinates are saved only by the parent form. */
export default function LocationPicker({ kind = 'vendor', latitude, longitude, onChange }) {
  const container = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const onChangeRef = useRef(onChange);
  const [notice, setNotice] = useState('');
  const selected = bounds(latitude, longitude);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    if (!container.current || map.current) return undefined;
    const haveCoordinates = bounds(latitude, longitude);
    const center = haveCoordinates
      ? [Number(latitude), Number(longitude)]
      : DEFAULT_CENTERS[kind];

    const instance = L.map(container.current, { scrollWheelZoom: false }).setView(center, haveCoordinates ? 15 : kind === 'supplier' ? 6 : 9);
    map.current = instance;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(instance);

    const updateMarker = (latlng) => {
      if (marker.current) {
        marker.current.setLatLng(latlng);
      } else {
        marker.current = L.marker(latlng, { draggable: true }).addTo(instance);
        marker.current.on('dragend', () => {
          const point = marker.current.getLatLng();
          onChangeRef.current(Number(point.lat.toFixed(7)), Number(point.lng.toFixed(7)));
        });
      }
      onChangeRef.current(Number(latlng.lat.toFixed(7)), Number(latlng.lng.toFixed(7)));
      setNotice('Pin selected. Save this form to keep the location.');
    };

    instance.on('click', (event) => updateMarker(event.latlng));
    if (haveCoordinates) updateMarker(L.latLng(Number(latitude), Number(longitude)));
    const resize = setTimeout(() => instance.invalidateSize(), 150);
    return () => {
      clearTimeout(resize);
      instance.remove();
      map.current = null;
      marker.current = null;
    };
    // initialize map once for this form. Parent keeps picker mounted for the editing session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!map.current) return;
    if (selected) {
      const point = L.latLng(Number(latitude), Number(longitude));
      if (marker.current) marker.current.setLatLng(point);
      map.current.setView(point, Math.max(map.current.getZoom(), 13));
    } else if (marker.current) {
      marker.current.remove();
      marker.current = null;
    }
  }, [latitude, longitude, selected]);

  function clearPin() {
    onChange(null, null);
    setNotice('Pin cleared. Select another point before saving.');
  }

  const googleUrl = selected
    ? `https://www.google.com/maps/search/?api=1&query=${Number(latitude)},${Number(longitude)}`
    : null;

  return (
    <div className="location-picker">
      <div className="location-picker-title">
        <strong><MapPin size={17}/> Choose exact location</strong>
        <span>Zoom in, click the map, or drag the blue marker to the correct business entrance.</span>
      </div>
      <div className="location-picker-map" ref={container} aria-label="Interactive map for selecting business location" />
      <div className="location-picker-footer">
        <div className="location-picker-coordinates">
          <span>Saved pin</span>
          <strong>{selected ? `${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(6)}` : 'No pin selected yet'}</strong>
        </div>
        <div className="location-picker-links">
          {googleUrl && <a href={googleUrl} target="_blank" rel="noreferrer"><ExternalLink size={15}/> Preview in Google Maps</a>}
          <button type="button" className="secondary-btn" onClick={clearPin} disabled={!selected}><RotateCcw size={15}/> Clear pin</button>
        </div>
      </div>
      {notice && <small className="location-picker-notice">{notice}</small>}
      <small className="location-picker-note">The map uses OpenStreetMap to select the coordinates. The saved pin is displayed in Google Maps when you click View.</small>
    </div>
  );
}
