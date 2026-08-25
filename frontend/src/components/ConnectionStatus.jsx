import { useEffect, useState } from 'react';
import { checkBackend } from '../services/api';

function ConnectionStatus() {
  const [status, setStatus] = useState({ loading: true, backend: false, database: false });

  useEffect(() => {
    checkBackend()
      .then((health) => setStatus({ loading: false, backend: true, database: health.database === 'connected' }))
      .catch(() => setStatus({ loading: false, backend: false, database: false }));
  }, []);

  if (status.loading) return <p className="text-muted">Checking backend connection...</p>;

  return (
    <section aria-label="Development connection status" className="mt-4">
      <h2 className="h5">Development connection</h2>
      <p>Backend: <strong>{status.backend ? 'Connected' : 'Disconnected'}</strong></p>
      <p>Database: <strong>{status.database ? 'Connected' : 'Unavailable'}</strong></p>
    </section>
  );
}

export default ConnectionStatus;