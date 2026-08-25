import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail, findUserById } from '../models/userModel.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(user) {
	return { id: user.id, name: user.name, email: user.email };
}

function createToken(user) {
	return jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export async function register(request, response, next) {
	try {
		const name = request.body.name?.trim();
		const email = request.body.email?.trim().toLowerCase();
		const password = request.body.password;
		if (!name || !email || !password) return response.status(400).json({ success: false, message: 'Name, email, and password are required' });
		if (!emailPattern.test(email)) return response.status(400).json({ success: false, message: 'Please provide a valid email address' });
		if (password.length < 8) return response.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
		if (await findUserByEmail(email)) return response.status(409).json({ success: false, message: 'Email already registered' });
		const passwordHash = await bcrypt.hash(password, 12);
		const id = await createUser({ name, email, passwordHash });
		const user = { id, name, email };
		response.status(201).json({ success: true, user, token: createToken(user) });
	} catch (error) {
		if (error.code === 'ER_DUP_ENTRY') return response.status(409).json({ success: false, message: 'Email already registered' });
		next(error);
	}
}

export async function login(request, response, next) {
	try {
		const email = request.body.email?.trim().toLowerCase();
		const password = request.body.password;
		if (!email || !password) return response.status(400).json({ success: false, message: 'Email and password are required' });
		const user = await findUserByEmail(email);
		const passwordMatches = user && await bcrypt.compare(password, user.password_hash);
		if (!passwordMatches) return response.status(401).json({ success: false, message: 'Invalid email or password.' });
		response.json({ success: true, token: createToken(user), user: publicUser(user) });
	} catch (error) {
		next(error);
	}
}

export async function getMe(request, response, next) {
	try {
		const user = await findUserById(request.user.id);
		if (!user) return response.status(401).json({ success: false, message: 'Authentication required' });
		response.json({ success: true, user: publicUser(user) });
	} catch (error) {
		next(error);
	}
}

export function logout(request, response) {
	response.json({ success: true, message: 'Logged out successfully' });
}