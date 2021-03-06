import QueueHolder from "./QueueHolder";
import { SlackPayload, Action, Actions } from "../../localDefinitions";

export default class InMemoryAmargo {
  private queues: QueueHolder;
  protected actionsMap: {[key in Actions]: Action}
  constructor() {
    this.queues = new QueueHolder();
    this.actionsMap = {
      [Actions.new]: this.newQueue.bind(this),
      [Actions.join]: this.join.bind(this),
      [Actions.leave]: this.leave.bind(this),
      [Actions.next]: this.next.bind(this),
      [Actions.who]: this.who.bind(this),
      [Actions.blame]: this.blame.bind(this),
      [Actions.clear]: this.clear.bind(this),
      [Actions.help]: this.help.bind(this),
      [Actions.members]: this.showMembers.bind(this)
    }
  }

  public execute(action: string, payload: SlackPayload): string {
    if (!Actions[action]) {
      return "Action not available.";
    }
    return this.actionsMap[action](payload);
  }

  private join(payload: SlackPayload): string {
    let message: string;
    try {
      const channelName = payload.channel_name
      const userName = payload.user_id
      this.queues.get(channelName).add(userName);
      message = `<@${userName}> has joined the queue!`;
    } catch (e) {
      message = e.message;
    }
    return message;
  }

  private newQueue(payload: SlackPayload): string {
    let message: string;
    try {
      const channelName = payload.channel_name
      this.queues.create(channelName);
      message = `<!everyone>, queue started for channel ${channelName}! Prepare the chimas :chimas:`;
    } catch (e) {
      message = e.message;
    }
    return message;
  }

  private leave(payload: SlackPayload): string {
    let message: string;
    try {
      const channelName = payload.channel_name
      const userName = payload.user_id
      this.queues.get(channelName).remove(userName);
      message = `User <@${userName}> has left the queue.`;
    } catch (e) {
      message = e.message;
    }
    return message;
  }

  private next(payload: SlackPayload): string {
    let message: string;
    try {
      const channelName = payload.channel_name
      const next = this.queues.get(channelName).whosNext();
      message = `The next in queue is <@${next}>. :chimas:`;
    } catch (e) {
      message = e.message;
    }
    return message;
  }

  private who(payload: SlackPayload): string {
    let message: string;
    try {
      const channelName = payload.channel_name
      const user = this.queues.get(channelName).whosWithIt();
      if (user) {
        message = `<@${user}> is with the chimarrão. :chimas:`;
      } else {
        message = "The queue hasn't started yet. Use `new` and/or `join to start it!`";
      }
    } catch (e) {
      message = e.message;
    }
    return message;
  }

  private blame(payload: SlackPayload): string {
    let message: string;
    try {
      const channelName = payload.channel_name
      const user = this.queues.get(channelName).whosWithIt();
      if (user) {
        message = `<@${user}> is holding the chimarrão. :blame:`;
      } else {
        message = "The queue hasn't started yet. Use `new` and/or `join to start it!`";
      }
    } catch (e) {
      message = e.message;
    }
    return message;
  }

  private clear(payload: SlackPayload): string {
    let message: string;
    try {
      const channelName = payload.channel_name
      this.queues.get(channelName).clear();
      message = `The queue has been cleared!`;
    } catch (e) {
      message = e.message;
    }
    return message;
  }

  private help(): string {
    return "*ChimaQueue*\n" +
      "For usage help, access: https://github.com/lucasvschenatto/chimaqueue.\n" +
      "Available Commands: `new, join, leave, next, who, blame, members, clear`.";
  }

  private showMembers(payload: SlackPayload): string {
    let message: string;
    try {
      const channelName = payload.channel_name
      const usersInQueue = this.queues.get(channelName).getGuestList();
      if (usersInQueue.length > 0) {
        message = `The following users are in this queue, in this order: <@${usersInQueue.join(">, <@")}>.`;
      } else {
        message = "Nobody is in the queue right now. *Want to be the first?* Type `/join`!";
      }
    } catch (e) {
      message = e.message;
    }
    return message;
  }
}