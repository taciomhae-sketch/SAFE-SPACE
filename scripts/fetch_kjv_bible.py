import urllib.request
import json
import os
import re

ot_books = [
    ('Genesis', 'Genesis.json'), ('Exodus', 'Exodus.json'), ('Leviticus', 'Leviticus.json'),
    ('Numbers', 'Numbers.json'), ('Deuteronomy', 'Deuteronomy.json'), ('Joshua', 'Joshua.json'),
    ('Judges', 'Judges.json'), ('Ruth', 'Ruth.json'), ('1 Samuel', '1Samuel.json'),
    ('2 Samuel', '2Samuel.json'), ('1 Kings', '1Kings.json'), ('2 Kings', '2Kings.json'),
    ('1 Chronicles', '1Chronicles.json'), ('2 Chronicles', '2Chronicles.json'), ('Ezra', 'Ezra.json'),
    ('Nehemiah', 'Nehemiah.json'), ('Esther', 'Esther.json'), ('Job', 'Job.json'),
    ('Psalms', 'Psalms.json'), ('Proverbs', 'Proverbs.json'), ('Ecclesiastes', 'Ecclesiastes.json'),
    ('Song of Solomon', 'SongofSolomon.json'), ('Isaiah', 'Isaiah.json'), ('Jeremiah', 'Jeremiah.json'),
    ('Lamentations', 'Lamentations.json'), ('Ezekiel', 'Ezekiel.json'), ('Daniel', 'Daniel.json'),
    ('Hosea', 'Hosea.json'), ('Joel', 'Joel.json'), ('Amos', 'Amos.json'),
    ('Obadiah', 'Obadiah.json'), ('Jonah', 'Jonah.json'), ('Micah', 'Micah.json'),
    ('Nahum', 'Nahum.json'), ('Habakkuk', 'Habakkuk.json'), ('Zephaniah', 'Zephaniah.json'),
    ('Haggai', 'Haggai.json'), ('Zechariah', 'Zechariah.json'), ('Malachi', 'Malachi.json')
]

nt_books = [
    ('Matthew', 'Matthew.json'), ('Mark', 'Mark.json'), ('Luke', 'Luke.json'),
    ('John', 'John.json'), ('Acts', 'Acts.json'), ('Romans', 'Romans.json'),
    ('1 Corinthians', '1Corinthians.json'), ('2 Corinthians', '2Corinthians.json'),
    ('Galatians', 'Galatians.json'), ('Ephesians', 'Ephesians.json'),
    ('Philippians', 'Philippians.json'), ('Colossians', 'Colossians.json'),
    ('1 Thessalonians', '1Thessalonians.json'), ('2 Thessalonians', '2Thessalonians.json'),
    ('1 Timothy', '1Timothy.json'), ('2 Timothy', '2Timothy.json'), ('Titus', 'Titus.json'),
    ('Philemon', 'Philemon.json'), ('Hebrews', 'Hebrews.json'), ('James', 'James.json'),
    ('1 Peter', '1Peter.json'), ('2 Peter', '2Peter.json'), ('1 John', '1John.json'),
    ('2 John', '2John.json'), ('3 John', '3John.json'), ('Jude', 'Jude.json'),
    ('Revelation', 'Revelation.json')
]

categories = [
    "Comfort", "Anxiety", "Stress", "Hope", "Peace",
    "Strength", "Courage", "Faith", "Love", "Forgiveness",
    "Grief", "Loneliness", "Friendship", "Relationships", "Guidance",
    "Wisdom", "Patience", "Gratitude", "Self-Worth", "Encouragement",
    "Fear", "Healing", "Difficult Times", "Protection", "Prayer",
    "Joy", "Kindness", "Perseverance", "Purpose", "Rest"
]

os.makedirs('data/bible', exist_ok=True)
all_books = [(b, f, 'Old Testament') for b, f in ot_books] + [(b, f, 'New Testament') for b, f in nt_books]

manifest = []

print("Downloading and validating all 66 books from KJV repository...")
for name, fname, testament in all_books:
    path = os.path.join('data', 'bible', fname)
    if not os.path.exists(path):
        url = f'https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/{fname}'
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as resp:
                content = resp.read()
                content_str = content.decode('utf-8', errors='replace')
                # Clean up any unicode replacement quotes
                content_str = content_str.replace('\ufffd', "'")
                with open(path, 'w', encoding='utf-8') as out:
                    out.write(content_str)
        except Exception as e:
            print(f"Error downloading {name}: {e}")

    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            try:
                book_data = json.load(f)
                chaps = len(book_data.get('chapters', []))
                manifest.append({
                    'name': name,
                    'file': fname,
                    'testament': testament,
                    'chapters': chaps
                })
            except Exception as e:
                print(f"Error reading {name}: {e}")

