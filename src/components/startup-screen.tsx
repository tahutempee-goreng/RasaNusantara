export function StartupScreen({error=''}:{error?:string}) {
 return <div className="startup-screen" data-state={error?'error':'loading'} role={error?'alert':'status'} aria-live="polite">
  <div className="startup-content">
   <svg className="startup-bowl" viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <g className="startup-steam"><path d="M32 35c-9-10 8-12 0-23"/><path d="M48 32c-9-10 8-12 0-23"/><path d="M64 35c-9-10 8-12 0-23"/></g>
    <path d="M15 48h66c-3 22-15 32-33 32S18 70 15 48ZM30 87h36M25 58h46"/>
   </svg>
   <h1>RasaNusantara</h1>
   {error?<><h2>Dapur belum bisa dibuka</h2><p>{error}</p><button className="button" onClick={()=>window.location.reload()}>Coba lagi</button></>:<p className="startup-message">Menyiapkan cerita dan rasa…</p>}
   <noscript><p>Aktifkan JavaScript pada browser untuk membuka resep dan panduan memasak.</p></noscript>
   <p className="startup-signature">Dari bahan di dapurmu,<br/>ke cerita di meja kita.</p>
  </div>
 </div>;
}
