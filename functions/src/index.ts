import * as functions from 'firebase-functions'
import * as amargo from './amargo/amargo'

const ping = functions.https.onRequest(amargo.ping)
const amargoBeta = functions.https.onRequest(amargo.amargoBeta)
const amargoDefault = functions.https.onRequest(amargo.default)
const amargoInMemory = functions.https.onRequest(amargo.amargoInMemory)

export { amargoDefault as amargo, amargoBeta, amargoInMemory, ping }