import { SlackPayload, Actions, Action } from "../localDefinitions"
import * as admin from 'firebase-admin'

interface Queue extends SlackPayload{
    current_id:string
}

interface Member extends SlackPayload{
    timestamp:string
}

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
          [Actions.next]: this.next.bind(this),
        //   [Actions.who]: this.who.bind(this),
        //   [Actions.blame]: this.blame.bind(this),
        //   [Actions.clear]: this.clear.bind(this),
          [Actions.help]: this.help.bind(this),
        //   [Actions.members]: this.showMembers.bind(this),
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
                await doc.set({...this.withTimestamp(payload),current_id:``} as Queue)
                const snapshot = await doc.collection(`members`).get()
                snapshot.docs.forEach(member=> member.ref.delete())
                resolve(`<!everyone>, queue started for channel ${payload.channel_name}! Prepare the chimas :chimas:`)
            }catch(error){
                console.log(`Error on new queue`)
                console.log(error)
                reject(JSON.stringify(error))
            }
        })
    }

    private async next(payload:SlackPayload){
        return new Promise<string>(async(resolve,reject)=>{
            try{
                const queue = this.db.doc(`queue/${payload.channel_id}`)
                const queueSnapshot = await queue.get()
                const queueData = queueSnapshot.data() as Queue
                let query = this.db.collection(`queue/${payload.channel_id}/members`).orderBy('timestamp')
                if(queueData.current_id){
                    const current = await this.db.doc(`queue/${payload.channel_id}/members/${queueData.current_id}`).get()
                    if(current.exists){
                        query = query.startAfter(current)
                    }
                }
                const querySnapshot = await query.limit(1).get()
                if(querySnapshot.empty){
                    console.log(`No next in Queue`)
                    console.log(payload)
                    resolve(this.restartQueue(payload))
                }
                querySnapshot.forEach(next=>{
                        const nextData = next.data() as Member
                        queue.update({current_id:nextData.user_id})
                        .then(()=>{console.log(`updated new current id ${nextData.user_id}`)})
                        .catch(error=>{throw error})
                        console.log(`Successful next:`)
                        console.log(payload)
                        resolve(`The next in queue is <@${nextData.user_id}>. :chimas:`)
                    })
            }catch(error){
                console.log(`Error on next`)
                console.log(error)
                reject(JSON.stringify(error))
            }
        })
    }
    private async restartQueue(payload: SlackPayload) {
        let query = this.db.collection(`queue/${payload.channel_id}/members`).orderBy('timestamp')
        const querySnapshot = await query.limit(1).get()
        if(!querySnapshot.empty){
            querySnapshot.forEach(next=>{
                const nextMember = next.data() as Member
                console.log(`Successful next:`)
                console.log(payload)
                return `The next in queue is <@${nextMember.user_id}>. :chimas:`
            })
        }
        return `Queue is empty, join now!`
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
        return { ...data, timestamp: new Date().toJSON() }
    }

    private async join(payload: SlackPayload){
        return this.db.collection(`queue/${payload.channel_id}/members`).doc(payload.user_id)
        .set(this.withTimestamp(payload) as Member).then(()=>{
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