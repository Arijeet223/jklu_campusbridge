export interface DsaProblem {
  problem_id: string
  title: string
  topic: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  company_tags: string
  problem_statement: string
  starter_code_python: string
  test_cases_json: string
  optimal_time_complexity: string
  role_weight_impact: number
}

export interface SqlChallenge {
  sql_id: string
  title: string
  concept: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  schema_ddl: string
  sample_data_json: string
  question_prompt: string
  expected_query: string
  expected_output_json: string
}

export const DEFAULT_DSA_PROBLEMS: DsaProblem[] = [
  {
    problem_id: 'DSA-01',
    title: 'Idempotent Webhook Rate-Limiter Window (Sliding Window)',
    topic: 'Arrays',
    difficulty: 'Medium',
    company_tags: 'Razorpay, Atlassian, Juspay',
    problem_statement:
      'Given an array of incoming webhook timestamps (in seconds) and a window W, return the maximum number of requests processed without dropping if at most K requests are allowed in any sliding window of length W.',
    starter_code_python: `def max_allowed_webhooks(timestamps: list[int], W: int, K: int) -> int:
    # Implement sliding window rate limit simulation
    accepted = []
    total_accepted = 0
    for t in timestamps:
        accepted = [x for x in accepted if t - x < W]
        if len(accepted) < K:
            accepted.append(t)
            total_accepted += 1
    return total_accepted`,
    test_cases_json: JSON.stringify([
      { input: { timestamps: [1, 2, 3, 4, 10, 11], W: 5, K: 3 }, expected: 5 },
      { input: { timestamps: [1, 1, 1, 1, 2], W: 10, K: 2 }, expected: 2 },
    ]),
    optimal_time_complexity: 'O(N)',
    role_weight_impact: 8,
  },
  {
    problem_id: 'DSA-02',
    title: 'Microservice Dependency Deadlock Detector (Cycle in Directed Graph)',
    topic: 'Graphs',
    difficulty: 'Medium',
    company_tags: 'Amazon, Uber, Flipkart',
    problem_statement:
      'You are given N microservices labeled 0 to N-1 and a list of directed RPC dependencies [u, v] meaning service u calls service v. Return True if deployment order is valid (DAG), or False if a cycle deadlock exists.',
    starter_code_python: `def can_deploy_services(num_services: int, dependencies: list[list[int]]) -> bool:
    from collections import defaultdict, deque
    adj = defaultdict(list)
    indeg = [0] * num_services
    for u, v in dependencies:
        adj[u].append(v)
        indeg[v] += 1
    q = deque([i for i in range(num_services) if indeg[i] == 0])
    visited = 0
    while q:
        node = q.popleft()
        visited += 1
        for nxt in adj[node]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                q.append(nxt)
    return visited == num_services`,
    test_cases_json: JSON.stringify([
      { input: { num_services: 4, dependencies: [[1, 0], [2, 1], [3, 2]] }, expected: true },
      { input: { num_services: 3, dependencies: [[0, 1], [1, 2], [2, 0]] }, expected: false },
    ]),
    optimal_time_complexity: 'O(V + E)',
    role_weight_impact: 10,
  },
  {
    problem_id: 'DSA-03',
    title: 'GPU Batch Inference Scheduler (Min-Heap / Priority Queue)',
    topic: 'Heaps',
    difficulty: 'Hard',
    company_tags: 'NVIDIA, Microsoft, Rubrik',
    problem_statement:
      'Given N inference prompts with [arrival_time, execution_tokens] and K local GPU workers, return the minimum total turnaround time using shortest-job-first scheduling.',
    starter_code_python: `import heapq
def min_turnaround_time(jobs: list[list[int]], k_gpus: int) -> int:
    jobs.sort(key=lambda x: x[0])
    time_cur = 0
    i = 0
    n = len(jobs)
    pq = []
    turnaround = 0
    while i < n or pq:
        if not pq and time_cur < jobs[i][0]:
            time_cur = jobs[i][0]
        while i < n and jobs[i][0] <= time_cur:
            heapq.heappush(pq, (jobs[i][1], jobs[i][0]))
            i += 1
        dur, arr = heapq.heappop(pq)
        time_cur += dur
        turnaround += (time_cur - arr)
    return turnaround`,
    test_cases_json: JSON.stringify([
      { input: { jobs: [[0, 10], [1, 4], [2, 2]], k_gpus: 1 }, expected: 29 },
    ]),
    optimal_time_complexity: 'O(N log N)',
    role_weight_impact: 12,
  },
  {
    problem_id: 'DSA-04',
    title: 'Minimum Cost Cloud Checkpoint Storage (Dynamic Programming)',
    topic: 'Dynamic Programming',
    difficulty: 'Medium',
    company_tags: 'Google, Intuit, Oracle',
    problem_statement:
      'Given training checkpoint days and costs for 1-day, 7-day, and 30-day retention passes, return the minimum cost to cover all snapshot days.',
    starter_code_python: `def min_checkpoint_cost(days: list[int], costs: list[int]) -> int:
    day_set = set(days)
    max_d = max(days)
    dp = [0] * (max_d + 1)
    for d in range(1, max_d + 1):
        if d not in day_set:
            dp[d] = dp[d-1]
        else:
            c1 = dp[d-1] + costs[0]
            c7 = dp[max(0, d-7)] + costs[1]
            c30 = dp[max(0, d-30)] + costs[2]
            dp[d] = min(c1, c7, c30)
    return dp[max_d]`,
    test_cases_json: JSON.stringify([
      { input: { days: [1, 4, 6, 7, 8, 20], costs: [2, 7, 15] }, expected: 11 },
    ]),
    optimal_time_complexity: 'O(N)',
    role_weight_impact: 9,
  },
  {
    problem_id: 'DSA-05',
    title: 'Invert Binary Tree for Document AST Indexing',
    topic: 'Trees',
    difficulty: 'Easy',
    company_tags: 'Google, Apple, Adobe',
    problem_statement:
      'Given binary tree node representations as nested lists [val, left, right], mirror the tree and return the inverted representation.',
    starter_code_python: `def invert_tree(root):
    if not root:
        return None
    return [root[0], invert_tree(root[2]) if len(root) > 2 else None, invert_tree(root[1]) if len(root) > 1 else None]`,
    test_cases_json: JSON.stringify([
      { input: { root: [4, [2, [1], [3]], [7, [6], [9]]] }, expected: [4, [7, [9], [6]], [2, [3], [1]]] },
    ]),
    optimal_time_complexity: 'O(N)',
    role_weight_impact: 6,
  },
  {
    problem_id: 'DSA-06',
    title: 'Distributed Cache LRU Eviction Tracker',
    topic: 'Arrays',
    difficulty: 'Medium',
    company_tags: 'Salesforce, Cisco, VMware',
    problem_statement:
      'Simulate an LRU cache of capacity C receiving operations. Return list of evicted keys.',
    starter_code_python: `def simulate_lru(capacity: int, operations: list[list[str | int]]) -> list[int]:
    from collections import OrderedDict
    cache = OrderedDict()
    evicted = []
    for op, key in operations:
        if op == 'GET':
            if key in cache:
                cache.move_to_end(key)
        elif op == 'PUT':
            if key in cache:
                cache.move_to_end(key)
            else:
                if len(cache) >= capacity:
                    old_k, _ = cache.popitem(last=False)
                    evicted.append(old_k)
                cache[key] = True
    return evicted`,
    test_cases_json: JSON.stringify([
      { input: { capacity: 2, operations: [['PUT', 1], ['PUT', 2], ['GET', 1], ['PUT', 3]] }, expected: [2] },
    ]),
    optimal_time_complexity: 'O(1) per op',
    role_weight_impact: 8,
  },
  {
    problem_id: 'DSA-07',
    title: 'Two-Sum Matching for Financial Transaction Balancing',
    topic: 'Arrays',
    difficulty: 'Easy',
    company_tags: 'Paytm, PhonePe, Goldman Sachs',
    problem_statement:
      'Given an array of integer amounts and target balance, return indices of the two amounts that add up to target.',
    starter_code_python: `def two_sum(amounts: list[int], target: int) -> list[int]:
    seen = {}
    for i, a in enumerate(amounts):
        rem = target - a
        if rem in seen:
            return [seen[rem], i]
        seen[a] = i
    return []`,
    test_cases_json: JSON.stringify([
      { input: { amounts: [2, 7, 11, 15], target: 9 }, expected: [0, 1] },
    ]),
    optimal_time_complexity: 'O(N)',
    role_weight_impact: 5,
  },
  {
    problem_id: 'DSA-08',
    title: "RPC Retry Loop Cycle Detector (Floyd's Algorithm)",
    topic: 'Graphs',
    difficulty: 'Easy',
    company_tags: 'Stripe, Swiggy, Zomato',
    problem_statement:
      'Given next-hop pointers representing service retry routes [target_nodes], return the start index of the loop, or -1 if no cycle exists.',
    starter_code_python: `def detect_retry_cycle(next_hops: list[int]) -> int:
    if not next_hops or next_hops[0] == -1:
        return -1
    slow = 0
    fast = 0
    while fast != -1 and fast < len(next_hops) and next_hops[fast] != -1:
        slow = next_hops[slow]
        fast = next_hops[next_hops[fast]] if next_hops[fast] < len(next_hops) and next_hops[fast] != -1 else -1
        if slow == fast and slow != -1:
            ptr1 = 0
            ptr2 = slow
            while ptr1 != ptr2:
                ptr1 = next_hops[ptr1]
                ptr2 = next_hops[ptr2]
            return ptr1
    return -1`,
    test_cases_json: JSON.stringify([
      { input: { next_hops: [1, 2, 0] }, expected: 0 },
      { input: { next_hops: [1, 2, -1] }, expected: -1 },
    ]),
    optimal_time_complexity: 'O(N)',
    role_weight_impact: 7,
  },
  {
    problem_id: 'DSA-09',
    title: 'Course Curriculum Topological Ordering',
    topic: 'Graphs',
    difficulty: 'Medium',
    company_tags: 'LinkedIn, Coursera, Meta',
    problem_statement:
      'Given total courses and prerequisite pairs [a, b], return a valid order to take all courses.',
    starter_code_python: `def find_order(numCourses: int, prerequisites: list[list[int]]) -> list[int]:
    from collections import defaultdict, deque
    adj = defaultdict(list)
    indeg = [0] * numCourses
    for dest, src in prerequisites:
        adj[src].append(dest)
        indeg[dest] += 1
    q = deque([i for i in range(numCourses) if indeg[i] == 0])
    res = []
    while q:
        curr = q.popleft()
        res.append(curr)
        for nxt in adj[curr]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                q.append(nxt)
    return res if len(res) == numCourses else []`,
    test_cases_json: JSON.stringify([
      { input: { numCourses: 2, prerequisites: [[1, 0]] }, expected: [0, 1] },
    ]),
    optimal_time_complexity: 'O(V + E)',
    role_weight_impact: 9,
  },
  {
    problem_id: 'DSA-10',
    title: 'Longest Non-Repeating Token Subsequence',
    topic: 'Arrays',
    difficulty: 'Medium',
    company_tags: 'Databricks, Snowflake, Confluent',
    problem_statement:
      'Given a sequence of token IDs, return the length of the longest contiguous sub-segment without duplicates.',
    starter_code_python: `def longest_unique_tokens(tokens: list[int]) -> int:
    seen = {}
    left = 0
    max_len = 0
    for right, tok in enumerate(tokens):
        if tok in seen and seen[tok] >= left:
            left = seen[tok] + 1
        seen[tok] = right
        max_len = max(max_len, right - left + 1)
    return max_len`,
    test_cases_json: JSON.stringify([
      { input: { tokens: [101, 202, 101, 303, 404, 202] }, expected: 4 },
    ]),
    optimal_time_complexity: 'O(N)',
    role_weight_impact: 8,
  },
  {
    problem_id: 'DSA-11',
    title: 'Kth Largest Placement Score in Live Stream',
    topic: 'Heaps',
    difficulty: 'Medium',
    company_tags: 'Morgan Stanley, DE Shaw, Tower Research',
    problem_statement:
      'Maintain a min-heap of size K and return the Kth highest score after a series of additions.',
    starter_code_python: `import heapq
def kth_largest_scores(k: int, initial_scores: list[int], additions: list[int]) -> list[int]:
    heap = initial_scores[:]
    heapq.heapify(heap)
    while len(heap) > k:
        heapq.heappop(heap)
    res = []
    for val in additions:
        heapq.heappush(heap, val)
        if len(heap) > k:
            heapq.heappop(heap)
        res.append(heap[0])
    return res`,
    test_cases_json: JSON.stringify([
      { input: { k: 3, initial_scores: [4, 5, 8, 2], additions: [3, 5, 10, 9] }, expected: [4, 5, 5, 8] },
    ]),
    optimal_time_complexity: 'O(N log K)',
    role_weight_impact: 8,
  },
  {
    problem_id: 'DSA-12',
    title: 'Search Engine Tokenizer Segmentation (Word Break)',
    topic: 'Dynamic Programming',
    difficulty: 'Medium',
    company_tags: 'Elastic, Splunk, Microsoft',
    problem_statement:
      'Given a query string and a dictionary of recognized search terms, return True if the query can be segmented into space-separated terms.',
    starter_code_python: `def can_segment_query(query: str, vocab: list[str]) -> bool:
    vocab_set = set(vocab)
    n = len(query)
    dp = [False] * (n + 1)
    dp[0] = True
    for i in range(1, n + 1):
        for j in range(i):
            if dp[j] and query[j:i] in vocab_set:
                dp[i] = True
                break
    return dp[n]`,
    test_cases_json: JSON.stringify([
      { input: { query: 'campusbridgeai', vocab: ['campus', 'bridge', 'ai'] }, expected: true },
      { input: { query: 'deepmindai', vocab: ['deep', 'ai'] }, expected: false },
    ]),
    optimal_time_complexity: 'O(N^2)',
    role_weight_impact: 10,
  },
  {
    problem_id: 'DSA-13',
    title: 'Network Delay Time for Cluster Heartbeats (Dijkstra)',
    topic: 'Graphs',
    difficulty: 'Hard',
    company_tags: 'Cloudflare, Akamai, AWS',
    problem_statement:
      'Given directed latency edges [u, v, w] between N nodes and starting node K, return the time it takes for all nodes to receive heartbeat, or -1 if unreachable.',
    starter_code_python: `import heapq
from collections import defaultdict
def network_delay_time(times: list[list[int]], n: int, k: int) -> int:
    adj = defaultdict(list)
    for u, v, w in times:
        adj[u].append((v, w))
    dist = {}
    pq = [(0, k)]
    while pq:
        d, node = heapq.heappop(pq)
        if node in dist:
            continue
        dist[node] = d
        for nxt, weight in adj[node]:
            if nxt not in dist:
                heapq.heappush(pq, (d + weight, nxt))
    return max(dist.values()) if len(dist) == n else -1`,
    test_cases_json: JSON.stringify([
      { input: { times: [[2, 1, 1], [2, 3, 1], [3, 4, 1]], n: 4, k: 2 }, expected: 2 },
    ]),
    optimal_time_complexity: 'O(E log V)',
    role_weight_impact: 12,
  },
]

