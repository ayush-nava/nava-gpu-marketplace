import { Rental, RentalStatus } from '../types';
import { listings } from './listings';

// Fixed IPs and fingerprints — no randomness
const ips = [
  '98.51.100.42', '72.14.203.18', '104.26.55.91', '85.199.47.63', '91.108.12.77',
  '67.220.91.34', '103.21.244.15', '78.46.211.99', '45.33.32.156', '162.55.84.201',
];

const fingerprints = [
  'SHA256:a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
  'SHA256:b4c9d3e2f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2',
  'SHA256:c5d0e4f3a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3',
  'SHA256:d6e1f5a4b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4',
  'SHA256:e7f2a6b5c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5',
  'SHA256:f8a3b7c6d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6',
  'SHA256:a9b4c8d7e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7',
  'SHA256:b0c5d9e8f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8',
  'SHA256:c1d6e0f9a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9',
  'SHA256:d2e7f1a0b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0',
];

// Use fixed base time so server/client agree
const BASE_TIME = new Date('2026-04-30T08:00:00.000Z').getTime();

function generateRental(index: number, status: RentalStatus): Rental {
  const listing = listings[index % listings.length];

  let startTime: number;
  let endTime: number;

  if (status === 'active') {
    const hoursAgo = (index * 3 + 2) % 12 + 1;
    startTime = BASE_TIME - hoursAgo * 3600000;
    const duration = (index * 7 + 6) % 72 + 6;
    endTime = startTime + duration * 3600000;
  } else if (status === 'scheduled') {
    const hoursFromNow = (index * 5 + 4) % 48 + 1;
    startTime = BASE_TIME + hoursFromNow * 3600000;
    const duration = (index * 11 + 8) % 48 + 6;
    endTime = startTime + duration * 3600000;
  } else {
    const daysAgo = (index * 3 + 1) % 14 + 1;
    startTime = BASE_TIME - daysAgo * 86400000;
    const duration = (index * 9 + 12) % 72 + 6;
    endTime = startTime + duration * 3600000;
  }

  const hours = (endTime - startTime) / 3600000;
  const totalCost = Math.round(hours * listing.pricePerHour * 100) / 100;

  return {
    id: `rnt-${String(index + 1).padStart(4, '0')}`,
    listingId: listing.id,
    listing,
    startTime: new Date(startTime).toISOString(),
    endTime: new Date(endTime).toISOString(),
    status,
    sshHost: ips[index % ips.length],
    sshPort: 22,
    sshUser: 'ubuntu',
    sshFingerprint: fingerprints[index % fingerprints.length],
    totalCost,
  };
}

export const rentals: Rental[] = [
  ...Array.from({ length: 3 }, (_, i) => generateRental(i, 'active')),
  ...Array.from({ length: 2 }, (_, i) => generateRental(i + 3, 'scheduled')),
  ...Array.from({ length: 5 }, (_, i) => generateRental(i + 5, 'completed')),
];

export const activeRentals = rentals.filter(r => r.status === 'active');
export const scheduledRentals = rentals.filter(r => r.status === 'scheduled');
export const completedRentals = rentals.filter(r => r.status === 'completed');
