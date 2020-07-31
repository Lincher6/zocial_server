const { db, admin } = require('../utils/admin')
const { config } = require('../utils/config')
const { reduceUserDetails } = require('../utils/validators')

exports.addUserDetails = async (req, res) => {
    try {
        const userDetails = reduceUserDetails(req.body)
        await db.doc(`/users/${req.user.handle}`).update(userDetails)
        return res.json({ message: 'Details were updated' })
    } catch (e) {
        return res.status(500).json({ error: e.message })
    }
}

exports.getUsers = async (req, res) => {
    try {

        let collection = db
            .collection('users')

        if (req.body.searchParams) {
            const { handle, email, location } = req.body.searchParams
            if (handle && handle.length > 0) {
                collection = collection.where('handle', '==', handle)
            }

            if (email && email.length > 0) {
                collection = collection.where('email', '==', email)
            }

            if (location && location.length > 0) {
                collection = collection.where('location', '==', location)
            }
        }


        if (req.body.userHandles) {
            const userHandles = req.body.userHandles
            collection = collection.where('handle', 'in', userHandles)
        }



        const usersData = await collection
            .orderBy('createdAt', 'desc')
            .offset(parseInt(req.body.offset))
            .limit(10)
            .get()

        const users = []
        usersData.docs.map((doc) => {
            users.push({
                userId: doc.data().userId,
                handle: doc.data().handle,
                bio: doc.data().bio,
                email: doc.data().email,
                createdAt: doc.data().createdAt,
                imageUrl: doc.data().imageUrl,
                location: doc.data().location,
                website: doc.data().website,
            })
        })

        return res.status(200).json(users)
    } catch (e) {
        return res.status(500).json({ error: e.message })
    }
}

exports.getAuthUserDetails = async (req, res) => {
    try {
        const userDetails = {}

        const userData = await db.doc(`/users/${req.user.handle}`).get()
        if (userData.exists) {
            userDetails.credentials = userData.data()
        }

        userDetails.images = []
        const imagesData = await db.collection('images')
            .where('userHandle', '==', req.user.handle)
            .orderBy('createdAt', 'desc')
            .get()
        imagesData.forEach(doc => {
            userDetails.images.push(doc.data().imageUrl)
        })

        userDetails.likes = []
        const likesData = await db.collection('likes').where('userHandle', '==', req.user.handle).get()
        likesData.forEach(doc => {
            userDetails.likes.push(doc.data())
        })

        userDetails.notifications = []
        const notifications = await db
            .collection('notifications')
            .where('recipient', '==', req.user.handle)
            .orderBy('createdAt', 'desc')
            .get()
        notifications.forEach(notification => {
            userDetails.notifications.push({
                id: notification.id,
                sender: notification.data().sender,
                recipient: notification.data().recipient,
                createdAt: notification.data().createdAt,
                read: notification.data().read,
                biteId: notification.data().biteId,
                type: notification.data().type
            })
        })

        return res.json(userDetails)
    } catch (e) {
        return res.status(500).json({ error: e })
    }
}

exports.getUserDetails = async (req, res) => {
    try {
        const userData = await db.doc(`/users/${req.params.handle}`).get()
        if (!userData.exists) {
            return res.status(404).json({ error: 'User not found' })
        }

        const userDetails = userData.data()
        userDetails.images = []
        const imagesData = await db.collection('images')
            .where('userHandle', '==', req.params.handle)
            .orderBy('createdAt', 'desc')
            .get()
        imagesData.forEach(doc => {
            userDetails.images.push(doc.data().imageUrl)
        })

        return res.status(200).json(userDetails)

    } catch (e) {
        return res.status(500).json({ error: e })
    }
}

exports.uploadImage = async (req, res) => {
    const BusBoy = require('busboy')
    const path = require('path')
    const os = require('os')
    const fs = require('fs')

    const busBoy = new BusBoy({ headers: req.headers })
    let imageFileName
    let imageToBeUploaded = {}

    busBoy.on('file', async (fieldName, file, fileName, encoding, mimeType) => {
        if (mimeType !== 'image/jpeg' && mimeType !== 'image/png') {
            res.status(400).json({ error: 'Not an image' })
        }

        const imageExtension = fileName.split('.')[fileName.split('.').length - 1]
        imageFileName = `${req.user.handle}${Math.round(Math.random() * 100000000)}.${imageExtension}`
        const imagePath = path.join(os.tmpdir(), imageFileName)
        imageToBeUploaded = { imagePath, mimeType }

        file.pipe(fs.createWriteStream(imagePath))

    })

    busBoy.on('finish', async () => {
        try {
            await admin.storage().bucket().upload(imageToBeUploaded.imagePath, {
                resumable: false,
                metadata: {
                    metadata: {
                        contentType: imageToBeUploaded.mimeType
                    }
                }
            })

            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`

            const newImage = { imageUrl, userHandle: req.user.handle, createdAt: new Date().toISOString() }
            await db.collection('images').add(newImage)

            await db.doc(`/users/${req.user.handle}`).update({ imageUrl })
            return res.status(200).json({ message: 'image uploaded successfully' })

        } catch (e) {
            return res.status(501).json({ error: e })
        }

    })

    busBoy.end(req.rawBody)
}

exports.markReadNotifications = async (req, res) => {
    try {
        const batch = db.batch()
        req.body.forEach(notificationId => {
            const notification = db.doc(`/notifications/${notificationId}`)
            batch.update(notification, { read: true })
        })
        await batch.commit()
        return res.status(200).json({ message: 'Notifications marked' })
    } catch (e) {
        return res.status(500).json({ error: e })
    }
}

exports.follow = async (req, res) => {
    try {
        const userData = await db.doc(`/users/${req.user.handle}`).get()
        const friends = userData.data().friends
        let newFriends

        if (req.body.follow) {
            newFriends = [...friends, req.params.handle]
        } else {
            newFriends = friends.filter(friend => friend !== req.params.handle)
        }

        await userData.ref.update({ friends: newFriends })
        return res.status(200).json({ newFriends })
    } catch (e) {
        console.log(e.message)
        return res.status(500).json({ error: e.message })
    }
}