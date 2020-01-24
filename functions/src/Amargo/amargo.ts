import * as functions from 'firebase-functions'
import * as httpRequest from 'request'
import { SlackPayload } from '../localDefinitions'
import InMemoryAmargo from './inMemory/InMemoryAmargo'
import FirebaseAmargo from './FirebaseAmargo'

const firebaseAmargo = new FirebaseAmargo()
const inMemoryAmargo = new InMemoryAmargo()

function amargo(request: functions.https.Request, reply: functions.Response): void {
    const payload = request.body as SlackPayload
    const action = payload.text
    firebaseAmargo.execute(action, payload)
        .then(response => {
            const slackResponse = {
                response_type: "in_channel",
                text: response
            }
            logInputOutput(payload, response)
            reply.send(slackResponse)
        })
        .catch(error => {
            console.log(error)
            reply.send(error)
        })
}
function amargoInMemory(request: functions.https.Request, reply: functions.Response): void {
    reply.write(JSON.stringify({ response_type: "in_channel" }))
    const payload = request.body as SlackPayload
    const action = payload.text
    const response = inMemoryAmargo.execute(action, payload)
    logInputOutput(payload, response)
    reply.send(response)
}
function amargoBeta(req: functions.https.Request, reply: functions.Response): void {
    httpRequest.post(req.body.response_url,{body:'{"text":"received request","response_type":"ephemeral"}'},(error,res,body)=>{
        if (error) {
            console.log("-------------error"+JSON.stringify(error))
        } else{
            console.log(`statusCode: ${res.statusCode}`)
            console.log("-----------------body"+JSON.stringify(body))
        }
    })
    // body:{"text":"received request","response_type":"ephemeral"}
    // const options: httpRequest.UriOptions & httpRequest.CoreOptions = {
    //     uri: req.body.response_url,
    //     headers: {
    //         "Content-type": "application/json"
    //     },
    //     body: {
    //         "text": "Thanks for your request, we'll process it and get back to you.",
    //         "response_type": "ephemeral",
    //     }
    // }
    // httpRequest.post(options, (error, res, body) => {
    //     if (error) {
    //         console.log(error)
    //         return
    //     }
    //     console.log(`statusCode: ${res.statusCode}`)
    //     console.log(body)
    // })
    amargo(req, reply)
}
function ping(request: functions.https.Request, reply: functions.Response): void {
    reply.send(JSON.stringify(request.body))
}
function logInputOutput(payload: SlackPayload, response: string) {
    console.log("-----------------------------")
    console.log("Request: " + JSON.stringify(payload))
    console.log("-----------------------------")
    console.log("Response: " + response)
    console.log("-----------------------------")
}

export default amargo
export { amargoInMemory, amargoBeta, ping }