// Advertise Page - Partner program for ethical advertisers
import { useNavigate } from 'react-router-dom';

const CDN_URL = import.meta.env.VITE_CDN_URL;

export function Advertise() {
  const navigate = useNavigate();

  return (
    <div className="legal-page">
      {/* Logo */}
      <div className="legal-page__header">
        <img
          src={`${CDN_URL}/logo.png`}
          alt="Philosify Logo"
          className="legal-page__logo"
          onClick={() => navigate('/')}
        />
      </div>

      {/* Content */}
      <div className="legal-page__content">
        <h1 className="legal-page__title">Advertise</h1>

        <div className="legal-page__body advertise-page">
          <p className="advertise-page__intro">
            Reach an audience that values reason, quality, and genuine improvement.
          </p>

          <h2>What We Accept</h2>
          <ul>
            <li><strong>Innovation</strong> — Tools and technology that solve real problems</li>
            <li><strong>Life Improvement</strong> — Products and services that make daily life better</li>
            <li><strong>Real Wellness</strong> — Evidence-based health, fitness, and mental well-being</li>
          </ul>

          <h2>What We Reject</h2>
          <ul>
            <li>Fraud, deception, or misleading claims</li>
            <li>Coercive business models (MLM, forced subscriptions)</li>
            <li>Pseudoscience or unverified health claims</li>
          </ul>

          <h2>How It Works</h2>
          <ol>
            <li><strong>Apply</strong> — Submit your business for review</li>
            <li><strong>AI Vetting</strong> — Our system evaluates alignment with our standards</li>
            <li><strong>Go Live</strong> — Approved partners appear in our curated directory</li>
          </ol>

          <h2>Our Standards</h2>
          <p>
            We believe in honest trade between rational individuals. Advertising on Philosify means
            no manipulation tactics, no repetitive exposure, and no interruption of user experience.
          </p>
          <p>
            One honest introduction to people actively seeking better tools for better lives.
          </p>

          <div className="advertise-page__cta">
            <a href="mailto:advertise@philosify.org" className="advertise-page__button">
              Apply Now
            </a>
          </div>

          <p className="advertise-page__disclaimer">
            Philosify reserves the right to decline any application that does not align with our
            values of reason, integrity, and voluntary exchange.
          </p>
        </div>

        <div className="legal-page__footer">
          <button onClick={() => navigate('/')} className="legal-page__back-btn">
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default Advertise;
