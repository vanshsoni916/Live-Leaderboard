import express from 'express'
import { registerUser,loginUser, getCurrentUser, logout } from '../controller/auth.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/register',registerUser)
router.post('/login',loginUser)
router.get('/me',requireAuth,getCurrentUser)
router.post('/logout',requireAuth,logout)

export default router