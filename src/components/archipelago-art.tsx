import styles from './journal-home.module.css';

export function Islands({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 1000 440" fill="none" aria-hidden="true">
    <g fill="currentColor" stroke="currentColor" strokeLinejoin="round" strokeWidth="7">
      <path d="m75 70 35 14 38 38 22 42 42 36 37 56-9 20-30-13-43-42-21-36-38-29-23-43Z"/>
      <path d="m238 293 44-4 43 13 52 4 42 21-12 9-55-10-40-3-47-13Z"/>
      <path d="m326 133 42-30 43 7 22 42 34 18-9 41-32 34-39 3-31-38-22-27Z"/>
      <path d="m507 170 22-40 18 9-12 45 37-9 29-32 17 8-32 43-39 12 8 27 42 24-12 14-44-20-17-24-19 24-16-10 14-35Z"/>
      <path d="m755 197 51-16 40 24 35 2 59 32 12 55-41-6-34-27-41-8-22-27-37 1Z"/>
    </g>
    <g fill="currentColor"><ellipse cx="442" cy="337" rx="13" ry="6"/><ellipse cx="480" cy="344" rx="17" ry="7"/><ellipse cx="525" cy="349" rx="18" ry="6"/><ellipse cx="568" cy="360" rx="24" ry="7"/><ellipse cx="620" cy="374" rx="24" ry="8"/><ellipse cx="690" cy="229" rx="8" ry="20"/><ellipse cx="718" cy="288" rx="12" ry="7"/><ellipse cx="666" cy="299" rx="16" ry="7"/></g>
    <path d="M90 105Q260 380 387 170T540 211 821 233" stroke="#aa6c49" strokeWidth="2" strokeDasharray="5 9"/>
    <g stroke="#aa6c49" strokeWidth="2"><circle cx="197" cy="224" r="8"/><circle cx="377" cy="168" r="8"/><circle cx="544" cy="212" r="8"/><circle cx="821" cy="233" r="8"/></g>
  </svg>;
}

export function Textile() {
  return <svg className={styles.textile} viewBox="0 0 180 700" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="rn-weave" width="40" height="56" patternUnits="userSpaceOnUse"><path d="m20 3 16 25-16 25L4 28Z M20 16l8 12-8 12-8-12Z" fill="none" stroke="#d7b677" strokeWidth="1.5"/><path d="M0 0v56M40 0v56" stroke="#d7b677" strokeWidth="4"/></pattern></defs><path fill="#914b35" d="M0 0h180v700H0z"/><path fill="url(#rn-weave)" d="M8 0h164v700H8z"/></svg>;
}

export function Tear({ variant = 0 }: { variant?: number }) {
  const edge = Array.from({ length: 101 }, (_, i) => `${i * 10},${10 + ((i * 17 + variant * 13) % 11) + Math.sin(i * 2.7) * 3}`).join(' ');
  return <svg className={styles.tearLayers} viewBox="0 0 1000 52" preserveAspectRatio="none" aria-hidden="true">
    <polygon points={`0,52 ${edge} 1000,52`} fill="#aaa99b"/>
    <polygon points={`0,52 ${edge} 1000,52`} transform="translate(0 7)" fill="#d5cbb6"/>
    <polygon points={`0,52 ${edge} 1000,52`} transform="translate(0 13)" fill="#f2ecdf"/>
  </svg>;
}

export function Compass() {
  return <svg className={styles.compass} viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor"><circle cx="50" cy="50" r="35"/><circle cx="50" cy="50" r="30"/><path d="M50 5v90M5 50h90M25 25l50 50M25 75l50-50"/></g><path d="m50 15 8 35-8 35-8-35Z" fill="currentColor"/><text x="50" y="10" textAnchor="middle" fill="currentColor" fontSize="8">U</text></svg>;
}

export function Boat() {
  return <svg className={styles.boat} viewBox="0 0 160 140" aria-hidden="true"><path d="M30 110h111l-22 17H52Z" fill="#714934"/><path d="M85 14v100M40 130q20-8 40 0t40 0t30 0" fill="none" stroke="#688c94" strokeWidth="2"/><path d="m80 21-51 78h51ZM91 37v62h47Z" fill="#f4eddb" stroke="#ac9771"/></svg>;
}
