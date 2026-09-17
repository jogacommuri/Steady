import { Circle, Path, Rect, Svg } from 'react-native-svg';

/** Settings/account gear — ported 1:1 from the prototype's inline SVG. */
export function GearIcon({ size = 16, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3.4} stroke={color} strokeWidth={2} />
      <Path
        d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Today tab — a calendar page with today's date marked. */
export function TodayIcon({ size = 16, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3.5} y={5} width={17} height={15.5} stroke={color} strokeWidth={2} />
      <Path d="M3.5 9.8h17" stroke={color} strokeWidth={2} />
      <Path d="M8 2.8v4.4M16 2.8v4.4" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={12} cy={15} r={1.6} fill={color} />
    </Svg>
  );
}

/** Meals tab — fork and knife. */
export function MealIcon({ size = 16, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M7 2v20" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path
        d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Weight tab — a scale: square body, dial and needle. */
export function WeightIcon({ size = 16, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={18} height={18} stroke={color} strokeWidth={2} />
      <Circle cx={12} cy={13.5} r={3.2} stroke={color} strokeWidth={2} />
      <Path d="M12 13.5v-2.3M8 3v3M16 3v3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** Workouts tab — a dumbbell. */
export function WorkoutIcon({ size = 16, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6.5 12h11" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Rect x={2.5} y={8.5} width={3} height={7} stroke={color} strokeWidth={2} />
      <Rect x={18.5} y={8.5} width={3} height={7} stroke={color} strokeWidth={2} />
      <Path d="M5.5 10v4M18.5 10v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
