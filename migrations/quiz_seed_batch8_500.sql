-- ============================================================
-- PHILOSIFY QUIZ - Batch 8: Push past 500
-- 60 questions filling remaining gaps
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES

('aesthetics', 4, 'What is kitsch in aesthetic theory?',
  '[{"text": "Art that exploits easy emotions and avoids genuine confrontation with reality — sentimentality masquerading as depth", "correct": true}, {"text": "A type of kitchen"}, {"text": "Expensive art"}, {"text": "Art made by children"}]',
  'Milan Kundera defined kitsch as "the absolute denial of shit" — the refusal to acknowledge the ugly, difficult, or ambiguous aspects of existence. Kitsch provides false comfort through predetermined emotional responses.',
  '{"1": "Kitsch is an aesthetic concept, not a room type.", "2": "Kitsch is often cheap and mass-produced, not expensive.", "3": "Children''s art is often more honest than kitsch."}'),

('aesthetics', 6, 'What is the "death of the author" thesis?',
  '[{"text": "Roland Barthes argued that a text''s meaning is created by the reader, not the author — the author''s intentions and biography are irrelevant to interpretation", "correct": true}, {"text": "That authors die young"}, {"text": "A murder mystery genre"}, {"text": "That books should be anonymous"}]',
  'Barthes''s 1967 essay challenged the Romantic idea of the author as the source of textual meaning. Instead, meaning arises from the reader''s engagement with the text — each reading creates a new work.',
  '{"1": "It is about interpretive authority, not literal death.", "2": "It is a literary theory, not a genre.", "3": "It concerns interpretation, not authorial identity."}'),

('aesthetics', 8, 'What is Hegel''s thesis about the "end of art"?',
  '[{"text": "Art was the highest expression of Spirit in ancient Greece, but philosophy has superseded it — art can no longer be the primary vehicle for truth in the modern world", "correct": true}, {"text": "That art stopped being made after Hegel"}, {"text": "That Hegel disliked art"}, {"text": "That only philosophy should exist"}]',
  'Hegel saw art, religion, and philosophy as three stages of Spirit''s self-understanding. Greek sculpture perfectly embodied Spirit, but modern consciousness has become too complex and reflective for art alone — philosophy is now the highest form of truth.',
  '{"1": "Art continues; Hegel meant its role as the highest truth-vehicle has ended.", "2": "Hegel deeply valued art and wrote extensive aesthetic lectures.", "3": "Hegel saw all three — art, religion, philosophy — as necessary; philosophy is simply the culmination."}'),

('aesthetics', 9, 'What is Jacques Rancière''s concept of the "distribution of the sensible"?',
  '[{"text": "The system that determines what is visible, sayable, and thinkable in a society — art is political because it can redistribute what can be perceived and who counts as a political subject", "correct": true}, {"text": "A theory about distributing art supplies"}, {"text": "How museums arrange exhibits"}, {"text": "A sensory deprivation technique"}]',
  'Rancière argues that aesthetics and politics share a common root: both concern who gets to be seen and heard. Art disrupts existing perceptual orders, making visible what was invisible — the excluded, the silenced, the unthinkable.',
  '{"1": "It concerns the political structure of perception, not physical art materials.", "2": "It is about social visibility, not gallery curation.", "3": "It concerns what can be perceived, not the removal of sensory input."}'),

('aesthetics', 10, 'What is Adorno''s famous claim that "to write poetry after Auschwitz is barbaric"?',
  '[{"text": "Not a literal ban on poetry, but a challenge: after the Holocaust, art must confront the question of whether aesthetic beauty can coexist with the reality of absolute horror without becoming complicit in its concealment", "correct": true}, {"text": "That Adorno banned all poetry"}, {"text": "That poetry caused the Holocaust"}, {"text": "That only prose is acceptable after 1945"}]',
  'Adorno later nuanced this claim, acknowledging that art may be the only adequate response to suffering. But his provocation remains: art that beautifies or harmonizes after Auschwitz risks making horror bearable — and therefore repeatable.',
  '{"1": "Adorno revised and deepened this claim throughout his career.", "2": "The claim is about art''s moral responsibility, not causal blame.", "3": "Adorno valued poetry; he meant that all art must now reckon with historical catastrophe."}'),

