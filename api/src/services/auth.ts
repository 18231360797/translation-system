import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from '../database/supabase';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

const userStore: UserRecord[] = [];

export const registerUser = async (email: string, password: string) => {
  if (!supabase) {
    const existingUser = userStore.find((u) => u.email === email);
    
    if (existingUser) {
      throw new Error('Email already exists');
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const newUser: UserRecord = {
      id: Date.now().toString(),
      email,
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    userStore.push(newUser);
    
    return {
      id: newUser.id,
      email: newUser.email,
    };
  }

  const existingUser = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser.data) {
    throw new Error('Email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        email,
        password_hash: passwordHash,
      },
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    email: data.email,
  };
};

export const loginUser = async (email: string, password: string) => {
  if (!supabase) {
    const user = userStore.find((u) => u.email === email);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    
    return {
      user: {
        id: user.id,
        email: user.email,
      },
      token,
    };
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    throw new Error('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    token,
  };
};

export const getUserById = async (id: string) => {
  if (!supabase) {
    const user = userStore.find((u) => u.id === id);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      id: user.id,
      email: user.email,
    };
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, email')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new Error('User not found');
  }

  return data;
};
