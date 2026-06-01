export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl sm:text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-4 text-sm text-neutral-700">Last updated: {new Date().toISOString().slice(0,10)}</p>

        <section className="mt-8 space-y-4 text-sm leading-6">
          <p>
            Advent Band collects minimal analytics to improve app reliability and content relevance. We do not sell data.
          </p>
          <h2 className="text-lg font-semibold">Data We Collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>App interactions (page views, screen views, button taps)</li>
            <li>Approximate device info (user agent, IP at time of request)</li>
            <li>A randomly generated device identifier (client ID) for aggregate usage stats</li>
          </ul>
          <h2 className="text-lg font-semibold mt-6">How We Use Data</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To measure features usage and improve stability and performance</li>
            <li>To detect issues and prevent abuse</li>
          </ul>
          <h2 className="text-lg font-semibold mt-6">Data Sharing</h2>
          <p>We do not sell personal data. Limited service providers (hosting, analytics) may process data on our behalf under contract.</p>
          <h2 className="text-lg font-semibold mt-6">Retention</h2>
          <p>Analytics logs are retained for a limited period to support trend analysis and debugging.</p>
          <h2 className="text-lg font-semibold mt-6">Your Choices</h2>
          <p>You may clear app data or request deletion of server-side logs related to your interactions by contacting support.</p>
          <h2 className="text-lg font-semibold mt-6">Contact</h2>
          <p>Email: support@adventband.org</p>
        </section>
      </main>
    </div>
  );
}

