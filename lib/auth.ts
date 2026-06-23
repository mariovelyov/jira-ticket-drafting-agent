const SECRET = process.env.API_SECRET_TOKEN;

export function requireAuth(req: Request): Response | null {
  if (!SECRET) return null; // auth disabled if env var not set (local dev)
  const header = req.headers.get('Authorization') ?? '';
  if (header === `Bearer ${SECRET}`) return null;
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