('history', 4, 'What was the philosophical impact of World War I?',
  '[{"text": "It shattered Enlightenment optimism about human progress and reason, giving rise to existentialism, absurdism, and the crisis of meaning that defined 20th-century philosophy", "correct": true}, {"text": "It had no philosophical impact"}, {"text": "It proved that progress is inevitable"}, {"text": "It only affected military strategy"}]',
  'The unprecedented destruction of WWI demolished the 19th century''s faith in progress, reason, and civilization. Heidegger, Wittgenstein, and the Vienna Circle all emerged from this crisis; existentialism was born from it.',
  '{"1": "WWI was one of the most philosophically consequential events in modern history.", "2": "It proved the opposite — that ''progress'' could lead to catastrophe.", "3": "Its impact extended far beyond military affairs into every domain of thought."}'),

('history', 6, 'What was the philosophical significance of the Scientific Revolution?',
  '[{"text": "It established empirical observation and mathematical modeling as the primary paths to knowledge, displacing Aristotelian authority and theological dogma", "correct": true}, {"text": "It only affected chemistry"}, {"text": "It had no philosophical consequences"}, {"text": "It proved that religion is wrong"}]',
  'Galileo, Newton, and others demonstrated that nature follows mathematical laws discoverable through experiment. This transformed epistemology (how we know), metaphysics (what reality is), and the relationship between faith and reason.',
  '{"1": "The Scientific Revolution affected all sciences and reshaped philosophy entirely.", "2": "It transformed epistemology, metaphysics, ethics, and political philosophy.", "3": "It challenged certain religious claims but did not ''disprove'' religion as such."}'),

('history', 8, 'What was the significance of the Davos debate between Cassirer and Heidegger (1929)?',
  '[{"text": "It dramatized the conflict between Enlightenment rationalism (Cassirer) and existential-ontological philosophy (Heidegger) — symbolizing the philosophical crisis that preceded the rise of fascism", "correct": true}, {"text": "A debate about skiing"}, {"text": "An economics conference"}, {"text": "A cooking competition"}]',
  'Cassirer defended the Enlightenment legacy of reason, culture, and human freedom. Heidegger challenged the foundations of this tradition, arguing that human finitude and anxiety are more fundamental than reason. The philosophical world split.',
  '{"1": "Davos is a Swiss town, but this was a philosophical confrontation, not a sporting event.", "2": "The Davos debate was philosophical, not economic (the World Economic Forum came later).", "3": "It was one of the most significant philosophical events of the 20th century."}'),

('history', 9, 'What was the philosophical significance of the Port-Royal Logic (1662)?',
  '[{"text": "It was the first modern logic textbook, combining Cartesian epistemology with Aristotelian logic and establishing formal reasoning as essential to clear thinking across all domains", "correct": true}, {"text": "A history of French ports"}, {"text": "A naval training manual"}, {"text": "A guide to wine production"}]',
  'Antoine Arnauld and Pierre Nicole''s "Logic, or the Art of Thinking" shaped education for two centuries. It introduced the distinction between comprehension and extension of terms, anticipating modern predicate logic.',
  '{"1": "Port-Royal was a monastery, not a port; the Logic was a philosophical work.", "2": "It concerned reasoning, not navigation.", "3": "Port-Royal was a center of Jansenist theology and philosophy, not viticulture."}'),

('history', 10, 'What is the philosophical significance of the Axial Age?',
  '[{"text": "Between 800-200 BC, major civilizations independently developed philosophical and religious systems — Socrates, Buddha, Confucius, the Hebrew prophets — suggesting universal features of human moral and intellectual development", "correct": true}, {"text": "A period when axles were invented"}, {"text": "A geological era"}, {"text": "A theory about the Earth''s tilt"}]',
  'Karl Jaspers coined "Axial Age" to describe this extraordinary period when humans across disconnected civilizations began asking the same fundamental questions about morality, meaning, death, and the good life.',
  '{"1": "''Axial'' refers to a pivot point in human consciousness, not mechanical axes.", "2": "It is a concept in philosophy of history, not geology.", "3": "It concerns intellectual history, not astronomy."}'),

