// QUEST DAY production-safe smoke test: create ONE disposable anonymous user.
// It never supplies a target user ID to the deletion API and never touches
// existing users. A cleanup attempt is made in finally on any test failure.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const text=readFileSync(new URL('../realtime-config.js',import.meta.url),'utf8');
const url=text.match(/\burl:\s*["']([^"']+)["']/)?.[1];
const key=text.match(/\bpublishableKey:\s*["']([^"']+)["']/)?.[1];
assert(url && url.startsWith('https://'),'Missing public Supabase URL');
assert(key && key.startsWith('sb_publishable_'),'Missing public Supabase key');
const functionUrl=url+'/functions/v1/quest-day-delete-account';
const origin='https://leaple.github.io';
const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const expectStatus=(value,expected,reason)=>{
  assert.equal(value,expected,reason+': expected '+expected+', received '+value);
};
const invoke=async confirmation=>{
  const {data,error}=await client.functions.invoke('quest-day-delete-account',{
    body:{confirmation}
  });
  let details=data;
  if(error?.context){
    try{details=await error.context.json();}catch(_){}
  }
  return {data,error,details,status:error?.context?.status||200};
};
let ownedId='',deleted=false,created=false;
try {
  // Test public CORS and rejection of unauthenticated requests BEFORE signup.
  const preflight=await fetch(functionUrl,{
    method:'OPTIONS',
    headers:{origin,apikey:key,'access-control-request-method':'POST','access-control-request-headers':'authorization,apikey,content-type'}
  });
  expectStatus(preflight.status,204,'Browser CORS preflight');
  assert.equal(preflight.headers.get('access-control-allow-origin'),origin,
    'CORS header must match the QUEST DAY origin');
  console.log('PASS: Browser CORS preflight (204)');

  const unauthorized=await fetch(functionUrl,{
    method:'POST',
    headers:{'content-type':'application/json',apikey:key,origin},
    body:JSON.stringify({confirmation:'계정 삭제'})
  });
  expectStatus(unauthorized.status,401,'Unauthenticated deletion');
  console.log('PASS: Unauthorized deletion rejected (401)');

  const createdResult=await client.auth.signInAnonymously({
    options:{data:{quest_day_disposable_smoke_test:'2026-11-15'}}
  });
  if(createdResult.error)throw createdResult.error;
  const user=createdResult.data?.user;
  assert(user?.id && user.is_anonymous===true,'Refuse testing a non-disposable account');
  ownedId=user.id;created=true;
  console.log('DISPOSABLE_TEST_USER_ID='+ownedId);

  const boot=await client.rpc('qd_bootstrap');
  if(boot.error)throw Error('Test profile setup: '+boot.error.message);
  const cloud=await client.rpc('qd_cloud_write',{
    payload:{tasks:[],events:[],test_source:'quest-day-ci-delete-smoke'},
    expected_revision:0
  });
  if(cloud.error)throw Error('Test cloud data setup: '+cloud.error.message);
  const profile=await client.from('qd_profiles').select('user_id').eq('user_id',ownedId).single();
  assert(!profile.error && profile.data?.user_id===ownedId,'Test profile not created');
  const save=await client.from('qd_cloud_saves').select('user_id').eq('user_id',ownedId).single();
  assert(!save.error && save.data?.user_id===ownedId,'Test cloud save not created');
  console.log('PASS: Created isolated test profile + cloud save');

  const invalid=await invoke('invalid-confirmation');
  expectStatus(invalid.status,400,'Missing confirmation');
  const stillSignedIn=await client.auth.getUser();
  assert(!stillSignedIn.error && stillSignedIn.data.user?.id===ownedId,
    'Refused deletion must preserve test account');
  console.log('PASS: Invalid confirmation rejected; account retained');

  const result=await invoke('계정 삭제');
  if(result.error || result.data?.deleted!==true)
    throw Error('Deletion failure: HTTP '+result.status+' '+
      JSON.stringify(result.details||result.error?.message||result.data));
  deleted=true;
  console.log('PASS: Server confirmed account deletion');
  const accessToken=createdResult.data.session?.access_token;
  assert(accessToken,'Test account missing access token');
  const verification=await fetch(url+'/auth/v1/user',{
    headers:{apikey:key,authorization:'Bearer '+accessToken}
  });
  assert(!verification.ok,'Deleted account access token still resolves to a user');
  console.log('PASS: Deleted Auth user is no longer retrievable (HTTP '+verification.status+')');
} catch(error){
  console.error('FAIL: '+String(error?.message||error));
  process.exitCode=1;
} finally {
  if(created&&!deleted){
    // Never leave a test account voluntarily; deletion is only by its own JWT.
    const retry=await invoke('계정 삭제').catch(e=>({error:e}));
    if(retry.data?.deleted===true){
      deleted=true;console.log('CLEANUP: Deleted disposable account after test failure');
    }else{
      console.error('MANUAL_CLEANUP_REQUIRED_DISPOSABLE_TEST_USER_ID='+ownedId);
    }
  }
}
if(deleted&&process.exitCode!==1)console.log('RESULT: all deletion smoke tests passed');
