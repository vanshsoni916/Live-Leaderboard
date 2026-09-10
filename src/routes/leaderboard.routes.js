import {incrementScore,getTopPlayers,getMyRank,getNearbyRivals} from '../controller/leaderboard.controller.js'
import express from 'express'
import {requireAuth} from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/increment',requireAuth,incrementScore)
router.get('/top',getTopPlayers)
router.get('/rank',requireAuth,getMyRank)
router.get('/nearby',requireAuth,getNearbyRivals)

export default router