import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import mongoose from 'mongoose';

export const signin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });

        if (!existingUser) return res.status(404).json({ message: "User doesn't exist." });

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password,);

        if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials." });

        const token = jwt.sign({ email: existingUser.email, id: existingUser._id, permissions: existingUser.Permissions }, 'test', { expiresIn: "1h" });

        res.status(200).json({ result: existingUser, token });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong." });
    }
}

export const signup = async (req, res) => {
    const { email, password, confirmPassword, firstName, lastName, role, profilePicture } = req.body;

    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) return res.status(400).json({ message: "User already exists." });

        if (password !== confirmPassword) return res.status(400).json({ message: "Passwords don't match." });

        const hashedPassword = await bcrypt.hash(password, 12);

        const result = await User.create({
            email,
            password: hashedPassword,
            name: firstName,
            surname: lastName,
            role,
            profilePicture,
            Permissions: []
        });

        const token = jwt.sign({ email: result.email, id: result._id, permissions: result.Permissions }, 'test', { expiresIn: "1h" });

        res.status(200).json({ result, token });
    } catch (error) {
        console.log(error); // Log the error for debugging
        res.status(500).json({ message: "Something went wrong." });
    }
}

export const getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const createUser = async (req, res) => {
    const user = req.body;
    const newUser = new User(user);
    try {
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
}

export const updateUser = async (req, res) => {
    const { id: _id } = req.params;
    const user = req.body;

    if (!mongoose.Types.ObjectId.isValid(_id)) return res.status(404).send('No user with that id');

    const updatedUser = await User.findByIdAndUpdate(_id, { ...user, _id }, { new: true });

    res.json(updatedUser);
}

export const deleteUser = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send('No user with that id');

    await User.findByIdAndDelete(id);

    res.json({ message: 'User deleted successfully' });
}




