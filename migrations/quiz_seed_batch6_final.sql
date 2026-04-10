-- ============================================================
-- PHILOSIFY QUIZ - Batch 6: Final fill to 500+
-- 160 questions across all categories and difficulties
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES

-- ============================================================
-- DIFFICULTY 1 — More easy questions
-- ============================================================

('metaphysics', 1, 'What is the difference between mind and body?',
  '[{"text": "The mind thinks and experiences; the body is physical matter — how they relate is one of philosophy''s oldest questions", "correct": true}, {"text": "There is no difference"}, {"text": "The body does not exist"}, {"text": "The mind does not exist"}]',
  'The mind-body problem asks how mental phenomena (thoughts, feelings) relate to physical phenomena (brain activity, behavior). This has been debated from Descartes through contemporary neuroscience.',
  '{"1": "Most philosophers acknowledge some distinction between mental and physical phenomena.", "2": "Idealism denies physical reality, but this is a minority position.", "3": "Eliminative materialism denies mental states, but this too is controversial."}'),

('epistemology', 1, 'What is truth?',
  '[{"text": "A statement or belief that corresponds to the facts of reality", "correct": true}, {"text": "Whatever most people believe"}, {"text": "Whatever makes you feel good"}, {"text": "Whatever the government says"}]',
  'The correspondence theory of truth — that truth is agreement between thought and reality — is the most intuitive and widely held theory. Aristotle said: "To say of what is that it is, and of what is not that it is not, is true."',
  '{"1": "Truth is about reality, not popularity — the majority can be wrong.", "2": "Feelings are not a test of truth; comfortable beliefs can be false.", "3": "Government proclamations can be false; truth is independent of authority."}'),

('ethics', 1, 'What is right and wrong?',
  '[{"text": "Right actions promote human well-being and respect others; wrong actions cause unnecessary harm or violate rights", "correct": true}, {"text": "Whatever you feel like doing is right"}, {"text": "Right and wrong do not exist"}, {"text": "Only religious texts can determine right and wrong"}]',
  'While philosophers disagree on the foundations of morality (virtue, duty, consequences, rights), most agree that moral distinctions are real and that reason plays a central role in moral judgment.',
  '{"1": "Feelings can mislead; moral judgment requires reason.", "2": "Moral nihilism is a philosophical position, but most philosophers reject it.", "3": "Secular philosophical traditions have robust theories of right and wrong."}'),

('politics', 1, 'What is freedom?',
  '[{"text": "The condition of being able to act according to your own judgment without coercion by others", "correct": true}, {"text": "Having no responsibilities"}, {"text": "Doing whatever you want regardless of consequences"}, {"text": "Being alone"}]',
  'Political freedom means the absence of coercion — no one forces you to act against your judgment. It does not mean freedom from natural constraints, responsibilities, or the consequences of your choices.',
  '{"1": "Freedom includes the responsibility that comes with self-governance.", "2": "Freedom within a society requires respecting others'' freedom too.", "3": "Freedom is about self-determination, not isolation."}'),

('history', 1, 'Who is Confucius?',
  '[{"text": "An ancient Chinese philosopher who taught ethics, proper social relationships, and the importance of education and virtue", "correct": true}, {"text": "A Roman emperor"}, {"text": "A Greek mathematician"}, {"text": "A medieval knight"}]',
  'Confucius (551-479 BC) is the most influential philosopher in East Asian history. His teachings on ren (benevolence), li (ritual propriety), and filial piety shaped Chinese civilization for over 2,500 years.',
  '{"1": "Confucius was Chinese, not Roman.", "2": "Confucius was a moral philosopher, not a mathematician.", "3": "Confucius lived in ancient China, not medieval Europe."}'),

('virtues', 1, 'What is honesty?',
  '[{"text": "The virtue of being truthful and transparent, not deceiving others or oneself", "correct": true}, {"text": "Saying whatever people want to hear"}, {"text": "Being rude to everyone"}, {"text": "Keeping secrets from everyone"}]',
  'Honesty is valued across virtually all philosophical traditions. It involves telling the truth, keeping promises, and not manipulating others through deception.',
  '{"1": "Telling people what they want to hear is flattery, not honesty.", "2": "Honesty can be delivered with tact; rudeness is not required.", "3": "Some confidentiality is compatible with honesty; dishonesty involves active deception."}'),

('economics', 1, 'What is trade?',
  '[{"text": "The voluntary exchange of goods or services between people for mutual benefit", "correct": true}, {"text": "Taking things from others by force"}, {"text": "Giving everything away for free"}, {"text": "A type of weather pattern"}]',
  'Trade is the foundation of economic cooperation. When two people trade voluntarily, both benefit — otherwise they would not agree to the exchange. This insight is central to free-market economics.',
  '{"1": "Taking by force is theft or robbery, the opposite of trade.", "2": "Giving for free is charity; trade involves mutual exchange.", "3": "Trade is an economic concept, not meteorological."}'),

('law', 1, 'What is a constitution?',
  '[{"text": "The fundamental law of a nation that establishes the structure of government and protects individual rights", "correct": true}, {"text": "A person''s physical health"}, {"text": "A recipe book"}, {"text": "A type of exercise"}]',
  'A constitution is the supreme law that constrains government power. The U.S. Constitution (1787) was the first modern written constitution and has been a model for nations worldwide.',
  '{"1": "While ''constitution'' can refer to health, in political context it means fundamental law.", "2": "A constitution is a legal document, not a cookbook.", "3": "Constitutional in law means foundational, not related to exercise."}'),

