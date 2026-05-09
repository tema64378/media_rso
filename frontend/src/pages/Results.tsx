import { useState, useEffect } from 'react';
import { Card } from '../components';
import '../styles/results.css';

interface SubmissionWithScore {
  id: number;
  title: string;
  author?: string;
  total_score: number;
  rank: number;
}

export default function Results() {
  const [rankings, setRankings] = useState<SubmissionWithScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8080/submissions')
      .then(r => r.json())
      .then(async data => {
        const submissions = data.submissions || [];
        
        // Fetch scores for each submission
        const withScores = await Promise.all(
          submissions.map(async (sub: any) => {
            const scoreRes = await fetch(`http://127.0.0.1:8080/submissions/${sub.id}/winner`);
            const scoreData = await scoreRes.json();
            return {
              id: sub.id,
              title: sub.title,
              author: sub.author,
              total_score: scoreData.total_score || 0
            };
          })
        );

        // Sort by score descending and add ranks
        const ranked = withScores
          .sort((a, b) => b.total_score - a.total_score)
          .map((sub, idx) => ({ ...sub, rank: idx + 1 }));

        setRankings(ranked);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">Loading results...</div>;

  return (
    <div className="results-container">
      <h1>🏆 Contest Results</h1>
      
      <div className="rankings">
        {rankings.length === 0 ? (
          <p className="empty">No scores yet</p>
        ) : (
          rankings.map(sub => (
            <Card key={sub.id} variant={sub.rank <= 3 ? 'default' : 'default'}>
              <div className={`ranking-item rank-${sub.rank}`}>
                <div className="rank-badge">#{sub.rank}</div>
                <div className="ranking-info">
                  <h3>{sub.title}</h3>
                  <p className="author">{sub.author || 'Anonymous'}</p>
                </div>
                <div className="score-display">
                  <span className="score-value">{sub.total_score}</span>
                  <span className="score-label">points</span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
