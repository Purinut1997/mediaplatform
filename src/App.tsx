import './App.css'

const setupSteps = [
  'Create a private GitHub repository',
  'Connect the repository to Cloudflare Pages',
  'Create a Neon Postgres database',
  'Add DATABASE_URL in Cloudflare environment variables',
  'Deploy and test /api/health',
]

const modules = [
  { title: 'Media Library', value: 'Cards, covers, tags, preview links' },
  { title: 'Access Control', value: 'Public, member, VIP, admin' },
  { title: 'External Sources', value: 'Drive, Sheets, YouTube, demo links' },
  { title: 'Super Admin', value: 'Manage content without editing code' },
]

function App() {
  return (
    <main className="app-shell">
      <section className="hero-section" aria-labelledby="page-title">
        <div className="hero-copy">
          <p className="eyebrow">Cloudflare + Neon starter</p>
          <h1 id="page-title">Media VIP Platform</h1>
          <p className="hero-text">
            A starter workspace for your member media library, admin dashboard,
            Drive previews, Google Sheet templates, and YouTube lessons.
          </p>
          <div className="actions">
            <a href="/api/health" className="primary-action">
              Test API
            </a>
            <a href="/api/db-check" className="secondary-action">
              Test Neon
            </a>
            <a href="https://dash.cloudflare.com/" className="secondary-action">
              Open Cloudflare
            </a>
          </div>
        </div>

        <div className="status-panel" aria-label="Project setup status">
          <div className="panel-header">
            <span className="status-dot" />
            <span>Setup checklist</span>
          </div>
          <ol>
            {setupSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className="module-grid" aria-label="Planned modules">
        {modules.map((module) => (
          <article className="module-card" key={module.title}>
            <h2>{module.title}</h2>
            <p>{module.value}</p>
          </article>
        ))}
      </section>
    </main>
  )
}

export default App
