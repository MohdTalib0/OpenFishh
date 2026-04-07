"""RSS feed configurations for all 31 beats."""

BEAT_FEEDS: dict[str, list[dict]] = {

    # ── TIER 1: CORE DOMAINS (45% of society) ──

    "ai_startups": [
        {"url": "https://hnrss.org/frontpage", "name": "HackerNews", "type": "rss"},
        {"url": "https://techcrunch.com/category/artificial-intelligence/feed/", "name": "TechCrunch AI", "type": "rss"},
        {"url": "https://venturebeat.com/category/ai/feed/", "name": "VentureBeat AI", "type": "rss"},
        {"url": "https://www.reddit.com/r/MachineLearning/hot.json?limit=10", "name": "r/MachineLearning", "type": "reddit"},
    ],
    "general_tech": [
        {"url": "https://www.theverge.com/rss/index.xml", "name": "The Verge", "type": "rss"},
        {"url": "https://www.wired.com/feed/rss", "name": "Wired", "type": "rss"},
        {"url": "https://feeds.arstechnica.com/arstechnica/index", "name": "Ars Technica", "type": "rss"},
        {"url": "https://www.reddit.com/r/technology/top.json?t=day&limit=10", "name": "r/technology", "type": "reddit"},
    ],
    "vc_funding": [
        {"url": "https://techcrunch.com/feed/", "name": "TechCrunch", "type": "rss"},
        {"url": "https://feeds.feedburner.com/venturebeat/SzyF", "name": "VentureBeat", "type": "rss"},
        {"url": "https://www.reddit.com/r/startups/hot.json?limit=10", "name": "r/startups", "type": "reddit"},
    ],
    "social_trends": [
        {"url": "https://www.pewresearch.org/feed/", "name": "Pew Research Center", "type": "rss"},
        {"url": "https://www.axios.com/feeds/feed.rss", "name": "Axios", "type": "rss"},
        {"url": "https://theconversation.com/us/articles.atom", "name": "The Conversation", "type": "rss"},
        {"url": "https://www.technologyreview.com/feed/", "name": "MIT Tech Review", "type": "rss"},
        {"url": "https://www.vox.com/rss/index.xml", "name": "Vox", "type": "rss"},
        {"url": "https://www.reddit.com/r/Futurology/top.json?t=day&limit=10", "name": "r/Futurology", "type": "reddit"},
    ],
    "markets": [
        {"url": "https://finance.yahoo.com/news/rss", "name": "Yahoo Finance", "type": "rss"},
        {"url": "https://www.cnbc.com/id/100003114/device/rss/rss.html", "name": "CNBC Markets", "type": "rss"},
        {"url": "https://feeds.content.dowjones.io/public/rss/mw_topstories", "name": "MarketWatch", "type": "rss"},
        {"url": "https://www.reddit.com/r/stocks/hot.json?limit=10", "name": "r/stocks", "type": "reddit"},
    ],

    # ── TIER 2: SPECIALIZATIONS (22% of society) ──

    "ai_research": [
        {"url": "http://export.arxiv.org/rss/cs.AI", "name": "ArXiv AI", "type": "rss"},
        {"url": "https://openai.com/blog/rss.xml", "name": "OpenAI Blog", "type": "rss"},
        {"url": "https://www.technologyreview.com/feed/", "name": "MIT Tech Review", "type": "rss"},
        {"url": "https://blog.research.google/feeds/posts/default?alt=rss", "name": "Google Research", "type": "rss"},
        {"url": "https://www.wired.com/feed/tag/ai/latest/rss", "name": "Wired AI", "type": "rss"},
    ],
    "competitive_intel": [
        {"url": "https://www.producthunt.com/feed", "name": "ProductHunt", "type": "rss"},
        {"url": "https://www.reddit.com/r/SaaS/hot.json?limit=10", "name": "r/SaaS", "type": "reddit"},
        {"url": "https://hnrss.org/frontpage", "name": "HackerNews", "type": "rss"},
    ],
    "saas_market": [
        {"url": "https://www.reddit.com/r/SaaS/hot.json?limit=10", "name": "r/SaaS", "type": "reddit"},
        {"url": "https://www.reddit.com/r/Entrepreneur/hot.json?limit=10", "name": "r/Entrepreneur", "type": "reddit"},
        {"url": "https://techcrunch.com/feed/", "name": "TechCrunch", "type": "rss"},
    ],
    "dev_tools": [
        {"url": "https://www.reddit.com/r/programming/hot.json?limit=10", "name": "r/programming", "type": "reddit"},
        {"url": "https://www.reddit.com/r/webdev/hot.json?limit=10", "name": "r/webdev", "type": "reddit"},
        {"url": "https://hnrss.org/frontpage", "name": "HackerNews", "type": "rss"},
    ],

    # ── TIER 3: REGIONAL/NICHE (19% of society) ──

    "india_edtech": [
        {"url": "https://www.reddit.com/r/Indian_Academia/hot.json?limit=10", "name": "r/Indian_Academia", "type": "reddit"},
        {"url": "https://www.reddit.com/r/developersIndia/hot.json?limit=10", "name": "r/developersIndia", "type": "reddit"},
        {"url": "https://inc42.com/feed/", "name": "Inc42", "type": "rss"},
    ],
    "india_startups": [
        {"url": "https://inc42.com/feed/", "name": "Inc42", "type": "rss"},
        {"url": "https://yourstory.com/feed", "name": "YourStory", "type": "rss"},
        {"url": "https://economictimes.indiatimes.com/tech/rssfeeds/13357270.cms", "name": "ET Tech", "type": "rss"},
        {"url": "https://www.reddit.com/r/IndianStockMarket/hot.json?limit=10", "name": "r/IndianStockMarket", "type": "reddit"},
    ],
    "india_students": [
        {"url": "https://www.reddit.com/r/Btechtards/hot.json?limit=10", "name": "r/Btechtards", "type": "reddit"},
        {"url": "https://www.reddit.com/r/Indian_Academia/hot.json?limit=10", "name": "r/Indian_Academia", "type": "reddit"},
        {"url": "https://www.reddit.com/r/developersIndia/hot.json?limit=10", "name": "r/developersIndia", "type": "reddit"},
    ],
    "regulation": [
        {"url": "https://www.reddit.com/r/technology/top.json?t=day&limit=10", "name": "r/technology", "type": "reddit"},
        {"url": "https://www.reddit.com/r/privacy/hot.json?limit=10", "name": "r/privacy", "type": "reddit"},
        {"url": "https://www.reddit.com/r/law/hot.json?limit=10", "name": "r/law", "type": "reddit"},
    ],
    "crypto_web3": [
        {"url": "https://www.coindesk.com/arc/outboundfeeds/rss/", "name": "CoinDesk", "type": "rss"},
        {"url": "https://www.theblock.co/rss.xml", "name": "The Block", "type": "rss"},
        {"url": "https://decrypt.co/feed", "name": "Decrypt", "type": "rss"},
        {"url": "https://cointelegraph.com/rss", "name": "CoinTelegraph", "type": "rss"},
        {"url": "https://blockworks.co/feed", "name": "Blockworks", "type": "rss"},
        {"url": "https://cryptoslate.com/feed/", "name": "CryptoSlate", "type": "rss"},
        {"url": "https://www.reddit.com/r/CryptoCurrency/hot.json?limit=10", "name": "r/CryptoCurrency", "type": "reddit"},
    ],

    # ── TIER 4: EMERGING (14% of society) ──

    "healthcare": [
        {"url": "https://www.statnews.com/feed/", "name": "STAT News", "type": "rss"},
        {"url": "https://www.healthcaredive.com/feeds/news/", "name": "Healthcare Dive", "type": "rss"},
        {"url": "https://www.medpagetoday.com/rss/headlines.xml", "name": "MedPage Today", "type": "rss"},
        {"url": "https://www.beckershospitalreview.com/feed/", "name": "Becker's Hospital Review", "type": "rss"},
        {"url": "https://kffhealthnews.org/feed/", "name": "KFF Health News", "type": "rss"},
        {"url": "https://endpts.com/feed/", "name": "Endpoints News", "type": "rss"},
        {"url": "https://www.fiercebiotech.com/rss/xml", "name": "FierceBiotech", "type": "rss"},
        {"url": "https://www.fiercehealthcare.com/rss/xml", "name": "Fierce Healthcare", "type": "rss"},
        {"url": "https://medcitynews.com/feed/", "name": "MedCity News", "type": "rss"},
        {"url": "https://www.reddit.com/r/healthIT/hot.json?limit=10", "name": "r/healthIT", "type": "reddit"},
    ],
    "climate_energy": [
        {"url": "https://cleantechnica.com/feed/", "name": "CleanTechnica", "type": "rss"},
        {"url": "https://www.carbonbrief.org/feed/", "name": "Carbon Brief", "type": "rss"},
        {"url": "https://electrek.co/feed/", "name": "Electrek", "type": "rss"},
        {"url": "https://www.utilitydive.com/feeds/news/", "name": "Utility Dive", "type": "rss"},
        {"url": "https://www.reddit.com/r/energy/hot.json?limit=10", "name": "r/energy", "type": "reddit"},
        {"url": "https://www.reddit.com/r/climate/top.json?t=day&limit=10", "name": "r/climate", "type": "reddit"},
    ],
    "defense_govt": [
        {"url": "https://www.c4isrnet.com/arc/outboundfeeds/rss/category/artificial-intelligence/", "name": "C4ISRNet AI", "type": "rss"},
        {"url": "https://www.defensenews.com/arc/outboundfeeds/rss/", "name": "Defense News", "type": "rss"},
        {"url": "https://breakingdefense.com/feed/", "name": "Breaking Defense", "type": "rss"},
        {"url": "https://feeds.feedburner.com/TheHackersNews", "name": "The Hacker News", "type": "rss"},
        {"url": "https://www.reddit.com/r/geopolitics/top.json?t=day&limit=10", "name": "r/geopolitics", "type": "reddit"},
        {"url": "https://www.reddit.com/r/cybersecurity/hot.json?limit=10", "name": "r/cybersecurity", "type": "reddit"},
    ],
    "media_entertainment": [
        {"url": "https://variety.com/feed/", "name": "Variety", "type": "rss"},
        {"url": "https://www.hollywoodreporter.com/feed/", "name": "Hollywood Reporter", "type": "rss"},
        {"url": "https://www.polygon.com/rss/index.xml", "name": "Polygon", "type": "rss"},
        {"url": "https://www.gamesindustry.biz/feed", "name": "GamesIndustry.biz", "type": "rss"},
        {"url": "https://www.reddit.com/r/entertainment/top.json?t=day&limit=10", "name": "r/entertainment", "type": "reddit"},
        {"url": "https://www.reddit.com/r/gaming/hot.json?limit=10", "name": "r/gaming", "type": "reddit"},
    ],
    "supply_chain": [
        {"url": "https://www.supplychaindive.com/feeds/news/", "name": "Supply Chain Dive", "type": "rss"},
        {"url": "https://www.freightwaves.com/feed", "name": "FreightWaves", "type": "rss"},
        {"url": "https://www.supplychainbrain.com/rss", "name": "SupplyChainBrain", "type": "rss"},
        {"url": "https://www.reddit.com/r/supplychain/hot.json?limit=10", "name": "r/supplychain", "type": "reddit"},
        {"url": "https://www.reddit.com/r/logistics/hot.json?limit=10", "name": "r/logistics", "type": "reddit"},
    ],

    # ── NEW BEATS (added 2026-04-03, all feeds verified) ─────────────

    "geopolitics": [
        {"url": "https://www.foreignaffairs.com/rss.xml", "name": "Foreign Affairs", "type": "rss"},
        {"url": "https://news.un.org/feed/subscribe/en/news/all/rss.xml", "name": "UN News", "type": "rss"},
        {"url": "https://www.aljazeera.com/xml/rss/all.xml", "name": "Al Jazeera", "type": "rss"},
        {"url": "https://www.reddit.com/r/geopolitics/hot.json?limit=10", "name": "r/geopolitics", "type": "reddit"},
    ],
    "economics": [
        {"url": "https://www.cnbc.com/id/10000664/device/rss/rss.html", "name": "CNBC Finance", "type": "rss"},
        {"url": "https://finance.yahoo.com/news/rssindex", "name": "Yahoo Finance", "type": "rss"},
        {"url": "https://www.ft.com/global-economy?format=rss", "name": "FT Global Economy", "type": "rss"},
        {"url": "https://www.reddit.com/r/economics/hot.json?limit=10", "name": "r/economics", "type": "reddit"},
    ],
    "cybersecurity": [
        {"url": "https://krebsonsecurity.com/feed/", "name": "Krebs on Security", "type": "rss"},
        {"url": "https://thehackernews.com/feeds/posts/default", "name": "The Hacker News", "type": "rss"},
        {"url": "https://www.darkreading.com/rss.xml", "name": "Dark Reading", "type": "rss"},
        {"url": "https://www.reddit.com/r/cybersecurity/hot.json?limit=10", "name": "r/cybersecurity", "type": "reddit"},
    ],
    "frontier_tech": [
        {"url": "https://www.technologyreview.com/feed/", "name": "MIT Tech Review", "type": "rss"},
        {"url": "https://arstechnica.com/feed/", "name": "Ars Technica", "type": "rss"},
        {"url": "https://www.wired.com/feed/rss", "name": "WIRED", "type": "rss"},
        {"url": "https://news.ycombinator.com/rss", "name": "Hacker News", "type": "rss"},
        {"url": "https://www.reddit.com/r/QuantumComputing/hot.json?limit=10", "name": "r/QuantumComputing", "type": "reddit"},
    ],
    "consumer_retail": [
        {"url": "https://www.retaildive.com/feeds/news/", "name": "Retail Dive", "type": "rss"},
        {"url": "https://www.retail-insight-network.com/rss/", "name": "Retail Insight Network", "type": "rss"},
        {"url": "https://www.reddit.com/r/ecommerce/hot.json?limit=10", "name": "r/ecommerce", "type": "reddit"},
    ],
    "biotech_pharma": [
        {"url": "https://www.biopharmadive.com/feeds/news/", "name": "BioPharma Dive", "type": "rss"},
        {"url": "https://www.fiercepharma.com/rss/xml", "name": "FiercePharma", "type": "rss"},
        {"url": "https://www.genengnews.com/feed/", "name": "GEN News", "type": "rss"},
        {"url": "https://www.reddit.com/r/biotech/hot.json?limit=10", "name": "r/biotech", "type": "reddit"},
    ],
    "science_space": [
        {"url": "https://www.nasa.gov/rss/dyn/breaking_news.rss", "name": "NASA Breaking", "type": "rss"},
        {"url": "https://www.sciencedaily.com/rss/space_time.xml", "name": "ScienceDaily Space", "type": "rss"},
        {"url": "https://www.sciencedaily.com/rss/matter_energy/physics.xml", "name": "ScienceDaily Physics", "type": "rss"},
        {"url": "https://spacenews.com/feed/", "name": "SpaceNews", "type": "rss"},
        {"url": "https://www.reddit.com/r/space/hot.json?limit=10", "name": "r/space", "type": "reddit"},
    ],
    "education": [
        {"url": "https://www.highereddive.com/feeds/news/", "name": "Higher Ed Dive", "type": "rss"},
        {"url": "https://www.edsurge.com/articles_rss", "name": "EdSurge", "type": "rss"},
        {"url": "https://www.edweek.org/feed", "name": "Education Week", "type": "rss"},
        {"url": "https://www.reddit.com/r/education/hot.json?limit=10", "name": "r/education", "type": "reddit"},
    ],
    "culture_philosophy": [
        {"url": "https://aeon.co/feed.rss", "name": "Aeon", "type": "rss"},
        {"url": "https://plato.stanford.edu/rss/sep.xml", "name": "Stanford Encyclopedia", "type": "rss"},
        {"url": "https://www.artnews.com/feed/", "name": "ARTnews", "type": "rss"},
        {"url": "https://www.reddit.com/r/philosophy/hot.json?limit=10", "name": "r/philosophy", "type": "reddit"},
    ],
    "sports": [
        {"url": "https://esports-news.co.uk/feed/", "name": "Esports News UK", "type": "rss"},
        {"url": "https://www.frontofficesports.com/feed/", "name": "Front Office Sports", "type": "rss"},
        {"url": "https://www.sportico.com/feed/", "name": "Sportico", "type": "rss"},
        {"url": "https://www.reddit.com/r/sports/hot.json?limit=10", "name": "r/sports", "type": "reddit"},
    ],
    "real_estate": [
        {"url": "https://www.propertyweek.com/rss", "name": "Property Week", "type": "rss"},
        {"url": "https://therealdeal.com/feed/", "name": "The Real Deal", "type": "rss"},
        {"url": "https://www.archdaily.com/feed", "name": "ArchDaily", "type": "rss"},
        {"url": "https://www.reddit.com/r/realestateinvesting/hot.json?limit=10", "name": "r/realestateinvesting", "type": "reddit"},
    ],
    "food_agriculture": [
        {"url": "https://agfundernews.com/feed", "name": "AgFunderNews", "type": "rss"},
        {"url": "https://www.fooddive.com/feeds/news/", "name": "Food Dive", "type": "rss"},
        {"url": "https://foodtechconnect.com/feed/", "name": "Food+Tech Connect", "type": "rss"},
        {"url": "https://www.reddit.com/r/agriculture/hot.json?limit=10", "name": "r/agriculture", "type": "reddit"},
    ],
    "global_south": [
        {"url": "https://www.restofworld.org/feed/", "name": "Rest of World", "type": "rss"},
        {"url": "https://en.mercopress.com/rss/", "name": "MercoPress", "type": "rss"},
        {"url": "https://thediplomat.com/feed/", "name": "The Diplomat", "type": "rss"},
        {"url": "https://www.ft.com/emerging-markets?format=rss", "name": "FT Emerging Markets", "type": "rss"},
    ],
}