print(f"Successfully processed {len(manifest)} of 66 books.")

# Specific categorized passages mapping for student well-being
curated_verse_rules = [
    # Psalms
    ("Psalms", 23, 1, ["Comfort", "Faith", "Peace", "Hope"]),
    ("Psalms", 23, 2, ["Rest", "Peace", "Comfort"]),
    ("Psalms", 23, 3, ["Guidance", "Healing", "Peace"]),
    ("Psalms", 23, 4, ["Comfort", "Courage", "Fear", "Difficult Times"]),
    ("Psalms", 23, 5, ["Gratitude", "Protection", "Joy"]),
    ("Psalms", 23, 6, ["Love", "Hope", "Peace"]),
    ("Psalms", 27, 1, ["Courage", "Fear", "Strength", "Protection"]),
    ("Psalms", 34, 17, ["Prayer", "Difficult Times", "Comfort"]),
    ("Psalms", 34, 18, ["Grief", "Comfort", "Difficult Times", "Hope"]),
    ("Psalms", 37, 4, ["Joy", "Faith", "Hope"]),
    ("Psalms", 37, 5, ["Guidance", "Faith", "Rest"]),
    ("Psalms", 46, 1, ["Strength", "Difficult Times", "Protection", "Comfort"]),
    ("Psalms", 55, 22, ["Stress", "Anxiety", "Comfort", "Rest"]),
    ("Psalms", 62, 1, ["Peace", "Rest", "Faith"]),
    ("Psalms", 62, 2, ["Strength", "Protection", "Faith"]),
    ("Psalms", 91, 1, ["Protection", "Rest", "Peace"]),
    ("Psalms", 91, 2, ["Faith", "Protection", "Courage"]),
    ("Psalms", 91, 4, ["Protection", "Comfort", "Faith"]),
    ("Psalms", 91, 11, ["Protection", "Guidance", "Comfort"]),
    ("Psalms", 103, 1, ["Gratitude", "Joy", "Praise"]),
    ("Psalms", 103, 2, ["Gratitude", "Healing", "Love"]),
    ("Psalms", 103, 3, ["Forgiveness", "Healing", "Love"]),
    ("Psalms", 103, 8, ["Forgiveness", "Love", "Kindness"]),
    ("Psalms", 119, 105, ["Guidance", "Wisdom", "Hope"]),
    ("Psalms", 121, 1, ["Help", "Hope", "Faith"]),
    ("Psalms", 121, 2, ["Strength", "Help", "Protection"]),
    ("Psalms", 139, 14, ["Self-Worth", "Gratitude", "Purpose"]),
    ("Psalms", 147, 3, ["Healing", "Grief", "Comfort"]),
    # Proverbs
    ("Proverbs", 3, 5, ["Faith", "Guidance", "Wisdom", "Trust"]),
    ("Proverbs", 3, 6, ["Guidance", "Wisdom", "Purpose"]),
    ("Proverbs", 4, 23, ["Wisdom", "Self-Worth", "Peace"]),
    ("Proverbs", 16, 3, ["Purpose", "Guidance", "Faith"]),
    ("Proverbs", 16, 9, ["Guidance", "Purpose", "Wisdom"]),
    ("Proverbs", 17, 17, ["Friendship", "Love", "Relationships"]),
    ("Proverbs", 18, 24, ["Friendship", "Relationships", "Loneliness"]),
    # Ecclesiastes
    ("Ecclesiastes", 3, 1, ["Patience", "Difficult Times", "Peace"]),
    ("Ecclesiastes", 4, 9, ["Friendship", "Relationships", "Strength"]),
    ("Ecclesiastes", 4, 10, ["Friendship", "Help", "Loneliness"]),
    # Isaiah
    ("Isaiah", 40, 29, ["Strength", "Encouragement", "Fatigue"]),
    ("Isaiah", 40, 31, ["Strength", "Hope", "Patience", "Perseverance"]),
    ("Isaiah", 41, 10, ["Fear", "Courage", "Strength", "Comfort"]),
    ("Isaiah", 43, 1, ["Fear", "Self-Worth", "Protection"]),
    ("Isaiah", 43, 2, ["Difficult Times", "Protection", "Courage"]),
    ("Isaiah", 53, 5, ["Healing", "Forgiveness", "Love"]),
    ("Isaiah", 54, 10, ["Love", "Peace", "Comfort"]),
    # Jeremiah & Lamentations
    ("Jeremiah", 29, 11, ["Hope", "Purpose", "Peace", "Encouragement"]),
    ("Jeremiah", 33, 3, ["Prayer", "Guidance", "Wisdom"]),
    ("Lamentations", 3, 22, ["Love", "Hope", "Kindness"]),
    ("Lamentations", 3, 23, ["Gratitude", "Faith", "Hope"]),
    ("Lamentations", 3, 24, ["Hope", "Patience", "Faith"]),
    # Joshua & Micah & Zephaniah
    ("Joshua", 1, 9, ["Courage", "Fear", "Strength", "Encouragement"]),
    ("Micah", 6, 8, ["Wisdom", "Kindness", "Purpose"]),
    ("Zephaniah", 3, 17, ["Love", "Joy", "Peace", "Comfort"]),
    # Matthew
    ("Matthew", 5, 3, ["Comfort", "Faith", "Hope"]),
    ("Matthew", 5, 4, ["Grief", "Comfort", "Healing"]),
    ("Matthew", 5, 7, ["Kindness", "Forgiveness", "Love"]),
    ("Matthew", 5, 9, ["Peace", "Kindness", "Relationships"]),
    ("Matthew", 6, 25, ["Anxiety", "Stress", "Faith", "Rest"]),
    ("Matthew", 6, 26, ["Self-Worth", "Anxiety", "Faith"]),
    ("Matthew", 6, 33, ["Purpose", "Guidance", "Faith"]),
    ("Matthew", 6, 34, ["Anxiety", "Stress", "Peace", "Rest"]),
    ("Matthew", 7, 7, ["Prayer", "Guidance", "Faith"]),
    ("Matthew", 11, 28, ["Rest", "Stress", "Weariness", "Comfort"]),
    ("Matthew", 11, 29, ["Rest", "Peace", "Patience"]),
    ("Matthew", 11, 30, ["Rest", "Peace", "Comfort"]),
    ("Matthew", 28, 20, ["Loneliness", "Comfort", "Faith", "Protection"]),
    # Mark & Luke
    ("Mark", 11, 24, ["Prayer", "Faith", "Hope"]),
    ("Luke", 6, 31, ["Kindness", "Relationships", "Love"]),
    ("Luke", 6, 37, ["Forgiveness", "Kindness", "Love"]),
    ("Luke", 12, 6, ["Self-Worth", "Faith", "Comfort"]),
    ("Luke", 12, 7, ["Self-Worth", "Love", "Comfort"]),
    # John
    ("John", 3, 16, ["Love", "Faith", "Hope", "Self-Worth"]),
    ("John", 14, 1, ["Peace", "Comfort", "Faith", "Heart"]),
    ("John", 14, 27, ["Peace", "Fear", "Comfort", "Anxiety"]),
    ("John", 15, 12, ["Love", "Friendship", "Relationships"]),
    ("John", 15, 13, ["Friendship", "Love", "Relationships"]),
    ("John", 16, 33, ["Peace", "Courage", "Difficult Times", "Hope"]),
    # Romans
    ("Romans", 8, 28, ["Hope", "Faith", "Purpose", "Difficult Times"]),
    ("Romans", 8, 31, ["Courage", "Strength", "Faith"]),
    ("Romans", 8, 38, ["Love", "Security", "Faith"]),
    ("Romans", 8, 39, ["Love", "Comfort", "Hope", "Self-Worth"]),
    ("Romans", 12, 2, ["Wisdom", "Guidance", "Growth"]),
    ("Romans", 12, 10, ["Kindness", "Love", "Relationships"]),
    ("Romans", 12, 12, ["Hope", "Patience", "Prayer", "Joy"]),
    ("Romans", 12, 18, ["Peace", "Relationships", "Kindness"]),
    ("Romans", 15, 13, ["Hope", "Joy", "Peace", "Faith"]),
    # 1 Corinthians & 2 Corinthians
    ("1 Corinthians", 10, 13, ["Difficult Times", "Perseverance", "Faith"]),
    ("1 Corinthians", 13, 4, ["Love", "Patience", "Kindness"]),
    ("1 Corinthians", 13, 5, ["Love", "Patience", "Forgiveness"]),
    ("1 Corinthians", 13, 6, ["Love", "Joy", "Truth"]),
    ("1 Corinthians", 13, 7, ["Love", "Hope", "Perseverance", "Patience"]),
    ("1 Corinthians", 13, 13, ["Faith", "Hope", "Love"]),
    ("1 Corinthians", 16, 14, ["Love", "Kindness", "Relationships"]),
    ("2 Corinthians", 1, 3, ["Comfort", "Mercy", "Grief"]),
    ("2 Corinthians", 1, 4, ["Comfort", "Kindness", "Difficult Times"]),
    ("2 Corinthians", 4, 8, ["Strength", "Difficult Times", "Perseverance"]),
    ("2 Corinthians", 4, 9, ["Difficult Times", "Perseverance", "Hope"]),
    ("2 Corinthians", 4, 16, ["Perseverance", "Strength", "Growth"]),
    ("2 Corinthians", 5, 7, ["Faith", "Courage", "Guidance"]),
    ("2 Corinthians", 12, 9, ["Strength", "Grace", "Difficult Times", "Weakness"]),
    # Galatians & Ephesians
    ("Galatians", 5, 22, ["Joy", "Peace", "Patience", "Kindness", "Faith"]),
    ("Galatians", 5, 23, ["Self-Worth", "Peace", "Patience"]),
    ("Galatians", 6, 9, ["Perseverance", "Encouragement", "Patience"]),
    ("Ephesians", 2, 10, ["Purpose", "Self-Worth", "Faith"]),
    ("Ephesians", 4, 2, ["Patience", "Love", "Relationships"]),
    ("Ephesians", 4, 32, ["Forgiveness", "Kindness", "Love"]),
    ("Ephesians", 6, 10, ["Strength", "Courage", "Faith"]),
    # Philippians & Colossians
    ("Philippians", 4, 6, ["Anxiety", "Stress", "Prayer", "Peace"]),
    ("Philippians", 4, 7, ["Peace", "Anxiety", "Stress", "Comfort"]),
    ("Philippians", 4, 8, ["Peace", "Wisdom", "Mindfulness"]),
    ("Philippians", 4, 13, ["Strength", "Encouragement", "Faith", "Perseverance"]),
    ("Philippians", 4, 19, ["Protection", "Faith", "Comfort"]),
    ("Colossians", 3, 12, ["Kindness", "Forgiveness", "Patience", "Love"]),
    ("Colossians", 3, 13, ["Forgiveness", "Patience", "Relationships"]),
    ("Colossians", 3, 14, ["Love", "Relationships", "Peace"]),
    ("Colossians", 3, 15, ["Peace", "Gratitude", "Heart"]),
    # Thessalonians & Timothy
    ("1 Thessalonians", 5, 11, ["Encouragement", "Friendship", "Kindness"]),
    ("1 Thessalonians", 5, 16, ["Joy", "Gratitude", "Hope"]),
    ("1 Thessalonians", 5, 17, ["Prayer", "Faith", "Guidance"]),
    ("1 Thessalonians", 5, 18, ["Gratitude", "Joy", "Faith"]),
    ("2 Thessalonians", 3, 3, ["Protection", "Faith", "Strength"]),
    ("2 Thessalonians", 3, 16, ["Peace", "Comfort", "Rest"]),
    ("1 Timothy", 4, 12, ["Self-Worth", "Courage", "Purpose"]),
    ("2 Timothy", 1, 7, ["Fear", "Courage", "Strength", "Peace"]),
    # Hebrews & James
    ("Hebrews", 4, 16, ["Prayer", "Grace", "Comfort", "Help"]),
    ("Hebrews", 10, 24, ["Encouragement", "Friendship", "Love"]),
    ("Hebrews", 11, 1, ["Faith", "Hope", "Courage"]),
    ("Hebrews", 12, 1, ["Perseverance", "Encouragement", "Faith"]),
    ("Hebrews", 13, 5, ["Loneliness", "Comfort", "Faith"]),
    ("James", 1, 2, ["Joy", "Difficult Times", "Growth"]),
    ("James", 1, 3, ["Patience", "Perseverance", "Growth"]),
    ("James", 1, 5, ["Wisdom", "Guidance", "Prayer"]),
    ("James", 1, 19, ["Patience", "Wisdom", "Relationships"]),
    ("James", 5, 16, ["Prayer", "Healing", "Relationships"]),
    # Peter & John & Revelation
    ("1 Peter", 5, 7, ["Anxiety", "Stress", "Comfort", "Care"]),
    ("1 Peter", 5, 10, ["Strength", "Healing", "Hope", "Perseverance"]),
    ("1 John", 3, 1, ["Love", "Self-Worth", "Faith"]),
    ("1 John", 3, 18, ["Love", "Kindness", "Relationships"]),
    ("1 John", 4, 7, ["Love", "Friendship", "Relationships"]),
    ("1 John", 4, 18, ["Fear", "Love", "Peace", "Courage"]),
    ("1 John", 4, 19, ["Love", "Gratitude", "Self-Worth"]),
    ("Revelation", 21, 4, ["Grief", "Comfort", "Healing", "Hope"])
]

