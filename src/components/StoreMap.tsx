/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStoreMap, STORE_AISLES_DATA } from '../context/StoreMapContext.js';
import { useCart } from '../context/CartContext.js';
import { 
  Navigation, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Footprints, 
  Sparkles,
  ShoppingBag
} from 'lucide-react';

export const StoreMap: React.FC = () => {
  const { 
    route, 
    selectedAisle, 
    setSelectedAisle, 
    toggleWaypointCompleted, 
    activeCartLocation 
  } = useStoreMap();
  const { cartItems } = useCart();

  // Create SVG path string from coordinates
  const svgPathData = React.useMemo(() => {
    if (!route.pathCoordinates || route.pathCoordinates.length < 2) return '';
    return route.pathCoordinates.reduce((acc, coord, idx) => {
      // Map 0-100 coordinates to 0-800 SVG canvas
      const x = (coord.x / 100) * 800;
      const y = (coord.y / 100) * 500;
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [route.pathCoordinates]);

  // Check if aisle has items currently in cart
  const getAisleCartCount = (aisleNumber: number) => {
    return cartItems
      .filter(i => i.product.aisleNumber === aisleNumber)
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 lg:p-6 shadow-xl mb-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Navigation className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              In-Store Shortest-Path Floor Plan
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
              Dijkstra TSP Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic aisle route auto-recalculates to eliminate backtracking as you add groceries.
          </p>
        </div>

        {/* Route Metrics */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <Footprints className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">Total Distance:</span>
            <span className="font-bold text-white">{route.totalEstimatedDistanceMeters}m</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Estimated Walk:</span>
            <span className="font-bold text-white">~{route.estimatedMinutes} min</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-5">
        {/* Interactive Floor Map Canvas (3 Cols on desktop) */}
        <div className="lg:col-span-3 relative bg-slate-950/80 rounded-xl border border-slate-800/90 p-2 overflow-hidden">
          
          {/* SVG Map Layer */}
          <div className="relative w-full aspect-[16/10] max-h-[460px]">
            <svg 
              viewBox="0 0 800 500" 
              className="w-full h-full select-none"
              aria-label="Supermarket layout diagram"
            >
              {/* Floor grid pattern */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.4" />
                </pattern>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              <rect width="800" height="500" fill="url(#grid)" />

              {/* Entrance Gate */}
              <g transform="translate(40, 25)">
                <rect width="100" height="35" rx="6" fill="#0f172a" stroke="#0284c7" strokeWidth="1.5" />
                <text x="50" y="22" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">
                  STORE ENTRANCE
                </text>
              </g>

              {/* Autonomous Checkout Bay */}
              <g transform="translate(320, 440)">
                <rect width="160" height="40" rx="8" fill="#052e16" stroke="#10b981" strokeWidth="1.5" />
                <text x="80" y="24" fill="#34d399" fontSize="12" fontWeight="bold" textAnchor="middle">
                  AUTONOMOUS CHECKOUT
                </text>
              </g>

              {/* Route Polyline Path */}
              {svgPathData && (
                <>
                  <path
                    d={svgPathData}
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="6"
                    strokeOpacity="0.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d={svgPathData}
                    fill="none"
                    stroke="url(#routeGradient)"
                    strokeWidth="3.5"
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-[dash_20s_linear_infinite]"
                  />
                </>
              )}

              {/* Aisle Blocks */}
              {STORE_AISLES_DATA.map((aisle) => {
                const x = (aisle.coordinate.x / 100) * 800 - 65;
                const y = (aisle.coordinate.y / 100) * 500 - 45;
                const count = getAisleCartCount(aisle.number);
                const isSelected = selectedAisle === aisle.number;
                const isWaypointed = route.waypoints.some(w => w.aisleNumber === aisle.number);

                return (
                  <g 
                    key={aisle.number}
                    transform={`translate(${x}, ${y})`}
                    onClick={() => setSelectedAisle(isSelected ? null : aisle.number)}
                    className="cursor-pointer transition-transform hover:scale-105"
                  >
                    {/* Aisle Bay Shelf Box */}
                    <rect
                      width="130"
                      height="75"
                      rx="8"
                      fill={isSelected ? '#1e293b' : isWaypointed ? '#0f172a' : '#090d16'}
                      stroke={isSelected ? '#38bdf8' : isWaypointed ? '#0284c7' : '#1e293b'}
                      strokeWidth={isSelected ? '2.5' : isWaypointed ? '1.5' : '1'}
                    />

                    {/* Aisle Number Pill */}
                    <rect x="8" y="8" width="55" height="18" rx="4" fill="#0284c7" />
                    <text x="35" y="21" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                      AISLE {aisle.number}
                    </text>

                    {/* Aisle Name */}
                    <text x="10" y="44" fill="#f1f5f9" fontSize="11" fontWeight="bold">
                      {aisle.name}
                    </text>

                    {/* Department Tag */}
                    <text x="10" y="60" fill="#94a3b8" fontSize="9">
                      {aisle.category}
                    </text>

                    {/* Cart Items Badge if any */}
                    {count > 0 && (
                      <g transform="translate(100, 8)">
                        <circle r="10" fill="#10b981" />
                        <text x="0" y="3.5" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                          {count}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Real-time Smart Cart Location Marker */}
              <g 
                transform={`translate(${(activeCartLocation.x / 100) * 800}, ${(activeCartLocation.y / 100) * 500})`}
                className="transition-all duration-700 ease-out"
              >
                <circle r="18" fill="#38bdf8" fillOpacity="0.2" className="animate-ping" />
                <circle r="12" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
                <text x="0" y="4" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                  CART
                </text>
              </g>
            </svg>
          </div>

          <div className="flex items-center justify-between px-3 py-2 text-[11px] text-slate-400 border-t border-slate-900 bg-slate-950/90 rounded-b-lg">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block animate-pulse" />
              Real-time Cart Beacon Position
            </span>
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                In Cart
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
                Optimized Path
              </span>
            </span>
          </div>
        </div>

        {/* Step-by-Step Waypoint Picking Sequence */}
        <div className="flex flex-col bg-slate-950/60 rounded-xl border border-slate-800/80 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
              Pick Sequence
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {route.waypoints.filter(w => w.isCompleted).length} / {route.waypoints.length} Done
            </span>
          </div>

          {route.waypoints.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <p>Your cart is empty.</p>
              <p className="mt-1 text-slate-600">Add products from the catalog to generate an optimized pick sequence.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 overflow-y-auto max-h-[380px] mt-2 pr-1">
              {route.waypoints.map((waypoint) => (
                <div 
                  key={waypoint.stepNumber}
                  className={`py-3 transition-colors ${waypoint.isCompleted ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => toggleWaypointCompleted(waypoint.stepNumber)}
                      className="flex items-start gap-2.5 text-left group"
                      aria-label={`Toggle completion for ${waypoint.aisleName}`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border ${
                        waypoint.isCompleted 
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-400' 
                          : 'bg-cyan-950 border-cyan-700 text-cyan-300 group-hover:border-cyan-500'
                      }`}>
                        {waypoint.isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : waypoint.stepNumber}
                      </span>
                      <div>
                        <p className={`text-xs font-bold ${waypoint.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          Aisle {waypoint.aisleNumber}: {waypoint.aisleName}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {waypoint.productsToPick.length} item{waypoint.productsToPick.length > 1 ? 's' : ''} to pick
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Item tags */}
                  <div className="mt-2 pl-7 space-y-1">
                    {waypoint.productsToPick.map((item) => (
                      <div key={item.productId} className="text-[11px] text-slate-300 flex items-center justify-between">
                        <span className="truncate max-w-[150px]">• {item.productName}</span>
                        <span className="text-slate-400 font-semibold text-[10px]">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
