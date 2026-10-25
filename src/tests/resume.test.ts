import test from 'node:test';
import assert from 'node:assert/strict';
import {pendingSession,type StoredSession} from '../lib/ui-data';
import {makeItems} from '../lib/games';

const item=makeItems('catch',1)[0];
const base:StoredSession={id:'session-1',activity_id:'catch',level:1,status:'active',created_at:'2026-10-24T00:00:00Z',responses:[]};
const response=(correct:boolean,attempt_no:number)=>({item_id:item.id,answer:correct?item.solution:[item.solution[0]-1],correct,hint_used:false,latency_ms:500,exposure_ms:0,attempt_no});

test('una partida activa sin respuestas se recupera desde el primer reto',()=>{
 assert.deepEqual(pendingSession([base]),{id:base.id,game:'catch',level:1,round:0,attemptNo:1,feedback:'',attempts:[]});
});

test('un primer fallo guardado vuelve al mismo reto y permite el segundo intento',()=>{
 const state=pendingSession([{...base,responses:[response(false,1)]}]);
 assert.equal(state?.round,0);
 assert.equal(state?.feedback,'retry');
 assert.equal(state?.attempts.length,1);
});

test('los retos cerrados avanzan y el quinto conserva el paso de finalización',()=>{
 const responses=makeItems('catch',1).map(i=>({item_id:i.id,answer:i.solution,correct:true,hint_used:false,latency_ms:500,exposure_ms:0,attempt_no:1}));
 assert.equal(pendingSession([{...base,responses:responses.slice(0,2)}])?.round,2);
 const final=pendingSession([{...base,responses}]);
 assert.equal(final?.round,4);
 assert.equal(final?.feedback,'correct');
 assert.equal(final?.attempts.length,5);
});

test('una sesión terminada no aparece como partida pendiente',()=>{
 assert.equal(pendingSession([{...base,status:'completed'}]),null);
});
