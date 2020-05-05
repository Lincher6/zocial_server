const functions = require('firebase-functions');
const express = require('express')
const { getAllBites, addBite} = require('./handlers/bites')
const { signUp, login } = require('./handlers/users')
const {authMiddleware} = require('./utils/authMiddleware')

const app = express()

//bites
app.get('/bites', getAllBites)
app.post('/bites', authMiddleware, addBite)

//users
app.post('/signup', signUp)
app.post('/login', login)

exports.api = functions.region('europe-west2').https.onRequest(app)
