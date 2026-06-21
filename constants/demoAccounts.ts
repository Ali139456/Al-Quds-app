/** Demo accounts seeded in the backend (password: 123456). */
export const DEMO_ACCOUNTS = {
  customer: {
    email: 'customer@alquds.local',
    password: '123456',
    label: 'Customer',
  },
  rider: {
    email: 'rider@alquds.local',
    phone: '03007654321',
    password: '123456',
    label: 'Rider',
  },
} as const;
