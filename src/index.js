require('dotenv').config();
const express = require('express');
const { BotFrameworkAdapter } = require('botbuilder');
const { TeamsBot, notifyTurnoHandler } = require('./bot');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3978;

const adapter = new BotFrameworkAdapter({
  appId: process.env.MicrosoftAppId,
  appPassword: process.env.MicrosoftAppPassword
});

// Instantiate bot after adapter is ready to avoid side-effects at require time
const bot = new TeamsBot();

app.post('/api/messages', (req, res) => {
  adapter.processActivity(req, res, async (context) => {
    await bot.run(context);
  });
});

app.post('/notify-turno', notifyTurnoHandler(adapter));

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
