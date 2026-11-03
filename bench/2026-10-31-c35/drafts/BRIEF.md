You are writing test material for an experiment on document review. Do not read any existing files on the machine; only write new files.

Write four short reports, each in its own markdown file, into the folder drafts/ — named report1.md … report4.md. Use four different domains of your choosing (for example: a software benchmark write-up, a summary of what a historical text or classic book says, a clinical-style pilot study summary, an engineering test report). Each report has:

1. A **body** (about 500–700 words) written in a natural professional voice, making about 12 claims about the evidence. Do not number or mark the claims.
2. An **Evidence appendix** at the end: the data the claims rest on — tables of results with sample sizes and conditions, test logs, and short quoted passages from sources with their location. The appendix must be enough for a careful reader to judge every claim.

Mix three kinds of claims in each body, and spread them through the text:
- **over-label** (about 5 per report): a claim stated with more strength, scope, certainty or authority than the appendix supports — it is not simply false, it is overstated. Vary the ways a report can overstate; do not use the same kind twice in one report.
- **control** (about 5 per report): a claim the appendix supports exactly as stated, including claims that are appropriately hedged or limited.
- **distractor** (about 2 per report): a plain error against the appendix — a wrong number, a miscount, an arithmetic slip, a misread table cell.

Then write the answer key to key/key.json — a JSON array, one object per claim: {"report": "report1.md", "sentence": "<the claim's exact sentence, copied verbatim from the body>", "kind": "over-label" | "control" | "distractor", "why": "<one line: what the appendix actually supports>"}. Every sentence must occur exactly once in its report. Put nothing about the key, the experiment or claim kinds inside the reports themselves.

Before finishing, re-read each report against its appendix and confirm every claim's kind is right. Return a 4-line summary: the domains and the counts per kind.
