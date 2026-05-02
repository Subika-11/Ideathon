import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MapPin, Wifi, WifiOff, Clock, Phone, ChevronRight,
  Navigation2, Shield, X, Car, Bus, PersonStanding,
  ExternalLink, Route, Download,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// ─── Types ────────────────────────────────────────────────────────────────────

interface KioskLocation {
  id: string;
  name: string;
  shortName: string;
  lat: number;
  lng: number;
  district: 'Coimbatore' | 'Tirupur';
  taluk: string;
  address: string;
  phone: string;
  hours: string;
  services: string[];
  active: boolean;
}

// ─── Static Kiosk Data ────────────────────────────────────────────────────────
// Coordinates verified from official NIC / dcourts / OSM sources (see inline).

const KIOSK_DATA: KioskLocation[] = [
  // ── Coimbatore ──────────────────────────────────────────────────────────────
  {
    id: 'CBE-001',
    name: 'Coimbatore Collectorate Legal Aid Kiosk',
    shortName: 'Coimbatore HQ',
    lat: 11.0048, lng: 76.9628,
    district: 'Coimbatore', taluk: 'Coimbatore North',
    address: 'Collectorate Building, 7/1 State Bank Rd, Gopalapuram, Coimbatore – 641018',
    phone: '0422-2301114',
    hours: '10:00 AM – 5:30 PM (Mon–Fri)',
    services: ['DLSA', 'Legal Aid', 'Notary', 'Document Help', 'Case Tracking'],
    active: true,
  },
  {
    id: 'CBE-002',
    name: 'Pollachi Taluk Office Legal Access Point',
    shortName: 'Pollachi',
    lat: 10.6605, lng: 77.0072,
    district: 'Coimbatore', taluk: 'Pollachi',
    address: 'Taluk Office Complex, Dindigul–Bangalore Road, Pollachi – 642001',
    phone: '04259-226625',
    hours: '10:00 AM – 6:00 PM (Mon–Fri)',
    services: ['Legal Aid', 'Document Help', 'Case Tracking'],
    active: true,
  },
  {
    id: 'CBE-003',
    name: 'Mettupalayam Taluk Office Legal Kiosk',
    shortName: 'Mettupalayam',
    lat: 11.3105, lng: 76.9490,
    district: 'Coimbatore', taluk: 'Mettupalayam',
    address: 'No. 542/2, Sirumugai Road, Mettupalayam – 641301',
    phone: '04254-222153',
    hours: '10:00 AM – 6:00 PM (Mon–Fri)',
    services: ['Legal Aid', 'Document Help'],
    active: true,
  },
  {
    id: 'CBE-004',
    name: 'Sulur Taluk Office Legal Access Point',
    shortName: 'Sulur',
    lat: 11.0228, lng: 77.1336,
    district: 'Coimbatore', taluk: 'Sulur',
    address: 'Taluk Office, Sulur – 641402',
    phone: '9445000574',
    hours: '10:00 AM – 5:30 PM (Mon–Fri)',
    services: ['Legal Aid', 'Case Tracking'],
    active: true,
  },
  {
    id: 'CBE-005',
    name: 'Annur Taluk Office Legal Kiosk',
    shortName: 'Annur',
    lat: 11.2297, lng: 77.1285,
    district: 'Coimbatore', taluk: 'Annur',
    address: 'Taluk Office, Annur – 641653',
    phone: '9445461896',
    hours: '10:00 AM – 5:00 PM (Mon–Fri)',
    services: ['Document Help', 'Legal Aid'],
    active: true,
  },
  {
    id: 'CBE-006',
    name: 'Kinathukadavu Taluk Office Legal Kiosk',
    shortName: 'Kinathukadavu',
    lat: 10.7792, lng: 76.9438,
    district: 'Coimbatore', taluk: 'Pollachi',
    address: 'Taluk Office, Periyar Nagar, Kinathukadavu – 642109',
    phone: '9384094777',
    hours: '10:00 AM – 5:00 PM (Mon–Fri)',
    services: ['Legal Aid', 'Document Help'],
    active: false,
  },

  // ── Tirupur ──────────────────────────────────────────────────────────────────
  {
    id: 'TPR-001',
    name: 'Tirupur District Court Legal Aid Kiosk',
    shortName: 'Tirupur HQ',
    lat: 11.1077, lng: 77.3404,
    district: 'Tirupur', taluk: 'Tirupur',
    address: 'Combined Court Campus, Palladam Road (behind Collectorate), Tirupur – 641604',
    phone: '0421-2230122',
    hours: '10:00 AM – 5:00 PM (Mon–Sat)',
    services: ['DLSA', 'Legal Aid', 'Notary', 'Document Help', 'Case Tracking'],
    active: true,
  },
  {
    id: 'TPR-002',
    name: 'Udumalpet Taluk Office Legal Access Point',
    shortName: 'Udumalpet',
    lat: 10.5858, lng: 77.2506,
    district: 'Tirupur', taluk: 'Udumalpet',
    address: 'Taluk Office Complex, Udumalpet – 642126',
    phone: '04252-223857',
    hours: '10:00 AM – 5:30 PM (Mon–Fri)',
    services: ['Legal Aid', 'Document Help', 'Case Tracking'],
    active: true,
  },
  {
    id: 'TPR-003',
    name: 'Dharapuram Sub Court Legal Kiosk',
    shortName: 'Dharapuram',
    lat: 10.7325, lng: 77.5134,
    district: 'Tirupur', taluk: 'Dharapuram',
    address: 'Sub Court Complex, Dharapuram – 638656',
    phone: '04258-222153',
    hours: '10:00 AM – 5:00 PM (Mon–Fri)',
    services: ['Legal Aid', 'Document Help'],
    active: true,
  },
  {
    id: 'TPR-004',
    name: 'Palladam Combined Court Legal Access Point',
    shortName: 'Palladam',
    lat: 10.9843, lng: 77.2998,
    district: 'Tirupur', taluk: 'Palladam',
    address: 'Combined Court Complex, Palladam – 641664',
    phone: '04255-222153',
    hours: '10:00 AM – 5:00 PM (Mon–Fri)',
    services: ['Legal Aid', 'Case Tracking'],
    active: true,
  },
  {
    id: 'TPR-005',
    name: 'Kangeyam Combined Court Legal Kiosk',
    shortName: 'Kangeyam',
    lat: 11.0058, lng: 77.5618,
    district: 'Tirupur', taluk: 'Kangeyam',
    address: 'Combined Court Complex, Kangeyam – 638701',
    phone: '04257-222153',
    hours: '10:00 AM – 5:00 PM (Mon–Fri)',
    services: ['Document Help', 'Legal Aid'],
    active: true,
  },
  {
    id: 'TPR-006',
    name: 'Avinashi Court Complex Legal Kiosk',
    shortName: 'Avinashi',
    lat: 11.1944, lng: 77.2679,
    district: 'Tirupur', taluk: 'Avinashi',
    address: 'Court Complex, Avinashi – 641654',
    phone: '04296-273237',
    hours: '10:00 AM – 5:00 PM (Mon–Fri)',
    services: ['Legal Aid', 'Document Help', 'Case Tracking'],
    active: true,
  },
];

