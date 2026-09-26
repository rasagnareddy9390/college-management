/**
 * CURATED 30-DAY SKILL CURRICULUM DATA
 * Provides day-by-day lesson milestones, interactive coding tasks, 
 * authoritative documentation links, and tutorial guides for all 30 days.
 */

const webDevCurriculum = [
  {
    day: 1,
    title: "HTML5 Semantic Architecture & Modern Meta Tags",
    taskDescription: "Build a semantic web layout using header, nav, main, section, article, aside, and footer. Validate markup using W3C standards.",
    taskUrl: "https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML",
    videoUrl: "https://www.youtube.com/results?search_query=HTML5+semantic+tags+tutorial"
  },
  {
    day: 2,
    title: "HTML5 Forms, Modern Input Types & Client Validation",
    taskDescription: "Create accessible forms with pattern regex, required attributes, datalists, and custom input constraints.",
    taskUrl: "https://developer.mozilla.org/en-US/docs/Learn/Forms",
    videoUrl: "https://www.youtube.com/results?search_query=HTML5+form+validation+guide"
  },
  {
    day: 3,
    title: "CSS3 Box Model, Cascade, Specificity & Custom Properties",
    taskDescription: "Master margin collapse, border-box sizing, specificity hierarchy, and define reusable CSS variables (--variables).",
    taskUrl: "https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/The_box_model",
    videoUrl: "https://www.youtube.com/results?search_query=CSS+box+model+and+variables"
  },
  {
    day: 4,
    title: "Flexbox Mastery: One-Dimensional Layout Alignment",
    taskDescription: "Design a responsive navigation bar and card container using flex-direction, justify-content, align-items, and flex-wrap.",
    taskUrl: "https://css-tricks.com/snippets/css/a-guide-to-flexbox/",
    videoUrl: "https://www.youtube.com/results?search_query=Flexbox+tutorial+complete"
  },
  {
    day: 5,
    title: "CSS Grid: Two-Dimensional System & Auto-Fill Layouts",
    taskDescription: "Implement multi-column grid templates using grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) and grid gaps.",
    taskUrl: "https://css-tricks.com/snippets/css/complete-guide-grid/",
    videoUrl: "https://www.youtube.com/results?search_query=CSS+Grid+tutorial+complete"
  },
  {
    day: 6,
    title: "Mobile-First Responsive Design & Fluid Media Queries",
    taskDescription: "Develop breakpoint strategies for mobile, tablet, and desktop viewports using clamp(), min(), and viewport units.",
    taskUrl: "https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design",
    videoUrl: "https://www.youtube.com/results?search_query=Mobile+first+responsive+web+design"
  },
  {
    day: 7,
    title: "CSS Transitions, Keyframe Animations & Micro-interactions",
    taskDescription: "Create smooth hover effects, loading spinners, and animated modal entrances using @keyframes and transition curves.",
    taskUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations/Using_CSS_animations",
    videoUrl: "https://www.youtube.com/results?search_query=CSS+animations+and+transitions"
  },
  {
    day: 8,
    title: "JavaScript ES6+ Fundamentals: Scopes, Hoisting & Closures",
    taskDescription: "Practice let vs const vs var, lexical scope chains, closures, and the Execution Context call stack.",
    taskUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures",
    videoUrl: "https://www.youtube.com/results?search_query=JavaScript+closures+and+scopes"
  },
  {
    day: 9,
    title: "Arrow Functions, Template Literals & Destructuring",
    taskDescription: "Refactor function declarations into arrow functions, object/array destructuring, default parameters, and rest/spread.",
    taskUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment",
    videoUrl: "https://www.youtube.com/results?search_query=ES6+arrow+functions+destructuring"
  },
  {
    day: 10,
    title: "Array Higher-Order Methods: Map, Filter, Reduce & Find",
    taskDescription: "Transform, filter, and aggregate arrays of JSON data objects using chained array helper methods.",
    taskUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map",
    videoUrl: "https://www.youtube.com/results?search_query=JavaScript+map+filter+reduce"
  },
  {
    day: 11,
    title: "DOM Traversal, Manipulation & Dynamic Element Creation",
    taskDescription: "Query elements with querySelector, dynamically build DOM trees with createElement, and handle classList.",
    taskUrl: "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs/Manipulating_documents",
    videoUrl: "https://www.youtube.com/results?search_query=DOM+manipulation+vanilla+javascript"
  },
  {
    day: 12,
    title: "DOM Event Delegation & Keyboard / Touch Interactions",
    taskDescription: "Implement high-performance event listeners using event delegation, event.target bubbling, and keyboard shortcuts.",
    taskUrl: "https://javascript.info/event-delegation",
    videoUrl: "https://www.youtube.com/results?search_query=Event+delegation+javascript"
  },
  {
    day: 13,
    title: "Client-side Persistence: LocalStorage, SessionStorage & Cookies",
    taskDescription: "Build persistent theme toggles (dark/light mode) and temporary session caches with JSON serialization.",
    taskUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage",
    videoUrl: "https://www.youtube.com/results?search_query=LocalStorage+SessionStorage+javascript"
  },
  {
    day: 14,
    title: "Asynchronous JavaScript: Promises & Microtask Queue",
    taskDescription: "Learn promise states (pending, fulfilled, rejected), Promise.all, Promise.race, and error chaining with .catch().",
    taskUrl: "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Promises",
    videoUrl: "https://www.youtube.com/results?search_query=JavaScript+promises+tutorial"
  },
  {
    day: 15,
    title: "Async/Await & Consuming REST APIs with Fetch",
    taskDescription: "Make robust HTTP requests with async/await, try/catch error handling, and display dynamic API data.",
    taskUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch",
    videoUrl: "https://www.youtube.com/results?search_query=Async+await+fetch+API+javascript"
  },
  {
    day: 16,
    title: "Front-End Mini Project: Weather & News Live Dashboard",
    taskDescription: "Create a fully functional single-page dashboard fetching live external APIs, with search filter and error banners.",
    taskUrl: "https://www.freecodecamp.org/news/build-a-weather-app-with-vanilla-javascript/",
    videoUrl: "https://www.youtube.com/results?search_query=Vanilla+JS+weather+app+project"
  },
  {
    day: 17,
    title: "Node.js Architecture, CommonJS vs ES Modules & NPM",
    taskDescription: "Initialize Node.js packages with package.json, configure scripts, and import built-in fs, path, and http modules.",
    taskUrl: "https://nodejs.org/en/learn/getting-started/introduction-to-nodejs",
    videoUrl: "https://www.youtube.com/results?search_query=NodeJS+crash+course+for+beginners"
  },
  {
    day: 18,
    title: "Express.js REST API Architecture & Express Router",
    taskDescription: "Build an Express application with modular routes, parameter parsing (req.params, req.query, req.body), and JSON responses.",
    taskUrl: "https://expressjs.com/en/starter/basic-routing.html",
    videoUrl: "https://www.youtube.com/results?search_query=ExpressJS+REST+API+tutorial"
  },
  {
    day: 19,
    title: "Express Middlewares, Logging & Central Error Handling",
    taskDescription: "Construct custom middlewares for request timing, CORS headers, security sanitation, and global 404/500 handlers.",
    taskUrl: "https://expressjs.com/en/guide/using-middleware.html",
    videoUrl: "https://www.youtube.com/results?search_query=Express+middleware+error+handling"
  },
  {
    day: 20,
    title: "MongoDB NoSQL Database Architecture & Atlas Setup",
    taskDescription: "Connect Express to MongoDB Atlas cluster using connection strings, create collections, and run BSON queries.",
    taskUrl: "https://www.mongodb.com/docs/manual/introduction/",
    videoUrl: "https://www.youtube.com/results?search_query=MongoDB+Atlas+setup+and+queries"
  },
  {
    day: 21,
    title: "Mongoose ODM: Schema Validation & Model Relationships",
    taskDescription: "Define Mongoose schemas with data types, required constraints, default values, pre-save hooks, and virtuals.",
    taskUrl: "https://mongoosejs.com/docs/guide.html",
    videoUrl: "https://www.youtube.com/results?search_query=Mongoose+schema+and+models+tutorial"
  },
  {
    day: 22,
    title: "Full CRUD REST Endpoints with Express & Mongoose",
    taskDescription: "Implement Create, Read, Update, and Delete endpoints with pagination (skip, limit) and sorting.",
    taskUrl: "https://www.freecodecamp.org/news/introduction-to-mongoose-for-mongodb-and-nodejs/",
    videoUrl: "https://www.youtube.com/results?search_query=CRUD+operations+Node+Express+MongoDB"
  },
  {
    day: 23,
    title: "JWT Authentication: Token Generation & Bcrypt Hashing",
    taskDescription: "Hash passwords with bcrypt salt rounds, issue signed JSON Web Tokens upon login, and verify payload signatures.",
    taskUrl: "https://jwt.io/introduction",
    videoUrl: "https://www.youtube.com/results?search_query=JWT+authentication+NodeJS+Express"
  },
  {
    day: 24,
    title: "Role-Based Access Control (RBAC) & Protected Routes",
    taskDescription: "Build authorization middleware verifying user roles (student, faculty, admin) and blocking unauthorized 403 access.",
    taskUrl: "https://auth0.com/intro-to-iam/what-is-role-based-access-control-rbac",
    videoUrl: "https://www.youtube.com/results?search_query=Role+based+access+control+NodeJS"
  },
  {
    day: 25,
    title: "React Fundamentals: JSX Syntax & Functional Components",
    taskDescription: "Scaffold a modern React app with Vite, build reusable functional components, and pass props cleanly.",
    taskUrl: "https://react.dev/learn/your-first-component",
    videoUrl: "https://www.youtube.com/results?search_query=ReactJS+crash+course+for+beginners"
  },
  {
    day: 26,
    title: "React Hooks: useState State Management & Event Handling",
    taskDescription: "Manage component reactivity with useState hook, handle controlled inputs, and manage form submission state.",
    taskUrl: "https://react.dev/learn/state-a-components-memory",
    videoUrl: "https://www.youtube.com/results?search_query=React+useState+hook+tutorial"
  },
  {
    day: 27,
    title: "React useEffect Hook: Lifecycle, Data Fetching & Cleanups",
    taskDescription: "Fetch backend data on component mount, configure dependency arrays, and cancel async timers on unmount.",
    taskUrl: "https://react.dev/learn/synchronizing-with-effects",
    videoUrl: "https://www.youtube.com/results?search_query=React+useEffect+hook+explained"
  },
  {
    day: 28,
    title: "Full-Stack Integration: Connecting React Frontend to Node API",
    taskDescription: "Wire React frontend components to Express backend REST routes, managing loading spinners and error states.",
    taskUrl: "https://fullstackopen.com/en/part2/altering_data_in_server",
    videoUrl: "https://www.youtube.com/results?search_query=Connect+React+frontend+to+NodeJS+backend"
  },
  {
    day: 29,
    title: "Web Security Auditing: CORS, XSS, CSRF & Helmet Headers",
    taskDescription: "Audit application for common vulnerabilities, sanitize user inputs, set HTTP-only cookies, and configure Helmet headers.",
    taskUrl: "https://owasp.org/www-project-top-ten/",
    videoUrl: "https://www.youtube.com/results?search_query=Web+security+OWASP+top+10"
  },
  {
    day: 30,
    title: "Production Deployment: Cloud Hosting & CI/CD Verification",
    taskDescription: "Deploy the full-stack project to Render / Vercel with MongoDB Atlas cloud database and live HTTPS domain.",
    taskUrl: "https://vercel.com/docs/deployments/overview",
    videoUrl: "https://www.youtube.com/results?search_query=Deploy+MERN+stack+app+to+cloud"
  }
];

