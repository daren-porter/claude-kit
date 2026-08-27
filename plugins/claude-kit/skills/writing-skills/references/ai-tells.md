# Machine-Prose Tells

A catalog of the patterns that make a document read as machine-written. An author drafting kit prose reads it before finishing a draft; a reviewer of a document hunts the patterns by name and quotes the passage. It is a negative standard: it says what to avoid, and it does not prescribe a house voice.

Everything below applies to prose the author wrote, and never to material reproduced verbatim: a quotation, a fenced `suggestion` body, copied vendor or upstream text. Editing one of those is the harm rather than the fix, since an edited quotation is one the author cannot find in their own file and an edited `suggestion` body writes an altered byte into their code the moment they accept it, so a tell inside reproduced material is not a finding at all (`plugins/claude-kit/skills/pr-review/SKILL.md` states the same rule for PR comments, with the near-miss behind it).

None of these is wrong in isolation. What marks the prose is the pattern held without variation: one triad is a sentence, a triad in every paragraph is a signature. So the finding is almost always about frequency and uniformity, not about a single line, and a reviewer should say which it is.

## Em dashes

A single em dash is a finding on its own. The rule and its replacements ship at `plugins/claude-kit/assets/CLAUDE.md` under Style Rules, which is the authority here: "No em dashes, anywhere: prose, documents, and code comments alike. Use regular dashes, commas, periods, or parentheses." Cite that shipped path rather than the user's live global CLAUDE.md, which is where `reconcile-claude-md` lands it and which an adopter who never reconciled does not have. The verbatim exemption above holds here too: an em dash inside a quotation or a `suggestion` body stays.

## Triadic rhythm as the default

Three-item lists and three-clause sentences are the machine's resting cadence. Human enumeration is lumpy: two items here, five there, one that needs its own sentence.

Tell: "The service is fast, reliable, and secure. It handles authentication, authorization, and auditing across the web, mobile, and API surfaces."

Rewrite: "The service handles authentication and authorization. It also writes an audit record for every call, which is the part that matters when a customer disputes a charge."

The rewrite drops one item, keeps two, and spends the saved words on why the second one earns its place. When a real set has three members, write three. The finding is a document where nearly every set has three.

## "It is not X, it is Y" contrast framing

The negation-then-correction construction manufactures a reversal the reader never proposed. It also flatters: the writer sets up a naive view, attributes it to no one, and knocks it down.

Tell: "This is not a configuration change. It is a change to how the system thinks about identity."

Rewrite: "The change moves identity resolution out of the config file and into the token itself."

Same claim, no staged reversal. Note the family resemblance to the `However,` pivot, which is licensed: that pivot sets up a real position a real reader holds, then argues against it. The tell is the pivot against a straw position invented one clause earlier.

## Rhetorical questions

The question the reader never asked, posed so the writer can supply the answer they already had. It lands in body prose as a transition, and as a document's opening line or a header in question form.

Tell: "Why does tenant resolution matter here? Because a caller who can address another tenant's data is a breach." Or the header `Why Do We Split Permissions?`

Rewrite: "A caller who can address another tenant's data is a breach, so the gateway resolves the tenant from the token rather than the request body." For the header: `Split Permissions`.

The licensed exception is the self-answer device: the question and its answer in the same breath, used at most once in a document and never twice.

## Uniform paragraph and sentence length

Every paragraph three sentences, every sentence twenty-five words. Human paragraphs vary because arguments vary: some points need a page, some need four words.

Sentence length varying deliberately is the positive rule. The measurable version of the tell: take the sentence lengths in a section and look at the spread. A document whose sentences all sit within a few words of each other reads as generated even when every sentence is true.

Tell: "The service validates every inbound request against the schema before it reaches the handler, which keeps malformed payloads out of the business logic. The handler then resolves the tenant from the token rather than from the request body, so a caller cannot address another tenant's data. Each write is recorded in the audit table with the resolved tenant and the caller's identity attached before the response goes back." Three sentences of 23, 23 and 22 words, and the next two paragraphs are built the same way.

Rewrite: "The service validates every inbound request against the schema before it reaches the handler, and resolves the tenant from the token rather than the request body, so a caller cannot address another tenant's data. Every write lands in the audit table. That last part is what an auditor actually asks for."

