import {z} from 'zod';
export const MAX_ADVISOR_TURNS=6;
export const advisorTurnSchema=z.object({question:z.string().trim().min(1).max(500),answer:z.string().trim().min(1).max(6000),stepIndex:z.number().int().nonnegative(),portions:z.number().int().min(1).max(12)}).strict();
export type AdvisorTurn=z.infer<typeof advisorTurnSchema>;
export const savedAdvisorTurnSchema=advisorTurnSchema.extend({id:z.string().min(1).max(64)});
export type SavedAdvisorTurn=z.infer<typeof savedAdvisorTurnSchema>;
const storedSchema=z.object({version:z.literal(1),recipeId:z.string(),recipeVersion:z.number().int().positive(),turns:z.array(savedAdvisorTurnSchema).max(MAX_ADVISOR_TURNS)}).strict();
type Stored=z.infer<typeof storedSchema>;
const fallback=new Map<string,Stored>();
const unsaved=new Set<string>();
export const advisorStorageKey=(id:string)=>'rn:advisor:'+id;
function empty(recipeId:string,recipeVersion:number):Stored{return {version:1,recipeId,recipeVersion,turns:[]};}
export function readAdvisorHistory(recipeId:string,recipeVersion:number,stepCount:number){
 const key=advisorStorageKey(recipeId);let available=true,stored:Stored|undefined;
 if(unsaved.has(key)){available=false;stored=fallback.get(key);}else{
  let raw:string|null=null;
  try{raw=sessionStorage.getItem(key);}catch{available=false;stored=fallback.get(key);}
  if(raw){try{const parsed=storedSchema.safeParse(JSON.parse(raw));if(parsed.success)stored=parsed.data;else throw Error('INVALID_HISTORY');}catch{fallback.delete(key);try{sessionStorage.removeItem(key);}catch{available=false;}}}
 }
 if(stored&&(stored.recipeId!==recipeId||stored.recipeVersion!==recipeVersion||stored.turns.some(t=>t.stepIndex>=stepCount))){stored=undefined;fallback.delete(key);try{sessionStorage.removeItem(key);}catch{available=false;}}
 const result=stored??empty(recipeId,recipeVersion);fallback.set(key,result);return {turns:result.turns,available};
}
export function saveAdvisorHistory(recipeId:string,recipeVersion:number,turns:SavedAdvisorTurn[]){
 const value={...empty(recipeId,recipeVersion),turns:turns.slice(-MAX_ADVISOR_TURNS)};fallback.set(advisorStorageKey(recipeId),value);
 try{sessionStorage.setItem(advisorStorageKey(recipeId),JSON.stringify(value));unsaved.delete(advisorStorageKey(recipeId));return true;}catch{unsaved.add(advisorStorageKey(recipeId));return false;}
}
export function clearAdvisorHistory(recipeId:string,recipeVersion:number){fallback.set(advisorStorageKey(recipeId),empty(recipeId,recipeVersion));try{sessionStorage.removeItem(advisorStorageKey(recipeId));unsaved.delete(advisorStorageKey(recipeId));return true;}catch{unsaved.add(advisorStorageKey(recipeId));return false;}}
export function serializeAdvisorRequest(base:{recipeId:string;stepIndex:number;portions:number;ingredientIds:string[];question:string},turns:SavedAdvisorTurn[]){
 const history=turns.slice(-MAX_ADVISOR_TURNS).map(({question,answer,stepIndex,portions})=>({question,answer,stepIndex,portions}));
 let body=JSON.stringify({...base,history});while(history.length&&new TextEncoder().encode(body).byteLength>60*1024){history.shift();body=JSON.stringify({...base,history});}return body;
}