const pythonDsaCurriculum = [
  {
    day: 1,
    title: "Big-O Asymptotic Complexity & Space-Time Tradeoffs",
    taskDescription: "Analyze algorithmic time complexities O(1), O(log n), O(n), O(n log n), O(n^2) and worst vs best case scenarios.",
    taskUrl: "https://www.geeksforgeeks.org/analysis-algorithms-big-o-analysis/",
    videoUrl: "https://www.youtube.com/results?search_query=Big+O+notation+tutorial+python"
  },
  {
    day: 2,
    title: "Python Memory Model, Dynamic Arrays & Slicing Tricks",
    taskDescription: "Deep dive into Python list internals, contiguous memory allocation, amortized O(1) appends, and memory profiling.",
    taskUrl: "https://docs.python.org/3/tutorial/datastructures.html",
    videoUrl: "https://www.youtube.com/results?search_query=Python+data+structures+internals"
  },
  {
    day: 3,
    title: "Two Pointers Technique: Pair Sums & Palindromes",
    taskDescription: "Solve Two Sum II (Sorted Array), Valid Palindrome, and 3Sum problems using bidirectional pointer convergence.",
    taskUrl: "https://leetcode.com/tag/two-pointers/",
    videoUrl: "https://www.youtube.com/results?search_query=Two+pointers+technique+leetcode"
  },
  {
    day: 4,
    title: "Sliding Window Pattern: Subarrays & Substrings",
    taskDescription: "Implement fixed-size and dynamically expanding window algorithms (e.g. Longest Substring Without Repeating Characters).",
    taskUrl: "https://leetcode.com/tag/sliding-window/",
    videoUrl: "https://www.youtube.com/results?search_query=Sliding+window+algorithm+python"
  },
  {
    day: 5,
    title: "Hash Maps & Sets: Frequency Counting & O(1) Lookups",
    taskDescription: "Solve Group Anagrams and Top K Frequent Elements using collections.defaultdict and Counter in Python.",
    taskUrl: "https://www.geeksforgeeks.org/hash-table-data-structure/",
    videoUrl: "https://www.youtube.com/results?search_query=Hash+table+hashmap+python+dsa"
  },
  {
    day: 6,
    title: "Prefix Sum & Kadane's Algorithm for Maximum Subarray",
    taskDescription: "Compute range sum queries in O(1) and solve the Maximum Subarray problem in linear O(n) time.",
    taskUrl: "https://leetcode.com/problems/maximum-subarray/",
    videoUrl: "https://www.youtube.com/results?search_query=Kadanes+algorithm+explained"
  },
  {
    day: 7,
    title: "Singly Linked Lists: Node Classes, Traversal & Insertion",
    taskDescription: "Implement a custom SinglyLinkedList class with insert_head, insert_tail, and delete_node in pure Python.",
    taskUrl: "https://www.geeksforgeeks.org/data-structures/linked-list/singly-linked-list/",
    videoUrl: "https://www.youtube.com/results?search_query=Linked+list+in+python+tutorial"
  },
  {
    day: 8,
    title: "Linked List Reversal & Fast and Slow Pointers (Floyd's Cycle)",
    taskDescription: "Reverse a linked list iteratively & recursively, and detect circular references using Floyd's Tortoise and Hare.",
    taskUrl: "https://leetcode.com/problems/reverse-linked-list/",
    videoUrl: "https://www.youtube.com/results?search_query=Reverse+linked+list+floyd+cycle+detection"
  },
  {
    day: 9,
    title: "Doubly Linked Lists & LRU Cache System Design",
    taskDescription: "Construct a Least Recently Used (LRU) Cache combining Doubly Linked List with Hash Map for O(1) get and put.",
    taskUrl: "https://leetcode.com/problems/lru-cache/",
    videoUrl: "https://www.youtube.com/results?search_query=LRU+cache+implementation+python"
  },
  {
    day: 10,
    title: "Stacks: LIFO Principles & Parentheses Matching",
    taskDescription: "Solve Valid Parentheses and Min Stack problems using Python list and collections.deque stack implementations.",
    taskUrl: "https://leetcode.com/problems/valid-parentheses/",
    videoUrl: "https://www.youtube.com/results?search_query=Stack+data+structure+python"
  },
  {
    day: 11,
    title: "Monotonic Stack Pattern: Next Greater Element",
    taskDescription: "Use monotonic stacks to compute Daily Temperatures and Largest Rectangle in Histogram in O(n) time.",
    taskUrl: "https://leetcode.com/problems/daily-temperatures/",
    videoUrl: "https://www.youtube.com/results?search_query=Monotonic+stack+pattern+leetcode"
  },
  {
    day: 12,
    title: "Queues: FIFO Principles, Circular Queues & BFS Queues",
    taskDescription: "Implement circular buffer queues using collections.deque and design an asynchronous job queue simulator.",
    taskUrl: "https://www.geeksforgeeks.org/queue-data-structure/",
    videoUrl: "https://www.youtube.com/results?search_query=Queue+data+structure+in+python"
  },
  {
    day: 13,
    title: "Recursion Foundations & Call Stack Visualization",
    taskDescription: "Master base cases, recursive steps, recurrence relations, and tree visualization of recursive calls.",
    taskUrl: "https://realpython.com/python-thinking-recursively/",
    videoUrl: "https://www.youtube.com/results?search_query=Recursion+in+python+tutorial"
  },
  {
    day: 14,
    title: "Backtracking Algorithm: Subsets & Combinations",
    taskDescription: "Generate power sets, permutations, and solve the N-Queens constraint satisfaction problem.",
    taskUrl: "https://leetcode.com/problems/subsets/",
    videoUrl: "https://www.youtube.com/results?search_query=Backtracking+algorithm+python+subsets"
  },
  {
    day: 15,
    title: "Binary Search: Iterative, Recursive & Rotated Arrays",
    taskDescription: "Solve search in sorted array, search in rotated sorted array, and find minimum in rotated array in O(log n).",
    taskUrl: "https://leetcode.com/problems/binary-search/",
    videoUrl: "https://www.youtube.com/results?search_query=Binary+search+variations+leetcode"
  },
  {
    day: 16,
    title: "Binary Trees: Node Architecture & Recursive Traversals",
    taskDescription: "Implement Pre-Order, In-Order, and Post-Order traversals both recursively and iteratively using stacks.",
    taskUrl: "https://www.geeksforgeeks.org/tree-traversals-inorder-preorder-and-postorder/",
    videoUrl: "https://www.youtube.com/results?search_query=Binary+tree+traversals+python"
  },
  {
    day: 17,
    title: "Binary Search Trees (BST): Insertion, Search & Validation",
    taskDescription: "Validate BST properties, search for values, and find the Lowest Common Ancestor (LCA) in a BST.",
    taskUrl: "https://leetcode.com/problems/validate-binary-search-tree/",
    videoUrl: "https://www.youtube.com/results?search_query=Validate+binary+search+tree+python"
  },
  {
    day: 18,
    title: "Tree Breadth-First Search: Level Order Traversal",
    taskDescription: "Traverse trees level-by-level using queues, computing maximum depth and right-side view of binary trees.",
    taskUrl: "https://leetcode.com/problems/binary-tree-level-order-traversal/",
    videoUrl: "https://www.youtube.com/results?search_query=Level+order+traversal+binary+tree"
  },
  {
    day: 19,
    title: "Tree Depth-First Search: Path Sum & Diameter of Binary Tree",
    taskDescription: "Calculate the longest diameter between any two nodes and solve Root to Leaf Path Sum III.",
    taskUrl: "https://leetcode.com/problems/diameter-of-binary-tree/",
    videoUrl: "https://www.youtube.com/results?search_query=Diameter+of+binary+tree+leetcode"
  },
  {
    day: 20,
    title: "Heaps & Priority Queues: Min-Heap & Max-Heap with heapq",
    taskDescription: "Solve Kth Largest Element in an Array and Find Median from Data Stream using Python's heapq library.",
    taskUrl: "https://docs.python.org/3/library/heapq.html",
    videoUrl: "https://www.youtube.com/results?search_query=Heaps+and+priority+queues+python"
  },
  {
    day: 21,
    title: "Graphs: Adjacency List Representation & Degree Counting",
    taskDescription: "Represent directed and undirected graphs using adjacency lists with defaultdict(list) and traverse nodes.",
    taskUrl: "https://www.geeksforgeeks.org/graph-and-its-representations/",
    videoUrl: "https://www.youtube.com/results?search_query=Graph+data+structure+python"
  },
  {
    day: 22,
    title: "Graph Breadth-First Search (BFS): Shortest Path & Island Count",
    taskDescription: "Solve the Number of Islands and Rotting Oranges matrix problems using BFS queue exploration.",
    taskUrl: "https://leetcode.com/problems/number-of-islands/",
    videoUrl: "https://www.youtube.com/results?search_query=Number+of+islands+BFS+python"
  },
  {
    day: 23,
    title: "Graph Depth-First Search (DFS) & Connected Components",
    taskDescription: "Explore multi-node graph components recursively with visited sets and solve Clone Graph.",
    taskUrl: "https://leetcode.com/problems/clone-graph/",
    videoUrl: "https://www.youtube.com/results?search_query=Graph+DFS+python+tutorial"
  },
  {
    day: 24,
    title: "Topological Sort & Cycle Detection in Directed Graphs",
    taskDescription: "Solve Course Schedule I & II using Kahn's algorithm (in-degrees BFS) and DFS coloring.",
    taskUrl: "https://leetcode.com/problems/course-schedule/",
    videoUrl: "https://www.youtube.com/results?search_query=Topological+sort+Kahn+algorithm+python"
  },
  {
    day: 25,
    title: "Dijkstra’s Algorithm: Single-Source Shortest Paths",
    taskDescription: "Find shortest paths in weighted non-negative graphs using Dijkstra with priority queue min-heaps in O((V+E) log V).",
    taskUrl: "https://www.geeksforgeeks.org/dijkstras-shortest-path-algorithm-greedy-algo-7/",
    videoUrl: "https://www.youtube.com/results?search_query=Dijkstra+algorithm+python"
  },
  {
    day: 26,
    title: "Disjoint Set Union (Union-Find) & Minimum Spanning Tree",
    taskDescription: "Implement DSU with path compression and union by rank to detect cycles and solve Kruskal's MST.",
    taskUrl: "https://leetcode.com/problems/redundant-connection/",
    videoUrl: "https://www.youtube.com/results?search_query=Union+find+disjoint+set+python"
  },
  {
    day: 27,
    title: "Dynamic Programming: 1D Memoization & Tabulation",
    taskDescription: "Solve Climbing Stairs, House Robber, and Coin Change by formulating optimal recurrence relations.",
    taskUrl: "https://leetcode.com/problems/house-robber/",
    videoUrl: "https://www.youtube.com/results?search_query=Dynamic+programming+1D+memoization"
  },
  {
    day: 28,
    title: "Dynamic Programming: 2D Grid Paths & Knapsack Problem",
    taskDescription: "Solve Unique Paths in a Grid and 0/1 Knapsack problem using 2D state matrix optimization.",
    taskUrl: "https://leetcode.com/problems/unique-paths/",
    videoUrl: "https://www.youtube.com/results?search_query=01+knapsack+problem+python"
  },
  {
    day: 29,
    title: "DP on Strings: Longest Common Subsequence & Edit Distance",
    taskDescription: "Compute similarity between two strings using 2D table dynamic programming in O(M*N) time.",
    taskUrl: "https://leetcode.com/problems/longest-common-subsequence/",
    videoUrl: "https://www.youtube.com/results?search_query=Longest+common+subsequence+python"
  },
  {
    day: 30,
    title: "DSA Mock Coding Test & Placement Interview Simulation",
    taskDescription: "Complete a timed 3-question LeetCode contest assessment (Easy, Medium, Hard) adhering to clean code standards.",
    taskUrl: "https://leetcode.com/contest/",
    videoUrl: "https://www.youtube.com/results?search_query=Leetcode+mock+interview+coding+round"
  }
];

