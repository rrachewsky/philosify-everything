-- ============================================================
-- PHILOSIFY QUIZ - Batch 9: Overflow to guarantee 500+
-- 25 questions in underserved areas
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES

('american_exceptionalism', 5, 'What is the philosophical significance of the Gettysburg Address?',
  '[{"text": "Lincoln redefined America as a nation dedicated to the proposition of equality — transforming the Constitution from a legal compact into a moral commitment", "correct": true}, {"text": "It was about the geography of Gettysburg"}, {"text": "It declared war"}, {"text": "It was a military tactical report"}]',
  'In 272 words, Lincoln transformed the meaning of the Civil War from preserving the Union to fulfilling the Declaration''s promise of equality. He performed a philosophical act: reinterpreting the founding for a new era.',
  '{"1": "The address transcended geography to make a universal philosophical claim.", "2": "War had already been declared years earlier.", "3": "It was a philosophical speech, not a military briefing."}'),

('american_exceptionalism', 6, 'What is the concept of "federalism" and what philosophical problem does it solve?',
  '[{"text": "Dividing sovereignty between national and state governments — it solves the problem of governing a large, diverse nation while preserving local self-governance and individual liberty", "correct": true}, {"text": "A type of hat"}, {"text": "Loyalty to the federal government only"}, {"text": "A European concept with no American application"}]',
  'Madison argued that federalism creates multiple centers of power that check each other. Local government handles local affairs; national government handles national ones. Neither can dominate completely.',
  '{"1": "Federalism is a constitutional structure, not an accessory.", "2": "Federalism divides sovereignty; it does not concentrate it in the federal government.", "3": "Federalism is a distinctly American innovation in its constitutional form."}'),

('american_exceptionalism', 7, 'How does the American concept of "natural aristocracy" (Jefferson/Adams) differ from hereditary aristocracy?',
  '[{"text": "Natural aristocracy is based on virtue and talent, emerging through merit; hereditary aristocracy is based on birth and blood — America was designed to elevate the former and prevent the latter", "correct": true}, {"text": "They are the same"}, {"text": "America has no concept of aristocracy"}, {"text": "Natural aristocracy means ruling by force of nature"}]',
  'Jefferson and Adams corresponded about whether society naturally produces an elite — and whether that elite should be based on merit (Jefferson) or include wealth and birth (Adams). America''s answer was meritocracy.',
  '{"1": "They represent fundamentally different principles of social organization.", "2": "The founders explicitly discussed and designed institutions around the concept of natural aristocracy.", "3": "It means leadership by the most virtuous and talented, not physical strength."}'),

('american_exceptionalism', 8, 'What is the philosophical basis of judicial review as established in Marbury v. Madison?',
  '[{"text": "Marshall argued that the Constitution is supreme law; any statute that contradicts it is void; and it is the judiciary''s role to say what the law is — grounding judicial review in constitutional supremacy", "correct": true}, {"text": "That judges are always right"}, {"text": "That the president controls the courts"}, {"text": "That Congress cannot pass laws"}]',
  'Judicial review was not explicitly stated in the Constitution. Marshall derived it from the logic of a written constitution as supreme law. If the Constitution limits government, someone must enforce those limits — and that someone is the judiciary.',
  '{"1": "Judicial review means the judiciary interprets the Constitution, not that judges are infallible.", "2": "Judicial review makes the courts independent from the executive.", "3": "Congress can pass laws; judicial review checks whether they are constitutional."}'),

('aesthetics', 4, 'What is the philosophical debate about whether photography is art?',
  '[{"text": "Critics argued photography merely copies reality mechanically; defenders argue the photographer''s choices (framing, timing, light) make it a creative act as interpretive as painting", "correct": true}, {"text": "Everyone agrees photography is art"}, {"text": "Photography is always better than painting"}, {"text": "Photography has no aesthetic qualities"}]',
  'Baudelaire dismissed photography as art''s enemy. Benjamin saw it as transforming art''s nature. Sontag analyzed how photography changes our relationship with reality. The debate continues with AI-generated images.',
  '{"1": "The debate has been ongoing since photography''s invention in the 1830s.", "2": "Different media have different aesthetic strengths; neither is simply ''better.''", "3": "Photography raises profound aesthetic questions about reproduction, reality, and authorship."}'),

