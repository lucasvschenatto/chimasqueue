import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as Payload from "slack-payload"
import {SlackPayload} from './localDefinitions'
import Chimas from './Chimas/Chimas'
import FirebaseChimas from './Chimas/FirebaseChimas'

const app = admin.initializeApp()
// const app = admin.initializeApp(functions.config().firebase)
const db = admin.firestore(app)
const chimas = new Chimas()
const firebaseChimas = new FirebaseChimas(db)

const amargo = functions.https.onRequest((request, reply) => {
    const payload = new Payload(request.body) as SlackPayload
    const action = payload.text
    const response = chimas.execute(action, payload)
    
    logInputOutput(payload,response)
    reply.send(response)
})

const amargoBeta = functions.https.onRequest((request, reply) => {
    const payload = JSON.parse(JSON.stringify(request.body)) as SlackPayload
    const action = payload.text
    const fbResponse = firebaseChimas.execute(action,payload)
    fbResponse
    .then(response=>{

        reply.send({
            response_type: "in_channel",
            text: response
        })
        logInputOutput(payload,response);
    })
    .catch(error=>{
        console.log(error)
        reply.send(error)
    })
})

const ping = functions.https.onRequest((request, reply) => {
    const payload = new Payload(request.body) as SlackPayload
    reply.send(JSON.stringify(payload))
})

function logInputOutput(payload: SlackPayload, response: string) {
    console.log("-----------------------------")
    console.log("Payload:\n"+JSON.stringify(payload))
    console.log("-----------------------------")
    console.log("Response:\n"+response)
    console.log("-----------------------------")
}


export { amargo, amargoBeta, ping }