export default defineEventHandler(async (event) => {
  const { institution, code } = getRouterParams(event)
  const query = getQuery(event)
  
  if (!institution || !code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Institution and code parameters are required'
    })
  }

  try {
    // Extract query parameters
    const day = query.day as string || new Date().toISOString().split('T')[0]
    const startTime = query.startTime as string || '08:00'
    const endTime = query.endTime as string || '18:00'

    // Sample rooms data
    const rooms = [
      {
        id: '1',
        name: 'Main Hall',
        capacity: 500,
        sort: 1,
        floor: 'Ground Floor',
        equipment: ['projector', 'sound_system', 'microphones']
      },
      {
        id: '2',
        name: 'Conference Room A',
        capacity: 100,
        sort: 2,
        floor: 'First Floor',
        equipment: ['projector', 'whiteboard']
      },
      {
        id: '3',
        name: 'Conference Room B',
        capacity: 80,
        sort: 3,
        floor: 'First Floor',
        equipment: ['projector', 'whiteboard']
      },
      {
        id: '4',
        name: 'Meeting Room 1',
        capacity: 20,
        sort: 4,
        floor: 'Second Floor',
        equipment: ['tv_screen', 'whiteboard']
      },
      {
        id: '5',
        name: 'Meeting Room 2',
        capacity: 20,
        sort: 5,
        floor: 'Second Floor',
        equipment: ['tv_screen', 'whiteboard']
      }
    ]

    // Sample reservations data based on institution/code
    const reservations = [
      {
        id: 'res-1',
        title: `${institution.toUpperCase()} Opening Session`,
        start: `${day}T09:00:00`,
        end: `${day}T10:30:00`,
        roomId: '1',
        confirmed: true,
        type: 'plenary',
        organizer: institution.toUpperCase(),
        description: 'Welcome remarks and keynote presentations',
        attendees: 400
      },
      {
        id: 'res-2',
        title: 'Technical Session 1',
        start: `${day}T11:00:00`,
        end: `${day}T12:30:00`,
        roomId: '2',
        confirmed: true,
        type: 'technical',
        organizer: 'Technical Committee',
        description: 'Technical presentations and discussions',
        attendees: 80
      },
      {
        id: 'res-3',
        title: 'Working Group Meeting',
        start: `${day}T14:00:00`,
        end: `${day}T15:30:00`,
        roomId: '4',
        confirmed: false,
        type: 'working_group',
        organizer: 'Working Group Chair',
        description: 'Strategic planning discussion',
        attendees: 15
      },
      {
        id: 'res-4',
        title: `${code.toUpperCase()} Side Event`,
        start: `${day}T16:00:00`,
        end: `${day}T17:00:00`,
        roomId: '3',
        confirmed: true,
        type: 'side_event',
        organizer: 'Side Event Organizer',
        description: 'Special presentation on climate action',
        attendees: 60
      }
    ]

    // Filter reservations by time range if specified
    let filteredReservations = reservations
    if (startTime && endTime) {
      const startHour = parseInt(startTime.split(':')[0])
      const endHour = parseInt(endTime.split(':')[0])
      
      filteredReservations = reservations.filter(res => {
        const resStartHour = parseInt(res.start.split('T')[1].split(':')[0])
        const resEndHour = parseInt(res.end.split('T')[1].split(':')[0])
        
        return resStartHour >= startHour && resEndHour <= endHour + 1
      })
    }

    return {
      success: true,
      data: {
        conference: {
          institution: institution.toUpperCase(),
          code: code.toUpperCase(),
          day,
          startTime,
          endTime
        },
        rooms,
        reservations: filteredReservations,
        metadata: {
          totalRooms: rooms.length,
          totalReservations: filteredReservations.length,
          occupiedRooms: new Set(filteredReservations.map(r => r.roomId)).size,
          lastUpdated: new Date().toISOString()
        }
      }
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load schedule data'
    })
  }
})