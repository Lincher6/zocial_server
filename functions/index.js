const functions = require('firebase-functions');
const { generateNotification, deleteNotification, onUserImageChange, onBiteDelete } = require('./utils/listeners')
const express = require('express')
const { getAllBites, getBite, deleteBite, addBite, commentBite, likeBite, unLikeBite} = require('./handlers/bites')
const { signUp, login } = require('./handlers/auth')
const { uploadImage, addUserDetails, getAuthUserDetails, getUserDetails, markReadNotifications } = require('./handlers/users')
const { authMiddleware } = require('./utils/authMiddleware')

const app = express()

//bites
app.get('/bites', getAllBites)
app.get('/bites/:biteId', getBite)
app.delete('/bites/:biteId', authMiddleware, deleteBite)
app.post('/bites', authMiddleware, addBite)
app.post('/bites/:biteId/comment', authMiddleware, commentBite)
app.post('/bites/:biteId/like', authMiddleware, likeBite)
app.delete('/bites/:biteId/like', authMiddleware, unLikeBite)

//auth
app.post('/signup', signUp)
app.post('/login', login)

//users
app.post('/user', authMiddleware, addUserDetails )
app.get('/user', authMiddleware, getAuthUserDetails )
app.get('/user/:handle',  getUserDetails )
app.post('/user/image', authMiddleware, uploadImage )
app.post('/notifications', authMiddleware, markReadNotifications )

exports.api = functions.region('europe-west2').https.onRequest(app)

exports.createNotificationOnLike = generateNotification('like')
exports.deleteNotificationOnUnlike = deleteNotification('like')
exports.createNotificationOnComment = generateNotification('comment')
exports.onUserImageChange = onUserImageChange
exports.onBiteDelete = onBiteDelete
