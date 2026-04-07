/**
 * LocateKiosk.tsx
 * Offline-first kiosk locator for Legal Edge pilot deployment.
 * Covers Coimbatore & Tirupur districts.
 *
 * Architecture:
 * - All kiosk data is static JSON (works with zero internet)
 * - Current kiosk is identified by KIOSK_ID env var or URL param ?kiosk=<id>
 *   Falls back to a selector when running in dev/demo mode
 * - Map is rendered via D3 projecting lat/lng onto an SVG canvas
 * - Haversine formula sorts nearby kiosks by distance
 * - Zero external map tile requests — fully offline capable
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as d3 from 'd3';
import { MapPin, Wifi, WifiOff, Clock, Phone, ChevronRight, Navigation2, Shield, X, Car, Bus, PersonStanding, ExternalLink, Route } from 'lucide-react';

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

const KIOSK_DATA: KioskLocation[] = [
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

// ─── GeoJSON boundaries (unchanged) ──────────────────────────────────────────

const DISTRICT_GEOJSON = {
  type: 'FeatureCollection' as const,
  features: [
    {
      type: 'Feature' as const,
      properties: { name: 'Coimbatore', district: 'Coimbatore' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [76.700, 11.480],
          [76.780, 11.500], [76.900, 11.490], [76.980, 11.460],
          [77.020, 11.420], [77.080, 11.380],
          [77.140, 11.330], [77.180, 11.270], [77.190, 11.200],
          [77.200, 11.140], [77.200, 11.060], [77.190, 10.980],
          [77.170, 10.900], [77.150, 10.820],
          [77.120, 10.750], [77.060, 10.700],
          [77.010, 10.640], [76.940, 10.600],
          [76.860, 10.570], [76.780, 10.560],
          [76.700, 10.580], [76.660, 10.640],
          [76.640, 10.720], [76.650, 10.810],
          [76.660, 10.900], [76.670, 11.000],
          [76.680, 11.100], [76.690, 11.200],
          [76.700, 11.320], [76.700, 11.420],
          [76.700, 11.480],
        ]],
      },
    },
    {
      type: 'Feature' as const,
      properties: { name: 'Tirupur', district: 'Tirupur' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [77.140, 11.330],
          [77.200, 11.370], [77.280, 11.390], [77.380, 11.400],
          [77.460, 11.390], [77.540, 11.370],
          [77.620, 11.340], [77.700, 11.300],
          [77.780, 11.250], [77.840, 11.180],
          [77.870, 11.100], [77.880, 11.010],
          [77.860, 10.920], [77.820, 10.840],
          [77.760, 10.770], [77.680, 10.710],
          [77.580, 10.660], [77.480, 10.610],
          [77.380, 10.570], [77.280, 10.540],
          [77.200, 10.540], [77.160, 10.580],
          [77.150, 10.650], [77.150, 10.750],
          [77.170, 10.820], [77.190, 10.900],
          [77.190, 10.980], [77.200, 11.060],
          [77.200, 11.140], [77.190, 11.200],
          [77.180, 11.270], [77.140, 11.330],
        ]],
      },
    },
  ],
};

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

interface NavigationInfo {
  destination: KioskLocation;
  mode: TravelMode;
}

/**
 * Opens Google Maps directions in a new tab.
 * Uses the kiosk coordinates as origin & destination so it works even
 * when the device has no GPS lock (kiosk is a fixed known location).
 * Falls back gracefully: on iOS it deep-links to Apple Maps if Google Maps
 * is not installed (the browser handles the redirect).
 */
