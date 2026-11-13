import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function VersionHistory({ onRestore }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadVersions() {
      const { data, error } = await supabase
        .from("portfolio_versions")
        .select("version_id, content, published_at")
        .eq("portfolio_id", "main")
        .order("version_id", { ascending: false })
        .limit(30);

      if (!active) return;

      if (error) {
        setError(error.message);
      } else {
        setVersions(data ?? []);
      }

      setLoading(false);
    }

    loadVersions();

    return () => {
      active = false;
    };
  }, []);

  function restore(version) {
    const confirmed = window.confirm(
      "Load this version into your editor? " +
      "Unsaved edits will be replaced. " +
      "Your public website will not change until you publish."
    );

    if (!confirmed) return;

    onRestore(version.content);
  }

  if (loading) {
    return <p className="history-message">Loading versions...</p>;
  }

  if (error) {
    return (
      <p className="history-message" role="alert">
        Could not load history: {error}
      </p>
    );
  }

  return (
    <div className="cms-panel history-panel">
      <h2>Published Versions</h2>
      <p className="history-description">
        Select a previous version to restore it into your
        editor. Nothing changes publicly until you publish.
      </p>

      {versions.length === 0 && (
        <p className="history-message">
          No published versions have been recorded yet.
        </p>
      )}

      <div className="history-list">
        {versions.map((version, index) => (
          <article
            className="history-item"
            key={version.version_id}
          >
            <div className="history-information">
              <span className="history-number">
                VERSION {version.version_id}
              </span>

              <h3>
                {index === 0
                  ? "Latest recorded publication"
                  : "Previous publication"}
              </h3>

              <time dateTime={version.published_at}>
                {new Date(version.published_at).toLocaleString()}
              </time>

              <p>
                {version.content?.profile?.title ||
                  "Professional portfolio"}
              </p>

              <span className="history-summary">
                {version.content?.projects?.length ?? 0} projects
                {" · "}
                {version.content?.skills?.length ?? 0} skills
              </span>
            </div>

            <button
              type="button"
              className="history-restore"
              onClick={() => restore(version)}
            >
              Restore to Editor
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
