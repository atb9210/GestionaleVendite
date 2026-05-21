import { Response } from 'express';

const clients = new Set<Response>();

export function addSSEClient(res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disabilita buffering Traefik/nginx
  res.flushHeaders();
  clients.add(res);

  // Keepalive ogni 30s per evitare che Traefik chiuda la connessione inattiva
  const ping = setInterval(() => res.write(': ping\n\n'), 30000);
  res.on('close', () => {
    clearInterval(ping);
    clients.delete(res);
  });
}

export function broadcastSSE(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(res => res.write(payload));
}