('aesthetics', 7, 'What is the philosophical distinction between "art" and "craft"?',
  '[{"text": "Traditionally, art expresses ideas and emotions through creative vision; craft produces functional objects through skilled technique — but this boundary has been increasingly challenged", "correct": true}, {"text": "Craft is always inferior to art"}, {"text": "Art requires no skill"}, {"text": "They are completely identical"}]',
  'Collingwood distinguished art (expression) from craft (technique applied to a predetermined end). But movements like Arts and Crafts (Morris), Bauhaus, and contemporary design philosophy challenge this hierarchy.',
  '{"1": "Quality in both art and craft depends on execution and vision.", "2": "Art requires enormous skill; the distinction is about purpose, not ability.", "3": "While they overlap, the traditional distinction reflects real differences in aims."}'),

('music', 6, 'What is the philosophical significance of music notation?',
  '[{"text": "Notation allows music to exist independently of any particular performance, raising questions about the ontology of music — is the ''work'' the score, the performance, or the experience?", "correct": true}, {"text": "Notation makes music louder"}, {"text": "Notation was invented by computers"}, {"text": "Notation is unnecessary for all music"}]',
  'Nelson Goodman analyzed music as an ''allographic'' art (like literature) where the work is defined by a notation system, unlike ''autographic'' arts (painting) where the original object matters. This has implications for authenticity and identity.',
  '{"1": "Notation preserves and transmits music; it does not affect volume.", "2": "Musical notation dates to ancient Greece and medieval Europe, long before computers.", "3": "While oral traditions exist, notation is essential for the Western classical tradition."}'),

('music', 9, 'What is the philosophical debate about whether music can be "true" or "false"?',
  '[{"text": "Formalists deny music can be true or false (it has no propositional content); expressivists argue music can be ''true to'' human experience in ways that propositions cannot capture", "correct": true}, {"text": "Music is always true"}, {"text": "Music is always false"}, {"text": "Truth does not apply to any art"}]',
  'This debate connects music to broader questions about non-propositional truth. Can a Mahler symphony be ''true'' about grief? Heidegger, Adorno, and Langer all argue that art reveals truths inaccessible to language.',
  '{"1": "The question is precisely whether truth-talk applies to music.", "2": "Music neither states truths nor states falsehoods in the ordinary sense.", "3": "Many philosophers argue that truth applies to art in an extended but genuine sense."}'),

('cinema', 8, 'What is Slavoj Žižek''s approach to cinema as philosophy?',
  '[{"text": "Žižek uses popular films to illustrate Lacanian psychoanalysis and Hegelian dialectics — treating cinema not as mere entertainment but as a site where ideological fantasies become visible and analyzable", "correct": true}, {"text": "Žižek only watches documentaries"}, {"text": "Žižek rejects cinema"}, {"text": "Žižek is a film director"}]',
  'In "The Pervert''s Guide to Cinema" and numerous writings, Žižek demonstrates how films like "The Matrix," "Psycho," and "Aliens" reveal the hidden structures of desire, ideology, and subjectivity that organize everyday life.',
  '{"1": "Žižek analyzes blockbusters, comedies, thrillers — popular cinema, not just documentaries.", "2": "Žižek considers cinema one of the most important philosophical mediums of our time.", "3": "Žižek is a philosopher who analyzes cinema, not a filmmaker."}'),

('cinema', 10, 'What is the philosophical concept of "suture" in film theory?',
  '[{"text": "The process by which cinema ''stitches'' the viewer into the film''s symbolic order — through shot/reverse-shot and point-of-view editing, the viewer unconsciously takes up a subject position within the narrative", "correct": true}, {"text": "A medical procedure shown in films"}, {"text": "Joining film reels together"}, {"text": "A type of special effect"}]',
  'Jean-Pierre Oudart and Daniel Dayan, drawing on Lacan, argued that classical editing techniques create an ideological effect: the viewer is sutured into a position of apparent mastery over the image, concealing the apparatus that constructs that position.',
  '{"1": "Suture in film theory is about the construction of viewing subjectivity, not medical procedures.", "2": "It concerns the psychological effect of editing, not the physical joining of film strips.", "3": "It is a theoretical concept about how cinema positions the viewer, not a visual effect."}'),

