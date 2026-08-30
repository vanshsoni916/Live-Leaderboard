import {incrementScore,getTopPlayers,getMyRank} from '../controller/leaderboard.controller.js'
import express from 'express'
import {requireAuth} from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/increment',requireAuth,incrementScore)
router.get('/top',getTopPlayers)
router.get('/rank',requireAuth,getMyRank)

export default router