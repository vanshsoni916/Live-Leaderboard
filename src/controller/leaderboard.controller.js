import {redisClient} from '../config/redisClient.js'
import { broadcastLeaderboardUpdate } from '../scokets/index.js'

const LEADERBOARD_KEY = 'leaderboard:global'

async function incrementScore(req,res){
    try {
        const {points} = req.body
        const userId = req.user?.userId

        if(typeof points!== 'number'){
            return res.status(400).json({error:'points must be a number'})
        }

        const newScore = await redisClient.zIncrBy(LEADERBOARD_KEY,points,userId)
        
        const io = req.app.get('io')
        await broadcastLeaderboardUpdate(io)
        
        res.json({ userId, newScore });
    } catch (err) {
        console.error(err)
        res.status(500).json({error:'Internal Server Error'})
    }
}

async function getTopPlayers(req,res){
    try {
        const limit = parseInt(req.query.limit) || 10;

        const results = await redisClient.zRangeWithScores(
            LEADERBOARD_KEY,
            0,
            limit-1,
            {REV:true}
        )

        res.status(200).json({top:results})
    } catch (err) {
        res.status(500).json({error:'Internal Server'})
    }
}

async function getMyRank(req,res){
    try {
        const userId = req.user?.userId

        const rank = await redisClient.zRevRank(LEADERBOARD_KEY,userId)
        const score = await redisClient.zScore(LEADERBOARD_KEY,userId)

        if(rank===null){
            res.status(404).json({message:'User has no score yet'})
        }

        res.status(200).json({userId,rank:rank+1,score})
    } catch (err) {
        console.error(err)
        res.status(500).json({error:'Internal Server Error'})
    }
}

async function getNearbyRivals(req,res){
    try {
        const userId = req.user?.userId
        if(!userId){

        }

        const range = req.query?.range || 2
        const myRank = await redisClient.zRevRank(LEADERBOARD_KEY,userId)
        if(!myRank){

        }

        const start = Math.max(0,myRank-range)
        const end = myRank+range

        const nearBy = await redisClient.zRangeWithScores(
            LEADERBOARD_KEY,
            start,
            end,
            {REV:true}
        ) 

        res.json({ myRank: myRank + 1, nearBy });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
}
export {incrementScore,getTopPlayers,getMyRank,getNearbyRivals}