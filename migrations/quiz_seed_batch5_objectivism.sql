-- ============================================================
-- PHILOSIFY QUIZ - Batch 5: Objectivism Questions
-- 30 Objectivism questions across all difficulties
-- Tagged with region = 'objectivism'
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES

('ethics', 1, 'What is the central moral principle of Objectivism?',
  '[{"text": "Rational self-interest — pursuing your own happiness through reason and productive achievement", "correct": true}, {"text": "Self-sacrifice for the collective good"}, {"text": "Obedience to divine authority"}, {"text": "Following majority opinion"}]',
  'Ayn Rand held that each individual''s own life is their ultimate value, and that the moral purpose of life is the pursuit of one''s own rational happiness. This is virtuous self-interest, not hedonism or exploitation.',
  '{"1": "Self-sacrifice is what Objectivism explicitly rejects as the basis of morality.", "2": "Objectivism holds that morality is grounded in reason, not divine command.", "3": "Objectivism holds that truth is not determined by consensus."}',
),

('quotes', 1, 'Who wrote: "The question isn''t who is going to let me; it''s who is going to stop me"?',
  '[{"text": "Ayn Rand", "correct": true}, {"text": "Friedrich Nietzsche"}, {"text": "Ralph Waldo Emerson"}, {"text": "Mark Twain"}]',
  'This quote, often attributed to Rand, captures the Objectivist spirit of self-determination — the individual does not need permission from others to pursue their goals and values.',
  '{"1": "Nietzsche championed individual will but this specific quote is Rand''s.", "2": "Emerson valued self-reliance but this phrasing is Rand''s.", "3": "Twain was known for wit, not this particular sentiment."}',
),

('epistemology', 2, 'What is Objectivism''s view of reason?',
  '[{"text": "Reason is man''s only means of acquiring knowledge and his basic tool of survival", "correct": true}, {"text": "Reason is one option among faith and intuition"}, {"text": "Reason is overrated and emotions are more reliable"}, {"text": "Reason only applies to mathematics"}]',
  'Rand held that reason — the faculty that identifies and integrates the material provided by the senses — is man''s only absolute. Faith, emotion, and revelation are not valid means of cognition.',
  '{"1": "Objectivism rejects faith and intuition as cognitive methods.", "2": "Objectivism holds that emotions are not tools of cognition; they are consequences of value judgments.", "3": "Objectivism applies reason to all domains of human life, not just mathematics."}',
),

('politics', 2, 'What political system does Objectivism advocate?',
  '[{"text": "Laissez-faire capitalism — full separation of state and economics, with government limited to protecting individual rights", "correct": true}, {"text": "Socialism"}, {"text": "Theocracy"}, {"text": "Anarchy"}]',
  'Rand argued that capitalism is the only moral political system because it is the only system based on the recognition of individual rights, including property rights. Government exists solely to protect rights through police, courts, and military.',
  '{"1": "Objectivism considers socialism a system of legalized theft that violates individual rights.", "2": "Objectivism separates state from religion as firmly as from economics.", "3": "Objectivism holds that government is necessary to protect rights — anarchy leaves rights unprotected."}',
),

('aesthetics', 2, 'What is the role of art according to Objectivism?',
  '[{"text": "Art concretizes abstract values and gives humans a direct experience of their deepest convictions about life and existence", "correct": true}, {"text": "Art has no purpose"}, {"text": "Art should only depict suffering"}, {"text": "Art is merely decoration"}]',
  'Rand defined art as "a selective re-creation of reality according to an artist''s metaphysical value-judgments." Art makes abstract philosophy tangible, allowing people to experience what they believe about the nature of existence.',
  '{"1": "Objectivism gives art a profound cognitive and psychological purpose.", "2": "Objectivism celebrates heroic, life-affirming art, not suffering for its own sake.", "3": "Objectivism views art as a fundamental human need, not mere decoration."}',
),

('metaphysics', 3, 'What are the three axioms of Objectivist metaphysics?',
  '[{"text": "Existence exists, consciousness is conscious, and A is A (the law of identity)", "correct": true}, {"text": "God exists, the soul is immortal, and free will is an illusion"}, {"text": "Nothing is real, everything is relative, and truth is subjective"}, {"text": "Matter is primary, mind is secondary, and change is constant"}]',
  'Rand held that these axioms are self-evident and underlie all knowledge. To deny any of them requires using them — you must exist, be conscious, and use identity to deny existence, consciousness, or identity.',
  '{"1": "Objectivism rejects the existence of God as unproven and holds that the soul is not immortal.", "2": "Objectivism holds that reality is objective, not relative or subjective.", "3": "While related to materialism, Objectivism has its own specific axioms."}',
),