# Load verses from the JSON files
curated_verses = []
verse_id_counter = 1

book_json_cache = {}

for book_name, chap_num, verse_num, cats in curated_verse_rules:
    # Find filename from manifest
    m = next((item for item in manifest if item['name'] == book_name), None)
    if not m:
        continue
    
    fname = m['file']
    if fname not in book_json_cache:
        path = os.path.join('data', 'bible', fname)
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                book_json_cache[fname] = json.load(f)
        else:
            continue

    bdata = book_json_cache[fname]
    chapters = bdata.get('chapters', [])
    chap_obj = next((c for c in chapters if str(c.get('chapter')) == str(chap_num)), None)
    if not chap_obj:
        continue
    
    v_obj = next((v for v in chap_obj.get('verses', []) if str(v.get('verse')) == str(verse_num)), None)
    if not v_obj:
        continue
    
    text = v_obj.get('text', '').strip()
    text = text.replace('\ufffd', "'")

    ref_str = f"{book_name} {chap_num}:{verse_num}"
    if book_name == "Psalms":
        ref_str = f"Psalm {chap_num}:{verse_num}"

    curated_verses.append({
        'id': f"kjv-{verse_id_counter}",
        'book': book_name,
        'testament': m['testament'],
        'chapter': int(chap_num),
        'verse': int(verse_num),
        'text': text,
        'reference': ref_str,
        'category': cats,
        'translation': 'KJV'
    })
    verse_id_counter += 1

