# Prompts used in the C35 experiment

Local paths are shown as repo-relative paths.

## Reviewer prompt, arm A (baseline)

> You are reviewing four short reports for problems. Read only these four files: drafts/report1.md, report2.md, report3.md and report4.md in that folder. Do not open any other file or folder.
>
> Each report has a body followed by an "Evidence appendix". Check every claim in each body against its own appendix and list each problem you find. For each finding, copy the exact sentence from the body, verbatim, and say briefly what is wrong.
>
> Write your findings as a JSON array to reviews/review_A_<model>_<run>.json in this form: [{"report": "report1.md", "quote": "<exact sentence from the body>", "problem": "<what is wrong>"}]. If writing the file is refused, return the JSON array as your final message instead. Otherwise return one line giving the number of findings.

## Reviewer prompt, arm B (with C35)

Identical to arm A (output file `review_B_<model>_<run>.json`), with this paragraph inserted before the output instruction:

> Apply this check while reviewing (from a reasoning skill, quoted verbatim):
> `C35 [R32-Claim-Strength]`: Every claim in a report, rule or ruling carries its strength: measured on cases the method never saw; in-sample; verified against the source (quoted, with its address); inference; or design choice. A reviewer checks the label, not only the claim. In Passes R29–R31 every fresh-reader review found at least one instance of the same distortion: true claims labelled stronger than their evidence. (Adopted from five reviews and not yet measured as a check. The first R32 draft broke it three times, and the R32 review caught them.) In-sample rates were presented as general, "follows Ra" was claimed where Ra partly agreed, a guide's inference was shown as Ra's words, and a message blamed the correct number. A message from a check states a disagreement, not which side is wrong.

## Blind judge (exploratory part only; run after scoring)

One Sonnet agent, one pass, given only report1.md, report2.md and report4.md. It was not told which sentences were keyed, unplanted or controls.

> Blind judging task. Read only these files: drafts/report1.md, report2.md and report4.md. Do not open any other file or folder.
>
> Each report has a body and an "Evidence appendix". For each of the eight sentences below, judge it against its own report's appendix and answer either SUPPORTED (the appendix supports it as stated) or OVERSTATED (stated with more strength, scope or certainty than the appendix supports), with one line of reason. Judge each on its own merits; some are supported and some may not be.
>
> 1. report2.md: "The vestry responded by laying a rate for the poor, recorded on folio 38v."
> 2. report1.md: "KVLite did not complete the 100M-key bulk insert in any of its three attempts, because the operating system terminated it for exhausting memory."
> 3. report1.md: "The appendix lists the software versions and configuration used, so that the run can be repeated."
> 4. report4.md: "Specimen S08 exceeded the 0.10 mm acceptance limit, with a permanent set of 0.21 mm."
> 5. report4.md: "The test plan and the laboratory log are reproduced in the appendix."
> 6. report2.md: "The 1911 editor judged that several entries were written up some weeks after the dates they carry."
> 7. report2.md: "Folio and page references for every passage are given in the appendix, together with the counts by quarter and by topic."
> 8. report1.md: "Marlin's peak resident memory during bulk insert was 5.1 GB, the highest of the three stores."

Items 2, 4, 6 and 8 are keyed controls; 1, 3, 5 and 7 are the unplanted sentences reviewers flagged. The judge's verdicts, with its reasons condensed:

| # | Verdict | Reason (condensed) |
|---|---|---|
| 1 | OVERSTATED | Q3 records the rate but gives no cause; "responded" is the report's own causal inference. |
| 2 | SUPPORTED | A6: all three runs killed by the OOM killer. |
| 3 | SUPPORTED | A1 lists versions and configuration; "the purpose clause is only a mild stretch", since the harness is unpublished. |
| 4 | SUPPORTED | F4: S08 at 0.21 mm against the 0.10 mm limit. |
| 5 | OVERSTATED (borderline) | F1 and F5 give extracts, not the full plan and log. |
| 6 | SUPPORTED | Q7 says so. |
| 7 | SUPPORTED | E6 gives a reference for every quoted passage; E2 and E3 give the counts. |
| 8 | SUPPORTED | A4: 5.1 GB is the highest. |

The four controls were never flagged by any reviewer, so the judge's agreement on them does not calibrate it on borderline sentences.
