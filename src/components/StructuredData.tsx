const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://viralard.vercel.app";

const GRAPH = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: SITE,
      name: "Viralard",
      description:
        "Live feed hijack and short-form script simulator for TikTok, Reels and Shorts creators.",
      publisher: { "@id": `${SITE}/#organization` },
      inLanguage: "en-US",
    },
    {
      "@type": "Organization",
      "@id": `${SITE}/#organization`,
      name: "Ask Ninja Tech",
      url: SITE,
      logo: {
        "@type": "ImageObject",
        url: `${SITE}/logo.svg`,
        width: 64,
        height: 64,
      },
    },
    {
      "@type": "SoftwareApplication",
      name: "Viralard",
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web",
      url: `${SITE}/app`,
      description:
        "Scores short-form video hooks on curiosity, readability, pacing and structure, rewrites them using proven frameworks, and simulates the result inside a live scrolling feed.",
      offers: [
        {
          "@type": "Offer",
          name: "Free",
          price: "0",
          priceCurrency: "USD",
          description: "5 hook analyses per month, 1 video analysis, full score breakdown.",
        },
        {
          "@type": "Offer",
          name: "Creator Pro",
          price: "12",
          priceCurrency: "USD",
          description: "Unlimited analyses, unlimited video analysis, localisation, all niche personas.",
        },
      ],
      featureList: [
        "Hook Strength Score",
        "Three structural rewrites per analysis",
        "Live feed hijack simulator",
        "Thumbnail title generator",
        "Safe zone and UI blind-spot detection",
        "Caption contrast checker",
        "Multi-language hook localisation",
        "Audience persona targeting",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How do I know if my short-form video hook is strong?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A strong hook earns attention in the first three seconds before the viewer can scroll. Viralard scores your opening line across four metrics - speed and pacing, readability, structural triggers, and curiosity gap - then shows exactly which one is leaking.",
          },
        },
        {
          "@type": "Question",
          name: "Does Viralard predict my video retention?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Viralard grades text structure using a deterministic rubric and has no access to your analytics. Treat the score as a structural checklist for the opening line, not a forecast of performance.",
          },
        },
        {
          "@type": "Question",
          name: "What is a pattern interrupt hook?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A pattern interrupt opens with something abrupt that could not start a normal video - a hard claim, a single dramatic word, or a direct challenge. It breaks the viewer's expectation of what comes next and buys extra seconds.",
          },
        },
        {
          "@type": "Question",
          name: "Why do my captions get covered by the TikTok or Reels interface?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Each platform draws its own buttons, avatar and caption over your video. Viralard models those overlay regions and highlights the exact characters of your hook that fall underneath them, so you can reposition the line before filming.",
          },
        },
        {
          "@type": "Question",
          name: "Can I translate my hooks into other languages?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Creator Pro rewrites hooks in 18 languages with per-language adaptation rules rather than word-for-word translation, which preserves the tension that a literal translation destroys.",
          },
        },
      ],
    },
  ],
};

export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(GRAPH) }}
    />
  );
}