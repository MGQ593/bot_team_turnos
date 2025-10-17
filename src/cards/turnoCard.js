function generar({ turno, estado, ultimaActualizacion, nombre, cedula, telefono, hora, fecha, descripcion }) {
  return {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.5',
        body: [
          {
            type: 'Container',
            style: 'emphasis',
            items: [
              { type: 'TextBlock', text: `TURNO - ${turno}`, weight: 'Bolder', size: 'Medium', color: 'Accent' },
              { type: 'TextBlock', text: estado.toUpperCase(), color: 'Warning', weight: 'Bolder', size: 'Small' },
              { type: 'TextBlock', text: `Última actualización: ${ultimaActualizacion}`, isSubtle: true, size: 'Small' }
            ]
          },
          {
            type: 'FactSet',
            facts: [
              { title: 'Nombre:', value: nombre || '' },
              { title: 'Cédula:', value: cedula || '' },
              { title: 'Teléfono:', value: telefono || '' },
              { title: 'Hora:', value: hora || '' },
              { title: 'Fecha:', value: fecha || '' }
            ]
          },
          { type: 'TextBlock', text: 'Descripción:', weight: 'Bolder', spacing: 'Medium' },
          { type: 'TextBlock', text: descripcion || '', wrap: true }
        ],
        actions: [
          { type: 'Action.Submit', title: 'Llamar Cliente', data: { accion: 'llamar' } },
          { type: 'Action.Submit', title: 'Finalizar', data: { accion: 'finalizar' } },
          { type: 'Action.Submit', title: 'Cancelar', data: { accion: 'cancelar' } }
        ]
      }
    }]
  };
}

function confirmacion(texto) {
  return {
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.5',
    body: [
      { type: 'TextBlock', text: texto, weight: 'Bolder', color: 'Good', size: 'Medium' }
    ]
  };
}

module.exports = { generar, confirmacion };
