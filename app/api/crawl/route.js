import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();

    const $ = cheerio.load(html);

    $("script").remove();
    $("style").remove();
    $("svg").remove();
    $("link").remove();
    $("meta").remove();
    $("noscript").remove();
    $("iframe").remove();

    $("*")
      .contents()
      .each(function () {
        if (this.type === "comment") $(this).remove();
      });

    let cleanHtml = $("main").html() || $("body").html() || html;

    cleanHtml = cleanHtml.replace(/\s+/g, " ").trim();

    if (cleanHtml.length > 50000) {
      cleanHtml = cleanHtml.substring(0, 50000) + "...(truncated)";
    }

    return NextResponse.json({
      html: cleanHtml,
      message: "Successfully crawled",
    });
  } catch (error) {
    console.error("CRAWL ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Failed to crawl URL" },
      { status: 500 }
    );
  }
}