const placementCurriculum = [
  {
    day: 1,
    title: "ATS-Friendly Resume Engineering & Portfolio Building",
    taskDescription: "Draft an ATS-compliant 1-page engineering resume formatted with STAR bullet points and clean typography.",
    taskUrl: "https://www.novoresume.com/career-blog/ats-resume",
    videoUrl: "https://www.youtube.com/results?search_query=ATS+resume+format+software+engineer"
  },
  {
    day: 2,
    title: "Quantitative Aptitude: Percentages, Fractions & Vedic Speed Math",
    taskDescription: "Master mental math shortcuts, percentage-to-fraction conversions, and solve 25 high-yield percentage questions.",
    taskUrl: "https://www.indiabix.com/aptitude/percentage/",
    videoUrl: "https://www.youtube.com/results?search_query=Quantitative+aptitude+percentage+tricks"
  },
  {
    day: 3,
    title: "Quantitative Aptitude: Profit, Loss, Margin & Markups",
    taskDescription: "Practice marked price, successive discounts, cost price vs selling price calculations with zero formula memorization.",
    taskUrl: "https://www.indiabix.com/aptitude/profit-and-loss/",
    videoUrl: "https://www.youtube.com/results?search_query=Profit+and+loss+aptitude+shortcuts"
  },
  {
    day: 4,
    title: "Quantitative Aptitude: Ratios, Proportions & Alligation Mixtures",
    taskDescription: "Solve complex mixture replacements, partnership investment returns, and inverse proportion problems.",
    taskUrl: "https://www.indiabix.com/aptitude/ratio-and-proportion/",
    videoUrl: "https://www.youtube.com/results?search_query=Ratio+and+proportion+mixture+alligation"
  },
  {
    day: 5,
    title: "Quantitative Aptitude: Time, Speed & Distance / Train Crossing",
    taskDescription: "Solve relative speed problems: trains crossing platforms/poles, boats in upstream and downstream currents.",
    taskUrl: "https://www.indiabix.com/aptitude/time-and-distance/",
    videoUrl: "https://www.youtube.com/results?search_query=Time+speed+distance+trains+aptitude"
  },
  {
    day: 6,
    title: "Quantitative Aptitude: Time & Work, Efficiency & Pipes & Cisterns",
    taskDescription: "Master LCM method for total work, calculate individual efficiencies and alternate days working schedules.",
    taskUrl: "https://www.indiabix.com/aptitude/time-and-work/",
    videoUrl: "https://www.youtube.com/results?search_query=Time+and+work+LCM+method+shortcuts"
  },
  {
    day: 7,
    title: "Quantitative Aptitude: Permutation, Combination & Probability",
    taskDescription: "Compute word arrangements with constraints, team selections, coin tosses, and dice probabilities.",
    taskUrl: "https://www.indiabix.com/aptitude/probability/",
    videoUrl: "https://www.youtube.com/results?search_query=Permutation+combination+probability+aptitude"
  },
  {
    day: 8,
    title: "Logical Reasoning: Number, Letter & Alpha-Numeric Series",
    taskDescription: "Identify missing patterns in prime progressions, alternating differences, and Fibonacci variants.",
    taskUrl: "https://www.indiabix.com/logical-reasoning/number-series/",
    videoUrl: "https://www.youtube.com/results?search_query=Logical+reasoning+number+series+tricks"
  },
  {
    day: 9,
    title: "Logical Reasoning: Blood Relations & Family Tree Mapping",
    taskDescription: "Map multi-generational family trees, decode symbolical relations (A + B means A is father of B), and resolve puzzles.",
    taskUrl: "https://www.indiabix.com/logical-reasoning/blood-relation-test/",
    videoUrl: "https://www.youtube.com/results?search_query=Blood+relations+reasoning+family+tree"
  },
  {
    day: 10,
    title: "Logical Reasoning: Linear & Circular Seating Arrangements",
    taskDescription: "Solve 8-person circular tables with mixed inward/outward facing directions and linear row alignments.",
    taskUrl: "https://www.geeksforgeeks.org/seating-arrangement-puzzles/",
    videoUrl: "https://www.youtube.com/results?search_query=Seating+arrangement+puzzles+reasoning"
  },
  {
    day: 11,
    title: "Logical Reasoning: Syllogisms & Venn Diagram Analysis",
    taskDescription: "Deduce valid conclusions from premise statements ('All A are B', 'Some B are C', 'No C is D') using Venn sets.",
    taskUrl: "https://www.indiabix.com/verbal-reasoning/syllogism/",
    videoUrl: "https://www.youtube.com/results?search_query=Syllogism+shortcuts+and+venn+diagrams"
  },
  {
    day: 12,
    title: "Data Interpretation: Bar Graphs, Pie Charts & Tabular Analysis",
    taskDescription: "Calculate annual growth percentages, ratios, and quick estimates from multi-layer data visualization charts.",
    taskUrl: "https://www.indiabix.com/data-interpretation/table-charts/",
    videoUrl: "https://www.youtube.com/results?search_query=Data+interpretation+pie+chart+table"
  },
  {
    day: 13,
    title: "Verbal Ability: Grammatical Rules, Subject-Verb & Tenses",
    taskDescription: "Review rule of parallelism, modifiers, conditional clauses, and practice 30 error detection sentences.",
    taskUrl: "https://www.indiabix.com/verbal-ability/sentence-correction/",
    videoUrl: "https://www.youtube.com/results?search_query=Sentence+correction+verbal+ability+rules"
  },
  {
    day: 14,
    title: "Verbal Ability: Reading Comprehension Speed Strategies",
    taskDescription: "Practice skimming, identifying central themes, tone of the author, and answering inference questions.",
    taskUrl: "https://www.indiabix.com/verbal-ability/comprehension/",
    videoUrl: "https://www.youtube.com/results?search_query=Reading+comprehension+tricks+speed+reading"
  },
  {
    day: 15,
    title: "Core CS Refresher: Operating Systems Memory Management & Paging",
    taskDescription: "Master virtual memory, page fault handling, thrashing, and page replacement algorithms (LRU, FIFO).",
    taskUrl: "https://www.geeksforgeeks.org/operating-systems/",
    videoUrl: "https://www.youtube.com/results?search_query=Operating+systems+interview+questions"
  },
  {
    day: 16,
    title: "Core CS Refresher: Process Synchronization, Semaphores & Deadlocks",
    taskDescription: "Understand mutexes, condition variables, Banker's algorithm for deadlock avoidance, and critical sections.",
    taskUrl: "https://www.geeksforgeeks.org/introduction-of-deadlock-in-operating-system/",
    videoUrl: "https://www.youtube.com/results?search_query=Deadlock+and+semaphores+operating+systems"
  },
  {
    day: 17,
    title: "Core CS Refresher: DBMS Architecture, SQL Queries & Normalization",
    taskDescription: "Write complex SQL joins, subqueries, group by having, and understand 1NF, 2NF, 3NF, BCNF normalizations.",
    taskUrl: "https://www.geeksforgeeks.org/dbms/",
    videoUrl: "https://www.youtube.com/results?search_query=DBMS+interview+questions+normalization"
  },
  {
    day: 18,
    title: "Core CS Refresher: Transactions, ACID Properties & B-Tree Indexing",
    taskDescription: "Explain Atomicity, Consistency, Isolation, Durability, dirty reads, and how B+ Trees index disk records.",
    taskUrl: "https://www.geeksforgeeks.org/acid-properties-in-dbms/",
    videoUrl: "https://www.youtube.com/results?search_query=ACID+properties+and+indexing+in+DBMS"
  },
  {
    day: 19,
    title: "Core CS Refresher: Computer Networks OSI vs TCP/IP Architecture",
    taskDescription: "Trace packet travel through physical, data link, network, transport, and application layers.",
    taskUrl: "https://www.geeksforgeeks.org/computer-network-tutorials/",
    videoUrl: "https://www.youtube.com/results?search_query=Computer+networks+OSI+model+interview"
  },
  {
    day: 20,
    title: "Core CS Refresher: DNS, TCP 3-Way Handshake & HTTP vs HTTPS",
    taskDescription: "Explain in detail: What happens when you type google.com into your browser? Trace SYN, SYN-ACK, ACK and TLS.",
    taskUrl: "https://www.geeksforgeeks.org/what-happens-when-you-type-a-url-in-the-browser/",
    videoUrl: "https://www.youtube.com/results?search_query=What+happens+when+you+type+URL+in+browser"
  },
  {
    day: 21,
    title: "Object-Oriented Programming (OOP) Deep-Dive with Real Scenarios",
    taskDescription: "Demonstrate Encapsulation, Polymorphism (method overloading vs overriding), Inheritance, and Abstraction.",
    taskUrl: "https://www.geeksforgeeks.org/object-oriented-programming-oops-concept-in-java/",
    videoUrl: "https://www.youtube.com/results?search_query=OOPs+concepts+interview+questions"
  },
  {
    day: 22,
    title: "System Design 101: Scalability, Load Balancing & Caching",
    taskDescription: "Learn horizontal vs vertical scaling, Redis caching strategies, CDNs, and database read-replicas.",
    taskUrl: "https://github.com/donnemartin/system-design-primer",
    videoUrl: "https://www.youtube.com/results?search_query=System+design+basics+for+beginners"
  },
  {
    day: 23,
    title: "Behavioral Interviews: Mastering the STAR Method Framework",
    taskDescription: "Prepare 5 concrete STAR stories (Situation, Task, Action, Result) showcasing leadership, resilience, and ownership.",
    taskUrl: "https://www.themuse.com/advice/star-interview-method",
    videoUrl: "https://www.youtube.com/results?search_query=STAR+method+behavioral+interview+answers"
  },
  {
    day: 24,
    title: "'Tell Me About Yourself' & Capstone Project Pitching",
    taskDescription: "Craft a captivating 90-second elevator pitch connecting your academic background, passions, and engineering projects.",
    taskUrl: "https://hbr.org/2019/09/how-to-answer-tell-me-about-yourself-in-an-interview",
    videoUrl: "https://www.youtube.com/results?search_query=Tell+me+about+yourself+interview+answer"
  },
  {
    day: 25,
    title: "Tough HR Questions: Strengths, Weaknesses & Conflict Handling",
    taskDescription: "Formulate authentic answers for your greatest failure, conflict with a team member, and 5-year career vision.",
    taskUrl: "https://www.indeed.com/career-advice/interviewing/interview-question-what-is-your-greatest-weakness",
    videoUrl: "https://www.youtube.com/results?search_query=Greatest+weakness+interview+question"
  },
  {
    day: 26,
    title: "Live Technical Coding Interview Protocol: Think Aloud Strategy",
    taskDescription: "Practice communicating your thought process, asking clarifying edge-case questions, and writing modular clean code.",
    taskUrl: "https://interviewing.io/guides/how-to-think-aloud-in-technical-interviews",
    videoUrl: "https://www.youtube.com/results?search_query=How+to+think+out+loud+technical+interview"
  },
  {
    day: 27,
    title: "Service-Based MNC Patterns: TCS NQT, Infosys, Wipro, Cognizant",
    taskDescription: "Review actual previous year coding questions, aptitude cut-offs, and assessment patterns of top IT service firms.",
    taskUrl: "https://www.geeksforgeeks.org/placement-preparation/",
    videoUrl: "https://www.youtube.com/results?search_query=TCS+NQT+Infosys+placement+preparation"
  },
  {
    day: 28,
    title: "Product-Based MNC Standards: Amazon Leadership & Problem Solving",
    taskDescription: "Study Amazon's 16 Leadership Principles and solve top 10 recurring FAANG/Tier-1 coding challenges.",
    taskUrl: "https://leetcode.com/explore/interview/card/top-interview-questions-easy/",
    videoUrl: "https://www.youtube.com/results?search_query=Amazon+leadership+principles+interview"
  },
  {
    day: 29,
    title: "Salary Negotiation, Benefits Review & Questions for the Interviewer",
    taskDescription: "Prepare 5 thoughtful questions to ask the interviewer to demonstrate high intellectual curiosity and culture fit.",
    taskUrl: "https://www.themuse.com/advice/51-great-questions-to-ask-in-an-interview",
    videoUrl: "https://www.youtube.com/results?search_query=Questions+to+ask+at+end+of+job+interview"
  },
  {
    day: 30,
    title: "Full 60-Minute Comprehensive Mock Interview & Final Review",
    taskDescription: "Undergo a full mock session with a peer or mentor covering technical coding, CS fundamentals, and HR discussion.",
    taskUrl: "https://www.pramp.com/",
    videoUrl: "https://www.youtube.com/results?search_query=Full+mock+software+engineer+interview"
  }
];