print(f"Generated {len(curated_verses)} curated student wellbeing verses.")

# Write manifest to data/bible/manifest.json
with open('data/bible/manifest.json', 'w', encoding='utf-8') as mf:
    json.dump(manifest, mf, indent=2)

# Write js/bible-data.js
js_content = f"""/**
 * Safe Space - KJV Bible Verse Data & Service
 * Public Domain King James Version (KJV)
 * Supports all 66 Books (39 Old Testament, 27 New Testament)
 * Multi-category student wellbeing tagging system
 */

(function(window) {{
  'use strict';

  var BIBLE_BOOKS = {json.dumps(manifest, indent=2)};

  var BIBLE_CATEGORIES = {json.dumps(categories, indent=2)};

  var CURATED_VERSES = {json.dumps(curated_verses, indent=2)};

  // Map book short names / aliases
  var BOOK_ALIAS_MAP = {{
    'psalm': 'Psalms',
    'psalms': 'Psalms',
    'proverb': 'Proverbs',
    'proverbs': 'Proverbs',
    'matt': 'Matthew',
    'phil': 'Philippians',
    'cor': '1 Corinthians',
    '1cor': '1 Corinthians',
    '2cor': '2 Corinthians',
    'rom': 'Romans',
    'isa': 'Isaiah',
    'jer': 'Jeremiah',
    'gen': 'Genesis',
    'rev': 'Revelation'
  }};

  var BibleService = {{
    translation: 'King James Version (KJV)',
    books: BIBLE_BOOKS,
    categories: BIBLE_CATEGORIES,
    curatedVerses: CURATED_VERSES,

    // Cache of loaded chapter data
    _loadedChapters: {{}},

    getAllBooks: function() {{
      return BIBLE_BOOKS;
    }},

    getOldTestamentBooks: function() {{
      return BIBLE_BOOKS.filter(function(b) {{ return b.testament === 'Old Testament'; }});
    }},

    getNewTestamentBooks: function() {{
      return BIBLE_BOOKS.filter(function(b) {{ return b.testament === 'New Testament'; }});
    }},

    getBookMetadata: function(bookName) {{
      if (!bookName) return null;
      var clean = bookName.trim().toLowerCase();
      if (BOOK_ALIAS_MAP[clean]) clean = BOOK_ALIAS_MAP[clean].toLowerCase();
      return BIBLE_BOOKS.find(function(b) {{
        return b.name.toLowerCase() === clean;
      }}) || null;
    }},

    getCategories: function() {{
      return BIBLE_CATEGORIES;
    }},

    /**
     * Load verses for a specific book & chapter
     */
    getChapterVerses: async function(bookName, chapterNum) {{
      var meta = this.getBookMetadata(bookName);
      if (!meta) return [];

      var cacheKey = meta.name + '_' + chapterNum;
      if (this._loadedChapters[cacheKey]) {{
        return this._loadedChapters[cacheKey];
      }}

      try {{
        var resp = await fetch('data/bible/' + meta.file);
        if (!resp.ok) throw new Error('Could not load book file');
        var data = await resp.json();
        var chap = (data.chapters || []).find(function(c) {{
          return String(c.chapter) === String(chapterNum);
        }});
        if (!chap) return [];

        var verses = (chap.verses || []).map(function(v) {{
          var vNum = parseInt(v.verse, 10);
          var cleanText = (v.text || '').replace(/[\\uFFFD]/g, "'");
          var ref = (meta.name === 'Psalms' ? 'Psalm' : meta.name) + ' ' + chapterNum + ':' + vNum;

          // Find if this verse has categories in curated list
          var curated = CURATED_VERSES.find(function(cv) {{
            return cv.book === meta.name && cv.chapter === parseInt(chapterNum, 10) && cv.verse === vNum;
          }});

          return {{
            id: 'kjv-' + meta.name.toLowerCase().replace(/\\s+/g, '') + '-' + chapterNum + '-' + vNum,
            book: meta.name,
            testament: meta.testament,
            chapter: parseInt(chapterNum, 10),
            verse: vNum,
            text: cleanText,
            reference: ref,
            category: curated ? curated.category : ['Scripture'],
            translation: 'KJV'
          }};
        }});

        this._loadedChapters[cacheKey] = verses;
        return verses;
      }} catch (err) {{
        console.warn('[SafeSpace Bible] Error fetching chapter:', err);
        // Fallback to any matching curated verses
        return CURATED_VERSES.filter(function(cv) {{
          return cv.book.toLowerCase() === meta.name.toLowerCase() && cv.chapter === parseInt(chapterNum, 10);
        }});
      }}
    }},

    /**
     * Filter & search verses
     */
    queryVerses: async function(options) {{
      options = options || {{}};
      var category = options.category || 'all';
      var book = options.book || 'all';
      var chapter = options.chapter ? parseInt(options.chapter, 10) : null;
      var search = (options.search || '').trim().toLowerCase();
      var onlySaved = Boolean(options.onlySaved);
      var savedIds = options.savedIds || [];
      var page = options.page || 1;
      var limit = options.limit || 20;

      var dataset = [];

      // If specific book AND chapter are chosen, load full chapter
      if (book !== 'all' && chapter) {{
        dataset = await this.getChapterVerses(book, chapter);
      }} else {{
        // Use curated dataset
        dataset = CURATED_VERSES.slice();
      }}

      // Filter by saved
      if (onlySaved) {{
        dataset = dataset.filter(function(v) {{
          return savedIds.includes(v.id) || savedIds.includes(v.reference);
        }});
      }}

      // Filter by book
      if (book && book !== 'all') {{
        var targetBookMeta = this.getBookMetadata(book);
        var targetBookName = targetBookMeta ? targetBookMeta.name.toLowerCase() : book.toLowerCase();
        dataset = dataset.filter(function(v) {{
          return v.book.toLowerCase() === targetBookName;
        }});
      }}

      // Filter by chapter (if not already loaded exclusively)
      if (chapter && !isNaN(chapter)) {{
        dataset = dataset.filter(function(v) {{
          return v.chapter === chapter;
        }});
      }}

      // Filter by category
      if (category && category !== 'all' && category !== 'saved') {{
        var catLower = category.toLowerCase();
        dataset = dataset.filter(function(v) {{
          return (v.category || []).some(function(c) {{
            return c.toLowerCase() === catLower || c.toLowerCase().includes(catLower);
          }});
        }});
      }}

      // Filter by search query (text, book, chapter, verse, reference, category)
      if (search) {{
        // Check for reference pattern like "Psalm 23" or "John 3:16"
        var refMatch = search.match(/^([1-3]?\\s*[a-zA-Z]+)\\s*(\\d+)(?::(\\d+))?$/);
        if (refMatch) {{
          var sBook = refMatch[1].trim().toLowerCase();
          var sChap = parseInt(refMatch[2], 10);
          var sVerse = refMatch[3] ? parseInt(refMatch[3], 10) : null;
          var matchedMeta = this.getBookMetadata(sBook);

          if (matchedMeta) {{
            // If specific reference like John 3:16 or Psalm 23, dynamically load chapter if not loaded
            if (dataset.length === 0 || !dataset.some(function(v) {{ return v.book.toLowerCase() === matchedMeta.name.toLowerCase() && v.chapter === sChap; }})) {{
              var chapVerses = await this.getChapterVerses(matchedMeta.name, sChap);
              if (chapVerses && chapVerses.length > 0) {{
                dataset = chapVerses;
              }}
            }}
          }}
        }}

        dataset = dataset.filter(function(v) {{
          var matchText = (v.text || '').toLowerCase().includes(search);
          var matchBook = (v.book || '').toLowerCase().includes(search);
          var matchRef = (v.reference || '').toLowerCase().includes(search);
          var matchChap = String(v.chapter) === search;
          var matchVerse = String(v.verse) === search;
          var matchCat = (v.category || []).some(function(c) {{
            return c.toLowerCase().includes(search);
          }});
          return matchText || matchBook || matchRef || matchChap || matchVerse || matchCat;
        }});
      }}

      var total = dataset.length;
      var totalPages = Math.ceil(total / limit) || 1;
      var safePage = Math.max(1, Math.min(page, totalPages));
      var start = (safePage - 1) * limit;
      var end = start + limit;
      var pagedItems = dataset.slice(start, end);

      return {{
        items: pagedItems,
        total: total,
        page: safePage,
        totalPages: totalPages,
        limit: limit
      }};
    }},

    /**
     * Deterministic daily scripture selection
     * Changes once per calendar day at midnight.
     * Never uses Math.random() on page loads.
     */
    getDailyScripture: function(targetDate) {{
      var dateObj = targetDate instanceof Date ? targetDate : new Date();
      var year = dateObj.getFullYear();
      var month = dateObj.getMonth();
      var day = dateObj.getDate();

      // Priority wellbeing verses
      var priorityVerses = CURATED_VERSES.filter(function(v) {{
        var cats = (v.category || []).map(function(c) {{ return c.toLowerCase(); }});
        return cats.includes('comfort') ||
               cats.includes('hope') ||
               cats.includes('peace') ||
               cats.includes('strength') ||
               cats.includes('encouragement') ||
               cats.includes('faith') ||
               cats.includes('anxiety') ||
               cats.includes('stress') ||
               cats.includes('difficult times');
      }});

      var pool = priorityVerses.length > 0 ? priorityVerses : CURATED_VERSES;
      if (!pool || pool.length === 0) {{
        return {{
          id: 'kjv-fallback',
          book: '1 Peter',
          testament: 'New Testament',
          chapter: 5,
          verse: 7,
          text: 'Casting all your care upon him; for he careth for you.',
          reference: '1 Peter 5:7',
          category: ['Comfort', 'Peace', 'Anxiety'],
          translation: 'KJV'
        }};
      }}

      // Epoch day index calculation (Days since Jan 1, 2024 UTC)
      var utcTime = Date.UTC(year, month, day);
      var baseTime = Date.UTC(2024, 0, 1);
      var dayNumber = Math.floor((utcTime - baseTime) / 86400000);
      if (isNaN(dayNumber)) dayNumber = 0;

      var index = Math.abs(dayNumber) % pool.length;
      return pool[index];
    }}
  }};

  window.SafeSpaceBible = BibleService;
}})(typeof window !== 'undefined' ? window : this);
"""

with open('js/bible-data.js', 'w', encoding='utf-8') as out:
    out.write(js_content)

print("Generated js/bible-data.js successfully!")
