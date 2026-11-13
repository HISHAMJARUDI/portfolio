import { useEffect, useState } from "react";
import fallback from "../data/portfolio.json";
import { supabase } from "./supabase";

const CACHE_KEY = "portfolio-published-v1";

function readCachedPortfolio() {
  try {
    const value = localStorage.getItem(CACHE_KEY);
    if (!value) return fallback;

    const parsed = JSON.parse(value);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !parsed.profile ||
      !Array.isArray(parsed.projects) ||
      !Array.isArray(parsed.skills)
    ) {
      return fallback;
    }

    return parsed;
  } catch {
    return fallback;
  }
}

export function usePortfolio() {
  const [content, setContent] = useState(readCachedPortfolio);

  useEffect(() => {
    let active = true;

    async function refresh() {
      try {
        const { data, error } = await supabase
          .from("portfolio_content")
          .select("content")
          .eq("id", "main")
          .eq("published", true)
          .maybeSingle();

        if (error) throw error;
        if (!active || !data?.content) return;

        const latest = data.content;

        setContent(latest);

        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify(latest)
          );
        } catch {
          // Storage may be disabled or full.
        }
      } catch (error) {
        if (active) {
          console.warn(
            "Portfolio refresh unavailable:",
            error.message
          );
        }
      }
    }

    refresh();

    return () => {
      active = false;
    };
  }, []);

  return content;
}
