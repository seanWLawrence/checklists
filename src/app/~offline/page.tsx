const OfflinePage = () => {
  return (
    <main className="max-w-prose space-y-2">
      <h1 className="text-xl font-semibold">You are offline</h1>
      <p className="text-sm text-zinc-600">
        This page is cached for offline access. Please reconnect to sync your
        latest changes.
      </p>
    </main>
  );
};

export default OfflinePage;
