import { useState, useEffect } from 'react';

export const SyncQueueBadge = () => {
  const [queueLength, setQueueLength] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [queueItems, setQueueItems] = useState<any[]>([]);

  useEffect(() => {
    const checkQueue = () => {
      const q = JSON.parse(localStorage.getItem('PDO_SYNC_QUEUE') || '[]');
      setQueueLength(q.length);
      setQueueItems(q);
    };
    checkQueue();
    const interval = setInterval(checkQueue, 2000);
    return () => clearInterval(interval);
  }, []);

  if (queueLength === 0) return null;

  return (
    <>
      <div 
        className="fixed bottom-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-full cursor-pointer shadow-lg z-50 hover:bg-orange-600 transition flex items-center gap-2"
        onClick={() => setIsOpen(true)}
      >
        <span>☁️</span>
        <span style={{ fontWeight: 'bold' }}>{queueLength} Tertunda</span>
      </div>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
          onClick={() => setIsOpen(false)}
          style={{ backdropFilter: 'blur(4px)' }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto" 
            onClick={e => e.stopPropagation()}
            style={{ 
              background: 'var(--bg-card)', 
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow)',
              border: '1px solid var(--border-color)',
            }}
          >
            <h2 className="text-xl font-bold mb-4" style={{ fontSize: '1.25rem', marginBottom: '16px' }}>
              Antrean Sinkronisasi (Offline)
            </h2>
            {queueItems.length === 0 ? <p>Tidak ada antrean.</p> : null}
            {queueItems.map((item, i) => (
              <div key={i} className="border-b py-2 text-sm" style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                <p style={{ margin: '0 0 4px 0' }}><strong>Data:</strong> {item.tabName} (Baris: {item.rowIndex})</p>
                <p style={{ margin: 0, color: 'var(--warning-color)', fontSize: '0.875rem' }}>
                  Status: {item.status === 'pending' ? 'Menunggu Sinyal / Proses' : item.status}
                </p>
              </div>
            ))}
            <button 
              className="btn"
              style={{ marginTop: '16px', width: '100%', background: 'var(--accent-color)', color: 'white' }}
              onClick={() => setIsOpen(false)}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
};