('ethics', 3, 'What does Objectivism mean by "sacrifice"?',
  '[{"text": "Giving up a greater value for a lesser value or no value — NOT all trade-offs or acts of generosity", "correct": true}, {"text": "Any time you help someone else"}, {"text": "Any difficult choice"}, {"text": "Giving money to charity"}]',
  'Rand distinguished sacrifice (trading a higher value for a lower one) from a rational trade (exchanging a lesser value for a greater one). Helping a loved one is not sacrifice if they are a genuine value to you.',
  '{"1": "Helping someone you value is rational self-interest, not sacrifice.", "2": "Difficult choices that serve your values are not sacrifices.", "3": "Giving to charity can be rational if aligned with your values — it becomes sacrifice only when it harms your life."}',
),

('virtues', 3, 'What are the seven Objectivist virtues?',
  '[{"text": "Rationality, independence, integrity, honesty, justice, productiveness, and pride", "correct": true}, {"text": "Faith, hope, charity, prudence, justice, fortitude, temperance"}, {"text": "Humility, obedience, poverty, chastity, patience, kindness, diligence"}, {"text": "Wisdom, courage, temperance, justice"}]',
  'Rand derived these seven virtues from the fundamental value of man''s life and the standard of rational self-interest. Rationality is the primary virtue from which the others follow.',
  '{"1": "These are the cardinal and theological virtues of Christianity, which Objectivism rejects.", "2": "Objectivism explicitly rejects humility and obedience as virtues.", "3": "These are Plato''s four cardinal virtues, which Objectivism expands upon."}',
),

('economics', 3, 'What does Objectivism say about the "common good"?',
  '[{"text": "There is no ''common good'' apart from the good of each individual — the concept is used to justify sacrificing individuals to the collective", "correct": true}, {"text": "The common good should always override individual interests"}, {"text": "Only economists can determine the common good"}, {"text": "The common good is whatever the government decides"}]',
  'Rand argued that rights are individual, not collective. The concept of "the common good" or "the public interest" has no objective definition and historically serves as justification for tyranny over individuals.',
  '{"1": "Objectivism holds that individual rights cannot be overridden by any collective claim.", "2": "Objectivism rejects the idea that any group can define the ''common good'' for individuals.", "3": "Objectivism rejects government authority to define the good for individuals."}',
),

('applied', 4, 'What is the Objectivist critique of environmentalism?',
  '[{"text": "That environmentalism often values nature above human life and well-being, subordinating individual rights to ecological collectivism", "correct": true}, {"text": "That the environment does not exist"}, {"text": "That pollution is always good"}, {"text": "That technology should be abandoned"}]',
  'Objectivism supports human use of nature through reason and technology. It opposes environmentalism that treats nature as intrinsically valuable at the expense of human flourishing, or that uses environmental claims to justify expanding government power.',
  '{"1": "Objectivism acknowledges the physical environment exists; it disputes the moral claims made about it.", "2": "Objectivism does not endorse pollution; it supports rational, property-rights-based solutions.", "3": "Objectivism celebrates technology as a product of the human mind."}',
),

('ethics', 4, 'What is the Objectivist view of altruism?',
  '[{"text": "Altruism — the moral duty to live for others — is a destructive doctrine that sacrifices the individual to the collective and breeds resentment and dependency", "correct": true}, {"text": "Altruism is the highest virtue"}, {"text": "Objectivism says you should never help anyone"}, {"text": "Altruism and selfishness are the same thing"}]',
  'Rand distinguished altruism (the moral obligation to sacrifice for others) from benevolence (voluntary goodwill toward others based on shared values). Objectivism opposes the duty to sacrifice, not kindness or generosity.',
  '{"1": "Objectivism considers altruism a destructive moral code, not a virtue.", "2": "Objectivism supports voluntary benevolence; it opposes the duty to sacrifice.", "3": "They are moral opposites in Objectivist philosophy."}',
),