('economics', 6, 'What is the philosophical concept of "spontaneous order" in economics?',
  '[{"text": "Complex economic coordination emerges from individual choices guided by prices, without any central planner — markets are self-organizing systems that produce order no single mind designed", "correct": true}, {"text": "People spontaneously decide to be orderly"}, {"text": "An economic system without rules"}, {"text": "Random economic activity"}]',
  'Hayek''s central insight: the market order is not designed by anyone, yet it coordinates billions of decisions more effectively than any plan could. Prices transmit information that no central authority could collect or process.',
  '{"1": "Spontaneous order describes an emergent phenomenon, not individual decisions to be orderly.", "2": "Spontaneous order operates within rules (property rights, contracts); it is not lawless.", "3": "It produces order, not randomness — that is precisely the insight."}'),

('economics', 7, 'What is the "Nirvana fallacy" in policy analysis?',
  '[{"text": "Comparing real-world markets (with their imperfections) against an idealized, perfect alternative rather than against realistic alternative institutional arrangements", "correct": true}, {"text": "A Buddhist economic theory"}, {"text": "An investment strategy"}, {"text": "A retirement planning mistake"}]',
  'Harold Demsetz coined this term: critics who point to ''market failure'' often compare real markets against a perfect theoretical alternative, rather than against the realistic alternatives (government intervention, which also has failures).',
  '{"1": "The ''Nirvana'' refers to an unattainable ideal used as an unfair benchmark, not to Buddhism.", "2": "It is about policy reasoning, not financial investing.", "3": "It concerns economic methodology, not retirement."}'),

('law', 6, 'What is "restorative justice" and how does it differ from retributive justice?',
  '[{"text": "Restorative justice focuses on repairing harm through dialogue between victims, offenders, and communities; retributive justice focuses on punishing the offender proportionally to the crime", "correct": true}, {"text": "Restoring old buildings"}, {"text": "A justice system for restaurants"}, {"text": "They are the same approach"}]',
  'Restorative justice draws on indigenous traditions and communitarian philosophy. It asks: what harm was done, and how can it be repaired? Rather than asking: what rule was broken, and what punishment fits?',
  '{"1": "''Restorative'' refers to repairing relationships and harm, not physical restoration.", "2": "It applies to the criminal justice system, not hospitality.", "3": "They represent fundamentally different philosophies of justice."}'),

('law', 7, 'What is the philosophical problem of "victimless crimes"?',
  '[{"text": "Whether the state is justified in punishing behavior that harms no one but the consenting actor — challenging Mill''s harm principle against paternalism and moral legislation", "correct": true}, {"text": "Crimes where the victim cannot be found"}, {"text": "Minor traffic violations"}, {"text": "White-collar crime"}]',
  'Mill argued that society may only restrict liberty to prevent harm to others. Drug use, gambling, and prostitution between consenting adults challenge this: if no one is harmed (or the actor harms only themselves), what justifies criminalization?',
  '{"1": "''Victimless'' means no non-consenting party is harmed, not that the victim is missing.", "2": "Traffic violations have potential victims (other drivers); victimless crimes involve only consenting participants.", "3": "White-collar crime has victims (defrauded parties); victimless crimes by definition do not."}'),

('virtues', 4, 'What is the vice of cowardice according to Aristotle?',
  '[{"text": "Excessive fear that prevents one from doing what is right — the deficiency opposite of the virtue of courage, which is the mean between cowardice and recklessness", "correct": true}, {"text": "Being physically weak"}, {"text": "Running in a race"}, {"text": "Being quiet"}]',
  'For Aristotle, cowardice is not simply feeling fear (which is natural) but being controlled by fear to the point of failing to act rightly. The coward avoids danger even when honor, duty, or justice demands facing it.',
  '{"1": "Cowardice is a moral failing, not a physical one.", "2": "Running from danger can be prudent; cowardice is fleeing from what you ought to face.", "3": "Quietness is not cowardice; one can be silent and courageous."}'),

('virtues', 9, 'What is the "moral psychology" debate about whether virtues are emotions, dispositions, or skills?',
  '[{"text": "Some argue virtues are stable character traits (dispositions), others that they are well-calibrated emotional responses, and others that they are practical skills requiring intelligent responsiveness — each has different implications for moral education", "correct": true}, {"text": "A debate about psychology degrees"}, {"text": "Whether psychologists are virtuous"}, {"text": "A therapy technique"}]',
  'If virtues are dispositions, moral education is about habituation. If emotions, it is about emotional attunement. If skills, it is about practice and feedback. The answer shapes how we think about moral development, blame, and praise.',
  '{"1": "It concerns the nature of virtue, not academic credentials.", "2": "It is about what virtues ARE, not whether specific people have them.", "3": "It is a philosophical debate, not a clinical method."}');
