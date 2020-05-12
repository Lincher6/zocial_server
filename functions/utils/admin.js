const { config } = require('./config')

const admin = require('firebase-admin')
admin.initializeApp()

const db = admin.firestore()

const firebase = require('firebase')
firebase.initializeApp(config)

module.exports = { admin, db, firebase }