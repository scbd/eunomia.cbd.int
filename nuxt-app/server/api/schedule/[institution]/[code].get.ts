export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { institution, code } = query
  
  if (!institution || !code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Institution and code parameters are required'
    })
  }
  
  // Mock schedule data - in a real implementation, this would fetch from database
  const mockSchedule = {
    eventGroup: {
      institution: institution as string,
      code: code as string,
      name: `${institution} ${code}`,
      startDate: '2024-02-15',
      endDate: '2024-02-20',
      location: 'Geneva, Switzerland'
    },
    sessions: [
      {
        id: 'session1',
        title: 'Opening Ceremony',
        startTime: '09:00',
        endTime: '10:30',
        date: '2024-02-15',
        room: 'Main Hall',
        description: 'Welcome remarks and keynote presentations',
        speakers: ['Dr. Jane Smith', 'Prof. John Doe']
      },
      {
        id: 'session2',
        title: 'Technical Session 1',
        startTime: '11:00',
        endTime: '12:30',
        date: '2024-02-15',
        room: 'Conference Room A',
        description: 'Technical presentations and discussions',
        speakers: ['Dr. Alice Johnson', 'Dr. Bob Wilson']
      },
      {
        id: 'session3',
        title: 'Panel Discussion',
        startTime: '14:00',
        endTime: '15:30',
        date: '2024-02-15',
        room: 'Main Hall',
        description: 'Expert panel on current challenges',
        speakers: ['Dr. Carol Brown', 'Dr. David Lee', 'Dr. Eva Martinez']
      }
    ]
  }
  
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200))
    
    return {
      success: true,
      data: mockSchedule
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch schedule data'
    })
  }
})