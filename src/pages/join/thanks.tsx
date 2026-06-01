import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';

export default function JoinThanks() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold">Thank you!</h1>
          <p className="mt-3 text-neutral-700">We’ve received your interest. Our team will reach out soon.</p>
          <div className="mt-6 flex gap-3 justify-center">
            <button onClick={() => navigate('/')} className="rounded-full border px-5 py-3 font-semibold hover:bg-neutral-50">Back to Home</button>
            <button onClick={() => navigate('/badges')} className="rounded-full bg-amber-600 text-white px-5 py-3 font-semibold hover:bg-amber-500">Explore Badges</button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

