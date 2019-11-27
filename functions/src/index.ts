import * as functions from 'firebase-functions'
import * as Payload from "slack-payload"
import {SlackPayload} from './localDefinitions'
import InMemoryAmargo from './amargo/inMemory/InMemoryAmargo'
import FirebaseAmargo from './Amargo/FirebaseAmargo'
import * as httpRequest from 'request'

const chimas = new InMemoryAmargo()
const firebaseChimas = new FirebaseAmargo()

const amargoInMemory =  (request:functions.https.Request, reply:functions.Response):void => {
    reply.write(JSON.stringify({response_type: "in_channel"}))
    const payload =request.body as SlackPayload
    const action = payload.text
    const response = chimas.execute(action, payload)
    logInputOutput(payload,response)
    reply.send(response)
}

const amargo =  (request:functions.https.Request, reply:functions.Response):void => {
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
}

const amargoBeta = (req:functions.https.Request, reply:functions.Response):void => {
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
    amargo(req,reply)
}


const ping = (request:functions.https.Request, reply:functions.Response):void => {
    const payload = new Payload(request.body) as SlackPayload
    reply.send(JSON.stringify(payload))
}

const httpsPing = functions.https.onRequest(ping)
const httpsAmargoBeta = functions.https.onRequest(amargoBeta)
const httpsAmargo = functions.https.onRequest(amargo)
const httpsAmargoInMemory = functions.https.onRequest(amargoInMemory)

function logInputOutput(payload: SlackPayload, response: string) {
    console.log("-----------------------------")
    console.log("Request: "+JSON.stringify(payload))
    console.log("-----------------------------")
    console.log("Response: "+response)
    console.log("-----------------------------")
}


export { httpsAmargo as amargo, httpsAmargoBeta as amargoBeta, httpsAmargoInMemory as amargoInMemory, httpsPing as ping }