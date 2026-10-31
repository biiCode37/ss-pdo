// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  confirmWhitelistOverride,
  confirmBlacklistOverride,
  confirmResetPageSettings,
} from './pageAccessSafetyDialog';
import { pdoSwal } from '../alertUtils';

vi.mock('../alertUtils', async () => {
  const actual = await vi.importActual<any>('../alertUtils');
  return {
    ...actual,
    pdoSwal: {
      fire: vi.fn(),
    },
  };
});

describe('pageAccessSafetyDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('confirmWhitelistOverride menampilkan peringatan dengan data tersanitasi', async () => {
    (pdoSwal.fire as any).mockResolvedValue({ isConfirmed: true });

    const result = await confirmWhitelistOverride(
      { email: 'budi@transjakarta.co.id', full_name: 'Budi <script>alert(1)</script>', role: 'pdo' },
      'Monitoring 18 Rute Wilayah'
    );

    expect(result).toBe(true);
    expect(pdoSwal.fire).toHaveBeenCalled();
    const callArgs = (pdoSwal.fire as any).mock.calls[0][0];
    expect(callArgs.title).toBe('Konfirmasi Pengecualian Akses');
    expect(callArgs.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(callArgs.html).toContain('PDO');
    expect(callArgs.html).toContain('Monitoring 18 Rute Wilayah');
    expect(callArgs.confirmButtonText).toBe('Ya, Berikan Akses');
  });

  it('confirmBlacklistOverride menampilkan dialog pembatasan akses', async () => {
    (pdoSwal.fire as any).mockResolvedValue({ isConfirmed: false });

    const result = await confirmBlacklistOverride(
      { email: 'ani@transjakarta.co.id', full_name: 'Ani Admin', role: 'admin' },
      'Dashboard Operasional Rute'
    );

    expect(result).toBe(false);
    expect(pdoSwal.fire).toHaveBeenCalled();
    const callArgs = (pdoSwal.fire as any).mock.calls[0][0];
    expect(callArgs.title).toBe('Konfirmasi Pembatasan Akses');
    expect(callArgs.html).toContain('Ani Admin');
    expect(callArgs.confirmButtonText).toBe('Ya, Batasi Akses');
  });

  it('confirmResetPageSettings menampilkan dialog konfirmasi reset massal', async () => {
    (pdoSwal.fire as any).mockResolvedValue({ isConfirmed: true });

    const result = await confirmResetPageSettings(3);

    expect(result).toBe(true);
    expect(pdoSwal.fire).toHaveBeenCalled();
    const callArgs = (pdoSwal.fire as any).mock.calls[0][0];
    expect(callArgs.title).toBe('Kembalikan Pengaturan Standar?');
    expect(callArgs.html).toContain('3 halaman');
    expect(callArgs.confirmButtonText).toBe('Ya, Kembalikan');
  });
});

