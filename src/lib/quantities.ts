import type {Recipe} from './schema';

type Ingredient=Recipe['ingredients'][number];
export type PracticalQuantity={text:string;approximate:boolean;preparation?:string;sourceIds:string[]};
const number=new Intl.NumberFormat('id-ID',{maximumFractionDigits:2});
const same=(a:number,b:number)=>Math.abs(a-b)<1e-8;
const denominators:Record<number,string>={2:'setengah',3:'sepertiga',4:'seperempat',5:'seperlima',6:'seperenam',8:'seperdelapan',10:'sepersepuluh',12:'seperdua belas',16:'seperenam belas',24:'seperdua puluh empat'};
const words:Record<number,string>={1:'satu',2:'dua',3:'tiga',4:'empat',5:'lima',6:'enam',7:'tujuh',8:'delapan',9:'sembilan',10:'sepuluh',11:'sebelas'};
const gcd=(a:number,b:number):number=>b?gcd(b,a%b):a;

// A named fraction preserves an unverified count/length rather than inventing
// a weight for a different variety, preparation, or plant part.
function fraction(value:number){
 const whole=Math.floor(value+1e-8),rest=value-whole;
 if(same(rest,0))return String(whole);
 for(const d of [2,3,4,6,8,12,16,24]){
  const n=Math.round(rest*d);if(n<1||!same(n/d,rest))continue;
  const divisor=gcd(n,d),a=n/divisor,b=d/divisor;
  const part=a===1?denominators[b]:`${words[a]||a} ${denominators[b].replace(/^se/,'')}`;
  return whole?`${whole} dan ${part}`:part;
 }
 throw new Error('UNSUPPORTED_QUANTITY_FRACTION');
}

export function practicalQuantity(item:Ingredient,portions:number,originalServings:number):PracticalQuantity{
 if(!Number.isInteger(portions)||portions<1||portions>12||!Number.isFinite(originalServings)||originalServings<=0)throw new Error('INVALID_QUANTITY_PORTIONS');
 const scaled=item.amount*portions/originalServings;
 const measure=item.practicalMeasure;
 const converted=Boolean(measure&&(measure.mode==='always'||!same(scaled,Math.round(scaled))));
 const value=converted?measure!.amount*portions/originalServings:scaled;
 const unit=converted?measure!.unit:item.unit;
 if(!Number.isFinite(value)||value<=0)throw new Error('INVALID_QUANTITY');
 let approximate=converted&&measure!.approximate;
 let text:string;
 if(unit==='gram'||unit==='ml'){
  if(value<1){text=`kurang dari 1 ${unit}`;approximate=true;}
  else{const rounded=Math.round(value);approximate=approximate||!same(value,rounded);if(unit==='ml'&&rounded>=1000){approximate=approximate||!same(Number((rounded/1000).toFixed(2)),rounded/1000);text=`${number.format(rounded/1000)} liter`;}else text=`${number.format(rounded)} ${unit}`;}
 }else if(unit==='sdt'||unit==='sdm'){
  // Small tablespoon amounts become teaspoons, without changing ingredients.
  const teaspoons=unit==='sdm'&&value<=1/3+1e-8;
  const amount=teaspoons?value*3:value,spoon=teaspoons||unit==='sdt'?'sendok teh':'sendok makan';
  if(amount<1/8){text=`kurang dari seperdelapan ${spoon}`;approximate=true;}
  else{
   const whole=Math.floor(amount),rest=amount-whole;
   const options=[0,1/8,1/4,1/3,1/2,2/3,3/4,7/8,1];
   const closest=options.reduce((a,b)=>Math.abs(b-rest)<Math.abs(a-rest)?b:a);
   approximate=approximate||!same(whole+closest,amount);
   text=`${fraction(whole+closest)} ${spoon}`;
  }
 }else{text=`${fraction(value)} ${unit}`;}
 return {text:approximate&&!text.startsWith('kurang dari')?`sekitar ${text}`:text,approximate,preparation:converted?measure!.preparation:undefined,sourceIds:converted?measure!.sourceIds:[]};
}