('economics', 4, 'What is the difference between socialism and communism?',
  '[{"text": "Socialism advocates collective or state ownership of the means of production; communism envisions a classless, stateless society where property is communally owned — communism is the ''final stage'' in Marxist theory", "correct": true}, {"text": "They are exactly the same"}, {"text": "Socialism is capitalist"}, {"text": "Communism supports free markets"}]',
  'Marx saw socialism as a transitional phase where the state controls the economy, leading eventually to communism where the state ''withers away.'' In practice, socialist states never reached the communist stage.',
  '{"1": "They share roots but differ in degree and ultimate vision.", "2": "Socialism opposes private ownership of means of production; it is not capitalist.", "3": "Communism envisions the abolition of private property, not free markets."}'),

('economics', 6, 'What is "rent-seeking" and why is it philosophically significant?',
  '[{"text": "Using political influence to gain wealth without creating value — lobbying for subsidies, tariffs, or regulations that benefit you at others'' expense", "correct": true}, {"text": "Seeking apartments to rent"}, {"text": "A theory about landlords"}, {"text": "A real estate strategy"}]',
  'Rent-seeking reveals how government power distorts markets. When it''s more profitable to lobby for privileges than to innovate, resources flow from production to political manipulation — corrupting both the economy and the political system.',
  '{"1": "Economic ''rent-seeking'' concerns political privilege, not housing.", "2": "It applies to all forms of political favor-seeking, not just property.", "3": "It is a concept in political economy, not real estate."}'),

('economics', 8, 'What is the "Lucas critique" and why does it matter for economic policy?',
  '[{"text": "Robert Lucas argued that economic relationships observed under one policy regime will change when policy changes — because rational agents adjust their behavior to new rules, invalidating predictions based on past data", "correct": true}, {"text": "A film criticism method"}, {"text": "A critique of George Lucas''s films"}, {"text": "A manufacturing quality standard"}]',
  'The Lucas critique (1976) undermined Keynesian macroeconomic models that assumed stable relationships between variables. It showed that policy evaluation requires modeling how people respond to policy changes — transforming macroeconomics.',
  '{"1": "Robert Lucas is an economist, not a film critic.", "2": "Lucas here is economist Robert Lucas, not filmmaker George Lucas.", "3": "It concerns economic methodology, not manufacturing."}'),

('economics', 9, 'What is the "Mundell-Tobin effect" and how does it relate to monetary neutrality?',
  '[{"text": "Anticipated inflation causes people to shift from money to capital, lowering the real interest rate and increasing investment — showing that money is not neutral even when inflation is expected", "correct": true}, {"text": "A medical condition"}, {"text": "A photography technique"}, {"text": "A weather phenomenon"}]',
  'This effect challenges the classical dichotomy between real and nominal variables. Even fully anticipated inflation changes real behavior — people hold less cash and more capital, affecting the real economy. Money is never truly neutral.',
  '{"1": "It is an economic theory, not a medical condition.", "2": "It concerns monetary economics, not photography.", "3": "It is about inflation, not meteorology."}'),

('economics', 10, 'What is the "Cambridge capital controversy" and why does it threaten neoclassical economics?',
  '[{"text": "Joan Robinson and Piero Sraffa showed that ''capital'' cannot be measured independently of the rate of profit it is supposed to determine — creating a logical circularity at the foundation of neoclassical distribution theory", "correct": true}, {"text": "A dispute about Cambridge University buildings"}, {"text": "A debate about education policy"}, {"text": "A controversy about British vs. American English"}]',
  'The Cambridge UK economists demonstrated that aggregate capital cannot be coherently defined without already knowing the distribution of income — which is what capital theory was supposed to explain. This exposed a fatal circularity.',
  '{"1": "The controversy concerned the foundations of economic theory, not university property.", "2": "It was about the logical structure of economics, not educational policy.", "3": "''Cambridge'' refers to the universities (Cambridge UK vs. MIT) whose economists debated, not to language."}'),

