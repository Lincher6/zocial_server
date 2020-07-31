const { db, admin } = require('../utils/admin')
const { config } = require('../utils/config')
const { reduceUserDetails } = require('../utils/validators')

exports.getTracks = async (req, res) => {
    try {
        const tracksData = await db.collection('music').get()

        const tracks = []
        tracksData.docs.forEach(track => {
            tracks.push({
                id: track.id,
                title: track.data().title,
                link: track.data().link,
                cover: track.data().cover,
                artist: track.data().artist,
            })
        });
        return res.status(200).json(tracks)
    } catch (e) {
        return res.status(500).json({ error: e.message })
    }
}