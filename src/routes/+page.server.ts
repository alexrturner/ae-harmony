import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  // if (!locals.user) {
  //   return {
  //     chats: []
  //   }
  // }

  try {
    const chatRecords = await locals.pb.collection('chats').getFullList({
      expand: 'participants',
      sort: '-lastMessageDate'
    })

    // Process the chats server-side
    const maxSize = Math.max(...chatRecords.map(c => c.totalSize || 0))
    
    const enhancedChats = chatRecords.map(chat => {
      const participantNames = []
      const participantColors = []
      
      if (chat.expand?.participants) {
        for (const participant of chat.expand.participants) {
          participantNames.push(participant.username || 'Anonymous')
          participantColors.push(participant.colour || '#' + Math.floor(Math.random()*16777215).toString(16))
        }
      }
      
      return {
        ...chat,
        color: '#' + Math.floor(Math.random()*16777215).toString(16),
        normalizedSize: maxSize > 0 ? (chat.totalSize || 0) / maxSize : 0,
        participantNames,
        participantColors,
        totalSize: chat.totalSize || 0,
        lastMessageDate: chat.lastMessageDate || new Date().toISOString()
      }
    })

    return {
      chats: enhancedChats
    }
  } catch (error) {
    console.error('Error loading chats server-side:', error)
    return {
      chats: []
    }
  }
} 