import { describe, it, expect } from 'vitest';
import { isNationalHoliday, getRenopsForDate } from './holidayUtils';
import type { Route } from '../types/supabase';

describe('holidayUtils', () => {
  describe('isNationalHoliday', () => {
    it('detects Indonesian national holidays accurately', () => {
      const newYear = isNationalHoliday('2026-01-01');
      expect(newYear.isHoliday).toBe(true);
      expect(newYear.holidayName).toContain('Tahun Baru');

      const independenceDay = isNationalHoliday('2026-08-17');
      expect(independenceDay.isHoliday).toBe(true);
      expect(independenceDay.holidayName).toContain('Kemerdekaan');
    });

    it('returns false for regular days', () => {
      const normalDay = isNationalHoliday('2026-09-09');
      expect(normalDay.isHoliday).toBe(false);
      expect(normalDay.holidayName).toBeUndefined();
    });
  });

  describe('getRenopsForDate', () => {
    const mockRoute: Route = {
      id: 3,
      uuid: 'route-jak15',
      route_code: 'JAK.15',
      route_name: 'Bulak Turi - Tanjung Priok',
      is_active: true,
      default_renops: 60,
      renops_weekday: 60,
      renops_saturday: 50,
      renops_sunday: 45,
      renops_holiday: 40,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    it('returns weekday renops on Monday through Friday', () => {
      // 2026-09-09 is Wednesday
      const result = getRenopsForDate(mockRoute, '2026-09-09');
      expect(result.dayType).toBe('weekday');
      expect(result.renops).toBe(60);
      expect(result.label).toContain('Hari Kerja');
    });

    it('returns saturday renops on Saturday', () => {
      // 2026-09-12 is Saturday
      const result = getRenopsForDate(mockRoute, '2026-09-12');
      expect(result.dayType).toBe('saturday');
      expect(result.renops).toBe(50);
      expect(result.label).toContain('Sabtu');
    });

    it('returns sunday renops on Sunday', () => {
      // 2026-09-13 is Sunday
      const result = getRenopsForDate(mockRoute, '2026-09-13');
      expect(result.dayType).toBe('sunday');
      expect(result.renops).toBe(45);
      expect(result.label).toContain('Minggu');
    });

    it('prioritizes holiday renops on a national holiday occurring on a weekday', () => {
      // 2026-08-17 is Monday (Hari Kemerdekaan)
      const result = getRenopsForDate(mockRoute, '2026-08-17');
      expect(result.dayType).toBe('holiday');
      expect(result.renops).toBe(40);
      expect(result.label).toContain('Kemerdekaan');
    });

    it('falls back to default_renops when specific renops is not configured', () => {
      const basicRoute: Route = {
        ...mockRoute,
        renops_weekday: undefined,
        renops_saturday: undefined,
        renops_sunday: undefined,
        renops_holiday: undefined,
      };

      const result = getRenopsForDate(basicRoute, '2026-09-12'); // Saturday
      expect(result.renops).toBe(60); // falls back to default_renops 60
    });

    it('handles null or undefined route safely', () => {
      const result = getRenopsForDate(null, '2026-09-09');
      expect(result.renops).toBe(0);
      expect(result.dayType).toBe('weekday');
    });
  });
});
