import {google} from 'googleapis';import MailComposer from 'mailcomposer';import {oauth,refreshAccess} from './google';import type {Session} from './session';
function b64url(s:Buffer|string){return Buffer.from(s).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
export async function sendMail(session:Session,to:string,subject:string,html:string,text:string,files:{filename:string;contentType:string;data:Buffer}[]){
 const o=oauth();o.setCredentials({access_token:session.accessToken,refresh_token:session.refreshToken});
 const composer=new MailComposer({from:session.email,to,subject,html,text,attachments:files.map(f=>({filename:f.filename,content:f.data,contentType:f.contentType}))});
 const raw=await new Promise<Buffer>((resolve,reject)=>composer.compile().build((e,m)=>e?reject(e):resolve(m)));
 try{await google.gmail({version:'v1',auth:o}).users.messages.send({userId:'me',requestBody:{raw:b64url(raw)}});}
 catch(err:any){if(session.refreshToken&&(err?.code===401||err?.response?.status===401)){const access=await refreshAccess(session.refreshToken);session.accessToken=access;o.setCredentials({access_token:access,refresh_token:session.refreshToken});await google.gmail({version:'v1',auth:o}).users.messages.send({userId:'me',requestBody:{raw:b64url(raw)}});}else throw err;}
}