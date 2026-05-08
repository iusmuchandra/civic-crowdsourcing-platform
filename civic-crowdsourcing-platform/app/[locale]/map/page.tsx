'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { IssueCategory, IssueStatus } from '@/lib/types';

const CATEGORY_FILTERS: { value: IssueCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pothole', label: 'Potholes' },
  { value: 'streetlight', label: 'Streetlights' },
  { value: 'water_tap', label: 'Water' },
  { value: 'garbage', label: 'Garbage' },
];

const STATUS_FILTERS: { value: IssueStatus | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: 'bg-gray-500' },
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'threshold_met', label: 'Threshold Met', color: 'bg-orange-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-500' },
];

interface MapIssue {
  id: string;
  category: IssueCategory;
  status: IssueStatus;
  lat: number;
  lng: number;
  red_count: number;
  yellow_count: number;
  green_count: number;
  total_ratings: number;
}

export default function MapViewPage() {
  const { locale } = useParams<{ locale: string }>();
  const mapRef = useRef<HTMLDivElement>(null);
  const [issues, setIssues] = useState<MapIssue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<MapIssue[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<IssueCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<MapIssue | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const supabase = createClient();

  // Fetch map issues (only >= 5 ratings)
  useEffect(() => {
    async function fetchIssues() {
      setLoading(true);
      const { data } = await supabase.rpc('get_public_map_issues', {
        min_lat: 8, min_lng: 68, max_lat: 38, max_lng: 98, // India bounds
        filter_category: categoryFilter === 'all' ? null : categoryFilter,
        filter_status: statusFilter === 'all' ? null : statusFilter,
      });
      setIssues((data || []) as MapIssue[]);
      setLoading(false);
    }
    fetchIssues();
  }, [categoryFilter, statusFilter, supabase]);

  // Initialize Google Map
  useEffect(() => {
    if (!mapRef.current) return;

    async function init() {
      const { Map } = (await google.maps.importLibrary('maps')) as google.maps.MapsLibrary;
      const { AdvancedMarkerElement } = (await google.maps.importLibrary('marker')) as google.maps.MarkerLibrary;

      const center = { lat: 17.385, lng: 78.4867 }; // Default: Hyderabad
      const map = new Map(mapRef.current!, {
        center,
        zoom: 12,
        mapId: 'civic-map-view',
        mapTypeControl: false,
        fullscreenControl: false,
      });
      mapInstanceRef.current = map;
    }

    init();
  }, []);

  // Plot markers when issues change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    google.maps.importLibrary('marker').then(({ AdvancedMarkerElement }) => {
      issues.forEach(issue => {
        const color = issue.status === 'resolved' ? 'green' :
          issue.status === 'in_progress' ? 'blue' :
          issue.status === 'threshold_met' ? 'orange' : 'red';

        const el = document.createElement('div');
        el.innerHTML = `<div style="background:${color};color:white;padding:4px 8px;border-radius:12px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.2)">${issue.total_ratings}</div>`;

        const marker = new AdvancedMarkerElement({
          map: mapInstanceRef.current!,
          position: { lat: issue.lat, lng: issue.lng },
          content: el,
        });

        marker.addListener('click', () => setSelectedIssue(issue));
        markersRef.current.push(marker as unknown as google.maps.Marker);
      });
    });
  }, [issues]);

  // Filter sync
  useEffect(() => {
    setFilteredIssues(issues);
  }, [issues]);

  return (
    <div className="relative w-full h-screen">
      {/* Map */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Filter bar — top */}
      <div className="absolute top-0 left-0 right-0 p-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORY_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setCategoryFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                categoryFilter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 shadow'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto mt-1">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === f.value
                  ? `${f.color} text-white`
                  : 'bg-white text-gray-700 shadow'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* FAB — new issue */}
      <Link
        href={`/${locale}/issues/new`}
        className="absolute bottom-6 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-blue-700 active:scale-95 transition-transform"
      >
        +
      </Link>

      {/* Selected issue card — bottom sheet */}
      {selectedIssue && (
        <div className="absolute bottom-20 left-4 right-20 bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium capitalize px-2 py-0.5 bg-gray-100 rounded-full">
              {selectedIssue.category.replace('_', ' ')}
            </span>
            <span className={`w-2 h-2 rounded-full ${
              selectedIssue.status === 'resolved' ? 'bg-green-500' :
              selectedIssue.status === 'in_progress' ? 'bg-blue-500' :
              selectedIssue.status === 'threshold_met' ? 'bg-orange-500' : 'bg-yellow-500'
            }`} />
          </div>
          <div className="flex items-center gap-2 text-2xl font-bold mb-2">
            <span className="text-red-500">{selectedIssue.red_count}</span>
            <span className="text-yellow-500">{selectedIssue.yellow_count}</span>
            <span className="text-green-500">{selectedIssue.green_count}</span>
          </div>
          <Link
            href={`/${locale}/issues/${selectedIssue.id}`}
            className="block text-center py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
          >
            View Details
          </Link>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      )}
    </div>
  );
}
