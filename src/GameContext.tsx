import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { gameReducer, initialState } from './game';

type Country = { name: string; label: string; code: string; flag: string; capital: string };
type Player = { id: string; name: string; score: number; mode: string; date: string };
type State = Omit<typeof initialState, 'current' | 'countries' | 'players' | 'options' | 'eliminated' | 'revealed'> & { current: Country | null; countries: Country[]; players: Player[]; options: string[]; eliminated: string[]; revealed: number[] };
const GameContext = createContext<{ state: State; dispatch: React.Dispatch<any>; load: () => void; guess: (value: string) => void; nextCountry: () => void; resetScore: () => void } | null>(null);
const KEY = '@fun-with-flags/ranking-v1';
export function GameProvider({ children }: { children: React.ReactNode }) {
  const [rawState, dispatch] = useReducer(gameReducer, initialState);
  const state = rawState as State;
  const request = useRef<AbortController | null>(null);
  const load = async () => {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    dispatch({ type: 'LOADING' });
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const fetchData = async (path: string) => {
        const response = await fetch(`https://countriesnow.space/api/v0.1/countries/${path}`, { signal: controller.signal });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const body = await response.json();
        if (body.error || !Array.isArray(body.data)) throw new Error('Respuesta inválida');
        return body.data;
      };
      const [flags, capitals] = await Promise.all([fetchData('flag/images'), fetchData('capital')]);
      const displayNames = new Intl.DisplayNames(['es'], { type: 'region' });
      const countries: Country[] = flags.filter((c: any) => typeof c.name === 'string' && /^[A-Z]{2}$/.test(c.iso2) && typeof c.flag === 'string' && c.flag.startsWith('https://')).map((c: any) => ({ name: c.name, label: displayNames.of(c.iso2) || c.name, code: c.iso2, flag: c.flag, capital: capitals.find((x: any) => x.iso2 === c.iso2)?.capital?.trim() || '' }));
      if (countries.length < 3 || new Set(countries.map(c => c.capital).filter(Boolean)).size < 3) throw new Error('Datos insuficientes');
      dispatch({ type: 'LOAD', countries });
    } catch {
      if (request.current === controller) dispatch({ type: 'ERROR', message: 'No pudimos cargar los países. Revisá tu conexión y volvé a intentar.' });
    } finally { clearTimeout(timeout); }
  };
  useEffect(() => { load(); return () => request.current?.abort(); }, []);
  useEffect(() => {
    AsyncStorage.getItem(KEY).then(value => {
      const data = value ? JSON.parse(value) : [];
      if (!Array.isArray(data)) throw new Error('Ranking inválido');
      const players = data.filter(p => typeof p.name === 'string' && typeof p.id === 'string' && Number.isFinite(p.score) && ['flags', 'capitals'].includes(p.mode)).slice(0, 50);
      dispatch({ type: 'RESTORE', players });
    }).catch(() => dispatch({ type: 'RESTORE', players: [], error: 'No se pudo recuperar el ranking guardado.' }));
  }, []);
  useEffect(() => {
    if (state.storageReady) AsyncStorage.setItem(KEY, JSON.stringify(state.players)).catch(() => dispatch({ type: 'STORAGE_ERROR', message: 'El ranking no se pudo guardar en este dispositivo.' }));
  }, [state.players, state.storageReady]);
  useEffect(() => {
    if (state.phase !== 'playing') return;
    const tick = () => dispatch({ type: 'TICK', now: Date.now() });
    const interval = setInterval(tick, 200);
    const subscription = AppState.addEventListener('change', status => { if (status === 'active') tick(); });
    return () => { clearInterval(interval); subscription.remove(); };
  }, [state.phase]);
  return <GameContext.Provider value={{ state, dispatch, load, guess: value => dispatch({ type: 'GUESS', value, now: Date.now() }), nextCountry: () => dispatch({ type: 'NEXT', now: Date.now(), id: `${Date.now()}-${Math.random()}` }), resetScore: () => dispatch({ type: 'HOME' }) }}>{children}</GameContext.Provider>;
}
export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame requiere GameProvider');
  return context;
}