## A bolded lead-in on every bullet

**Bold term:** followed by an explanation is a real pattern, licensed for catalogs and field lists. Applied to every bullet in a document, including bullets carrying an argument rather than a term a reader looks up, it turns prose into a rack of labels and signals that the labels were generated before the content.

Tell:

- **Performance:** Queries return faster.
- **Reliability:** Fewer failures occur.
- **Cost:** Spend goes down.

Rewrite: "The cache cuts the median tenant lookup from 300 milliseconds to 4, and the read replica stopped falling over at month end. It takes about 40 percent off the query bill as well, which is not why we built it."

Three ways out, and the document decides which. Where the reader scans for the term rather than reading start to finish, keep the bullets and the bold: a catalog entry, a field list, a lookup table, and this kit's own skills and agent charters, where an agent under pressure hunts the one rule that fits its situation and the bold term is the handle it hunts by. That licenses a bolded bullet whose body carries an argument, because the argument is what the reader needs once the label has found it for them. Where the bullet is a sentence rather than a catalog entry, keep the bullets and drop the labels. Where the bullets were only a way to make a paragraph look organized, write the paragraph.

## Signposting and throat-clearing

"It is worth noting that", "importantly", "in essence", "at its core", "simply put", "Net effect:". Each one spends a clause telling the reader how to receive the next clause. Cut them and the sentence is unchanged, which is the test.

Tell: "It is worth noting that the migration is reversible."

Rewrite: "The migration is reversible."

"In conclusion" and "To summarize" at the head of a closing section are the same move at document scale, and fail the same test: the reader can see which section is last.

What survives the test is a genuine contrast marker with an antecedent, `However,` or `That said,`, because removing it changes the logical relation. The tell is the marker with no position behind it to turn against.

`plugins/claude-kit/agents/pr-reviewer.md` and `plugins/claude-kit/skills/pr-review/SKILL.md` carry the four-item operational version of this list for PR comment drafts: "Net effect:", "In essence,", "It's worth noting", "This ensures". The last of those is the finite-verb form of the trailing participial tail below and is caught there rather than by the cut test, since cutting it drops the claim instead of leaving the sentence unchanged. This entry is the long list, and an edit to either should not leave the two further apart.

## Explaining what the reader is about to read

A paragraph that describes the structure of the section following it. The reader can see the section.

Tell: "The following section walks through the three components of the design, covering what each one does and how it connects to the others."

Rewrite: delete it and start with the section's thesis sentence.

One narrow version is licensed: a scope statement early in the document that says what the piece will and will not cover. That is a boundary, not a preview. The tell is the preview repeated at the head of every section.

## A closing paragraph that restates the body

The summary that adds nothing, recognizable because every sentence in it appeared earlier with different words.

The close that earns its place is the opposite move: it states the *end state*, what the reader now has after applying the design. That is new information, arrived at by the body rather than repeated from it.

Tell: "In summary, the design separates the two roles, restricts the permissions on each, and audits the boundary between them."

Rewrite: "The result is an operator who can run every report and cannot read a single card number."

## Every section ending on a one-line moral

The aphoristic sentence, set off alone, that tells the reader what the section meant. Doing it once is emphasis. Doing it at the foot of every section is a template.

Tell: a section on retry policy that ends "Resilience is not a feature you add later." A section on logging that ends "You cannot fix what you cannot see."

Rewrite: end on the concrete consequence instead. "A request that fails all three retries lands in the dead-letter queue with the original payload intact."

The licensed version is a short summary paragraph, and it differs in kind: it restates the section's *conclusion about the subject*, not a portable maxim that would fit any document.

## The vocabulary set

Certain words appear far more often in generated prose than in written prose, and a reader who reads a lot of both now flags them on sight: `delve`, `robust`, `seamless`, `comprehensive`, `streamline`, `crucial`, `landscape` (figurative), `realm`, `myriad`, `testament to`, `navigate` (figurative), `in today's [adjective] world`, and `ensure` used where `make sure` or a plain verb would do. A second set is motivational rather than merely overused: `unlock`, `leverage`, `empower`, `transform`, `game-changer`, `world-class`.

Tell: "In today's fast-moving compliance landscape, a comprehensive audit trail is crucial to ensuring seamless reporting."

