# TP 13 · Fun with Flags

Juego móvil con React Native, TypeScript y Expo. Toda la información y lógica del juego vive en `src/GameContext.tsx` y su reducer `src/game.js`. Flag, GuessForm, ScoreBoard, Timer, Hints y Leaderboard consumen `useGame`; no reciben datos del juego por props.

## Ejecutar en un celular físico

1. Ejecutá `npm install` en esta carpeta.
2. Instalá Expo Go en Android o iPhone, compatible con Expo SDK 58.
3. Conectá computadora y teléfono a la misma red Wi-Fi.
4. Ejecutá `npm start` y dejá la terminal abierta.
5. Escaneá el QR con Expo Go en Android o Cámara en iPhone. No uses la opción web.
6. Si la red bloquea LAN, probá `npx expo start --go --tunnel`; puede solicitar instalar la dependencia de túnel.

La carga inicial requiere Internet. Las banderas SVG se muestran con react-native-svg.

## Reglas y extras

- Nombre de jugador y modos Banderas / Capitales. Partidas de 10 rondas.
- Países en español, buscables también por el nombre inglés de la API.
- Acierto: +10 más segundos restantes; luego tocá Siguiente bandera. Error: −1 y podés reintentar. Se admiten puntajes negativos.
- Timer de 15 segundos con fecha límite real, incluso al minimizar. Tiempo agotado muestra respuesta sin penalización adicional.
- Pistas: letra aleatoria sin repetir, con costo de 2 segundos.
- Capitales: tres opciones distintas; descarta una incorrecta a los 5 segundos y otra a los 10. Las capitales conservan los nombres de la API.
- Multijugador local por turnos: terminá, cambiá nombre y jugá otra partida. Ranking separado por modo; conserva las mejores 50 partidas y muestra las 5 mejores del modo.
- Persistencia con AsyncStorage, equivalente nativo de localStorage. Conserva resultados al cerrar la app; no conserva partidas en curso. Abandonar no guarda el resultado incompleto.
- Estados de carga y error con reintento. Países sin capital excluidos del modo Capitales.

## APIs

- https://countriesnow.space/api/v0.1/countries/flag/images
- https://countriesnow.space/api/v0.1/countries/capital

Se consultan al montar GameProvider con useEffect, se relacionan por iso2 y se elige un país aleatorio sin repetición inmediata. Se respeta la información de la API, que puede contener nombres o capitales desactualizadas.

## Verificación técnica

- `npm run check`: TypeScript.
- `npm test`: puntajes, pistas, vencimiento, opciones y cierre de partidas.
- `npx expo install --check`: dependencias compatibles.
- `npx expo export --platform android`: bundle nativo; no reemplaza prueba física.

## Prueba física pendiente (obligatoria para entregar)

No se declara probado en un teléfono desde este entorno. Ejecutar estos casos en Expo Go y adjuntar capturas o video reales:

- [ ] Registrar modelo del celular, sistema operativo, versión de Expo Go y fecha.
- [ ] Ingresar nombre y visualizar bandera y puntaje.
- [ ] Arriesgar incorrecta (−1) y correcta (+10 + tiempo).
- [ ] Pedir pista y comprobar −2 segundos.
- [ ] Agotar timer; minimizar y volver después de 15 segundos.
- [ ] Capitales: tres opciones y descarte a los 5 y 10 segundos.
- [ ] Completar 10 rondas y jugar con otro nombre.
- [ ] Cerrar y reabrir Expo Go y comprobar ranking persistido.
- [ ] Iniciar sin Internet y reintentar con conexión.

No entregar capturas del navegador como evidencia móvil.