('law', 4, 'What is the concept of "separation of powers"?',
  '[{"text": "Dividing government into legislative, executive, and judicial branches so that no single branch can accumulate unchecked power", "correct": true}, {"text": "Separating electricity from water"}, {"text": "Dividing a company into departments"}, {"text": "Keeping church and state separate"}]',
  'Montesquieu articulated this principle in "The Spirit of the Laws" (1748). Madison implemented it in the U.S. Constitution, adding checks and balances so each branch can restrain the others.',
  '{"1": "Separation of powers is a constitutional principle, not an engineering one.", "2": "While businesses have divisions, separation of powers is about government structure.", "3": "Church-state separation is a related but distinct principle."}'),

('law', 6, 'What is the philosophical tension between security and liberty?',
  '[{"text": "More security often requires limiting freedoms (surveillance, detention, censorship), while more liberty may increase vulnerability — finding the right balance is a central challenge of political philosophy", "correct": true}, {"text": "There is no tension; security and liberty are identical"}, {"text": "Security always trumps liberty"}, {"text": "Liberty always trumps security"}]',
  'Benjamin Franklin warned against trading liberty for safety. Hobbes argued security is the primary purpose of government. The tension is real and irreducible — every society must negotiate this balance based on its values.',
  '{"1": "They often conflict, requiring difficult trade-offs.", "2": "Neither automatically overrides the other; context matters.", "3": "Both are essential values; the question is how to balance them."}'),

('law', 8, 'What is the "counter-majoritarian difficulty" in constitutional law?',
  '[{"text": "The problem of justifying judicial review — unelected judges overriding the decisions of elected majorities — in a system committed to democratic self-governance", "correct": true}, {"text": "A problem with counting votes"}, {"text": "When the majority is always wrong"}, {"text": "A mathematical paradox"}]',
  'Alexander Bickel named this problem: how can we justify giving unelected judges the power to strike down laws passed by democratic legislatures? Defenders argue rights need protection from majorities; critics call it judicial oligarchy.',
  '{"1": "It concerns the legitimacy of judicial power, not vote counting.", "2": "It does not claim the majority is always wrong, just that they can be constrained.", "3": "It is a constitutional theory problem, not a mathematical one."}'),

('law', 9, 'What is the philosophical debate about "originalism vs. living constitutionalism" in its deepest form?',
  '[{"text": "It is ultimately a debate about the nature of legal meaning itself — whether texts have fixed meanings determined at enactment or whether meaning evolves with changing social understandings", "correct": true}, {"text": "A debate about which constitution is older"}, {"text": "Whether to use original or photocopied documents"}, {"text": "A debate about handwriting styles"}]',
  'The originalism debate is really a hermeneutic problem: do texts have objective meanings fixed by authorial intent and original public meaning, or are meanings constituted in the act of interpretation? This is Gadamer vs. Hirsch applied to law.',
  '{"1": "It is about interpretive theory, not the age of documents.", "2": "It concerns how to read legal texts, not physical copies.", "3": "It is about textual meaning, not calligraphy."}'),

('law', 10, 'What is the philosophical significance of the Nuremberg Trials for jurisprudence?',
  '[{"text": "They established that ''following orders'' is not a legal defense, that individuals bear moral responsibility for crimes against humanity, and that some laws are so unjust they are not truly law — reviving natural law theory", "correct": true}, {"text": "They only concerned military tactics"}, {"text": "They had no legal significance"}, {"text": "They established that governments can do whatever they want"}]',
  'Nuremberg forced a reckoning between legal positivism (Nazi laws were valid law) and natural law (some acts are crimes regardless of what positive law says). The trials'' legacy shaped international criminal law and human rights doctrine.',
  '{"1": "The trials addressed crimes against humanity, not just military conduct.", "2": "They fundamentally shaped international law and jurisprudence.", "3": "They established the opposite — that government power has moral limits."}'),