// ─── Haversine distance (km) ──────────────────────────────────────────────────

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Navigation helpers ───────────────────────────────────────────────────────

type TravelMode = 'driving' | 'transit' | 'walking';

function openGoogleMapsDirections(
  from: KioskLocation,
  to: KioskLocation,
  mode: TravelMode,
) {
  const url =
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${from.lat},${from.lng}` +
    `&destination=${to.lat},${to.lng}` +
    `&travelmode=${mode}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function estimateTravelTime(distanceKm: number, mode: TravelMode): string {
  const speeds: Record<TravelMode, number> = { driving: 35, transit: 25, walking: 4.5 };
  const minutes = Math.round((distanceKm * 1.35 / speeds[mode]) * 60);
  if (minutes < 60) return `~${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Page =
  | 'landing' | 'login' | 'home' | 'kiosk' | 'locate'
  | 'features' | 'tracking' | 'impact' | 'case' | 'chatbot' | 'reminders';

interface LocateKioskProps {
  onNavigate?: (page: Page, state?: Record<string, any>) => void;
}

// ─── Kiosk ID resolution ──────────────────────────────────────────────────────

function resolveCurrentKioskId(): string | null {
  if (typeof window !== 'undefined') {
    const urlId = new URLSearchParams(window.location.search).get('kiosk');
    if (urlId && KIOSK_DATA.find(k => k.id === urlId)) return urlId;
  }
  const envId = (import.meta as any)?.env?.VITE_KIOSK_ID;
  if (envId && KIOSK_DATA.find(k => k.id === envId)) return envId;
  return null;
}

// ─── Offline download areas ───────────────────────────────────────────────────

const OFFLINE_AREAS = [
  {
    label: 'Coimbatore district',
    url: 'https://maps.google.com/?ll=11.0048,76.9628&z=11',
    size: '~280 MB',
  },
  {
    label: 'Tirupur district',
    url: 'https://maps.google.com/?ll=11.1077,77.3404&z=11',
    size: '~190 MB',
  },
];

// ─── Map provider selection ────────────────────────────────────────────────────
// Google Maps Embed requires a valid API key restricted to the Maps Embed API.
// If VITE_GOOGLE_MAPS_API_KEY is not set we use OpenStreetMap's free embed
// endpoint instead — no key, no quota, no 403.
//
// To enable Google Maps:
//   1. Create a key at https://console.cloud.google.com/
//   2. Enable "Maps Embed API" on it
//   3. Add to .env.local:  VITE_GOOGLE_MAPS_API_KEY=AIzaSy...
//
// The demo key ('AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY') is intentionally
// NOT used as a fallback — it is domain-restricted and 403s on localhost.

const _RAW_KEY = (import.meta as any)?.env?.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

// Non-null only when a real key is explicitly provided
const GOOGLE_MAPS_KEY: string | null =
  _RAW_KEY && _RAW_KEY !== 'YOUR_API_KEY_HERE'
    ? _RAW_KEY
    : null;

/**
 * Builds the iframe src.
 * - Google Maps Embed: full directions when destination set, place pin otherwise.
 * - OSM fallback: bbox-centred marker at the focal kiosk (no directions support;
 *   users tap "Get Directions" to open Google Maps in a new tab).
 */
function buildMapSrc(current: KioskLocation, destination?: KioskLocation): string {
  if (GOOGLE_MAPS_KEY) {
    if (destination) {
      return (
        `https://www.google.com/maps/embed/v1/directions` +
        `?key=${GOOGLE_MAPS_KEY}` +
        `&origin=${current.lat},${current.lng}` +
        `&destination=${destination.lat},${destination.lng}` +
        `&mode=driving&zoom=12`
      );
    }
    return (
      `https://www.google.com/maps/embed/v1/place` +
      `?key=${GOOGLE_MAPS_KEY}` +
      `&q=${current.lat},${current.lng}` +
      `&zoom=16`
    );
  }

  // ── OpenStreetMap fallback (no key required) ──────────────────────────────
  const focal = destination ?? current;
  const delta = destination ? 0.06 : 0.012;
  const bbox = `${focal.lng - delta},${focal.lat - delta},${focal.lng + delta},${focal.lat + delta}`;
  return (
    `https://www.openstreetmap.org/export/embed.html` +
    `?bbox=${bbox}` +
    `&layer=mapnik` +
    `&marker=${focal.lat},${focal.lng}`
  );
}