('music', 1, 'What is a melody?',
  '[{"text": "A sequence of musical notes that forms a recognizable, memorable pattern", "correct": true}, {"text": "A type of fruit"}, {"text": "A form of government"}, {"text": "A mathematical formula"}]',
  'Melody is one of the most fundamental elements of music. From simple folk tunes to complex symphonic themes, melody gives music its identity and emotional power.',
  '{"1": "Melody is a musical concept, not botanical.", "2": "Melody is an element of music, not politics.", "3": "While music has mathematical properties, melody is a musical concept."}'),

('cinema', 1, 'What is a director''s role in filmmaking?',
  '[{"text": "The director guides the creative vision of a film — making decisions about acting, cinematography, editing, and storytelling", "correct": true}, {"text": "The director only handles finances"}, {"text": "The director writes the screenplay"}, {"text": "The director operates the camera"}]',
  'The director is the primary creative force behind a film. While producers handle finances and screenwriters create the script, the director shapes how the story is told visually and dramatically.',
  '{"1": "Financial management is the producer''s role.", "2": "The screenwriter writes the script; the director interprets it.", "3": "The cinematographer operates the camera; the director guides their work."}'),

('quotes', 1, 'Who said: "In the middle of difficulty lies opportunity"?',
  '[{"text": "Albert Einstein", "correct": true}, {"text": "Isaac Newton"}, {"text": "Charles Darwin"}, {"text": "Stephen Hawking"}]',
  'Einstein, though primarily a physicist, offered many philosophical insights. This quote reflects a stoic-like recognition that challenges often contain the seeds of growth and innovation.',
  '{"1": "Newton was known for scientific laws, not this particular quote.", "2": "Darwin focused on evolution, not motivational philosophy.", "3": "Hawking made cosmological insights but this quote is Einstein''s."}'),

('applied', 1, 'What is a thought experiment?',
  '[{"text": "An imaginary scenario used to test a philosophical or scientific idea without actually performing it", "correct": true}, {"text": "An experiment conducted in a laboratory"}, {"text": "A type of meditation"}, {"text": "A psychological test"}]',
  'Thought experiments have been essential to philosophy since Plato''s Cave and are still used today (trolley problem, Chinese room, experience machine). They test intuitions and reveal hidden assumptions.',
  '{"1": "Thought experiments are mental exercises, not laboratory procedures.", "2": "They are intellectual tools, not meditative practices.", "3": "They are philosophical methods, not standardized psychological assessments."}'),

('american_exceptionalism', 1, 'What makes America philosophically unique among nations?',
  '[{"text": "It was the first nation founded on explicit philosophical principles — individual rights, limited government, and the consent of the governed", "correct": true}, {"text": "It has the largest military"}, {"text": "It has the oldest civilization"}, {"text": "It has the most natural resources"}]',
  'Unlike nations formed by tribal, ethnic, or religious identity, America was founded on Enlightenment ideas about the nature of man and the proper role of government. The Declaration of Independence IS a philosophical document.',
  '{"1": "Military power is a consequence, not the philosophical foundation.", "2": "Many civilizations are far older; America''s uniqueness is philosophical, not temporal.", "3": "Resources do not define a nation''s philosophical character."}');

-- ============================================================
-- DIFFICULTY 2-3 — More foundation
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES

('metaphysics', 2, 'What is free will?',
  '[{"text": "The ability to make genuine choices that are not fully determined by prior causes", "correct": true}, {"text": "The freedom to do anything without consequences"}, {"text": "A legal document"}, {"text": "A type of inheritance"}]',
  'The free will debate asks whether humans genuinely choose their actions or whether everything is determined by prior causes (genes, environment, brain chemistry). This has enormous implications for moral responsibility.',
  '{"1": "Free will means the ability to choose, not freedom from consequences.", "2": "A ''last will'' is a legal document; free will is a philosophical concept.", "3": "A ''will'' in inheritance law is different from philosophical free will."}'),

('epistemology', 2, 'What is logic?',
  '[{"text": "The study of valid reasoning — the rules for distinguishing correct from incorrect arguments", "correct": true}, {"text": "A type of board game"}, {"text": "Advanced mathematics only"}, {"text": "A computer programming language"}]',
  'Logic, founded by Aristotle, provides the rules for valid inference. If the premises are true and the argument is valid, the conclusion must be true. It is the foundation of all rational inquiry.',
  '{"1": "Logic is a branch of philosophy and mathematics, not a game.", "2": "Logic is used in mathematics but is a broader field encompassing all reasoning.", "3": "While programming uses logic, logic as a discipline predates computers by 2,400 years."}'),

('ethics', 2, 'What is the difference between morality and legality?',
  '[{"text": "Morality concerns what is right and wrong; legality concerns what is permitted and prohibited by law — they often overlap but are not identical", "correct": true}, {"text": "They are exactly the same"}, {"text": "Morality is more important than legality always"}, {"text": "Legality is more important than morality always"}]',
  'Slavery was legal but immoral. Helping an escaped slave was illegal but moral. The distinction between moral and legal is essential — unjust laws can and should be challenged on moral grounds.',
  '{"1": "Legal and moral codes often diverge; what is legal is not always moral and vice versa.", "2": "While moral principles should inform law, there can be moral obligations to break unjust laws.", "3": "Legality without morality can produce tyranny."}'),

