// ShareToCommunityButton - View/Join artist collective for this analysis
// In the new feed-based system, analyses are auto-added to collectives
// This button helps users find and join the artist's collective
import { useState, useEffect } from 'react';
import { Users, Check, UserPlus } from 'lucide-react';
import { collectiveService } from '@/services/api/collective';
import { useAuth } from '@/hooks/useAuth';

export function ShareToCommunityButton({ analysisId, artist, onOpenCommunity }) {
  const { isAuthenticated } = useAuth();
  const [artistCollective, setArtistCollective] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  // Find the artist's collective on mount
  useEffect(() => {
    if (!isAuthenticated || !artist) return;

    async function findArtistCollective() {
      setLoading(true);
      try {
        // Search for artist's collective
        const browseData = await collectiveService.browseCollectives(artist);
        const groups = browseData.groups || [];

        // Find exact or close match
        const artistLower = artist.toLowerCase();
        const match = groups.find(
          (g) =>
            g.artist_name.toLowerCase() === artistLower ||
            g.artist_name.toLowerCase().includes(artistLower) ||
            artistLower.includes(g.artist_name.toLowerCase())
        );

        if (match) {
          setArtistCollective(match);

          // Check if user is a member
          const myData = await collectiveService.getMyCollectives();
          const myGroups = myData.groups || [];
          setIsMember(myGroups.some((g) => g.id === match.id));
        }
      } catch (err) {
        console.error('[ShareToCommunity] Error finding collective:', err);
      } finally {
        setLoading(false);
      }
    }

    findArtistCollective();
  }, [isAuthenticated, artist]);

  const handleJoin = async () => {
    if (!artistCollective) return;

    setJoining(true);
    setError(null);
    try {
      await collectiveService.joinCollective(artistCollective.id);
      setIsMember(true);
    } catch (err) {
      if (err.message?.includes('Already')) {
        setIsMember(true);
      } else {
        setError(err.message);
      }
    } finally {
      setJoining(false);
    }
  };

  const handleViewCollective = () => {
    // Trigger community panel to open on Collective tab with this artist
    if (onOpenCommunity) {
      onOpenCommunity('collective', artistCollective?.id);
    }
  };

  if (!isAuthenticated || !analysisId) return null;

  // Loading state
  if (loading) {
    return (
      <div className="share-community-container">
        <button className="share-community-btn" disabled>
          <Users size={18} />
          <span>...</span>
        </button>
      </div>
    );
  }

  // No collective found - don't show button (rare edge case for very old cache)
  if (!artistCollective) {
    return null;
  }

  // User is already a member - show "View in Collective"
  if (isMember) {
    return (
      <div className="share-community-container">
        <button
          className="share-community-btn share-community-btn--member"
          onClick={handleViewCollective}
          title={`View in ${artistCollective.artist_name} Collective`}
        >
          <Check size={18} />
          <span>{artistCollective.artist_name} Collective</span>
        </button>
      </div>
    );
  }

  // User not a member - show "Join Collective"
  return (
    <div className="share-community-container">
      <button
        className="share-community-btn share-community-btn--join"
        onClick={handleJoin}
        disabled={joining}
        title={`Join ${artistCollective.artist_name} Collective`}
      >
        <UserPlus size={18} />
        <span>{joining ? 'Joining...' : `Join ${artistCollective.artist_name}`}</span>
      </button>
      {error && <div className="share-community-error">{error}</div>}
    </div>
  );
}

export default ShareToCommunityButton;
