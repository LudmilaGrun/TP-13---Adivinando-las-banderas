export const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
export const shuffle = (items) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
export const initialState = { countries: [], current: null, loading: true, error: '', phase: 'home', mode: 'flags', name: '', score: 0, round: 0, seconds: 15, deadline: 0, options: [], eliminated: [], revealed: [], answer: '', feedback: '', players: [], storageReady: false, storageError: '', search: '' };
export function newRound(state, now) {
  const pool = state.countries.filter(c => (state.mode === 'flags' || c.capital) && c.code !== state.current?.code);
  const current = shuffle(pool)[0];
  if (!current) return { ...state, error: 'No hay países disponibles para este modo.' };
  const choices = state.mode === 'flags' ? [] : shuffle([current.capital, ...shuffle([...new Set(pool.map(c => c.capital).filter(c => c && c !== current.capital))]).slice(0, 2)]);
  return { ...state, current, round: state.round + 1, seconds: 15, deadline: now + 15000, options: choices, eliminated: [], revealed: [], answer: '', search: '', feedback: '', phase: 'playing' };
}
export function gameReducer(state, action) {
  switch (action.type) {
    case 'LOAD': return { ...state, loading: false, countries: action.countries, current: shuffle(action.countries)[0], error: '' };
    case 'ERROR': return { ...state, loading: false, error: action.message };
    case 'LOADING': return { ...state, loading: true, error: '' };
    case 'RESTORE': return { ...state, players: action.players, storageReady: true, storageError: action.error || '' };
    case 'STORAGE_ERROR': return { ...state, storageError: action.message };
    case 'NAME': return { ...state, name: action.value };
    case 'MODE': return { ...state, mode: action.value };
    case 'SEARCH': return { ...state, search: action.value };
    case 'START': return state.name.trim() && state.countries.length ? newRound({ ...state, score: 0, round: 0 }, action.now) : state;
    case 'TICK': {
      if (state.phase !== 'playing') return state;
      const seconds = Math.max(0, Math.ceil((state.deadline - action.now) / 1000));
      const eliminated = [...state.eliminated];
      if (state.mode === 'capitals') {
        const count = Math.min(2, Math.floor((15 - seconds) / 5));
        for (const option of state.options) if (eliminated.length < count && option !== state.current.capital && !eliminated.includes(option)) eliminated.push(option);
      }
      return { ...state, seconds, eliminated, ...(seconds === 0 ? { phase: 'resolved', feedback: `Tiempo agotado. Era ${state.mode === 'flags' ? state.current.label : state.current.capital}.` } : {}) };
    }
    case 'GUESS': {
      if (state.phase !== 'playing' || !action.value || state.eliminated.includes(action.value)) return state;
      if (action.now >= state.deadline) return gameReducer(state, { type: 'TICK', now: action.now });
      const expected = state.mode === 'flags' ? state.current.name : state.current.capital;
      const correct = normalize(action.value) === normalize(expected) || (state.mode === 'flags' && normalize(action.value) === normalize(state.current.label));
      const bonus = Math.max(0, Math.ceil((state.deadline - action.now) / 1000));
      return correct ? { ...state, score: state.score + 10 + bonus, seconds: bonus, phase: 'resolved', feedback: `¡Correcto! +10 puntos +${bonus} por tiempo.` } : { ...state, score: state.score - 1, feedback: 'No es esa. −1 punto. ¡Probá de nuevo!' };
    }
    case 'HINT': {
      if (state.phase !== 'playing' || state.mode !== 'flags') return state;
      if (action.now >= state.deadline) return gameReducer(state, { type: 'TICK', now: action.now });
      const hidden = [...state.current.label].map((letter, i) => /\p{L}/u.test(letter) && !state.revealed.includes(i) ? i : -1).filter(i => i >= 0);
      if (!hidden.length) return state;
      return gameReducer({ ...state, deadline: state.deadline - 2000, revealed: [...state.revealed, shuffle(hidden)[0]] }, { type: 'TICK', now: action.now });
    }
    case 'NEXT': {
      if (state.phase !== 'resolved') return state;
      if (state.round < 10) return newRound(state, action.now);
      const entry = { id: action.id, name: state.name.trim(), score: state.score, mode: state.mode, date: new Date(action.now).toISOString() };
      return { ...state, phase: 'finished', players: [...state.players, entry].sort((a, b) => b.score - a.score).slice(0, 50) };
    }
    case 'HOME': return { ...state, phase: 'home', score: 0, round: 0, feedback: '' };
    default: return state;
  }
}
