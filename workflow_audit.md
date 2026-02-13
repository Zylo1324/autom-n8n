# Workflow audit

## Inventario de nodos

| # | name | type | parameters.path | conexiones principales |
|---|---|---|---|---|
| 1 | Webhook Verify | n8n-nodes-base.webhook | whatsapp-in-verify | 0:IF verify ok |
| 2 | Webhook Events | n8n-nodes-base.webhook | whatsapp-in-events | 0:Respond 200 ASAP |
| 3 | IF verify ok | n8n-nodes-base.if |  | 0:Respond verify OK; 1:Respond verify INVALID |
| 4 | Respond verify OK | n8n-nodes-base.respondToWebhook |  |  |
| 5 | Respond verify INVALID | n8n-nodes-base.respondToWebhook |  |  |
| 6 | Normalizar y validar | n8n-nodes-base.code |  | 0:IF tiene mensaje |
| 7 | IF Secret válido | n8n-nodes-base.if |  | 0:Preparar buffer |
| 8 | Preparar buffer | n8n-nodes-base.set |  | 0:Append inbox_buffer |
| 9 | Append inbox_buffer | n8n-nodes-base.googleSheets |  |  |
| 10 | Cron Procesador | n8n-nodes-base.cron |  | 0:Read inbox_buffer |
| 11 | Read inbox_buffer | n8n-nodes-base.googleSheets |  | 0:Agrupar y debounce |
| 12 | Agrupar y debounce | n8n-nodes-base.code |  | 0:Set Owner WhatsApp |
| 13 | Set Owner WhatsApp | n8n-nodes-base.set |  | 0:IF Owner |
| 14 | IF Owner | n8n-nodes-base.if |  | 0:Parse comando admin; 1:Read clientes |
| 15 | Parse comando admin | n8n-nodes-base.code |  | 0:Read clientes (admin) |
| 16 | Read clientes (admin) | n8n-nodes-base.googleSheets |  | 0:Read pagos (admin) |
| 17 | Read pagos (admin) | n8n-nodes-base.googleSheets |  | 0:Preparar acción admin |
| 18 | Preparar acción admin | n8n-nodes-base.code |  | 0:Aplanar update.data |
| 19 | Aplanar update.data | n8n-nodes-base.code |  | 0:Switch update.sheet |
| 20 | Update cliente | n8n-nodes-base.googleSheets |  | 0:Enviar WhatsApp owner |
| 21 | Update pago | n8n-nodes-base.googleSheets |  | 0:Enviar WhatsApp owner |
| 22 | Enviar WhatsApp owner | n8n-nodes-base.httpRequest |  | 0:Preparar log admin |
| 23 | Preparar log admin | n8n-nodes-base.code |  | 0:Log admin |
| 24 | Log admin | n8n-nodes-base.googleSheets |  | 0:Preparar buffer DONE (admin) |
| 25 | Marcar buffer DONE (admin) | n8n-nodes-base.googleSheets |  |  |
| 26 | Filtrar DONE (admin) | n8n-nodes-base.set |  | 0:Marcar buffer DONE (admin) |
| 27 | Read clientes | n8n-nodes-base.googleSheets |  | 0:Buscar cliente |
| 28 | Buscar cliente | n8n-nodes-base.code |  | 0:IF Cliente existe |
| 29 | IF Cliente existe | n8n-nodes-base.if |  | 0:Read mensajes_log; 1:Enviar alta cliente |
| 30 | Enviar alta cliente | n8n-nodes-base.httpRequest |  | 0:Preparar log nuevo |
| 31 | Preparar log nuevo | n8n-nodes-base.code |  | 0:Log nuevo cliente |
| 32 | Log nuevo cliente | n8n-nodes-base.googleSheets |  | 0:Preparar buffer DONE (nuevo) |
| 33 | Marcar buffer DONE (nuevo) | n8n-nodes-base.googleSheets |  |  |
| 34 | Filtrar DONE (nuevo) | n8n-nodes-base.set |  | 0:Marcar buffer DONE (nuevo) |
| 35 | Read mensajes_log | n8n-nodes-base.googleSheets |  | 0:Construir contexto |
| 36 | Construir contexto | n8n-nodes-base.code |  | 0:OpenAI Texto |
| 37 | OpenAI Texto | n8n-nodes-base.httpRequest |  | 0:Extraer respuesta IA |
| 38 | Extraer respuesta IA | n8n-nodes-base.code |  | 0:IF Tiene imagen |
| 39 | IF Tiene imagen | n8n-nodes-base.if |  | 0:Get media url; 1:Enviar respuesta IA |
| 40 | Get media url | n8n-nodes-base.httpRequest |  | 0:Download media |
| 41 | Download media | n8n-nodes-base.httpRequest |  | 0:Preparar imagen |
| 42 | Preparar imagen | n8n-nodes-base.code |  | 0:OpenAI Vision |
| 43 | OpenAI Vision | n8n-nodes-base.httpRequest |  | 0:Validar comprobante |
| 44 | Validar comprobante | n8n-nodes-base.code |  | 0:IF Visión OK |
| 45 | IF Visión OK | n8n-nodes-base.if |  | 0:Preparar pago; 1:Pedir datos |
| 46 | Preparar pago | n8n-nodes-base.code |  | 0:Crear pago pendiente |
| 47 | Crear pago pendiente | n8n-nodes-base.googleSheets |  | 0:Avisar owner |
| 48 | Avisar owner | n8n-nodes-base.httpRequest |  | 0:Avisar cliente pending |
| 49 | Avisar cliente pending | n8n-nodes-base.httpRequest |  |  |
| 50 | Pedir datos | n8n-nodes-base.httpRequest |  |  |
| 51 | Enviar respuesta IA | n8n-nodes-base.httpRequest |  | 0:Preparar log respuesta IA, Payload ultimo_contacto limpio |
| 52 | Payload ultimo_contacto limpio | n8n-nodes-base.code |  | 0:Actualizar ultimo_contacto |
| 53 | Actualizar ultimo_contacto | n8n-nodes-base.googleSheets |  | 0:Preparar buffer DONE (cliente) |
| 54 | Marcar buffer DONE (cliente) | n8n-nodes-base.googleSheets |  |  |
| 55 | Filtrar DONE (cliente) | n8n-nodes-base.set |  | 0:Marcar buffer DONE (cliente) |
| 56 | Cron Recordatorios | n8n-nodes-base.cron |  | 0:Read clientes (recordatorios) |
| 57 | Read clientes (recordatorios) | n8n-nodes-base.googleSheets |  | 0:Read logs (recordatorios) |
| 58 | Read logs (recordatorios) | n8n-nodes-base.googleSheets |  | 0:Construir recordatorios |
| 59 | Construir recordatorios | n8n-nodes-base.code |  | 0:Enviar recordatorio |
| 60 | Enviar recordatorio | n8n-nodes-base.httpRequest |  | 0:Preparar log recordatorio |
| 61 | Preparar log recordatorio | n8n-nodes-base.code |  | 0:Log recordatorio |
| 62 | Log recordatorio | n8n-nodes-base.googleSheets |  |  |
| 63 | Cron Reportes | n8n-nodes-base.cron |  | 0:Read clientes (reportes) |
| 64 | Read clientes (reportes) | n8n-nodes-base.googleSheets |  | 0:Construir reporte |
| 65 | Construir reporte | n8n-nodes-base.code |  | 0:Enviar reporte |
| 66 | Enviar reporte | n8n-nodes-base.httpRequest |  | 0:Preparar log reporte |
| 67 | Preparar log reporte | n8n-nodes-base.code |  | 0:Log reporte |
| 68 | Log reporte | n8n-nodes-base.googleSheets |  |  |
| 69 | Preparar buffer DONE (admin) | n8n-nodes-base.code |  | 0:Filtrar DONE (admin) |
| 70 | Preparar buffer DONE (nuevo) | n8n-nodes-base.code |  | 0:Filtrar DONE (nuevo) |
| 71 | Preparar buffer DONE (cliente) | n8n-nodes-base.code |  | 0:Filtrar DONE (cliente) |
| 72 | Switch update.sheet | n8n-nodes-base.switch |  |  |
| 73 | Preparar log respuesta IA | n8n-nodes-base.code |  | 0:Log respuesta IA |
| 74 | Log respuesta IA | n8n-nodes-base.googleSheets |  |  |
| 75 | Respond 200 ASAP | n8n-nodes-base.respondToWebhook |  | 0:Normalizar y validar |
| 76 | IF tiene mensaje | n8n-nodes-base.if |  | 0:IF Secret válido |

## Nodos Google Sheets con credencial
- Append inbox_buffer: Google Sheets account
- Read inbox_buffer: Google Sheets account
- Read clientes (admin): Google Sheets account
- Read pagos (admin): Google Sheets account
- Update cliente: Google Sheets account
- Update pago: Google Sheets account
- Log admin: Google Sheets account
- Marcar buffer DONE (admin): Google Sheets account
- Read clientes: Google Sheets account
- Log nuevo cliente: Google Sheets account
- Marcar buffer DONE (nuevo): Google Sheets account
- Read mensajes_log: Google Sheets account
- Crear pago pendiente: Google Sheets account
- Actualizar ultimo_contacto: Google Sheets account
- Marcar buffer DONE (cliente): Google Sheets account
- Read clientes (recordatorios): Google Sheets account
- Read logs (recordatorios): Google Sheets account
- Log recordatorio: Google Sheets account
- Read clientes (reportes): Google Sheets account
- Log reporte: Google Sheets account
- Log respuesta IA: Google Sheets account