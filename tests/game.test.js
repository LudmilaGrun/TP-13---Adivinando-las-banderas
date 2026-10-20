import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gameReducer, initialState } from '../src/game.js';
const countries = [{ code: 'AR', name: 'Argentina', label: 'Argentina', capital: 'Buenos Aires' }, { code: 'BR', name: 'Brazil', label: 'Brasil', capital: 'Brasilia' }, { code: 'CL', name: 'Chile', label: 'Chile', capital: 'Santiago' }, { code: 'UY', name: 'Uruguay', label: 'Uruguay', capital: 'Montevideo' }];
const start = (mode = 'flags') => gameReducer({ ...initialState, countries, name: 'Ana', mode }, { type: 'START', now: 1000 });
test('acierto suma diez y segundos, no suma dos veces, cambia de país', () => {
  const state = start();
  const result = gameReducer(state, { type: 'GUESS', value: state.current.name, now: 4000 });
  assert.equal(result.score, 22); assert.equal(result.phase, 'resolved');
  assert.equal(gameReducer(result, { type: 'GUESS', value: state.current.name, now: 4000 }).score, 22);
  const next = gameReducer(result, { type: 'NEXT', now: 5000 });
  assert.notEqual(next.current.code, state.current.code); assert.equal(next.seconds, 15);
});
test('error resta uno y permite reintentar', () => {
  const result = gameReducer(start(), { type: 'GUESS', value: 'Incorrecto', now: 2000 });
  assert.equal(result.score, -1); assert.equal(result.phase, 'playing');
});
test('pista revela una letra y descuenta dos segundos', () => {
  const result = gameReducer(start(), { type: 'HINT', now: 1000 });
  assert.equal(result.revealed.length, 1); assert.equal(result.seconds, 13); assert.equal(result.deadline, 14000);
});
test('el reloj vence al volver de segundo plano y rechaza aciertos tardíos', () => {
  const state = start();
  assert.equal(gameReducer(state, { type: 'TICK', now: 30000 }).phase, 'resolved');
  const result = gameReducer(state, { type: 'GUESS', value: state.current.name, now: 16000 });
  assert.equal(result.score, 0); assert.equal(result.seconds, 0);
});
test('capitales tiene tres opciones distintas y elimina incorrectas cada cinco segundos', () => {
  const state = start('capitals');
  assert.equal(new Set(state.options).size, 3); assert.ok(state.options.includes(state.current.capital));
  const first = gameReducer(state, { type: 'TICK', now: 6000 }); assert.equal(first.eliminated.length, 1);
  const result = gameReducer(first, { type: 'TICK', now: 11000 });
  assert.equal(result.eliminated.length, 2); assert.ok(!result.eliminated.includes(state.current.capital));
  assert.equal(gameReducer(result, { type: 'GUESS', value: result.eliminated[0], now: 12000 }).score, 0);
});
test('diez rondas guardan un solo resultado en ranking', () => {
  let state = start();
  for (let i = 0; i < 10; i++) {
    state = gameReducer(state, { type: 'GUESS', value: state.current.name, now: 1000 });
    state = gameReducer(state, { type: 'NEXT', now: 1000, id: 'partida' });
  }
  assert.equal(state.phase, 'finished'); assert.equal(state.players.length, 1); assert.equal(state.score, 250);
  assert.equal(gameReducer(state, { type: 'NEXT', now: 1000, id: 'otra' }).players.length, 1);
});
