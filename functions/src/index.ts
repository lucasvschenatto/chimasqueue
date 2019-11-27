import * as functions from 'firebase-functions'
import * as Payload from "slack-payload"
import {SlackPayload} from './localDefinitions'
import Chimas from './Chimas/Chimas'
import FirebaseChimas from './Chimas/FirebaseChimas'
import * as httpRequest from 'request'

const chimas = new Chimas()
const firebaseChimas = new FirebaseChimas()

const amargoInMemory = functions.https.onRequest((request, reply) => {
    reply.write(JSON.stringify({response_type: "in_channel"}))
    const payload =request.body as SlackPayload
    const action = payload.text
    const response = chimas.execute(action, payload)
    logInputOutput(payload,response)
    reply.send(response)
})

const amargo = functions.https.onRequest((request, reply) => {
    const payload = request.body as SlackPayload
    const action = payload.text
    firebaseChimas.execute(action,payload)
    .then(response=>{
        const slackResponse = {
            response_type: "in_channel",
            text: response
        }
        logInputOutput(payload,response)
        reply.send(slackResponse)
    })
    .catch(error=>{
        console.log(error)
        reply.send(error)
    })
})

const amargoBeta = functions.https.onRequest((req, reply) => {
    const options = {
        uri: req.body.response_url,
        headers: {
          "Content-type": "application/json"
        },
        body:{
            "text": "Thanks for your request, we'll process it and get back to you.",
            "response_type": "ephemeral",
        }
      }
    httpRequest.post(options,(error,res,body)=>{
        if(error){
            console.log(error)
            return
        }
        console.log(`statusCode: ${res.statusCode}`)
        console.log(body)
    })
    // httpRequest.post(
    //     req.body.response_url,
    //     {
    //         form:{"text": "Thanks for your request, we'll process it and get back to you."}
    //     },(error,res,body)=>{
    //         if(error){
    //             console.log(error)
    //             return
    //         }
    //         console.log(`statusCode: ${res.statusCode}`)
    //         console.log(body)
    //     })
    amargo(req,reply)
})

const ping = functions.https.onRequest((request, reply) => {
    const payload = new Payload(request.body) as SlackPayload
    reply.send(JSON.stringify(payload))
})

function logInputOutput(payload: SlackPayload, response: string) {
    console.log("-----------------------------")
    console.log("Request: "+JSON.stringify(payload))
    console.log("-----------------------------")
    console.log("Response: "+response)
    console.log("-----------------------------")
}


export { amargo, amargoBeta, amargoInMemory, ping }