export const youtubeDocNameToYoutubeLink = (docName: string): string => {
   return `youtube.com/watch?v=${docName.split(".")[0]}`
}