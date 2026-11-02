import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  uploadBackupToDrive,
  pruneOldBackups,
  filterExpiredBackupFiles,
} from '../gdrive-uploader.mjs';

describe('Google Drive Backup Uploader & Pruning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filters out files older than retention days while preserving recent ones', () => {
    const now = new Date('2026-11-02T12:00:00Z').getTime();
    const files = [
      { id: 'file-1', name: 'SS_PDO_BACKUP_2026-11-01_020000.zip', createdTime: '2026-11-01T02:00:00Z' }, // 1 day old
      { id: 'file-2', name: 'SS_PDO_BACKUP_2026-10-15_020000.zip', createdTime: '2026-10-15T02:00:00Z' }, // 18 days old
      { id: 'file-3', name: 'SS_PDO_BACKUP_2026-09-20_020000.zip', createdTime: '2026-09-20T02:00:00Z' }, // 43 days old (expired)
      { id: 'file-4', name: 'SS_PDO_BACKUP_2026-08-01_020000.zip', createdTime: '2026-08-01T02:00:00Z' }, // 93 days old (expired)
    ];

    const expired = filterExpiredBackupFiles(files, 30, now);
    expect(expired).toHaveLength(2);
    expect(expired.map((f) => f.id)).toEqual(['file-3', 'file-4']);
  });

  it('uploads backup zip file via Google Drive multipart upload endpoint', async () => {
    const mockFileContent = Buffer.from('dummy-zip-content');
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'uploaded-drive-id-123', name: 'SS_PDO_BACKUP_2026-11-02.zip' }),
    });

    const result = await uploadBackupToDrive({
      fileName: 'SS_PDO_BACKUP_2026-11-02.zip',
      fileBuffer: mockFileContent,
      folderId: 'folder-gdrive-123',
      accessToken: 'gdrive-token-abc',
      fetchImpl: mockFetch as any,
    });

    expect(result.id).toBe('uploaded-drive-id-123');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer gdrive-token-abc',
        }),
      })
    );
  });

  it('prunes expired files by calling Google Drive DELETE endpoint', async () => {
    const now = new Date('2026-11-02T12:00:00Z').getTime();
    const mockListResponse = {
      files: [
        { id: 'fresh-1', name: 'SS_PDO_BACKUP_2026-11-01.zip', createdTime: '2026-11-01T02:00:00Z' },
        { id: 'expired-1', name: 'SS_PDO_BACKUP_2026-09-01.zip', createdTime: '2026-09-01T02:00:00Z' },
      ],
    };

    const mockFetch = vi.fn().mockImplementation(async (url, options) => {
      if (options?.method === 'DELETE') {
        return { ok: true, status: 204 };
      }
      return {
        ok: true,
        status: 200,
        json: async () => mockListResponse,
      };
    });

    const deleted = await pruneOldBackups({
      folderId: 'folder-gdrive-123',
      maxAgeDays: 30,
      accessToken: 'gdrive-token-abc',
      nowTimestamp: now,
      fetchImpl: mockFetch as any,
    });

    expect(deleted).toHaveLength(1);
    expect(deleted[0].id).toBe('expired-1');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('https://www.googleapis.com/drive/v3/files/expired-1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
