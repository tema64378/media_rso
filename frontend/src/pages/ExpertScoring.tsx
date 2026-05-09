import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../components';
import '../styles/expert-scoring.css';

interface Criterion {
  id: number;
  name: string;
  max_score: number;
}

interface Score {
  criterion_id: number;
  score: number;
  comment?: string;
}

export default function ExpertScoring() {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<any>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [scores, setScores] = useState<Record<number, Score>>({});
  const [loading, setLoading] = useState(true);
  const [token] = useState(localStorage.getItem('token'));

  useEffect(() => {
    Promise.all([
      fetch(`http://127.0.0.1:8080/submissions/${id}`).then(r => r.json()),
      fetch('http://127.0.0.1:8080/criteria').then(r => r.json()),
    ]).then(([sub, crit]) => {
      setSubmission(sub.submission);
      setCriteria(crit.criteria);
      setLoading(false);
    });
  }, [id]);

  const handleScoreChange = (criterionId: number, score: number, comment?: string) => {
    setScores({
      ...scores,
      [criterionId]: { criterion_id: criterionId, score, comment }
    });
  };

  const handleSubmit = async () => {
    for (const [_, scoreData] of Object.entries(scores)) {
      await fetch(`http://127.0.0.1:8080/submissions/${id}/scores`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scoreData)
      });
    }
    alert('Scores submitted!');
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!submission) return <div className="error">Submission not found</div>;

  return (
    <div className="expert-scoring-container">
      <div className="submission-preview">
        <h1>{submission.title}</h1>
        <p className="author">By {submission.author}</p>
        <p className="description">{submission.description}</p>
        {submission.url && (
          <a href={submission.url} target="_blank" rel="noopener noreferrer" className="submission-link">
            View Submission
          </a>
        )}
      </div>

      <div className="scoring-form">
        <h2>Rate This Work</h2>
        {criteria.map(criterion => (
          <div key={criterion.id} className="criterion-score">
            <label>{criterion.name}</label>
            <input
              type="range"
              min="0"
              max={criterion.max_score}
              defaultValue="0"
              onChange={(e) => handleScoreChange(criterion.id, parseInt(e.target.value))}
              className="score-slider"
            />
            <span className="score-value">{scores[criterion.id]?.score || 0} / {criterion.max_score}</span>
            <textarea
              placeholder="Comment (optional)"
              onChange={(e) => handleScoreChange(criterion.id, scores[criterion.id]?.score || 0, e.target.value)}
              className="comment-input"
            />
          </div>
        ))}
        <Button onClick={handleSubmit} variant="primary">Submit Scores</Button>
      </div>
    </div>
  );
}