('virtues', 4, 'What is the relationship between virtue and happiness in Greek philosophy?',
  '[{"text": "The Greeks generally held that virtue is necessary for happiness (eudaimonia) — you cannot truly flourish while living viciously, regardless of wealth or pleasure", "correct": true}, {"text": "The Greeks thought virtue and happiness are unrelated"}, {"text": "Only wealth produces happiness"}, {"text": "The Greeks rejected the concept of happiness"}]',
  'Socrates argued that a just person is always happier than an unjust one. Aristotle held that virtue is necessary but not sufficient for happiness — external goods also matter. The Stoics went further: virtue alone guarantees happiness.',
  '{"1": "The connection between virtue and happiness was central to Greek ethics.", "2": "Greek philosophy generally subordinated wealth to virtue as a source of happiness.", "3": "Eudaimonia (flourishing/happiness) was the central concept of Greek ethics."}'),

('virtues', 6, 'What is the concept of "moral luck" as it applies to virtue?',
  '[{"text": "Whether you can be truly virtuous depends partly on circumstances beyond your control — someone never tested by adversity may have untested virtue that could fail under pressure", "correct": true}, {"text": "That lucky people are more virtuous"}, {"text": "That virtue is random"}, {"text": "A gambling strategy"}]',
  'This challenges virtue ethics: if character is partly shaped by luck (upbringing, circumstances, genetic temperament), can we take full credit for our virtues or blame others for their vices? Aristotle acknowledged fortune''s role in flourishing.',
  '{"1": "Moral luck concerns the role of circumstance in character, not that lucky people are better.", "2": "Virtue is developed through choice and practice, but circumstances affect the opportunities for development.", "3": "It is a philosophical concept, not a strategy."}'),

('virtues', 8, 'What is the "thick-thin" distinction in virtue concepts?',
  '[{"text": "Thick concepts (courageous, cruel, generous) combine description and evaluation; thin concepts (good, bad, right, wrong) are purely evaluative — this distinction shapes debates about moral objectivity", "correct": true}, {"text": "A theory about body types"}, {"text": "A cooking terminology"}, {"text": "A paper quality measurement"}]',
  'Bernard Williams argued that thick concepts like ''cruel'' or ''brave'' are both descriptive and evaluative — they describe behavior AND judge it. This challenges the fact-value distinction because thick concepts seem to be both factual and moral.',
  '{"1": "It is a meta-ethical distinction, not about physical characteristics.", "2": "It concerns moral language, not culinary arts.", "3": "It is about the nature of evaluative concepts, not materials."}'),

('metaphysics', 4, 'What is personal identity? What makes you the same person over time?',
  '[{"text": "Philosophers debate whether identity depends on the soul, the body, psychological continuity (memory and personality), or whether there is no enduring self at all", "correct": true}, {"text": "Your name makes you the same person"}, {"text": "Your fingerprints"}, {"text": "Your social security number"}]',
  'Locke argued memory makes identity. Hume denied a permanent self. Parfit argued personal identity is not what matters — what matters is psychological continuity, which comes in degrees. Buddhism similarly denies a fixed self.',
  '{"1": "Names can change; the philosophical question is deeper.", "2": "Fingerprints identify a body, but personal identity is about the person, not just the body.", "3": "Administrative identifiers are not the philosophical concept of personal identity."}'),

('metaphysics', 6, 'What is the "zombie argument" in philosophy of mind?',
  '[{"text": "If we can conceive of a being physically identical to us but lacking consciousness, then consciousness is not reducible to physical properties — challenging physicalism", "correct": true}, {"text": "An argument about horror movies"}, {"text": "A theory about sleep deprivation"}, {"text": "A debate about the undead in folklore"}]',
  'David Chalmers argues that philosophical zombies (p-zombies) are conceivable: beings that behave exactly like us but have no inner experience. If conceivable, consciousness is not logically necessitated by physics — an extra fact is needed.',
  '{"1": "Philosophical zombies are thought experiments, not horror creatures.", "2": "P-zombies are fully functional; the issue is about consciousness, not exhaustion.", "3": "The argument uses ''zombie'' as a technical philosophical term, not the folklore concept."}'),