('history', 4, 'How did Ayn Rand''s experience in Soviet Russia shape her philosophy?',
  '[{"text": "Witnessing collectivism''s destruction of individual lives firsthand drove her to develop a philosophy that makes individual rights and rational self-interest the foundation of morality", "correct": true}, {"text": "She supported the Soviet system"}, {"text": "She had no experience with collectivism"}, {"text": "She was born in America"}]',
  'Born Alisa Rosenbaum in St. Petersburg in 1905, Rand lived through the Russian Revolution and saw her father''s business confiscated. She escaped to America in 1926, determined to defend individual rights against collectivism.',
  '{"1": "Rand was a lifelong opponent of Soviet communism and all forms of collectivism.", "2": "Rand''s entire philosophy was shaped by her direct experience of collectivism.", "3": "Rand was born in Russia and emigrated to America at age 21."}',
),

('epistemology', 5, 'What is Objectivism''s theory of concepts?',
  '[{"text": "Concepts are formed by a process of measurement omission — abstracting common characteristics from particular instances while omitting specific measurements", "correct": true}, {"text": "Concepts are innate ideas implanted by God"}, {"text": "Concepts are arbitrary social constructions"}, {"text": "Concepts are impossible to form"}]',
  'Rand''s "Introduction to Objectivist Epistemology" argues that concepts are objective mental integrations formed by abstracting similarities among concretes. This grounds knowledge in reality while explaining the power of abstraction.',
  '{"1": "Objectivism rejects innate ideas; all knowledge begins with sensory perception.", "2": "Objectivism holds that concepts are objective — they correspond to real similarities in nature, not arbitrary social conventions.", "3": "Objectivism holds that concept formation is man''s basic cognitive method."}',
),

('aesthetics', 5, 'What is Romantic Realism in Objectivist aesthetics?',
  '[{"text": "An artistic method that portrays the world as it could and should be — depicting idealized but achievable human values through realistic means", "correct": true}, {"text": "Painting only romantic landscapes"}, {"text": "Writing only love stories"}, {"text": "Copying photographs exactly"}]',
  'Rand advocated Romantic Realism: art should present human beings as capable of greatness (Romantic) while grounding that vision in recognizable reality (Realism). Victor Hugo and Dostoevsky were examples she admired.',
  '{"1": "Romantic Realism encompasses all subjects, not just landscapes.", "2": "It applies to all art forms and themes, not just romance.", "3": "It involves selective re-creation, not photographic copying."}',
),

('ethics', 5, 'What is the "trader principle" in Objectivist ethics?',
  '[{"text": "Rational people interact by voluntary exchange of value for value, never seeking the unearned or giving the undeserved", "correct": true}, {"text": "A theory about stock market trading"}, {"text": "The idea that everyone should be a merchant"}, {"text": "A rule about international trade agreements"}]',
  'The trader principle applies to all human relationships, not just commerce. In friendships, love, and work, rational people exchange value — spiritual, emotional, intellectual — never demanding sacrifice or offering it.',
  '{"1": "The trader principle is a moral principle that applies to all relationships, not just financial ones.", "2": "It is about the moral basis of all human interaction, not a specific profession.", "3": "It is an ethical principle, not a trade policy."}',
),

('politics', 5, 'How does Objectivism differentiate between economic power and political power?',
  '[{"text": "Economic power is the ability to produce and trade — it relies on voluntary exchange. Political power is the ability to use physical force — it relies on coercion. Only political power can violate rights.", "correct": true}, {"text": "They are identical"}, {"text": "Economic power is more dangerous"}, {"text": "Political power cannot be abused"}]',
  'Rand argued that a rich person can only offer you a trade; a government official can put you in prison. The confusion between economic and political power is used to justify attacking capitalism for problems caused by government.',
  '{"1": "Objectivism draws a sharp distinction between the power to produce and the power to compel.", "2": "Objectivism holds that only political power (the gun) can violate rights; economic power (the dollar) cannot.", "3": "Objectivism holds that political power is uniquely dangerous because it involves force."}',
),

('metaphysics', 6, 'What is Objectivism''s view on the primacy of existence vs. primacy of consciousness?',
  '[{"text": "Existence has primacy — reality exists independent of consciousness, and consciousness must conform to reality, not the other way around", "correct": true}, {"text": "Consciousness creates reality"}, {"text": "Reality and consciousness are unrelated"}, {"text": "Neither exists"}]',
  'Rand held that the primacy of existence is the fundamental principle of Objectivism. Wishing, believing, or feeling that something is true does not make it so. Consciousness is a faculty of perceiving that which exists.',
  '{"1": "This is the primacy of consciousness, which Objectivism rejects as the root of mysticism.", "2": "Objectivism holds that consciousness is OF existence — they are intimately related.", "3": "Objectivism affirms the existence of both reality and consciousness."}',
),