('politics', 2, 'What is a republic?',
  '[{"text": "A form of government where power is held by elected representatives who are bound by a constitution protecting individual rights", "correct": true}, {"text": "Another word for democracy"}, {"text": "Rule by a king"}, {"text": "A country with no government"}]',
  'A republic differs from a pure democracy in that individual rights are constitutionally protected even from majority rule. The American founders deliberately created a republic, not a direct democracy.',
  '{"1": "A republic has constitutional limits on majority rule that a pure democracy may lack.", "2": "A republic has elected officials, not a hereditary monarch.", "3": "A republic has a government — one that is constitutionally limited."}'),

('aesthetics', 2, 'Why do humans create art?',
  '[{"text": "To express, explore, and communicate ideas about the human experience — art fulfills a deep psychological need for meaning and beauty", "correct": true}, {"text": "Only for money"}, {"text": "Only because they are bored"}, {"text": "Art serves no purpose"}]',
  'Art appears in every human culture throughout history. Philosophers from Aristotle to Rand have argued that art serves fundamental cognitive and psychological needs — it makes abstract ideas concrete and experienceable.',
  '{"1": "Art predates money and exists in cultures without commerce.", "2": "Art expresses the deepest human concerns, not mere boredom.", "3": "Art serves profound cognitive, emotional, and social functions."}'),

('history', 2, 'Who was Aristotle?',
  '[{"text": "A Greek philosopher who studied logic, ethics, politics, biology, and metaphysics — often called the father of Western science", "correct": true}, {"text": "A Roman gladiator"}, {"text": "An Egyptian pharaoh"}, {"text": "A medieval alchemist"}]',
  'Aristotle (384-322 BC) studied under Plato, tutored Alexander the Great, and wrote on virtually every subject. His works on logic, ethics, politics, and natural philosophy dominated Western thought for two millennia.',
  '{"1": "Aristotle was a philosopher and teacher, not a warrior.", "2": "Aristotle was Greek, not Egyptian.", "3": "Aristotle lived in ancient Greece, over a thousand years before the medieval period."}'),

('virtues', 2, 'What is justice according to classical philosophy?',
  '[{"text": "Giving each person what they deserve based on objective standards of merit and rights", "correct": true}, {"text": "Treating everyone exactly the same regardless of actions"}, {"text": "Revenge against wrongdoers"}, {"text": "Whatever the judge feels like"}]',
  'Aristotle distinguished distributive justice (fair allocation based on merit) from corrective justice (rectifying wrongs). Both require objective standards, not arbitrary feelings or mechanical equality.',
  '{"1": "Justice may require treating different cases differently based on relevant factors.", "2": "Justice is about fair treatment, not revenge.", "3": "Justice requires objectivity, not judicial whim."}'),

('economics', 2, 'What is profit?',
  '[{"text": "The gain earned by producing value for others — the reward for successfully meeting people''s needs through voluntary exchange", "correct": true}, {"text": "Money stolen from workers"}, {"text": "A guaranteed right"}, {"text": "Only available to large corporations"}]',
  'Profit signals that a producer is creating more value than they consume. In a free market, profit comes from serving customers better than competitors. Loss signals failure to create value.',
  '{"1": "Profit in a free market comes from voluntary exchange, not exploitation.", "2": "Profit must be earned; it is never guaranteed.", "3": "Any business of any size can earn profit."}'),

('law', 2, 'What is due process?',
  '[{"text": "The legal requirement that the government must respect all rights owed to a person according to established procedures before depriving them of life, liberty, or property", "correct": true}, {"text": "A cooking process"}, {"text": "A manufacturing method"}, {"text": "A banking procedure"}]',
  'Due process is a constitutional guarantee that prevents arbitrary government action. It requires notice, a hearing, and an impartial tribunal before the government can take away a person''s rights.',
  '{"1": "Due process is a legal protection, not culinary.", "2": "It is a constitutional right, not an industrial method.", "3": "It is a fundamental right in criminal and civil law, not banking."}'),

('music', 2, 'What is harmony in music?',
  '[{"text": "The combination of simultaneously sounded musical notes to produce chords and progressions that create emotional depth", "correct": true}, {"text": "When everyone agrees"}, {"text": "A brand of shampoo"}, {"text": "A mathematical equation"}]',
  'Musical harmony — the vertical dimension of music — creates tension and resolution, consonance and dissonance. It gives music much of its emotional power and philosophical expressiveness.',
  '{"1": "While social harmony involves agreement, musical harmony is about simultaneous pitches.", "2": "Harmony is a fundamental musical concept, not a commercial product.", "3": "While harmony has mathematical properties, it is a musical concept."}'),

('cinema', 2, 'What is a narrative in film?',
  '[{"text": "The story being told — including characters, plot, conflict, and resolution — through which philosophical themes can be explored", "correct": true}, {"text": "The credits at the end"}, {"text": "The film''s budget"}, {"text": "The cinema building itself"}]',
  'Film narrative is the vehicle through which philosophical ideas are dramatized. Great films explore questions about identity, morality, freedom, death, and meaning through compelling stories.',
  '{"1": "Credits list the production team, not the narrative.", "2": "Budget is a production concern, not the story.", "3": "The cinema is the venue; narrative is the content."}'),

