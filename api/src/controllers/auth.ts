import { Request, Response } from 'express';
import { registerUser, loginUser } from '../services/auth';

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Missing required parameters' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  try {
    const user = await registerUser(email, password);
    res.json({ success: true, user });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Missing required parameters' });
  }

  try {
    const result = await loginUser(email, password);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
};
