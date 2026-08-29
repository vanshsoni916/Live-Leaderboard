import {redisClient} from '../config/redisClient.js'

const LEADERBOARD_KEY = 'leaderboard:global'

async function incrementScore(req,res){
    try {
        const {points} = req.body
        const userId = req.user?._id

        if(typeof points!==Number){
            return res.status(400).json({error:'points must be a number'})
        }

        const newScore = await redisClient.zIncrBy(LEADERBOARD_KEY,points,userId)
        
        res.json({ userId, newScore });
    } catch (err) {
        console.error(err)
        res.status(500).json({error:'Internal Server Error'})
    }
}

async function getTopPlayers(req,res){
    try {
        const limit = req.query.limit

        const results = await redisClient.zRangeWithScores(
            LEADERBOARD_KEY,
            0,
            limit-1,
            {REV:true}
        )

        res.status(200).json({top:results})
    } catch (err) {
        console.error(err)
        res.status(500).json({error:'Internal Server'})
    }
}

async function getMyRank(req,res){
    try {
        const userId = req.user?._id

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

export {incrementScore,getTopPlayers,getMyRank}