import { useState, useEffect } from 'react';
import _ from 'lodash'; // Anti-pattern: importing entire lodash library
import './App.css';

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

// Anti-pattern: expensive computation in render path, not memoized
function formatTimestamp(unixTime) {
  return new Date(unixTime * 1000).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });
}

function getScoreClass(score) {
  if (score >= 200) return 'article-item__score--high';
  if (score >= 50) return 'article-item__score--medium';
  return 'article-item__score--low';
}

// Anti-pattern: Not using React.memo, re-renders on every parent render
function ArticleItem({ article, index }) {
  // Anti-pattern: expensive computation called every render
  const formattedTime = formatTimestamp(article.time);

  return (
    <div className="article-item" data-testid="article-item">
      <div className="article-item__header">
        <div className={`article-item__score ${getScoreClass(article.score)}`}>
          {article.score}
          <span className="article-item__score-label">pts</span>
        </div>
        <div className="article-item__body">
          <h2 className="article-item__title">
            {article.url ? (
              <a href={article.url} target="_blank" rel="noopener noreferrer">
                {article.title}
              </a>
            ) : (
              article.title
            )}
          </h2>
          <div className="article-item__meta">
            <span className="article-item__meta-item">👤 {article.by}</span>
            <span className="article-item__meta-item">🕐 {formattedTime}</span>
            <span className="article-item__meta-item">💬 {article.descendants || 0} comments</span>
            <span className="article-item__meta-item">#{index + 1}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// No code splitting — Footer is bundled into main chunk
function Footer() {
  return (
    <footer className="footer">
      <p>
        Powered by{' '}
        <a href="https://news.ycombinator.com" target="_blank" rel="noopener noreferrer">
          Hacker News API
        </a>{' '}
        &middot; Built with React &amp; Vite &middot; Performance Engineering Demo
      </p>
    </footer>
  );
}

function App() {
  const [articles, setArticles] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [sortByScore, setSortByScore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadedCount, setLoadedCount] = useState(0);

  useEffect(() => {
    const fetchAllStories = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${HN_API_BASE}/topstories.json`);
        if (!response.ok) throw new Error('Failed to fetch story IDs');
        const storyIds = await response.json();

        const stories = [];

        // Anti-pattern: sequential fetching in a loop (N+1 requests)
        for (const id of storyIds.slice(0, 500)) {
          try {
            const storyResp = await fetch(`${HN_API_BASE}/item/${id}.json`);
            if (storyResp.ok) {
              const storyData = await storyResp.json();
              if (storyData) {
                stories.push(storyData);
                setLoadedCount(stories.length);
              }
            }
          } catch {
            // Skip failed individual fetches
          }
        }

        setArticles(stories);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllStories();
  }, []);

  // Anti-pattern: filtering and sorting on every render without memoization
  let displayedArticles = articles.filter((article) =>
    article.title?.toLowerCase().includes(filterText.toLowerCase())
  );

  if (sortByScore) {
    // Anti-pattern: using full lodash for a single function
    displayedArticles = _.sortBy(displayedArticles, 'score').reverse();
  }

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="app">
      {/* Hero Section */}
      <section className="hero">
        {/* Anti-pattern: unoptimized image — no width, height, srcset, or lazy loading */}
        <img
          src="/hero-large.png"
          alt="News Aggregator Hero Banner"
          className="hero__image"
          data-testid="hero-image"
        />
        <div className="hero__overlay">
          <h1 className="hero__title">HackerPulse</h1>
          <p className="hero__subtitle">
            Real-time top stories from Hacker News — curated and performance-engineered
          </p>
        </div>
      </section>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar__inner">
          <div className="toolbar__search-wrapper">
            <span className="toolbar__search-icon">🔍</span>
            <input
              type="text"
              className="toolbar__search"
              placeholder="Filter stories by title..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              id="filter-input"
            />
          </div>
          <button
            className={`toolbar__btn ${sortByScore ? 'toolbar__btn--active' : ''}`}
            onClick={() => setSortByScore(!sortByScore)}
            id="sort-button"
          >
            {sortByScore ? '🔥 Sorted by Score' : '↕️ Sort by Score'}
          </button>
          <span className="toolbar__stats">
            {loading
              ? `Loading... ${loadedCount}/500`
              : `${displayedArticles.length} of ${articles.length} stories`}
          </span>
        </div>
      </div>

      {/* Content */}
      <main className="content">
        {loading && (
          <div className="loading">
            <div className="loading__spinner"></div>
            <p className="loading__text">
              Fetching stories from Hacker News...
            </p>
            <div className="loading__progress">
              <div
                className="loading__progress-bar"
                style={{ width: `${(loadedCount / 500) * 100}%` }}
              ></div>
            </div>
            <p className="loading__text" style={{ fontSize: '0.8rem' }}>
              {loadedCount} / 500 stories loaded
            </p>
          </div>
        )}

        {error && (
          <div className="error">
            <h2 className="error__title">⚠️ Something went wrong</h2>
            <p className="error__message">{error}</p>
            <button className="error__retry" onClick={handleRetry}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          // Anti-pattern: rendering ALL items without virtualization
          <div className="article-list" data-testid="article-list">
            {displayedArticles.map((article, index) => (
              <ArticleItem
                key={article.id}
                article={article}
                index={index}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
