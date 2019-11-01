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
          [Actions.who]: this.who.bind(this),
          [Actions.blame]: this.blame.bind(this),
          [Actions.clear]: this.clear.bind(this),
          [Actions.help]: this.help.bind(this),
          [Actions.members]: this.showMembers.bind(this),
        }
    }

    public async execute(action: string, payload: SlackPayload) {
        if (!Actions[action]) {
          return `Action ${action} not available.`
        }
        return this.actionsMap[action](payload)
    }

    public async showMembers(payload: SlackPayload){
        const query = await this.db.collection(`queue/${payload.channel_id}/members`).orderBy(`timestamp`).get()
        if(query.empty){
            return `Queue is Empty`
        }
        let members:string[] = []
        query.forEach(member=>{
            const {user_id}= member.data() as Member
            members.push(user_id)
        })
        return `The following users are in this queue, in this order: <@${members.join(">, <@")}>.`
    }

    public async who(payload: SlackPayload){
        try{
            const queue = this.db.doc(`queue/${payload.channel_id}`)
            const queueSnapshot = await queue.get()
            const queueData = queueSnapshot.data() as Queue
            if (queueData.current_id) {
            return `<@${queueData.current_id}> is with the chimarrão. :chimas:`
            } else {
                return "The queue hasn't started yet. Use `join to start it!`"
            }
        }catch(error){
            console.log(error)
            return "The queue hasn't started yet. Use `join` to start it!"
        }
    }

    public async blame(payload: SlackPayload){
        try{
            const queue = this.db.doc(`queue/${payload.channel_id}`)
            const queueSnapshot = await queue.get()
            const queueData = queueSnapshot.data() as Queue
            if (queueData.current_id) {
                return `<@${queueData.current_id}> is holding the chimarrão. :blame:`
            } else {
                return "The queue hasn't started yet. Use `join to start it!`"
            }
        }catch(error){
            console.log(error)
            return "The queue hasn't started yet. Use `join` to start it!"
        }
    }

    private async clear(payload: SlackPayload){
        return new Promise<string>( async(resolve,reject)=>{
            try{
                const queueRef = this.db.doc(`queue/${payload.channel_id}`)
                queueRef.update({current_id:''})
                .then(()=>{return})
                .catch(error=>{console.log(error)})
                const collection = await this.db.collection(`queue/${payload.channel_id}/members`).get()
                collection.forEach(member=> member.ref.delete())
                resolve(`The queue has been cleared!`)
            }catch(error){
                console.log(`Error on clearing queue`)
                console.log(error)
                reject(JSON.stringify(error))
            }
        })
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
                    resolve(await this.restartQueue(payload))
                    return
                }else{
                    querySnapshot.forEach(next=>{
                        const nextData = next.data() as Member
                        queue.update({current_id:nextData.user_id})
                        .then(()=>{console.log(`updated new current id ${nextData.user_id}`)})
                        .catch(error=>{
                            console.log(`error updating current id`)
                            console.log(error)
                        })
                        const message = `The next in queue is <@${nextData.user_id}>. :chimas:`
                        console.log(`Successful next:`)
                        console.log(message)
                        resolve(message)
                        return
                    })
                }
            }catch(error){
                console.log(`Error on next`)
                console.log(error)
                reject(JSON.stringify(error))
            }
        })
    }
    private async restartQueue(payload: SlackPayload) {
        const query = this.db.collection(`queue/${payload.channel_id}/members`).orderBy('timestamp')
        const querySnapshot = await query.limit(1).get()
        let message = `Queue is empty, join now!`
        if(!querySnapshot.empty){
            querySnapshot.forEach(next=>{
                const nextMember = next.data() as Member
                const queue = this.db.doc(`queue/${payload.channel_id}`)
                queue.update({current_id: nextMember.user_id})
                .then(()=>{console.log(`updated new current id ${nextMember.user_id}`)})
                .catch(error=>{
                    console.log(`error updating current id`)
                    console.log(error)
                })
                message = `The next in queue is <@${nextMember.user_id}>. :chimas:`
                console.log(`Successful next in restart:`)
                console.log(message)
            })
        }
        return message
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