('quotes', 2, 'Who said: "Know thyself"?',
  '[{"text": "Inscription at the Temple of Apollo at Delphi, embraced by Socrates", "correct": true}, {"text": "Shakespeare"}, {"text": "Confucius"}, {"text": "Buddha"}]',
  'This ancient Greek maxim was inscribed at the Temple of Apollo at Delphi and became central to Socratic philosophy. Socrates made self-examination the foundation of the philosophical life.',
  '{"1": "Shakespeare quoted many ancient ideas but this precedes him by 2,000 years.", "2": "Confucius had similar ideas about self-cultivation but this specific phrase is Greek.", "3": "Buddhism emphasizes self-knowledge differently; this is the Greek formulation."}'),

('applied', 2, 'What is an ethical dilemma in technology?',
  '[{"text": "A situation where technological capability creates a conflict between competing moral values — like privacy vs. security in surveillance", "correct": true}, {"text": "A broken computer"}, {"text": "A software bug"}, {"text": "Running out of battery"}]',
  'Technology creates new ethical dilemmas: Should self-driving cars prioritize passengers or pedestrians? Should governments monitor communications to prevent terrorism? These require philosophical reasoning, not just technical solutions.',
  '{"1": "Ethical dilemmas are about values, not hardware failures.", "2": "Software bugs are technical problems; ethical dilemmas are moral problems.", "3": "Power supply is a practical issue, not an ethical one."}'),

('american_exceptionalism', 2, 'Why did the founders separate church and state?',
  '[{"text": "To protect both religious freedom and political liberty — preventing any religion from using government force and preventing government from dictating belief", "correct": true}, {"text": "Because they were all atheists"}, {"text": "To punish churches"}, {"text": "It was an accident"}]',
  'The Establishment Clause and Free Exercise Clause of the First Amendment reflect the philosophical insight that freedom of conscience requires keeping government out of religion and religion out of government.',
  '{"1": "Many founders were religious; they separated church and state to protect religion FROM government.", "2": "The separation protects churches by keeping government out of religious affairs.", "3": "It was a deliberate philosophical choice based on centuries of religious persecution in Europe."}');

-- ============================================================
-- DIFFICULTY 3-4 — More intermediate
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES

('metaphysics', 3, 'What is materialism in philosophy?',
  '[{"text": "The view that everything that exists is physical matter and its interactions — there is no separate mental or spiritual substance", "correct": true}, {"text": "The love of material possessions"}, {"text": "A theory about building materials"}, {"text": "A fashion philosophy"}]',
  'Philosophical materialism (or physicalism) holds that all phenomena, including consciousness, are ultimately reducible to physical processes. This contrasts with dualism (mind and body are separate) and idealism (only mind exists).',
  '{"1": "Philosophical materialism is about the nature of reality, not consumerism.", "2": "It concerns the fundamental nature of existence, not construction.", "3": "It is a metaphysical position, not related to fashion."}'),

('epistemology', 3, 'What is Occam''s Razor?',
  '[{"text": "The principle that the simplest explanation consistent with the evidence should be preferred over more complex ones", "correct": true}, {"text": "A type of shaving tool"}, {"text": "A surgical instrument"}, {"text": "A criticism of bearded philosophers"}]',
  'Named after William of Ockham (14th century), this principle guides both philosophical and scientific reasoning: do not multiply entities beyond necessity. If two theories explain the same evidence, prefer the simpler one.',
  '{"1": "It is a principle of reasoning, not a grooming tool.", "2": "It is a philosophical principle, not a medical instrument.", "3": "It has nothing to do with facial hair."}'),

('ethics', 3, 'What is moral relativism?',
  '[{"text": "The view that moral judgments are not universally valid but vary by culture, time period, or individual — there are no objective moral truths", "correct": true}, {"text": "The study of morality among relatives"}, {"text": "Einstein''s theory applied to ethics"}, {"text": "A type of moral absolutism"}]',
  'Moral relativism challenges the idea of universal right and wrong. Critics argue it leads to contradictions: if all moralities are equally valid, one cannot condemn slavery, genocide, or any practice sanctioned by a culture.',
  '{"1": "It concerns moral standards, not family relationships.", "2": "Einstein''s relativity is physics; moral relativism is ethics — they are unrelated.", "3": "Moral relativism is the opposite of moral absolutism."}'),

('politics', 3, 'What is the difference between a right and a privilege?',
  '[{"text": "Rights are inherent and cannot be legitimately taken away; privileges are granted by authority and can be revoked", "correct": true}, {"text": "They are the same thing"}, {"text": "Privileges are more important"}, {"text": "Rights only exist in democracies"}]',
  'A right to free speech cannot be legitimately revoked. A privilege to drive on public roads can be revoked for cause. Confusing rights with privileges allows governments to treat fundamental freedoms as revocable permissions.',
  '{"1": "Rights and privileges have fundamentally different philosophical bases.", "2": "Rights are foundational; privileges are conditional.", "3": "Natural rights theory holds that rights exist regardless of political system."}'),

('aesthetics', 3, 'What is the difference between realism and abstraction in art?',
  '[{"text": "Realism depicts the world as recognizably real; abstraction uses form, color, and line without representing recognizable objects", "correct": true}, {"text": "Realism is old; abstraction is new"}, {"text": "Realism is better than abstraction"}, {"text": "They are the same"}]',
  'These represent fundamentally different artistic philosophies. Realism (Courbet, Vermeer) aims to show the world as it appears. Abstraction (Kandinsky, Mondrian) seeks meaning through pure form. Both can achieve philosophical depth.',
  '{"1": "Both traditions span centuries; ancient art included abstract elements.", "2": "Quality depends on the individual work, not the approach.", "3": "They represent genuinely different artistic strategies."}'),

