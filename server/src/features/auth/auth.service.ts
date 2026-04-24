import { AuthenticateUserDTO, CreateUserDTO, UserRole } from './auth.types';
import Boom from '@hapi/boom';
import { supabase } from '../../config/supabase';
import { AuthResponse, AuthTokenResponsePassword } from '@supabase/supabase-js';

export const authenticateUserService = async (
  credentials: AuthenticateUserDTO
): Promise<AuthTokenResponsePassword['data']> => {
  const signInResponse = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (signInResponse.error) {
    throw Boom.unauthorized(signInResponse.error.message);
  }

  return signInResponse.data;
};

export const createUserService = async (
  user: CreateUserDTO
): Promise<AuthResponse['data']> => {
  const signUpResponse = await supabase.auth.signUp({
    email: user.email,
    password: user.password,
    options: {
      data: {
        name: user.name,
        role: user.role,
      },
    },
  });

  if (signUpResponse.error) {
    throw Boom.badRequest(signUpResponse.error.message);
  }

  const newUserId = signUpResponse.data.user?.id;

  if (newUserId) {
    const { error: userTableError } = await supabase.from('users').insert([
      {
        id: newUserId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    ]);

    if (userTableError) {
      throw Boom.internal(
        'Error creating user profile: ' + userTableError.message
      );
    }

    if (user.role === UserRole.STORE && user.storeName) {
      const { error: storeError } = await supabase.from('stores').insert([
        {
          name: user.storeName,
          owner_id: newUserId,
          status: 'closed',
        },
      ]);

      if (storeError) {
        throw Boom.internal(
          'User created, but failed to create store: ' + storeError.message
        );
      }
    }
  }

  return signUpResponse.data;
};
