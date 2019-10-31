import { SlackPayload, Actions, Action } from "../localDefinitions"


export default class FirebaseChimas{
    db: FirebaseFirestore.Firestore
    protected actionsMap: {[key in Actions]?: Action}
    constructor(db:FirebaseFirestore.Firestore) {
        this.db = db
        this.actionsMap = {
          [Actions.new]: this.newQueue.bind(this),
          [Actions.join]: this.join.bind(this),
        //   [Actions.leave]: this.leave.bind(this),
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
                await doc.set(payload)
                const snapshot = await doc.collection(`members`).get()
                snapshot.docs.forEach(member=> member.ref.delete())
                resolve(`<!everyone>, queue started for channel ${payload.channel_name}! Prepare the chimas :chimas:`)
            }catch(error){
                console.log(`Error on new queue`)
                console.log(error)
                reject(error)
            }
            // .then(()=>{
            //     doc.collection(`members`).get().then(snapshot=>{
            //         snapshot.docs.forEach(member=> member.ref.delete())
            //     }).catch(error=>{
            //         console.log(`Error on clear members`)
            //         console.log(error)
            //         reject(error)
            //     })
            //     resolve(`<!everyone>, queue started for channel ${payload.channel_name}! Prepare the chimas :chimas:`)
            // })
            // .catch(error=>{
            //     console.log(`Error on creating new queue`)
            //     console.log(error)
            //     reject(error)
            // })
        })
    }

    private async join(payload: SlackPayload){
        return this.db.collection(`queue/${payload.channel_id}/members`).doc(payload.user_id)
        .set(payload).then(()=>{
            console.log(`Successful Join:`)
            console.log(payload)
            return  `<@${payload.user_id}> has joined the queue!`
            }
        )
        .catch(error=>{
            console.log(`Error on Join:`)
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