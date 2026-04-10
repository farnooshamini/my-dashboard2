/* ============================================
   ForexSupport Pro — Mock Data Store
   ============================================ */

const FXSP_DATA = {

    /* ── Tickets ── */
    tickets: [
        { id: 'TKT-4821', subject: 'Withdrawal pending for 5 days — urgent', client: 'Marcus Webb', clientId: 'CLI-10042', email: 'marcus.webb@email.com', category: 'Withdrawal', priority: 'Critical', status: 'escalated', assignee: 'You', created: '2024-01-10T08:14:00', updated: '2024-01-10T09:30:00', description: 'Client initiated a withdrawal of $12,500 five days ago. Funds have not arrived. Account is verified and KYC approved.' },
        { id: 'TKT-4820', subject: 'Unable to open EUR/USD positions — platform error', client: 'Sophie Laurent', clientId: 'CLI-10038', email: 'sophie.l@email.com', category: 'Platform', priority: 'High', status: 'in-progress', assignee: 'You', created: '2024-01-10T07:50:00', updated: '2024-01-10T08:45:00', description: 'Client reports that clicking "Open Position" on EUR/USD gives an error: "Order rejected - margin insufficient" despite having sufficient balance.' },
        { id: 'TKT-4819', subject: 'Leverage change request — 1:200 to 1:500', client: 'Raj Patel', clientId: 'CLI-10031', email: 'raj.patel@email.com', category: 'Account', priority: 'Medium', status: 'pending', assignee: 'You', created: '2024-01-10T06:30:00', updated: '2024-01-10T07:00:00', description: 'Client is requesting to increase their account leverage from 1:200 to 1:500 for swing trading strategy.' },
        { id: 'TKT-4818', subject: 'KYC document verification — passport rejected', client: 'Elena Kovac', clientId: 'CLI-10055', email: 'e.kovac@email.com', category: 'KYC/AML', priority: 'High', status: 'open', assignee: 'Sarah Chen', created: '2024-01-09T15:20:00', updated: '2024-01-09T16:00:00', description: 'Client uploaded passport but it was auto-rejected. Image is clear, all information visible.' },
        { id: 'TKT-4817', subject: 'Bonus credit query — referral program', client: 'James O\'Brien', clientId: 'CLI-10028', email: 'james.ob@email.com', category: 'Promotions', priority: 'Low', status: 'resolved', assignee: 'You', created: '2024-01-09T11:00:00', updated: '2024-01-09T13:45:00', description: 'Client referred 3 friends but only received bonus for 2. Investigating discrepancy.' },
        { id: 'TKT-4816', subject: 'MT4 login credentials not working after password reset', client: 'Yuki Tanaka', clientId: 'CLI-10019', email: 'yuki.t@email.com', category: 'Platform', priority: 'Medium', status: 'in-progress', assignee: 'Marcus Johnson', created: '2024-01-09T09:15:00', updated: '2024-01-09T10:30:00', description: 'After resetting password via client portal, MT4 still shows authentication error.' },
        { id: 'TKT-4815', subject: 'Deposit via bank transfer not credited — 48 hours', client: 'Ahmed Hassan', clientId: 'CLI-10067', email: 'ahmed.h@email.com', category: 'Deposit', priority: 'High', status: 'open', assignee: 'Priya Patel', created: '2024-01-08T14:00:00', updated: '2024-01-08T14:00:00', description: 'Client made bank transfer of $5,000. Attached proof of payment. Funds not yet reflected.' },
        { id: 'TKT-4814', subject: 'Account locked after suspicious login attempt', client: 'Clara Hoffmann', clientId: 'CLI-10044', email: 'clara.h@email.com', category: 'Security', priority: 'Critical', status: 'escalated', assignee: 'Sarah Chen', created: '2024-01-08T08:30:00', updated: '2024-01-08T09:00:00', description: 'Client received security alert email about login attempt from unknown IP. Account auto-locked.' },
        { id: 'TKT-4813', subject: 'Tax document request for 2023 fiscal year', client: 'Pierre Dupont', clientId: 'CLI-10012', email: 'p.dupont@email.com', category: 'Documents', priority: 'Low', status: 'resolved', assignee: 'Emma Wilson', created: '2024-01-07T10:00:00', updated: '2024-01-07T15:00:00', description: 'Client requesting annual statement and tax documents for 2023.' },
        { id: 'TKT-4812', subject: 'Swap rates incorrect on gold positions', client: 'Natasha Ivanova', clientId: 'CLI-10073', email: 'n.ivanova@email.com', category: 'Trading', priority: 'Medium', status: 'pending', assignee: 'You', created: '2024-01-07T08:45:00', updated: '2024-01-07T09:00:00', description: 'Client claims overnight swap on XAU/USD is higher than what was advertised. Requesting clarification.' },
        { id: 'TKT-4811', subject: 'Account upgrade to VIP tier — eligibility check', client: 'David Nguyen', clientId: 'CLI-10009', email: 'd.nguyen@email.com', category: 'Account', priority: 'Low', status: 'open', assignee: 'Marcus Johnson', created: '2024-01-06T14:20:00', updated: '2024-01-06T14:20:00', description: 'Client inquiring about VIP tier requirements and requesting account review.' },
        { id: 'TKT-4810', subject: 'Partial close not executing — error code 4110', client: 'Isabella Rossi', clientId: 'CLI-10082', email: 'i.rossi@email.com', category: 'Platform', priority: 'High', status: 'in-progress', assignee: 'You', created: '2024-01-06T11:00:00', updated: '2024-01-06T12:15:00', description: 'Client unable to partially close positions. MT5 returns error 4110 - invalid volume.' },
    ],

    /* ── Clients ── */
    clients: [
        { id: 'CLI-10042', name: 'Marcus Webb',      email: 'marcus.webb@email.com',  country: 'United Kingdom', accountType: 'Standard',  balance: '$12,450.00', status: 'active',   kyc: 'Verified',  openTickets: 1, joinDate: '2022-03-15', lastActivity: '2024-01-10', leverage: '1:100', platform: 'MT4' },
        { id: 'CLI-10038', name: 'Sophie Laurent',   email: 'sophie.l@email.com',     country: 'France',         accountType: 'Premium',   balance: '$48,230.00', status: 'active',   kyc: 'Verified',  openTickets: 1, joinDate: '2021-07-22', lastActivity: '2024-01-10', leverage: '1:200', platform: 'MT5' },
        { id: 'CLI-10031', name: 'Raj Patel',        email: 'raj.patel@email.com',    country: 'India',          accountType: 'Standard',  balance: '$3,800.00',  status: 'active',   kyc: 'Verified',  openTickets: 1, joinDate: '2023-01-10', lastActivity: '2024-01-09', leverage: '1:200', platform: 'MT4' },
        { id: 'CLI-10055', name: 'Elena Kovac',      email: 'e.kovac@email.com',      country: 'Croatia',        accountType: 'Basic',     balance: '$1,250.00',  status: 'pending',  kyc: 'Pending',   openTickets: 1, joinDate: '2024-01-05', lastActivity: '2024-01-09', leverage: '1:50',  platform: 'MT5' },
        { id: 'CLI-10028', name: "James O'Brien",    email: 'james.ob@email.com',     country: 'Ireland',        accountType: 'Standard',  balance: '$7,600.00',  status: 'active',   kyc: 'Verified',  openTickets: 0, joinDate: '2022-09-18', lastActivity: '2024-01-08', leverage: '1:100', platform: 'MT4' },
        { id: 'CLI-10019', name: 'Yuki Tanaka',      email: 'yuki.t@email.com',       country: 'Japan',          accountType: 'Premium',   balance: '$95,100.00', status: 'active',   kyc: 'Verified',  openTickets: 1, joinDate: '2020-11-04', lastActivity: '2024-01-09', leverage: '1:25',  platform: 'MT4' },
        { id: 'CLI-10067', name: 'Ahmed Hassan',     email: 'ahmed.h@email.com',      country: 'UAE',            accountType: 'VIP',       balance: '$220,000.00',status: 'active',   kyc: 'Verified',  openTickets: 1, joinDate: '2019-06-01', lastActivity: '2024-01-08', leverage: '1:500', platform: 'MT5' },
        { id: 'CLI-10044', name: 'Clara Hoffmann',   email: 'clara.h@email.com',      country: 'Germany',        accountType: 'Standard',  balance: '$18,750.00', status: 'suspended',kyc: 'Verified',  openTickets: 1, joinDate: '2021-12-14', lastActivity: '2024-01-08', leverage: '1:100', platform: 'MT4' },
        { id: 'CLI-10012', name: 'Pierre Dupont',    email: 'p.dupont@email.com',     country: 'France',         accountType: 'Premium',   balance: '$64,300.00', status: 'active',   kyc: 'Verified',  openTickets: 0, joinDate: '2020-04-22', lastActivity: '2024-01-07', leverage: '1:200', platform: 'MT5' },
        { id: 'CLI-10073', name: 'Natasha Ivanova',  email: 'n.ivanova@email.com',    country: 'Russia',         accountType: 'Standard',  balance: '$5,200.00',  status: 'active',   kyc: 'Verified',  openTickets: 1, joinDate: '2023-05-30', lastActivity: '2024-01-07', leverage: '1:100', platform: 'MT4' },
        { id: 'CLI-10009', name: 'David Nguyen',     email: 'd.nguyen@email.com',     country: 'Vietnam',        accountType: 'Standard',  balance: '$29,400.00', status: 'active',   kyc: 'Verified',  openTickets: 1, joinDate: '2022-01-19', lastActivity: '2024-01-06', leverage: '1:200', platform: 'MT5' },
        { id: 'CLI-10082', name: 'Isabella Rossi',   email: 'i.rossi@email.com',      country: 'Italy',          accountType: 'VIP',       balance: '$175,000.00',status: 'active',   kyc: 'Verified',  openTickets: 1, joinDate: '2019-09-12', lastActivity: '2024-01-06', leverage: '1:400', platform: 'MT5' },
    ],

    /* ── Team Members ── */
    team: [
        { id: 'AGT-01', name: 'Sarah Chen',      role: 'Senior Support Agent', status: 'active',  avatar: 'SC', color: 'av-purple', ticketsOpen: 14, ticketsResolved: 218, avgResponseTime: '8m', satisfaction: 97, specialization: 'KYC/AML, Compliance' },
        { id: 'AGT-02', name: 'Marcus Johnson',  role: 'Support Agent',        status: 'active',  avatar: 'MJ', color: 'av-green',  ticketsOpen: 9,  ticketsResolved: 143, avgResponseTime: '12m', satisfaction: 92, specialization: 'Platform Issues, MT4/MT5' },
        { id: 'AGT-03', name: 'Priya Patel',     role: 'Support Agent',        status: 'active',  avatar: 'PP', color: 'av-orange', ticketsOpen: 11, ticketsResolved: 162, avgResponseTime: '10m', satisfaction: 94, specialization: 'Deposits & Withdrawals' },
        { id: 'AGT-04', name: 'David Kim',       role: 'Support Agent',        status: 'away',    avatar: 'DK', color: 'av-blue',   ticketsOpen: 6,  ticketsResolved: 98,  avgResponseTime: '15m', satisfaction: 88, specialization: 'Trading, Order Issues' },
        { id: 'AGT-05', name: 'Emma Wilson',     role: 'Junior Support Agent', status: 'active',  avatar: 'EW', color: 'av-teal',   ticketsOpen: 7,  ticketsResolved: 67,  avgResponseTime: '18m', satisfaction: 85, specialization: 'General Inquiries, Docs' },
        { id: 'AGT-06', name: 'James Carter',    role: 'Team Lead',            status: 'active',  avatar: 'JC', color: 'av-indigo', ticketsOpen: 4,  ticketsResolved: 312, avgResponseTime: '6m',  satisfaction: 98, specialization: 'Escalations, VIP Clients' },
    ],

    /* ── Performance (weekly, my stats) ── */
    myPerformance: {
        ticketsResolved: 47,
        avgResponseTime: '9m 32s',
        satisfaction: 94.2,
        escalationRate: 3.1,
        weeklyResolved: [6, 8, 5, 9, 7, 8, 4],     // Mon–Sun
        weeklyResponse:  [11, 9, 12, 8, 10, 7, 11], // minutes
        categoryBreakdown: {
            labels: ['Platform', 'Deposits/WD', 'Account', 'KYC/AML', 'Trading', 'Other'],
            values: [28, 22, 18, 15, 11, 6]
        }
    },

    /* ── Activity Feed ── */
    activity: [
        { type: 'resolved',  icon: 'fa-check-circle', color: 'av-green',  text: '<strong>You</strong> resolved ticket <strong>TKT-4817</strong> — Bonus credit query', time: '12 minutes ago' },
        { type: 'escalated', icon: 'fa-exclamation-circle', color: 'av-red', text: '<strong>TKT-4814</strong> was escalated to Tier 2 by <strong>Sarah Chen</strong>', time: '34 minutes ago' },
        { type: 'assigned',  icon: 'fa-user-check',    color: 'av-blue',   text: '<strong>TKT-4819</strong> was assigned to <strong>You</strong> by James Carter', time: '1 hour ago' },
        { type: 'message',   icon: 'fa-comment-dots',  color: 'av-purple', text: '<strong>Marcus Webb</strong> replied to ticket <strong>TKT-4821</strong>', time: '1 hour ago' },
        { type: 'opened',    icon: 'fa-folder-open',   color: 'av-orange', text: 'New ticket <strong>TKT-4821</strong> opened by <strong>Marcus Webb</strong>', time: '2 hours ago' },
        { type: 'resolved',  icon: 'fa-check-circle',  color: 'av-green',  text: '<strong>Emma Wilson</strong> resolved ticket <strong>TKT-4813</strong>', time: '3 hours ago' },
        { type: 'note',      icon: 'fa-sticky-note',   color: 'av-teal',   text: '<strong>Priya Patel</strong> added a note to <strong>TKT-4815</strong>', time: '4 hours ago' },
    ],

    /* ── Chart data: last 7 days labels ── */
    weekLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};
