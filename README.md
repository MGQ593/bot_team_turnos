# Bot de Microsoft Teams para Turnos

## Requisitos
- Node.js >= 14
- PostgreSQL

## Variables de entorno
Copia `.env.example` a `.env` y completa los valores.

## Instalación
```
npm install
```

## Ejecución
```
node src/index.js
```

## Pruebas locales
- Usa Bot Framework Emulator para probar el bot localmente.

## Registro en Azure
1. Ve a Azure Portal y crea un recurso Azure Bot.
2. Configura el canal Microsoft Teams.
3. Usa el AppId y AppPassword en tu `.env`.

## Configuración n8n
- Configura n8n para enviar datos a `/notify-turno` con los campos:
  - `numero_turno`, `agencia_id`, `estado`, `team_aad_group_id`, `channel_id`, `DatosClienteSCP`, `fecha`, `celularturno`

## Estructura
- `src/index.js`: arranque y servidor
- `src/bot.js`: lógica principal
- `src/cards/turnoCard.js`: genera la Adaptive Card
