import { signin, signup, getUsers, createUser, updateUser, deleteUser } from '../controllers/user.js';
import express from 'express';
const router = express.Router();

router.post('/signin', signin);
router.post('/signup', signup);
router.get('/', getUsers);
router.post('/', createUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);


export default router;