('history', 3, 'What was the significance of Gutenberg''s printing press for philosophy?',
  '[{"text": "It democratized knowledge by making books affordable, enabling the Reformation, the Scientific Revolution, and the Enlightenment", "correct": true}, {"text": "It had no effect on philosophy"}, {"text": "It was only used for religious texts"}, {"text": "It was invented in China and Gutenberg stole it"}]',
  'The printing press (c. 1440) broke the monopoly on knowledge held by the Church and universities. Ideas could spread rapidly, enabling Luther''s Reformation, Galileo''s science, and the entire Enlightenment project.',
  '{"1": "The printing press was one of the most transformative technologies in intellectual history.", "2": "It was used for all types of texts, rapidly spreading secular philosophy.", "3": "While Chinese printing existed earlier, Gutenberg independently developed movable type for European languages."}'),

('virtues', 3, 'What is prudence?',
  '[{"text": "The virtue of practical wisdom — the ability to discern the right course of action in specific circumstances through careful judgment", "correct": true}, {"text": "Being overly cautious about everything"}, {"text": "A type of insurance"}, {"text": "Being prudish"}]',
  'Prudence (phronesis in Greek, prudentia in Latin) is the intellectual virtue that guides moral action. It involves deliberation, good judgment about particulars, and the ability to act well in complex situations.',
  '{"1": "Prudence is about wise action, not timidity or excessive caution.", "2": "Prudential relates to wisdom in practical affairs, not insurance products.", "3": "Prudence and prudishness are different concepts entirely."}'),

('economics', 3, 'What are property rights and why do they matter philosophically?',
  '[{"text": "The right to acquire, use, and dispose of property — they are the foundation of economic freedom and a precondition for individual liberty", "correct": true}, {"text": "The right to own only land"}, {"text": "A modern invention with no philosophical basis"}, {"text": "Only relevant to wealthy people"}]',
  'Locke argued that property rights arise from mixing one''s labor with nature. Without property rights, individuals cannot sustain their lives, plan for the future, or be free from dependence on others or the state.',
  '{"1": "Property rights encompass all forms of property — intellectual, physical, financial.", "2": "Property rights have been discussed since Aristotle and are central to political philosophy.", "3": "Property rights protect all individuals, regardless of wealth."}'),

('law', 3, 'What is the difference between criminal law and civil law?',
  '[{"text": "Criminal law punishes offenses against society (murder, theft); civil law resolves disputes between private parties (contracts, property)", "correct": true}, {"text": "Criminal law is more important"}, {"text": "Civil law only exists in France"}, {"text": "They are the same thing"}]',
  'Criminal law protects society from harmful acts through punishment. Civil law provides mechanisms for resolving private disputes and compensating wrongs. Both are essential to a functioning legal system.',
  '{"1": "Both are equally important aspects of the legal system.", "2": "Civil law exists in all legal systems; ''civil law system'' (as opposed to common law) is a separate concept.", "3": "They serve different but complementary functions."}'),

('music', 3, 'Why did Nietzsche call music ''the most metaphysical of arts''?',
  '[{"text": "Because music expresses the deepest emotional and existential truths directly, without the mediation of concepts, words, or visual images", "correct": true}, {"text": "Because musicians are philosophers"}, {"text": "Because music is physically impossible"}, {"text": "Because Nietzsche was a professional musician"}]',
  'Following Schopenhauer, Nietzsche believed music bypasses rational thought to express the primal forces of existence — the Dionysian energy of life itself. His first book, "The Birth of Tragedy," was centrally about music.',
  '{"1": "Not all musicians are philosophers, but music as an art form engages deep truths.", "2": "Music is physically real — it is sound waves that evoke profound responses.", "3": "Nietzsche was an amateur pianist and composer, but primarily a philosopher."}'),

('cinema', 3, 'What philosophical themes does "The Shawshank Redemption" explore?',
  '[{"text": "Hope, freedom, institutional corruption, the resilience of the human spirit, and whether people can be rehabilitated", "correct": true}, {"text": "Space exploration"}, {"text": "Cooking competitions"}, {"text": "Athletic training"}]',
  'The film explores whether hope is rational in hopeless situations, whether institutions dehumanize people, and whether freedom is an internal state or an external condition — themes central to existentialism and political philosophy.',
  '{"1": "The film is set in a prison, not space.", "2": "It explores human freedom and dignity, not culinary arts.", "3": "While perseverance is a theme, it is not about athletics."}'),

('quotes', 3, 'Who said: "Injustice anywhere is a threat to justice everywhere"?',
  '[{"text": "Martin Luther King Jr.", "correct": true}, {"text": "Nelson Mandela"}, {"text": "Mahatma Gandhi"}, {"text": "Abraham Lincoln"}]',
  'King wrote this in his "Letter from Birmingham Jail" (1963), arguing that justice is indivisible. He drew on natural law philosophy to argue that unjust laws are not truly laws and that civil disobedience against them is morally obligatory.',
  '{"1": "Mandela fought injustice but this specific quote is King''s.", "2": "Gandhi inspired King but this line is from the Birmingham Jail letter.", "3": "Lincoln preceded the civil rights movement by a century."}'),