export const DEFAULT_SQL_CHALLENGES: SqlChallenge[] = [
  {
    sql_id: 'SQL-01',
    title: 'Top-2 Placed Offers by Department Using DENSE_RANK()',
    concept: 'Window Functions',
    difficulty: 'Medium',
    schema_ddl:
      'CREATE TABLE placement_offers (offer_id INT, student_id TEXT, department TEXT, company TEXT, ctc_lpa REAL);',
    sample_data_json: JSON.stringify([
      { offer_id: 1, student_id: 'STU-101', department: 'CSE', company: 'Razorpay', ctc_lpa: 22.0 },
      { offer_id: 2, student_id: 'STU-102', department: 'CSE', company: 'Sarvam AI', ctc_lpa: 24.5 },
      { offer_id: 3, student_id: 'STU-104', department: 'CSE', company: 'TechCorp', ctc_lpa: 16.0 },
      { offer_id: 4, student_id: 'STU-103', department: 'ECE', company: 'Qualcomm', ctc_lpa: 19.0 },
      { offer_id: 5, student_id: 'STU-109', department: 'ECE', company: 'Texas Instruments', ctc_lpa: 17.5 },
    ]),
    question_prompt:
      'Write an SQL query to return the top 2 highest CTC offers per department using DENSE_RANK(). Columns: department, student_id, company, ctc_lpa, rnk.',
    expected_query:
      'WITH Ranked AS (SELECT department, student_id, company, ctc_lpa, DENSE_RANK() OVER (PARTITION BY department ORDER BY ctc_lpa DESC) as rnk FROM placement_offers) SELECT department, student_id, company, ctc_lpa, rnk FROM Ranked WHERE rnk <= 2 ORDER BY department, rnk;',
    expected_output_json: JSON.stringify([
      { department: 'CSE', student_id: 'STU-102', company: 'Sarvam AI', ctc_lpa: 24.5, rnk: 1 },
      { department: 'CSE', student_id: 'STU-101', company: 'Razorpay', ctc_lpa: 22.0, rnk: 2 },
      { department: 'ECE', student_id: 'STU-103', company: 'Qualcomm', ctc_lpa: 19.0, rnk: 1 },
      { department: 'ECE', student_id: 'STU-109', company: 'Texas Instruments', ctc_lpa: 17.5, rnk: 2 },
    ]),
  },
  {
    sql_id: 'SQL-02',
    title: 'Identify Unverified Skill Evidence Without Micro-Defenses',
    concept: 'Joins & Aggregation',
    difficulty: 'Easy',
    schema_ddl:
      'CREATE TABLE skill_evidence (evidence_id TEXT, student_id TEXT, skill_name TEXT, tier TEXT); CREATE TABLE defense_attempts (attempt_id INT, evidence_id TEXT, score INT);',
    sample_data_json: JSON.stringify({
      skill_evidence: [
        { evidence_id: 'EV-1', student_id: 'STU-101', skill_name: 'FastAPI', tier: '2_STUDENT_CONFIRMED' },
        { evidence_id: 'EV-2', student_id: 'STU-101', skill_name: 'Docker', tier: '2_STUDENT_CONFIRMED' },
        { evidence_id: 'EV-3', student_id: 'STU-102', skill_name: 'RAG', tier: '4_ASSESSMENT_VERIFIED' },
      ],
      defense_attempts: [{ attempt_id: 1, evidence_id: 'EV-1', score: 85 }],
    }),
    question_prompt:
      "Find all student skill_evidence records in '2_STUDENT_CONFIRMED' tier that have no recorded defense_attempts with score >= 70.",
    expected_query:
      "SELECT e.student_id, e.skill_name FROM skill_evidence e LEFT JOIN defense_attempts d ON e.evidence_id = d.evidence_id AND d.score >= 70 WHERE e.tier = '2_STUDENT_CONFIRMED' AND d.attempt_id IS NULL;",
    expected_output_json: JSON.stringify([{ student_id: 'STU-101', skill_name: 'Docker' }]),
  },
  {
    sql_id: 'SQL-03',
    title: 'Rolling 3-Day Tool Latency Anomaly Detection',
    concept: 'CTEs',
    difficulty: 'Hard',
    schema_ddl:
      'CREATE TABLE mcp_logs (log_date TEXT, tool_name TEXT, latency_ms INT);',
    sample_data_json: JSON.stringify([
      { log_date: '2026-10-01', tool_name: 'matching.explain', latency_ms: 20 },
      { log_date: '2026-10-02', tool_name: 'matching.explain', latency_ms: 25 },
      { log_date: '2026-10-03', tool_name: 'matching.explain', latency_ms: 80 },
      { log_date: '2026-10-01', tool_name: 'student.profile', latency_ms: 15 },
      { log_date: '2026-10-02', tool_name: 'student.profile', latency_ms: 16 },
      { log_date: '2026-10-03', tool_name: 'student.profile', latency_ms: 18 },
    ]),
    question_prompt:
      'Find rows where latency_ms is greater than 1.8 times the 3-day rolling average for that tool.',
    expected_query:
      'WITH Stats AS (SELECT log_date, tool_name, latency_ms, AVG(latency_ms) OVER (PARTITION BY tool_name ORDER BY log_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) as avg_3d FROM mcp_logs) SELECT log_date, tool_name, latency_ms, avg_3d FROM Stats WHERE latency_ms > 1.8 * avg_3d;',
    expected_output_json: JSON.stringify([
      { log_date: '2026-10-03', tool_name: 'matching.explain', latency_ms: 80, avg_3d: 41.67 },
    ]),
  },
  {
    sql_id: 'SQL-04',
    title: 'Students Meeting All Mandatory Drive Skills',
    concept: 'Joins & Aggregation',
    difficulty: 'Medium',
    schema_ddl:
      'CREATE TABLE student_skills (student_id TEXT, skill_name TEXT); CREATE TABLE drive_reqs (drive_id TEXT, skill_name TEXT);',
    sample_data_json: JSON.stringify({
      student_skills: [
        { student_id: 'STU-101', skill_name: 'Python' },
        { student_id: 'STU-101', skill_name: 'SQL' },
        { student_id: 'STU-101', skill_name: 'Docker' },
        { student_id: 'STU-102', skill_name: 'Python' },
      ],
      drive_reqs: [
        { drive_id: 'DRV-TECHCORP', skill_name: 'Python' },
        { drive_id: 'DRV-TECHCORP', skill_name: 'SQL' },
      ],
    }),
    question_prompt:
      "Find students who possess every mandatory skill required for drive 'DRV-TECHCORP'.",
    expected_query:
      "SELECT s.student_id FROM student_skills s JOIN drive_reqs d ON s.skill_name = d.skill_name WHERE d.drive_id = 'DRV-TECHCORP' GROUP BY s.student_id HAVING COUNT(DISTINCT s.skill_name) = (SELECT COUNT(*) FROM drive_reqs WHERE drive_id = 'DRV-TECHCORP');",
    expected_output_json: JSON.stringify([{ student_id: 'STU-101' }]),
  },
  {
    sql_id: 'SQL-05',
    title: 'Calculate Percentile Placement Ranking by CGPA',
    concept: 'Window Functions',
    difficulty: 'Easy',
    schema_ddl:
      'CREATE TABLE cohort_grades (student_id TEXT, full_name TEXT, cgpa REAL);',
    sample_data_json: JSON.stringify([
      { student_id: 'STU-101', full_name: 'Aarav Sharma', cgpa: 8.42 },
      { student_id: 'STU-102', full_name: 'Priya Nair', cgpa: 8.95 },
      { student_id: 'STU-103', full_name: 'Rohan Verma', cgpa: 7.8 },
      { student_id: 'STU-104', full_name: 'Sneha Patel', cgpa: 9.1 },
    ]),
    question_prompt:
      'Calculate the PERCENT_RANK() of students ordered by CGPA descending.',
    expected_query:
      'SELECT student_id, full_name, cgpa, ROUND(PERCENT_RANK() OVER (ORDER BY cgpa DESC), 2) as rank_pct FROM cohort_grades;',
    expected_output_json: JSON.stringify([
      { student_id: 'STU-104', full_name: 'Sneha Patel', cgpa: 9.1, rank_pct: 0.0 },
      { student_id: 'STU-102', full_name: 'Priya Nair', cgpa: 8.95, rank_pct: 0.33 },
      { student_id: 'STU-101', full_name: 'Aarav Sharma', cgpa: 8.42, rank_pct: 0.67 },
      { student_id: 'STU-103', full_name: 'Rohan Verma', cgpa: 7.8, rank_pct: 1.0 },
    ]),
  },
]

