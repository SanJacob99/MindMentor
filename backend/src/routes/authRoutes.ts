import { FastifyInstance } from 'fastify';
import prisma from '../utils/db';
import { loginSchema, signupSchema } from '../schemas/authSchemas';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { hashPassword, verifyPassword } from '../utils/password';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/signup', async (request, reply) => {
    try {
      const { email, password, preferences } = signupSchema.parse(request.body);

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return reply.status(409).send({ error: 'User already exists' });
      }

      const hashedPassword = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          preferences: preferences ?? {},
        },
      });

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

      // Return UserDTO
      const userDTO = {
        id: user.id,
        email: user.email,
        preferences: user.preferences,
        hasCompletedOnboarding: user.hasCompletedOnboarding
      };

      return reply.status(201).send({ accessToken: token, user: userDTO });
    } catch (error) {
       if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: (error as any).errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  fastify.post('/login', async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

      const userDTO = {
        id: user.id,
        email: user.email,
        preferences: user.preferences,
        hasCompletedOnboarding: user.hasCompletedOnboarding
      };

      return reply.send({ accessToken: token, user: userDTO });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: (error as any).errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
