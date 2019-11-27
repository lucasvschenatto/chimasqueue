export interface SlackPayload{
    token: string
    type: string
    challenge: string
    text: string
    team_id: string
    channel_id: string
    user_id: string
    bot_id: string
    channel_name: string
    command: string
    user_name: string
    response_url: string
}
export enum Actions {
    new = "new",
    join = "join",
    leave = "leave",
    next = "next",
    who = "who",
    blame = "blame",
    members = "members",
    clear = "clear",
    help = "help"
}

export type Action = (payload: SlackPayload) => Promise<string>|string
