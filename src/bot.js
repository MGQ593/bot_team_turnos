const { TeamsActivityHandler, CardFactory } = require('botbuilder');
const fetch = require('node-fetch');
const { Pool } = require('pg');
const turnoCard = require('./cards/turnoCard');

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DB,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD
});

class TeamsBot extends TeamsActivityHandler {
  constructor() {
    super();
    this.onMessage(async (context, next) => {
      if (!context.activity || !context.activity.text) {
        await next();
        return;
      }
      const text = context.activity.text.trim().toLowerCase();
      if (text.startsWith('registrar agencia')) {
        const agenciaId = text.split('registrar agencia')[1].trim();
        const ref = TeamsBot.getConversationReference(context.activity);
        await pool.query(
          `INSERT INTO turnos_ia.teams_canales (agencia_id, team_id, channel_id, service_url, conversation_reference) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (agencia_id) DO UPDATE SET team_id=$2, channel_id=$3, service_url=$4, conversation_reference=$5`,
          [agenciaId, context.activity.conversation.tenantId, context.activity.conversation.id, context.activity.serviceUrl, JSON.stringify(ref)]
        );
        await context.sendActivity(`Agencia ${agenciaId} registrada.`);
      }
      await next();
    });
    this.onInvokeActivity(async (context) => {
      if (!context.activity || !context.activity.value) {
        return { status: 200 };
      }
      const verb = context.activity.value.verb;
      const data = context.activity.value || {};
      if (verb === 'turno_llamar') {
        await handleLlamarCliente(context, data);
      } else if (verb === 'turno_finalizar') {
        await handleFinalizar(context, data);
      } else if (verb === 'turno_cancelar') {
        await handleCancelar(context, data);
      }
      return { status: 200 };
    });
  }

  static getConversationReference(activity) {
    const { channelId, conversation, serviceUrl, from, recipient } = activity;
    return { channelId, conversation, serviceUrl, from, recipient };
  }
}

async function handleLlamarCliente(context, data) {
  // Buscar módulo y asesor en la BD
  const res = await pool.query('SELECT modulo, asesor FROM turnos_ia.asignaciones_asesores WHERE agencia_id = $1 LIMIT 1', [data.agencia_id]);
  const { modulo, asesor } = res.rows[0] || {};
  // Llamar webhook externo
  await fetch(process.env.ASIGNAR_TURNO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      numero_turno: data.numero_turno,
      agencia_id: data.agencia_id,
      modulo,
      asesor
    })
  });
  await context.sendActivity({ attachments: [CardFactory.adaptiveCard(turnoCard.confirmacion('✅ Turno asignado al cliente'))] });
}

async function handleFinalizar(context, data) {
  await pool.query("UPDATE turnos_ia.turnos SET estado = 'finalizado', updated_at = now() WHERE numero_turno = $1", [data.numero_turno]);
  await context.sendActivity({ attachments: [CardFactory.adaptiveCard(turnoCard.confirmacion('✅ Turno finalizado'))] });
}

async function handleCancelar(context, data) {
  await pool.query("UPDATE turnos_ia.turnos SET estado = 'cancelado', updated_at = now(), fecha_cancelacion = now() WHERE numero_turno = $1", [data.numero_turno]);
  await context.sendActivity({ attachments: [CardFactory.adaptiveCard(turnoCard.confirmacion('🚫 Turno cancelado'))] });
}

function notifyTurnoHandler(adapter) {
  return async (req, res) => {
    const body = req.body;
    let teamId = body.team_aad_group_id;
    let channelId = body.channel_id;
    let serviceUrl;
    let conversationReference;
    if (!teamId || !channelId) {
      // Buscar en BD
      const result = await pool.query('SELECT team_id, channel_id, service_url, conversation_reference FROM turnos_ia.teams_canales WHERE agencia_id = $1 LIMIT 1', [body.agencia_id]);
      if (result.rows.length) {
        teamId = result.rows[0].team_id;
        channelId = result.rows[0].channel_id;
        serviceUrl = result.rows[0].service_url;
        conversationReference = JSON.parse(result.rows[0].conversation_reference);
      }
    }
    if (teamId && channelId && serviceUrl && conversationReference) {
      await adapter.createConversation(conversationReference, async (context) => {
        await context.sendActivity(turnoCard.generar({
          turno: body.numero_turno,
          estado: body.estado,
          ultimaActualizacion: body.fecha,
          nombre: body.DatosClienteSCP?.nombre,
          cedula: body.DatosClienteSCP?.cedula,
          telefono: body.celularturno,
          hora: body.DatosClienteSCP?.hora,
          fecha: body.DatosClienteSCP?.fecha,
          descripcion: body.DatosClienteSCP?.descripcion
        }));
      });
      res.send(200, { ok: true });
    } else {
      res.send(400, { error: 'No se encontró canal para la agencia.' });
    }
  };
}

module.exports = new TeamsBot();
module.exports.notifyTurnoHandler = notifyTurnoHandler;
