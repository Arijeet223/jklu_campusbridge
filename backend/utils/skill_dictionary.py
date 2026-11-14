"""CampusBridge AI — Comprehensive Skill Dictionary for Fallback & Correlation.

Contains massive predefined lists and regular expressions for technical
and soft skills across all modern university engineering domains.
"""

from __future__ import annotations

import re
from typing import Any


class SkillDefinition:
    def __init__(
        self,
        name: str,
        category: str,
        pattern_str: str,
        default_proficiency: str = "Intermediate",
        confidence: float = 0.94,
        is_soft_skill: bool = False,
    ):
        self.name = name
        self.category = category
        self.pattern_str = pattern_str
        self.default_proficiency = default_proficiency
        self.confidence = confidence
        self.is_soft_skill = is_soft_skill
        self.regex = re.compile(rf"\b({pattern_str})\b", re.IGNORECASE)


# ═══════════════════════════════════════════════════════════════════════════
# Massive Technical Skills Dictionary
# ═══════════════════════════════════════════════════════════════════════════

TECHNICAL_SKILLS: list[SkillDefinition] = [
    # ── Programming Languages ─────────────────────────────────────────────
    SkillDefinition("Python", "Languages", r"python\s*3?|py|pypi", "Advanced", 0.98),
    SkillDefinition("JavaScript", "Languages", r"javascript|es6|es202[0-9]|ecmascript", "Advanced", 0.95),
    SkillDefinition("TypeScript", "Languages", r"typescript|ts|tsc", "Advanced", 0.96),
    SkillDefinition("Java", "Languages", r"java\b(?!\s*script)|jvm|openjdk", "Intermediate", 0.93),
    SkillDefinition("C++", "Languages", r"c\+\+|cpp|clang\+\+", "Advanced", 0.96),
    SkillDefinition("C", "Languages", r"c\s+programming|ansi\s+c", "Intermediate", 0.91),
    SkillDefinition("C#", "Languages", r"c#|csharp|\.net|dotnet", "Intermediate", 0.92),
    SkillDefinition("Go (Golang)", "Languages", r"golang|go\s+language", "Intermediate", 0.93),
    SkillDefinition("Rust", "Languages", r"rust|cargo|rustlang", "Intermediate", 0.92),
    SkillDefinition("PHP", "Languages", r"php|php8|laravel", "Intermediate", 0.90),
    SkillDefinition("Ruby", "Languages", r"ruby|gem|rubyonrails", "Intermediate", 0.90),
    SkillDefinition("Swift", "Languages", r"swift|swiftui|cocoa", "Intermediate", 0.91),
    SkillDefinition("Kotlin", "Languages", r"kotlin|android\s+sdk", "Intermediate", 0.92),
    SkillDefinition("R", "Languages", r"r\s+programming|r-project|tidyverse", "Intermediate", 0.90),
    SkillDefinition("Scala", "Languages", r"scala|sbt", "Intermediate", 0.90),
    SkillDefinition("Dart", "Languages", r"dart|flutter", "Intermediate", 0.90),
    SkillDefinition("Shell / Bash", "Languages", r"bash|zsh|shell\s+script(?:ing)?|powershell", "Intermediate", 0.93),
    SkillDefinition("SQL", "Languages", r"sql|ansi\s*sql|pl\/sql|t-sql", "Advanced", 0.97),
    SkillDefinition("HTML5 & CSS3", "Languages", r"html5?|css3?|responsive\s+design", "Advanced", 0.94),
    SkillDefinition("Solidity", "Languages", r"solidity|smart\s+contracts|ethereum|web3", "Intermediate", 0.90),

    # ── Frontend Frameworks & Libraries ──────────────────────────────────
    SkillDefinition("React", "Frontend", r"react|react\.js|reactjs|hooks|jsx", "Advanced", 0.96),
    SkillDefinition("Next.js", "Frontend", r"next\.js|nextjs|app\s+router|ssr|ssg", "Advanced", 0.96),
    SkillDefinition("Vue.js", "Frontend", r"vue|vue\.js|vuejs|nuxt", "Intermediate", 0.92),
    SkillDefinition("Angular", "Frontend", r"angular|angularjs|rxjs", "Intermediate", 0.91),
    SkillDefinition("Svelte", "Frontend", r"svelte|sveltekit", "Intermediate", 0.90),
    SkillDefinition("Tailwind CSS", "Frontend", r"tailwind|tailwindcss", "Advanced", 0.96),
    SkillDefinition("Redux", "Frontend", r"redux|redux\s+toolkit|rtk", "Intermediate", 0.93),
    SkillDefinition("Zustand", "Frontend", r"zustand", "Intermediate", 0.91),
    SkillDefinition("Bootstrap", "Frontend", r"bootstrap\s*5?|bootstrap-vue", "Intermediate", 0.90),
    SkillDefinition("Material UI", "Frontend", r"material\s*ui|mui", "Intermediate", 0.91),
    SkillDefinition("Three.js", "Frontend", r"three\.js|webgl|threejs", "Intermediate", 0.91),
    SkillDefinition("Framer Motion", "Frontend", r"framer\s*motion|framer", "Intermediate", 0.92),
    SkillDefinition("Webpack", "Frontend", r"webpack|vite|rollup|turbopack", "Intermediate", 0.92),

    # ── Backend Frameworks & APIs ─────────────────────────────────────────
    SkillDefinition("FastAPI", "Backend", r"fastapi|pydantic|starlette|uvicorn", "Advanced", 0.97),
    SkillDefinition("Node.js", "Backend", r"node\.js|nodejs|npm|yarn|pnpm", "Advanced", 0.95),
    SkillDefinition("Django", "Backend", r"django|django\s+rest|drf", "Intermediate", 0.94),
    SkillDefinition("Flask", "Backend", r"flask|werkzeug|jinja2?", "Intermediate", 0.93),
    SkillDefinition("Express.js", "Backend", r"express|express\.js|expressjs", "Intermediate", 0.93),
    SkillDefinition("NestJS", "Backend", r"nestjs|nest\.js", "Intermediate", 0.92),
    SkillDefinition("Spring Boot", "Backend", r"spring\s*boot|spring\s*framework|spring\s*data", "Intermediate", 0.94),
    SkillDefinition("REST APIs", "Backend", r"rest\s*apis?|restful|endpoints|crud", "Advanced", 0.96),
    SkillDefinition("GraphQL", "Backend", r"graphql|apollo|schema\s+stitching", "Intermediate", 0.92),
    SkillDefinition("gRPC", "Backend", r"grpc|protobuf|protocol\s+buffers", "Intermediate", 0.93),
    SkillDefinition("WebSockets", "Backend", r"websockets?|socket\.io", "Intermediate", 0.93),
    SkillDefinition("Celery", "Backend", r"celery|task\s+queue|distributed\s+tasks", "Intermediate", 0.93),
    SkillDefinition("RabbitMQ", "Backend", r"rabbitmq|amqp", "Intermediate", 0.92),
    SkillDefinition("Apache Kafka", "Backend", r"kafka|event\s+stream(?:ing)?", "Advanced", 0.94),
    SkillDefinition("Microservices", "Backend", r"microservices?|service-oriented|soa", "Advanced", 0.95),

    # ── Databases, Storage & Caching ──────────────────────────────────────
    SkillDefinition("PostgreSQL", "Databases", r"postgresql|postgres|psql", "Advanced", 0.97),
    SkillDefinition("MySQL", "Databases", r"mysql|innodb", "Intermediate", 0.94),
    SkillDefinition("SQLite", "Databases", r"sqlite|sqlite3", "Intermediate", 0.92),
    SkillDefinition("Redis", "Databases", r"redis|in-memory\s+cache|caching|cache-aside", "Advanced", 0.96),
    SkillDefinition("MongoDB", "Databases", r"mongodb|mongoose|nosql", "Intermediate", 0.93),
    SkillDefinition("Elasticsearch", "Databases", r"elasticsearch|opensearch|elk\s+stack", "Intermediate", 0.93),
    SkillDefinition("DynamoDB", "Databases", r"dynamodb", "Intermediate", 0.92),
    SkillDefinition("Cassandra", "Databases", r"cassandra|cql", "Intermediate", 0.91),
    SkillDefinition("Supabase", "Databases", r"supabase", "Intermediate", 0.92),
    SkillDefinition("Firebase", "Databases", r"firebase|firestore", "Intermediate", 0.92),
    SkillDefinition("Neo4j", "Databases", r"neo4j|graph\s+database|cypher", "Intermediate", 0.91),
    SkillDefinition("Snowflake", "Databases", r"snowflake|data\s+warehouse", "Intermediate", 0.92),
    SkillDefinition("Database Indexing & Optimization", "Databases", r"b-tree|b\+tree|indexing|query\s+optimization|explain\s+analyze", "Advanced", 0.95),

    # ── Cloud, DevOps & Infrastructure ────────────────────────────────────
    SkillDefinition("Docker", "DevOps", r"docker|containerization|dockerfile|docker-compose", "Advanced", 0.97),
    SkillDefinition("Kubernetes", "DevOps", r"kubernetes|k8s|helm|minikube", "Intermediate", 0.93),
    SkillDefinition("AWS", "Cloud", r"aws|amazon\s+web\s+services|s3|ec2|lambda|cloudformation", "Intermediate", 0.94),
    SkillDefinition("Google Cloud Platform", "Cloud", r"gcp|google\s+cloud|cloud\s+run|bigquery", "Intermediate", 0.93),
    SkillDefinition("Microsoft Azure", "Cloud", r"azure|azure\s+devops|azure\s+functions", "Intermediate", 0.92),
    SkillDefinition("CI/CD Pipelines", "DevOps", r"ci\/cd|continuous\s+integration|github\s+actions|gitlab\s+ci|jenkins", "Intermediate", 0.94),
    SkillDefinition("Terraform", "DevOps", r"terraform|iac|infrastructure\s+as\s+code", "Intermediate", 0.92),
    SkillDefinition("Linux", "DevOps", r"linux|ubuntu|debian|centos|unix", "Advanced", 0.95),
    SkillDefinition("Nginx", "DevOps", r"nginx|reverse\s+proxy", "Intermediate", 0.93),
    SkillDefinition("Serverless", "Cloud", r"serverless|faas|lambda\s+functions", "Intermediate", 0.92),
    SkillDefinition("Monitoring & Observability", "DevOps", r"prometheus|grafana|opentelemetry|datadog", "Intermediate", 0.92),

    # ── AI, Machine Learning & Data Science ───────────────────────────────
    SkillDefinition("Machine Learning", "AI / ML", r"machine\s+learning|supervised\s+learning|unsupervised\s+learning|scikit-learn|sklearn", "Advanced", 0.96),
    SkillDefinition("Deep Learning", "AI / ML", r"deep\s+learning|neural\s+networks|cnn|rnn|lstm", "Advanced", 0.95),
    SkillDefinition("PyTorch", "AI / ML", r"pytorch|torch|torchvision", "Advanced", 0.96),
    SkillDefinition("TensorFlow", "AI / ML", r"tensorflow|keras", "Intermediate", 0.94),
    SkillDefinition("Natural Language Processing", "AI / ML", r"nlp|natural\s+language\s+processing|tokenization|spacy|nltk|bert", "Intermediate", 0.94),
    SkillDefinition("Computer Vision", "AI / ML", r"computer\s+vision|opencv|yolo|image\s+segmentation", "Intermediate", 0.93),
    SkillDefinition("LLMs & Generative AI", "AI / ML", r"llms?|large\s+language\s+models|gpt-4|gemini|claude|qwen|ollama", "Advanced", 0.96),
    SkillDefinition("RAG Architecture", "AI / ML", r"rag|retrieval-augmented|vector\s+database|vector\s+store|embeddings", "Advanced", 0.97),
    SkillDefinition("Vector DBs (Qdrant/Milvus)", "AI / ML", r"qdrant|milvus|chroma|pinecone|faiss|pgvector", "Advanced", 0.96),
    SkillDefinition("LangChain & LlamaIndex", "AI / ML", r"langchain|llamaindex|langgraph", "Intermediate", 0.94),
    SkillDefinition("Hugging Face & Transformers", "AI / ML", r"hugging\s*face|transformers|diffusion", "Intermediate", 0.94),
    SkillDefinition("Pandas & NumPy", "AI / ML", r"pandas|numpy|scipy|data\s+analysis|eda", "Advanced", 0.96),
    SkillDefinition("Data Visualization", "AI / ML", r"matplotlib|seaborn|plotly|tableau|power\s+bi", "Intermediate", 0.92),

    # ── Core Computer Science & Security ──────────────────────────────────
    SkillDefinition("Data Structures & Algorithms", "Core CS", r"data\s+structures|algorithms|dsa|dynamic\s+programming|sliding\s+window|two\s+pointers|binary\s+search", "Advanced", 0.97),
    SkillDefinition("System Design", "Core CS", r"system\s+design|scalability|high\s+availability|load\s+balancing|sharding|cap\s+theorem", "Advanced", 0.96),
    SkillDefinition("Object-Oriented Programming", "Core CS", r"oop|object-oriented|polymorphism|inheritance|encapsulation|design\s+patterns", "Advanced", 0.96),
    SkillDefinition("Computer Networks", "Core CS", r"tcp\/ip|dns|http|https|udp|sockets|osi\s+model", "Intermediate", 0.93),
    SkillDefinition("Operating Systems", "Core CS", r"operating\s+systems|concurrency|multithreading|mutex|deadlock|process\s+scheduling", "Intermediate", 0.94),
    SkillDefinition("Cybersecurity & Cryptography", "Core CS", r"cryptography|cyber\s*security|penetration\s+testing|encryption|tls|ssl", "Intermediate", 0.92),
    SkillDefinition("Authentication & OAuth2", "Core CS", r"oauth2?|jwt|json\s+web\s+tokens?|saml|rbac", "Advanced", 0.95),

    # ── Testing, Version Control & Tools ──────────────────────────────────
    SkillDefinition("Git & GitHub", "Tools", r"git|github|gitlab|bitbucket|version\s+control", "Advanced", 0.97),
    SkillDefinition("Unit & Integration Testing", "Tools", r"unit\s+testing|pytest|jest|cypress|playwright|junit|selenium", "Intermediate", 0.93),
    SkillDefinition("API Testing & Postman", "Tools", r"postman|swagger|openapi|insomnia", "Intermediate", 0.94),
    SkillDefinition("Agile / Scrum Methodologies", "Tools", r"agile|scrum|kanban|jira|sprints", "Intermediate", 0.93),
]


