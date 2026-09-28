import React from 'react';
import { TrendingUp, Clock } from 'lucide-react';
import { WaterLevelData } from '../types';

interface LevelGraphProps {
  history: WaterLevelData[];
}

export const LevelGraph: React.FC<LevelGraphProps> = ({ history }) => {
  // Use last 25 points or fill with initial
  const points = history.slice(-25);

  const width = 500;
  const height = 150;
  const paddingX = 40;
  const paddingY = 20;

  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  // Generate SVG path points
  const coords = points.map((pt, idx) => {
    const x =
      points.length > 1
        ? paddingX + (idx / (points.length - 1)) * innerWidth
        : width / 2;
    const y = paddingY + innerHeight - (pt.percentage / 100) * innerHeight;
    return { x, y, pt };
  });

  const pathD =
    coords.length > 0
      ? coords.reduce(
          (acc, c, i) => (i === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`),
          ''
        )
      : '';

  const areaD =
    coords.length > 0
      ? `${pathD} L ${coords[coords.length - 1].x} ${paddingY + innerHeight} L ${
          coords[0].x
        } ${paddingY + innerHeight} Z`
      : '';

  return (
    <div className="p-4 bg-slate-900/90 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-white">Live Water Level Trend</h4>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Clock className="w-3 h-3" />
          <span>Last {points.length} readings</span>
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-36"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="levelGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines for 0%, 25%, 50%, 75%, 100% */}
          {[0, 25, 50, 75, 100].map((level) => {
            const y = paddingY + innerHeight - (level / 100) * innerHeight;
            return (
              <g key={level}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke={level === 0 || level === 100 ? '#ef4444' : '#334155'}
                  strokeDasharray={level % 50 === 0 ? '0' : '4 4'}
                  strokeWidth="1"
                  strokeOpacity="0.4"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {level}%
                </text>
              </g>
            );
          })}

          {/* Fill Area */}
          {coords.length > 1 && (
            <path d={areaD} fill="url(#levelGradient)" />
          )}

          {/* Line Stroke */}
          {coords.length > 1 && (
            <path
              d={pathD}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data point dots */}
          {coords.map((c, i) => (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={i === coords.length - 1 ? 4 : 2}
              fill={i === coords.length - 1 ? '#38bdf8' : '#0891b2'}
              stroke="#0f172a"
              strokeWidth="1.5"
            />
          ))}
        </svg>
      </div>
    </div>
  );
};