Rewrite: "An auditor who asks who approved a refund on 14 March needs one query to answer it. The audit trail is what makes that query possible."

Two notes for a reviewer. First, none of these words is banned: `robust` in a statistics context and `ensure` in a contract clause are the right words, and so is the literal sense of the motivational set (`transform` a payload, `unlock` an account). The finding is density and figurative use. Second, replacing the word and keeping the empty sentence fixes nothing; the sentence above is a tell because it asserts no fact, and the rewrite works because it adds one.

## Over-parallel headers

Headers built from a template: five sections all reading "Understanding X", or all gerunds, or all the same syllable count. Real sections are not the same shape, and forcing the headers into one shape usually means a section was bent to fit its label.

Tell: `Understanding the Problem` / `Understanding the Solution` / `Understanding the Tradeoffs`

Rewrite: `The Failure` / `Split Permissions` / `Cost At Volume`

The positive form is short noun phrases with one case convention per document. This tell is about the headers being too alike, which passes that check and still reads as generated.

## Trailing participial clauses

The comma-plus-participle tail: ", ensuring that", ", allowing teams to", ", making it easy to", ", providing a foundation for". It appends a benefit to a fact without arguing for it, and it can be stacked forever, which is why generated prose stacks it. The same move in a fresh sentence with a finite verb ("This ensures consistent latency.") is the same finding.

Tell: "The gateway caches the token, reducing round trips and allowing downstream services to authorize locally, ensuring consistent latency."

Rewrite: "The gateway caches the token. Downstream services authorize against the cached copy, which removes a network hop from every call after the first."

One of these tails in a document is fine. Three in a paragraph is the pattern.

## The non-committal verdict

A close that lists options, assigns each a merit, and declines to pick.

Tell: "Both approaches have their merits, and the right choice depends on your specific needs and priorities."

Rewrite: "Take the queue. It costs an extra service to run, and it is the only option that survives the warehouse being offline for a shift."

This one is a defect in the close as well as a tell: the close is supposed to state the net result. A document that reaches its last paragraph without a verdict usually did not have one.

## Stacked hedges

Hedges more than one deep on a single claim. Each hedge buys the writer distance from the claim, and stacked they leave a sentence that cannot be wrong because it no longer says anything.

Tell: "This may potentially be somewhat slower under load, though it is possible the effect is limited."

Rewrite: "This is probably slower under load. Nobody has measured it above 200 requests a second."

One hedge on a genuinely uncertain claim is the honest form and stays; marking speculation as speculation is not a tell. The finding is the second and third hedge on the same claim.

## Bullets that restate the paragraph above them

A prose paragraph makes the argument; a bullet list immediately after repeats the same points as fragments. The list looks like structure and carries no new content.

Tell: "The rollout is staged by region. We start in Canada because it is the smallest book, move to the United Kingdom once a full billing cycle has closed there, and finish in the United States." Followed immediately by:

- **Canada:** first, because it is the smallest book.
- **United Kingdom:** second, after a full billing cycle closes in Canada.
- **United States:** last.

Rewrite: "The rollout is staged by region, smallest book first, each region waiting on a full billing cycle in the one before it."

- **Canada:** 3 March, owned by Priya.
- **United Kingdom:** 7 April, owned by Tom.
- **United States:** 12 May, owned by Priya.

Keep both only where each carries something the other does not. Here the paragraph holds the argument and the list holds dates and owners the paragraph never had, so neither restates the other. Where the list would only re-say the sentence, cut the list.

## Weightless intensifiers

`truly`, `really`, `incredibly`, `highly`, `vital`, `essential`, `powerful`, `significantly` with no figure behind it. The adjectival version of this is the hype adjective unsupported by a number; the adverbial version survives a hype-word check by attaching to ordinary words instead of marketing ones.

Tell: "This is a highly effective approach that significantly reduces load."

Rewrite: "The approach cuts read load on the primary by about 60 percent at peak."

---

Adapted from `plugins/claude-kit/skills/scott-writing-style/references/ai-tells.md` in the upstream kit `SApplefeld/sapplefeld-claude-kit`, at commit `ba1060b`: the catalog landed at `a5fce80` and the upstream finishing pass amended it, so `ba1060b` is the version this adaptation worked from.
