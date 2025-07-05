import { FastifyJWT } from '@fastify/jwt';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { FastifyCookieOptions } from '@fastify/cookie';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    jwtVerify: FastifyJWT['jwtVerify'];
    user: FastifyJWT['user'];
    cookies: { [key: string]: string };
  }

  interface FastifyReply {
    jwtSign: FastifyJWT['jwtSign'];
    jwtDecode: FastifyJWT['jwtDecode'];
    setCookie: (name: string, value: string, options?: FastifyCookieOptions) => FastifyReply;
    clearCookie: (name: string, options?: FastifyCookieOptions) => FastifyReply;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      userId: number;
      role: string;
      jti: string;
      exp: number;
    };
  }
} 