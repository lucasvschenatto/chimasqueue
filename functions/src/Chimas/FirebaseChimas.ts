import { SlackPayload, Actions, Action } from "../localDefinitions"


export default class FirebaseChimas{
    db: FirebaseFirestore.Firestore
    protected actionsMap: {[key in Actions]?: Action}
    constructor(db:FirebaseFirestore.Firestore) {
        this.db = db
        this.actionsMap = {
        //   [Actions.new]: this.newQueue.bind(this),
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

    private async join(payload: SlackPayload){
        console.log(payload)
        return this.db.collection(`queue/${payload.channel_id}/members`).doc(payload.user_id)
        .set(payload).then(()=>{
            return  `<@${payload.user_id}> has joined the queue!`
            }
        )
        .catch(error=>{
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