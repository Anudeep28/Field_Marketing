import { Visit, Client, TeamMember } from '../types';
import { generateId, getToday, getNow } from './helpers';
import { format, subDays, subHours, addDays } from 'date-fns';

export function getSampleTeamMembers(): TeamMember[] {
  return [
    {
      id: generateId(),
      name: 'Arjun Mehta',
      email: 'arjun.mehta@fieldpulse.in',
      phone: '+91 99887 76655',
      role: 'field_agent',
      status: 'active',
      createdAt: format(subDays(new Date(), 45), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
    },
    {
      id: generateId(),
      name: 'Kavitha Nair',
      email: 'kavitha.nair@fieldpulse.in',
      phone: '+91 88776 65544',
      role: 'field_agent',
      status: 'active',
      createdAt: format(subDays(new Date(), 30), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
    },
    {
      id: generateId(),
      name: 'Rohit Verma',
      email: 'rohit.verma@fieldpulse.in',
      phone: '+91 77665 54433',
      role: 'field_agent',
      status: 'active',
      createdAt: format(subDays(new Date(), 20), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
    },
    {
      id: generateId(),
      name: 'Deepa Kulkarni',
      email: 'deepa.k@fieldpulse.in',
      phone: '+91 66554 43322',
      role: 'field_agent',
      status: 'inactive',
      createdAt: format(subDays(new Date(), 60), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
    },
  ];
}

function dateStr(daysAgo: number): string {
  return format(subDays(new Date(), daysAgo), 'yyyy-MM-dd');
}

function isoStr(daysAgo: number, hoursAgo: number = 0): string {
  return subHours(subDays(new Date(), daysAgo), hoursAgo).toISOString();
}

function futureDate(daysAhead: number): string {
  return format(addDays(new Date(), daysAhead), 'yyyy-MM-dd');
}

export function getSampleClients(): Client[] {
  const now = getNow();
  return [
    {
      id: generateId(),
      name: 'Rajesh Kumar',
      company: 'TechVision Solutions',
      email: 'rajesh@techvision.com',
      phone: '+91 98765 43210',
      address: '42 MG Road, Bangalore, Karnataka',
      leadStatus: 'qualified',
      assignedTo: '',
      notes: 'Interested in enterprise marketing suite. Budget approved for Q2.',
      tags: ['Enterprise', 'Hot Lead'],
      totalVisits: 5,
      lastVisitDate: dateStr(1),
      createdAt: isoStr(30),
      updatedAt: now,
    },
    {
      id: generateId(),
      name: 'Priya Sharma',
      company: 'GreenLeaf Organics',
      email: 'priya@greenleaf.in',
      phone: '+91 87654 32109',
      address: '15 Nehru Place, New Delhi',
      leadStatus: 'contacted',
      assignedTo: '',
      notes: 'Organic food chain, 12 outlets across NCR. Looking for promotional materials.',
      tags: ['Retail', 'Multi-location'],
      totalVisits: 2,
      lastVisitDate: dateStr(3),
      createdAt: isoStr(20),
      updatedAt: now,
    },
    {
      id: generateId(),
      name: 'Amit Patel',
      company: 'Patel Construction',
      email: 'amit@patelconstruction.com',
      phone: '+91 76543 21098',
      address: '8 Satellite Road, Ahmedabad, Gujarat',
      leadStatus: 'won',
      assignedTo: '',
      notes: 'Signed annual contract. Quarterly review scheduled.',
      tags: ['VIP', 'Construction'],
      totalVisits: 8,
      lastVisitDate: dateStr(5),
      createdAt: isoStr(60),
      updatedAt: now,
    },
    {
      id: generateId(),
      name: 'Sneha Reddy',
      company: 'HealthFirst Clinics',
      email: 'sneha@healthfirst.in',
      phone: '+91 65432 10987',
      address: '22 Jubilee Hills, Hyderabad',
      leadStatus: 'new',
      assignedTo: '',
      notes: 'New chain of clinics. Needs brand visibility solutions.',
      tags: ['Healthcare', 'New'],
      totalVisits: 0,
      createdAt: isoStr(2),
      updatedAt: now,
    },
    {
      id: generateId(),
      name: 'Vikram Singh',
      company: 'AutoDrive Motors',
      email: 'vikram@autodrive.com',
      phone: '+91 54321 09876',
      address: '5 Industrial Area, Pune, Maharashtra',
      leadStatus: 'negotiation',
      assignedTo: '',
      notes: 'Negotiating annual marketing package. Needs custom brochures and digital ads.',
      tags: ['Automotive', 'Enterprise'],
      totalVisits: 4,
      lastVisitDate: dateStr(2),
      createdAt: isoStr(45),
      updatedAt: now,
    },
    {
      id: generateId(),
      name: 'Meera Iyer',
      company: 'SpiceRoute Restaurant',
      phone: '+91 43210 98765',
      address: '18 Church Street, Bangalore',
      leadStatus: 'proposal',
      assignedTo: '',
      notes: 'Restaurant chain launch. Proposal sent for grand opening campaign.',
      tags: ['F&B', 'Campaign'],
      totalVisits: 3,
      lastVisitDate: dateStr(7),
      createdAt: isoStr(25),
      updatedAt: now,
    },
  ];
}

export function getSampleVisits(clients: Client[]): Visit[] {
  const now = getNow();
  const visits: Visit[] = [];

  if (clients.length < 6) return visits;

  // Today's visits
  visits.push({
    id: generateId(),
    userId: '',
    clientId: clients[0].id,
    clientName: clients[0].name,
    date: getToday(),
    scheduledTime: '10:00 AM',
    status: 'completed',
    purpose: 'follow_up',
    notes: 'Discussed Q2 campaign strategy. Client approved the initial proposal.',
    outcome: 'Proposal approved. Moving to contract stage next week.',
    checkInTime: isoStr(0, 5),
    checkOutTime: isoStr(0, 4),
    checkInLocation: { latitude: 12.9716, longitude: 77.5946, address: '42 MG Road, Bangalore' },
    checkOutLocation: { latitude: 12.9716, longitude: 77.5946, address: '42 MG Road, Bangalore' },
    duration: 55,
    photos: [],
    createdAt: isoStr(0, 6),
    updatedAt: now,
  });

  visits.push({
    id: generateId(),
    userId: '',
    clientId: clients[4].id,
    clientName: clients[4].name,
    date: getToday(),
    scheduledTime: '2:00 PM',
    status: 'planned',
    purpose: 'other',
    notes: 'Final pricing discussion for annual package.',
    photos: [],
    createdAt: isoStr(1),
    updatedAt: now,
  });

  visits.push({
    id: generateId(),
    userId: '',
    clientId: clients[3].id,
    clientName: clients[3].name,
    date: getToday(),
    scheduledTime: '4:30 PM',
    status: 'planned',
    purpose: 'new_enquiry',
    notes: 'Introduction meeting. Showcase portfolio and service offerings.',
    photos: [],
    createdAt: isoStr(1),
    updatedAt: now,
  });

  // Yesterday
  visits.push({
    id: generateId(),
    userId: '',
    clientId: clients[1].id,
    clientName: clients[1].name,
    date: dateStr(1),
    scheduledTime: '11:00 AM',
    status: 'completed',
    purpose: 'trial',
    notes: 'Demonstrated digital signage solutions for all 12 outlets.',
    outcome: 'Client wants a pilot in 3 locations first. Follow-up next week.',
    checkInTime: isoStr(1, 5),
    checkOutTime: isoStr(1, 4),
    checkInLocation: { latitude: 28.6315, longitude: 77.2167, address: '15 Nehru Place, Delhi' },
    checkOutLocation: { latitude: 28.6315, longitude: 77.2167, address: '15 Nehru Place, Delhi' },
    duration: 45,
    photos: [],
    createdAt: isoStr(2),
    updatedAt: isoStr(1, 4),
  });

  visits.push({
    id: generateId(),
    userId: '',
    clientId: clients[0].id,
    clientName: clients[0].name,
    date: dateStr(1),
    scheduledTime: '3:00 PM',
    status: 'completed',
    purpose: 'follow_up',
    notes: 'Reviewed marketing analytics from previous campaign.',
    outcome: 'Metrics exceeded expectations. Client happy with ROI.',
    checkInTime: isoStr(1, 3),
    checkOutTime: isoStr(1, 2),
    checkInLocation: { latitude: 12.9716, longitude: 77.5946, address: '42 MG Road, Bangalore' },
    checkOutLocation: { latitude: 12.9716, longitude: 77.5946, address: '42 MG Road, Bangalore' },
    duration: 40,
    photos: [],
    createdAt: isoStr(2),
    updatedAt: isoStr(1, 2),
  });

  // 2 days ago
  visits.push({
    id: generateId(),
    userId: '',
    clientId: clients[4].id,
    clientName: clients[4].name,
    date: dateStr(2),
    scheduledTime: '10:30 AM',
    status: 'completed',
    purpose: 'trial',
    notes: 'Product demo for AutoDrive team. Showed print and digital packages.',
    outcome: 'Strong interest. Scheduled negotiation meeting.',
    checkInTime: isoStr(2, 6),
    checkOutTime: isoStr(2, 5),
    checkInLocation: { latitude: 18.5204, longitude: 73.8567, address: '5 Industrial Area, Pune' },
    checkOutLocation: { latitude: 18.5204, longitude: 73.8567, address: '5 Industrial Area, Pune' },
    duration: 70,
    photos: [],
    createdAt: isoStr(3),
    updatedAt: isoStr(2, 5),
  });

  // 3 days ago
  visits.push({
    id: generateId(),
    userId: '',
    clientId: clients[1].id,
    clientName: clients[1].name,
    date: dateStr(3),
    scheduledTime: '9:00 AM',
    status: 'completed',
    purpose: 'new_enquiry',
    notes: 'First meeting with GreenLeaf team. Discussed brand positioning needs.',
    outcome: 'Interested in branding package. Scheduled demo next week.',
    checkInTime: isoStr(3, 7),
    checkOutTime: isoStr(3, 6),
    checkInLocation: { latitude: 28.6315, longitude: 77.2167, address: '15 Nehru Place, Delhi' },
    checkOutLocation: { latitude: 28.6315, longitude: 77.2167, address: '15 Nehru Place, Delhi' },
    duration: 50,
    photos: [],
    createdAt: isoStr(4),
    updatedAt: isoStr(3, 6),
  });

  // 5 days ago
  visits.push({
    id: generateId(),
    userId: '',
    clientId: clients[2].id,
    clientName: clients[2].name,
    date: dateStr(5),
    scheduledTime: '2:00 PM',
    status: 'completed',
    purpose: 'follow_up',
    notes: 'Quarterly review meeting. Updated campaign collateral.',
    outcome: 'All deliverables accepted. Renewal confirmed for next year.',
    checkInTime: isoStr(5, 4),
    checkOutTime: isoStr(5, 3),
    checkInLocation: { latitude: 23.0225, longitude: 72.5714, address: '8 Satellite Road, Ahmedabad' },
    checkOutLocation: { latitude: 23.0225, longitude: 72.5714, address: '8 Satellite Road, Ahmedabad' },
    duration: 60,
    photos: [],
    createdAt: isoStr(6),
    updatedAt: isoStr(5, 3),
  });

  // 7 days ago
  visits.push({
    id: generateId(),
    userId: '',
    clientId: clients[5].id,
    clientName: clients[5].name,
    date: dateStr(7),
    scheduledTime: '11:00 AM',
    status: 'completed',
    purpose: 'collection',
    notes: 'Signed contract for grand opening campaign package.',
    outcome: 'Deal closed! Campaign starts in 2 weeks.',
    checkInTime: isoStr(7, 5),
    checkOutTime: isoStr(7, 4),
    checkInLocation: { latitude: 12.9716, longitude: 77.5946, address: '18 Church Street, Bangalore' },
    checkOutLocation: { latitude: 12.9716, longitude: 77.5946, address: '18 Church Street, Bangalore' },
    duration: 90,
    photos: [],
    createdAt: isoStr(8),
    updatedAt: isoStr(7, 4),
  });

  // Cancelled visit
  visits.push({
    id: generateId(),
    userId: '',
    clientId: clients[5].id,
    clientName: clients[5].name,
    date: dateStr(4),
    scheduledTime: '3:00 PM',
    status: 'cancelled',
    purpose: 'follow_up',
    notes: 'Client rescheduled due to internal meeting conflict.',
    photos: [],
    createdAt: isoStr(5),
    updatedAt: isoStr(4),
  });

  // Future planned visits
  visits.push({
    id: generateId(),
    userId: '',
    clientId: clients[2].id,
    clientName: clients[2].name,
    date: futureDate(1),
    scheduledTime: '11:00 AM',
    status: 'planned',
    purpose: 'follow_up',
    notes: 'Monthly check-in. Review campaign metrics.',
    photos: [],
    createdAt: now,
    updatedAt: now,
  });

  visits.push({
    id: generateId(),
    userId: '',
    clientId: clients[1].id,
    clientName: clients[1].name,
    date: futureDate(2),
    scheduledTime: '10:00 AM',
    status: 'planned',
    purpose: 'trial',
    notes: 'Pilot demo at Saket outlet for digital signage.',
    photos: [],
    createdAt: now,
    updatedAt: now,
  });

  visits.push({
    id: generateId(),
    userId: '',
    clientId: clients[5].id,
    clientName: clients[5].name,
    date: futureDate(3),
    scheduledTime: '2:30 PM',
    status: 'planned',
    purpose: 'follow_up',
    notes: 'Pre-launch review for grand opening campaign.',
    photos: [],
    createdAt: now,
    updatedAt: now,
  });

  return visits;
}
