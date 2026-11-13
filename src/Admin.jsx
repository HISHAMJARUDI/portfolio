import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import fallback from "./data/portfolio.json";
import MediaUpload from "./MediaUpload";
import App from "./App.jsx";
import VersionHistory from "./VersionHistory";
import "./Admin.css";

const sections = ["profile", "skills", "projects", "experience", "history"];

const templates = {
  skills: { name: "", category: "" },
  projects: {
    title: "", description: "", technologies: [],
    github: "", demo: ""
  },
  experience: {
    role: "", organization: "", period: "",
    description: ""
  }
};

function Admin() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [allowed, setAllowed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [section, setSection] = useState("profile");
  const [content, setContent] = useState(fallback);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  async function initialize(currentUser) {
    setLoading(true);
    setUser(currentUser);
    setAllowed(false);

    if (currentUser) {
      const { data: admin, error: roleError } =
        await supabase.rpc("is_portfolio_admin");

      if (roleError) {
        setStatus(roleError.message);
      }

      if (!roleError && admin === true) {
        setAllowed(true);
        const { data: record, error } = await supabase
          .from("portfolio_content")
          .select("content")
          .eq("id", "main")
          .maybeSingle();

        if (error) setStatus(error.message);
        else if (record?.content) setContent(record.content);

        // Restore a saved private draft when one exists.
        const { data: draft, error: draftError } =
          await supabase
            .from("portfolio_drafts")
            .select("content")
            .eq("id", "main")
            .maybeSingle();

        if (draftError) {
          setStatus("Draft loading failed: " + draftError.message);
        } else if (draft?.content) {
          setContent(draft.content);
        }
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (active) {
        if (error) setStatus(error.message);
        initialize(data?.user ?? null);
      }
    });
    return () => { active = false; };
  }, []);

  async function signIn(e) {
    e.preventDefault();
    setStatus("");
    setLoading(true);

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email, password
      });

    if (error) {
      setStatus(error.message);
      setLoading(false);
    } else {
      setPassword("");
      await initialize(data.user);
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setStatus(error.message);
      return;
    }
    setUser(null);
    setAllowed(false);
    setContent(fallback);
    setStatus("");
  }

  function editProfile(key, value) {
    setContent(prev => ({
      ...prev,
      profile: { ...prev.profile, [key]: value }
    }));
  }

  function editAbout(value) {
    setContent(prev => ({
      ...prev,
      about: { ...prev.about, description: value }
    }));
  }

  function editItem(type, id, key, value) {
    setContent(prev => ({
      ...prev,
      [type]: prev[type].map(item =>
        item.id === id ? { ...item, [key]: value } : item
      )
    }));
  }

  function addItem(type) {
    setContent(prev => ({
      ...prev,
      [type]: [
        ...prev[type],
        { id: crypto.randomUUID(), ...templates[type] }
      ]
    }));
  }

  function removeItem(type, id) {
    setContent(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item.id !== id)
    }));
  }

  async function saveDraft() {
    if (saving) return;

    setSaving(true);
    setStatus("Saving private draft...");

    try {
      const { data: saved, error } = await supabase
        .from("portfolio_drafts")
        .upsert({
          id: "main",
          content,
          updated_at: new Date().toISOString()
        }, { onConflict: "id" })
        .select("id, updated_at")
        .single();

      if (error) throw error;

      if (saved?.id !== "main") {
        throw new Error("Draft save was not confirmed.");
      }

      setStatus("Private draft saved successfully!");
    } catch (error) {
      setStatus("Draft save failed: " + error.message);
      console.error("Draft error:", error);
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (saving) return;

    setSaving(true);
    setStatus("Publishing changes...");

    try {
      const { data: saved, error } = await supabase
        .from("portfolio_content")
        .upsert({
          id: "main",
          content: content,
          published: true,
          updated_at: new Date().toISOString()
        }, { onConflict: "id" })
        .select("id, updated_at")
        .single();

      if (error) throw error;

      if (!saved || saved.id !== "main") {
        throw new Error("Database did not confirm the save.");
      }

      const { error: syncError } = await supabase
        .from("portfolio_drafts")
        .upsert({
          id: "main",
          content,
          updated_at: new Date().toISOString()
        }, { onConflict: "id" });

      setStatus(syncError
        ? "Published successfully, but draft synchronization failed: " + syncError.message
        : "Portfolio saved and published successfully!"
      );
      console.log("Saved record:", saved);

    } catch (error) {
      setStatus("Publish failed: " + error.message);
      console.error("Publish error:", error);
    } finally {
      setSaving(false);
    }
  }

  function input(label, value, onChange, multiline = false) {
    return (
      <label className="cms-field">
        <span>{label}</span>
        {multiline ? (
          <textarea rows="4" value={value ?? ""}
            onChange={e => onChange(e.target.value)} />
        ) : (
          <input value={value ?? ""}
            onChange={e => onChange(e.target.value)} />
        )}
      </label>
    );
  }

  if (loading) {
    return <div className="cms-center">Checking account...</div>;
  }

  if (!user) {
    return (
      <div className="cms-center">
        <form className="cms-login" onSubmit={signIn}>
          <div className="cms-logo">Portfolio<span>CMS.</span></div>
          <h1>Welcome back</h1>
          <p>Sign in to manage your professional portfolio.</p>
          <label>Email address</label>
          <input type="email" value={email} required
            autoComplete="username"
            onChange={e => setEmail(e.target.value)} />
          <label>Password</label>
          <input type="password" value={password} required
            autoComplete="current-password"
            onChange={e => setPassword(e.target.value)} />
          <button type="submit">Sign In</button>
          {status && <p role="status">{status}</p>}
          <a href="/">Back to portfolio</a>
        </form>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="cms-center">
        <h2>Access denied</h2>
        <p>This account is not authorized to edit the portfolio.</p>
        {status && <p role="alert">{status}</p>}
        <button onClick={signOut}>Sign Out</button>
      </div>
    );
  }

  if (preview) {
    return (
      <div className="cms-preview-shell">
        <div className="cms-preview-toolbar">
          <strong>Private preview — not published</strong>
          <button type="button" onClick={() => setPreview(false)}>
            Return to Editor
          </button>
        </div>
        <App previewData={content} />
      </div>
    );
  }
  return (
    <div className="cms-shell">
      <aside className="cms-sidebar">
        <div className="cms-logo">Portfolio<span>CMS.</span></div>
        <p>CONTENT MANAGEMENT</p>

        {sections.map(s => (
          <button key={s}
            className={section === s ? "selected" : ""}
            onClick={() => { setSection(s); setStatus(""); }}>
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}

        <a href="/" target="_blank" rel="noreferrer">
          View Portfolio
        </a>
        <button onClick={signOut}>Sign Out</button>
      </aside>

      <main className="cms-main">
        <header className="cms-header">
          <div>
            <p>YOUR PRIVATE WORKSPACE</p>
            <h1>{section[0].toUpperCase() + section.slice(1)}</h1>
          </div>
          <div className="cms-header-actions">
            <button
              type="button"
              className="cms-secondary"
              onClick={saveDraft}
              disabled={saving}
            >
              Save Draft
            </button>

            <button
              type="button"
              className="cms-secondary"
              onClick={() => setPreview(true)}
              disabled={saving}
            >
              Preview
            </button>

            <button
              type="button"
              onClick={publish}
              disabled={saving}
            >
              {saving ? "Working..." : "Save & Publish"}
            </button>
          </div>
        </header>

        {status && <p className="cms-status" role="status">{status}</p>}

        {section === "history" && (
          <VersionHistory
            onRestore={(restoredContent) => {
              setContent(restoredContent);
              setSection("profile");
              setStatus(
                "Previous version loaded into the editor. " +
                "Review your content before publishing."
              );
            }}
          />
        )}
        {section === "profile" && (
          <div className="cms-panel">
            <h2>Personal information</h2>
            {[
              ["name", "Full Name"],
              ["title", "Professional Title"],
              ["tagline", "Professional Tagline"],
              ["email", "Contact Email"],
              ["github", "GitHub URL"],
              ["linkedin", "LinkedIn URL"],
              ["location", "Location"],
              ["photoUrl", "Profile Photo URL"],
              ["photoCaption", "Photo Caption"],
              ["cvUrl", "CV URL"]
            ].map(([key, label]) => (
              <div key={key}>
                {input(label, content.profile[key],
                  value => editProfile(key, value))}
              </div>
            ))}
            {input("Short Biography", content.profile.bio,
              value => editProfile("bio", value), true)}
            <MediaUpload
              label="Professional Profile Photo"
              kind="profile"
              value={content.profile.photoUrl}
              onUploaded={url => editProfile("photoUrl", url)}
              onClear={() => editProfile("photoUrl", "")}
            />

            <MediaUpload
              label="Professional CV (PDF)"
              kind="cv"
              value={content.profile.cvUrl}
              onUploaded={url => editProfile("cvUrl", url)}
              onClear={() => editProfile("cvUrl", "")}
            />

            {input("About Me", content.about.description,
              editAbout, true)}
          </div>
        )}

        {section !== "profile" && section !== "history" && (
          <div className="cms-panel">
            <h2>Manage {section}</h2>

            {content[section].map(item => (
              <div className="cms-item" key={item.id}>
                {Object.entries(item)
                  .filter(([key]) => key !== "id")
                  .map(([key, value]) => (
                    <div key={key}>
                      {input(
                        key[0].toUpperCase() + key.slice(1),
                        Array.isArray(value)
                          ? value.join(", ")
                          : value,
                        next => editItem(
                          section, item.id, key,
                          Array.isArray(value)
                            ? next.split(",").map(x => x.trim())
                                .filter(Boolean)
                            : next
                        ),
                        key === "description"
                      )}
                    </div>
                  ))}
                {section === "projects" && (
                  <MediaUpload
                    label="Project Screenshot"
                    kind="projects"
                    value={item.imageUrl || ""}
                    onUploaded={url =>
                      editItem("projects", item.id, "imageUrl", url)
                    }
                    onClear={() =>
                      editItem("projects", item.id, "imageUrl", "")
                    }
                  />
                )}

                <button className="cms-remove"
                  onClick={() => removeItem(section, item.id)}>
                  Remove
                </button>
              </div>
            ))}

            <button className="cms-add"
              onClick={() => addItem(section)}>
              + Add {section === "experience"
                ? "Experience"
                : section === "skills" ? "Skill" : "Project"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default Admin;










