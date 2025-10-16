require('dotenv').config();
const express = require('express');
const { BotFrameworkAdapter } = require('botbuilder');
const bot = require('./bot');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3978;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

const adapter = new BotFrameworkAdapter({
  appId: process.env.MicrosoftAppId,
  appPassword: process.env.MicrosoftAppPassword
});

app.post('/api/messages', (req, res) => {
  adapter.processActivity(req, res, async (context) => {
    await bot.run(context);
  });
});

app.post('/notify-turno', require('./bot').notifyTurnoHandler(adapter));
