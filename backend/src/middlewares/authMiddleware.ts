import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends FastifyRequest {
  user?: {
    userId: string;
  };
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return reply.status(401).send({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return reply.status(401).send({ error: 'Invalid token format' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
    (request as AuthRequest).user = decoded;
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
}
