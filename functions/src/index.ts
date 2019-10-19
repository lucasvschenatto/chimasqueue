import * as functions from 'firebase-functions'
import * as Payload from "slack-payload"
import {SlackPayload} from './localDefinitions'
import Chimas from './Chimas/Chimas'

const chimas = new Chimas();

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

function logInputOutput(payload: SlackPayload, response: string) {
    console.log("-----------------------------")
    console.log("Payload:\n"+JSON.stringify(payload))
    console.log("-----------------------------")
    console.log("Response:\n"+response)
    console.log("-----------------------------")
}

export { app, test }