# ═══════════════════════════════════════════════════════════════════════════
# Massive Soft Skills Dictionary
# ═══════════════════════════════════════════════════════════════════════════

SOFT_SKILLS: list[SkillDefinition] = [
    SkillDefinition("Communication", "Soft Skills", r"communication|verbal\s+communication|written\s+communication|articulate", "Intermediate", 0.94, is_soft_skill=True),
    SkillDefinition("Team Collaboration", "Soft Skills", r"teamwork|collaboration|team\s+player|cross-functional\s+collaboration|peer\s+programming", "Intermediate", 0.95, is_soft_skill=True),
    SkillDefinition("Leadership", "Soft Skills", r"leadership|leading\s+a\s+team|mentoring|tech\s+lead|head\s+of|president|captain", "Advanced", 0.94, is_soft_skill=True),
    SkillDefinition("Problem Solving", "Soft Skills", r"problem\s+solving|troubleshooting|debugging|root\s+cause\s+analysis", "Advanced", 0.95, is_soft_skill=True),
    SkillDefinition("Critical Thinking", "Soft Skills", r"critical\s+thinking|logical\s+reasoning|analytical\s+thinking", "Intermediate", 0.93, is_soft_skill=True),
    SkillDefinition("Time Management", "Soft Skills", r"time\s+management|prioritization|deadline-driven|meeting\s+deadlines", "Intermediate", 0.92, is_soft_skill=True),
    SkillDefinition("Adaptability & Flexibility", "Soft Skills", r"adaptability|flexible|fast\s+learner|quick\s+learner|learning\s+agility", "Intermediate", 0.93, is_soft_skill=True),
    SkillDefinition("Conflict Resolution", "Soft Skills", r"conflict\s+resolution|mediation|negotiation", "Intermediate", 0.91, is_soft_skill=True),
    SkillDefinition("Public Speaking & Presentation", "Soft Skills", r"public\s+speaking|presentation\s+skills|pitching|presenter", "Intermediate", 0.92, is_soft_skill=True),
    SkillDefinition("Project Management", "Soft Skills", r"project\s+management|scrum\s+master|deliverables|stakeholder\s+management", "Intermediate", 0.93, is_soft_skill=True),
    SkillDefinition("Ownership & Accountability", "Soft Skills", r"ownership|accountability|self-motivated|proactive|initiative", "Advanced", 0.94, is_soft_skill=True),
    SkillDefinition("Emotional Intelligence", "Soft Skills", r"emotional\s+intelligence|empathy|interpersonal\s+skills", "Intermediate", 0.91, is_soft_skill=True),
    SkillDefinition("Mentorship", "Soft Skills", r"mentorship|mentored|coached|guiding\s+juniors", "Intermediate", 0.92, is_soft_skill=True),
    SkillDefinition("Decision Making", "Soft Skills", r"decision\s+making|sound\s+judgment|trade-off\s+analysis", "Intermediate", 0.92, is_soft_skill=True),
    SkillDefinition("Active Listening", "Soft Skills", r"active\s+listening|receptive\s+to\s+feedback", "Intermediate", 0.91, is_soft_skill=True),
    SkillDefinition("Attention to Detail", "Soft Skills", r"attention\s+to\s+detail|meticulous|high\s+accuracy", "Intermediate", 0.92, is_soft_skill=True),
    SkillDefinition("Customer Empathy", "Soft Skills", r"customer\s+empathy|user-centric|client\s+facing", "Intermediate", 0.91, is_soft_skill=True),
]

