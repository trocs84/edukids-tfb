import test from 'node:test';
import assert from 'node:assert/strict';
import {sameOrigin} from '../lib/origin';
test('writes reject foreign/missing origins and support local host rewriting',()=>{
 const previous=process.env.APP_ORIGIN,mode=process.env.EDUKIDS_DATA_MODE;
 delete process.env.APP_ORIGIN;process.env.EDUKIDS_DATA_MODE='local';
 const request=(origin?:string)=>new Request('http://localhost:3107/api/auth',{headers:{host:'127.0.0.1:3107',...(origin?{origin}:{})}});
 try {
  assert.equal(sameOrigin(request('http://127.0.0.1:3107')),true);
  assert.equal(sameOrigin(request('https://other.example')),false);
  assert.equal(sameOrigin(request()),false);
  process.env.EDUKIDS_DATA_MODE='supabase';
  assert.equal(sameOrigin(request('http://127.0.0.1:3107')),false);
  process.env.APP_ORIGIN='https://edukids.example';
  assert.equal(sameOrigin(request('https://edukids.example')),true);
  assert.equal(sameOrigin(request('http://edukids.example')),false);
 } finally {
  if(previous===undefined)delete process.env.APP_ORIGIN;else process.env.APP_ORIGIN=previous;
  if(mode===undefined)delete process.env.EDUKIDS_DATA_MODE;else process.env.EDUKIDS_DATA_MODE=mode;
 }
});