('applied', 3, 'What is the philosophical debate about capital punishment?',
  '[{"text": "Whether the state has the moral right to take a life as punishment — balancing justice, deterrence, and the possibility of executing innocent people", "correct": true}, {"text": "Whether capital cities should be punished"}, {"text": "A debate about capitalism"}, {"text": "A financial penalty"}]',
  'Retributivists argue some crimes deserve death. Abolitionists argue the state should never kill. The risk of executing innocent people, racial bias in sentencing, and whether punishment deters crime are central to the debate.',
  '{"1": "Capital punishment concerns the death penalty, not capital cities.", "2": "Capital punishment is about criminal justice, not economic systems.", "3": "Capital punishment is execution, not a fine."}'),

('american_exceptionalism', 3, 'What is the philosophical meaning of "pursuit of happiness" in the Declaration?',
  '[{"text": "The right to pursue one''s own conception of a good life through productive effort — not a guarantee of happiness but the freedom to seek it", "correct": true}, {"text": "The government must make everyone happy"}, {"text": "Happiness means pleasure only"}, {"text": "It was a mistake in the text"}]',
  'Jefferson replaced Locke''s "property" with "pursuit of happiness," broadening the concept. It means the right to live according to your own judgment — to choose your work, values, relationships, and life''s direction.',
  '{"1": "The right is to PURSUE happiness, not to have it delivered by government.", "2": "Happiness in this context means human flourishing, not mere pleasure.", "3": "It was a deliberate philosophical choice that broadened Locke''s formulation."}');

-- ============================================================
-- DIFFICULTY 5-6 — More advanced
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES

('metaphysics', 5, 'What is emergence and why does it challenge reductionism?',
  '[{"text": "Emergence is when complex systems exhibit properties not present in their individual parts — consciousness from neurons, life from chemistry — suggesting reality has irreducible layers", "correct": true}, {"text": "Emergence is a medical emergency"}, {"text": "It means something appearing from water"}, {"text": "A type of tree growth"}]',
  'The emergence debate asks: are higher-level properties (consciousness, life, social order) fully explained by lower-level components, or are they genuinely novel? This has implications for free will, consciousness, and the unity of science.',
  '{"1": "Emergence is a philosophical concept, not a medical term.", "2": "Philosophical emergence concerns the arising of novel properties from complex systems.", "3": "It is about the structure of reality, not botany."}'),

('epistemology', 5, 'What is the difference between foundationalism and coherentism?',
  '[{"text": "Foundationalism says knowledge rests on basic self-evident beliefs; coherentism says beliefs are justified by their coherence with other beliefs in a web", "correct": true}, {"text": "Foundationalism is about building foundations; coherentism is about being coherent"}, {"text": "They are the same theory"}, {"text": "Neither is a serious philosophical position"}]',
  'Foundationalism (Descartes, empiricists) seeks bedrock certainty. Coherentism (Quine, Davidson) rejects foundations in favor of a holistic web where beliefs support each other. The debate shapes how we understand the structure of knowledge.',
  '{"1": "These are metaphorical names for philosophical positions about the structure of justification.", "2": "They represent fundamentally different answers to the regress problem.", "3": "Both are major positions defended by serious philosophers."}'),

('ethics', 5, 'What is the "fact-value distinction" and why do some philosophers reject it?',
  '[{"text": "The claim that factual statements and value statements are fundamentally different in kind — rejected by those who argue that values can be objective and grounded in facts about human nature", "correct": true}, {"text": "The difference between facts and opinions"}, {"text": "A legal distinction"}, {"text": "A scientific method"}]',
  'Hume argued you cannot derive "ought" from "is." But philosophers like Philippa Foot, Ayn Rand, and contemporary natural law theorists argue that facts about human nature ground objective values — life, health, and flourishing are objectively good.',
  '{"1": "The fact-value distinction is deeper than the everyday facts/opinions distinction.", "2": "It is a philosophical distinction, not a legal one specifically.", "3": "It concerns the foundations of ethics, not scientific procedure."}'),

('politics', 5, 'What is the difference between constitutionalism and majoritarianism?',
  '[{"text": "Constitutionalism limits government power through fundamental law that even majorities cannot override; majoritarianism holds that the majority will should prevail without constraint", "correct": true}, {"text": "They are the same"}, {"text": "Constitutionalism is outdated"}, {"text": "Majoritarianism protects minorities better"}]',
  'The American founders chose constitutionalism precisely because they feared majoritarian tyranny. The Bill of Rights explicitly protects individual freedoms FROM democratic majorities.',
  '{"1": "They represent fundamentally different theories of political legitimacy.", "2": "Constitutionalism remains the basis of every liberal democracy.", "3": "Unconstrained majoritarianism can oppress minorities; constitutionalism exists to prevent this."}'),

('history', 5, 'What was the philosophical significance of Darwin''s theory of evolution?',
  '[{"text": "It provided a naturalistic explanation for biological complexity without design, challenging teleological arguments and forcing philosophy to reconsider the place of humans in nature", "correct": true}, {"text": "It had no philosophical implications"}, {"text": "It proved that God does not exist"}, {"text": "It only affected biology"}]',
  'Darwin''s theory challenged the argument from design, raised questions about human nature and moral status, influenced social philosophy (for better and worse), and forced a rethinking of teleology, purpose, and meaning.',
  '{"1": "Evolution had enormous philosophical implications across ethics, metaphysics, and epistemology.", "2": "Evolution does not logically prove or disprove God; it explains biological diversity naturalistically.", "3": "Its implications extended far beyond biology into ethics, politics, and philosophy of mind."}'),