ALL_SKILL_DEFINITIONS: list[SkillDefinition] = TECHNICAL_SKILLS + SOFT_SKILLS


def scan_text_against_dictionary(raw_text: str) -> list[dict[str, Any]]:
    """Scans raw resume text against the massive dictionary and extracts matched skills with snippets."""
    if not raw_text or not raw_text.strip():
        return []

    results: list[dict[str, Any]] = []
    seen_names: set[str] = set()

    for item in ALL_SKILL_DEFINITIONS:
        match = item.regex.search(raw_text)
        if match:
            canonical_lower = item.name.lower()
            if canonical_lower in seen_names:
                continue
            seen_names.add(canonical_lower)

            start_pos = max(0, match.start() - 60)
            end_pos = min(len(raw_text), match.end() + 60)
            snippet = raw_text[start_pos:end_pos].replace("\n", " ").strip()
            # Clean up whitespace
            snippet = " ".join(snippet.split())

            results.append({
                "name": item.name,
                "category": item.category,
                "proficiency": item.default_proficiency,
                "confidence": item.confidence,
                "is_soft_skill": item.is_soft_skill,
                "sourceSpan": f"Resume • {item.category}",
                "snippet": snippet,
                "evidenceStatus": "EXTRACTED",
                "confirmed": False,
            })

    return results
