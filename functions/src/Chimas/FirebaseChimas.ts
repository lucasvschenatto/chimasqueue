import { SlackPayload, Actions, Action } from "../localDefinitions"
import * as admin from 'firebase-admin'


export default class FirebaseChimas{
    db: FirebaseFirestore.Firestore
    protected actionsMap: {[key in Actions]?: Action}
    constructor() {
        const app = admin.initializeApp()
        this.db = admin.firestore(app)
        this.actionsMap = {
          [Actions.new]: this.newQueue.bind(this),
          [Actions.join]: this.join.bind(this),
          [Actions.leave]: this.leave.bind(this),
        //   [Actions.next]: this.next.bind(this),
        //   [Actions.who]: this.who.bind(this),
        //   [Actions.blame]: this.blame.bind(this),
        //   [Actions.clear]: this.clear.bind(this),
          [Actions.help]: this.help.bind(this),
        //   [Actions.members]: this.showMembers.bind(this)
        }
    }

    public async execute(action: string, payload: SlackPayload) {
        if (!Actions[action]) {
          return `Action ${action} not available.`
        }
        return this.actionsMap[action](payload)
    }

    private async newQueue(payload: SlackPayload){
        const doc = this.db.doc(`queue/${payload.channel_id}`)
        return new Promise<string>( async(resolve,reject)=>{
            try{
                await doc.set(this.withTimestamp(payload))
                const snapshot = await doc.collection(`members`).get()
                snapshot.docs.forEach(member=> member.ref.delete())
                resolve(`<!everyone>, queue started for channel ${payload.channel_name}! Prepare the chimas :chimas:`)
            }catch(error){
                console.log(`Error on new queue`)
                console.log(error)
                reject(error)
            }
        })
    }

    private async leave(payload: SlackPayload){
        return this.db.collection(`queue/${payload.channel_id}/members`)
        .doc(payload.user_id).delete()
        .then(()=>{
            console.log(`Successful Leave:`)
            console.log(payload)
            return `<@${payload.user_id}> has left the queue!`
        })
        .catch((error)=>{
            console.log(`Error on leave:`)
            console.log(payload)
            console.log(error)
            return JSON.stringify(error)
        })
    }
    private withTimestamp(data: FirebaseFirestore.DocumentData): FirebaseFirestore.DocumentData {
        return { ...data, timestamp: new Date().toUTCString() }
    }

    private async join(payload: SlackPayload){
        return this.db.collection(`queue/${payload.channel_id}/members`).doc(payload.user_id)
        .set(this.withTimestamp(payload)).then(()=>{
            console.log(`Successful Join:`)
            console.log(payload)
            return  `<@${payload.user_id}> has joined the queue!`
            }
        )
        .catch(error=>{
            console.log(`Error on join:`)
            console.log(payload)
            console.log(error)
            return JSON.stringify(error)
        })
    }

    private help(){
        return "*ChimaQueue*\n" +
          "For usage help, access: https://github.com/lucasvschenatto/chimaqueue.\n" +
          "Available Commands: `new, join, leave, next, who, blame, members, clear`.";
      }
    
}