('virtues', 5, 'What is the relationship between virtue and habit in Aristotle?',
  '[{"text": "Virtue is formed through habit (repeated action) but transcends mere habit because it requires practical wisdom — knowing why and when to act, not just performing actions mechanically", "correct": true}, {"text": "Virtue and habit are identical"}, {"text": "Aristotle rejected the role of habit in virtue"}, {"text": "Habit undermines virtue"}]',
  'Aristotle said we become virtuous by doing virtuous acts, just as we become skilled by practicing. But the virtuous person acts from knowledge and choice, not mere repetition — habit forms the disposition, but wisdom guides its application.',
  '{"1": "Habit is necessary but not sufficient; practical wisdom (phronesis) elevates habit to virtue.", "2": "Aristotle explicitly argued that habit is essential to virtue formation.", "3": "Good habits support virtue; Aristotle saw them as the training ground for character."}'),

('economics', 5, 'What is the subjective theory of value?',
  '[{"text": "The value of a good is determined by individual preferences and marginal utility, not by the labor required to produce it", "correct": true}, {"text": "That all values are relative and nothing has real worth"}, {"text": "A psychological theory about self-esteem"}, {"text": "A theory about art valuation"}]',
  'The marginal revolution (Menger, Jevons, Walras) showed that value is determined by how much satisfaction the next unit provides to a specific person in specific circumstances — not by intrinsic properties or labor costs.',
  '{"1": "Subjective value theory does not deny that goods have real worth; it explains how that worth is determined.", "2": "It is an economic theory about prices and exchange, not psychology.", "3": "It applies to all goods and services, not just art."}'),

('law', 5, 'What is stare decisis and why is it philosophically important?',
  '[{"text": "The principle that courts should follow precedent — it provides predictability and consistency but can perpetuate past errors", "correct": true}, {"text": "A Latin greeting"}, {"text": "A courtroom seating arrangement"}, {"text": "A type of legal document"}]',
  'Stare decisis ("to stand by things decided") creates a tension: consistency and predictability vs. the ability to correct past mistakes. How much should precedent constrain future judges? This is a deep question about the nature of law.',
  '{"1": "It is a legal principle, not a greeting.", "2": "It concerns how courts use past decisions, not physical arrangements.", "3": "It is a principle about legal reasoning, not a document type."}'),

('music', 5, 'What is the philosophical significance of jazz improvisation?',
  '[{"text": "Jazz improvisation embodies spontaneous creative freedom within a structured framework — paralleling philosophical concepts of freedom within order and the nature of authentic self-expression", "correct": true}, {"text": "Jazz has no philosophical significance"}, {"text": "Improvisation means playing random notes"}, {"text": "Jazz is only entertainment"}]',
  'Jazz improvisation requires deep knowledge of harmony, rhythm, and tradition — then the freedom to create something new in the moment. It mirrors philosophical questions about creativity, authenticity, freedom, and the relationship between structure and spontaneity.',
  '{"1": "Jazz has been analyzed by philosophers including Adorno, Cornel West, and many others.", "2": "Improvisation is structured creativity, not randomness — it requires mastery of the form.", "3": "Jazz raises profound questions about individual expression, cultural identity, and artistic freedom."}'),

('cinema', 5, 'What is the philosophical significance of the "unreliable narrator" device in film?',
  '[{"text": "It forces viewers to question how we construct truth from partial, biased perspectives — raising epistemological questions about the nature of narrative and knowledge", "correct": true}, {"text": "It means the film is poorly made"}, {"text": "It only applies to horror films"}, {"text": "The narrator has a speech impediment"}]',
  'Films like "Rashomon," "Memento," "Fight Club," and "Gone Girl" use unreliable narration to demonstrate that our understanding of events is always mediated by perspective, memory, and bias — a cinematic exploration of epistemological uncertainty.',
  '{"1": "Unreliable narration is a deliberate artistic and philosophical technique.", "2": "It is used across all genres — drama, thriller, comedy, science fiction.", "3": "Unreliability refers to the truthfulness of the narration, not speech quality."}');

-- ============================================================
-- DIFFICULTY 7-8 — More expert
-- ============================================================

INSERT INTO quiz_questions (category, difficulty, question, options, explanation, wrong_explanations) VALUES

('metaphysics', 7, 'What is the "Chinese Room" argument and what does it challenge?',
  '[{"text": "John Searle argued that a program manipulating symbols according to rules cannot understand Chinese — challenging the claim that computation equals consciousness", "correct": true}, {"text": "An argument about Chinese architecture"}, {"text": "A diplomatic negotiation technique"}, {"text": "A type of escape room puzzle"}]',
  'Searle imagined himself in a room following English instructions to manipulate Chinese characters. He produces correct Chinese responses without understanding Chinese — proving that syntax (computation) is not sufficient for semantics (understanding).',
  '{"1": "The Chinese Room is a thought experiment about AI and consciousness, not architecture.", "2": "It concerns philosophy of mind, not diplomacy.", "3": "It is a philosophical argument, not an entertainment concept."}'),

('epistemology', 7, 'What is the paradox of the preface?',
  '[{"text": "An author who justifiably believes each statement in their book is true, yet also reasonably believes the book contains some errors — showing that justified beliefs can be collectively inconsistent", "correct": true}, {"text": "A paradox about book introductions"}, {"text": "A problem with publishing contracts"}, {"text": "A difficulty in writing forewords"}]',
  'David Makinson''s paradox shows that rationality does not require logical consistency across all beliefs. You can justifiably believe each claim while also justifiably believing you''ve made at least one mistake somewhere.',
  '{"1": "The ''preface'' refers to an author''s acknowledgment of fallibility, not the physical preface section.", "2": "It is a philosophical paradox, not a legal issue.", "3": "It concerns the logic of belief, not writing craft."}'),

