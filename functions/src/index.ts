import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as Payload from "slack-payload"
import {SlackPayload} from './localDefinitions'
import Chimas from './Chimas/Chimas'

const chimas = new Chimas()
admin.initializeApp(functions.config().firebase)
const db = admin.firestore()
interface testPayload {
    user_id:string
}

const app = functions.https.onRequest((request, reply) => {
    const payload = new Payload(request.body) as SlackPayload
    const action = payload.text
    const response = chimas.execute(action, payload)
    reply.send({
        response_type: "in_channel",
        text: response
    })
    logInputOutput(payload,response);
})

const test = functions.https.onRequest((request, reply) => {
    const payload = new Payload(request.body) as SlackPayload
    reply.send(JSON.stringify(payload))
})

const read = functions.https.onRequest((request, response) => {
    db.doc('queue/teste').get()
    .then(snapshot => response.send(snapshot.data()))
    .catch(error => {
        console.log(JSON.stringify(error))
        response.send(error)
    }
    )
})

const join = functions.https.onRequest((request, response) => {
    const body = request.body as testPayload

    db.doc('queue/teste').collection('members').doc().create(body)
    
    // set({'members':[body.user_id]})
    .then(()=> response.send("done"))
    .catch(error =>{
        console.log(error)
        response.send(error)
    })
    
})

function logInputOutput(payload: SlackPayload, response: string) {
    console.log("-----------------------------")
    console.log("Payload:\n"+JSON.stringify(payload))
    console.log("-----------------------------")
    console.log("Response:\n"+response)
    console.log("-----------------------------")
}


export { app, test, read as testFirestore, join }