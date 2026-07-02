import { useState, useEffect, useMemo, useRef, lazy, Suspense, memo } from 'react';
import sortBy from 'lodash/sortBy';
import { useVirtualizer } from '@tanstack/react-virtual';
import './App.css';

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

// Reused single Intl.DateTimeFormat instance to avoid creating it on every render
const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZoneName: 'short',
});

function formatTimestamp(unixTime) {
  return dateTimeFormatter.format(new Date(unixTime * 1000));
}

function getScoreClass(score) {
  if (score >= 200) return 'article-item__score--high';
  if (score >= 50) return 'article-item__score--medium';
  return 'article-item__score--low';
}

// Wrapped with React.memo to prevent unnecessary re-renders when parent state changes.
// Since the props passed (article, index) have stable references, memo is highly effective.
const ArticleItem = memo(function ArticleItem({ article, index }) {
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
});

// Dynamic import for code splitting
const Footer = lazy(() => import('./Footer'));

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
        setLoadedCount(0);

        const response = await fetch(`${HN_API_BASE}/topstories.json`);
        if (!response.ok) throw new Error('Failed to fetch story IDs');
        const storyIds = await response.json();

        // Parallelize fetching of Hacker News items (N+1 query optimization)
        const idsToFetch = storyIds.slice(0, 500);
        const promises = idsToFetch.map(async (id) => {
          try {
            const storyResp = await fetch(`${HN_API_BASE}/item/${id}.json`);
            if (storyResp.ok) {
              const storyData = await storyResp.json();
              if (storyData) {
                setLoadedCount((prev) => prev + 1);
                return storyData;
              }
            }
          } catch {
            // Skip failed individual fetches
          }
          return null;
        });

        const resolvedStories = await Promise.all(promises);
        const stories = resolvedStories.filter(Boolean);
        setArticles(stories);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllStories();
  }, []);

  // Memoized filter and sort computation to avoid calculation on every render
  const displayedArticles = useMemo(() => {
    let result = articles.filter((article) =>
      article.title?.toLowerCase().includes(filterText.toLowerCase())
    );

    if (sortByScore) {
      result = sortBy(result, 'score').reverse();
    }
    return result;
  }, [articles, filterText, sortByScore]);

  // Ref for virtualization container
  const parentRef = useRef();

  // Initialize virtualization virtualizer
  const rowVirtualizer = useVirtualizer({
    count: displayedArticles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 90, // Approximate height of ArticleItem
    overscan: 5,
  });

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="app">
      {/* Masthead */}
      <header className="masthead">
        <h1 className="masthead__logo">
          Hacker<span className="masthead__logo-accent">Pulse</span>
        </h1>
        <p className="masthead__tagline">
          Real-time top stories from Hacker News — curated and performance-engineered
        </p>

        {/* Optimized Hero Image: Explicit width, height, srcset for responsive loading without layout shift */}
        <div className="masthead__hero-container">
          <img
            src="/hero-large.webp"
            srcSet="/hero-small.webp 480w, /hero-medium.webp 768w, /hero-large.webp 1200w"
            sizes="(max-width: 600px) 480px, (max-width: 900px) 768px, 1200px"
            alt="HackerPulse Hero Banner"
            width="1200"
            height="400"
            className="masthead__hero-img"
            loading="eager"
          />
        </div>

        <hr className="masthead__rule" />
      </header>

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
          // Virtualized rendering of 500+ items
          <div
            ref={parentRef}
            className="virtual-list-container"
            style={{ height: '70vh' }}
            data-testid="article-list"
          >
            <div
              className="virtual-list-inner"
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const article = displayedArticles[virtualRow.index];
                if (!article) return null;
                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    className="virtual-list-item"
                    style={{
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <ArticleItem
                      article={article}
                      index={virtualRow.index}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}

export default App;