('metaphysics', 8, 'What is the "problem of the many" in metaphysics?',
  '[{"text": "For any ordinary object like a cloud, there are many slightly different collections of particles that equally qualify as ''the cloud'' — so either there are many clouds where we see one, or our concept of individuation is flawed", "correct": true}, {"text": "A problem with overpopulation"}, {"text": "A mathematical counting problem"}, {"text": "A crowd management issue"}]',
  'Peter Unger and others showed that vagueness in object boundaries creates a puzzle: which precise collection of water droplets IS the cloud? Every candidate collection has equal claim. This challenges our basic concept of ''a thing.''',
  '{"1": "It concerns the metaphysics of objects, not population.", "2": "It is a philosophical problem about identity, not arithmetic.", "3": "It concerns the boundaries of objects, not managing people."}'),

('metaphysics', 10, 'What is the "grounding" relation in contemporary metaphysics?',
  '[{"text": "A non-causal explanatory relation where one fact holds IN VIRTUE OF another — moral facts might be grounded in natural facts, mental facts in physical facts, without being reducible to them", "correct": true}, {"text": "Electrical grounding"}, {"text": "Grounding an airplane"}, {"text": "Being punished by parents"}]',
  'Grounding (Fine, Rosen, Schaffer) is the relation that holds when one fact metaphysically depends on another. It offers a middle path between reduction and brute emergence — facts can be explained by more fundamental facts without being identical to them.',
  '{"1": "Philosophical grounding is about explanatory dependence, not electricity.", "2": "It is about metaphysical structure, not aviation.", "3": "It is a technical philosophical concept, not about discipline."}'),

('epistemology', 4, 'What is confirmation bias?',
  '[{"text": "The tendency to seek, interpret, and remember information that confirms pre-existing beliefs while ignoring contradictory evidence", "correct": true}, {"text": "Confirming a hotel reservation"}, {"text": "A bias in confirmation hearings"}, {"text": "A type of religious ceremony"}]',
  'Confirmation bias is one of the most pervasive cognitive biases. Francis Bacon identified it in 1620: "The human understanding, when it has once adopted an opinion, draws all things else to support and agree with it."',
  '{"1": "It is a cognitive bias, not a hospitality procedure.", "2": "It is about reasoning, not political processes.", "3": "It is a psychological phenomenon, not a religious one."}'),

('epistemology', 6, 'What is the "Duhem-Quine thesis"?',
  '[{"text": "Scientific hypotheses cannot be tested in isolation — any test involves background assumptions, so a failed prediction can always be blamed on auxiliary hypotheses rather than the theory itself", "correct": true}, {"text": "A theory about French-American relations"}, {"text": "A cooking method"}, {"text": "A dental procedure"}]',
  'This thesis shows that theory testing is never conclusive. When an experiment fails, we can always save the theory by adjusting assumptions. This underdetermination of theory by evidence has profound implications for scientific methodology.',
  '{"1": "Duhem and Quine are philosophers of science, not diplomats.", "2": "It concerns scientific methodology, not cuisine.", "3": "It is about the logic of testing, not dentistry."}'),

('epistemology', 8, 'What is "epistemic injustice" as defined by Miranda Fricker?',
  '[{"text": "Wronging someone in their capacity as a knower — through testimonial injustice (discounting their testimony due to prejudice) or hermeneutical injustice (lacking concepts to understand their experience)", "correct": true}, {"text": "An unjust grading system"}, {"text": "A courtroom procedural error"}, {"text": "Being wrong about something"}]',
  'Fricker showed that social power structures affect who gets believed and whose experiences get named. A woman reporting harassment in an era without the concept ''sexual harassment'' suffers hermeneutical injustice — she cannot articulate her experience.',
  '{"1": "It concerns social dimensions of knowledge, not academic grading.", "2": "It is broader than legal procedures — it concerns all testimony and understanding.", "3": "It is about being wronged as a knower, not simply being mistaken."}'),

('epistemology', 10, 'What is the "new evil demon problem" for reliabilism?',
  '[{"text": "A subject in a demon world with unreliable perceptual processes can have the same justification as their counterpart in the actual world — challenging reliabilism''s claim that justification requires actually reliable processes", "correct": true}, {"text": "A new horror movie"}, {"text": "A computer virus"}, {"text": "A theory about demonic possession"}]',
  'Cohen and Lehrer showed that if a Cartesian demon deceives your counterpart, their beliefs are equally well justified as yours — they reason identically. But their processes are unreliable. So reliability cannot be what constitutes justification.',
  '{"1": "It is a philosophical thought experiment, not entertainment.", "2": "''Demon'' is used metaphorically, as in Descartes; it has nothing to do with computers.", "3": "It is epistemology, not theology or demonology."}'),