// ─── KioskMap Component ───────────────────────────────────────────────────────

function MapBounds({ currentKiosk, selectedKiosk }: any) {
  const map = useMap();
  useEffect(() => {
    if (selectedKiosk) {
      const bounds = L.latLngBounds(
        [currentKiosk.lat, currentKiosk.lng],
        [selectedKiosk.lat, selectedKiosk.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    } else {
      map.setView([currentKiosk.lat, currentKiosk.lng], 10);
    }
  }, [map, currentKiosk, selectedKiosk]);
  return null;
}

function KioskMap({
  currentKiosk,
  selectedKiosk,
  onSelectKiosk,
  isOnline,
}: {
  currentKiosk: KioskLocation;
  selectedKiosk: KioskLocation | null;
  onSelectKiosk: (k: KioskLocation) => void;
  isOnline: boolean;
}) {
  const createIcon = (k: KioskLocation) => {
    const isSelected = selectedKiosk?.id === k.id;
    const isCurrent = currentKiosk.id === k.id;
    
    let color = "#38bdf8"; // sky-400
    let scale = "scale(1)";
    let zIndex = 1;

    if (isCurrent) {
        color = "#fbbf24"; // amber-400
        scale = "scale(1.1)";
        zIndex = 10;
    }
    if (isSelected) {
        color = "#10b981"; // emerald-400
        scale = "scale(1.3)";
        zIndex = 100;
    }

    const html = `
      <div class="relative transition-all duration-300" style="transform: ${scale}; z-index: ${zIndex};">
        <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <path d="M16 42C16 42 32 28.3265 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 28.3265 16 42 16 42Z" fill="${color}"/>
          <circle cx="16" cy="16" r="6" fill="white"/>
        </svg>
        ${isCurrent ? '<div class="absolute -inset-1 rounded-full bg-amber-400/20 animate-ping"></div>' : ''}
      </div>
    `;
    
    return L.divIcon({
      html,
      className: 'bg-transparent',
      iconSize: [32, 42],
      iconAnchor: [16, 42]
    });
  };

  const center = [currentKiosk.lat, currentKiosk.lng] as [number, number];

  return (
    <div className="w-full">
      {/* ── HEADER ── */}
      <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex justify-between">
        <span className="text-xs font-black text-white uppercase">
          {isOnline ? 'Online District Map' : 'Offline District Map'}
        </span>
        <span className="text-[10px] text-slate-500">
          Coimbatore · Tirupur
        </span>
      </div>

      {/* ── MAP CONTAINER ── */}
      <div className="relative w-full" style={{ paddingBottom: '62%' }}>
        <div className="absolute inset-0">
          <MapContainer 
              center={center} 
              zoom={10} 
              style={{ width: '100%', height: '100%', background: '#0f172a' }}
              zoomControl={false}
          >
              <TileLayer
                  url={isOnline ? "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" : "/tiles/{z}/{x}/{y}.png"}
                  attribution='&copy; Google Maps'
                  minZoom={3}
                  maxZoom={20}
              />
              <ZoomControl position="bottomright" />
              <MapBounds currentKiosk={currentKiosk} selectedKiosk={selectedKiosk} />
              
              {KIOSK_DATA.filter(k => k.active).map(k => (
                  <Marker 
                      key={k.id} 
                      position={[k.lat, k.lng]}
                      icon={createIcon(k)}
                      eventHandlers={{
                          click: () => onSelectKiosk(k)
                      }}
                  />
              ))}

              {selectedKiosk && (
                  <Polyline 
                      positions={[
                          [currentKiosk.lat, currentKiosk.lng],
                          [selectedKiosk.lat, selectedKiosk.lng]
                      ]}
                      color="#10b981"
                      weight={5}
                      opacity={0.8}
                      lineCap="round"
                      dashArray="1, 12"
                  />
              )}
          </MapContainer>
        </div>

        {/* 🏷️ Label */}
        <div className="absolute bottom-4 left-4 z-[400] pointer-events-none">
          <div className="text-[10px] bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg text-white border border-slate-800 shadow-xl font-black uppercase tracking-widest">
            Tap a kiosk
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="px-4 py-2 text-[10px] text-slate-500 border-t border-slate-800">
        Interactive map powered by Leaflet
      </div>
    </div>
  );
}

// ─── NavigationPanel Component ────────────────────────────────────────────────

function NavigationPanel({
  from,
  to,
  distanceKm,
}: {
  from: KioskLocation;
  to: KioskLocation;
  distanceKm: number;
}) {
  const [mode, setMode] = useState<TravelMode>('driving');

  const modes: { key: TravelMode; label: string; Icon: React.ElementType }[] = [
    { key: 'driving', label: 'Drive', Icon: Car },
    { key: 'transit', label: 'Transit', Icon: Bus },
    { key: 'walking', label: 'Walk', Icon: PersonStanding },
  ];

  return (
    <div
      className="overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Route summary bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
        <Route className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black truncate">
            {from.shortName}
            <span className="mx-1.5 text-slate-600">→</span>
            {to.shortName}
          </p>
        </div>
        <span className="text-[10px] font-black text-slate-400 shrink-0">
          {distanceKm.toFixed(1)} km
        </span>
      </div>

      {/* Travel mode tabs */}
      <div className="flex border-b border-slate-800">
        {modes.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[9px] font-black uppercase tracking-widest transition-colors ${mode === key
              ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5'
              : 'text-slate-500 hover:text-slate-300 border-b-2 border-transparent'
              }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ETA + directions CTA */}
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        <div>
          <p className="text-lg font-black text-white leading-none">
            {estimateTravelTime(distanceKm, mode)}
          </p>
          <p className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-widest">
            estimated · {mode}
          </p>
        </div>
        <button
          onClick={() => openGoogleMapsDirections(from, to, mode)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest text-white shrink-0"
        >
          <Navigation2 className="w-3.5 h-3.5" />
          Get Directions
          <ExternalLink className="w-3 h-3 opacity-70" />
        </button>
      </div>

      {/* Origin / destination address lines */}
      <div className="px-4 pb-3 space-y-1.5">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          <p className="text-[9px] text-slate-500 leading-tight">{from.address}</p>
        </div>
        <div className="ml-1 w-px h-3 bg-slate-700" />
        <div className="flex items-start gap-2">
          <span className="mt-0.5 w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <p className="text-[9px] text-slate-500 leading-tight">{to.address}</p>
        </div>
      </div>

      <div className="px-4 pb-3">
        <p className="text-[8px] text-slate-700 italic">
          Opens Google Maps · requires internet connection
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LocateKiosk({ onNavigate }: LocateKioskProps) {
  const { t } = useTranslation();

  const resolvedId = resolveCurrentKioskId();
  const [currentKioskId, setCurrentKioskId] = useState<string>(resolvedId || 'CBE-001');
  const [selectedKiosk, setSelectedKiosk] = useState<KioskLocation | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSelector] = useState(!resolvedId);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const currentKiosk = useMemo(
    () => KIOSK_DATA.find(k => k.id === currentKioskId) || KIOSK_DATA[0],
    [currentKioskId],
  );

  const nearbyKiosks = useMemo(() =>
    KIOSK_DATA
      .filter(k => k.id !== currentKioskId && k.active)
      .map(k => ({
        ...k,
        distanceKm: haversine(currentKiosk.lat, currentKiosk.lng, k.lat, k.lng),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 5),
    [currentKiosk, currentKioskId],
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-mono p-4 md:p-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {onNavigate && (
                <button
                  onClick={() => onNavigate('home')}
                  className="mr-1 p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title="Back to Home"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
                {t('map.pilot')}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
              {t('map.nearby_title')}
            </h1>
            <p className="text-slate-400 text-xs mt-1 tracking-wide">
              {t('map.nearby_sub')}
            </p>
          </div>

          {/* Online / offline indicator */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest ${isOnline
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-amber-500/10  border-amber-500/30  text-amber-400'
            }`}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {isOnline ? t('map.online') : t('map.offline_mode')}
          </div>
        </div>

        {/* Current kiosk identity bar */}
        <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-[9px] text-amber-400 uppercase tracking-widest font-black">{t('map.this_kiosk')}</p>
              <p className="text-sm font-black text-white">{currentKiosk.shortName}</p>
              <p className="text-[10px] text-slate-400">{currentKiosk.id} · {currentKiosk.district}</p>
            </div>
          </div>
          {/* Dev/demo selector — hidden in production when VITE_KIOSK_ID is set */}
          {showSelector && (
            <select
              value={currentKioskId}
              onChange={e => { setCurrentKioskId(e.target.value); setSelectedKiosk(null); }}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-emerald-500"
            >
              <optgroup label="Coimbatore District">
                {KIOSK_DATA.filter(k => k.district === 'Coimbatore').map(k => (
                  <option key={k.id} value={k.id}>{k.shortName} ({k.id})</option>
                ))}
              </optgroup>
              <optgroup label="Tirupur District">
                {KIOSK_DATA.filter(k => k.district === 'Tirupur').map(k => (
                  <option key={k.id} value={k.id}>{k.shortName} ({k.id})</option>
                ))}
              </optgroup>
            </select>
          )}
        </div>
      </div>

      {/* ── Main layout ─────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 auto-rows-max">

        {/* Left — Google Maps embed */}
        <div className="w-full space-y-4">
          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {t('map.district_map_title')}
              </span>
              <span className="text-[9px] text-slate-600 font-mono">
                {KIOSK_DATA.filter(k => k.active).length} {t('map.active_kiosks')}
              </span>
            </div>

            <KioskMap
              currentKiosk={currentKiosk}
              selectedKiosk={selectedKiosk}
              onSelectKiosk={setSelectedKiosk}
              isOnline={isOnline}
            />
          </div>

          {/* Selected kiosk detail card */}
          {selectedKiosk && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 relative">
              <button
                onClick={() => setSelectedKiosk(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mb-1">
                {t('map.selected_kiosk')}
              </p>
              <h3 className="font-black text-white text-base mb-3">{selectedKiosk.name}</h3>
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" />
                  <span>{selectedKiosk.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                  <span>{selectedKiosk.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                  <span>{selectedKiosk.hours}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Navigation2 className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" />
                  <span>
                    {haversine(
                      currentKiosk.lat, currentKiosk.lng,
                      selectedKiosk.lat, selectedKiosk.lng,
                    ).toFixed(1)} {t('map.km_away')}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedKiosk.services.map(s => (
                  <span key={s} className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — Nearby kiosk list */}
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 px-1">
            {t('map.nearest_kiosks')}
          </p>

          {nearbyKiosks.map((k, i) => {
            const isSelected = selectedKiosk?.id === k.id;
            return (
              <div key={k.id}>
                {/* Kiosk card button */}
                <button
                  onClick={() => setSelectedKiosk(isSelected ? null : k)}
                  className={`w-full text-left p-4 transition-all duration-200 ${isSelected
                    ? 'rounded-t-2xl border border-b-0 border-emerald-500/60 bg-emerald-500/10'
                    : 'rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-slate-600 w-4">{i + 1}</span>
                      <div>
                        <p className="font-black text-sm text-white leading-tight">{k.shortName}</p>
                        <p className="text-[10px] text-slate-500">{k.id} · {k.taluk} Taluk</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-400">{k.distanceKm.toFixed(1)}</p>
                        <p className="text-[9px] text-slate-500">km</p>
                      </div>
                      <ChevronRight className={`w-3 h-3 transition-all duration-200 ${isSelected ? 'text-emerald-400 rotate-90' : 'text-slate-700'
                        }`} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-slate-500 ml-6">
                    <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase ${k.district === 'Coimbatore'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-sky-500/10 text-sky-400'
                      }`}>
                      {k.district}
                    </span>
                    <span>{k.hours.split(' ')[0]}</span>
                  </div>

                  <div className="mt-2 ml-6 flex flex-wrap gap-1">
                    {k.services.slice(0, 3).map((s, si) => (
                      <span key={s} className="text-[8px] font-black text-slate-600 uppercase tracking-wider">
                        {s}{si < Math.min(2, k.services.length - 1) ? ' ·' : ''}
                      </span>
                    ))}
                    {k.services.length > 3 && (
                      <span className="text-[8px] text-slate-600">+{k.services.length - 3} more</span>
                    )}
                  </div>
                </button>

                {/* NavigationPanel — expands below card when selected */}
                {isSelected && (
                  <div className="rounded-b-2xl border border-t-0 border-emerald-500/60 bg-slate-950 overflow-hidden">
                    <NavigationPanel
                      from={currentKiosk}
                      to={k}
                      distanceKm={k.distanceKm}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* NALSA emergency helpline */}
          <div className="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
            <p className="text-[9px] font-black uppercase tracking-widest text-red-400 mb-1">{t('map.emergency_title')}</p>
            <p className="font-black text-white text-base">{t('map.emergency_name')}</p>
            <p className="text-2xl font-black text-red-400 tracking-widest mt-1">15100</p>
            <p className="text-[10px] text-slate-500 mt-1">{t('map.emergency_sub')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}