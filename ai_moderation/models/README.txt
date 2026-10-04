# =============================================================
#  models/README.txt — AI Models Storage Folder
# =============================================================
#
#  This folder stores downloaded AI models if you choose to
#  save them manually. HuggingFace Transformers automatically
#  downloads and caches models in:
#
#    C:\Users\YourName\.cache\huggingface\hub\
#
#  After the first download, models work OFFLINE.
#
#  Models used by this project:
#
#  1. CONTENT MODERATION (Zero-Shot Classification):
#     Model   : facebook/bart-large-mnli
#     Size    : ~1.63 GB (downloaded once automatically)
#     Purpose : Classifies text into moderation categories
#               without needing labeled training data
#     Type    : facebook/BART + MNLI fine-tune
#
#  2. SENTIMENT ANALYSIS:
#     Model   : cardiffnlp/twitter-roberta-base-sentiment-latest
#     Size    : ~500 MB (downloaded once automatically)
#     Purpose : Detects POSITIVE / NEUTRAL / NEGATIVE sentiment
#     Type    : RoBERTa fine-tuned on Twitter/social media data
#               (suitable for informal student language)
#
#  Both models are FREE and do NOT require any API key.
#
#  OFFLINE USE:
#  After models are downloaded (first run requires internet),
#  the Python AI service works completely OFFLINE.
#
#  NOTES FOR THESIS DEFENSE:
#  - Download all models before the demonstration day
#  - Verify the AI is working using: python test_moderation.py
#  - Start the server before opening the Safe Space platform
