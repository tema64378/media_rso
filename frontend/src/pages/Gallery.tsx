import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../components';
import '../styles/gallery.css';

interface Submission {
  id: number;
  title: string;
  description?: string;
  author?: string;
  url?: string;
  total_score?: number;
}

export default function Gallery() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole] = useState(localStorage.getItem('userRole'));
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://127.0.0.1:8080/submissions')
      .then(r => r.json())
      .then(data => {
        setSubmissions(data.submissions || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="gallery-container">
      <h1>Media Contest Submissions</h1>
      <p className="subtitle">Browse all submitted works</p>
      
      <div className="submissions-grid">
        {submissions.length === 0 ? (
          <p className="empty">No submissions yet</p>
        ) : (
          submissions.map(sub => (
            <Card key={sub.id} variant="default">
              <div className="submission-card">
                <h3>{sub.title}</h3>
                <p className="author">by {sub.author || 'Anonymous'}</p>
                {sub.description && <p className="description">{sub.description.substring(0, 100)}...</p>}
                
                <div className="actions">
                  {sub.url && (
                    <a href={sub.url} target="_blank" rel="noopener noreferrer" className="action-link">
                      View
                    </a>
                  )}
                  {userRole === 'expert' && (
                    <Button 
                      onClick={() => navigate(`/scoring/${sub.id}`)}
                      variant="secondary"
                    >
                      Rate
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
