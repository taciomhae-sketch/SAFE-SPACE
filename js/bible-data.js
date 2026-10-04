/**
 * Safe Space - KJV Bible Verse Data & Service
 * Public Domain King James Version (KJV)
 * Supports all 66 Books (39 Old Testament, 27 New Testament)
 * Multi-category student wellbeing tagging system
 */

(function(window) {
  'use strict';

  var BIBLE_BOOKS = [
  {
    "name": "Genesis",
    "file": "Genesis.json",
    "testament": "Old Testament",
    "chapters": 50
  },
  {
    "name": "Exodus",
    "file": "Exodus.json",
    "testament": "Old Testament",
    "chapters": 40
  },
  {
    "name": "Leviticus",
    "file": "Leviticus.json",
    "testament": "Old Testament",
    "chapters": 27
  },
  {
    "name": "Numbers",
    "file": "Numbers.json",
    "testament": "Old Testament",
    "chapters": 36
  },
  {
    "name": "Deuteronomy",
    "file": "Deuteronomy.json",
    "testament": "Old Testament",
    "chapters": 34
  },
  {
    "name": "Joshua",
    "file": "Joshua.json",
    "testament": "Old Testament",
    "chapters": 24
  },
  {
    "name": "Judges",
    "file": "Judges.json",
    "testament": "Old Testament",
    "chapters": 21
  },
  {
    "name": "Ruth",
    "file": "Ruth.json",
    "testament": "Old Testament",
    "chapters": 4
  },
  {
    "name": "1 Samuel",
    "file": "1Samuel.json",
    "testament": "Old Testament",
    "chapters": 31
  },
  {
    "name": "2 Samuel",
    "file": "2Samuel.json",
    "testament": "Old Testament",
    "chapters": 24
  },
  {
    "name": "1 Kings",
    "file": "1Kings.json",
    "testament": "Old Testament",
    "chapters": 22
  },
  {
    "name": "2 Kings",
    "file": "2Kings.json",
    "testament": "Old Testament",
    "chapters": 25
  },
  {
    "name": "1 Chronicles",
    "file": "1Chronicles.json",
    "testament": "Old Testament",
    "chapters": 29
  },
  {
    "name": "2 Chronicles",
    "file": "2Chronicles.json",
    "testament": "Old Testament",
    "chapters": 36
  },
  {
    "name": "Ezra",
    "file": "Ezra.json",
    "testament": "Old Testament",
    "chapters": 10
  },
  {
    "name": "Nehemiah",
    "file": "Nehemiah.json",
    "testament": "Old Testament",
    "chapters": 13
  },
  {
    "name": "Esther",
    "file": "Esther.json",
    "testament": "Old Testament",
    "chapters": 10
  },
  {
    "name": "Job",
    "file": "Job.json",
    "testament": "Old Testament",
    "chapters": 42
  },
  {
    "name": "Psalms",
    "file": "Psalms.json",
    "testament": "Old Testament",
    "chapters": 150
  },
  {
    "name": "Proverbs",
    "file": "Proverbs.json",
    "testament": "Old Testament",
    "chapters": 31
  },
  {
    "name": "Ecclesiastes",
    "file": "Ecclesiastes.json",
    "testament": "Old Testament",
    "chapters": 12
  },
  {
    "name": "Song of Solomon",
    "file": "SongofSolomon.json",
    "testament": "Old Testament",
    "chapters": 8
  },
  {
    "name": "Isaiah",
    "file": "Isaiah.json",
    "testament": "Old Testament",
    "chapters": 66
  },
  {
    "name": "Jeremiah",
    "file": "Jeremiah.json",
    "testament": "Old Testament",
    "chapters": 52
  },
  {
    "name": "Lamentations",
    "file": "Lamentations.json",
    "testament": "Old Testament",
    "chapters": 5
  },
  {
    "name": "Ezekiel",
    "file": "Ezekiel.json",
    "testament": "Old Testament",
    "chapters": 48
  },
  {
    "name": "Daniel",
    "file": "Daniel.json",
    "testament": "Old Testament",
    "chapters": 12
  },
  {
    "name": "Hosea",
    "file": "Hosea.json",
    "testament": "Old Testament",
    "chapters": 14
  },
  {
    "name": "Joel",
    "file": "Joel.json",
    "testament": "Old Testament",
    "chapters": 3
  },
  {
    "name": "Amos",
    "file": "Amos.json",
    "testament": "Old Testament",
    "chapters": 9
  },
  {
    "name": "Obadiah",
    "file": "Obadiah.json",
    "testament": "Old Testament",
    "chapters": 1
  },
  {
    "name": "Jonah",
    "file": "Jonah.json",
    "testament": "Old Testament",
    "chapters": 4
  },
  {
    "name": "Micah",
    "file": "Micah.json",
    "testament": "Old Testament",
    "chapters": 7
  },
  {
    "name": "Nahum",
    "file": "Nahum.json",
    "testament": "Old Testament",
    "chapters": 3
  },
  {
    "name": "Habakkuk",
    "file": "Habakkuk.json",
    "testament": "Old Testament",
    "chapters": 3
  },
  {
    "name": "Zephaniah",
    "file": "Zephaniah.json",
    "testament": "Old Testament",
    "chapters": 3
  },
  {
    "name": "Haggai",
    "file": "Haggai.json",
    "testament": "Old Testament",
    "chapters": 2
  },
  {
    "name": "Zechariah",
    "file": "Zechariah.json",
    "testament": "Old Testament",
    "chapters": 14
  },
  {
    "name": "Malachi",
    "file": "Malachi.json",
    "testament": "Old Testament",
    "chapters": 4
  },
  {
    "name": "Matthew",
    "file": "Matthew.json",
    "testament": "New Testament",
    "chapters": 28
  },
  {
    "name": "Mark",
    "file": "Mark.json",
    "testament": "New Testament",
    "chapters": 16
  },
  {
    "name": "Luke",
    "file": "Luke.json",
    "testament": "New Testament",
    "chapters": 24
  },
  {
    "name": "John",
    "file": "John.json",
    "testament": "New Testament",
    "chapters": 21
  },
  {
    "name": "Acts",
    "file": "Acts.json",
    "testament": "New Testament",
    "chapters": 28
  },
  {
    "name": "Romans",
    "file": "Romans.json",
    "testament": "New Testament",
    "chapters": 16
  },
  {
    "name": "1 Corinthians",
    "file": "1Corinthians.json",
    "testament": "New Testament",
    "chapters": 16
  },
  {
    "name": "2 Corinthians",
    "file": "2Corinthians.json",
    "testament": "New Testament",
    "chapters": 13
  },
  {
    "name": "Galatians",
    "file": "Galatians.json",
    "testament": "New Testament",
    "chapters": 6
  },
  {
    "name": "Ephesians",
    "file": "Ephesians.json",
    "testament": "New Testament",
    "chapters": 6
  },
  {
    "name": "Philippians",
    "file": "Philippians.json",
    "testament": "New Testament",
    "chapters": 4
  },
  {
    "name": "Colossians",
    "file": "Colossians.json",
    "testament": "New Testament",
    "chapters": 4
  },
  {
    "name": "1 Thessalonians",
    "file": "1Thessalonians.json",
    "testament": "New Testament",
    "chapters": 5
  },
  {
    "name": "2 Thessalonians",
    "file": "2Thessalonians.json",
    "testament": "New Testament",
    "chapters": 3
  },
  {
    "name": "1 Timothy",
    "file": "1Timothy.json",
    "testament": "New Testament",
    "chapters": 6
  },
  {
    "name": "2 Timothy",
    "file": "2Timothy.json",
    "testament": "New Testament",
    "chapters": 4
  },
  {
    "name": "Titus",
    "file": "Titus.json",
    "testament": "New Testament",
    "chapters": 3
  },
  {
    "name": "Philemon",
    "file": "Philemon.json",
    "testament": "New Testament",
    "chapters": 1
  },
  {
    "name": "Hebrews",
    "file": "Hebrews.json",
    "testament": "New Testament",
    "chapters": 13
  },
  {
    "name": "James",
    "file": "James.json",
    "testament": "New Testament",
    "chapters": 5
  },
  {
    "name": "1 Peter",
    "file": "1Peter.json",
    "testament": "New Testament",
    "chapters": 5
  },
  {
    "name": "2 Peter",
    "file": "2Peter.json",
    "testament": "New Testament",
    "chapters": 3
  },
  {
    "name": "1 John",
    "file": "1John.json",
    "testament": "New Testament",
    "chapters": 5
  },
  {
    "name": "2 John",
    "file": "2John.json",
    "testament": "New Testament",
    "chapters": 1
  },
  {
    "name": "3 John",
    "file": "3John.json",
    "testament": "New Testament",
    "chapters": 1
  },
  {
    "name": "Jude",
    "file": "Jude.json",
    "testament": "New Testament",
    "chapters": 1
  },
  {
    "name": "Revelation",
    "file": "Revelation.json",
    "testament": "New Testament",
    "chapters": 22
  }
];

  var BIBLE_CATEGORIES = [
  "Hope",
  "Strength",
  "Peace",
  "Anxiety",
  "Sadness",
  "Guidance",
  "Encouragement",
  "Love",
  "Faith",
  "Patience",
  "Forgiveness",
  "Comfort",
  "Stress",
  "Courage",
  "Grief",
  "Loneliness",
  "Friendship",
  "Relationships",
  "Guidance",
  "Wisdom",
  "Patience",
  "Gratitude",
  "Self-Worth",
  "Encouragement",
  "Fear",
  "Healing",
  "Difficult Times",
  "Protection",
  "Prayer",
  "Joy",
  "Kindness",
  "Perseverance",
  "Purpose",
  "Rest"
];

  var CURATED_VERSES = [
  {
    "id": "kjv-1",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 23,
    "verse": 1,
    "text": "The LORD is my shepherd; I shall not want.",
    "reference": "Psalm 23:1",
    "category": [
      "Comfort",
      "Faith",
      "Peace",
      "Hope"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-2",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 23,
    "verse": 2,
    "text": "He maketh me to lie down in green pastures: he leadeth me beside the still waters.",
    "reference": "Psalm 23:2",
    "category": [
      "Rest",
      "Peace",
      "Comfort"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-3",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 23,
    "verse": 3,
    "text": "He restoreth my soul: he leadeth me in the paths of righteousness for his name\u2019s sake.",
    "reference": "Psalm 23:3",
    "category": [
      "Guidance",
      "Healing",
      "Peace"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-4",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 23,
    "verse": 4,
    "text": "Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.",
    "reference": "Psalm 23:4",
    "category": [
      "Comfort",
      "Courage",
      "Fear",
      "Difficult Times"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-5",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 23,
    "verse": 5,
    "text": "Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.",
    "reference": "Psalm 23:5",
    "category": [
      "Gratitude",
      "Protection",
      "Joy"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-6",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 23,
    "verse": 6,
    "text": "Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.",
    "reference": "Psalm 23:6",
    "category": [
      "Love",
      "Hope",
      "Peace"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-7",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 27,
    "verse": 1,
    "text": "The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?",
    "reference": "Psalm 27:1",
    "category": [
      "Courage",
      "Fear",
      "Strength",
      "Protection"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-8",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 34,
    "verse": 17,
    "text": "The righteous cry, and the LORD heareth, and delivereth them out of all their troubles.",
    "reference": "Psalm 34:17",
    "category": [
      "Prayer",
      "Difficult Times",
      "Comfort"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-9",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 34,
    "verse": 18,
    "text": "The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.",
    "reference": "Psalm 34:18",
    "category": [
      "Grief",
      "Comfort",
      "Difficult Times",
      "Hope"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-10",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 37,
    "verse": 4,
    "text": "Delight thyself also in the LORD: and he shall give thee the desires of thine heart.",
    "reference": "Psalm 37:4",
    "category": [
      "Joy",
      "Faith",
      "Hope"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-11",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 37,
    "verse": 5,
    "text": "Commit thy way unto the LORD; trust also in him; and he shall bring it to pass.",
    "reference": "Psalm 37:5",
    "category": [
      "Guidance",
      "Faith",
      "Rest"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-12",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 46,
    "verse": 1,
    "text": "God is our refuge and strength, a very present help in trouble.",
    "reference": "Psalm 46:1",
    "category": [
      "Strength",
      "Difficult Times",
      "Protection",
      "Comfort"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-13",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 55,
    "verse": 22,
    "text": "Cast thy burden upon the LORD, and he shall sustain thee: he shall never suffer the righteous to be moved.",
    "reference": "Psalm 55:22",
    "category": [
      "Stress",
      "Anxiety",
      "Comfort",
      "Rest"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-14",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 62,
    "verse": 1,
    "text": "Truly my soul waiteth upon God: from him cometh my salvation.",
    "reference": "Psalm 62:1",
    "category": [
      "Peace",
      "Rest",
      "Faith"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-15",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 62,
    "verse": 2,
    "text": "He only is my rock and my salvation; he is my defence; I shall not be greatly moved.",
    "reference": "Psalm 62:2",
    "category": [
      "Strength",
      "Protection",
      "Faith"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-16",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 91,
    "verse": 1,
    "text": "He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.",
    "reference": "Psalm 91:1",
    "category": [
      "Protection",
      "Rest",
      "Peace"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-17",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 91,
    "verse": 2,
    "text": "I will say of the LORD, He is my refuge and my fortress: my God; in him will I trust.",
    "reference": "Psalm 91:2",
    "category": [
      "Faith",
      "Protection",
      "Courage"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-18",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 91,
    "verse": 4,
    "text": "He shall cover thee with his feathers, and under his wings shalt thou trust: his truth shall be thy shield and buckler.",
    "reference": "Psalm 91:4",
    "category": [
      "Protection",
      "Comfort",
      "Faith"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-19",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 91,
    "verse": 11,
    "text": "For he shall give his angels charge over thee, to keep thee in all thy ways.",
    "reference": "Psalm 91:11",
    "category": [
      "Protection",
      "Guidance",
      "Comfort"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-20",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 103,
    "verse": 1,
    "text": "Bless the LORD, O my soul: and all that is within me, bless his holy name.",
    "reference": "Psalm 103:1",
    "category": [
      "Gratitude",
      "Joy",
      "Praise"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-21",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 103,
    "verse": 2,
    "text": "Bless the LORD, O my soul, and forget not all his benefits:",
    "reference": "Psalm 103:2",
    "category": [
      "Gratitude",
      "Healing",
      "Love"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-22",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 103,
    "verse": 3,
    "text": "Who forgiveth all thine iniquities; who healeth all thy diseases;",
    "reference": "Psalm 103:3",
    "category": [
      "Forgiveness",
      "Healing",
      "Love"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-23",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 103,
    "verse": 8,
    "text": "The LORD is merciful and gracious, slow to anger, and plenteous in mercy.",
    "reference": "Psalm 103:8",
    "category": [
      "Forgiveness",
      "Love",
      "Kindness"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-24",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 119,
    "verse": 105,
    "text": "Thy word is a lamp unto my feet, and a light unto my path.",
    "reference": "Psalm 119:105",
    "category": [
      "Guidance",
      "Wisdom",
      "Hope"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-25",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 121,
    "verse": 1,
    "text": "I will lift up mine eyes unto the hills, from whence cometh my help.",
    "reference": "Psalm 121:1",
    "category": [
      "Help",
      "Hope",
      "Faith"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-26",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 121,
    "verse": 2,
    "text": "My help cometh from the LORD, which made heaven and earth.",
    "reference": "Psalm 121:2",
    "category": [
      "Strength",
      "Help",
      "Protection"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-27",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 139,
    "verse": 14,
    "text": "I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well.",
    "reference": "Psalm 139:14",
    "category": [
      "Self-Worth",
      "Gratitude",
      "Purpose"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-28",
    "book": "Psalms",
    "testament": "Old Testament",
    "chapter": 147,
    "verse": 3,
    "text": "He healeth the broken in heart, and bindeth up their wounds.",
    "reference": "Psalm 147:3",
    "category": [
      "Healing",
      "Grief",
      "Comfort"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-29",
    "book": "Proverbs",
    "testament": "Old Testament",
    "chapter": 3,
    "verse": 5,
    "text": "Trust in the LORD with all thine heart; and lean not unto thine own understanding.",
    "reference": "Proverbs 3:5",
    "category": [
      "Faith",
      "Guidance",
      "Wisdom",
      "Trust"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-30",
    "book": "Proverbs",
    "testament": "Old Testament",
    "chapter": 3,
    "verse": 6,
    "text": "In all thy ways acknowledge him, and he shall direct thy paths.",
    "reference": "Proverbs 3:6",
    "category": [
      "Guidance",
      "Wisdom",
      "Purpose"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-31",
    "book": "Proverbs",
    "testament": "Old Testament",
    "chapter": 4,
    "verse": 23,
    "text": "Keep thy heart with all diligence; for out of it are the issues of life.",
    "reference": "Proverbs 4:23",
    "category": [
      "Wisdom",
      "Self-Worth",
      "Peace"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-32",
    "book": "Proverbs",
    "testament": "Old Testament",
    "chapter": 16,
    "verse": 3,
    "text": "Commit thy works unto the LORD, and thy thoughts shall be established.",
    "reference": "Proverbs 16:3",
    "category": [
      "Purpose",
      "Guidance",
      "Faith"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-33",
    "book": "Proverbs",
    "testament": "Old Testament",
    "chapter": 16,
    "verse": 9,
    "text": "A man\u2019s heart deviseth his way: but the LORD directeth his steps.",
    "reference": "Proverbs 16:9",
    "category": [
      "Guidance",
      "Purpose",
      "Wisdom"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-34",
    "book": "Proverbs",
    "testament": "Old Testament",
    "chapter": 17,
    "verse": 17,
    "text": "A friend loveth at all times, and a brother is born for adversity.",
    "reference": "Proverbs 17:17",
    "category": [
      "Friendship",
      "Love",
      "Relationships"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-35",
    "book": "Proverbs",
    "testament": "Old Testament",
    "chapter": 18,
    "verse": 24,
    "text": "A man that hath friends must shew himself friendly: and there is a friend that sticketh closer than a brother.",
    "reference": "Proverbs 18:24",
    "category": [
      "Friendship",
      "Relationships",
      "Loneliness"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-36",
    "book": "Ecclesiastes",
    "testament": "Old Testament",
    "chapter": 3,
    "verse": 1,
    "text": "To every thing there is a season, and a time to every purpose under the heaven:",
    "reference": "Ecclesiastes 3:1",
    "category": [
      "Patience",
      "Difficult Times",
      "Peace"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-37",
    "book": "Ecclesiastes",
    "testament": "Old Testament",
    "chapter": 4,
    "verse": 9,
    "text": "Two are better than one; because they have a good reward for their labour.",
    "reference": "Ecclesiastes 4:9",
    "category": [
      "Friendship",
      "Relationships",
      "Strength"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-38",
    "book": "Ecclesiastes",
    "testament": "Old Testament",
    "chapter": 4,
    "verse": 10,
    "text": "For if they fall, the one will lift up his fellow: but woe to him that is alone when he falleth; for he hath not another to help him up.",
    "reference": "Ecclesiastes 4:10",
    "category": [
      "Friendship",
      "Help",
      "Loneliness"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-39",
    "book": "Isaiah",
    "testament": "Old Testament",
    "chapter": 40,
    "verse": 29,
    "text": "He giveth power to the faint; and to them that have no might he increaseth strength.",
    "reference": "Isaiah 40:29",
    "category": [
      "Strength",
      "Encouragement",
      "Fatigue"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-40",
    "book": "Isaiah",
    "testament": "Old Testament",
    "chapter": 40,
    "verse": 31,
    "text": "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.",
    "reference": "Isaiah 40:31",
    "category": [
      "Strength",
      "Hope",
      "Patience",
      "Perseverance"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-41",
    "book": "Isaiah",
    "testament": "Old Testament",
    "chapter": 41,
    "verse": 10,
    "text": "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.",
    "reference": "Isaiah 41:10",
    "category": [
      "Fear",
      "Courage",
      "Strength",
      "Comfort"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-42",
    "book": "Isaiah",
    "testament": "Old Testament",
    "chapter": 43,
    "verse": 1,
    "text": "But now thus saith the LORD that created thee, O Jacob, and he that formed thee, O Israel, Fear not: for I have redeemed thee, I have called thee by thy name; thou art mine.",
    "reference": "Isaiah 43:1",
    "category": [
      "Fear",
      "Self-Worth",
      "Protection"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-43",
    "book": "Isaiah",
    "testament": "Old Testament",
    "chapter": 43,
    "verse": 2,
    "text": "When thou passest through the waters, I will be with thee; and through the rivers, they shall not overflow thee: when thou walkest through the fire, thou shalt not be burned; neither shall the flame kindle upon thee.",
    "reference": "Isaiah 43:2",
    "category": [
      "Difficult Times",
      "Protection",
      "Courage"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-44",
    "book": "Isaiah",
    "testament": "Old Testament",
    "chapter": 53,
    "verse": 5,
    "text": "But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed.",
    "reference": "Isaiah 53:5",
    "category": [
      "Healing",
      "Forgiveness",
      "Love"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-45",
    "book": "Isaiah",
    "testament": "Old Testament",
    "chapter": 54,
    "verse": 10,
    "text": "For the mountains shall depart, and the hills be removed; but my kindness shall not depart from thee, neither shall the covenant of my peace be removed, saith the LORD that hath mercy on thee.",
    "reference": "Isaiah 54:10",
    "category": [
      "Love",
      "Peace",
      "Comfort"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-46",
    "book": "Jeremiah",
    "testament": "Old Testament",
    "chapter": 29,
    "verse": 11,
    "text": "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.",
    "reference": "Jeremiah 29:11",
    "category": [
      "Hope",
      "Purpose",
      "Peace",
      "Encouragement"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-47",
    "book": "Jeremiah",
    "testament": "Old Testament",
    "chapter": 33,
    "verse": 3,
    "text": "Call unto me, and I will answer thee, and shew thee great and mighty things, which thou knowest not.",
    "reference": "Jeremiah 33:3",
    "category": [
      "Prayer",
      "Guidance",
      "Wisdom"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-48",
    "book": "Lamentations",
    "testament": "Old Testament",
    "chapter": 3,
    "verse": 22,
    "text": "It is of the LORD\u2019s mercies that we are not consumed, because his compassions fail not.",
    "reference": "Lamentations 3:22",
    "category": [
      "Love",
      "Hope",
      "Kindness"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-49",
    "book": "Lamentations",
    "testament": "Old Testament",
    "chapter": 3,
    "verse": 23,
    "text": "They are new every morning: great is thy faithfulness.",
    "reference": "Lamentations 3:23",
    "category": [
      "Gratitude",
      "Faith",
      "Hope"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-50",
    "book": "Lamentations",
    "testament": "Old Testament",
    "chapter": 3,
    "verse": 24,
    "text": "The LORD is my portion, saith my soul; therefore will I hope in him.",
    "reference": "Lamentations 3:24",
    "category": [
      "Hope",
      "Patience",
      "Faith"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-51",
    "book": "Joshua",
    "testament": "Old Testament",
    "chapter": 1,
    "verse": 9,
    "text": "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.",
    "reference": "Joshua 1:9",
    "category": [
      "Courage",
      "Fear",
      "Strength",
      "Encouragement"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-52",
    "book": "Micah",
    "testament": "Old Testament",
    "chapter": 6,
    "verse": 8,
    "text": "He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?",
    "reference": "Micah 6:8",
    "category": [
      "Wisdom",
      "Kindness",
      "Purpose"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-53",
    "book": "Zephaniah",
    "testament": "Old Testament",
    "chapter": 3,
    "verse": 17,
    "text": "The LORD thy God in the midst of thee is mighty; he will save, he will rejoice over thee with joy; he will rest in his love, he will joy over thee with singing.",
    "reference": "Zephaniah 3:17",
    "category": [
      "Love",
      "Joy",
      "Peace",
      "Comfort"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-54",
    "book": "Matthew",
    "testament": "New Testament",
    "chapter": 5,
    "verse": 3,
    "text": "Blessed are the poor in spirit: for theirs is the kingdom of heaven.",
    "reference": "Matthew 5:3",
    "category": [
      "Comfort",
      "Faith",
      "Hope"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-55",
    "book": "Matthew",
    "testament": "New Testament",
    "chapter": 5,
    "verse": 4,
    "text": "Blessed are they that mourn: for they shall be comforted.",
    "reference": "Matthew 5:4",
    "category": [
      "Grief",
      "Comfort",
      "Healing"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-56",
    "book": "Matthew",
    "testament": "New Testament",
    "chapter": 5,
    "verse": 7,
    "text": "Blessed are the merciful: for they shall obtain mercy.",
    "reference": "Matthew 5:7",
    "category": [
      "Kindness",
      "Forgiveness",
      "Love"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-57",
    "book": "Matthew",
    "testament": "New Testament",
    "chapter": 5,
    "verse": 9,
    "text": "Blessed are the peacemakers: for they shall be called the children of God.",
    "reference": "Matthew 5:9",
    "category": [
      "Peace",
      "Kindness",
      "Relationships"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-58",
    "book": "Matthew",
    "testament": "New Testament",
    "chapter": 6,
    "verse": 25,
    "text": "Therefore I say unto you, Take no thought for your life, what ye shall eat, or what ye shall drink; nor yet for your body, what ye shall put on. Is not the life more than meat, and the body than raiment?",
    "reference": "Matthew 6:25",
    "category": [
      "Anxiety",
      "Stress",
      "Faith",
      "Rest"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-59",
    "book": "Matthew",
    "testament": "New Testament",
    "chapter": 6,
    "verse": 26,
    "text": "Behold the fowls of the air: for they sow not, neither do they reap, nor gather into barns; yet your heavenly Father feedeth them. Are ye not much better than they?",
    "reference": "Matthew 6:26",
    "category": [
      "Self-Worth",
      "Anxiety",
      "Faith"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-60",
    "book": "Matthew",
    "testament": "New Testament",
    "chapter": 6,
    "verse": 33,
    "text": "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.",
    "reference": "Matthew 6:33",
    "category": [
      "Purpose",
      "Guidance",
      "Faith"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-61",
    "book": "Matthew",
    "testament": "New Testament",
    "chapter": 6,
    "verse": 34,
    "text": "Take therefore no thought for the morrow: for the morrow shall take thought for the things of itself. Sufficient unto the day is the evil thereof.",
    "reference": "Matthew 6:34",
    "category": [
      "Anxiety",
      "Stress",
      "Peace",
      "Rest"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-62",
    "book": "Matthew",
    "testament": "New Testament",
    "chapter": 7,
    "verse": 7,
    "text": "Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you:",
    "reference": "Matthew 7:7",
    "category": [
      "Prayer",
      "Guidance",
      "Faith"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-63",
    "book": "Matthew",
    "testament": "New Testament",
    "chapter": 11,
    "verse": 28,
    "text": "Come unto me, all ye that labour and are heavy laden, and I will give you rest.",
    "reference": "Matthew 11:28",
    "category": [
      "Rest",
      "Stress",
      "Weariness",
      "Comfort"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-64",
    "book": "Matthew",
    "testament": "New Testament",
    "chapter": 11,
    "verse": 29,
    "text": "Take my yoke upon you, and learn of me; for I am meek and lowly in heart: and ye shall find rest unto your souls.",
    "reference": "Matthew 11:29",
    "category": [
      "Rest",
      "Peace",
      "Patience"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-65",
    "book": "Matthew",
    "testament": "New Testament",
    "chapter": 11,
    "verse": 30,
    "text": "For my yoke is easy, and my burden is light.",
    "reference": "Matthew 11:30",
    "category": [
      "Rest",
      "Peace",
      "Comfort"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-66",
    "book": "Matthew",
    "testament": "New Testament",
    "chapter": 28,
    "verse": 20,
    "text": "Teaching them to observe all things whatsoever I have commanded you: and, lo, I am with you alway, even unto the end of the world. Amen.",
    "reference": "Matthew 28:20",
    "category": [
      "Loneliness",
      "Comfort",
      "Faith",
      "Protection"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-67",
    "book": "Mark",
    "testament": "New Testament",
    "chapter": 11,
    "verse": 24,
    "text": "Therefore I say unto you, What things soever ye desire, when ye pray, believe that ye receive them, and ye shall have them.",
    "reference": "Mark 11:24",
    "category": [
      "Prayer",
      "Faith",
      "Hope"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-68",
    "book": "Luke",
    "testament": "New Testament",
    "chapter": 6,
    "verse": 31,
    "text": "And as ye would that men should do to you, do ye also to them likewise.",
    "reference": "Luke 6:31",
    "category": [
      "Kindness",
      "Relationships",
      "Love"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-69",
    "book": "Luke",
    "testament": "New Testament",
    "chapter": 6,
    "verse": 37,
    "text": "Judge not, and ye shall not be judged: condemn not, and ye shall not be condemned: forgive, and ye shall be forgiven:",
    "reference": "Luke 6:37",
    "category": [
      "Forgiveness",
      "Kindness",
      "Love"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-70",
    "book": "Luke",
    "testament": "New Testament",
    "chapter": 12,
    "verse": 6,
    "text": "Are not five sparrows sold for two farthings, and not one of them is forgotten before God?",
    "reference": "Luke 12:6",
    "category": [
      "Self-Worth",
      "Faith",
      "Comfort"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-71",
    "book": "Luke",
    "testament": "New Testament",
    "chapter": 12,
    "verse": 7,
    "text": "But even the very hairs of your head are all numbered. Fear not therefore: ye are of more value than many sparrows.",
    "reference": "Luke 12:7",
    "category": [
      "Self-Worth",
      "Love",
      "Comfort"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-72",
    "book": "John",
    "testament": "New Testament",
    "chapter": 3,
    "verse": 16,
    "text": "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
    "reference": "John 3:16",
    "category": [
      "Love",
      "Faith",
      "Hope",
      "Self-Worth"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-73",
    "book": "John",
    "testament": "New Testament",
    "chapter": 14,
    "verse": 1,
    "text": "Let not your heart be troubled: ye believe in God, believe also in me.",
    "reference": "John 14:1",
    "category": [
      "Peace",
      "Comfort",
      "Faith",
      "Heart"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-74",
    "book": "John",
    "testament": "New Testament",
    "chapter": 14,
    "verse": 27,
    "text": "Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.",
    "reference": "John 14:27",
    "category": [
      "Peace",
      "Fear",
      "Comfort",
      "Anxiety"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-75",
    "book": "John",
    "testament": "New Testament",
    "chapter": 15,
    "verse": 12,
    "text": "This is my commandment, That ye love one another, as I have loved you.",
    "reference": "John 15:12",
    "category": [
      "Love",
      "Friendship",
      "Relationships"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-76",
    "book": "John",
    "testament": "New Testament",
    "chapter": 15,
    "verse": 13,
    "text": "Greater love hath no man than this, that a man lay down his life for his friends.",
    "reference": "John 15:13",
    "category": [
      "Friendship",
      "Love",
      "Relationships"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-77",
    "book": "John",
    "testament": "New Testament",
    "chapter": 16,
    "verse": 33,
    "text": "These things I have spoken unto you, that in me ye might have peace. In the world ye shall have tribulation: but be of good cheer; I have overcome the world.",
    "reference": "John 16:33",
    "category": [
      "Peace",
      "Courage",
      "Difficult Times",
      "Hope"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-78",
    "book": "Romans",
    "testament": "New Testament",
    "chapter": 8,
    "verse": 28,
    "text": "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.",
    "reference": "Romans 8:28",
    "category": [
      "Hope",
      "Faith",
      "Purpose",
      "Difficult Times"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-79",
    "book": "Romans",
    "testament": "New Testament",
    "chapter": 8,
    "verse": 31,
    "text": "What shall we then say to these things? If God be for us, who can be against us?",
    "reference": "Romans 8:31",
    "category": [
      "Courage",
      "Strength",
      "Faith"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-80",
    "book": "Romans",
    "testament": "New Testament",
    "chapter": 8,
    "verse": 38,
    "text": "For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come,",
    "reference": "Romans 8:38",
    "category": [
      "Love",
      "Security",
      "Faith"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-81",
    "book": "Romans",
    "testament": "New Testament",
    "chapter": 8,
    "verse": 39,
    "text": "Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord.",
    "reference": "Romans 8:39",
    "category": [
      "Love",
      "Comfort",
      "Hope",
      "Self-Worth"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-82",
    "book": "Romans",
    "testament": "New Testament",
    "chapter": 12,
    "verse": 2,
    "text": "And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.",
    "reference": "Romans 12:2",
    "category": [
      "Wisdom",
      "Guidance",
      "Growth"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-83",
    "book": "Romans",
    "testament": "New Testament",
    "chapter": 12,
    "verse": 10,
    "text": "Be kindly affectioned one to another with brotherly love; in honour preferring one another;",
    "reference": "Romans 12:10",
    "category": [
      "Kindness",
      "Love",
      "Relationships"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-84",
    "book": "Romans",
    "testament": "New Testament",
    "chapter": 12,
    "verse": 12,
    "text": "Rejoicing in hope; patient in tribulation; continuing instant in prayer;",
    "reference": "Romans 12:12",
    "category": [
      "Hope",
      "Patience",
      "Prayer",
      "Joy"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-85",
    "book": "Romans",
    "testament": "New Testament",
    "chapter": 12,
    "verse": 18,
    "text": "If it be possible, as much as lieth in you, live peaceably with all men.",
    "reference": "Romans 12:18",
    "category": [
      "Peace",
      "Relationships",
      "Kindness"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-86",
    "book": "Romans",
    "testament": "New Testament",
    "chapter": 15,
    "verse": 13,
    "text": "Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope, through the power of the Holy Ghost.",
    "reference": "Romans 15:13",
    "category": [
      "Hope",
      "Joy",
      "Peace",
      "Faith"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-87",
    "book": "1 Corinthians",
    "testament": "New Testament",
    "chapter": 10,
    "verse": 13,
    "text": "There hath no temptation taken you but such as is common to man: but God is faithful, who will not suffer you to be tempted above that ye are able; but will with the temptation also make a way to escape, that ye may be able to bear it.",
    "reference": "1 Corinthians 10:13",
    "category": [
      "Difficult Times",
      "Perseverance",
      "Faith"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-88",
    "book": "1 Corinthians",
    "testament": "New Testament",
    "chapter": 13,
    "verse": 4,
    "text": "Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up,",
    "reference": "1 Corinthians 13:4",
    "category": [
      "Love",
      "Patience",
      "Kindness"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-89",
    "book": "1 Corinthians",
    "testament": "New Testament",
    "chapter": 13,
    "verse": 5,
    "text": "Doth not behave itself unseemly, seeketh not her own, is not easily provoked, thinketh no evil;",
    "reference": "1 Corinthians 13:5",
    "category": [
      "Love",
      "Patience",
      "Forgiveness"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-90",
    "book": "1 Corinthians",
    "testament": "New Testament",
    "chapter": 13,
    "verse": 6,
    "text": "Rejoiceth not in iniquity, but rejoiceth in the truth;",
    "reference": "1 Corinthians 13:6",
    "category": [
      "Love",
      "Joy",
      "Truth"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-91",
    "book": "1 Corinthians",
    "testament": "New Testament",
    "chapter": 13,
    "verse": 7,
    "text": "Beareth all things, believeth all things, hopeth all things, endureth all things.",
    "reference": "1 Corinthians 13:7",
    "category": [
      "Love",
      "Hope",
      "Perseverance",
      "Patience"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-92",
    "book": "1 Corinthians",
    "testament": "New Testament",
    "chapter": 13,
    "verse": 13,
    "text": "And now abideth faith, hope, charity, these three; but the greatest of these is charity.",
    "reference": "1 Corinthians 13:13",
    "category": [
      "Faith",
      "Hope",
      "Love"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-93",
    "book": "1 Corinthians",
    "testament": "New Testament",
    "chapter": 16,
    "verse": 14,
    "text": "Let all your things be done with charity.",
    "reference": "1 Corinthians 16:14",
    "category": [
      "Love",
      "Kindness",
      "Relationships"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-94",
    "book": "2 Corinthians",
    "testament": "New Testament",
    "chapter": 1,
    "verse": 3,
    "text": "Blessed be God, even the Father of our Lord Jesus Christ, the Father of mercies, and the God of all comfort;",
    "reference": "2 Corinthians 1:3",
    "category": [
      "Comfort",
      "Mercy",
      "Grief"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-95",
    "book": "2 Corinthians",
    "testament": "New Testament",
    "chapter": 1,
    "verse": 4,
    "text": "Who comforteth us in all our tribulation, that we may be able to comfort them which are in any trouble, by the comfort wherewith we ourselves are comforted of God.",
    "reference": "2 Corinthians 1:4",
    "category": [
      "Comfort",
      "Kindness",
      "Difficult Times"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-96",
    "book": "2 Corinthians",
    "testament": "New Testament",
    "chapter": 4,
    "verse": 8,
    "text": "We are troubled on every side, yet not distressed; we are perplexed, but not in despair;",
    "reference": "2 Corinthians 4:8",
    "category": [
      "Strength",
      "Difficult Times",
      "Perseverance"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-97",
    "book": "2 Corinthians",
    "testament": "New Testament",
    "chapter": 4,
    "verse": 9,
    "text": "Persecuted, but not forsaken; cast down, but not destroyed;",
    "reference": "2 Corinthians 4:9",
    "category": [
      "Difficult Times",
      "Perseverance",
      "Hope"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-98",
    "book": "2 Corinthians",
    "testament": "New Testament",
    "chapter": 4,
    "verse": 16,
    "text": "For which cause we faint not; but though our outward man perish, yet the inward man is renewed day by day.",
    "reference": "2 Corinthians 4:16",
    "category": [
      "Perseverance",
      "Strength",
      "Growth"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-99",
    "book": "2 Corinthians",
    "testament": "New Testament",
    "chapter": 5,
    "verse": 7,
    "text": "(For we walk by faith, not by sight:)",
    "reference": "2 Corinthians 5:7",
    "category": [
      "Faith",
      "Courage",
      "Guidance"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-100",
    "book": "2 Corinthians",
    "testament": "New Testament",
    "chapter": 12,
    "verse": 9,
    "text": "And he said unto me, My grace is sufficient for thee: for my strength is made perfect in weakness. Most gladly therefore will I rather glory in my infirmities, that the power of Christ may rest upon me.",
    "reference": "2 Corinthians 12:9",
    "category": [
      "Strength",
      "Grace",
      "Difficult Times",
      "Weakness"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-101",
    "book": "Galatians",
    "testament": "New Testament",
    "chapter": 5,
    "verse": 22,
    "text": "But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith,",
    "reference": "Galatians 5:22",
    "category": [
      "Joy",
      "Peace",
      "Patience",
      "Kindness",
      "Faith"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-102",
    "book": "Galatians",
    "testament": "New Testament",
    "chapter": 5,
    "verse": 23,
    "text": "Meekness, temperance: against such there is no law.",
    "reference": "Galatians 5:23",
    "category": [
      "Self-Worth",
      "Peace",
      "Patience"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-103",
    "book": "Galatians",
    "testament": "New Testament",
    "chapter": 6,
    "verse": 9,
    "text": "And let us not be weary in well doing: for in due season we shall reap, if we faint not.",
    "reference": "Galatians 6:9",
    "category": [
      "Perseverance",
      "Encouragement",
      "Patience"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-104",
    "book": "Ephesians",
    "testament": "New Testament",
    "chapter": 2,
    "verse": 10,
    "text": "For we are his workmanship, created in Christ Jesus unto good works, which God hath before ordained that we should walk in them.",
    "reference": "Ephesians 2:10",
    "category": [
      "Purpose",
      "Self-Worth",
      "Faith"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-105",
    "book": "Ephesians",
    "testament": "New Testament",
    "chapter": 4,
    "verse": 2,
    "text": "With all lowliness and meekness, with longsuffering, forbearing one another in love;",
    "reference": "Ephesians 4:2",
    "category": [
      "Patience",
      "Love",
      "Relationships"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-106",
    "book": "Ephesians",
    "testament": "New Testament",
    "chapter": 4,
    "verse": 32,
    "text": "And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ\u2019s sake hath forgiven you.",
    "reference": "Ephesians 4:32",
    "category": [
      "Forgiveness",
      "Kindness",
      "Love"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-107",
    "book": "Ephesians",
    "testament": "New Testament",
    "chapter": 6,
    "verse": 10,
    "text": "Finally, my brethren, be strong in the Lord, and in the power of his might.",
    "reference": "Ephesians 6:10",
    "category": [
      "Strength",
      "Courage",
      "Faith"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-108",
    "book": "Philippians",
    "testament": "New Testament",
    "chapter": 4,
    "verse": 6,
    "text": "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.",
    "reference": "Philippians 4:6",
    "category": [
      "Anxiety",
      "Stress",
      "Prayer",
      "Peace"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-109",
    "book": "Philippians",
    "testament": "New Testament",
    "chapter": 4,
    "verse": 7,
    "text": "And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.",
    "reference": "Philippians 4:7",
    "category": [
      "Peace",
      "Anxiety",
      "Stress",
      "Comfort"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-110",
    "book": "Philippians",
    "testament": "New Testament",
    "chapter": 4,
    "verse": 8,
    "text": "Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things.",
    "reference": "Philippians 4:8",
    "category": [
      "Peace",
      "Wisdom",
      "Mindfulness"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-111",
    "book": "Philippians",
    "testament": "New Testament",
    "chapter": 4,
    "verse": 13,
    "text": "I can do all things through Christ which strengtheneth me.",
    "reference": "Philippians 4:13",
    "category": [
      "Strength",
      "Encouragement",
      "Faith",
      "Perseverance"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-112",
    "book": "Philippians",
    "testament": "New Testament",
    "chapter": 4,
    "verse": 19,
    "text": "But my God shall supply all your need according to his riches in glory by Christ Jesus.",
    "reference": "Philippians 4:19",
    "category": [
      "Protection",
      "Faith",
      "Comfort"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-113",
    "book": "Colossians",
    "testament": "New Testament",
    "chapter": 3,
    "verse": 12,
    "text": "Put on therefore, as the elect of God, holy and beloved, bowels of mercies, kindness, humbleness of mind, meekness, longsuffering;",
    "reference": "Colossians 3:12",
    "category": [
      "Kindness",
      "Forgiveness",
      "Patience",
      "Love"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-114",
    "book": "Colossians",
    "testament": "New Testament",
    "chapter": 3,
    "verse": 13,
    "text": "Forbearing one another, and forgiving one another, if any man have a quarrel against any: even as Christ forgave you, so also do ye.",
    "reference": "Colossians 3:13",
    "category": [
      "Forgiveness",
      "Patience",
      "Relationships"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-115",
    "book": "Colossians",
    "testament": "New Testament",
    "chapter": 3,
    "verse": 14,
    "text": "And above all these things put on charity, which is the bond of perfectness.",
    "reference": "Colossians 3:14",
    "category": [
      "Love",
      "Relationships",
      "Peace"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-116",
    "book": "Colossians",
    "testament": "New Testament",
    "chapter": 3,
    "verse": 15,
    "text": "And let the peace of God rule in your hearts, to the which also ye are called in one body; and be ye thankful.",
    "reference": "Colossians 3:15",
    "category": [
      "Peace",
      "Gratitude",
      "Heart"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-117",
    "book": "1 Thessalonians",
    "testament": "New Testament",
    "chapter": 5,
    "verse": 11,
    "text": "Wherefore comfort yourselves together, and edify one another, even as also ye do.",
    "reference": "1 Thessalonians 5:11",
    "category": [
      "Encouragement",
      "Friendship",
      "Kindness"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-118",
    "book": "1 Thessalonians",
    "testament": "New Testament",
    "chapter": 5,
    "verse": 16,
    "text": "Rejoice evermore.",
    "reference": "1 Thessalonians 5:16",
    "category": [
      "Joy",
      "Gratitude",
      "Hope"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-119",
    "book": "1 Thessalonians",
    "testament": "New Testament",
    "chapter": 5,
    "verse": 17,
    "text": "Pray without ceasing.",
    "reference": "1 Thessalonians 5:17",
    "category": [
      "Prayer",
      "Faith",
      "Guidance"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-120",
    "book": "1 Thessalonians",
    "testament": "New Testament",
    "chapter": 5,
    "verse": 18,
    "text": "In every thing give thanks: for this is the will of God in Christ Jesus concerning you.",
    "reference": "1 Thessalonians 5:18",
    "category": [
      "Gratitude",
      "Joy",
      "Faith"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-121",
    "book": "2 Thessalonians",
    "testament": "New Testament",
    "chapter": 3,
    "verse": 3,
    "text": "But the Lord is faithful, who shall stablish you, and keep you from evil.",
    "reference": "2 Thessalonians 3:3",
    "category": [
      "Protection",
      "Faith",
      "Strength"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-122",
    "book": "2 Thessalonians",
    "testament": "New Testament",
    "chapter": 3,
    "verse": 16,
    "text": "Now the Lord of peace himself give you peace always by all means. The Lord be with you all.",
    "reference": "2 Thessalonians 3:16",
    "category": [
      "Peace",
      "Comfort",
      "Rest"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-123",
    "book": "1 Timothy",
    "testament": "New Testament",
    "chapter": 4,
    "verse": 12,
    "text": "Let no man despise thy youth; but be thou an example of the believers, in word, in conversation, in charity, in spirit, in faith, in purity.",
    "reference": "1 Timothy 4:12",
    "category": [
      "Self-Worth",
      "Courage",
      "Purpose"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-124",
    "book": "2 Timothy",
    "testament": "New Testament",
    "chapter": 1,
    "verse": 7,
    "text": "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.",
    "reference": "2 Timothy 1:7",
    "category": [
      "Fear",
      "Courage",
      "Strength",
      "Peace"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-125",
    "book": "Hebrews",
    "testament": "New Testament",
    "chapter": 4,
    "verse": 16,
    "text": "Let us therefore come boldly unto the throne of grace, that we may obtain mercy, and find grace to help in time of need.",
    "reference": "Hebrews 4:16",
    "category": [
      "Prayer",
      "Grace",
      "Comfort",
      "Help"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-126",
    "book": "Hebrews",
    "testament": "New Testament",
    "chapter": 10,
    "verse": 24,
    "text": "And let us consider one another to provoke unto love and to good works:",
    "reference": "Hebrews 10:24",
    "category": [
      "Encouragement",
      "Friendship",
      "Love"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-127",
    "book": "Hebrews",
    "testament": "New Testament",
    "chapter": 11,
    "verse": 1,
    "text": "Now faith is the substance of things hoped for, the evidence of things not seen.",
    "reference": "Hebrews 11:1",
    "category": [
      "Faith",
      "Hope",
      "Courage"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-128",
    "book": "Hebrews",
    "testament": "New Testament",
    "chapter": 12,
    "verse": 1,
    "text": "Wherefore seeing we also are compassed about with so great a cloud of witnesses, let us lay aside every weight, and the sin which doth so easily beset us, and let us run with patience the race that is set before us,",
    "reference": "Hebrews 12:1",
    "category": [
      "Perseverance",
      "Encouragement",
      "Faith"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-129",
    "book": "Hebrews",
    "testament": "New Testament",
    "chapter": 13,
    "verse": 5,
    "text": "Let your conversation be without covetousness; and be content with such things as ye have: for he hath said, I will never leave thee, nor forsake thee.",
    "reference": "Hebrews 13:5",
    "category": [
      "Loneliness",
      "Comfort",
      "Faith"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-130",
    "book": "James",
    "testament": "New Testament",
    "chapter": 1,
    "verse": 2,
    "text": "My brethren, count it all joy when ye fall into divers temptations;",
    "reference": "James 1:2",
    "category": [
      "Joy",
      "Difficult Times",
      "Growth"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-131",
    "book": "James",
    "testament": "New Testament",
    "chapter": 1,
    "verse": 3,
    "text": "Knowing this, that the trying of your faith worketh patience.",
    "reference": "James 1:3",
    "category": [
      "Patience",
      "Perseverance",
      "Growth"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-132",
    "book": "James",
    "testament": "New Testament",
    "chapter": 1,
    "verse": 5,
    "text": "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.",
    "reference": "James 1:5",
    "category": [
      "Wisdom",
      "Guidance",
      "Prayer"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-133",
    "book": "James",
    "testament": "New Testament",
    "chapter": 1,
    "verse": 19,
    "text": "Wherefore, my beloved brethren, let every man be swift to hear, slow to speak, slow to wrath:",
    "reference": "James 1:19",
    "category": [
      "Patience",
      "Wisdom",
      "Relationships"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-134",
    "book": "James",
    "testament": "New Testament",
    "chapter": 5,
    "verse": 16,
    "text": "Confess your faults one to another, and pray one for another, that ye may be healed. The effectual fervent prayer of a righteous man availeth much.",
    "reference": "James 5:16",
    "category": [
      "Prayer",
      "Healing",
      "Relationships"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-135",
    "book": "1 Peter",
    "testament": "New Testament",
    "chapter": 5,
    "verse": 7,
    "text": "Casting all your care upon him; for he careth for you.",
    "reference": "1 Peter 5:7",
    "category": [
      "Anxiety",
      "Stress",
      "Comfort",
      "Care"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-136",
    "book": "1 Peter",
    "testament": "New Testament",
    "chapter": 5,
    "verse": 10,
    "text": "But the God of all grace, who hath called us unto his eternal glory by Christ Jesus, after that ye have suffered a while, make you perfect, stablish, strengthen, settle you.",
    "reference": "1 Peter 5:10",
    "category": [
      "Strength",
      "Healing",
      "Hope",
      "Perseverance"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-137",
    "book": "1 John",
    "testament": "New Testament",
    "chapter": 3,
    "verse": 1,
    "text": "Behold, what manner of love the Father hath bestowed upon us, that we should be called the sons of God: therefore the world knoweth us not, because it knew him not.",
    "reference": "1 John 3:1",
    "category": [
      "Love",
      "Self-Worth",
      "Faith"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-138",
    "book": "1 John",
    "testament": "New Testament",
    "chapter": 3,
    "verse": 18,
    "text": "My little children, let us not love in word, neither in tongue; but in deed and in truth.",
    "reference": "1 John 3:18",
    "category": [
      "Love",
      "Kindness",
      "Relationships"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-139",
    "book": "1 John",
    "testament": "New Testament",
    "chapter": 4,
    "verse": 7,
    "text": "Beloved, let us love one another: for love is of God; and every one that loveth is born of God, and knoweth God.",
    "reference": "1 John 4:7",
    "category": [
      "Love",
      "Friendship",
      "Relationships"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-140",
    "book": "1 John",
    "testament": "New Testament",
    "chapter": 4,
    "verse": 18,
    "text": "There is no fear in love; but perfect love casteth out fear: because fear hath torment. He that feareth is not made perfect in love.",
    "reference": "1 John 4:18",
    "category": [
      "Fear",
      "Love",
      "Peace",
      "Courage"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-141",
    "book": "1 John",
    "testament": "New Testament",
    "chapter": 4,
    "verse": 19,
    "text": "We love him, because he first loved us.",
    "reference": "1 John 4:19",
    "category": [
      "Love",
      "Gratitude",
      "Self-Worth"
    ],
    "translation": "KJV"
  },
  {
    "id": "kjv-142",
    "book": "Revelation",
    "testament": "New Testament",
    "chapter": 21,
    "verse": 4,
    "text": "And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain: for the former things are passed away.",
    "reference": "Revelation 21:4",
    "category": [
      "Grief",
      "Comfort",
      "Healing",
      "Hope"
    ],
    "translation": "KJV"
  }
];

  // Map book short names / aliases
  var BOOK_ALIAS_MAP = {
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
  };

  var BibleService = {
    translation: 'King James Version (KJV)',
    books: BIBLE_BOOKS,
    categories: BIBLE_CATEGORIES,
    curatedVerses: CURATED_VERSES,

    // Cache of loaded chapter data
    _loadedChapters: {},

    getAllBooks: function() {
      return BIBLE_BOOKS;
    },

    getOldTestamentBooks: function() {
      return BIBLE_BOOKS.filter(function(b) { return b.testament === 'Old Testament'; });
    },

    getNewTestamentBooks: function() {
      return BIBLE_BOOKS.filter(function(b) { return b.testament === 'New Testament'; });
    },

    getBookMetadata: function(bookName) {
      if (!bookName) return null;
      var clean = bookName.trim().toLowerCase();
      if (BOOK_ALIAS_MAP[clean]) clean = BOOK_ALIAS_MAP[clean].toLowerCase();
      return BIBLE_BOOKS.find(function(b) {
        return b.name.toLowerCase() === clean;
      }) || null;
    },

    getCategories: function() {
      return BIBLE_CATEGORIES;
    },

    /**
     * Load verses for a specific book & chapter
     */
    getChapterVerses: async function(bookName, chapterNum) {
      var meta = this.getBookMetadata(bookName);
      if (!meta) return [];

      var cacheKey = meta.name + '_' + chapterNum;
      if (this._loadedChapters[cacheKey]) {
        return this._loadedChapters[cacheKey];
      }

      try {
        var resp = await fetch('data/bible/' + meta.file);
        if (!resp.ok) throw new Error('Could not load book file');
        var data = await resp.json();
        var chap = (data.chapters || []).find(function(c) {
          return String(c.chapter) === String(chapterNum);
        });
        if (!chap) return [];

        var verses = (chap.verses || []).map(function(v) {
          var vNum = parseInt(v.verse, 10);
          var cleanText = (v.text || '').replace(/[\uFFFD]/g, "'");
          var ref = (meta.name === 'Psalms' ? 'Psalm' : meta.name) + ' ' + chapterNum + ':' + vNum;

          // Find if this verse has categories in curated list
          var curated = CURATED_VERSES.find(function(cv) {
            return cv.book === meta.name && cv.chapter === parseInt(chapterNum, 10) && cv.verse === vNum;
          });

          return {
            id: 'kjv-' + meta.name.toLowerCase().replace(/\s+/g, '') + '-' + chapterNum + '-' + vNum,
            book: meta.name,
            testament: meta.testament,
            chapter: parseInt(chapterNum, 10),
            verse: vNum,
            text: cleanText,
            reference: ref,
            category: curated ? curated.category : ['Scripture'],
            translation: 'KJV'
          };
        });

        this._loadedChapters[cacheKey] = verses;
        return verses;
      } catch (err) {
        console.warn('[SafeSpace Bible] Error fetching chapter:', err);
        // Fallback to any matching curated verses
        return CURATED_VERSES.filter(function(cv) {
          return cv.book.toLowerCase() === meta.name.toLowerCase() && cv.chapter === parseInt(chapterNum, 10);
        });
      }
    },

    /**
     * Filter & search verses
     */
    queryVerses: async function(options) {
      options = options || {};
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
      if (book !== 'all' && chapter) {
        dataset = await this.getChapterVerses(book, chapter);
      } else {
        // Use curated dataset
        dataset = CURATED_VERSES.slice();
      }

      // Filter by saved
      if (onlySaved) {
        dataset = dataset.filter(function(v) {
          return savedIds.includes(v.id) || savedIds.includes(v.reference);
        });
      }

      // Filter by book
      if (book && book !== 'all') {
        var targetBookMeta = this.getBookMetadata(book);
        var targetBookName = targetBookMeta ? targetBookMeta.name.toLowerCase() : book.toLowerCase();
        dataset = dataset.filter(function(v) {
          return v.book.toLowerCase() === targetBookName;
        });
      }

      // Filter by chapter (if not already loaded exclusively)
      if (chapter && !isNaN(chapter)) {
        dataset = dataset.filter(function(v) {
          return v.chapter === chapter;
        });
      }

      // Filter by category
      if (category && category !== 'all' && category !== 'saved') {
        var catLower = category.toLowerCase();
        dataset = dataset.filter(function(v) {
          return (v.category || []).some(function(c) {
            var cLower = c.toLowerCase();
            if (cLower === catLower || cLower.includes(catLower)) return true;
            if (catLower === 'sadness' && (cLower === 'grief' || cLower === 'loneliness' || cLower === 'comfort')) return true;
            return false;
          });
        });
      }

      // Filter by search query (text, book, chapter, verse, reference, category)
      if (search) {
        // Check for reference pattern like "Psalm 23" or "John 3:16"
        var refMatch = search.match(/^([1-3]?\s*[a-zA-Z]+)\s*(\d+)(?::(\d+))?$/);
        if (refMatch) {
          var sBook = refMatch[1].trim().toLowerCase();
          var sChap = parseInt(refMatch[2], 10);
          var sVerse = refMatch[3] ? parseInt(refMatch[3], 10) : null;
          var matchedMeta = this.getBookMetadata(sBook);

          if (matchedMeta) {
            // If specific reference like John 3:16 or Psalm 23, dynamically load chapter if not loaded
            if (dataset.length === 0 || !dataset.some(function(v) { return v.book.toLowerCase() === matchedMeta.name.toLowerCase() && v.chapter === sChap; })) {
              var chapVerses = await this.getChapterVerses(matchedMeta.name, sChap);
              if (chapVerses && chapVerses.length > 0) {
                dataset = chapVerses;
              }
            }
          }
        }

        dataset = dataset.filter(function(v) {
          var matchText = (v.text || '').toLowerCase().includes(search);
          var matchBook = (v.book || '').toLowerCase().includes(search);
          var matchRef = (v.reference || '').toLowerCase().includes(search);
          var matchChap = String(v.chapter) === search;
          var matchVerse = String(v.verse) === search;
          var matchCat = (v.category || []).some(function(c) {
            return c.toLowerCase().includes(search);
          });
          return matchText || matchBook || matchRef || matchChap || matchVerse || matchCat;
        });
      }

      var total = dataset.length;
      var totalPages = Math.ceil(total / limit) || 1;
      var safePage = Math.max(1, Math.min(page, totalPages));
      var start = (safePage - 1) * limit;
      var end = start + limit;
      var pagedItems = dataset.slice(start, end);

      return {
        items: pagedItems,
        total: total,
        page: safePage,
        totalPages: totalPages,
        limit: limit
      };
    },

    /**
     * Deterministic daily scripture selection
     * Changes once per calendar day at midnight.
     * Never uses Math.random() on page loads.
     */
    getDailyScripture: function(targetDate) {
      var dateObj = targetDate instanceof Date ? targetDate : new Date();
      var year = dateObj.getFullYear();
      var month = dateObj.getMonth();
      var day = dateObj.getDate();

      // Priority wellbeing verses
      var priorityVerses = CURATED_VERSES.filter(function(v) {
        var cats = (v.category || []).map(function(c) { return c.toLowerCase(); });
        return cats.includes('comfort') ||
               cats.includes('hope') ||
               cats.includes('peace') ||
               cats.includes('strength') ||
               cats.includes('encouragement') ||
               cats.includes('faith') ||
               cats.includes('anxiety') ||
               cats.includes('stress') ||
               cats.includes('difficult times');
      });

      var pool = priorityVerses.length > 0 ? priorityVerses : CURATED_VERSES;
      if (!pool || pool.length === 0) {
        return {
          id: 'kjv-fallback',
          book: '1 Peter',
          testament: 'New Testament',
          chapter: 5,
          verse: 7,
          text: 'Casting all your care upon him; for he careth for you.',
          reference: '1 Peter 5:7',
          category: ['Comfort', 'Peace', 'Anxiety'],
          translation: 'KJV'
        };
      }

      // Epoch day index calculation (Days since Jan 1, 2024 UTC)
      var utcTime = Date.UTC(year, month, day);
      var baseTime = Date.UTC(2024, 0, 1);
      var dayNumber = Math.floor((utcTime - baseTime) / 86400000);
      if (isNaN(dayNumber)) dayNumber = 0;

      var index = Math.abs(dayNumber) % pool.length;
      return pool[index];
    }
  };

  window.SafeSpaceBible = BibleService;
})(typeof window !== 'undefined' ? window : this);