/**
 * Returns a complete 30-day curriculum tailored to the specific skill title or category.
 */
export function get30DayCurriculum(trackTitle = '', category = '') {
  const normTitle = (trackTitle || '').toLowerCase();
  const normCat = (category || '').toLowerCase();

  if (normTitle.includes('web') || normTitle.includes('fullstack') || normTitle.includes('html') || normTitle.includes('javascript')) {
    return webDevCurriculum;
  }
  if (normTitle.includes('python') || normTitle.includes('dsa') || normTitle.includes('algorithm') || normTitle.includes('structure')) {
    return pythonDsaCurriculum;
  }
  if (normTitle.includes('interview') || normTitle.includes('placement') || normTitle.includes('aptitude') || normCat.includes('career')) {
    return placementCurriculum;
  }

  // Generate dynamic, topic-specific 30-day curriculum for any other skill
  const days = [];
  const cleanTitle = trackTitle || 'Engineering Skills';

  const milestones = [
    { title: "Foundations & Core Principles", desc: "Understand foundational vocabulary, toolchain setup, and core conceptual models." },
    { title: "Environment Configuration & CLI Workflows", desc: "Configure local development environment, install packages, and initialize repository." },
    { title: "Syntax & Essential Building Blocks", desc: "Write foundational scripts, master basic variables, and study data representations." },
    { title: "Control Structures & Execution Flow", desc: "Implement logic gates, branching, loops, and algorithmic decision structures." },
    { title: "Modular Functions & Reusable Components", desc: "Refactor code into modular units, document parameters, and isolate concerns." },
    { title: "Data Organization & Internal Storage", desc: "Organize input data, profile memory footprint, and structure collections." },
    { title: "Debugging Strategies & Error Diagnostics", desc: "Use step-through debuggers, parse stack traces, and isolate edge-case failures." },
    { title: "Intermediate Design & State Modeling", desc: "Model states, lifecycle events, and data flows using clean architectural paradigms." },
    { title: "API Integration & Data Exchanges", desc: "Interact with external data services, encode/decode JSON, and validate schemas." },
    { title: "Milestone Assessment & Mini Project", desc: "Build a functioning proof-of-concept integrating all Week 1 and Week 2 concepts." },
    { title: "Performance Profiling & Bottleneck Optimization", desc: "Profile execution timing, optimize algorithmic hotspots, and reduce latency." },
    { title: "Security Best Practices & Data Validation", desc: "Sanitize inputs, implement boundary checks, and guard against exploits." },
    { title: "Asynchronous Pipelines & Concurrency", desc: "Manage background jobs, thread/event loops, and race condition prevention." },
    { title: "Automated Unit Testing & Assertions", desc: "Write comprehensive unit test suites with assertion frameworks and mocking." },
    { title: "Code Refactoring & Clean Code Patterns", desc: "Apply SOLID principles, eliminate duplication, and enhance maintainability." },
    { title: "System Architecture & Component Coupling", desc: "Design decoupled systems, publish-subscribe hooks, and micro-services." },
    { title: "Cloud Integration & Remote Services", desc: "Connect local modules to managed cloud databases and serverless endpoints." },
    { title: "Database Indexing & Persistence Layer", desc: "Optimize data queries, create indexes, and implement transaction safety." },
    { title: "Logging, Telemetry & Health Monitoring", desc: "Instrument production logging, metric counters, and alert thresholds." },
    { title: "Capstone Project: Architecture & Blueprint", desc: "Define functional requirements, wireframes, and database models for capstone." },
    { title: "Capstone Project: Core Feature Implementation", desc: "Code the primary business logic and user interface components." },
    { title: "Capstone Project: Persistence & API Wiring", desc: "Connect frontend forms to backend persistence with full validation." },
    { title: "Capstone Project: Exception Handling & Edge Cases", desc: "Simulate network timeouts, invalid inputs, and implement recovery flows." },
    { title: "Capstone Project: Performance Tuning & Caching", desc: "Introduce cache layers and compress assets for high responsiveness." },
    { title: "Continuous Integration & Containerization", desc: "Write Dockerfiles and configure automated CI testing pipelines." },
    { title: "Cloud Deployment & Production Release", desc: "Deploy application live to cloud hosting with SSL certificates." },
    { title: "Technical Documentation & README Writing", desc: "Author comprehensive documentation with architectural diagrams." },
    { title: "Peer Review & Code Inspection", desc: "Perform structured code walkthroughs and implement peer feedback." },
    { title: "Interview Talking Points & STAR Demonstration", desc: "Synthesize lessons learned, technical tradeoffs, and prepare interview demo." },
    { title: "30-Day Certification & Final Track Mastery", desc: "Review the complete 30-day journey, take final assessment, and earn certificate." }
  ];

  for (let day = 1; day <= 30; day++) {
    const m = milestones[day - 1] || { title: `Advanced Concepts Part ${day}`, desc: `Deep dive into ${cleanTitle} advanced applications.` };
    const query = encodeURIComponent(`${cleanTitle} ${m.title}`);
    days.push({
      day,
      title: `${m.title}`,
      taskDescription: m.desc,
      taskUrl: `https://www.google.com/search?q=${query}+tutorial+guide`,
      videoUrl: `https://www.youtube.com/results?search_query=${query}`
    });
  }

  return days;
}