('ethics', 8, 'What is the "trolley problem" variant known as the "fat man" case and why does it produce different intuitions?',
  '[{"text": "Pushing a fat man off a bridge to stop a trolley feels more wrong than pulling a lever, even though both save five lives — revealing that we distinguish between using someone as a means and redirecting a threat", "correct": true}, {"text": "A problem about obesity"}, {"text": "A weight-lifting challenge"}, {"text": "A dietary recommendation"}]',
  'Judith Jarvis Thomson and others noted that people who pull the lever (redirecting harm) often refuse to push the man (using someone as a tool). This asymmetry supports Kantian ethics over pure consequentialism — we intuitively treat persons as ends.',
  '{"1": "The ''fat man'' label refers to the thought experiment''s setup, not a commentary on weight.", "2": "It is a philosophical thought experiment, not a physical challenge.", "3": "It concerns moral intuitions, not health advice."}'),

('politics', 8, 'What is the "paradox of tolerance" identified by Karl Popper?',
  '[{"text": "If a society is tolerant without limit, its ability to be tolerant will eventually be destroyed by the intolerant — therefore, tolerance must not extend to those who seek to destroy tolerance itself", "correct": true}, {"text": "That tolerant people are always paradoxical"}, {"text": "That tolerance is always wrong"}, {"text": "That intolerance is always justified"}]',
  'Popper argued in "The Open Society and Its Enemies" that unlimited tolerance leads to the disappearance of tolerance. A tolerant society must be intolerant of intolerance to survive — but this creates a difficult boundary problem.',
  '{"1": "The paradox is about the limits of tolerance, not about tolerant individuals being paradoxical.", "2": "Popper defended tolerance; he identified a specific logical problem with unlimited tolerance.", "3": "Popper did not justify general intolerance; he argued for a specific exception."}'),

('aesthetics', 8, 'What is the relationship between form and content in the philosophy of art?',
  '[{"text": "Form (how something is expressed — structure, style, technique) and content (what is expressed — ideas, emotions, themes) are inseparable — the same content in different form becomes different art", "correct": true}, {"text": "Form is always more important than content"}, {"text": "Content is always more important than form"}, {"text": "Form and content are unrelated"}]',
  'The form-content relationship is central to aesthetics. Hegel argued they are dialectically unified. A sonnet about love and a novel about love express different truths because the form shapes what can be said. You cannot extract the ''meaning'' from its artistic form.',
  '{"1": "Most philosophers argue neither is simply more important; they are interdependent.", "2": "Form and content need each other; pure content without form is not art.", "3": "They are deeply intertwined — changing the form changes the content."}'),

('virtues', 8, 'What is the difference between Aristotelian magnanimity and Christian humility?',
  '[{"text": "Aristotle''s magnanimous man knows his own worth and claims the honor he deserves; Christian humility demands self-effacement before God — they represent fundamentally opposed views of proper self-regard", "correct": true}, {"text": "They are the same virtue"}, {"text": "Aristotle valued humility"}, {"text": "Christianity values self-assertion"}]',
  'This contrast reveals a deep tension in Western ethics. Aristotle saw proper pride as a crown virtue. Christianity saw humility as essential. Nietzsche used this contrast to critique Christian morality as life-denying.',
  '{"1": "They represent fundamentally different and competing moral ideals.", "2": "Aristotle listed humility-like behavior as a deficiency, not a virtue.", "3": "Mainstream Christian ethics considers pride a deadly sin."}'),

('economics', 8, 'What is the difference between Say''s Law and Keynesian economics?',
  '[{"text": "Say''s Law holds that production creates its own demand (supply creates demand); Keynes argued demand can be deficient, causing recessions that require government intervention", "correct": true}, {"text": "They agree on everything"}, {"text": "Say was a Keynesian"}, {"text": "Keynes supported laissez-faire"}]',
  'This debate is foundational to macroeconomics. Say''s Law implies markets self-correct; Keynes argued that aggregate demand can fall short, trapping economies in recession. The philosophical question: can voluntary exchange alone produce prosperity?',
  '{"1": "They represent opposing views on the self-correcting nature of markets.", "2": "Say preceded Keynes by over a century; Keynes specifically criticized Say''s Law.", "3": "Keynes advocated government intervention, the opposite of laissez-faire."}'),

('law', 8, 'What is Ronald Dworkin''s concept of "law as integrity"?',
  '[{"text": "Judges should interpret law as if it were written by a single author pursuing a coherent vision of justice — fitting new decisions into the best moral reading of the legal tradition as a whole", "correct": true}, {"text": "Law should be integrated with other subjects"}, {"text": "Only honest people can be judges"}, {"text": "Law should never change"}]',
  'Dworkin''s "law as integrity" demands that judges treat the legal system as expressing a coherent set of principles. In hard cases, they must find the interpretation that best fits existing law AND presents it in its best moral light.',
  '{"1": "''Integrity'' here means coherent moral vision, not interdisciplinary integration.", "2": "It is about interpretive methodology, not judicial character.", "3": "Law as integrity allows law to develop; it requires consistency, not stasis."}');
