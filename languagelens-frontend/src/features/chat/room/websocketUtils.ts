export const isSocketAckMessage = (rawMsg: string) => {
    const msg = JSON.parse(rawMsg)
    return msg.hasOwnProperty("id");
}