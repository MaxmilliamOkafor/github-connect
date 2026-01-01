// reliable-extractor.js - Bulletproof Keyword Extraction for ANY JD Format
// Single-pass frequency map with structure-aware extraction

(function(global) {
  'use strict';

  // ============ BLACKLISTS & WHITELISTS ============
  
  const RELIABLE_BLACKLIST = new Set([
    // Generic job posting words
    'remote', 'hybrid', 'office', 'work', 'team', 'culture', 'apply', 'application',
    'bonus', 'salary', 'benefits', 'perks', 'hiring', 'career', 'job', 'position',
    'role', 'opportunity', 'company', 'organization', 'employer', 'employee',
    
    // Common verbs/actions (not skills)
    'looking', 'seeking', 'required', 'requirements', 'preferred', 'ability', 'able',
    'experience', 'years', 'year', 'etc', 'including', 'include', 'includes', 'new',
    'well', 'based', 'using', 'within', 'across', 'strong', 'excellent', 'good',
    'ensure', 'ensuring', 'provide', 'providing', 'support', 'supporting', 'help',
    'helping', 'develop', 'developing', 'build', 'building', 'create', 'creating',
    'understand', 'understanding', 'knowledge', 'skills', 'skill', 'candidate',
    'candidates', 'applicant', 'applicants', 'must', 'shall', 'will', 'ideally',
    'highly', 'plus', 'nice', 'have', 'having', 'get', 'getting', 'make',
    'making', 'take', 'taking', 'use', 'used', 'uses', 'per', 'via', 'like', 'want',
    'wants', 'wanted', 'join', 'joining', 'joined', 'lead', 'leading', 'leverage',
    
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
    'motivated', 'self-starter', 'proactive', 'detail-oriented', 'results-driven',
    'team-player', 'hands-on', 'startup', 'scale', 'grow', 'growth', 'impact',
    'mission', 'vision', 'values', 'diverse', 'inclusive', 'equal'
  ]);

  const HIGH_VALUE_PATTERNS = [
    // Programming languages
    /\b(?:python|java|javascript|typescript|c\+\+|c#|ruby|golang?|rust|scala|kotlin|swift|php|perl|r)\b/gi,
    // Frameworks
    /\b(?:react|angular|vue|node\.?js|django|flask|spring|rails|laravel|express|next\.?js|nuxt)\b/gi,
    // Cloud & DevOps
    /\b(?:aws|azure|gcp|docker|kubernetes|k8s|terraform|ansible|jenkins|ci\/cd|devops|linux)\b/gi,
    // Data & ML
    /\b(?:sql|nosql|mongodb|postgresql|mysql|redis|elasticsearch|kafka|spark|hadoop|tensorflow|pytorch|scikit-learn|pandas|numpy)\b/gi,
    // Tools & Methodologies
    /\b(?:git|github|gitlab|jira|confluence|agile|scrum|kanban|rest|graphql|api|microservices)\b/gi
  ];

  // ============ VALIDATION ============

  /**
   * Check if a word is a reliable ATS keyword
   * @param {string} word - Word to validate
   * @returns {boolean} True if reliable
   */
  function isReliableKeyword(word) {
    if (!word || typeof word !== 'string') return false;
    
    const normalized = word.toLowerCase().trim();
    
    // Length check (3-25 characters)
    if (normalized.length < 3 || normalized.length > 25) return false;
    
    // Must start with letter, allow alphanumeric + common tech chars
    if (!/^[a-zA-Z][a-zA-Z0-9\-\+\#\.]*[a-zA-Z0-9]?$/.test(word)) return false;
    
    // Not in blacklist
    if (RELIABLE_BLACKLIST.has(normalized)) return false;
    
    // Not pure number
    if (/^\d+$/.test(word)) return false;
    
    return true;
  }

  /**
   * Check if word is a high-value technical keyword
   * @param {string} word - Word to check
   * @returns {boolean} True if high value
   */
  function isHighValueKeyword(word) {
    const lower = word.toLowerCase();
    return HIGH_VALUE_PATTERNS.some(pattern => pattern.test(lower));
  }

  // ============ STRUCTURE-BASED EXTRACTION ============

  /**
   * Extract keywords from bullet-list formatted text
   * @param {string} text - Text with bullet points
   * @returns {Array<string>} Extracted keywords
   */
  function extractBullets(text) {
    const keywords = [];
    const bulletLines = text.split(/\n/).filter(line => 
      /^\s*[-•●○◦▪▸►]\s*\S|^\s*\d+[.)]\s*\S/.test(line)
    );
    
    bulletLines.forEach(line => {
      // Clean the bullet marker
      const content = line.replace(/^\s*[-•●○◦▪▸►\d.)]+\s*/, '').trim();
      // Extract technical terms from this line
      const lineKeywords = extractTechnicalTerms(content);
      keywords.push(...lineKeywords);
    });
    
    return deduplicateKeywords(keywords);
  }

  /**
   * Extract keywords from section-based text
   * @param {string} text - Full text
   * @param {Object} sections - Parsed sections from UniversalJDParser
   * @returns {Array<string>} Extracted keywords
   */
  function extractSections(text, sections = {}) {
    const keywords = [];
    
    // Prioritize skills and requirements sections
    const prioritySections = ['skills', 'requirements', 'qualifications'];
    const regularSections = ['responsibilities', 'about', 'other'];
    
    // High priority sections get full extraction
    prioritySections.forEach(key => {
      if (sections[key]) {
        keywords.push(...extractTechnicalTerms(sections[key]));
      }
    });
    
    // Regular sections - extract but lower weight
    regularSections.forEach(key => {
      if (sections[key]) {
        const sectionKeywords = extractTechnicalTerms(sections[key]);
        keywords.push(...sectionKeywords.slice(0, 10)); // Limit per section
      }
    });
    
    return deduplicateKeywords(keywords);
  }

  /**
   * Extract keywords from narrative text
   * @param {string} text - Narrative/prose text
   * @returns {Array<string>} Extracted keywords
   */
  function extractNarrative(text) {
    // Look for patterns like "experience with X", "knowledge of Y", "proficiency in Z"
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
    
    // Also do general extraction
    keywords.push(...extractTechnicalTerms(text));
    
    return deduplicateKeywords(keywords);
  }

  /**
   * Extract keywords from phrase-heavy text (e.g., "SQL Python AWS Docker")
   * @param {string} text - Phrase-heavy text
   * @returns {Array<string>} Extracted keywords
   */
  function extractPhrases(text) {
    // Split by common delimiters and spaces
    const parts = text.split(/[,;|\/\n]+/).flatMap(part => 
      part.trim().split(/\s+/)
    );
    
    return deduplicateKeywords(
      parts.filter(isReliableKeyword)
    );
  }

  /**
   * TF-IDF fallback for unstructured text
   * @param {string} text - Raw text
   * @returns {Array<string>} Extracted keywords
   */
  function tfidfFallback(text) {
    // Simple frequency-based extraction
    const words = text.toLowerCase().split(/\s+/);
    const freq = new Map();
    
    words.forEach(word => {
      const clean = word.replace(/[^a-z0-9\-\+\#]/g, '');
      if (isReliableKeyword(clean)) {
        freq.set(clean, (freq.get(clean) || 0) + 1);
      }
    });
    
    // Sort by frequency
    const sorted = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);
    
    return sorted;
  }

  // ============ CORE EXTRACTION ============

  /**
   * Extract technical terms from text using single-pass frequency map
   * @param {string} text - Text to process
   * @returns {Array<string>} Technical keywords
   */
  function extractTechnicalTerms(text) {
    if (!text) return [];
    
    const keywords = new Set();
    const normalized = text.toLowerCase();
    
    // 1. Extract high-value patterns first (always include)
    HIGH_VALUE_PATTERNS.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(normalized)) !== null) {
        keywords.add(match[0].toLowerCase());
      }
    });
    
    // 2. Extract multi-word technical phrases
    const phrasePatterns = [
      /\b[a-z]+[\-\.][a-z]+(?:[\-\.][a-z]+)*/gi,  // hyphenated/dotted terms: node.js, ci-cd
      /\b(?:machine|deep)\s+learning\b/gi,
      /\b(?:data|software|web|cloud|full[\-\s]?stack)\s+(?:engineer|developer|architect|analyst|scientist)\b/gi,
      /\b(?:project|product|program)\s+management?\b/gi,
      /\b(?:natural\s+language\s+processing|nlp)\b/gi,
      /\b(?:artificial\s+intelligence|ai)\b/gi,
      /\b(?:business\s+intelligence|bi)\b/gi
    ];
    
    phrasePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        keywords.add(match[0].toLowerCase().replace(/\s+/g, ' '));
      }
    });
    
    // 3. Single-pass word extraction
    const words = text.split(/\s+/);
    words.forEach(word => {
      const clean = word.replace(/[^a-zA-Z0-9\-\+\#\.]/g, '');
      if (isReliableKeyword(clean)) {
        keywords.add(clean.toLowerCase());
      }
    });
    
    return [...keywords];
  }

  /**
   * Deduplicate and normalize keywords
   * @param {Array<string>} keywords - Keywords to deduplicate
   * @returns {Array<string>} Unique keywords
   */
  function deduplicateKeywords(keywords) {
    const seen = new Set();
    const result = [];
    
    keywords.forEach(kw => {
      const normalized = kw.toLowerCase().trim();
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        result.push(kw);
      }
    });
    
    return result;
  }

  // ============ MAIN EXTRACTION FUNCTION ============

  /**
   * Extract keywords by structure type
   * @param {string} text - Clean text
   * @param {string} structure - Structure type from UniversalJDParser
   * @param {Object} sections - Sections object (optional)
   * @returns {Array<string>} Extracted keywords
   */
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
        keywords = extractPhrases(text);
        break;
      default:
        keywords = tfidfFallback(text);
    }
    
    // Sort: high-value keywords first, then by length (specificity)
    keywords.sort((a, b) => {
      const aHigh = isHighValueKeyword(a) ? 1 : 0;
      const bHigh = isHighValueKeyword(b) ? 1 : 0;
      if (aHigh !== bHigh) return bHigh - aHigh;
      return b.length - a.length; // Longer = more specific
    });
    
    return keywords.slice(0, 35); // Max 35 reliable keywords
  }

  /**
   * Categorize keywords by priority
   * @param {Array<string>} keywords - All keywords
   * @returns {Object} Categorized keywords
   */
  function categorizeKeywords(keywords) {
    const total = keywords.length;
    const highCount = Math.min(11, Math.ceil(total * 0.45));
    const mediumCount = Math.min(8, Math.ceil(total * 0.35));
    
    return {
      all: keywords,
      highPriority: keywords.slice(0, highCount),
      mediumPriority: keywords.slice(highCount, highCount + mediumCount),
      lowPriority: keywords.slice(highCount + mediumCount),
      total
    };
  }

  /**
   * Main extraction function - works with UniversalJDParser
   * @param {string} rawText - Raw job description (HTML or text)
   * @param {number} maxKeywords - Max keywords to return (default 35)
   * @returns {Object} Categorized keywords
   */
  function extractReliableKeywords(rawText, maxKeywords = 35) {
    if (!rawText || typeof rawText !== 'string') {
      return { all: [], highPriority: [], mediumPriority: [], lowPriority: [], total: 0 };
    }

    // Use UniversalJDParser if available
    let parsed;
    if (global.UniversalJDParser) {
      // Check cache first
      const cacheKey = global.UniversalJDParser.getCacheKey(rawText);
      const cachedKeywords = global.UniversalJDParser.getCached(
        cacheKey + '_keywords', 
        global.UniversalJDParser.KEYWORD_CACHE
      );
      if (cachedKeywords) return cachedKeywords;
      
      parsed = global.UniversalJDParser.processAnyJobDescription(rawText);
    } else {
      // Fallback: basic cleaning
      const temp = document.createElement('div');
      temp.innerHTML = rawText;
      parsed = {
        text: temp.textContent || rawText,
        structure: 'raw_text',
        sections: {}
      };
    }

    // Extract by structure
    let keywords = extractByStructure(parsed.text, parsed.structure, parsed.sections);
    
    // Fallback if no keywords found
    if (keywords.length === 0) {
      keywords = tfidfFallback(parsed.text);
    }
    
    // Limit to max
    keywords = keywords.slice(0, maxKeywords);
    
    // Categorize
    const result = categorizeKeywords(keywords);
    
    // Cache result
    if (global.UniversalJDParser) {
      const cacheKey = global.UniversalJDParser.getCacheKey(rawText);
      global.UniversalJDParser.setCache(
        cacheKey + '_keywords', 
        result, 
        global.UniversalJDParser.KEYWORD_CACHE
      );
    }
    
    return result;
  }

  /**
   * Match keywords against CV text
   * @param {string} cvText - CV text
   * @param {Array<string>} keywords - Keywords to match
   * @returns {Object} Match result
   */
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
    // Individual extractors
    extractBullets,
    extractSections,
    extractNarrative,
    extractPhrases,
    tfidfFallback
  };

  // Also expose as KeywordExtractor for compatibility
  global.KeywordExtractor = global.KeywordExtractor || {};
  global.KeywordExtractor.extractKeywords = extractReliableKeywords;
  global.KeywordExtractor.matchKeywords = matchKeywords;

})(typeof window !== 'undefined' ? window : global);
