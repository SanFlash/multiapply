declare module 'mailcomposer' {
  interface Attachment { filename:string; content:Buffer; contentType:string }
  interface Options { from:string; to:string; subject:string; html?:string; text?:string; attachments?:Attachment[] }
  interface Compiler { build(cb:(error:Error|null,message:Buffer)=>void):void }
  class MailComposer { constructor(options:Options); compile():Compiler }
  export = MailComposer;
}