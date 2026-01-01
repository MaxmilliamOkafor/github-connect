// reliable-extractor.js - Bulletproof Keyword Extraction with De-clustering & Learning
// Handles clustered tokens, phrase detection, and persistent skill learning

(function(global) {
  'use strict';

  // ============ KNOWN SKILLS DICTIONARY (For De-clustering) ============
  
  const SKILL_DICTIONARY = new Set([
    // Common soft skills & business terms
    'management', 'communication', 'relationship', 'relationship-building', 'building',
    'results', 'results-oriented', 'oriented', 'mindset', 'organized', 'multi-tasker',
    'multitasker', 'comfort', 'comfortable', 'independently', 'negotiation', 'collaboration',
    'leadership', 'teamwork', 'problem-solving', 'analytical', 'strategic', 'creative',
    'adaptable', 'flexible', 'proactive', 'initiative', 'presentation', 'written',
    'verbal', 'interpersonal', 'customer-facing', 'stakeholder', 'prioritization',
    
    // SaaS & CRM
    'salesforce', 'saas', 'crm', 'hubspot', 'zendesk', 'intercom', 'freshdesk',
    'pipedrive', 'zoho', 'dynamics', 'servicenow', 'workday', 'netsuite', 'sap',
    
    // Security & Cybersecurity
    'cybersecurity', 'security', 'infosec', 'soc', 'siem', 'firewall', 'endpoint',
    'incident', 'response', 'threat', 'vulnerability', 'penetration', 'compliance',
    'gdpr', 'hipaa', 'pci', 'iso', 'nist', 'awareness', 'training', 'phishing',
    
    // Customer Success / Account Management
    'customer', 'success', 'account', 'renewals', 'expansion', 'upsell', 'cross-sell',
    'retention', 'churn', 'onboarding', 'enablement', 'adoption', 'health', 'monitoring',
    'qbr', 'quarterly', 'business', 'review', 'partner', 'channel', 'msp', 'reseller',
    
    // Tech & Tools
    'api', 'rest', 'graphql', 'sql', 'python', 'javascript', 'java', 'aws', 'azure',
    'gcp', 'docker', 'kubernetes', 'terraform', 'git', 'jira', 'confluence', 'slack',
    'tableau', 'excel', 'powerbi', 'looker', 'data', 'analytics', 'reporting',
    'automation', 'integration', 'workflow', 'agile', 'scrum', 'kanban',
    
    // General business
    'revenue', 'quota', 'pipeline', 'forecast', 'metrics', 'kpi', 'roi', 'budget',
    'contract', 'procurement', 'vendor', 'enterprise', 'smb', 'mid-market', 'startup',
    
    // Misc common terms that get clustered
    'fit', 'experience', 'years', 'degree', 'bachelor', 'master', 'certification',
    'remote', 'hybrid', 'travel', 'bonus', 'equity', 'benefits'
  ]);

  // ============ PHRASE LIBRARY (Multi-word skills) ============
  
  const PHRASE_LIBRARY = [
    // Customer Success / Partner Success
    'customer success', 'customer success manager', 'partner success', 'partner success manager',
    'account management', 'account manager', 'account executive', 'customer experience',
    'client success', 'client relationship', 'customer retention', 'customer onboarding',
    
    // Security
    'security awareness training', 'security awareness', 'cybersecurity awareness',
    'incident response', 'threat detection', 'vulnerability management', 'security operations',
    'managed security', 'security posture', 'risk management', 'compliance management',
    
    // SaaS / Tech
    'saas platform', 'cloud platform', 'software as a service', 'platform as a service',
    'managed service provider', 'channel partner', 'technology partner', 'integration partner',
    
    // Skills
    'relationship building', 'relationship-building', 'results oriented', 'results-oriented',
    'results oriented mindset', 'results-oriented mindset', 'detail oriented', 'detail-oriented',
    'working independently', 'work independently', 'comfort working independently',
    'comfortable working independently', 'self-motivated', 'self-starter', 'fast learner',
    'quick learner', 'strong communicator', 'excellent communication', 'written communication',
    'verbal communication', 'cross-functional', 'cross functional', 'decision making',
    'decision-making', 'problem solving', 'problem-solving', 'critical thinking',
    'time management', 'project management', 'stakeholder management',
    
    // Business
    'quarterly business review', 'qbr', 'business development', 'sales cycle',
    'customer lifecycle', 'revenue growth', 'pipeline management', 'quota attainment',
    'renewals management', 'expansion revenue', 'upsell opportunities', 'cross-sell',
    
    // Tech tools
    'salesforce crm', 'crm software', 'crm platform', 'data analysis', 'data analytics',
    'business intelligence', 'reporting tools', 'excel proficiency', 'google suite',
    'microsoft office', 'presentation skills'
  ];

  // ============ BLACKLISTS ============
  
  const RELIABLE_BLACKLIST = new Set([
    // Generic job posting words
    'remote', 'hybrid', 'office', 'work', 'team', 'culture', 'apply', 'application',
    'bonus', 'salary', 'benefits', 'perks', 'hiring', 'career', 'job', 'position',
    'role', 'opportunity', 'company', 'organization', 'employer', 'employee', 'candidate',
    
    // Common verbs/actions (not skills)
    'looking', 'seeking', 'required', 'requirements', 'preferred', 'ability', 'able',
    'etc', 'including', 'include', 'includes', 'new', 'well', 'based', 'using', 'within',
    'across', 'strong', 'excellent', 'good', 'ensure', 'ensuring', 'provide', 'providing',
    'support', 'help', 'helping', 'develop', 'developing', 'build', 'building', 'create',
    'understand', 'understanding', 'knowledge', 'skills', 'skill', 'must', 'shall',
    'ideally', 'highly', 'plus', 'nice', 'have', 'having', 'get', 'getting', 'make',
    'making', 'take', 'taking', 'use', 'used', 'uses', 'per', 'via', 'like', 'want',
    'wants', 'wanted', 'join', 'joining', 'joined', 'lead', 'leading', 'leverage',
    'please', 'review', 'name', 'status', 'process', 'personal', 'fully', 'human',
    'go', 'match', 'tools', 'businesses', 'hackers', 'profile', 'keywords', 'operations',
    'reimbursement', 'accommodations', 'accommodation', 'discriminate',
    
    // Stop words
    'the', 'and', 'for', 'with', 'our', 'you', 'your', 'this', 'that', 'these',
    'those', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had', 'having',
    'does', 'did', 'doing', 'would', 'should', 'could', 'may', 'might', 'can',
    'will', 'shall', 'need', 'needs', 'from', 'into', 'over', 'under', 'about',
    'after', 'before', 'between', 'through', 'during', 'above', 'below', 'such',
    'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'any', 'all',
    'only', 'own', 'same', 'than', 'too', 'very', 'just', 'also', 'now', 'here',
    'there', 'then', 'when', 'where', 'why', 'how', 'what', 'which', 'who', 'whom',
    
    // Business buzzwords (not ATS keywords)
    'passionate', 'dynamic', 'innovative', 'fast-paced', 'collaborative', 'driven',
    'motivated', 'team-player', 'hands-on', 'startup', 'scale', 'grow', 'growth',
    'impact', 'mission', 'vision', 'values', 'diverse', 'inclusive', 'equal'
  ]);

  const HIGH_VALUE_PATTERNS = [
    // Programming languages
    /\b(?:python|java|javascript|typescript|c\+\+|c#|ruby|golang?|rust|scala|kotlin|swift|php|perl)\b/gi,
    // Frameworks
    /\b(?:react|angular|vue|node\.?js|django|flask|spring|rails|laravel|express|next\.?js|nuxt)\b/gi,
    // Cloud & DevOps
    /\b(?:aws|azure|gcp|docker|kubernetes|k8s|terraform|ansible|jenkins|ci\/cd|devops|linux)\b/gi,
    // Data & ML
    /\b(?:sql|nosql|mongodb|postgresql|mysql|redis|elasticsearch|kafka|spark|hadoop|tensorflow|pytorch|pandas)\b/gi,
    // Tools & Platforms
    /\b(?:salesforce|hubspot|zendesk|jira|confluence|slack|tableau|powerbi|looker|excel)\b/gi,
    // Security
    /\b(?:cybersecurity|siem|soc|firewall|endpoint|penetration|compliance|gdpr|hipaa|nist)\b/gi,
    // SaaS/Business
    /\b(?:saas|crm|erp|api|rest|graphql|agile|scrum|kanban|kpi|roi)\b/gi
  ];

  // ============ PERSISTENT LEARNING STORAGE ============
  
  const STORAGE_KEY = 'ats_tailor_known_keywords';
  let LEARNED_KEYWORDS = new Set();

  function loadLearnedKeywords() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
          if (result[STORAGE_KEY]) {
            LEARNED_KEYWORDS = new Set(result[STORAGE_KEY]);
          }
        });
      } else if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          LEARNED_KEYWORDS = new Set(JSON.parse(stored));
        }
      }
    } catch (e) {
      console.warn('Failed to load learned keywords:', e);
    }
  }

  function saveLearnedKeywords() {
    try {
      const arr = [...LEARNED_KEYWORDS].slice(0, 500); // Limit to 500
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ [STORAGE_KEY]: arr });
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      }
    } catch (e) {
      console.warn('Failed to save learned keywords:', e);
    }
  }

  function learnKeyword(keyword) {
    const lower = keyword.toLowerCase().trim();
    if (lower.length >= 3 && lower.length <= 30 && !RELIABLE_BLACKLIST.has(lower)) {
      LEARNED_KEYWORDS.add(lower);
    }
  }

  // Initialize on load
  loadLearnedKeywords();

  // ============ DE-CLUSTERING LOGIC ============

  /**
   * Check if a token looks like clustered garbage
   * @param {string} token - Token to check
   * @returns {boolean} True if clustered
   */
  function looksClustered(token) {
    if (!token || token.length < 15) return false;
    
    // Check if it contains multiple known dictionary words without proper separators
    const lower = token.toLowerCase();
    let matchCount = 0;
    
    for (const skill of SKILL_DICTIONARY) {
      if (skill.length >= 4 && lower.includes(skill)) {
        matchCount++;
        if (matchCount >= 2) return true;
      }
    }
    
    // Also check for patterns like word.word or wordword
    if (/[a-z]{4,}\.[a-z]{4,}/i.test(token)) return true;
    if (/[a-z]{3,}[A-Z][a-z]{3,}/.test(token)) return true; // camelCase clustering
    
    return false;
  }

  /**
   * Split a clustered token into constituent skills
   * @param {string} token - Clustered token
   * @returns {Array<string>} Split skills
   */
  function decluster(token) {
    if (!token || token.length < 10) return [token];
    
    const lower = token.toLowerCase();
    const found = [];
    let remaining = lower;
    
    // Sort dictionary by length (longest first) for greedy matching
    const sortedSkills = [...SKILL_DICTIONARY]
      .filter(s => s.length >= 3)
      .sort((a, b) => b.length - a.length);
    
    // First, split on obvious delimiters that got stripped
    remaining = remaining.replace(/\./g, ' ').replace(/,/g, ' ');
    
    // Greedy extraction of known skills
    for (const skill of sortedSkills) {
      const idx = remaining.indexOf(skill);
      if (idx !== -1) {
        found.push(skill);
        remaining = remaining.replace(skill, ' ');
      }
    }
    
    // Also try to find remaining valid words
    const leftover = remaining.split(/\s+/).filter(w => 
      w.length >= 3 && !RELIABLE_BLACKLIST.has(w)
    );
    
    found.push(...leftover);
    
    // Return unique, non-empty results
    const unique = [...new Set(found)].filter(s => s.length >= 3);
    
    return unique.length > 0 ? unique : [token];
  }

  /**
   * Process text to decluster all tokens
   * @param {string} text - Raw text
   * @returns {string} Text with declustered tokens
   */
  function declusterText(text) {
    if (!text) return '';
    
    // Split on spaces and process each token
    const tokens = text.split(/\s+/);
    const processed = [];
    
    tokens.forEach(token => {
      if (looksClustered(token)) {
        const parts = decluster(token);
        processed.push(...parts);
      } else {
        processed.push(token);
      }
    });
    
    return processed.join(' ');
  }

  // ============ PHRASE DETECTION ============

  /**
   * Extract known phrases from text
   * @param {string} text - Normalized text
   * @returns {Array<string>} Found phrases
   */
  function extractKnownPhrases(text) {
    if (!text) return [];
    
    const lower = text.toLowerCase();
    const found = [];
    
    // Sort phrases by length (longest first) to match multi-word first
    const sortedPhrases = [...PHRASE_LIBRARY].sort((a, b) => b.length - a.length);
    
    for (const phrase of sortedPhrases) {
      // Check for exact or close match
      const normalizedPhrase = phrase.toLowerCase();
      if (lower.includes(normalizedPhrase)) {
        found.push(phrase);
      }
    }
    
    // Also check learned keywords
    for (const learned of LEARNED_KEYWORDS) {
      if (lower.includes(learned) && !found.includes(learned)) {
        found.push(learned);
      }
    }
    
    return [...new Set(found)];
  }

  // ============ VALIDATION ============

  /**
   * Check if a word is a reliable ATS keyword
   * @param {string} word - Word to validate
   * @returns {boolean} True if reliable
   */
  function isReliableKeyword(word) {
    if (!word || typeof word !== 'string') return false;
    
    const normalized = word.toLowerCase().trim();
    
    // Length check (3-30 characters for phrases)
    if (normalized.length < 3 || normalized.length > 30) return false;
    
    // Must start with letter, allow alphanumeric + common tech chars
    if (!/^[a-zA-Z][a-zA-Z0-9\-\+\#\.\s]*[a-zA-Z0-9]?$/.test(word)) return false;
    
    // Not in blacklist
    if (RELIABLE_BLACKLIST.has(normalized)) return false;
    
    // Not pure number
    if (/^\d+$/.test(word)) return false;
    
    // Reject if it looks clustered and wasn't properly split
    if (looksClustered(word)) return false;
    
    return true;
  }

  /**
   * Check if word is a high-value technical keyword
   * @param {string} word - Word to check
   * @returns {boolean} True if high value
   */
  function isHighValueKeyword(word) {
    const lower = word.toLowerCase();
    
    // Check patterns
    if (HIGH_VALUE_PATTERNS.some(pattern => pattern.test(lower))) return true;
    
    // Check if in skill dictionary
    if (SKILL_DICTIONARY.has(lower)) return true;
    
    // Check if in phrase library
    if (PHRASE_LIBRARY.some(p => p.toLowerCase() === lower)) return true;
    
    // Check if learned
    if (LEARNED_KEYWORDS.has(lower)) return true;
    
    return false;
  }

  // ============ STRUCTURE-BASED EXTRACTION ============

  function extractBullets(text) {
    const keywords = [];
    const bulletLines = text.split(/\n/).filter(line => 
      /^\s*[-•●○◦▪▸►]\s*\S|^\s*\d+[.)]\s*\S/.test(line)
    );
    
    bulletLines.forEach(line => {
      const content = line.replace(/^\s*[-•●○◦▪▸►\d.)]+\s*/, '').trim();
      const lineKeywords = extractTechnicalTerms(content);
      keywords.push(...lineKeywords);
    });
    
    return deduplicateKeywords(keywords);
  }

  function extractSections(text, sections = {}) {
    const keywords = [];
    const prioritySections = ['skills', 'requirements', 'qualifications'];
    const regularSections = ['responsibilities', 'about', 'other'];
    
    prioritySections.forEach(key => {
      if (sections[key]) {
        keywords.push(...extractTechnicalTerms(sections[key]));
      }
    });
    
    regularSections.forEach(key => {
      if (sections[key]) {
        const sectionKeywords = extractTechnicalTerms(sections[key]);
        keywords.push(...sectionKeywords.slice(0, 10));
      }
    });
    
    return deduplicateKeywords(keywords);
  }

  function extractNarrative(text) {
    const contextPatterns = [
      /(?:experience|expertise|proficiency|knowledge|skills?)\s+(?:in|with|of|using)\s+([^,.;]+)/gi,
      /(?:working|work)\s+with\s+([^,.;]+)/gi,
      /(?:using|use)\s+([^,.;]+)/gi,
      /(?:including|such as|like)\s+([^,.;]+)/gi
    ];
    
    const keywords = [];
    
    contextPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const phrase = match[1].trim();
        keywords.push(...extractTechnicalTerms(phrase));
      }
    });
    
    keywords.push(...extractTechnicalTerms(text));
    
    return deduplicateKeywords(keywords);
  }

  function extractPhrasesFromText(text) {
    const parts = text.split(/[,;|\/\n]+/).flatMap(part => 
      part.trim().split(/\s+/)
    );
    
    return deduplicateKeywords(
      parts.filter(isReliableKeyword)
    );
  }

  function tfidfFallback(text) {
    const words = text.toLowerCase().split(/\s+/);
    const freq = new Map();
    
    words.forEach(word => {
      const clean = word.replace(/[^a-z0-9\-\+\#]/g, '');
      if (isReliableKeyword(clean)) {
        freq.set(clean, (freq.get(clean) || 0) + 1);
      }
    });
    
    const sorted = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);
    
    return sorted;
  }

  // ============ CORE EXTRACTION ============

  /**
   * Extract technical terms from text with de-clustering and phrase detection
   * @param {string} text - Text to process
   * @returns {Array<string>} Technical keywords
   */
  function extractTechnicalTerms(text) {
    if (!text) return [];
    
    // Step 1: De-cluster the text first
    const declustered = declusterText(text);
    
    const keywords = new Set();
    const normalized = declustered.toLowerCase();
    
    // Step 2: Extract known phrases first (highest priority)
    const phrases = extractKnownPhrases(normalized);
    phrases.forEach(p => keywords.add(p.toLowerCase()));
    
    // Step 3: Extract high-value patterns
    HIGH_VALUE_PATTERNS.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(normalized)) !== null) {
        keywords.add(match[0].toLowerCase());
      }
    });
    
    // Step 4: Extract multi-word technical phrases
    const phrasePatterns = [
      /\b[a-z]+[\-][a-z]+(?:[\-][a-z]+)*/gi,  // hyphenated terms
      /\b(?:machine|deep)\s+learning\b/gi,
      /\b(?:data|software|web|cloud)\s+(?:engineer|developer|architect|analyst|scientist)\b/gi,
      /\b(?:project|product|program|account)\s+management?\b/gi,
      /\b(?:customer|partner|client)\s+success\b/gi,
      /\b(?:security\s+awareness)\b/gi
    ];
    
    phrasePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(declustered)) !== null) {
        const kw = match[0].toLowerCase().replace(/\s+/g, ' ');
        if (isReliableKeyword(kw)) {
          keywords.add(kw);
        }
      }
    });
    
    // Step 5: Single-pass word extraction
    const words = declustered.split(/\s+/);
    words.forEach(word => {
      const clean = word.replace(/[^a-zA-Z0-9\-\+\#\.]/g, '');
      if (isReliableKeyword(clean)) {
        keywords.add(clean.toLowerCase());
      }
    });
    
    // Step 6: Learn new high-frequency keywords
    const arr = [...keywords];
    arr.forEach(kw => {
      if (kw.length >= 4 && (
        SKILL_DICTIONARY.has(kw) || 
        HIGH_VALUE_PATTERNS.some(p => p.test(kw)) ||
        /^[A-Z]/.test(kw) // Capitalized (likely proper noun/tool)
      )) {
        learnKeyword(kw);
      }
    });
    
    // Periodic save
    if (Math.random() < 0.1) saveLearnedKeywords();
    
    return arr;
  }

  function deduplicateKeywords(keywords) {
    const seen = new Set();
    const result = [];
    
    keywords.forEach(kw => {
      const normalized = kw.toLowerCase().trim();
      if (normalized && !seen.has(normalized) && isReliableKeyword(normalized)) {
        seen.add(normalized);
        result.push(kw);
      }
    });
    
    return result;
  }

  // ============ MAIN EXTRACTION FUNCTION ============

  function extractByStructure(text, structure, sections = {}) {
    let keywords;
    
    switch (structure) {
      case 'bullets':
        keywords = extractBullets(text);
        break;
      case 'sections':
        keywords = extractSections(text, sections);
        break;
      case 'narrative':
        keywords = extractNarrative(text);
        break;
      case 'phrases':
        keywords = extractPhrasesFromText(text);
        break;
      default:
        keywords = tfidfFallback(text);
    }
    
    // Always add known phrases found in text
    const phrases = extractKnownPhrases(text);
    keywords = [...new Set([...phrases, ...keywords])];
    
    // Sort: high-value first, then by length
    keywords.sort((a, b) => {
      const aHigh = isHighValueKeyword(a) ? 1 : 0;
      const bHigh = isHighValueKeyword(b) ? 1 : 0;
      if (aHigh !== bHigh) return bHigh - aHigh;
      return b.length - a.length;
    });
    
    return keywords.slice(0, 35);
  }

  function categorizeKeywords(keywords) {
    const total = keywords.length;
    const highCount = Math.min(15, Math.ceil(total * 0.45));
    const mediumCount = Math.min(10, Math.ceil(total * 0.35));
    
    return {
      all: keywords,
      highPriority: keywords.slice(0, highCount),
      mediumPriority: keywords.slice(highCount, highCount + mediumCount),
      lowPriority: keywords.slice(highCount + mediumCount),
      total
    };
  }

  function extractReliableKeywords(rawText, maxKeywords = 35) {
    if (!rawText || typeof rawText !== 'string') {
      return { all: [], highPriority: [], mediumPriority: [], lowPriority: [], total: 0 };
    }

    let parsed;
    if (global.UniversalJDParser) {
      const cacheKey = global.UniversalJDParser.getCacheKey(rawText);
      const cachedKeywords = global.UniversalJDParser.getCached(
        cacheKey + '_keywords_v2', 
        global.UniversalJDParser.KEYWORD_CACHE
      );
      if (cachedKeywords) return cachedKeywords;
      
      parsed = global.UniversalJDParser.processAnyJobDescription(rawText);
    } else {
      const temp = document.createElement('div');
      temp.innerHTML = rawText;
      parsed = {
        text: temp.textContent || rawText,
        structure: 'raw_text',
        sections: {}
      };
    }

    // De-cluster the entire text first
    const declusteredText = declusterText(parsed.text);
    
    let keywords = extractByStructure(declusteredText, parsed.structure, parsed.sections);
    
    if (keywords.length === 0) {
      keywords = tfidfFallback(declusteredText);
    }
    
    // Filter out any remaining clustered garbage
    keywords = keywords.filter(kw => !looksClustered(kw));
    
    keywords = keywords.slice(0, maxKeywords);
    
    const result = categorizeKeywords(keywords);
    
    if (global.UniversalJDParser) {
      const cacheKey = global.UniversalJDParser.getCacheKey(rawText);
      global.UniversalJDParser.setCache(
        cacheKey + '_keywords_v2', 
        result, 
        global.UniversalJDParser.KEYWORD_CACHE
      );
    }
    
    return result;
  }

  function matchKeywords(cvText, keywords) {
    if (!cvText || !keywords || keywords.length === 0) {
      return { matched: [], missing: keywords || [], matchScore: 0, matchCount: 0 };
    }

    const cvLower = cvText.toLowerCase();
    const matched = [];
    const missing = [];

    keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      const regex = new RegExp(`\\b${escapeRegex(keywordLower)}\\b`, 'i');
      
      if (regex.test(cvLower)) {
        matched.push(keyword);
      } else {
        missing.push(keyword);
      }
    });

    return {
      matched,
      missing,
      matchScore: keywords.length > 0 ? Math.round((matched.length / keywords.length) * 100) : 0,
      matchCount: matched.length,
      totalKeywords: keywords.length
    };
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ============ EXPORTS ============
  
  global.ReliableExtractor = {
    extractReliableKeywords,
    extractByStructure,
    extractTechnicalTerms,
    matchKeywords,
    isReliableKeyword,
    isHighValueKeyword,
    categorizeKeywords,
    // De-clustering
    looksClustered,
    decluster,
    declusterText,
    // Phrase detection
    extractKnownPhrases,
    PHRASE_LIBRARY,
    SKILL_DICTIONARY,
    // Learning
    learnKeyword,
    loadLearnedKeywords,
    saveLearnedKeywords,
    getLearnedKeywords: () => [...LEARNED_KEYWORDS],
    // Individual extractors
    extractBullets,
    extractSections,
    extractNarrative,
    extractPhrases: extractPhrasesFromText,
    tfidfFallback
  };

  // Compatibility
  global.KeywordExtractor = global.KeywordExtractor || {};
  global.KeywordExtractor.extractKeywords = extractReliableKeywords;
  global.KeywordExtractor.matchKeywords = matchKeywords;

})(typeof window !== 'undefined' ? window : global);
