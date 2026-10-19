export const regions = [
  { id: 'palembang', name: 'Palembang', origin: 'Palembang, Sumatra Selatan' },
  { id: 'padang', name: 'Padang / Minang', origin: 'Minangkabau, Sumatra Barat' },
  { id: 'jawa', name: 'Jawa', origin: 'Jawa' },
  { id: 'makassar', name: 'Makassar', origin: 'Makassar, Sulawesi Selatan' },
] as const;
export const regionName = (id: string) => regions.find(region => region.id === id)?.name || 'Semua daerah';
