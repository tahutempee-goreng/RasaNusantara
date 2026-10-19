/** Match the browser-visible Host, since Next may normalize request.url to localhost. */
export function requestOriginAllowed(request:Request){
 const origin=request.headers.get('origin');
 if(!origin)return true;
 if(request.headers.get('sec-fetch-site')==='cross-site')return false;
 try{
  const internal=new URL(request.url);
  const visible=new URL(`${internal.protocol}//${request.headers.get('host')||internal.host}`);
  const supplied=new URL(origin);
  return ['http:','https:'].includes(supplied.protocol)&&supplied.origin===origin&&supplied.origin===visible.origin;
 }catch{return false;}
}
