export const members = [
  {
    m_id: 1,
    m_name: 'Vedant Rathi',
    email: 'rathivedant.06@gmail.com',
    phone: '9503985700',
    city: 'Pune',
    age: 19,
    join_date: '2026-03-22',
    fitness_level: 'Advanced',
    role: 'admin',
    password: 'admin123',
  },
  {
    m_id: 2,
    m_name: 'Zaid Pathan',
    email: 'zpathan@gmail.com',
    phone: '9999999999',
    city: 'Pune',
    age: 22,
    join_date: '2026-03-22',
    fitness_level: 'Advanced',
    role: 'admin',
    password: 'admin123',
  },
  {
    m_id: 3,
    m_name: 'Samiksha Rathi',
    email: 'srathi0044@gmail.com',
    phone: '9503990700',
    city: 'Pune',
    age: 21,
    join_date: '2026-03-22',
    fitness_level: 'Beginner',
    role: 'member',
  },
  {
    m_id: 4,
    m_name: 'Siya Sinnarkar',
    email: 'siya1202@gmail.com',
    phone: '9999994859',
    city: 'Pune',
    age: 20,
    join_date: '2026-03-22',
    fitness_level: 'Intermediate',
    role: 'member',
  },
  {
    m_id: 5,
    m_name: 'Gargi Mokashi',
    email: 'gmokashi@gmail.com',
    phone: '8988998999',
    city: 'Pune',
    age: 19,
    join_date: '2026-03-22',
    fitness_level: 'Intermediate',
    role: 'member',
  },
]

export const events = [
  { e_id: 1, e_name: 'Sunday Morning Run', e_type: 'group_run', e_date: '2025-01-05', e_time: '06:30:00', location: 'Pashan Lake, Pune', distance: 5, max_capacity: 5 },
  { e_id: 2, e_name: 'Baner Hill Climb', e_type: 'challenge', e_date: '2025-01-12', e_time: '06:00:00', location: 'Baner Hill, Pune', distance: 8, max_capacity: 20 },
  { e_id: 3, e_name: 'Aundh 10K Run', e_type: 'group_run', e_date: '2025-01-19', e_time: '06:30:00', location: 'Aundh Road, Pune', distance: 10, max_capacity: 25 },
  { e_id: 4, e_name: 'Hinjewadi Night Run', e_type: 'special', e_date: '2025-02-01', e_time: '19:00:00', location: 'Hinjewadi Phase 1, Pune', distance: 6, max_capacity: 40 },
  { e_id: 5, e_name: 'Fitness Relay Game', e_type: 'game', e_date: '2025-02-09', e_time: '07:00:00', location: 'Balewadi Stadium, Pune', distance: 3, max_capacity: 30 },
  { e_id: 6, e_name: 'Wakad Sunday Run', e_type: 'group_run', e_date: '2025-02-16', e_time: '06:30:00', location: 'Wakad Bridge, Pune', distance: 5, max_capacity: 30 },
  { e_id: 7, e_name: 'Kothrud 7K Challenge', e_type: 'challenge', e_date: '2025-03-02', e_time: '06:00:00', location: 'Kothrud, Pune', distance: 7, max_capacity: 20 },
  { e_id: 8, e_name: 'Veloxx Monthly Meetup', e_type: 'special', e_date: '2025-03-16', e_time: '07:00:00', location: 'Pune University Ground', distance: 5, max_capacity: 50 },
]

export const registrations = [
  { reg_id: 1, m_id: 1, e_id: 1, reg_date: '2026-03-22', reg_status: 'registered' },
  { reg_id: 2, m_id: 2, e_id: 1, reg_date: '2026-03-22', reg_status: 'registered' },
  { reg_id: 3, m_id: 3, e_id: 1, reg_date: '2026-03-22', reg_status: 'registered' },
  { reg_id: 4, m_id: 4, e_id: 1, reg_date: '2026-03-22', reg_status: 'registered' },
  { reg_id: 5, m_id: 5, e_id: 1, reg_date: '2026-03-22', reg_status: 'registered' },
  { reg_id: 6, m_id: 1, e_id: 2, reg_date: '2026-03-22', reg_status: 'registered' },
  { reg_id: 7, m_id: 2, e_id: 2, reg_date: '2026-03-22', reg_status: 'registered' },
  { reg_id: 8, m_id: 4, e_id: 2, reg_date: '2026-03-22', reg_status: 'cancelled' },
  { reg_id: 9, m_id: 1, e_id: 3, reg_date: '2026-03-22', reg_status: 'registered' },
  { reg_id: 10, m_id: 2, e_id: 3, reg_date: '2026-03-22', reg_status: 'registered' },
  { reg_id: 11, m_id: 5, e_id: 3, reg_date: '2026-03-22', reg_status: 'registered' },
  { reg_id: 12, m_id: 1, e_id: 4, reg_date: '2026-03-22', reg_status: 'registered' },
  { reg_id: 13, m_id: 3, e_id: 4, reg_date: '2026-03-22', reg_status: 'registered' },
  { reg_id: 14, m_id: 4, e_id: 4, reg_date: '2026-03-22', reg_status: 'registered' },
  { reg_id: 15, m_id: 5, e_id: 4, reg_date: '2026-03-22', reg_status: 'registered' },
  { reg_id: 16, m_id: 2, e_id: 5, reg_date: '2026-03-22', reg_status: 'registered' },
  { reg_id: 17, m_id: 3, e_id: 5, reg_date: '2026-03-22', reg_status: 'registered' },
  { reg_id: 18, m_id: 1, e_id: 6, reg_date: '2026-03-22', reg_status: 'registered' },
  { reg_id: 19, m_id: 4, e_id: 6, reg_date: '2026-03-22', reg_status: 'registered' },
  { reg_id: 20, m_id: 5, e_id: 6, reg_date: '2026-03-22', reg_status: 'registered' },
  { reg_id: 21, m_id: 2, e_id: 7, reg_date: '2026-03-25', reg_status: 'registered' },
]

export const attendance = [
  { reg_id: 1, attended: 1 },
  { reg_id: 2, attended: 1 },
  { reg_id: 3, attended: 1 },
  { reg_id: 4, attended: 1 },
  { reg_id: 5, attended: 1 },
  { reg_id: 6, attended: 1 },
  { reg_id: 7, attended: 1 },
  { reg_id: 8, attended: 0 },
  { reg_id: 9, attended: 1 },
  { reg_id: 10, attended: 1 },
  { reg_id: 11, attended: 0 },
  { reg_id: 12, attended: 1 },
  { reg_id: 13, attended: 1 },
  { reg_id: 14, attended: 1 },
  { reg_id: 15, attended: 0 },
  { reg_id: 16, attended: 1 },
  { reg_id: 17, attended: 1 },
  { reg_id: 18, attended: 1 },
  { reg_id: 19, attended: 0 },
  { reg_id: 20, attended: 0 },
]

export const eventSummary = events
  .map((event) => {
    const eventRegistrations = registrations.filter((registration) => registration.e_id === event.e_id)
    const totalAttended = eventRegistrations.reduce((count, registration) => {
      const attendanceRow = attendance.find((entry) => entry.reg_id === registration.reg_id)
      return count + (attendanceRow?.attended ?? 0)
    }, 0)

    return {
      e_name: event.e_name,
      e_date: event.e_date,
      location: event.location,
      total_registered: eventRegistrations.length,
      total_attended: totalAttended,
    }
  })
  .filter((event) => event.total_registered > 0)