function openGoogleMapsDirections(
  from: KioskLocation,
  to: KioskLocation,
  mode: TravelMode
) {
  const modeMap: Record<TravelMode, string> = {
    driving: 'driving',
    transit: 'transit',
    walking: 'walking',
  };
  const url =
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${from.lat},${from.lng}` +
    `&destination=${to.lat},${to.lng}` +
    `&travelmode=${modeMap[mode]}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Very rough travel-time estimates based on straight-line distance.
 * These are shown as "~X min" and are intentionally conservative.
 * Actual times will differ — the Google Maps button gives real routing.
 */
function estimateTravelTime(distanceKm: number, mode: TravelMode): string {
  // Average speeds: driving 35 km/h (city), transit 25 km/h, walking 4.5 km/h
  const speeds: Record<TravelMode, number> = {
    driving: 35,
    transit: 25,
    walking: 4.5,
  };
  // Straight-line distance is shorter than road distance; apply a 1.35 factor
  const roadKm = distanceKm * 1.35;
  const minutes = Math.round((roadKm / speeds[mode]) * 60);
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

function resolveCurrentKioskId(): string | null {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlId = params.get('kiosk');
    if (urlId && KIOSK_DATA.find(k => k.id === urlId)) return urlId;
  }
  const envId = (import.meta as any)?.env?.VITE_KIOSK_ID;
  if (envId && KIOSK_DATA.find(k => k.id === envId)) return envId;
  return null;
}

interface MapTranslations {
  you_are_here: string;
  legend_cbe: string;
  legend_tpr: string;
  legend_current: string;
  legend_inactive: string;
  inactive_label: string;
  district_coimbatore: string;
  district_tirupur: string;
  [key: string]: string;
}

// ─── Navigation Panel Component ──────────────────────────────────────────────
// Shown inline under a nearby kiosk list card when it is selected.
// Displays travel mode tabs, estimated time, and a "Get Directions" CTA
// that deep-links to Google Maps with the correct origin → destination.

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
    { key: 'driving', label: 'Drive',   Icon: Car             },
    { key: 'transit', label: 'Transit', Icon: Bus             },
    { key: 'walking', label: 'Walk',    Icon: PersonStanding  },
  ];

  return (
    <div
      className="rounded-xl overflow-hidden"
      onClick={e => e.stopPropagation()} // prevent card toggle when interacting inside
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
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[9px] font-black uppercase tracking-widest transition-colors ${
              mode === key
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

      {/* Offline caveat */}
      <div className="px-4 pb-3">
        <p className="text-[8px] text-slate-700 italic">
          Opens Google Maps · requires internet connection
        </p>
      </div>
    </div>
  );
}

// ─── D3 Map Component ─────────────────────────────────────────────────────────
//
// CHANGED: Google Maps visual language throughout.
//
//   Map background  → warm beige terrain (#e8e0d8) replacing dark navy
//   District fills  → muted greens (#d4e4c4 / #d8ead0) replacing dark teal/blue
//   District border → soft olive strokes, no bright neon glow
//   Road network    → added highways (amber/tan), arterials and minor roads (white)
//                     rendered as projected GeoJSON LineString features
//   Pin shape       → teardrop SVG path with white inner circle + colour dot,
//                     feDropShadow filter for depth (replaces plain circles)
//   Pin colours     → #ea4335 current · #1a73e8 Coimbatore · #34a853 Tirupur · #9e9e9e inactive
//   Label callouts  → white pill-shaped rounded-rect with triangle pointer,
//                     feDropShadow, coloured when selected (replaces bare <text>)
//   "You are here"  → red callout bubble above pin + two pulse rings
//   Legend          → white card with mini teardrop icons (replaces dark box)
//   Attribution     → "Map data © Survey of India" strip at the bottom

