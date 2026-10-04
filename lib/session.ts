import {cookies} from 'next/headers';import {EncryptJWT,jwtDecrypt} from 'jose';import {env} from './config';
const COOKIE='multiapply_session';function key(){return new TextEncoder().encode(env().SESSION_SECRET.padEnd(32,'0').slice(0,32));}
export type Session={email:string;name?:string;accessToken:string;refreshToken?:string;expiresAt:number};
export async function setSession(s:Session){const token=await new EncryptJWT(s).setProtectedHeader({alg:'dir',enc:'A256GCM'}).setIssuedAt().setExpirationTime('30d').encrypt(key());(await cookies()).set(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:2592000});}
export async function getSession(){const c=(await cookies()).get(COOKIE)?.value;if(!c)return null;try{return(await jwtDecrypt(c,key())).payload as unknown as Session}catch{return null;}}
export async function clearSession(){(await cookies()).delete(COOKIE);}