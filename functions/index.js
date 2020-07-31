const functions = require('firebase-functions');
const { generateNotification, deleteNotification, onUserImageChange, onBiteDelete, onUserOffline } = require('./utils/listeners')
const express = require('express')
const { getAllBites, getBite, deleteBite, addBite, commentBite, likeBite, unLikeBite } = require('./handlers/bites')
const { signUp, login } = require('./handlers/auth')
const { uploadImage, addUserDetails, getAuthUserDetails, getUserDetails, markReadNotifications, getUsers, follow } = require('./handlers/users')
const { getTracks } = require('./handlers/music')
const { startDialog, getDialogs } = require('./handlers/dialogs')
const { authMiddleware } = require('./utils/authMiddleware')

const cors = require('cors');
const app = express()
app.use(cors())

//bites
app.get('/bites', getAllBites)
app.get('/bites/:biteId', getBite)
app.delete('/bites/:biteId', authMiddleware, deleteBite)
app.post('/bites', authMiddleware, addBite)
app.post('/bites/:biteId/comment', authMiddleware, commentBite)
app.post('/bites/:biteId/like', authMiddleware, likeBite)
app.delete('/bites/:biteId/like', authMiddleware, unLikeBite)

app.get('/music', getTracks)

//auth
app.post('/signup', signUp)
app.post('/login', login)

//users
app.post('/user', authMiddleware, addUserDetails)
app.get('/user', authMiddleware, getAuthUserDetails)
app.get('/user/:handle', getUserDetails)
app.post('/users', getUsers)
app.post('/user/image', authMiddleware, uploadImage)
app.post('/notifications', authMiddleware, markReadNotifications)
app.post('/user/:handle/follow', authMiddleware, follow)

//dialogs
app.post('/dialogs/:dialogId', authMiddleware, startDialog)
app.get('/dialogs', authMiddleware, getDialogs)

exports.api = functions.region('europe-west2').https.onRequest(app)

exports.createNotificationOnLike = generateNotification('like')
exports.deleteNotificationOnUnlike = deleteNotification('like')
exports.createNotificationOnComment = generateNotification('comment')
exports.onUserImageChange = onUserImageChange
exports.onBiteDelete = onBiteDelete
exports.onUserOffline = onUserOffline