function DistrictMap({
  currentKiosk,
  selectedKiosk,
  onSelectKiosk,
  mt,
}: {
  currentKiosk: KioskLocation;
  selectedKiosk: KioskLocation | null;
  onSelectKiosk: (k: KioskLocation) => void;
  mt: MapTranslations;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dims, setDims] = useState({ w: 600, h: 400 });

  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width } = entry.contentRect;
      setDims({ w: width, h: Math.round(width * 0.72) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { w, h } = dims;
    const padding = 32;

    const projection = d3.geoMercator()
      .fitExtent([[padding, padding], [w - padding, h - padding]], DISTRICT_GEOJSON as any);

    const pathGen = d3.geoPath().projection(projection);

    // ── <defs>: drop-shadow filters ──────────────────────────────────────────
    const defs = svg.append('defs');

    const fPin = defs.append('filter')
      .attr('id', 'gm-pin-shadow')
      .attr('x', '-40%').attr('y', '-20%')
      .attr('width', '180%').attr('height', '160%');
    fPin.append('feDropShadow')
      .attr('dx', 0).attr('dy', 2)
      .attr('stdDeviation', 2.5)
      .attr('flood-color', '#00000055');

    const fCur = defs.append('filter')
      .attr('id', 'gm-current-shadow')
      .attr('x', '-50%').attr('y', '-30%')
      .attr('width', '200%').attr('height', '200%');
    fCur.append('feDropShadow')
      .attr('dx', 0).attr('dy', 4)
      .attr('stdDeviation', 5)
      .attr('flood-color', '#00000066');

    const fPill = defs.append('filter')
      .attr('id', 'gm-pill-shadow')
      .attr('x', '-10%').attr('y', '-30%')
      .attr('width', '120%').attr('height', '200%');
    fPill.append('feDropShadow')
      .attr('dx', 0).attr('dy', 1)
      .attr('stdDeviation', 1.5)
      .attr('flood-color', '#00000033');

    // ── Map background: Google Maps light terrain ─────────────────────────────
    svg.append('rect')
      .attr('width', w).attr('height', h)
      .attr('fill', '#e8e0d8');

    // ── Subtle graticule ─────────────────────────────────────────────────────
    const graticule = d3.geoGraticule().step([0.3, 0.2]);
    svg.append('path')
      .datum(graticule())
      .attr('d', pathGen as any)
      .attr('fill', 'none')
      .attr('stroke', '#d4c8bc')
      .attr('stroke-width', 0.4)
      .attr('opacity', 0.6);

    // ── District fills ────────────────────────────────────────────────────────
    svg.selectAll('path.district')
      .data(DISTRICT_GEOJSON.features)
      .enter()
      .append('path')
      .attr('class', 'district')
      .attr('d', (d: any) => pathGen(d) || '')
      .attr('fill', (d: any) =>
        d.properties.district === 'Coimbatore' ? '#d4e4c4' : '#d8ead0'
      )
      .attr('stroke', (d: any) =>
        d.properties.district === 'Coimbatore' ? '#b4c8a0' : '#b8ccaa'
      )
      .attr('stroke-width', 1.2)
      .attr('opacity', 1);

    // ── Road network ──────────────────────────────────────────────────────────
    // Roads are GeoJSON LineString features projected through the same Mercator
    // projection as the district polygons, so they sit correctly on the map.

    type RoadFeature = {
      type: 'Feature';
      properties: { kind: 'highway' | 'arterial' | 'minor' };
      geometry: { type: 'LineString'; coordinates: [number, number][] };
    };

    const roads: RoadFeature[] = [
      // NH 544 — Coimbatore to Palakkad
      { type: 'Feature', properties: { kind: 'highway' },
        geometry: { type: 'LineString', coordinates: [
          [76.66, 11.002], [76.75, 10.998], [76.85, 10.995],
          [76.963, 11.004], [77.10, 11.018], [77.20, 11.020],
          [77.30, 11.025], [77.45, 11.025],
        ]}},
      // NH 83 — Coimbatore to Pollachi
      { type: 'Feature', properties: { kind: 'highway' },
        geometry: { type: 'LineString', coordinates: [
          [76.963, 11.004], [76.980, 10.900], [76.990, 10.800],
          [77.007, 10.660],
        ]}},
      // Coimbatore–Tirupur–Erode (NH 209 / SH 15)
      { type: 'Feature', properties: { kind: 'highway' },
        geometry: { type: 'LineString', coordinates: [
          [76.963, 11.004], [77.05, 11.010], [77.15, 11.015],
          [77.34, 11.107], [77.45, 11.10], [77.55, 11.08],
          [77.70, 11.05],
        ]}},
      // Coimbatore–Mettupalayam
      { type: 'Feature', properties: { kind: 'arterial' },
        geometry: { type: 'LineString', coordinates: [
          [76.963, 11.004], [76.970, 11.10], [76.960, 11.20],
          [76.949, 11.310],
        ]}},
      // Annur connector
      { type: 'Feature', properties: { kind: 'arterial' },
        geometry: { type: 'LineString', coordinates: [
          [77.10, 11.018], [77.128, 11.10], [77.128, 11.230],
        ]}},
      // Palladam connector
      { type: 'Feature', properties: { kind: 'arterial' },
        geometry: { type: 'LineString', coordinates: [
          [77.34, 11.107], [77.30, 10.984], [77.30, 10.850],
        ]}},
      // Kangeyam–Dharapuram connector
      { type: 'Feature', properties: { kind: 'arterial' },
        geometry: { type: 'LineString', coordinates: [
          [77.562, 11.006], [77.55, 10.900], [77.513, 10.732],
        ]}},
      // Udumalpet minor road
      { type: 'Feature', properties: { kind: 'minor' },
        geometry: { type: 'LineString', coordinates: [
          [77.007, 10.660], [77.10, 10.620], [77.25, 10.586],
        ]}},
      // Avinashi connector
      { type: 'Feature', properties: { kind: 'minor' },
        geometry: { type: 'LineString', coordinates: [
          [77.268, 11.194], [77.34, 11.107],
        ]}},
    ];

    // Highway casing (white outline beneath the amber fill)
    svg.selectAll('path.road-casing')
      .data(roads.filter(r => r.properties.kind === 'highway'))
      .enter().append('path')
      .attr('class', 'road-casing')
      .attr('d', (d: any) => pathGen(d) || '')
      .attr('fill', 'none')
      .attr('stroke', '#e8d8a0')
      .attr('stroke-width', 7)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round');

    // Highway fill (amber/tan — Google's standard highway colour)
    svg.selectAll('path.road-highway')
      .data(roads.filter(r => r.properties.kind === 'highway'))
      .enter().append('path')
      .attr('class', 'road-highway')
      .attr('d', (d: any) => pathGen(d) || '')
      .attr('fill', 'none')
      .attr('stroke', '#f5c97a')
      .attr('stroke-width', 4)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round');

    // Arterial roads (white, thinner)
    svg.selectAll('path.road-arterial')
      .data(roads.filter(r => r.properties.kind === 'arterial'))
      .enter().append('path')
      .attr('class', 'road-arterial')
      .attr('d', (d: any) => pathGen(d) || '')
      .attr('fill', 'none')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2.5)
      .attr('stroke-linecap', 'round');

    // Minor roads (white, thinnest)
    svg.selectAll('path.road-minor')
      .data(roads.filter(r => r.properties.kind === 'minor'))
      .enter().append('path')
      .attr('class', 'road-minor')
      .attr('d', (d: any) => pathGen(d) || '')
      .attr('fill', 'none')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5)
      .attr('stroke-linecap', 'round')
      .attr('opacity', 0.8);

    // ── District name watermarks ───────────────────────────────────────────────
    DISTRICT_GEOJSON.features.forEach((feature: any) => {
      const centroid = pathGen.centroid(feature as any);
      const isCbe = feature.properties.district === 'Coimbatore';
      svg.append('text')
        .attr('x', isCbe ? centroid[0] - 20 : centroid[0] + 10)
        .attr('y', centroid[1] + (isCbe ? 40 : 20))
        .attr('text-anchor', 'middle')
        .attr('font-size', Math.max(10, w / 58))
        .attr('font-weight', '600')
        .attr('font-family', 'sans-serif')
        .attr('letter-spacing', '0.18em')
        .attr('fill', isCbe ? '#7a9060' : '#7a9870')
        .attr('opacity', 0.75)
        .attr('pointer-events', 'none')
        .text(isCbe
          ? mt.district_coimbatore.toUpperCase()
          : mt.district_tirupur.toUpperCase());
    });

    // ── Teardrop pin path builder ─────────────────────────────────────────────
    // Centred at (0, 0) with the pointed tip at (0, +ph/2).
    // The <g> is translated so the tip lands on the kiosk coordinate.
    const tearPath = (r: number, ph: number): string => {
      const cy = -(ph / 2 - r);
      return [
        `M 0,${ph / 2}`,
        `C ${-r * 0.55},${ph / 2 - ph * 0.25}`,
        `  ${-r},${cy + r * 0.6}`,
        `  ${-r},${cy}`,
        `A ${r},${r} 0 1 1 ${r},${cy}`,
        `C ${r},${cy + r * 0.6}`,
        `  ${r * 0.55},${ph / 2 - ph * 0.25}`,
        `  0,${ph / 2}`,
        'Z',
      ].join(' ');
    };

    // ── Pin drawing helper ────────────────────────────────────────────────────
    const drawPin = (
      k: KioskLocation,
      isCurrent: boolean,
      isSelected: boolean,
      onClick?: () => void
    ) => {
      const pos = projection([k.lng, k.lat]);
      if (!pos) return;
      const [px, py] = pos;

      // ── Inactive pin ────────────────────────────────────────────────────────
      if (!k.active) {
        const g = svg.append('g')
          .attr('transform', `translate(${px},${py})`)
          .attr('filter', 'url(#gm-pin-shadow)')
          .style('cursor', 'default');

        const pr = 7, ph = 18;
        g.append('path')
          .attr('d', tearPath(pr, ph))
          .attr('transform', `translate(0,${-ph / 2})`)
          .attr('fill', '#9e9e9e')
          .attr('stroke', '#fff')
          .attr('stroke-width', 1.5);

        g.append('circle')
          .attr('cx', 0).attr('cy', -(ph / 2 - pr))
          .attr('r', pr * 0.42)
          .attr('fill', '#fff')
          .attr('opacity', 0.6);

        g.append('title').text(`${k.shortName} (${mt.inactive_label})`);
        return;
      }

      // ── Colour ───────────────────────────────────────────────────────────────
      const colour = isCurrent
        ? '#ea4335'
        : k.district === 'Coimbatore' ? '#1a73e8' : '#34a853';

      const pr  = isCurrent ? 12 : isSelected ? 11 : 9;
      const ph  = isCurrent ? 32 : isSelected ? 28 : 24;
      const tipOffset = ph / 2;

      // ── Pulse rings for current kiosk ────────────────────────────────────────
      if (isCurrent) {
        [36, 26].forEach((r, i) => {
          svg.append('circle')
            .attr('cx', px).attr('cy', py)
            .attr('r', r)
            .attr('fill', `${colour}${i === 0 ? '18' : '28'}`)
            .attr('stroke', `${colour}${i === 0 ? '30' : '40'}`)
            .attr('stroke-width', 1)
            .attr('pointer-events', 'none');
        });
      }

      // ── Halo for selected kiosk ──────────────────────────────────────────────
      if (isSelected && !isCurrent) {
        svg.append('circle')
          .attr('cx', px).attr('cy', py)
          .attr('r', 20)
          .attr('fill', `${colour}20`)
          .attr('stroke', `${colour}50`)
          .attr('stroke-width', 1.5)
          .attr('pointer-events', 'none');
      }

      // ── Pin group ────────────────────────────────────────────────────────────
      const g = svg.append('g')
        .attr('transform', `translate(${px},${py - tipOffset})`)
        .attr('filter', isCurrent ? 'url(#gm-current-shadow)' : 'url(#gm-pin-shadow)')
        .style('cursor', isCurrent ? 'default' : 'pointer');

      if (!isCurrent && onClick) g.on('click', onClick);

      // Teardrop body
      g.append('path')
        .attr('d', tearPath(pr, ph))
        .attr('fill', colour)
        .attr('stroke', '#fff')
        .attr('stroke-width', isCurrent ? 2.5 : 2);

      // White inner circle
      const holeCy = -(ph / 2 - pr);
      g.append('circle')
        .attr('cx', 0).attr('cy', holeCy)
        .attr('r', pr * 0.52)
        .attr('fill', '#fff');

      // Coloured dot
      g.append('circle')
        .attr('cx', 0).attr('cy', holeCy)
        .attr('r', pr * 0.26)
        .attr('fill', colour);

      // ── "YOU ARE HERE" callout bubble ────────────────────────────────────────
      if (isCurrent) {
        const label = mt.you_are_here;
        const bubbleW = Math.max(label.length * 7.2 + 20, 100);
        const bubbleH = 24;
        const bx = -bubbleW / 2;
        const by = -(ph + bubbleH + 8);

        g.append('rect')
          .attr('x', bx).attr('y', by)
          .attr('width', bubbleW).attr('height', bubbleH)
          .attr('rx', bubbleH / 2)
          .attr('fill', colour)
          .attr('filter', 'url(#gm-pill-shadow)');

        g.append('polygon')
          .attr('points', `${-5},${by + bubbleH} 5,${by + bubbleH} 0,${by + bubbleH + 6}`)
          .attr('fill', colour);

        g.append('text')
          .attr('x', 0).attr('y', by + bubbleH / 2 + 1)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('font-size', Math.max(9, w / 72))
          .attr('font-weight', '700')
          .attr('font-family', 'sans-serif')
          .attr('letter-spacing', '0.04em')
          .attr('fill', '#fff')
          .attr('pointer-events', 'none')
          .text(label);

        // Short name pill below pin tip
        const nameLabel = mt[`kiosk_${k.id.toLowerCase().replace('-', '_')}`] || k.shortName;
        const nameLabelW = Math.max(nameLabel.length * 7 + 20, 80);
        const nlx = -nameLabelW / 2;
        const nly = tipOffset + 6;

        g.append('rect')
          .attr('x', nlx).attr('y', nly)
          .attr('width', nameLabelW).attr('height', 20)
          .attr('rx', 10)
          .attr('fill', '#fff')
          .attr('stroke', '#ddd')
          .attr('stroke-width', 0.5)
          .attr('filter', 'url(#gm-pill-shadow)');

        g.append('text')
          .attr('x', 0).attr('y', nly + 10)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('font-size', Math.max(9, w / 76))
          .attr('font-weight', '600')
          .attr('font-family', 'sans-serif')
          .attr('fill', '#333')
          .attr('pointer-events', 'none')
          .text(nameLabel);

        return;
      }

      // ── Pill label callout ────────────────────────────────────────────────────
      const shortLabel = mt[`kiosk_${k.id.toLowerCase().replace('-', '_')}`] || k.shortName;
      const pillW = Math.max(shortLabel.length * 6.8 + 20, 60);
      const pillH = 18;
      const pillY = -(ph + pillH + 4);
      const pillX = -pillW / 2;

      g.append('rect')
        .attr('x', pillX).attr('y', pillY)
        .attr('width', pillW).attr('height', pillH)
        .attr('rx', pillH / 2)
        .attr('fill', isSelected ? colour : '#fff')
        .attr('stroke', isSelected ? colour : '#ccc')
        .attr('stroke-width', isSelected ? 0 : 0.5)
        .attr('filter', 'url(#gm-pill-shadow)');

      g.append('polygon')
        .attr('points', `${-4},${pillY + pillH} 4,${pillY + pillH} 0,${pillY + pillH + 5}`)
        .attr('fill', isSelected ? colour : '#fff');

      g.append('text')
        .attr('x', 0).attr('y', pillY + pillH / 2 + 1)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', Math.max(8, w / 80))
        .attr('font-weight', isSelected ? '700' : '500')
        .attr('font-family', 'sans-serif')
        .attr('fill', isSelected ? '#fff' : '#333')
        .attr('pointer-events', 'none')
        .text(shortLabel);

      g.append('title')
        .text(`${k.shortName}\n${k.district} · ${k.taluk}\n${k.address}`);
    };

    // ── Route line: curved dashed arrow from current → selected kiosk ───────────
    if (selectedKiosk) {
      const fromPos = projection([currentKiosk.lng, currentKiosk.lat]);
      const toPos   = projection([selectedKiosk.lng,  selectedKiosk.lat]);
      if (fromPos && toPos) {
        const [x1, y1] = fromPos;
        const [x2, y2] = toPos;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const curveOffset = Math.min(len * 0.22, 40);
        // Control point offset perpendicular to the line
        const cpx = mx - (dy / len) * curveOffset;
        const cpy = my + (dx / len) * curveOffset;
        const pathD = `M${x1},${y1} Q${cpx},${cpy} ${x2},${y2}`;

        // Arrow marker
        defs.append('marker')
          .attr('id', 'route-arrow')
          .attr('viewBox', '0 0 10 10')
          .attr('refX', '8').attr('refY', '5')
          .attr('markerWidth', '5').attr('markerHeight', '5')
          .attr('orient', 'auto-start-reverse')
          .append('path')
          .attr('d', 'M2 1L8 5L2 9')
          .attr('fill', 'none')
          .attr('stroke', '#10b981')
          .attr('stroke-width', 2)
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round');

        // Glow halo
        svg.append('path')
          .attr('d', pathD)
          .attr('fill', 'none')
          .attr('stroke', 'rgba(52,211,153,0.25)')
          .attr('stroke-width', 10)
          .attr('stroke-linecap', 'round');

        // Main dashed route line
        svg.append('path')
          .attr('d', pathD)
          .attr('fill', 'none')
          .attr('stroke', '#10b981')
          .attr('stroke-width', 2.8)
          .attr('stroke-dasharray', '7 5')
          .attr('stroke-linecap', 'round')
          .attr('marker-end', 'url(#route-arrow)');

        // Distance badge at ~midpoint of the quadratic bezier (t=0.5)
        const bx = 0.25 * x1 + 0.5 * cpx + 0.25 * x2;
        const by = 0.25 * y1 + 0.5 * cpy + 0.25 * y2;
        const distKm = haversine(
          currentKiosk.lat, currentKiosk.lng,
          selectedKiosk.lat, selectedKiosk.lng,
        );
        const distLabel = distKm.toFixed(1) + ' km';
        const bw = distLabel.length * 6.5 + 16;
        svg.append('rect')
          .attr('x', bx - bw / 2).attr('y', by - 11)
          .attr('width', bw).attr('height', 22)
          .attr('rx', 11)
          .attr('fill', '#10b981')
          .attr('stroke', 'white').attr('stroke-width', 1.5);
        svg.append('text')
          .attr('x', bx).attr('y', by)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('font-size', 10).attr('font-weight', '700')
          .attr('font-family', 'sans-serif')
          .attr('fill', 'white')
          .attr('pointer-events', 'none')
          .text(distLabel);
      }
    }

    // Draw order: inactive → active non-current → current (top)
    KIOSK_DATA.filter(k => !k.active)
      .forEach(k => drawPin(k, false, false));

    KIOSK_DATA
      .filter(k => k.active && k.id !== currentKiosk.id)
      .forEach(k =>
        drawPin(k, false, selectedKiosk?.id === k.id, () => onSelectKiosk(k))
      );

    drawPin(currentKiosk, true, false);

    // ── Legend (white card, mini teardrop icons) ──────────────────────────────
    const lw = 148, lh = 88;
    const lx = w - lw - 10, ly = h - lh - 10;

    svg.append('rect')
      .attr('x', lx).attr('y', ly)
      .attr('width', lw).attr('height', lh)
      .attr('rx', 8)
      .attr('fill', '#fff')
      .attr('opacity', 0.94)
      .attr('stroke', '#e0e0e0')
      .attr('stroke-width', 0.5)
      .attr('filter', 'url(#gm-pill-shadow)');

    const legendItems = [
      { color: '#ea4335', label: mt.legend_current },
      { color: '#1a73e8', label: mt.legend_cbe },
      { color: '#34a853', label: mt.legend_tpr },
      { color: '#9e9e9e', label: mt.legend_inactive },
    ];
    legendItems.forEach(({ color, label }, i) => {
      const iy = ly + 14 + i * 19;
      svg.append('path')
        .attr('transform', `translate(${lx + 11},${iy + 2})`)
        .attr('d', tearPath(5, 12))
        .attr('fill', color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);
      svg.append('text')
        .attr('x', lx + 22).attr('y', iy + 4)
        .attr('dominant-baseline', 'central')
        .attr('font-size', 10)
        .attr('font-family', 'sans-serif')
        .attr('fill', '#555')
        .text(label);
    });

    // ── Attribution strip ─────────────────────────────────────────────────────
    svg.append('rect')
      .attr('x', 0).attr('y', h - 18)
      .attr('width', w).attr('height', 18)
      .attr('fill', '#fff')
      .attr('opacity', 0.65);

    svg.append('text')
      .attr('x', w / 2).attr('y', h - 5)
      .attr('text-anchor', 'middle')
      .attr('font-size', 9)
      .attr('font-family', 'sans-serif')
      .attr('fill', '#888')
      .text('Map data © Survey of India');

  }, [dims, currentKiosk, selectedKiosk, onSelectKiosk, mt]);

  return (
    <svg
      ref={svgRef}
      width={dims.w}
      height={dims.h}
      className="w-full rounded-xl overflow-hidden"
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LocateKiosk({ onNavigate }: LocateKioskProps) {
  const { t, i18n } = useTranslation();
  const mt = useMemo<MapTranslations>(() => ({
    you_are_here:        t('map.you_are_here'),
    legend_cbe:          t('map.legend_cbe'),
    legend_tpr:          t('map.legend_tpr'),
    legend_current:      t('map.legend_current'),
    legend_inactive:     t('map.legend_inactive'),
    inactive_label:      t('map.inactive_label'),
    district_coimbatore: t('map.district_coimbatore'),
    district_tirupur:    t('map.district_tirupur'),
    kiosk_cbe_001: t('map.kiosk_cbe_001'),
    kiosk_cbe_002: t('map.kiosk_cbe_002'),
    kiosk_cbe_003: t('map.kiosk_cbe_003'),
    kiosk_cbe_004: t('map.kiosk_cbe_004'),
    kiosk_cbe_005: t('map.kiosk_cbe_005'),
    kiosk_cbe_006: t('map.kiosk_cbe_006'),
    kiosk_tpr_001: t('map.kiosk_tpr_001'),
    kiosk_tpr_002: t('map.kiosk_tpr_002'),
    kiosk_tpr_003: t('map.kiosk_tpr_003'),
    kiosk_tpr_004: t('map.kiosk_tpr_004'),
    kiosk_tpr_005: t('map.kiosk_tpr_005'),
    kiosk_tpr_006: t('map.kiosk_tpr_006'),
  }), [i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps

  const resolvedId = resolveCurrentKioskId();
  const [currentKioskId, setCurrentKioskId] = useState<string>(resolvedId || 'CBE-001');
  const [selectedKiosk, setSelectedKiosk] = useState<KioskLocation | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSelector, setShowSelector] = useState(!resolvedId);

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
    [currentKioskId]
  );

  const nearbyKiosks = useMemo(() => {
    return KIOSK_DATA
      .filter(k => k.id !== currentKioskId && k.active)
      .map(k => ({ ...k, distanceKm: haversine(currentKiosk.lat, currentKiosk.lng, k.lat, k.lng) }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 5);
  }, [currentKiosk, currentKioskId]);

  const displayKiosk = selectedKiosk || (nearbyKiosks[0] as KioskLocation & { distanceKm: number } | undefined);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-mono p-4 md:p-8">

      {/* Header */}
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

          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest ${
            isOnline
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {isOnline ? t('map.online') : t('map.offline_mode')}
          </div>
        </div>

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

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {t('map.district_map_title')}
              </span>
              <span className="text-[9px] text-slate-600 font-mono">
                {KIOSK_DATA.filter(k => k.active).length} {t('map.active_kiosks')}
              </span>
            </div>
            <div className="p-2">
              <DistrictMap
                currentKiosk={currentKiosk}
                selectedKiosk={selectedKiosk}
                onSelectKiosk={setSelectedKiosk}
                mt={mt}
              />
            </div>
            <div className="px-5 py-2 border-t border-slate-800 text-[9px] text-slate-600 font-mono">
              {t('map.click_hint')}
            </div>
          </div>

          {selectedKiosk && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 relative">
              <button
                onClick={() => setSelectedKiosk(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mb-1">{t('map.selected_kiosk')}</p>
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
                    {haversine(currentKiosk.lat, currentKiosk.lng, selectedKiosk.lat, selectedKiosk.lng).toFixed(1)} {t('map.km_away')}
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

        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 px-1">
            {t('map.nearest_kiosks')}
          </p>

          {nearbyKiosks.map((k, i) => {
            const isSelected = selectedKiosk?.id === k.id;
            return (
              <div key={k.id} className="space-y-0">
                <button
                  onClick={() => setSelectedKiosk(isSelected ? null : k)}
                  className={`w-full text-left p-4 transition-all duration-200 ${
                    isSelected
                      ? 'rounded-t-2xl border border-b-0 border-emerald-500/60 bg-emerald-500/10'
                      : 'rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-slate-600 w-4">{i + 1}</span>
                      <div>
                        <p className="font-black text-sm text-white leading-tight">
                          {mt[`kiosk_${k.id.toLowerCase().replace('-', '_')}`] || k.shortName}
                        </p>
                        <p className="text-[10px] text-slate-500">{k.id} · {k.taluk} Taluk</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-400">{k.distanceKm.toFixed(1)}</p>
                        <p className="text-[9px] text-slate-500">km</p>
                      </div>
                      <ChevronRight className={`w-3 h-3 transition-all duration-200 ${
                        isSelected ? 'text-emerald-400 rotate-90' : 'text-slate-700'
                      }`} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-slate-500 ml-6">
                    <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase ${
                      k.district === 'Coimbatore'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-sky-500/10 text-sky-400'
                    }`}>
                      {k.district}
                    </span>
                    <span>{k.hours.split(' ')[0]}</span>
                  </div>

                  <div className="mt-2 ml-6 flex flex-wrap gap-1">
                    {k.services.slice(0, 3).map(s => (
                      <span key={s} className="text-[8px] font-black text-slate-600 uppercase tracking-wider">
                        {s}{k.services.indexOf(s) < Math.min(2, k.services.length - 1) ? ' ·' : ''}
                      </span>
                    ))}
                    {k.services.length > 3 && (
                      <span className="text-[8px] text-slate-600">+{k.services.length - 3} more</span>
                    )}
                  </div>
                </button>

                {/* Navigation panel — expands below the card when selected */}
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