('politics', 4, 'What is civil disobedience?',
  '[{"text": "Deliberately breaking an unjust law openly and accepting the legal consequences, to appeal to the conscience of the community and change the law", "correct": true}, {"text": "Any form of protest"}, {"text": "Violent revolution"}, {"text": "Ignoring laws you dislike"}]',
  'Thoreau, Gandhi, and King developed the philosophy of civil disobedience. It requires: (1) targeting an unjust law, (2) acting openly, (3) accepting punishment, and (4) appealing to higher moral principles.',
  '{"1": "Civil disobedience is a specific form of protest with particular philosophical requirements.", "2": "Civil disobedience is nonviolent by definition.", "3": "It requires publicly accepting consequences, not secretly ignoring laws."}'),

('politics', 6, 'What is the philosophical concept of "legitimacy" in government?',
  '[{"text": "The moral right to rule — a government is legitimate when it governs with the genuine consent of the governed and respects their fundamental rights", "correct": true}, {"text": "Having a lot of money"}, {"text": "Winning elections by any means"}, {"text": "Being the oldest institution"}]',
  'Locke argued that government derives legitimacy from consent. Weber identified three types: traditional (custom), charismatic (personal authority), and rational-legal (rule of law). Without legitimacy, government is merely organized coercion.',
  '{"1": "Wealth does not confer political legitimacy.", "2": "Fraudulent elections undermine rather than establish legitimacy.", "3": "Age alone does not confer legitimacy; tyrannies can be ancient."}'),

('politics', 8, 'What is the "democratic peace thesis" and what are its philosophical implications?',
  '[{"text": "The observation that democracies rarely go to war with each other — suggesting that political institutions shape international behavior and that spreading democracy could reduce conflict", "correct": true}, {"text": "That peace is democratic"}, {"text": "That all democracies are peaceful"}, {"text": "That war is always wrong"}]',
  'Kant predicted in "Perpetual Peace" (1795) that republican governments would avoid war because citizens bear war''s costs. Empirical evidence largely supports this between democracies, though democracies do fight non-democracies.',
  '{"1": "The thesis is about a statistical pattern, not a tautology.", "2": "Democracies do fight wars — just not against each other.", "3": "The thesis does not make a blanket moral claim about all war."}'),

('politics', 9, 'What is Jürgen Habermas''s concept of the "public sphere"?',
  '[{"text": "A social space where private individuals come together as a public to discuss matters of common concern, forming public opinion that can hold state power accountable", "correct": true}, {"text": "A public park"}, {"text": "A government building"}, {"text": "A sphere-shaped public monument"}]',
  'Habermas traced the emergence of the bourgeois public sphere in 18th-century coffeehouses and newspapers, where rational-critical debate among citizens created a counterweight to state authority. Its decline through commercialization concerns him.',
  '{"1": "The public sphere is a social concept, not a physical space.", "2": "It is about civil society, not government institutions.", "3": "''Sphere'' is metaphorical, referring to a domain of discourse."}'),

('politics', 10, 'What is Giorgio Agamben''s concept of "bare life" and the "state of exception"?',
  '[{"text": "Sovereign power creates ''bare life'' — human beings stripped of political rights who can be killed without legal consequence — and the ''state of exception'' (emergency powers) tends to become the norm in modern politics", "correct": true}, {"text": "A minimalist lifestyle"}, {"text": "A bare-bones budget"}, {"text": "An exceptional state in geography"}]',
  'Agamben argues that the concentration camp, not the city, is the paradigm of modern politics — a space where law is suspended and human beings are reduced to biological existence without political protection. He traces this logic from Roman law through Guantánamo.',
  '{"1": "''Bare life'' is a political-philosophical concept about the reduction of personhood, not lifestyle.", "2": "It concerns political sovereignty, not finances.", "3": "''State of exception'' refers to emergency powers, not a geographical location."}');
