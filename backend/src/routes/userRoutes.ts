import { FastifyInstance } from 'fastify';
import prisma from '../utils/db';
import { authenticate, AuthRequest } from '../middlewares/authMiddleware';
import { z } from 'zod';

// Define UserDTO type for consistency (could be shared in a common types file)
interface UserDTO {
  id: string;
  email: string;
  preferences: any;
  hasCompletedOnboarding: boolean;
}

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/me', async (request, reply) => {
    try {
      const userId = (request as AuthRequest).user!.userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return reply.status(404).send({ error: 'User not found' });
      
      const userDTO: UserDTO = {
        id: user.id,
        email: user.email,
        preferences: user.preferences,
        hasCompletedOnboarding: user.hasCompletedOnboarding
      };
      
      return reply.send(userDTO);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  fastify.post('/preferences', async (request, reply) => {
    try {
      const preferences = request.body; // Validate with zod if structure known
      const userId = (request as AuthRequest).user!.userId;
      
      const existingUser = await prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } });
      const currentPrefs = (existingUser?.preferences as object) || {};
      const newPrefs = { ...currentPrefs, ...(preferences as object) };
      
      // Implicitly mark onboarding as completed if this endpoint is called.
      // Or we could check if it's the specific onboarding call, but for this MVP flow, 
      // setting preferences is the final step of onboarding.
      // The user requirement implies saving preferences is the trigger.
      
      const user = await prisma.user.update({
        where: { id: userId },
        data: { 
          preferences: newPrefs as any,
          hasCompletedOnboarding: true
        },
      });

      const userDTO: UserDTO = {
        id: user.id,
        email: user.email,
        preferences: user.preferences,
        hasCompletedOnboarding: user.hasCompletedOnboarding
      };

      return reply.send(userDTO);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