('virtues', 6, 'Why does Objectivism consider pride a virtue rather than a vice?',
  '[{"text": "Pride is moral ambitiousness — the commitment to achieving one''s highest potential and being worthy of one''s own moral approval", "correct": true}, {"text": "Objectivism encourages arrogance"}, {"text": "Pride means thinking you are better than everyone"}, {"text": "Pride is only about appearance"}]',
  'Rand defined pride as "the recognition of the fact that you are your own highest value, and, like all of man''s values, it has to be earned." It is the virtue of moral self-esteem based on actual achievement.',
  '{"1": "Objectivist pride is earned through achievement, not asserted without basis — arrogance is unearned self-importance.", "2": "Pride is about living up to your own standards, not comparing yourself to others.", "3": "Objectivist pride is about moral character, not superficial appearance."}',
),

('epistemology', 7, 'What is the Objectivist critique of Kant''s epistemology?',
  '[{"text": "Rand argued Kant divorced reason from reality by claiming we can never know things as they are in themselves, making reason impotent and opening the door to mysticism and collectivism", "correct": true}, {"text": "Rand agreed with Kant on everything"}, {"text": "Rand never discussed Kant"}, {"text": "Kant was an Objectivist"}]',
  'Rand considered Kant the most influential opponent of reason in Western philosophy. By arguing that the mind imposes categories on an unknowable noumenal world, Kant severed the connection between reason and reality that Objectivism demands.',
  '{"1": "Rand considered Kant her primary philosophical adversary.", "2": "Rand devoted significant attention to refuting Kant in her philosophical writings.", "3": "Kant and Rand hold fundamentally opposite positions on nearly every philosophical question."}',
),

('ethics', 7, 'What is the Objectivist resolution of the "is-ought" problem?',
  '[{"text": "The nature of a living organism — its requirements for survival — bridges the gap between fact and value. Life is the standard that makes ''ought'' objective.", "correct": true}, {"text": "Objectivism ignores the is-ought problem"}, {"text": "Objectivism agrees with Hume that values are subjective"}, {"text": "Objectivism says the problem is unsolvable"}]',
  'Rand argued that the concept of "value" presupposes the concept of "life." Only living things can have values. The alternative of life or death makes the concept of value — and therefore of "ought" — possible and objective.',
  '{"1": "Objectivism directly addresses and claims to resolve the is-ought problem.", "2": "Objectivism holds that values are objective, grounded in the requirements of human life.", "3": "Objectivism claims to solve the problem through the concept of life as the standard of value."}',
),

('politics', 7, 'What is the Objectivist theory of rights?',
  '[{"text": "Rights are moral principles defining individual freedom of action in a social context — they are derived from the nature of man as a rational being and are negative (freedom from coercion), not positive (entitlements to goods)", "correct": true}, {"text": "Rights are granted by the government"}, {"text": "Rights are whatever the majority decides"}, {"text": "Rights do not exist"}]',
  'Rand argued that rights are not permissions from government but moral facts about the conditions required for human survival. The right to life means the right to act on your own judgment — not the right to have others provide for you.',
  '{"1": "Objectivism holds that rights precede government; government exists to protect pre-existing rights.", "2": "Objectivism holds that individual rights cannot be voted away by any majority.", "3": "Objectivism affirms the existence and objective nature of individual rights."}',
),

('aesthetics', 8, 'How does Objectivism evaluate Naturalism in art?',
  '[{"text": "Naturalism (depicting people ''as they are'') is philosophically flawed because art''s purpose is not to copy reality but to concretize the artist''s view of what is important — selectivity is essential", "correct": true}, {"text": "Objectivism loves Naturalism"}, {"text": "Naturalism and Romantic Realism are identical"}, {"text": "Objectivism has no theory of art movements"}]',
  'Rand argued that Naturalism (Zola, later Dreiser) presents an undiscriminating record of events, implying that man is a helpless creature determined by forces beyond his control. This metaphysical view negates human agency and choice.',
  '{"1": "Objectivism critiques Naturalism for its deterministic metaphysics.", "2": "They represent opposing artistic philosophies — Naturalism copies; Romantic Realism selectively re-creates.", "3": "Objectivism has a detailed theory of artistic movements based on their metaphysical premises."}',
),

('history', 8, 'What is the significance of Galt''s Speech in the history of philosophy?',
  '[{"text": "It is a 60-page philosophical treatise embedded in ''Atlas Shrugged'' that systematically presents Objectivism — one of the few complete philosophical systems delivered through fiction", "correct": true}, {"text": "It is a famous political speech from the 1960s"}, {"text": "It is a chapter about labor unions"}, {"text": "It has no philosophical content"}]',
  'John Galt''s radio address in "Atlas Shrugged" (1957) covers metaphysics, epistemology, ethics, politics, and aesthetics in a single sustained argument. It is unprecedented as a vehicle for presenting a complete philosophy within a novel.',
  '{"1": "Galt''s Speech is fictional, spoken by a character in a novel, not a historical political speech.", "2": "It covers the entire Objectivist philosophy, far beyond labor relations.", "3": "It is one of the most philosophically dense passages in American literature."}',
),

('ethics', 9, 'How does Objectivism distinguish between the "hero" and the "martyr"?',
  '[{"text": "The hero risks or gives their life for values they love — their action serves their highest values. The martyr gives their life as a duty to others, renouncing personal values. One acts from love, the other from obligation.", "correct": true}, {"text": "They are the same"}, {"text": "Objectivism rejects both"}, {"text": "Only martyrs are moral"}]',
  'Rand argued that a man who dies fighting for his freedom is a hero — he acts for HIS highest value. A man who dies because others demand his sacrifice is a martyr. The hero''s motivation is love of values; the martyr''s is duty to surrender them.',
  '{"1": "The distinction between hero and martyr is essential to Objectivist ethics.", "2": "Objectivism celebrates the hero and rejects the martyr as a moral ideal.", "3": "Objectivism holds that the hero, not the martyr, represents the moral ideal."}',
),

('metaphysics', 9, 'What is the Objectivist argument against determinism?',
  '[{"text": "Man''s consciousness has a specific nature — the ability to focus or not — and this volitional focusing of awareness is the fundamental choice that makes all other choices possible", "correct": true}, {"text": "Objectivism is determinist"}, {"text": "Free will is a religious concept that Objectivism rejects"}, {"text": "Objectivism avoids the free will debate"}]',
  'Rand located the root of free will in the choice to focus one''s mind — to think or not to think. This is not determined by prior causes; it is an irreducible primary. All other choices follow from this fundamental act of cognitive volition.',
  '{"1": "Objectivism explicitly affirms free will and rejects determinism.", "2": "Objectivism grounds free will in the nature of consciousness, not in religion.", "3": "Free will is a cornerstone of Objectivist philosophy."}',
),

('epistemology', 10, 'What is the Objectivist critique of the analytic-synthetic dichotomy?',
  '[{"text": "Leonard Peikoff argued that the distinction between ''analytic'' truths (true by definition) and ''synthetic'' truths (true by fact) rests on a false theory of meaning — all truths are both factual and definitional", "correct": true}, {"text": "Objectivism accepts the analytic-synthetic distinction"}, {"text": "Peikoff never wrote about this"}, {"text": "The dichotomy is about chemistry"}]',
  'In his essay "The Analytic-Synthetic Dichotomy" (published in Rand''s "Introduction to Objectivist Epistemology"), Peikoff argued that the dichotomy smuggles in a false theory of concepts as arbitrary conventions disconnected from reality.',
  '{"1": "Objectivism explicitly rejects the analytic-synthetic dichotomy as philosophically destructive.", "2": "Peikoff''s essay on this topic is one of the key works in Objectivist epistemology.", "3": "The analytic-synthetic dichotomy is a philosophical distinction about knowledge, not chemistry."}',
),

('politics', 10, 'What is Rand''s argument for why capitalism is the only moral political system?',
  '[{"text": "Only capitalism recognizes individual rights as inviolable, bans the initiation of physical force from human relationships, and leaves people free to act on their own rational judgment", "correct": true}, {"text": "Because it makes everyone rich"}, {"text": "Because Rand liked money"}, {"text": "Because all other systems are unpopular"}]',
  'Rand argued that capitalism is moral not because it is efficient (though it is) but because it is the only system consistent with man''s nature as a rational being who requires freedom to survive. Every other system initiates force against individuals.',
  '{"1": "Rand''s argument is moral, not economic — capitalism is right because it respects rights, not because it creates wealth.", "2": "Rand''s defense of capitalism is philosophical, not personal.", "3": "Rand''s argument is based on moral principles, not popularity."}',
);
